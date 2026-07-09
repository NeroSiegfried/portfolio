"use client"

import Image from "next/image"
import { technologies } from "@/lib/portfolio-data"
import { Eyebrow } from "@/components/v2/primitives"

export function TechStack() {
  const loop = [...technologies, ...technologies]
  return (
    <section id="stack" className="scroll-mt-16 border-t border-border px-5 py-16 md:px-8 md:py-24">
      <div className="flex items-end justify-between gap-6 border-b border-border pb-5">
        <div>
          <Eyebrow className="mb-3 block">Stack</Eyebrow>
          <h2 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Tech stack</h2>
        </div>
        <Eyebrow className="hidden pb-1 sm:block">Tools I reach for</Eyebrow>
      </div>

      {/* Contained marquee — clipped to this column with edge fades. */}
      <div className="v2-marquee-mask mt-10">
        <div className="v2-marquee gap-3 py-2">
          {loop.map((t, i) => (
            <div key={`${t.name}-${i}`} className="tech-item flex w-32 shrink-0 flex-col items-center gap-3 border border-border px-4 py-6">
              <div className="relative h-9 w-9">
                <Image src={t.logo} alt={t.name} fill sizes="36px" className="tech-logo object-contain" />
              </div>
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
