"use client"

import { useEffect, useRef } from "react"

/**
 * Custom blend-difference cursor (portfoliod pattern): a small dot that tracks
 * the mouse with slight lag, grows over interactive elements, and shows a mono
 * label when the hovered element sets `data-cursor-label`. Native cursor is
 * hidden via `.v2-cursor-scope` on <html>. Disabled on touch + reduced-motion.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine) return
    const dot = dotRef.current
    const label = labelRef.current
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
      const el = (e.target as HTMLElement)?.closest?.("a, button, [role=button], [data-cursor]") as HTMLElement | null
      dot.dataset.hover = String(!!el)
      const lbl = el?.getAttribute("data-cursor-label")
      if (label) {
        label.dataset.show = String(!!lbl)
        label.textContent = lbl ?? ""
      }
    }

    const loop = () => {
      const ease = reduce ? 1 : 0.2
      x += (tx - x) * ease
      y += (ty - y) * ease
      dot.style.setProperty("--cx", `${x}px`)
      dot.style.setProperty("--cy", `${y}px`)
      if (label) {
        label.style.setProperty("--cx", `${tx}px`)
        label.style.setProperty("--cy", `${ty + 34}px`)
      }
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
      <div ref={dotRef} className="v2-cursor" aria-hidden />
      <div ref={labelRef} className="v2-cursor-label" aria-hidden />
    </>
  )
}
