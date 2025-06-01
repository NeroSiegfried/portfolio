// components/tech-stack.tsx
"use client"

import { useState, useEffect } from "react"
import { motion, useAnimationControls, useMotionValue } from "framer-motion"
import { Card } from "@/components/ui/card"
import Image from "next/image"

export default function TechStack() {
  const [isHovering, setIsHovering] = useState(false)
  const controls = useAnimationControls()
  const x = useMotionValue(0)

  // 19 tech items with color SVGs
  const technologies = [
    { name: "Python",        logo: "/logos/python.svg" },
    { name: "C",             logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg" },
    { name: "C++",           logo: "/logos/cpp.svg" },
    { name: "SQL",           logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-plain-wordmark.svg" },
    { name: "JavaScript",    logo: "/logos/javascript.svg" },
    { name: "Java",          logo: "/logos/java.svg" },
    { name: "TypeScript",    logo: "/logos/typescript.svg" },
    { name: "Bash",          logo: "/logos/bash.svg" },
    { name: "Xtext / Xtend", logo: "/logos/xtend.svg" },
    { name: "PostgreSQL",    logo: "/logos/postgres.svg" },
    { name: "React",         logo: "/logos/react.svg" },
    { name: "Node.js",       logo: "/logos/nodejs.svg" },
    { name: "NumPy",         logo: "/logos/numpy.svg" },
    { name: "Pandas",        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg" },
    { name: "Scikit-Learn",  logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/scikitlearn/scikitlearn-original.svg" },
    { name: "Docker",        logo: "/logos/docker.svg" },
    { name: "AWS",           logo: "/logos/aws.svg" },
    { name: "Tailwind CSS",  logo: "/logos/tailwind.svg" },
    { name: "MongoDB",       logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-plain-wordmark.svg" },
    { name: "GraphQL",       logo: "/logos/graphql.svg" },
  ]

  // Duplicate them to 38 cards
  const loopItems = [...technologies, ...technologies]

  // Width of one set = (19 cards × 144px) + (18 gaps × 24px) = 3360px
  const ONE_SET_WIDTH = 3360
  const DURATION = 20 // seconds for full scroll

  // Encapsulate the looping animation so we can call it from multiple places
  const startLoop = () => {
    controls.start({
      x: -ONE_SET_WIDTH,
      transition: {
        duration: DURATION,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      },
    })
  }

  // On mount: start the initial loop
  useEffect(() => {
    startLoop()
  }, [controls])

  // On hover: pause; on unhover: restart the loop from current position
  useEffect(() => {
    if (isHovering) {
      controls.stop()
    } else {
      const position = x.get()
      // Calculate remaining distance and adjust duration proportionally
      const remainingDistance = ONE_SET_WIDTH + position // position is negative or zero
      const remainingDuration = (remainingDistance / ONE_SET_WIDTH) * DURATION

      controls.start({
        x: -ONE_SET_WIDTH,
        transition: {
          duration: remainingDuration,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        },
      })
    }
  }, [isHovering, controls, x])

  // Listener: when x reaches (or goes below) -ONE_SET_WIDTH, restart the loop;
  // cleanup also resets x to 0
  useEffect(() => {
    const unsubscribe = x.onChange((latest) => {
      if (latest <= -ONE_SET_WIDTH + 3) {
        // Stop the current animation
        controls.stop()
        x.set(0) // Reset x to 0
        // Restart the loop from the beginning
        startLoop()
      }
    })
    return () => {
      unsubscribe()
    }
  }, [x, controls])

  return (
    <section id="tech" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-center mb-16 text-4xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Tech Stack
        </motion.h2>

        <motion.div
          className="relative overflow-hidden py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex gap-6"
            style={{ x }}
            animate={controls}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {loopItems.map((tech, idx) => (
              <motion.div
                key={`${tech.name}-${idx}`}
                whileHover={{ scale: 1.1, zIndex: 10 }}
              >
                <Card className="tech-item flex-shrink-0 w-36 h-36 p-6 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:bg-background/80">
                  <div className="relative w-20 h-20 mb-2">
                    <Image
                      src={tech.logo}
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
        </motion.div>
      </div>
    </section>
  )
}
