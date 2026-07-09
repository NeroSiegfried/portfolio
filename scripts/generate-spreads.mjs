// Compose a full-bleed "responsiveness spread" per web project: the desktop
// screenshot fills the frame (colorful background) with the phone screenshot
// overlapped bottom-right. Fills grid cells edge-to-edge (object-cover).
// Usage: node scripts/generate-spreads.mjs
import sharp from "sharp"
import fs from "fs"

const DIR = "public/projects"
const WEB_PROJECT_IDS = [11, 10, 9, 1]
const W = 1600
const H = 1000

for (const id of WEB_PROJECT_IDS) {
  const deskSrc = fs.existsSync(`${DIR}/${id}-studio.png`)
    ? `${DIR}/${id}-studio.png`
    : `${DIR}/${id}-macbook.png`
  const phoneSrc = `${DIR}/${id}-iphone.png`
  if (!fs.existsSync(deskSrc) || !fs.existsSync(phoneSrc)) {
    console.log(`  ${id}: missing screenshots, skipping`)
    continue
  }

  // Desktop fills the frame.
  const bg = await sharp(deskSrc).resize({ width: W, height: H, fit: "cover", position: "top" }).toBuffer()

  // Phone with a hairline border, overlapped bottom-right.
  const phone = await sharp(phoneSrc)
    .resize({ width: 300 })
    .extend({ top: 2, bottom: 2, left: 2, right: 2, background: { r: 255, g: 255, b: 255, alpha: 0.85 } })
    .toBuffer()
  const pm = await sharp(phone).metadata()

  await sharp(bg)
    .composite([{ input: phone, left: W - (pm.width ?? 300) - 70, top: H - (pm.height ?? 640) - 60 }])
    .jpeg({ quality: 82 })
    .toFile(`${DIR}/${id}-spread.jpg`)

  const kb = Math.round(fs.statSync(`${DIR}/${id}-spread.jpg`).size / 1024)
  console.log(`  ${id}-spread.jpg (${kb}KB) from ${deskSrc.split("/").pop()} + phone`)
}
console.log("done")
