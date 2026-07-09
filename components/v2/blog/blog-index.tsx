import Link from "next/link"
import type { BlogPostSummary } from "@/lib/blog/queries"
import type { SeriesNode } from "@/lib/blog/types"
import { Eyebrow } from "@/components/v2/primitives"
import { AnimatedArrow } from "@/components/v2/animated-arrow"

/**
 * Reado-style blog index: masthead wordmark → series/category bar → featured
 * (latest) post → numbered card grid → archive by year. Server-rendered from the
 * existing blog data layer; series pages, archive and post links are preserved.
 * Only ever rendered at /blog (base path ""), so links are plain absolute paths.
 */

function seriesHref(path: { slug: string }[]) {
  return `/blog/series/${path.map((s) => s.slug).join("/")}`
}

function formatDate(iso: string | null) {
  if (!iso) return "Draft"
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? "Draft"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function issueNo(total: number, index: number) {
  return `No. ${String(total - index).padStart(3, "0")}`
}

function SeriesPill({ post }: { post: BlogPostSummary }) {
  if (!post.seriesPath.length) {
    return <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">Article</span>
  }
  const series = post.seriesPath[post.seriesPath.length - 1]
  return (
    <span className="rounded-full border border-primary/30 bg-primary/[0.08] px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-primary">
      {series.title}
    </span>
  )
}

export function BlogIndex({ posts, seriesTree }: { posts: BlogPostSummary[]; seriesTree: SeriesNode[] }) {
  const total = posts.length
  const featured = posts[0]
  const rest = posts.slice(1)

  // Group everything by year for the archive (posts already newest-first).
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
      {/* Masthead */}
      <section className="px-4 pt-28 md:px-6 md:pt-36">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Eyebrow>Writing</Eyebrow>
          <Eyebrow>{total} {total === 1 ? "article" : "articles"}</Eyebrow>
        </div>
        <h1 className="mt-8 font-display text-[clamp(3rem,12vw,9rem)] font-semibold uppercase leading-[0.9] tracking-[-0.03em]">
          Writing
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Build logs, structured learning series, and interactive articles — a running record of what
          I&rsquo;m building and learning, from databases and DSLs to shipped client websites.
        </p>

        {/* Series / category bar */}
        {seriesTree.length > 0 ? (
          <nav className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-5 font-mono text-xs uppercase tracking-[0.12em]">
            <span className="text-muted-foreground/60">Series</span>
            {seriesTree.map((s) => (
              <Link key={s.id} href={`/blog/series/${s.slug}`} className="text-muted-foreground transition-colors hover:text-primary">
                {s.title}
              </Link>
            ))}
          </nav>
        ) : null}
      </section>

      {posts.length === 0 ? (
        <section className="px-4 py-24 text-center md:px-6">
          <p className="text-muted-foreground">No published posts yet.</p>
        </section>
      ) : (
        <>
          {/* Featured — latest post */}
          {featured ? (
            <section className="mt-12 border-t border-border px-4 md:px-6">
              <Link href={`/blog/${featured.slug}`} className="group block py-10 md:py-14">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs tracking-[0.14em] text-primary">{issueNo(total, 0)}</span>
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">Latest</span>
                  <SeriesPill post={featured} />
                </div>
                <h2 className="mt-5 max-w-4xl font-serif text-3xl leading-[1.1] text-foreground transition-colors group-hover:text-primary md:text-5xl md:leading-[1.05]">
                  {featured.title}
                </h2>
                {featured.excerpt ? (
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{featured.excerpt}</p>
                ) : null}
                <div className="mt-7 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.12em]">
                  <time className="text-muted-foreground">{formatDate(featured.publishedAt ?? featured.createdAt)}</time>
                  <span className="inline-flex items-center gap-1.5 text-primary">Read article <AnimatedArrow className="text-sm" /></span>
                </div>
              </Link>
            </section>
          ) : null}

          {/* Recent — numbered card grid */}
          {rest.length > 0 ? (
            <section className="border-t border-border px-4 py-10 md:px-6 md:py-14">
              <div className="mb-8 flex items-center justify-between">
                <Eyebrow>Recent</Eyebrow>
                <Eyebrow>{rest.length} more</Eyebrow>
              </div>
              <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, i) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group flex h-full flex-col bg-background p-6 transition-colors hover:bg-card">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground">{issueNo(total, i + 1)}</span>
                      <time className="font-mono text-[0.7rem] text-muted-foreground">{formatDate(post.publishedAt ?? post.createdAt)}</time>
                    </div>
                    <h3 className="mt-4 font-serif text-xl leading-snug text-foreground transition-colors group-hover:text-primary">{post.title}</h3>
                    {post.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p> : null}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                      <SeriesPill post={post} />
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-primary">Read <AnimatedArrow className="text-sm" /></span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* Archive by year */}
          <section className="border-t border-border px-4 py-10 md:px-6 md:py-14">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <Eyebrow>Archive</Eyebrow>
              <Eyebrow>All posts</Eyebrow>
            </div>
            <div className="space-y-8">
              {years.map((year) => (
                <div key={year} className="grid gap-4 md:grid-cols-[120px_1fr]">
                  <div className="font-display text-2xl font-semibold tracking-tight text-muted-foreground/70 md:text-3xl">{year}</div>
                  <ul className="divide-y divide-border">
                    {byYear.get(year)!.map((post) => (
                      <li key={post.id}>
                        <Link href={`/blog/${post.slug}`} className="group flex items-baseline justify-between gap-4 py-3">
                          <span className="font-serif text-base leading-snug text-foreground transition-colors group-hover:text-primary md:text-lg">{post.title}</span>
                          <time className="shrink-0 font-mono text-xs text-muted-foreground">{formatDate(post.publishedAt ?? post.createdAt)}</time>
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
