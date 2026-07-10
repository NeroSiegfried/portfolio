"use client"

import Image from "next/image"
import { useRef } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import layouts from "@/lib/masonry-layout.json"
import { cn } from "@/lib/utils"

interface Tile { src: string; c: number; r: number; w: number; h: number; viewport: string }
interface Layout { cw: number; ch: number; tiles: Tile[] }

const LAYOUTS = layouts as Record<string, Layout>

export function hasMasonry(id: number) {
  return Boolean(LAYOUTS[String(id)]?.tiles?.length)
}

/**
 * Isometric masonry mockup: screenshots of a project's site (home in the centre,
 * deeper pages spreading outward) at four viewports — mobile, tablet, desktop and
 * extra-wide — packed onto one grid where every tile spans an integer number of
 * cells, tiles are one cell apart, and edges land on grid lines (so they're flush
 * with the drawn isometric lines). The whole compiled grid tilts onto an
 * axonometric plane and scales as ONE unit on scroll; the tiles stay static.
 */
export function MasonryMockup({ id, className }: { id: number; className?: string }) {
  const layout = LAYOUTS[String(id)]
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const scaleMV = useTransform(scrollYProgress, [0, 0.5, 1], [0.86, 1.02, 1.22])
  const scale = reduce ? 1 : scaleMV

  if (!layout) return null

  return (
    <div ref={ref} className={cn("v2-mason", className)}>
      <motion.div className="v2-mason__scale" style={{ scale }}>
        <div
          className="v2-mason__plane"
          style={{ ["--cw" as string]: layout.cw, ["--ch" as string]: layout.ch }}
        >
          {layout.tiles.map((t, i) => (
            <div
              key={i}
              className="v2-mason__tile"
              style={{ gridColumn: `${t.c + 1} / span ${t.w}`, gridRow: `${t.r + 1} / span ${t.h}` }}
            >
              <Image src={t.src} alt="" fill sizes="360px" className="object-cover object-top" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
