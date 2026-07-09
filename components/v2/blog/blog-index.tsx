import { Suspense } from "react"
import Link from "next/link"
import type { BlogPostSummary } from "@/lib/blog/queries"
import type { SeriesNode } from "@/lib/blog/types"
import { Eyebrow } from "@/components/v2/primitives"
import { Wordmark } from "@/components/v2/blog/wordmark"
import { BlogFeed } from "@/components/v2/blog/blog-feed"
import { formatDate, seriesLabel } from "@/components/v2/blog/helpers"

/**
 * Blog index modelled on the Reado template: an interactive masthead wordmark
 * (dotted shadow) → inverted category (series) bar → interactive feed (search +
 * featured + image-led card grid + show more/all) → archive by year.
 * Server-rendered from the existing blog data layer; only rendered at /blog.
 */
export function BlogIndex({ posts, seriesTree }: { posts: BlogPostSummary[]; seriesTree: SeriesNode[] }) {
  const total = posts.length

  const byYear = new Map<string, BlogPostSummary[]>()
  for (const p of posts) {
    const iso = p.publishedAt ?? p.createdAt
    const year = iso ? String(new Date(iso).getFullYear()) : "—"
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(p)
  }
  const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a))

  return (
    <>
      {/* Masthead — interactive dotted-shadow wordmark. */}
      <section className="px-4 pt-28 md:px-6 md:pt-32">
        <div className="flex items-end justify-between border-b border-border pb-3">
          <Eyebrow>The Writing</Eyebrow>
          <Eyebrow>{total} {total === 1 ? "article" : "articles"}</Eyebrow>
        </div>
        <div className="mt-3">
          <Wordmark text="WRITING" />
        </div>
      </section>

      {/* Inverted category / series bar (reado). */}
      {seriesTree.length > 0 ? (
        <nav className="border-y border-border bg-foreground text-background">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] md:px-6">
            <Link href="/blog" className="opacity-60 transition-opacity hover:opacity-100">All</Link>
            {seriesTree.map((s) => (
              <Link key={s.id} href={`/blog/series/${s.slug}`} className="inline-flex items-center gap-2 transition-colors hover:text-primary">
                <span className="text-primary">&#9670;</span> {s.title}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      {posts.length === 0 ? (
        <section className="px-4 py-24 text-center md:px-6">
          <p className="text-muted-foreground">No published posts yet.</p>
        </section>
      ) : (
        <>
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <BlogFeed posts={posts} seriesTree={seriesTree} />
          </Suspense>

          {/* Archive by year. */}
          <section className="px-4 py-12 md:px-6 md:py-16">
            <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
              <Eyebrow>Archive</Eyebrow>
              <Eyebrow>Everything</Eyebrow>
            </div>
            <div className="space-y-8">
              {years.map((year) => (
                <div key={year} className="grid gap-4 md:grid-cols-[140px_1fr]">
                  <div className="font-display text-2xl font-semibold tracking-tight text-muted-foreground/60 md:text-4xl">{year}</div>
                  <ul className="divide-y divide-border">
                    {byYear.get(year)!.map((post) => (
                      <li key={post.id}>
                        <Link href={`/blog/${post.slug}`} className="group flex items-baseline justify-between gap-4 py-3.5">
                          <span className="font-serif text-base leading-snug text-foreground transition-colors group-hover:text-primary md:text-lg">{post.title}</span>
                          <span className="flex shrink-0 items-center gap-3 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                            <span className="hidden sm:inline">{seriesLabel(post)}</span>
                            <time>{formatDate(post.publishedAt ?? post.createdAt)}</time>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
