// Compose an editorial "responsiveness spread" per web project — a single
// image (desktop screenshot + overlapped phone screenshot, squared, hairline
// border) on a transparent canvas. Replaces the CSS device-frame showcase.
// Usage: node scripts/generate-spreads.mjs
import sharp from "sharp"
import fs from "fs"

const DIR = "public/projects"
const WEB_PROJECT_IDS = [11, 10, 9, 1]
const W = 1600
const H = 1000
const BORDER = { r: 130, g: 130, b: 130, alpha: 0.6 }

async function withBorder(buf) {
  return sharp(buf).extend({ top: 1, bottom: 1, left: 1, right: 1, background: BORDER }).toBuffer()
}

for (const id of WEB_PROJECT_IDS) {
  const deskPath = `${DIR}/${id}-macbook.png`
  const phonePath = `${DIR}/${id}-iphone.png`
  if (!fs.existsSync(deskPath) || !fs.existsSync(phonePath)) {
    console.log(`  ${id}: missing screenshots, skipping`)
    continue
  }

  let desk = await withBorder(await sharp(deskPath).resize({ width: 1160 }).toBuffer())
  let phone = await withBorder(await sharp(phonePath).resize({ width: 270 }).toBuffer())
  const dm = await sharp(desk).metadata()
  const pm = await sharp(phone).metadata()

  const deskLeft = 30
  const deskTop = Math.max(20, Math.round((H - dm.height) / 2) - 40)
  const phoneLeft = W - pm.width - 70
  const phoneTop = H - pm.height - 30

  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: desk, left: deskLeft, top: deskTop },
      { input: phone, left: phoneLeft, top: phoneTop },
    ])
    .png()
    .toFile(`${DIR}/${id}-spread.png`)

  const kb = Math.round(fs.statSync(`${DIR}/${id}-spread.png`).size / 1024)
  console.log(`  ${id}-spread.png (${kb}KB) desk ${dm.width}x${dm.height} @${deskLeft},${deskTop} | phone ${pm.width}x${pm.height} @${phoneLeft},${phoneTop}`)
}
console.log("done")
