/**
 * End-to-end check of the image upload path, in a real browser.
 *
 * Drives the admin dashboard exactly as a person would: picks a file with the
 * cell "Image" button, which presigns via /api/upload and PUTs straight to S3.
 * Asserts the PUT succeeded, the object is readable over CloudFront, and the
 * markdown landed in the cell. Nothing is saved to the database.
 *
 *   node scripts/verify-upload.mjs
 *   BASE=https://www.nerosiegfried.com TAG=prod node scripts/verify-upload.mjs
 */
import puppeteer from "puppeteer"
import { readFileSync, existsSync, mkdirSync } from "fs"
import sharp from "sharp"

const env = {}
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}

const BASE = process.env.BASE ?? "http://localhost:3000"
const TAG = process.env.TAG ?? "local"
const OUT = new URL("../.image-verify/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

// A real, decodable PNG — compressImage() runs it through an <img>, so a
// hand-rolled byte blob would fail to decode and never reach the network.
const FIXTURE = `${OUT}upload-fixture.png`
if (!existsSync(FIXTURE)) {
  await sharp({ create: { width: 640, height: 400, channels: 3, background: { r: 47, g: 112, b: 255 } } })
    .png().toFile(FIXTURE)
}

const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 180000 })
const page = await browser.newPage()

const network = []
page.on("response", async (r) => {
  const u = r.url()
  if (u.includes("/api/upload") || u.includes("amazonaws.com")) {
    let body = ""
    if (!r.ok()) { try { body = (await r.text()).replace(/\s+/g, " ").slice(0, 300) } catch {} }
    network.push({ method: r.request().method(), status: r.status(), url: u.split("?")[0], body })
  }
})
const consoleErrors = []
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()) })
page.on("pageerror", (e) => consoleErrors.push(String(e)))

try {
  // ── Log in ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}${env.ADMIN_ENTRY_PATH}`, { waitUntil: "domcontentloaded", timeout: 120000 })
  const auth = await page.evaluate(async (c) => {
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) })
    return { status: r.status, body: await r.text() }
  }, { email: env.BLOG_ADMIN_EMAIL, password: env.BLOG_ADMIN_PASSWORD })
  if (auth.status !== 200) throw new Error(`login failed: ${auth.status} ${auth.body}`)
  await page.goto(`${BASE}${env.ADMIN_ENTRY_PATH}/dashboard`, { waitUntil: "domcontentloaded", timeout: 120000 })
  console.log(`authenticated → ${page.url()}`)

  // ── Upload through the cell "Image" button ────────────────────────────────
  await page.waitForSelector("textarea[placeholder^='# Start writing']", { timeout: 60000 })
  // Click the cell's Image button so activeUploadCellRef points at cell 0, then
  // hand the file to the hidden input directly — a programmatic input.click()
  // does not raise a CDP file-chooser event.
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("title") === "Upload image")
    if (!b) throw new Error("cell Image button not found")
    b.click()
  })
  // There are two hidden file inputs (cover image, then notebook cell). Pick the
  // cell one explicitly — the first is the cover and would test the wrong path.
  const fileInputs = await page.$$('input[type="file"]')
  console.log(`hidden file inputs: ${fileInputs.length}`)
  if (fileInputs.length < 2) throw new Error(`expected 2 file inputs, found ${fileInputs.length}`)
  await fileInputs[fileInputs.length - 1].uploadFile(FIXTURE)
  console.log("file chosen — waiting for presign + PUT")

  // The cell markdown only appears once the S3 PUT resolved.
  await page.waitForFunction(
    () => {
      const ta = document.querySelector("textarea[placeholder^='# Start writing']")
      return !!ta && /!\[[^\]]*\]\(https?:\/\//.test(ta.value)
    },
    { timeout: 90000, polling: 500 },
  ).catch(() => {})

  const cellValue = await page.$eval("textarea[placeholder^='# Start writing']", (t) => t.value)
  const uploadError = await page.evaluate(() =>
    [...document.querySelectorAll("p,div")]
      .filter((x) => typeof x.className === "string" && x.className.includes("text-destructive"))
      .map((x) => x.textContent?.trim())
      .filter(Boolean)
      .join(" | ") || null)

  console.log(`\n── ${TAG} · upload ──`)
  console.log("network:", JSON.stringify(network, null, 2))
  console.log("cell markdown:", cellValue || "(empty)")
  console.log("inline error :", uploadError ?? "none")

  const url = cellValue.match(/!\[[^\]]*\]\((https?:\/\/[^\s)"]+)/)?.[1]
  if (!url) throw new Error(`FAIL: no image markdown inserted. inline error: ${uploadError ?? "none"}`)

  // ── The object must actually be readable over CloudFront ──────────────────
  let head = { status: 0 }
  for (let i = 0; i < 10; i++) {
    head = await fetch(url, { method: "GET" })
    if (head.ok) break
    await new Promise((r) => setTimeout(r, 1500))
  }
  console.log(`GET ${url} → ${head.status} ${head.headers?.get("content-type") ?? ""}`)
  if (!head.ok) throw new Error(`FAIL: uploaded object not readable (${head.status})`)

  const put = network.find((n) => n.method === "PUT")
  if (!put) throw new Error("FAIL: no PUT to S3 observed")
  if (put.status !== 200) throw new Error(`FAIL: S3 PUT returned ${put.status} ${put.body}`)

  await page.screenshot({ path: `${OUT}upload-${TAG}.png`, fullPage: false })
  console.log(`\nconsole errors: ${consoleErrors.length ? JSON.stringify(consoleErrors) : "none"}`)
  console.log(`\n✅ PASS — presign 200, S3 PUT 200, object served by CloudFront`)
  console.log(`   uploaded object: ${url}`)
  console.log(`   (untagged keep=false; the media sweep reclaims it as an orphan)`)
} finally {
  await browser.close()
}
