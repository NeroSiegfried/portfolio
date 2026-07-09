"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { technologies } from "@/lib/portfolio-data"
import { Eyebrow } from "@/components/v2/primitives"

export function TechStack() {
  const items = [...technologies, ...technologies]
  const trackRef = useRef<HTMLDivElement>(null)

  // Auto-scrolling marquee that is also draggable (JS-driven; inline transform
  // is a computed value). Pauses on hover, resumes on leave.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const s = { x: 0, dragging: false, startX: 0, startPos: 0, half: 0, paused: false }
    const measure = () => { s.half = track.scrollWidth / 2 }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      if (!s.dragging && !s.paused && !reduce) s.x -= 42 * dt
      if (s.half > 0) {
        if (s.x <= -s.half) s.x += s.half
        else if (s.x > 0) s.x -= s.half
      }
      track.style.transform = `translate3d(${s.x}px,0,0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onDown = (e: PointerEvent) => { s.dragging = true; s.startX = e.clientX; s.startPos = s.x; try { track.setPointerCapture(e.pointerId) } catch {} }
    const onMove = (e: PointerEvent) => { if (s.dragging) s.x = s.startPos + (e.clientX - s.startX) }
    const onUp = () => { s.dragging = false }
    const onEnter = () => { s.paused = true }
    const onLeave = () => { s.paused = false }
    track.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    track.addEventListener("pointerenter", onEnter)
    track.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      track.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      track.removeEventListener("pointerenter", onEnter)
      track.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return (
    <section id="stack" className="scroll-mt-16 overflow-hidden border-t border-border px-4 py-16 md:px-6 md:py-24">
      <div className="flex items-end justify-between gap-6 border-b border-border pb-5">
        <div>
          <Eyebrow className="mb-3 block">Stack</Eyebrow>
          <h2 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Tech stack</h2>
        </div>
        <Eyebrow className="hidden pb-1 sm:block">Drag to explore →</Eyebrow>
      </div>

      <div className="v2-marquee-mask mt-10 select-none">
        <div ref={trackRef} className="flex w-max touch-pan-y gap-3 will-change-transform">
          {items.map((t, i) => (
            <div key={`${t.name}-${i}`} className="tech-item flex w-32 shrink-0 flex-col items-center gap-3 border border-border px-4 py-6">
              <div className="pointer-events-none relative h-9 w-9">
                <Image src={t.logo} alt={t.name} fill sizes="36px" className="tech-logo object-contain" />
              </div>
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
