"use client"

import { motion } from "framer-motion"
import { services } from "@/lib/portfolio-data"
import { SectionHead } from "@/components/v2/primitives"

export function Services() {
  return (
    <section className="border-t border-border px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
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
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <h3 className="font-display text-xl font-semibold tracking-tight">{s.title}</h3>
              </div>
              <p className="mt-3 pl-5 font-mono text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
