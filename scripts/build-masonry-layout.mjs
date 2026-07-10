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

// cell spans (w × h) per viewport — a FINE grid (big spans) so a 1-cell gap reads
// as a tight margin between images, and every ratio is preserved (mixed rows/cols).
const SPAN = {
  mobile:  { w: 5,  h: 10 }, // tall (0.50)
  tablet:  { w: 7,  h: 9  }, // portrait-ish (0.78)
  desktop: { w: 11, h: 7  }, // wide (1.57)
  wide:    { w: 16, h: 7  }, // extra-wide (2.29)
}
const VRANK = { wide: 0, desktop: 1, tablet: 2, mobile: 3 }
const GAP = 1 // exactly one cell between every pair of tiles → uniform margins

/**
 * Skyline (bottom-left) bin-packing into a target width. Tiles reserve a 1-cell
 * gap on their right + top, so neighbours are always exactly one cell apart — a
 * proper masonry with uniform margins (never a 2-cell gap) and a dense top-down
 * fill (no big empty top). Tall-first ordering minimises leftover holes.
 */
function pack(tiles) {
  const totalArea = tiles.reduce((s, t) => s + (t.w + GAP) * (t.h + GAP), 0)
  const maxW = Math.max(...tiles.map(t => t.w)) + GAP
  // Aim for a roughly square packed block so the tilted plane fills the card.
  const W = Math.max(maxW, Math.round(Math.sqrt(totalArea) * 1.05))

  const order = [...tiles].sort((a, b) => (b.h - a.h) || (b.w - a.w) || (VRANK[a.viewport] - VRANK[b.viewport]))
  const sky = new Array(W).fill(0)
  const placed = []
  for (const t of order) {
    let best = { x: 0, y: Infinity }
    for (let x = 0; x + t.w <= W; x++) {
      let y = 0
      for (let i = x; i < Math.min(x + t.w + GAP, W); i++) y = Math.max(y, sky[i])
      if (y < best.y || (y === best.y && x < best.x)) best = { x, y }
    }
    const { x, y } = best
    placed.push({ ...t, c: x, r: y })
    for (let i = x; i < Math.min(x + t.w + GAP, W); i++) sky[i] = y + t.h + GAP
  }
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
