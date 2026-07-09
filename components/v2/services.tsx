"use client"

import { motion } from "framer-motion"
import { services } from "@/lib/portfolio-data"
import { SectionHead } from "@/components/v2/primitives"

export function Services() {
  return (
    <section className="border-t border-border px-5 py-16 md:px-8 md:py-24">
      <div className="w-full">
        <SectionHead eyebrow="What I do" label="Services" title="How I can help" />
        <div className="mt-12 grid gap-x-12 gap-y-12 sm:grid-cols-2">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="flex items-baseline gap-4 border-t border-border pt-5">
                <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-xl font-semibold tracking-tight md:text-2xl">{s.title}</h3>
              </div>
              <p className="mt-3 pl-8 font-mono text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
