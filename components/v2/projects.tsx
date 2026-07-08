"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, ChevronDown, ExternalLink, Github, LayoutGrid, Plus } from "lucide-react"
import { projects, type Project } from "@/lib/portfolio-data"
import { WebPreview, PicturePreview } from "@/components/v2/device-showcase"
import { SectionHead } from "@/components/v2/primitives"
import { useBasePath, withBase } from "@/lib/base-path"
import { cn } from "@/lib/utils"

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </span>
  )
}

function Actions({ project }: { project: Project }) {
  const basePath = useBasePath()
  const btn = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors"
  return (
    <div className="mb-10 mt-8 flex flex-wrap gap-3">
      {project.blogPostSlug ? (
        <a href={withBase(basePath, `/blog/${project.blogPostSlug}`)} className={cn(btn, "border border-border hover:border-primary hover:text-primary")}>
          <BookOpen className="h-4 w-4" /> Read Article
        </a>
      ) : null}
      {project.githubUrl ? (
        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={cn(btn, "border border-border hover:border-primary hover:text-primary")}>
          <Github className="h-4 w-4" /> Repository
        </a>
      ) : null}
      {project.liveUrl ? (
        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={cn(btn, "bg-primary text-primary-foreground hover:scale-[1.03]")}>
          <ExternalLink className="h-4 w-4" /> Live Site
        </a>
      ) : null}
    </div>
  )
}

export function Projects() {
  const [visible, setVisible] = useState(3)
  const [activeId, setActiveId] = useState<number | null>(projects[0]?.id ?? null)
  const [mountedIds, setMountedIds] = useState<Set<number>>(() => new Set(projects.slice(0, 3).map((p) => p.id)))
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const visibleProjects = projects.slice(0, visible)

  const toggle = (id: number) => {
    if (id === activeId) {
      setActiveId(null)
      return
    }
    setActiveId(id)
    setMountedIds((prev) => new Set([...prev, id]))
    setTimeout(() => itemRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 380)
  }

  return (
    <section id="work" className="scroll-mt-20 border-t border-border px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Work" label="Selected projects" title="Things I've built" />

        <div className="mt-2">
          {visibleProjects.map((project, idx) => {
            const isOpen = activeId === project.id
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                ref={(el) => {
                  if (el) itemRefs.current.set(project.id, el)
                  else itemRefs.current.delete(project.id)
                }}
                className="scroll-mt-24 border-b border-border"
              >
                <button
                  type="button"
                  onClick={() => toggle(project.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-4 py-7 text-left md:gap-6"
                >
                  <span className="pt-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-4">
                      <span className={cn("font-display text-2xl font-semibold tracking-tight transition-colors md:text-3xl", isOpen && "text-primary")}>
                        {project.title}
                      </span>
                      <Plus className={cn("mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-45 text-primary")} />
                    </span>
                    <span className="mt-2 block max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-2">
                      {project.technologies.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </span>
                  </span>
                </button>

                <div className="v2-accordion" data-open={isOpen}>
                  <div>
                    {mountedIds.has(project.id) ? (
                      <>
                        {project.showcaseMode === "web" ? (
                          <WebPreview project={project} projectPosition={idx} />
                        ) : (
                          <PicturePreview project={project} />
                        )}
                        <Actions project={project} />
                      </>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {visible < projects.length ? (
          <div className="mt-12 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setVisible((v) => Math.min(v + 3, projects.length))}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors hover:border-primary hover:text-primary"
            >
              Show more <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setVisible(projects.length)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors hover:border-primary hover:text-primary"
            >
              Show all <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
