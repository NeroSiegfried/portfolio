"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eyebrow } from "@/components/v2/primitives"
import { useBasePath, withBase } from "@/lib/base-path"

export function About() {
  const basePath = useBasePath()
  return (
    <section id="about" className="scroll-mt-24 border-t border-border px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between border-b border-border pb-5">
          <Eyebrow>About</Eyebrow>
          <Eyebrow className="hidden sm:block">Who I am</Eyebrow>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 max-w-4xl font-display text-2xl font-medium leading-[1.25] tracking-tight sm:text-3xl md:text-[2.5rem] md:leading-[1.15]"
        >
          I&rsquo;m a full-stack developer and software engineer in London, turning complex problems
          into elegant, production-ready code.
        </motion.p>

        <div className="mt-14 grid gap-10 md:grid-cols-[320px_1fr] md:gap-16">
          <div className="v2-media relative aspect-square w-full max-w-xs overflow-hidden border border-border md:max-w-none">
            <Image src="/victor-nabasu.jpg" alt="Victor Nabasu" fill sizes="(max-width: 768px) 80vw, 320px" className="object-cover" />
          </div>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              I&rsquo;ve worked on projects ranging from satellite modeling to domain-specific
              languages and AI-powered web apps. In my free time I leetcode, play Japanese RPGs, and
              explore new AI and DevOps tech.
            </p>
            <p>
              My first degree is in Electrical Engineering, so I&rsquo;m on a deliberate &ldquo;CS
              from scratch&rdquo; quest to deepen my fundamentals — building databases, DSLs and
              systems from the ground up and writing about each step on my{" "}
              <Link href={withBase(basePath, "/blog")} className="text-primary underline-offset-4 hover:underline">
                blog
              </Link>
              .
            </p>
            <p className="text-foreground">
              Currently seeking new opportunities to apply my skills and grow as a developer. If you
              have an interesting project or role in mind, let&rsquo;s connect.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
