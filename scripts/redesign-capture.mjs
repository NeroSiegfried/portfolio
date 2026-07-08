// Template capture + design-token extraction pipeline.
// Usage: node capture.mjs <url> <name> <w1,w2,...> [outRoot]
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const [, , url, name, widthsCsv, outRoot = './screens'] = process.argv
if (!url || !name || !widthsCsv) { console.error('args: <url> <name> <widths>'); process.exit(1) }
const widths = widthsCsv.split(',').map(Number)
const outDir = path.join(outRoot, name)
fs.mkdirSync(outDir, { recursive: true })

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0
      const step = Math.round(window.innerHeight * 0.85)
      const timer = setInterval(() => {
        window.scrollBy(0, step)
        y += step
        if (y >= document.body.scrollHeight + window.innerHeight) { clearInterval(timer); resolve() }
      }, 120)
    })
    window.scrollTo(0, 0)
  })
  await sleep(700)
}

// Runs in page context: extract design tokens.
function extractStyles() {
  const els = Array.from(document.querySelectorAll('body *'))
  const vis = (el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none'
  }
  const tally = (arr) => {
    const m = {}
    for (const v of arr) if (v) m[v] = (m[v] || 0) + 1
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }
  const norm = (c) => (c || '').replace(/\s+/g, '')
  const isTransparent = (c) => !c || c === 'transparent' || /rgba\(0,0,0,0\)/.test(norm(c))

  const fonts = [], sizes = [], weights = [], textColors = [], bgColors = [], radii = []
  for (const el of els) {
    if (!vis(el)) continue
    const cs = getComputedStyle(el)
    fonts.push(cs.fontFamily.split(',')[0].replace(/["']/g, '').trim())
    sizes.push(Math.round(parseFloat(cs.fontSize)))
    weights.push(cs.fontWeight)
    if (el.textContent && el.textContent.trim()) textColors.push(norm(cs.color))
    if (!isTransparent(cs.backgroundColor)) bgColors.push(norm(cs.backgroundColor))
    const br = parseFloat(cs.borderTopLeftRadius)
    if (br > 0) radii.push(Math.round(br))
  }

  const sample = (sel) => {
    const el = Array.from(document.querySelectorAll(sel)).find(vis)
    if (!el) return null
    const cs = getComputedStyle(el)
    return {
      text: (el.textContent || '').trim().slice(0, 50),
      fontFamily: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
      fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing, color: cs.color, textTransform: cs.textTransform,
    }
  }

  const bcs = getComputedStyle(document.body)
  return {
    meta: {
      title: document.title,
      docHeight: document.body.scrollHeight,
      innerWidth: window.innerWidth,
      sections: document.querySelectorAll('section, [data-framer-name]').length,
    },
    body: { fontFamily: bcs.fontFamily, fontSize: bcs.fontSize, color: bcs.color, background: bcs.backgroundColor },
    samples: {
      h1: sample('h1'), h2: sample('h2'), h3: sample('h3'), h4: sample('h4'),
      p: sample('p'), a: sample('a'),
      button: sample('button, [role=button], a[class*=button], a[class*=Button]'),
    },
    fontFamilies: tally(fonts).slice(0, 8),
    typeScale: tally(sizes).sort((a, b) => b[0] - a[0]).slice(0, 16),
    weights: tally(weights),
    textColors: tally(textColors).slice(0, 12),
    bgColors: tally(bgColors).slice(0, 12),
    radii: tally(radii).slice(0, 8),
  }
}

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setUserAgent(UA)
const results = {}
for (const w of widths) {
  try {
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
    await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {})
    await sleep(500)
    await autoScroll(page)
    const file = path.join(outDir, `${name}-${w}.png`)
    await page.screenshot({ path: file, fullPage: true })
    results[w] = await page.evaluate(extractStyles)
    const kb = Math.round(fs.statSync(file).size / 1024)
    console.log(`  ${name} @ ${w}px -> ${file} (${kb}KB, docH ${results[w].meta.docHeight})`)
  } catch (e) {
    console.log(`  ${name} @ ${w}px FAILED: ${e.message}`)
    results[w] = { error: e.message }
  }
}
fs.writeFileSync(path.join(outDir, `${name}-styles.json`), JSON.stringify(results, null, 2))
console.log(`  styles -> ${path.join(outDir, `${name}-styles.json`)}`)
await browser.close()
