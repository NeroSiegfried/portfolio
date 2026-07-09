"use client"

import { useEffect, useRef } from "react"

/**
 * Custom cursor (portfoliod): a small filled dot by default, a slightly larger
 * dot over links/buttons, and a large ring with a bold up-right arrow over
 * project media ([data-cursor]). Over media it also shows a trailing label
 * (from `data-cursor-label`, e.g. "Visit site" / "Read build log") that follows
 * the cursor. mix-blend-difference so it inverts over any background. Disabled
 * on touch; native cursor hidden via `.v2-cursor-scope` on <html>.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dot = dotRef.current
    const label = labelRef.current
    if (!dot || !label) return

    document.documentElement.classList.add("v2-cursor-scope")
    let raf = 0
    let x = -100
    let y = -100
    let tx = -100
    let ty = -100

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
      const el = (e.target as HTMLElement)?.closest?.("a, button, [role=button], [data-cursor], input, textarea, select") as HTMLElement | null
      const isRing = !!el?.hasAttribute("data-cursor")
      dot.dataset.variant = el ? (isRing ? "ring" : "hover") : "dot"
      const text = isRing ? el?.getAttribute("data-cursor-label") ?? "" : ""
      if (text) {
        label.textContent = text
        label.dataset.show = "true"
      } else {
        label.dataset.show = "false"
      }
    }
    const loop = () => {
      const ease = reduce ? 1 : 0.2
      x += (tx - x) * ease
      y += (ty - y) * ease
      dot.style.setProperty("--cx", `${x}px`)
      dot.style.setProperty("--cy", `${y}px`)
      label.style.setProperty("--cx", `${x}px`)
      label.style.setProperty("--cy", `${y}px`)
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener("mousemove", onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove("v2-cursor-scope")
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="v2-cursor" data-variant="dot" aria-hidden>
        {/* Tight viewBox so the arrow fills the box; sharp (miter/square) edges;
            stroke width tuned to read as regular weight at ~98px and match the ring. */}
        <svg viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M5 1H17V13" />
          <path d="M1 17 17 1" />
        </svg>
      </div>
      <div ref={labelRef} className="v2-cursor-label" data-show="false" aria-hidden />
    </>
  )
}
