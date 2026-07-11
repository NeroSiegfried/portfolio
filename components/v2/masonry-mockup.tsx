import Image from "next/image"
import type { CSSProperties } from "react"
import layouts from "@/lib/masonry-layout.json"

interface Tile { src: string; viewport: string }
interface Layout { tiles: Tile[] }

const LAYOUTS = layouts as Record<string, Layout>

// grid-area: span ROWS / span COLS  (aspect ≈ COLS / ROWS, matched to the shot)
const SPAN: Record<string, string> = {
  wide:    "span 2 / span 4", // 2.0  — extra-wide desktop
  desktop: "span 2 / span 3", // 1.5  — desktop
  tablet:  "span 3 / span 2", // 0.67 — tablet portrait
  mobile:  "span 2 / span 1", // 0.5  — phone
}
// Cell area (rows × cols) each span occupies — used to size the grid so every
// project's plane ends up the SAME footprint no matter how many shots it has.
const CELLS: Record<string, number> = { wide: 8, desktop: 6, tablet: 6, mobile: 2 }
// Target rows : cols ratio (cells). ~1 (a touch landscape) so that after the
// isometric X-tilt foreshortens it vertically the plane lands close to the 3:2
// frame aspect — filling it corner-to-corner with the LEAST overflow (so few
// tiles get buried). cols = √(area / K) keeps rows ≈ cols·K, and — with the cell
// size derived as (--mason-w / cols) in CSS — every project's footprint
// (≈ W × W·K) is constant, so ONE centred scale/rotation overflows every corner.
const K = 1.15

export function hasMasonry(id: number) {
  return Boolean(LAYOUTS[String(id)]?.tiles?.length)
}

/**
 * Isometric masonry mockup: a project's screenshots (mobile / tablet / desktop /
 * extra-wide, across many crawled pages/sections) packed into ONE dense CSS-grid
 * mosaic (`grid-auto-flow: dense`, so the browser backfills every hole — no
 * gaps), tilted onto an axonometric plane. The plane is normalised to a constant
 * footprint (see `K`) then scaled up so it overflows every edge and corner of the
 * frame (clipped by `.v2-work-item`); on hover it shrinks toward its natural size
 * so the whole collage reads. Pure CSS transform on the grid — tiles never move
 * individually.
 */
export function MasonryMockup({ id }: { id: number }) {
  const layout = LAYOUTS[String(id)]
  if (!layout) return null

  // Column count that normalises the plane's shape/footprint across projects.
  const area = layout.tiles.reduce((a, t) => a + (CELLS[t.viewport] ?? 4), 0)
  const cols = Math.max(11, Math.min(18, Math.round(Math.sqrt(area / K))))

  return (
    <div className="v2-mason">
      <div className="v2-mason__grid" style={{ "--mason-cols": cols } as CSSProperties}>
        {layout.tiles.map((t, i) => (
          <div key={i} className="v2-mason__tile" style={{ gridArea: SPAN[t.viewport] ?? "span 2 / span 2" }}>
            <Image src={t.src} alt="" fill sizes="320px" className="object-cover object-top" />
          </div>
        ))}
      </div>
    </div>
  )
}
