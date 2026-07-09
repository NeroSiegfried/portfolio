"use client"

import { useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { projects, type Project } from "@/lib/portfolio-data"
import { Eyebrow } from "@/components/v2/primitives"
import { HoverSlide } from "@/components/v2/hover-slide"
import { useBasePath, withBase } from "@/lib/base-path"
import { cn } from "@/lib/utils"

const WEB_SPREAD_IDS = new Set([11, 10, 9, 1])
const EASE = [0.16, 1, 0.3, 1] as const

function coverFor(p: Project): string | null {
  if (WEB_SPREAD_IDS.has(p.id)) return `/projects/${p.id}-spread.jpg`
  if (p.pictureSlides?.length) return p.pictureSlides[0]
  return null
}

export function Projects() {
  const [active, setActive] = useState(0)
  const project = projects[active]
  const cover = coverFor(project)
  const basePath = useBasePath()
  const articleHref = project.blogPostSlug ? withBase(basePath, `/blog/${project.blogPostSlug}`) : undefined
  const primaryHref = project.liveUrl ?? articleHref ?? project.githubUrl ?? "#"
  const metaLink = "inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"

  return (
    <section id="work" className="scroll-mt-16 border-t border-border">
      {/* section labels */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-8">
        <Eyebrow>Work</Eyebrow>
        <Eyebrow>{projects.length} Selected projects</Eyebrow>
      </div>

      <div className="grid md:grid-cols-[minmax(300px,34%)_1fr]">
        {/* LEFT: title + subtitle + thumbnail selector */}
        <div className="order-2 border-border px-5 py-10 md:order-1 md:border-r md:px-8 md:py-14">
          <h2 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Selected work</h2>
          <div className="mt-6 flex gap-4">
            <span className="w-[3px] shrink-0 bg-primary" aria-hidden />
            <p className="max-w-xs font-mono text-sm leading-relaxed text-muted-foreground">
              Products I&rsquo;ve designed, built and shipped — each with a build log on the blog.
            </p>
          </div>

          <div className="mt-9 flex flex-col">
            {projects.map((p, i) => {
              const c = coverFor(p)
              const on = i === active
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className="group flex items-center gap-4 border-t border-border py-3 text-left last:border-b"
                >
                  <span className={cn("relative block h-12 w-12 shrink-0 overflow-hidden border bg-secondary transition-colors", on ? "border-primary" : "border-border")}>
                    {c ? (
                      <Image src={c} alt="" fill sizes="48px" className="object-cover object-top" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-mono text-[0.6rem] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    )}
                  </span>
                  {on ? <span className="v2-spin-square h-3 w-3 shrink-0 bg-primary" aria-hidden /> : <span className="h-3 w-3 shrink-0" aria-hidden />}
                  <span className={cn("truncate font-mono text-xs uppercase tracking-[0.1em] transition-colors", on ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                    {p.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT: large image viewer that slides on select */}
        <div className="relative order-1 min-h-[52vh] overflow-hidden bg-secondary md:order-2 md:min-h-[78vh]">
          <AnimatePresence mode="wait">
            <motion.a
              key={project.id}
              href={primaryHref}
              target={project.liveUrl ? "_blank" : undefined}
              rel="noopener noreferrer"
              data-cursor
              data-cursor-label={project.liveUrl ? "Visit" : "View"}
              className="v2-media absolute inset-0 block"
              initial={{ x: "5%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-5%", opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              {cover ? (
                <Image src={cover} alt={`${project.title} — preview`} fill priority sizes="66vw" className="object-cover object-top" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-10">
                  <span className="text-center font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">{project.technologies.join("  ·  ")}</span>
                </div>
              )}
            </motion.a>
          </AnimatePresence>

          {/* meta bar over the image */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 bg-gradient-to-t from-black/70 to-transparent px-5 pb-5 pt-16 md:px-8 md:pb-8">
            <div className="pointer-events-auto">
              <span className="font-mono text-xs text-white/70">{String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-white md:text-4xl">{project.title}</h3>
            </div>
            <div className="pointer-events-auto flex flex-wrap items-center gap-x-5 gap-y-2">
              {articleHref ? <a href={articleHref} className={cn(metaLink, "text-white/80 hover:text-white")}><HoverSlide>Read Article</HoverSlide></a> : null}
              {project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={cn(metaLink, "text-white/80 hover:text-white")}><HoverSlide>Repository</HoverSlide></a> : null}
              {project.liveUrl ? (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-primary-foreground">
                  <HoverSlide>Live Site</HoverSlide> <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* active project description strip */}
      <div className="border-t border-border px-5 py-6 md:px-8">
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{project.description}</p>
      </div>
    </section>
  )
}
