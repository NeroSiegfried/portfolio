"use client"

import Link from "next/link"
import { ArrowDown, ArrowUpRight } from "lucide-react"
import { Eyebrow } from "@/components/v2/primitives"
import { Reveal, RevealLines } from "@/components/v2/reveal"
import { HoverSlide } from "@/components/v2/hover-slide"
import { useBasePath, withBase } from "@/lib/base-path"

const ROLES = ["Full-Stack Web", "APIs & Backends", "Systems & C", "Data / ML", "Next.js", "TypeScript", "PostgreSQL", "AI-Assisted Delivery"]

export function Hero() {
  const basePath = useBasePath()
  return (
    <section id="top" className="relative min-h-screen overflow-hidden">
      {/* Placeholder for the hero visual (bleeds to the right frame edge, faded left). */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block lg:w-[42%]">
        <div className="relative h-full w-full overflow-hidden border-l border-dashed border-border bg-secondary [mask-image:linear-gradient(to_right,transparent,black_24%)]">
          <div className="absolute inset-0 flex items-center justify-end p-10">
            <p className="max-w-[16rem] text-right font-mono text-[0.7rem] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
              Placeholder — hero visual
              <span className="mt-3 block normal-case tracking-normal opacity-70">
                A bold, editorially-lit portrait or an abstract tech image (light-trails / fibre
                optics / circuitry), high-contrast with one dominant accent — full-bleed behind the
                name.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Rotating square accent (portfolie). */}
      <div className="v2-spin-square absolute right-8 top-28 hidden h-14 w-14 border border-primary md:block" aria-hidden />

      <div className="relative flex min-h-screen flex-col justify-center px-5 pb-28 pt-32 md:px-8">
        <Reveal y={12} mount>
          <Eyebrow className="mb-6 block">Software Engineer &middot; Full-Stack Developer &middot; London</Eyebrow>
        </Reveal>

        <h1 className="font-display font-semibold tracking-[-0.04em] text-white mix-blend-difference text-[clamp(3rem,12vw,11rem)] leading-[0.85]">
          <RevealLines lines={["Victor", "Nabasu"]} mount />
        </h1>

        <div className="mt-10 max-w-xl">
          <Reveal delay={0.2} mount>
            <p className="text-lg leading-relaxed text-muted-foreground">
              I build production-grade web products end to end — from the data model to a polished,
              responsive interface — and write about the process on the blog.
            </p>
          </Reveal>
          <Reveal delay={0.3} mount className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#work" className="group inline-flex items-center gap-2 bg-primary px-6 py-3.5 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground">
              <HoverSlide>View Work</HoverSlide>
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <Link href={withBase(basePath, "/blog")} className="group inline-flex items-center gap-2 border border-border px-6 py-3.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:border-primary hover:text-primary">
              <HoverSlide>Read the Blog</HoverSlide>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </div>

      {/* Contained role marquee (clipped to the frame with edge fades). */}
      <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background/60 backdrop-blur-sm">
        <div className="v2-marquee-mask px-5 py-4 md:px-8">
          <div className="v2-marquee gap-8">
            {[...ROLES, ...ROLES].map((r, i) => (
              <span key={i} className="flex shrink-0 items-center gap-8 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {r} <span className="text-primary">&#47;&#47;</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
