"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowDown, ArrowUpRight } from "lucide-react"
import { Eyebrow } from "@/components/v2/primitives"
import { useBasePath, withBase } from "@/lib/base-path"

export function Hero() {
  const basePath = useBasePath()
  return (
    <section id="top" className="relative flex min-h-[92vh] flex-col justify-center px-6 pb-16 pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Eyebrow className="mb-6 block">Software Engineer · Full-Stack Developer · London</Eyebrow>
          <h1 className="font-display font-semibold tracking-[-0.03em] text-[clamp(3rem,11vw,9.5rem)] leading-[0.92]">
            Victor
            <br />
            Nabasu
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            I build production-grade web products end to end — from the data model to a polished,
            responsive interface. Currently on a CS-from-scratch quest, documented on the blog.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#work"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              View Work
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <Link
              href={withBase(basePath, "/blog")}
              className="group inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:border-primary hover:text-primary"
            >
              Read the Blog
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </div>
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground">
        <ArrowDown className="h-5 w-5" />
      </div>
    </section>
  )
}
