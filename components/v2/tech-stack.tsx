"use client"

import Image from "next/image"
import { technologies } from "@/lib/portfolio-data"
import { SectionHead } from "@/components/v2/primitives"

export function TechStack() {
  const loop = [...technologies, ...technologies]
  return (
    <section id="stack" className="scroll-mt-20 overflow-hidden border-t border-border px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Stack" label="Tools I reach for" title="Tech stack" />
      </div>
      <div className="relative mt-12">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
        <div className="v2-marquee gap-4">
          {loop.map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className="tech-item flex w-32 shrink-0 flex-col items-center gap-3 border border-border/60 px-4 py-6"
            >
              <div className="relative h-10 w-10">
                <Image src={t.logo} alt={t.name} fill sizes="40px" className="tech-logo object-contain" />
              </div>
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
