// Capture MANY real screenshots of each featured project's live site → the
// isometric masonry is a dense CSS-grid mosaic (big/centred/overflowing), so it
// needs lots of varied, non-blank tiles.
//
// - Four viewports: mobile, tablet, desktop, extra-wide → varied tile aspects.
// - SCROLL-AWARE BFS crawl: every visited page is scrolled top→bottom (to trigger
//   lazy-loaded nav/product/article links) and its dropdown menus are clicked
//   open, THEN links are collected and followed — so product/detail pages hidden
//   behind menus or lazy lists (e.g. LoopBridge /articles/art-00x, /courses) get
//   crawled, not just the top nav.
// - PAGE-HEIGHT-AWARE sections: only capture where there's content (never past the
//   end) so single-page sites still yield many distinct, non-blank tiles.
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const OUT = path.resolve('public/projects/shots')

const PROJECTS = [
  { id: 11, url: 'https://www.derivian.co.uk', wait: 3400 },
  { id: 12, url: 'https://sunabtelecomservices.com/', wait: 2600 },
  { id: 10, url: 'https://thestitchbloom.com/', wait: 3200 },
  { id: 9,  url: 'https://www.loopbridge.network', wait: 2400 },
]

const VIEWPORTS = {
  mobile:  { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
  tablet:  { width: 834, height: 1112, deviceScaleFactor: 1.5, isMobile: false },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1.5, isMobile: false },
  wide:    { width: 2560, height: 1100, deviceScaleFactor: 1, isMobile: false },
}
const MAX_PAGES = 14   // total pages captured per project (incl. home)
const HOME_SECT = 5
const SUB_SECT = 2
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null

const SKIP = /(login|signin|sign-in|register|signup|cart|checkout|account|privacy|terms|disclaimer|cookie)/i

/** Navigate to a same-origin route which may be a hash-router route (`/#/shop`).
    Hash-only changes don't reload, so blank first to force a fresh render. */
async function gotoRoute(page, origin, route, wait) {
  const url = origin + (route.startsWith('/') ? route : '/' + route)
  if (route.includes('#')) await page.goto('about:blank').catch(() => {})
  // `domcontentloaded` (not `networkidle2`) — sites with chat/analytics/video keep
  // sockets open forever and never reach network-idle, timing the crawl out. The
  // fixed render `wait` + reveal()'s scrolling still let lazy content settle. Try
  // for network-idle as a bonus but don't fail the shot if it never comes.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForNetworkIdle({ idleTime: 500, timeout: Math.max(wait, 2500) }).catch(() => {})
  await new Promise(r => setTimeout(r, wait))
  await dismissBanners(page)
}

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

/** Scroll top→bottom (twice) to trigger lazy content. When `openMenus` is set
    (discovery only) it ALSO clicks menu/burger/toggle buttons so lazily-rendered
    nav/product/article links enter the DOM — that's for link-finding, never for
    screenshots (those must be captured with menus/carts/search CLOSED). */
async function reveal(page, openMenus = false) {
  try {
    const h = () => page.evaluate(() => document.documentElement.scrollHeight)
    const vh = await page.evaluate(() => window.innerHeight)
    let H = await h()
    for (let y = 0; y <= H; y += Math.round(vh * 0.6)) {
      await page.evaluate((k) => window.scrollTo(0, k), y)
      await new Promise(r => setTimeout(r, 380))
    }
    if (openMenus) {
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('button,[aria-expanded],[aria-haspopup],[class*=menu i],[class*=burger i],[class*=toggle i],summary'))
          try { el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); el.click?.() } catch {}
      })
      await new Promise(r => setTimeout(r, 900))
    }
    H = await h() // page may have grown (lazy)
    for (let y = 0; y <= H; y += Math.round(vh * 0.9)) {
      await page.evaluate((k) => window.scrollTo(0, k), y)
      await new Promise(r => setTimeout(r, 280))
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await new Promise(r => setTimeout(r, 300))
  } catch {}
}

/** Collapse anything the crawl (or a stray hover) may have opened — mobile-nav
    drawers, cart/basket flyouts, search overlays, cookie/modal dialogs — so
    screenshots show the actual page, not a menu covering it. Escape first, then
    click explicit close controls, toggle any still-expanded triggers shut, and
    blur focused inputs (closes autocompleting search boxes). */
