"use client"

import { motion, useAnimationControls } from "framer-motion"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"

const technologies = [
  { name: "React", logo: "/placeholder.svg?height=80&width=80" },
  { name: "Next.js", logo: "/placeholder.svg?height=80&width=80" },
  { name: "TypeScript", logo: "/placeholder.svg?height=80&width=80" },
  { name: "Node.js", logo: "/placeholder.svg?height=80&width=80" },
  { name: "Tailwind CSS", logo: "/placeholder.svg?height=80&width=80" },
  { name: "MongoDB", logo: "/placeholder.svg?height=80&width=80" },
  { name: "PostgreSQL", logo: "/placeholder.svg?height=80&width=80" },
  { name: "GraphQL", logo: "/placeholder.svg?height=80&width=80" },
  { name: "Docker", logo: "/placeholder.svg?height=80&width=80" },
  { name: "AWS", logo: "/placeholder.svg?height=80&width=80" },
  { name: "Bootstrap", logo: "/placeholder.svg?height=80&width=80" },
]

export default function TechStack() {
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()

  // Duplicate the technologies array to create the infinite loop effect
  const duplicatedTechnologies = [...technologies, ...technologies]

  useEffect(() => {
    // Start the animation when the component mounts
    controls.start({
      x: -1920, // A large enough value to ensure full scroll
      transition: {
        duration: 10,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop",
      },
    })
  }, [controls])

  useEffect(() => {
    // Pause or resume the animation based on hover state
    if (isHovering) {
      controls.stop()
    } else {
      controls.start({
        x: -1920,
        transition: {
          duration: 30,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
        },
      })
    }
  }, [isHovering, controls])

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Tech Stack
        </motion.h2>

        <motion.div
          className="relative overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Add padding to prevent truncation when items scale up */}
          <div className="py-8 px-4 overflow-hidden">
            <motion.div ref={containerRef} className="flex gap-6" animate={controls}>
              {duplicatedTechnologies.map((tech, index) => (
                <motion.div
                  key={`${tech.name}-${index}`}
                  onHoverStart={() => setIsHovering(true)}
                  onHoverEnd={() => setIsHovering(false)}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                >
                  <Card className="flex-shrink-0 p-6 w-36 h-36 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:bg-background/80">
                    <div className="relative w-20 h-20 mb-2">
                      <Image
                        src={tech.logo || "/placeholder.svg"}
                        alt={tech.name}
                        fill
                        className="tech-logo object-contain"
                      />
                    </div>
                    <span className="text-sm font-medium">{tech.name}</span>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
