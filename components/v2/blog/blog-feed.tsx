"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import type { BlogPostSummary } from "@/lib/blog/queries"
import type { SeriesNode } from "@/lib/blog/types"
import { Eyebrow } from "@/components/v2/primitives"
import { Reveal } from "@/components/v2/reveal"
import { PostCard } from "@/components/v2/blog/post-card"
import { Subscribe } from "@/components/v2/blog/subscribe"
import { seriesLabel } from "@/components/v2/blog/helpers"

const INITIAL = 7 // posts visible at first: the featured one + 6 in the grid
const STEP = 3 // "Show more" increment

export function BlogFeed({ posts, seriesTree }: { posts: BlogPostSummary[]; seriesTree: SeriesNode[] }) {
  const total = posts.length
  const router = useRouter()
  const params = useSearchParams()
  const query = (params.get("q") ?? "").trim()
  const ql = query.toLowerCase()
  const [shown, setShown] = useState(INITIAL)

  const filtered = useMemo(() => {
    if (!ql) return posts
    return posts.filter((p) => `${p.title} ${p.excerpt ?? ""} ${seriesLabel(p)}`.toLowerCase().includes(ql))
  }, [posts, ql])

  const noFor = (p: BlogPostSummary) => `No. ${String(total - posts.indexOf(p)).padStart(3, "0")}`

  // ── Search results view (driven by the navbar search → /blog?q=…) ──
  if (query) {
    return (
      <section className="border-b border-border px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <Eyebrow className="mb-2 block">Search</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
            </h2>
          </div>
          <button
            type="button"
            onClick={() => router.push("/blog")}
            className="inline-flex items-center gap-2 border border-border px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
        {filtered.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PostCard key={p.id} post={p} no={noFor(p)} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No posts match your search.</p>
        )}
      </section>
    )
  }

  const featured = posts[0]
  const rest = posts.slice(1)
  const restShown = rest.slice(0, Math.max(0, shown - 1))
  const remaining = rest.length - restShown.length

  return (
    <>
      {/* Editorial hero — tagline + series + subscribe (left), featured card (right). */}
      <section className="grid gap-10 border-b border-border px-4 py-12 md:grid-cols-2 md:gap-14 md:px-6 md:py-16">
        <div className="flex flex-col justify-center">
          <h1 className="font-serif text-3xl leading-[1.12] text-foreground md:text-[2.9rem] md:leading-[1.08]">
            Build logs &amp; learning notes for curious engineers.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            A running record of what I&rsquo;m building and learning — from databases and DSLs written
            from scratch to shipped client websites, each documented step by step.
          </p>
          {seriesTree.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {seriesTree.map((s) => (
                <Link
                  key={s.id}
                  href={`/blog/series/${s.slug}`}
                  className="inline-flex items-center border border-border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s.title}
                </Link>
              ))}
            </div>
          ) : null}
          <div className="mt-8">
            <Subscribe />
          </div>
        </div>

        {featured ? (
          <Reveal mount y={20}>
            <PostCard post={featured} no={noFor(featured)} size="lg" />
          </Reveal>
        ) : null}
      </section>

      {/* Recent — image-led card grid with show more / show all. */}
      {rest.length > 0 ? (
        <section className="border-b border-border px-4 py-12 md:px-6 md:py-16">
          <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
            <div>
              <Eyebrow className="mb-2 block">Recent</Eyebrow>
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Recent posts</h2>
            </div>
            <Eyebrow className="hidden sm:block">{restShown.length} / {rest.length}</Eyebrow>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restShown.map((p, i) => (
              <Reveal key={p.id} y={20} delay={(i % 3) * 0.06}>
                <PostCard post={p} no={noFor(p)} />
              </Reveal>
            ))}
          </div>

          {remaining > 0 ? (
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShown((s) => s + STEP)}
                className="inline-flex items-center gap-2 border border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Show more <span className="text-muted-foreground">(+{Math.min(STEP, remaining)})</span>
              </button>
              <button
                type="button"
                onClick={() => setShown(total)}
                className="inline-flex items-center gap-2 bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                Show all ({total})
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  )
}