async function closeOverlays(page) {
  try {
    for (let i = 0; i < 2; i++) await page.keyboard.press('Escape').catch(() => {})
    await page.evaluate(() => {
      const CLOSE = /(close|dismiss|cancel|hide|collapse|✕|✖|×)/i
      const label = (el) => `${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.className || ''} ${el.textContent || ''}`
      // explicit close buttons (menu / cart / search / modal). Skip real links
      // so we never navigate away mid-capture.
      for (const el of document.querySelectorAll('button,[role=button],[aria-label]')) {
        const href = el.getAttribute('href')
        if (href && !/^(#|javascript:)/i.test(href)) continue
        try { if (CLOSE.test(label(el))) el.click() } catch {}
      }
      // toggle shut anything still marked open
      for (const el of document.querySelectorAll('[aria-expanded="true"]')) { try { el.click() } catch {} }
      for (const el of document.querySelectorAll('details[open]')) { try { el.open = false } catch {} }
      // drop focus so open search / autocomplete panels close
      try { document.activeElement && document.activeElement.blur && document.activeElement.blur() } catch {}
      window.scrollTo(0, 0)
    })
    await new Promise(r => setTimeout(r, 350))
  } catch {}
}

/** Dedicated BFS discovery pass (always at desktop, thorough reveal) → the full
    list of same-origin ROUTES (path- or hash-based), following lazily-revealed
    links deeper. */
async function discover(page, origin, wait) {
  const seen = new Set(['/'])
  const routes = []
  const queue = ['/']
  const done = new Set()
  await page.setViewport(VIEWPORTS.desktop)
  while (queue.length && routes.length < MAX_PAGES - 1) {
    const route = queue.shift()
    if (done.has(route)) continue
    done.add(route)
    try {
      await gotoRoute(page, origin, route, wait)
      await reveal(page, true) // discovery: open menus to surface hidden links
      for (const r of await collectLinks(page, origin)) {
        if (seen.has(r) || SKIP.test(r)) continue
        seen.add(r); routes.push(r); queue.push(r)
        if (routes.length >= MAX_PAGES - 1) break
      }
    } catch (e) { console.log(`  discover ${route} failed: ${e.message}`) }
  }
  return routes
}

async function collectLinks(page, origin) {
  // Returns routes = pathname (+ hash for hash-router SPAs like `/#/shop`), so
  // client-routed pages whose pathname is always "/" are still discovered.
  return page.evaluate((origin) => {
    const seen = new Set(); const out = []
    for (const a of document.querySelectorAll('a[href]')) {
      let u; try { u = new URL(a.href, location.href) } catch { continue }
      if (u.origin !== origin) continue
      if (/\.(pdf|jpg|jpeg|png|zip|svg|mp4|webp)$/i.test(u.pathname)) continue
      const hash = u.hash && /^#\//.test(u.hash) ? u.hash : ''
      const route = (u.pathname.replace(/\/$/, '') || '/') + hash
      if (route === '/' || seen.has(route)) continue
      seen.add(route); out.push(route)
    }
    return out
  }, origin)
}

async function sectionOffsets(page, vp, maxSec) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  const maxScroll = Math.max(0, h - vp.height)
  // Stay in the CONTENT zone: never scroll into the final ~1 screen, where the
  // footer lives — footer tiles are repetitive and dull, so we skip them.
  const usable = Math.max(0, maxScroll - Math.round(vp.height * 0.95))
  const screens = Math.max(1, Math.min(maxSec, Math.ceil((usable + vp.height) / vp.height)))
  const out = []
  for (let i = 0; i < screens; i++) out.push(Math.min(Math.round(i * vp.height * 0.9), usable))
  return [...new Set(out)]
}

async function captureSections(page, vp, wait, dir, tag, vpName, maxSec, manifest) {
  const offsets = await sectionOffsets(page, vp, maxSec)
  for (let i = 0; i < offsets.length; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), offsets[i])
    await new Promise(r => setTimeout(r, 450))
    const f = `${tag}-${vpName}${i ? '-s' + i : ''}.jpg`
    try {
      await page.screenshot({ path: path.join(dir, f), type: 'jpeg', quality: 84 })
      manifest.push({ file: f, viewport: vpName })
    } catch (e) { console.log(`  ${tag} ${vpName} s${i} failed: ${e.message}`) }
  }
}

const SUB_VPS = ['desktop', 'mobile', 'tablet', 'wide']

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })

for (const proj of PROJECTS) {
  if (ONLY && !ONLY.has(String(proj.id))) continue
  const dir = path.join(OUT, String(proj.id))
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const manifest = []
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36')
  const origin = new URL(proj.url).origin

  try {
    // 1) Discover the full page list (thorough, desktop; path- or hash-routed).
    const subpages = await discover(page, origin, proj.wait)
    console.log(`  [${proj.id}] discovered ${subpages.length} subpages: ${subpages.slice(0, 12).join(', ')}${subpages.length > 12 ? ' …' : ''}`)

    // 2) Capture home at all four viewports (sectioned by real page height).
    for (const vpName of Object.keys(VIEWPORTS)) {
      const vp = VIEWPORTS[vpName]
      await page.setViewport(vp)
      await gotoRoute(page, origin, '/', proj.wait)
      await reveal(page)          // lazy content only — no menus opened
      await closeOverlays(page)   // ensure nothing is left open before shooting
      await captureSections(page, vp, proj.wait, dir, 'home', vpName, HOME_SECT, manifest)
    }

    // 3) Capture each subpage at a rotating viewport (a couple of sections).
    for (let i = 0; i < subpages.length; i++) {
      const route = subpages[i]
      const slug = (route.replace(/[/#]/g, '-').replace(/^-+|-+$/g, '') || 'page').slice(0, 26)
      const vpName = SUB_VPS[i % SUB_VPS.length]
      const vp = VIEWPORTS[vpName]
      try {
        await page.setViewport(vp)
        await gotoRoute(page, origin, route, proj.wait)
        await reveal(page)          // lazy content only — no menus opened
        await closeOverlays(page)   // ensure nothing is left open before shooting
        await captureSections(page, vp, proj.wait, dir, slug, vpName, SUB_SECT, manifest)
      } catch (e) { console.log(`  [${proj.id}] ${slug} ${vpName} failed: ${e.message}`) }
    }
    console.log(`[${proj.id}] ${manifest.length} shots (${subpages.length + 1} pages)`)
  } catch (e) {
    console.log(`[${proj.id}] FAILED: ${e.message}`)
  } finally {
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    await page.close()
  }
}
await browser.close()
console.log('capture done →', OUT)
