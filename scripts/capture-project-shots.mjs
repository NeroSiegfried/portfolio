// Capture multi-page, multi-viewport screenshots of each featured project's live
// site → public/projects/shots/{id}/ + a per-project manifest. The masonry
// component lays these out as a live, grid-flush isometric collage.
//
// - Four viewports: mobile, tablet, desktop AND extra-wide desktop → varied tile
//   aspect ratios (mixed rows/cols in the masonry).
// - Each shot is a FRESH page load; top shots screenshot at scrollTop 0 (so
//   sticky navbars stay pinned up top, not stranded mid-page).
// - Sites with few real subpages (e.g. single-page sites whose "pages" are just
//   navbar dropdown anchors) fall back to home SCROLL SECTIONS so the masonry
//   still gets varied content instead of near-identical home shots.
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const OUT = path.resolve('public/projects/shots')

const PROJECTS = [
  { id: 11, url: 'https://www.derivian.co.uk', wait: 3800 },
  { id: 12, url: 'https://sunabtelecomservices.com/', wait: 2800 },
  { id: 10, url: 'https://thestitchbloom.com/', wait: 3200 },
  { id: 9,  url: 'https://www.loopbridge.network', wait: 2400 },
]

const VIEWPORTS = {
  mobile:  { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true },
  tablet:  { width: 834, height: 1112, deviceScaleFactor: 2, isMobile: false },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2, isMobile: false },
  wide:    { width: 2560, height: 1100, deviceScaleFactor: 1, isMobile: false },
}
const MAX_SUBPAGES = 3

async function dismissBanners(page) {
  try {
    await page.evaluate(() => {
      const rx = /^(accept|accept all|agree|i agree|got it|ok|allow|continue|close|×|x)$/i
      for (const el of document.querySelectorAll('button, a, [role=button]')) {
        if (rx.test((el.textContent || '').trim())) el.click()
      }
    })
  } catch {}
}

/** Fresh load at `vp`, optional scroll to a section, screenshot the viewport. */
async function shoot(page, url, vp, wait, file, scrollFactor = 0) {
  await page.setViewport(vp)
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
  await new Promise(r => setTimeout(r, wait))
  await dismissBanners(page)
  await new Promise(r => setTimeout(r, 700))
  await page.evaluate((f, h) => window.scrollTo(0, Math.round(f * h)), scrollFactor, vp.height)
  await new Promise(r => setTimeout(r, 500))
  await page.screenshot({ path: file, type: 'jpeg', quality: 86 })
}

async function discoverSubpages(page, url, origin) {
  await page.setViewport(VIEWPORTS.desktop)
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
  await new Promise(r => setTimeout(r, 1500))
  // Best-effort: reveal dropdown menus so their links enter the DOM.
  try {
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('button,[aria-haspopup],[role=button],nav a,header a')) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      }
    })
    await new Promise(r => setTimeout(r, 800))
  } catch {}
  return page.evaluate((origin) => {
    const seen = new Set(); const out = []
    for (const a of document.querySelectorAll('a[href]')) {
      let u; try { u = new URL(a.href, location.href) } catch { continue }
      if (u.origin !== origin) continue
      const p = u.pathname.replace(/\/$/, '') || '/'
      if (p === '/' || seen.has(p)) continue
      if (/\.(pdf|jpg|png|zip|svg|mp4|webp)$/i.test(p)) continue
      seen.add(p); out.push(u.pathname)
    }
    return out
  }, origin)
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })

for (const proj of PROJECTS) {
  const dir = path.join(OUT, String(proj.id))
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const manifest = []
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36')
  const origin = new URL(proj.url).origin

  const push = async (url, vpName, tag, distance, scroll = 0) => {
    const f = `${tag}.jpg`
    try {
      await shoot(page, url, VIEWPORTS[vpName], proj.wait, path.join(dir, f), scroll)
      manifest.push({ file: f, viewport: vpName, distance, page: url })
    } catch (e) { console.log(`  [${proj.id}] ${tag} failed: ${e.message}`) }
  }

  try {
    // Home at all four viewports (distance 0).
    for (const vp of Object.keys(VIEWPORTS)) await push(proj.url, vp, `home-${vp}`, 0)

    const subs = (await discoverSubpages(page, proj.url, origin)).slice(0, MAX_SUBPAGES)
    for (const p of subs) {
      const slug = (p.replace(/\//g, '-').replace(/^-|-$/g, '') || 'page').slice(0, 28)
      // three viewports per subpage → tablet is represented too
      for (const vp of ['desktop', 'mobile', 'tablet']) await push(origin + p, vp, `${slug}-${vp}`, 1)
    }

    // Few real subpages → capture home scroll sections at varied viewports so the
    // masonry still has distinct content (single-page sites like Stitch Bloom).
    if (subs.length < 2) {
      const sections = [
        { vp: 'desktop', s: 1.0 }, { vp: 'tablet', s: 1.8 },
        { vp: 'wide', s: 1.4 }, { vp: 'mobile', s: 2.2 },
        { vp: 'desktop', s: 2.6 }, { vp: 'mobile', s: 1.2 },
      ]
      for (let i = 0; i < sections.length; i++) {
        const { vp, s } = sections[i]
        await push(proj.url, vp, `section${i}-${vp}`, 1, s)
      }
    }

    console.log(`[${proj.id}] ${manifest.length} shots (${subs.length} subpages)`)
  } catch (e) {
    console.log(`[${proj.id}] FAILED: ${e.message}`)
  } finally {
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    await page.close()
  }
}
await browser.close()
console.log('capture done →', OUT)
