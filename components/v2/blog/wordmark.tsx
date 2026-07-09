"use client"

import { useEffect, useRef } from "react"

/**
 * Masthead wordmark (reado): a solid word filled to the full width, with a
 * dotted (halftone) accent shadow behind it that trails the cursor — the offset
 * (`--dx`/`--dy`) is driven by mouse position relative to the wordmark. The text
 * fills the width exactly via SVG `textLength`, so it never truncates.
 */
export function Wordmark({ text = "WRITING" }: { text?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia("(pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Subtle parallax (reado uses ~±3px): a small offset on top of the base shadow.
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2)))
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 2)))
      el.style.setProperty("--dx", `${6 + nx * 3.5}px`)
      el.style.setProperty("--dy", `${7 + ny * 3.5}px`)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  return (
    <div ref={ref} className="relative">
      <svg viewBox="0 0 1000 250" preserveAspectRatio="xMidYMid meet" className="w-full select-none" aria-hidden>
        <defs>
          {/* Fine, dense halftone — small tile + small dots (reado). */}
          <pattern id="v2-wordmark-dots" width="3.6" height="3.6" patternUnits="userSpaceOnUse">
            <circle cx="1.8" cy="1.8" r="0.8" className="fill-primary" />
          </pattern>
        </defs>
        <text
          className="v2-wordmark-shadow font-display font-bold"
          x="500"
          y="202"
          textAnchor="middle"
          textLength={1000}
          lengthAdjust="spacingAndGlyphs"
          fontSize={250}
          fill="url(#v2-wordmark-dots)"
        >
          {text}
        </text>
        <text
          className="fill-foreground font-display font-bold"
          x="500"
          y="202"
          textAnchor="middle"
          textLength={1000}
          lengthAdjust="spacingAndGlyphs"
          fontSize={250}
        >
          {text}
        </text>
      </svg>
    </div>
  )
}
