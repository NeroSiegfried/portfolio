import Link from "next/link"
import type { ReactNode } from "react"
import type { BlogPostSummary } from "@/lib/blog/queries"
import type { SeriesNode } from "@/lib/blog/types"
import { Eyebrow } from "@/components/v2/primitives"
import { AnimatedArrow } from "@/components/v2/animated-arrow"
import { PostCover } from "@/components/v2/blog/post-cover"
import { cn } from "@/lib/utils"

/**
 * Blog index modelled on the Reado template: a giant masthead wordmark → inverted
 * category (series) bar → editorial hero (serif tagline + featured image-led card)
 * → image-led card grid with squared tags + serif titles → archive by year.
 * Server-rendered from the existing blog data layer; only rendered at /blog.
 */

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

function seriesLabel(post: BlogPostSummary) {
  return post.seriesPath.at(-1)?.title ?? "Article"
}

function monogramFor(post: BlogPostSummary) {
  // Distinct per post: initials of the first two words of the title (punctuation
  // like em-dashes/colons stripped), falling back to the first two letters.
  const words = post.title.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean)
  const letters = words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? post.title).slice(0, 2)
  return letters.toUpperCase()
}

/** Squared uppercase tag (Reado) — no pills. */
function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-border/70 bg-background/75 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-foreground backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  )
}

function BlogCard({ post, no, size = "sm" }: { post: BlogPostSummary; no: string; size?: "sm" | "lg" }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col">
      <PostCover monogram={monogramFor(post)} className={cn("border border-border", size === "lg" ? "aspect-[16/10]" : "aspect-[4/3]")}>
        <Tag className="absolute left-3 top-3">{seriesLabel(post)}</Tag>
        <span className="absolute right-3 top-3 font-mono text-[0.62rem] tracking-[0.14em] text-muted-foreground">{no}</span>
      </PostCover>
      <div className={cn("flex flex-1 flex-col pt-4", size === "lg" && "pt-5")}>
        <h3 className={cn("font-serif leading-snug text-foreground transition-colors group-hover:text-primary", size === "lg" ? "text-2xl md:text-3xl" : "text-xl")}>
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className={cn("mt-2 text-sm leading-relaxed text-muted-foreground", size === "lg" ? "line-clamp-2" : "line-clamp-2")}>{post.excerpt}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <time>{formatDate(post.publishedAt ?? post.createdAt)}</time>
          <span className="ml-auto inline-flex items-center gap-1.5 text-primary">Read <AnimatedArrow className="text-sm" /></span>
        </div>
      </div>
    </Link>
  )
}

export function BlogIndex({ posts, seriesTree }: { posts: BlogPostSummary[]; seriesTree: SeriesNode[] }) {
  const total = posts.length
  const featured = posts[0]
  const grid = posts.slice(1)

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
      {/* Masthead — giant wordmark (Reado), filled to the full width via SVG. */}
      <section className="px-4 pt-28 md:px-6 md:pt-32">
        <div className="flex items-end justify-between border-b border-border pb-3">
          <Eyebrow>The Writing</Eyebrow>
          <Eyebrow>{total} {total === 1 ? "article" : "articles"}</Eyebrow>
        </div>
        <svg viewBox="0 0 1000 250" preserveAspectRatio="xMidYMid meet" className="mt-3 w-full select-none" aria-hidden>
          <text x="500" y="202" textAnchor="middle" textLength={1000} lengthAdjust="spacingAndGlyphs" fontSize={250} className="fill-foreground font-display font-bold">
            WRITING
          </text>
        </svg>
      </section>

      {/* Inverted category / series bar (Reado). */}
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
          {/* Editorial hero — serif tagline + series links (left), featured latest card (right). */}
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
                <div className="mt-8 flex flex-wrap gap-2">
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
            </div>

            {featured ? (
              <div className="group">
                <BlogCard post={featured} no={issueNo(total, 0)} size="lg" />
              </div>
            ) : null}
          </section>

          {/* Recent — image-led card grid. */}
          {grid.length > 0 ? (
            <section className="border-b border-border px-4 py-12 md:px-6 md:py-16">
              <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
                <div>
                  <Eyebrow className="mb-2 block">Recent</Eyebrow>
                  <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Recent posts</h2>
                </div>
                <Eyebrow className="hidden sm:block">{grid.length} more</Eyebrow>
              </div>
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map((post, i) => (
                  <div key={post.id} className="group">
                    <BlogCard post={post} no={issueNo(total, i + 1)} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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
