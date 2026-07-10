// Pack each project's captured shots into an isometric-grid masonry LAYOUT and
// write public/projects/masonry.json. The <MasonryMockup> component renders this
// as a live CSS grid (theme-aware grid lines) on an isometric plane that scales
// as one on scroll — the tiles themselves stay static.
//
// Geometry: every tile spans an integer number of grid cells in width AND height
// (mixed by viewport aspect), tiles are separated by ≥1 empty cell (= one grid
// spacing = the margin), and every edge lands on a grid line → flush. Home shots
// (distance 0) are the biggest and packed first, so they sit centrally; deeper
// pages spread outward.
import fs from 'fs'
import path from 'path'

const SHOTS = path.resolve('public/projects/shots')
const OUT = path.resolve('lib/masonry-layout.json')

// cell spans (w × h) per viewport — mixed rows/cols reflecting each aspect ratio
const SPAN = {
  mobile:  { w: 3, h: 6 },  // tall
  tablet:  { w: 4, h: 5 },  // squarish-portrait
  desktop: { w: 6, h: 4 },  // wide
  wide:    { w: 9, h: 4 },  // extra-wide
}
const VRANK = { wide: 0, desktop: 1, tablet: 2, mobile: 3 }

function pack(tiles) {
  const occ = new Set()
  const k = (c, r) => `${c},${r}`
  const fits = (c, r, w, h) => {
    for (let x = c - 1; x <= c + w; x++)      // 1-cell margin on every side → gaps = 1 cell
      for (let y = r - 1; y <= r + h; y++)
        if (occ.has(k(x, y))) return false
    return true
  }
  const take = (c, r, w, h) => {
    for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) occ.add(k(x, y))
  }
  const RANGE = 44
  const placed = []
  for (const t of tiles) {
    let best = null, bestD = Infinity
    for (let c = -RANGE; c <= RANGE; c++) {
      for (let r = -RANGE; r <= RANGE; r++) {
        if (!fits(c, r, t.w, t.h)) continue
        const cx = c + t.w / 2, cy = r + t.h / 2
        const d = cx * cx + cy * cy       // nearest-to-centre → centred spread
        if (d < bestD) { bestD = d; best = { c, r } }
      }
    }
    if (!best) continue
    take(best.c, best.r, t.w, t.h)
    placed.push({ ...t, c: best.c, r: best.r })
  }
  const minC = Math.min(...placed.map(p => p.c)), minR = Math.min(...placed.map(p => p.r))
  placed.forEach(p => { p.c -= minC; p.r -= minR })
  return {
    tiles: placed,
    cw: Math.max(...placed.map(p => p.c + p.w)),
    ch: Math.max(...placed.map(p => p.r + p.h)),
  }
}

const out = {}
for (const id of fs.readdirSync(SHOTS).filter(d => /^\d+$/.test(d))) {
  const dir = path.join(SHOTS, id)
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
  const shots = meta
    .filter(m => fs.existsSync(path.join(dir, m.file)))
    .map(m => ({ src: `/projects/shots/${id}/${m.file}`, viewport: m.viewport, distance: m.distance, ...SPAN[m.viewport] }))
    // home (distance 0) first & biggest → centre; deeper pages spread out.
    .sort((a, b) => (a.distance - b.distance) || (b.w * b.h - a.w * a.h) || (VRANK[a.viewport] - VRANK[b.viewport]) || a.src.localeCompare(b.src))

  if (!shots.length) continue
  const { tiles, cw, ch } = pack(shots)
  out[id] = { cw, ch, tiles: tiles.map(({ src, c, r, w, h, viewport }) => ({ src, c, r, w, h, viewport })) }
  console.log(`[${id}] ${tiles.length} tiles → ${cw}×${ch} cells`)
}

fs.writeFileSync(OUT, JSON.stringify(out))
console.log('layout →', OUT)
