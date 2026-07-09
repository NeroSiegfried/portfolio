"use client"

import { motion } from "framer-motion"
import { stats } from "@/lib/portfolio-data"

export function Stats() {
  return (
    <section className="border-t border-border px-5 md:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="border-border px-1 py-10 [&:not(:nth-child(2n))]:border-r md:py-14 md:[&:not(:last-child)]:border-r"
          >
            <div className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{s.value}</div>
            <div className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
