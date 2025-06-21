// components/footer.tsx
"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useEffect } from "react"
import { useTheme } from "next-themes"

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1])
  const { theme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Circuit board animation
    const nodes: Array<{ x: number; y: number; connections: number[] }> = []
    const traces: Array<{ from: number; to: number; progress: number; speed: number }> = []
    
    // Create nodes
    for (let i = 0; i < 15; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        connections: []
      })
    }

    // Create connections
    for (let i = 0; i < nodes.length; i++) {
      const numConnections = Math.floor(Math.random() * 3) + 1
      for (let j = 0; j < numConnections; j++) {
        const target = Math.floor(Math.random() * nodes.length)
        if (target !== i && !nodes[i].connections.includes(target)) {
          nodes[i].connections.push(target)
          traces.push({
            from: i,
            to: target,
            progress: Math.random(),
            speed: 0.005 + Math.random() * 0.01
          })
        }
      }
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Set theme-based colors
      const bgColor = theme === "dark" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"
      const nodeColor = theme === "dark" ? "#00ff88" : "#0066cc"
      const traceColor = theme === "dark" ? "#00cc66" : "#0099ff"
      const pulseColor = theme === "dark" ? "#00ffaa" : "#00aaff"

      // Draw traces
      traces.forEach(trace => {
        const fromNode = nodes[trace.from]
        const toNode = nodes[trace.to]
        
        ctx.strokeStyle = traceColor
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.lineDashOffset = -Date.now() * 0.01
        
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.stroke()
        
        // Animated pulse along trace
        const pulseX = fromNode.x + (toNode.x - fromNode.x) * trace.progress
        const pulseY = fromNode.y + (toNode.y - fromNode.y) * trace.progress
        
        ctx.fillStyle = pulseColor
        ctx.beginPath()
        ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2)
        ctx.fill()
        
        trace.progress += trace.speed
        if (trace.progress > 1) {
          trace.progress = 0
        }
      })

      // Draw nodes
      nodes.forEach(node => {
        ctx.fillStyle = nodeColor
        ctx.beginPath()
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2)
        ctx.fill()
        
        // Node pulse effect
        ctx.strokeStyle = pulseColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(node.x, node.y, 10 + Math.sin(Date.now() * 0.003) * 5, 0, Math.PI * 2)
        ctx.stroke()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [theme])

  return (
    <motion.footer
      ref={footerRef}
      className="relative py-12 overflow-hidden bg-primary text-primary-foreground"
      style={{ opacity }}
    >
      {/* Circuit board background animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-40"
        style={{ zIndex: 0 }}
      />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold">Victor Nabasu</h3>
            <p className="text-primary-foreground/80">
              Full Stack Developer & Engineer
            </p>
          </div>

          <div className="flex gap-6">
            <a
              href="https://github.com/NeroSiegfried"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-github"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                <path d="M9 18c-4.51 2-5-2-7-2"></path>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/victor-nabasu-8b5223212/"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-linkedin"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect width="4" height="12" x="2" y="9"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
            <a
              href="https://twitter.com/NeroSiegfried"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              aria-label="Twitter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-twitter"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center">
          <p className="text-primary-foreground/80">
            &copy; {new Date().getFullYear()} Victor Nabasu. All rights
            reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
