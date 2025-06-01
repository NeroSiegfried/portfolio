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

    // Keep track of mouse position & whether it's over the canvas
    const mouse = { x: 0, y: 0, isOver: false }

    // Resize canvas to full viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Add mouse listeners to capture cursor position
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.isOver = true
    }
    const handleMouseLeave = () => {
      mouse.isOver = false
    }
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    // Particle class (same as before, but we'll add a “repel” step in update())
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
        // Basic drift
        this.x += this.speedX
        this.y += this.speedY

        // Wrap around edges
        if (this.x > canvas.width) this.x = 0
        else if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        else if (this.y < 0) this.y = canvas.height

        // If the mouse is over the canvas, apply a small repelling force
        if (mouse.isOver) {
          const dx = this.x - mouse.x
          const dy = this.y - mouse.y
          const dist = Math.hypot(dx, dy)

          // If within 100px of cursor, push particle away
          const influenceRadius = 100
          if (dist < influenceRadius && dist > 0) {
            // Normed direction vector:
            const ux = dx / dist
            const uy = dy / dist

            // The “strength” falls off as you get farther from the cursor:
            // so particles right at the cursor get strongest push,
            // and at 100px there's no push.
            const force = (influenceRadius - dist) / influenceRadius

            // Apply a small instantaneous push to the particle’s position
            const pushStrength = 2 // tweak this (e.g. 1.5–3) to taste
            this.x += ux * force * pushStrength
            this.y += uy * force * pushStrength
          }
        }
      }

      draw() {
        if (!ctx) return
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
      // If reduced motion is requested, draw a static snapshot
      for (const p of particles) {
        p.draw()
      }
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
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
