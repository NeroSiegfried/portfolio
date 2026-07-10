"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Scroll-driven text colour fill (portfoliod). Each word interpolates from muted
 * to full-foreground as the paragraph scrolls up through the viewport, and back
 * again when it scrolls down — the effect is tied to live scroll position, so it
 * "changes and unchanges" with the scroll. Reduced-motion renders it solid.
 */
function Word({
  children,
  progress,
  range,
}: {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [0.18, 1])
  return (
    <span className="relative mr-[0.25em] inline-block">
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  )
}

export function ScrollColorText({
  children,
  className,
  as = "p",
}: {
  children: string
  className?: string
  as?: "p" | "h2" | "h3"
}) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    // Begin as the block enters the lower third, finish before it exits the top third.
    offset: ["start 0.85", "end 0.35"],
  })
  const words = children.split(" ")
  const Tag = motion[as]

  if (reduce) {
    const Plain = as
    return <Plain className={cn("text-foreground", className)}>{children}</Plain>
  }

  return (
    // @ts-expect-error — motion polymorphic tag via string index is fine at runtime
    <Tag ref={ref} className={cn("text-foreground", className)}>
      {words.map((word, i) => {
        const start = i / words.length
        const end = start + 1 / words.length
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        )
      })}
    </Tag>
  )
}
