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
    <section id="top" className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pb-28 pt-32">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal y={12} mount>
          <Eyebrow className="mb-6 block">Software Engineer &middot; Full-Stack Developer &middot; London</Eyebrow>
        </Reveal>

        <h1 className="font-display font-semibold tracking-[-0.04em] text-[clamp(3.25rem,13vw,12rem)] leading-[0.86]">
          <RevealLines lines={["Victor", "Nabasu"]} mount />
        </h1>

        <div className="mt-12 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <Reveal delay={0.2} mount>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              I build production-grade web products end to end — from the data model to a polished,
              responsive interface. Currently on a CS-from-scratch quest, documented on the blog.
            </p>
          </Reveal>
          <Reveal delay={0.3} mount className="flex flex-wrap items-center gap-3">
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

      {/* Scrolling role marquee — motion + editorial */}
      <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-border py-4">
        <div className="v2-marquee gap-8">
          {[...ROLES, ...ROLES].map((r, i) => (
            <span key={i} className="flex shrink-0 items-center gap-8 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {r} <span className="text-primary">&#47;&#47;</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
