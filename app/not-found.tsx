// app/not-found.tsx
"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Footer from "@/components/footer"

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()
  const themeRef = useRef(resolvedTheme)
  useEffect(() => { themeRef.current = resolvedTheme }, [resolvedTheme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const mouse = { x: -9999, y: -9999 }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      if (mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height) {
        mouse.x = mx
        mouse.y = my
      } else {
        mouse.x = -9999
        mouse.y = -9999
      }
    }
    window.addEventListener("mousemove", handleMouseMove)

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 1
        this.speedX = Math.random() * 0.5 - 0.25
        this.speedY = Math.random() * 0.5 - 0.25
      }
      update() {
        this.x += this.speedX
        this.y += this.speedY
        if (this.x > canvas.width) this.x = 0
        else if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        else if (this.y < 0) this.y = canvas.height
        const dx = this.x - mouse.x
        const dy = this.y - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < 100 && dist > 0) {
          const ux = dx / dist; const uy = dy / dist
          const force = (100 - dist) / 100
          this.x += ux * force * 2.5
          this.y += uy * force * 2.5
        }
      }
      draw() {
        ctx!.fillStyle = themeRef.current === "dark"
          ? "rgba(47, 112, 255, 0.3)"
          : "rgba(47, 112, 255, 0.2)"
        ctx!.beginPath()
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx!.closePath()
        ctx!.fill()
      }
    }

    const particles: Particle[] = []
    for (let i = 0; i < 100; i++) particles.push(new Particle())

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) { p.update(); p.draw() }
      animId = requestAnimationFrame(animate)
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!prefersReducedMotion) {
      animate()
    } else {
      for (const p of particles) p.draw()
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animId)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full -z-10"
        aria-hidden="true"
      />

      {/* Top nav — ModeToggle aligned right */}
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="container mx-auto flex items-center justify-end px-4 py-6">
          <ModeToggle />
        </div>
      </div>

      {/* Centred content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
            Error 404
          </p>
          <h1 className="text-8xl md:text-9xl font-bold mb-6 leading-none">
            404
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-3">
            This page took a wrong turn somewhere.
          </p>
          <p className="text-sm text-muted-foreground/70 mb-10">
            Maybe it was refactored out of existence, or never existed to begin with.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg transition-transform duration-200 hover:scale-[1.03]"
            >
              <Link href="/">← Back to Home</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-primary text-primary px-8 py-6 text-lg transition-transform duration-200 hover:scale-[1.03]"
            >
              <Link href="/blog">Read the Blog</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
