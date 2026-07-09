"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import Image from "next/image"
import { featuredProjects, type Project } from "@/lib/portfolio-data"
import { Eyebrow } from "@/components/v2/primitives"
import { AnimatedArrow } from "@/components/v2/animated-arrow"
import { useBasePath, withBase } from "@/lib/base-path"
import { cn } from "@/lib/utils"

function coverFor(p: Project): string | null {
  if (p.showcaseMode === "web") return `/projects/${p.id}-spread.jpg`
  if (p.pictureSlides?.length) return p.pictureSlides[0]
  return null
}

// Thumbnail column geometry: each thumb is 64px tall with a 12px gap → 76px pitch.
const THUMB_PITCH = 76

export function Projects() {
  const projects = featuredProjects
  const basePath = useBasePath()
  const [active, setActive] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx))
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    )
    itemRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  const scrollTo = (i: number) => itemRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })

  return (
    <section id="work" className="scroll-mt-16 border-t border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-6">
        <Eyebrow>Work</Eyebrow>
        <Eyebrow>{projects.length} Selected projects</Eyebrow>
      </div>

      <div className="grid md:grid-cols-[minmax(280px,32%)_1fr]">
        {/* LEFT — sticky metadata: title, subtitle, counter, vertical thumbnails + square */}
        <div className="border-border px-4 py-10 md:sticky md:top-24 md:self-start md:border-r md:px-6 md:py-14">
          <h2 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Selected work</h2>
          <div className="mt-6 flex gap-4">
            <span className="w-[3px] shrink-0 bg-primary" aria-hidden />
            <p className="max-w-xs font-mono text-sm leading-relaxed text-muted-foreground">
              Recent websites I&rsquo;ve designed, built and shipped — each with a build log on the blog.
            </p>
          </div>

          <p className="mt-8 font-mono text-xs tracking-[0.1em] text-muted-foreground">
            {String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </p>

          {/* Vertical thumbnails; the active one pushes right, and a single persistent
              rotating marker slides down to sit just past it (so it's never covered). */}
          <div className="relative mt-5 hidden flex-col gap-3 md:flex">
            {projects.map((p, i) => {
              const c = coverFor(p)
              const on = i === active
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`View ${p.title}`}
                  onClick={() => scrollTo(i)}
                  className={cn(
                    "relative block h-16 w-16 shrink-0 overflow-hidden border bg-secondary transition-[transform,border-color] duration-500",
                    on ? "translate-x-3 border-primary" : "border-border",
                  )}
                >
                  {c ? <Image src={c} alt="" fill sizes="64px" className="object-cover object-top" /> : null}
                </button>
              )
            })}
            <span
              aria-hidden
              className="v2-thumb-marker"
              style={{ "--mk-y": `${active * THUMB_PITCH}px`, "--mk-rot": `${active * 45}deg` } as CSSProperties}
            />
          </div>
        </div>

        {/* RIGHT — scrolling list of hero images, with margin between them */}
        <div className="flex flex-col md:gap-6 md:p-5">
          {projects.map((p, i) => {
            const cover = coverFor(p)
            const hasArticle = Boolean(p.blogPostSlug)
            const href = hasArticle ? withBase(basePath, `/blog/${p.blogPostSlug}`) : (p.liveUrl ?? p.githubUrl ?? "#")
            const cta = hasArticle ? "Read build log" : "Visit site"
            return (
              <div key={p.id} ref={(el) => { itemRefs.current[i] = el }} data-idx={i} className="border-b border-border last:border-b-0 md:border-b-0">
                <a
                  href={href}
                  target={hasArticle ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  data-cursor
                  data-cursor-label={cta}
                  aria-label={`${p.title} — ${cta.toLowerCase()}`}
                  className="v2-work-item block aspect-[4/3] w-full sm:aspect-[16/10] md:aspect-[3/2]"
                >
                  {cover ? (
                    <Image src={cover} alt={`${p.title} — preview`} fill priority={i === 0} sizes="(max-width: 768px) 100vw, 66vw" className="object-cover object-top" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-8">
                      <span className="text-center font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{p.technologies.join("  ·  ")}</span>
                    </div>
                  )}
                  <span className="v2-work-scrim" aria-hidden />
                  <span className="absolute left-4 top-3 z-10 font-mono text-xs text-white mix-blend-difference">{String(i + 1).padStart(2, "0")}</span>

                  {/* Top-left: project name slides in from the left. */}
                  <div className="v2-work-tl absolute left-4 top-9 z-10 hidden max-w-[85%] md:block">
                    <h3 className="font-display text-3xl font-semibold tracking-tight text-white lg:text-4xl">{p.title}</h3>
                  </div>
                  {/* Bottom-right: description slides in from the right. */}
                  <div className="v2-work-br absolute bottom-5 right-5 z-10 hidden max-w-sm text-right md:block">
                    <p className="line-clamp-4 text-sm leading-relaxed text-white/85">{p.description}</p>
                  </div>
                </a>

                <div className="px-4 py-5 md:hidden">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-primary">
                    {cta} <AnimatedArrow className="text-sm" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
