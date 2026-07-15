"use client"

import Image from "next/image"
import Link from "next/link"
import { Eyebrow } from "@/components/v2/primitives"
import { ScrollColorText } from "@/components/v2/scroll-color-text"
import { useBasePath, withBase } from "@/lib/base-path"

export function About() {
  const basePath = useBasePath()
  return (
    <section id="about" className="scroll-mt-16 border-t border-border px-4 py-14 md:px-6 md:py-20">
      <div className="w-full">
        <div className="flex items-center justify-between border-b border-border pb-5">
          <Eyebrow>About</Eyebrow>
          <Eyebrow className="hidden sm:block">Who I am</Eyebrow>
        </div>

        <ScrollColorText className="mt-10 max-w-5xl font-display text-2xl font-medium leading-[1.25] tracking-tight sm:text-3xl md:text-[2.5rem] md:leading-[1.15]">
          {"I’m a full-stack developer and software engineer in London, turning complex problems into elegant, production-ready code."}
        </ScrollColorText>

        <div className="mt-12 grid gap-8 min-[1100px]:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,220px)] min-[1100px]:gap-12 xl:gap-16">
          <div className="v2-media relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden border border-border min-[1100px]:mx-0 min-[1100px]:max-w-none">
            <Image src="/victor-nabasu.jpg" alt="Victor Nabasu" fill sizes="(max-width: 1100px) 80vw, 300px" className="object-cover object-top" />
          </div>
          <div className="space-y-5 text-justify text-base leading-relaxed text-muted-foreground min-[1100px]:pt-2 min-[1100px]:text-left">
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
          {/* Meta column — fills the right third with quick facts. */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 self-start border-t border-border pt-6 font-mono text-xs min-[1100px]:grid-cols-1 min-[1100px]:border-l min-[1100px]:border-t-0 min-[1100px]:pl-6 min-[1100px]:pt-2">
            {[
              { k: "Now", v: "Open to roles" },
              { k: "Based", v: "London, UK" },
              { k: "Focus", v: "Full-stack · systems" },
              { k: "Education", v: "MSc Adv. SW Eng · KCL" },
            ].map((m) => (
              <div key={m.k}>
                <dt className="uppercase tracking-[0.14em] text-muted-foreground">{m.k}</dt>
                <dd className="mt-1 text-foreground">{m.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
