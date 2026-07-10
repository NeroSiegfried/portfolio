import Image from "next/image"
import { cn } from "@/lib/utils"

export type IsoKind = "desktop" | "tablet" | "mobile"
export interface IsoShot {
  src: string
  kind: IsoKind
}

/**
 * Isometric project mockup: screenshots of a site at different viewports arranged
 * on a shared axonometric plane over an isometric line grid. The cards are
 * oversized and offset so they bleed past the frame (clipped by the surrounding
 * `.v2-work-item`), giving a masonry "spilling off the grid" feel. Geometry lives
 * in `.v2-iso*` (globals.css); add more shots and they slot onto the same grid.
 */
export function IsometricMockup({ shots, className }: { shots: IsoShot[]; className?: string }) {
  return (
    <div className={cn("v2-iso", className)}>
      <div className="v2-iso__grid" aria-hidden />
      <div className="v2-iso__stage">
        {shots.map((s, i) => (
          <div key={s.src} className={cn("v2-iso__card", `v2-iso__card--${s.kind}`)} style={{ zIndex: i + 1 }}>
            <Image
              src={s.src}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover object-top"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
