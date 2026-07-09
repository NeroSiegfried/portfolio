"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowUpRight, BookOpen, ExternalLink, Github } from "lucide-react"
import { projects, type Project } from "@/lib/portfolio-data"
import { SectionHead } from "@/components/v2/primitives"
import { Reveal } from "@/components/v2/reveal"
import { HoverSlide } from "@/components/v2/hover-slide"
import { useBasePath, withBase } from "@/lib/base-path"

const WEB_SPREAD_IDS = new Set([11, 10, 9, 1])

function coverFor(p: Project): string | null {
  if (WEB_SPREAD_IDS.has(p.id)) return `/projects/${p.id}-spread.png`
  if (p.pictureSlides?.length) return p.pictureSlides[0]
  return null
}

const metaLink = "inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary"

function ProjectBlock({ project, index }: { project: Project; index: number }) {
  const basePath = useBasePath()
  const cover = coverFor(project)
  const articleHref = project.blogPostSlug ? withBase(basePath, `/blog/${project.blogPostSlug}`) : undefined
  const primaryHref = project.liveUrl ?? articleHref ?? project.githubUrl ?? "#"
  const num = String(index + 1).padStart(2, "0")

  return (
    <Reveal className="border-t border-border pt-8">
      <div className="grid gap-5 md:grid-cols-[3rem_1fr] md:gap-8">
        <div className="font-mono text-sm text-muted-foreground">{num}</div>
        <div>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <h3 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">{project.title}</h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.slice(0, 5).map((t) => (
                <span key={t} className="border border-border px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">{project.description}</p>

          {cover ? (
            <a
              href={primaryHref}
              target={project.liveUrl ? "_blank" : undefined}
              rel="noopener noreferrer"
              data-cursor
              data-cursor-label={project.liveUrl ? "Visit" : "View"}
              className="v2-media mt-8 block aspect-[16/9] w-full border border-border bg-secondary"
            >
              <Image
                src={cover}
                alt={`${project.title} — responsive spread`}
                width={1600}
                height={1000}
                sizes="(max-width: 900px) 100vw, 1100px"
                className="h-full w-full object-contain object-center p-4 md:p-8"
              />
            </a>
          ) : (
            <div className="mt-8 flex aspect-[16/5] w-full items-center justify-center border border-border bg-secondary">
              <span className="px-6 text-center font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {project.technologies.join("  ·  ")}
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
            {articleHref ? (
              <a href={articleHref} className={metaLink}>
                <BookOpen className="h-4 w-4" /> <HoverSlide>Read Article</HoverSlide>
              </a>
            ) : null}
            {project.githubUrl ? (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={metaLink}>
                <Github className="h-4 w-4" /> <HoverSlide>Repository</HoverSlide>
              </a>
            ) : null}
            {project.liveUrl ? (
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-primary">
                <ExternalLink className="h-4 w-4" /> <HoverSlide>Live Site</HoverSlide>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export function Projects() {
  const [visible, setVisible] = useState(3)
  const btn = "border border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors hover:border-primary hover:text-primary"

  return (
    <section id="work" className="scroll-mt-20 border-t border-border px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="Work" label="Selected projects" title="Things I've built" />
        <div className="mt-14 space-y-16 md:space-y-24">
          {projects.slice(0, visible).map((p, i) => (
            <ProjectBlock key={p.id} project={p} index={i} />
          ))}
        </div>
        {visible < projects.length ? (
          <div className="mt-16 flex flex-wrap gap-4">
            <button type="button" onClick={() => setVisible((v) => Math.min(v + 3, projects.length))} className={btn}>
              <HoverSlide>Show more</HoverSlide>
            </button>
            <button type="button" onClick={() => setVisible(projects.length)} className={btn}>
              <HoverSlide>Show all</HoverSlide>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
