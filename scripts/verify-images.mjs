/**
 * Local verification for in-body post images.
 * Logs into the admin dashboard, types image markdown into a notebook cell and
 * screenshots the live preview + the full-post preview at several viewports.
 * Read-only: nothing is saved to the database.
 *
 *   node scripts/verify-images.mjs
 */
import puppeteer from "puppeteer"
import { readFileSync, mkdirSync } from "fs"

const env = {}
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}

const BASE = process.env.BASE ?? "http://localhost:3000"
const OUT = new URL("../.image-verify/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

// A real object already in the bucket (the `computer-systems` cover image), so
// the test also proves CloudFront delivery and the img-src CSP directive.
const SAMPLE = `https://${env.AWS_CLOUDFRONT_DOMAIN}/uploads/comments/855f3131-fa2b-4ec3-9fb9-cee105ad2b6c.jpg`
const SAMPLE_2 = `https://${env.AWS_CLOUDFRONT_DOMAIN}/uploads/comments/2268c3ee-4314-49ff-95a7-1565ac34b61e.jpg`

const MARKDOWN = [
  "## Images in a post",
  "",
  `![A plain image](${SAMPLE})`,
  "",
  `![Captioned image](${SAMPLE} "Studio Display and MacBook, side by side.")`,
  "",
  `![Full-width image|wide](${SAMPLE} "This one breaks out to the whole reading column.")`,
  "",
  `![Left half](${SAMPLE}) ![Right half](${SAMPLE_2} "A side-by-side pair.")`,
  "",
  "Ordinary paragraph after the images, to check the rhythm.",
].join("\n")

const browser = await puppeteer.launch({ headless: "new" })
const page = await browser.newPage()
const errors = []
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
page.on("pageerror", (e) => errors.push(String(e)))

await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })

// ── Log in ───────────────────────────────────────────────────────────────────
await page.goto(`${BASE}${env.ADMIN_ENTRY_PATH}`, { waitUntil: "domcontentloaded", timeout: 120000 })
const auth = await page.evaluate(async (creds) => {
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds),
  })
  return { status: r.status, body: await r.text() }
}, { email: env.BLOG_ADMIN_EMAIL, password: env.BLOG_ADMIN_PASSWORD })
if (auth.status !== 200) throw new Error(`login failed: ${auth.status} ${auth.body}`)
await page.goto(`${BASE}${env.ADMIN_ENTRY_PATH}/dashboard`, { waitUntil: "domcontentloaded", timeout: 120000 })
console.log("logged in →", page.url())

// ── Type the markdown into the first notebook cell ───────────────────────────
await page.waitForSelector("textarea[placeholder^='# Start writing']")
await page.click("textarea[placeholder^='# Start writing']")
await page.keyboard.type(MARKDOWN, { delay: 0 })
await new Promise((r) => setTimeout(r, 3000))

const shot = async (name, opts = {}) => {
  await page.screenshot({ path: `${OUT}${name}.png`, ...opts })
  console.log("  wrote", `${name}.png`)
}

await shot("admin-cell-preview", { fullPage: true })

// Structural assertions on the rendered markup
const dump = await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".post-figure-row")]
  return rows.map((r) => ({
    classes: r.className,
    figures: [...r.querySelectorAll(".post-figure")].map((f) => ({
      alt: f.querySelector("img")?.getAttribute("alt"),
      loading: f.querySelector("img")?.getAttribute("loading"),
      caption: f.querySelector("figcaption")?.textContent ?? null,
      inP: !!f.closest("p"),
    })),
  }))
})
console.log("\nrendered figure rows:")
console.log(JSON.stringify(dump, null, 2))

// ── Full-post preview ────────────────────────────────────────────────────────
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith("Preview"))
  b?.click()
})
await new Promise((r) => setTimeout(r, 1200))
await page.evaluate(() => window.scrollTo(0, 0))
await shot("admin-full-preview-top", {})
await shot("admin-full-preview", { fullPage: true })

// ── Mobile ───────────────────────────────────────────────────────────────────
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await new Promise((r) => setTimeout(r, 800))
await shot("admin-full-preview-mobile", { fullPage: true })

console.log("\nconsole errors:", errors.length ? errors : "none")
await browser.close()
