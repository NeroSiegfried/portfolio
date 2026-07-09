"use client"

import { useEffect, useRef } from "react"

/**
 * Custom cursor (portfoliod): a small filled dot by default, a slightly larger
 * dot over links/buttons, and a ring with an up-right arrow over project media
 * ([data-cursor]). mix-blend-difference so it inverts over any background.
 * Disabled on touch; native cursor hidden via `.v2-cursor-scope` on <html>.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dot = dotRef.current
    if (!dot) return

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
      dot.dataset.variant = el ? (el.hasAttribute("data-cursor") ? "ring" : "hover") : "dot"
    }
    const loop = () => {
      const ease = reduce ? 1 : 0.2
      x += (tx - x) * ease
      y += (ty - y) * ease
      dot.style.setProperty("--cx", `${x}px`)
      dot.style.setProperty("--cy", `${y}px`)
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
    <div ref={dotRef} className="v2-cursor" data-variant="dot" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </svg>
    </div>
  )
}
