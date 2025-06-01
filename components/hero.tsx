// components/Hero.tsx
"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import { useTheme } from "next-themes"

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Start the mouse far away; we'll update it when it's over the canvas
    const mouse = { x: -9999, y: -9999 }

    // Resize canvas to fill its parent (Hero is h-screen)
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Every time the cursor moves, compute its position relative to the canvas bounding box.
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      // If the cursor is within the visible part of this canvas element:
      if (mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height) {
        mouse.x = mx
        mouse.y = my
      } else {
        // If the cursor is outside the canvas area, push it far away
        mouse.x = -9999
        mouse.y = -9999
      }
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Particle class, same as before but using updated mouse.x/mouse.y logic
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 1 // radius between 1px and 3px
        this.speedX = Math.random() * 0.5 - 0.25
        this.speedY = Math.random() * 0.5 - 0.25
      }

      update() {
        // 1) Drift
        this.x += this.speedX
        this.y += this.speedY

        // 2) Wrap around edges
        if (this.x > canvas.width) this.x = 0
        else if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        else if (this.y < 0) this.y = canvas.height

        // 3) Compute distance to mouse every frame
        const dx = this.x - mouse.x
        const dy = this.y - mouse.y
        const dist = Math.hypot(dx, dy)

        const influenceRadius = 100
        if (dist < influenceRadius && dist > 0) {
          // Normalize
          const ux = dx / dist
          const uy = dy / dist
          // Strength falls off from 1 at dist=0 → 0 at dist=100
          const force = (influenceRadius - dist) / influenceRadius
          const pushStrength = 2.5 // tweak for a more noticeable bounce

          this.x += ux * force * pushStrength
          this.y += uy * force * pushStrength
        }
      }

      draw() {
        ctx.fillStyle =
          resolvedTheme === "dark"
            ? "rgba(47, 112, 255, 0.3)"
            : "rgba(47, 112, 255, 0.2)"
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fill()
      }
    }

    // Initialize particles
    const particles: Particle[] = []
    const particleCount = 100

    const initParticles = () => {
      particles.length = 0
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    let animationId: number
    const animate = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.update()
        p.draw()
      }
      animationId = requestAnimationFrame(animate)
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    initParticles()
    if (!prefersReducedMotion) {
      animate()
    } else {
      // If reduced motion is requested, just draw one static frame
      for (const p of particles) p.draw()
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [resolvedTheme])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Fullscreen canvas behind everything */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full -z-10"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Victor Nabasu</h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
            MSc Advanced Software Engineering student & Full Stack Developer
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg transition-transform duration-200 hover:scale-[1.03]"
              onClick={() => scrollToSection("projects")}
            >
              View Projects
            </Button>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 px-8 py-6 text-lg transition-transform duration-200 hover:scale-[1.03]"
              onClick={() => scrollToSection("contact")}
            >
              Contact Me
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => scrollToSection("about")}
          aria-label="Scroll to About section"
        >
          <ArrowDown className="h-6 w-6" />
        </Button>
      </div>
    </section>
  )
}
