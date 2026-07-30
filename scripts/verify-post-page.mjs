/**
 * End-to-end check for in-body post images on the real article route.
 *
 * Creates a published throwaway post (no series, so no follower notifications),
 * screenshots /blog/<slug> at desktop + mobile, asserts the layout, then deletes
 * the post again.
 *
 *   node scripts/verify-post-page.mjs
 *   BASE=https://nerosiegfried.com TAG=prod node scripts/verify-post-page.mjs
 *
 * The post lifecycle runs over plain HTTP with the admin cookie, deliberately
 * NOT through the browser: a puppeteer failure must never strand a published
 * test post on a live blog.
 */
import puppeteer from "puppeteer"
import { readFileSync, mkdirSync } from "fs"

const env = {}
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}

const BASE = process.env.BASE ?? "http://localhost:3000"
const TAG = process.env.TAG ?? "local"
const OUT = new URL("../.image-verify/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

// Deliberately site-relative /public assets, NOT CloudFront URLs. Deleting a
// post runs deleteImages() over every CloudFront URL in its body, so seeding the
// throwaway post with real bucket objects would delete images belonging to live
// posts. extractKey() ignores non-CDN URLs, so these are inert.
const A = "/projects/1-macbook-md.jpg"
const B = "/projects/1-ipad-md.jpg"

const SLUG = "zz-image-render-check"
const CONTENT = [
  "Body copy above the first image, so the vertical rhythm is visible.",
  "",
  `![A plain image](${A})`,
  "",
  `![Captioned image](${A} "A caption sits under the frame, in mono.")`,
  "",
  `![Full-width image|wide](${B} "The wide flag fills the whole reading column.")`,
  "",
  `![Left](${A}) ![Right](${B} "Two on one line become a pair.")`,
  "",
  "Body copy below, to confirm the flow resumes at the reading measure.",
].join("\n")

// ── Admin session over plain HTTP ────────────────────────────────────────────
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: env.BLOG_ADMIN_EMAIL, password: env.BLOG_ADMIN_PASSWORD }),
})
if (!loginRes.ok) throw new Error(`login failed: ${loginRes.status} ${await loginRes.text()}`)
const cookie = loginRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ")
if (!cookie) throw new Error("login returned no session cookie")
console.log("authenticated as admin")

const api = (path, init = {}) =>
  fetch(`${BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", cookie, ...init.headers } })

let postId = null
const cleanup = async () => {
  if (!postId) return
  const r = await api(`/api/admin/posts/${postId}`, { method: "DELETE" })
  console.log(`deleted post ${postId} → ${r.status}`)
  const gone = await fetch(`${BASE}/blog/${SLUG}`, { redirect: "manual" })
  console.log(`GET /blog/${SLUG} after delete → ${gone.status}`)
  postId = null
}
process.on("SIGINT", async () => { await cleanup(); process.exit(130) })

let browser
try {
  const createRes = await api("/api/admin/posts", {
    method: "POST",
    body: JSON.stringify({
      title: "Image render check",
      slug: SLUG,
      excerpt: "Temporary post used to verify in-body image rendering.",
      content: CONTENT,
      coverImage: null,
      seriesId: null,          // no series → no follower notifications
      status: "published",
    }),
  })
  if (!createRes.ok) throw new Error(`create failed: ${createRes.status} ${await createRes.text()}`)
  postId = (await createRes.json()).post.id
  console.log("created post", postId, `→ ${BASE}/blog/${SLUG}`)

  // ── Render it ──────────────────────────────────────────────────────────────
  browser = await puppeteer.launch({ headless: "new", protocolTimeout: 180000 })
  const errors = []

  const capture = async (label, viewport) => {
    const page = await browser.newPage()
    page.on("console", (m) => { if (m.type() === "error") errors.push(`[${label}] ${m.text()}`) })
    page.on("pageerror", (e) => errors.push(`[${label}] ${e}`))
    page.on("requestfailed", (r) => {
      const t = r.failure()?.errorText
      if (t !== "net::ERR_ABORTED") errors.push(`[${label}] REQFAIL ${r.url().slice(0, 80)} ${t}`)
    })
    await page.setViewport(viewport)
    await page.goto(`${BASE}/blog/${SLUG}`, { waitUntil: "domcontentloaded", timeout: 120000 })
    await page.waitForSelector(".post-figure img", { timeout: 60000 })

    // Images are lazy: step down the page so each figure enters the viewport,
    // then wait for them all to decode before measuring or screenshotting.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 200))
      }
      window.scrollTo(0, 0)
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
    })

    const stats = await page.evaluate(() => {
      const col = document.querySelector(".post-body--column")
      const para = document.querySelector(".post-body--column > .prose > p")
      return {
        columnWidth: Math.round(col?.getBoundingClientRect().width ?? -1),
        paragraphWidth: Math.round(para?.getBoundingClientRect().width ?? -1),
        pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        rows: [...document.querySelectorAll(".post-figure-row")].map((r) => ({
          variant: r.className.replace("post-figure-row", "").trim() || "(default)",
          width: Math.round(r.getBoundingClientRect().width),
          gridColumns: getComputedStyle(r).gridTemplateColumns,
          figures: [...r.querySelectorAll(".post-figure")].map((f) => {
            const img = f.querySelector("img")
            const box = img.getBoundingClientRect()
            return {
              alt: img.getAttribute("alt"),
              loaded: img.naturalWidth > 0,
              rendered: `${Math.round(box.width)}x${Math.round(box.height)}`,
              caption: f.querySelector("figcaption")?.textContent ?? null,
              insideParagraph: !!f.closest("p"),
            }
          }),
        })),
      }
    })
    console.log(`\n── ${TAG} · ${label} ──`)
    console.log(JSON.stringify(stats, null, 2))
    await page.screenshot({ path: `${OUT}post-${TAG}-${label}.png`, fullPage: true })
    await page.close()
    return stats
  }

  await capture("desktop", { width: 1440, height: 1000, deviceScaleFactor: 1 })
  await capture("mobile", { width: 390, height: 844, deviceScaleFactor: 2 })

  console.log("\nconsole/network errors:", errors.length ? errors : "none")
} finally {
  if (browser) await browser.close().catch(() => {})
  await cleanup()
}
