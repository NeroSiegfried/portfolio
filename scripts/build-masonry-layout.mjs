// Emit lib/masonry-layout.json = { id: { tiles: [{ src, viewport }] } }.
// No hand-packing: the <MasonryMockup> renders these as a CSS grid with
// grid-auto-flow: dense (see
// https://css-tricks.com/exploring-css-grids-implicit-grid-and-auto-placement-powers/).
// Dense auto-placement backfills every hole with a LATER item that fits — so the
// order must be BIG SHOTS FIRST (wide → desktop → tablet → mobile): the big tiles
// anchor the mosaic, then the many small (tablet/phone) tiles backfill every gap
// they leave, scattering through the whole plane. Interleaving breaks this — it
// exhausts the small tiles early, so late holes have nothing to fill them.
import fs from 'fs'
import path from 'path'

const SHOTS = path.resolve('public/projects/shots')
const OUT = path.resolve('lib/masonry-layout.json')

// bigger viewports first → dense auto-flow backfills the holes with the rest
const VRANK = { wide: 0, desktop: 1, tablet: 2, mobile: 3 }

const out = {}
for (const id of fs.readdirSync(SHOTS).filter(d => /^\d+$/.test(d))) {
  const dir = path.join(SHOTS, id)
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
  const tiles = meta
    .filter(m => fs.existsSync(path.join(dir, m.file)))
    .map(m => ({ src: `/projects/shots/${id}/${m.file}`, viewport: m.viewport }))
    .sort((a, b) => (VRANK[a.viewport] - VRANK[b.viewport]) || a.src.localeCompare(b.src))
  if (!tiles.length) continue
  out[id] = { tiles }
  console.log(`[${id}] ${tiles.length} tiles`)
}

fs.writeFileSync(OUT, JSON.stringify(out))
console.log('layout →', OUT)
