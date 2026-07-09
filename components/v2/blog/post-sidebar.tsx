import Link from "next/link"
import type { BlogPostSummary } from "@/lib/blog/queries"
import { formatSeriesEntry } from "@/lib/blog/format"
import { Eyebrow } from "@/components/v2/primitives"
import { SeriesFollowButton } from "@/components/v2/blog/series-follow-button"
import { formatDate, seriesLabel } from "@/components/v2/blog/helpers"
import { cn } from "@/lib/utils"

/**
 * Article right rail (reado): sticky navigation to other posts. Shows the
 * ordered "in this series" list (current highlighted, with a follow toggle) when
 * the post belongs to a multi-post series, then a "more reading" list of recent
 * posts. Fills the empty real-estate beside the reading column; on small screens
 * it drops below the article (see the article page grid). Pure links → server.
 */
export function PostSidebar({
  seriesPosts,
  currentSlug,
  seriesTitle,
  numberFormat,
  seriesId,
  recentPosts,
}: {
  seriesPosts: BlogPostSummary[]
  currentSlug: string
  seriesTitle: string
  numberFormat?: string | null
  seriesId?: string | null
  recentPosts: BlogPostSummary[]
}) {
  const inSeries = seriesPosts.length > 1
  const more = recentPosts.slice(0, 5)

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      {inSeries ? (
        <section className="border border-border bg-card/30">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <Eyebrow className="text-primary">In this series</Eyebrow>
              <p className="mt-1 truncate font-serif text-sm text-foreground">{seriesTitle}</p>
            </div>
            {seriesId ? <SeriesFollowButton seriesId={seriesId} /> : null}
          </header>
          <ol className="max-h-[22rem] overflow-y-auto p-2">
            {seriesPosts.map((p, i) => {
              const active = p.slug === currentSlug
              const num = formatSeriesEntry(numberFormat, i + 1)
              const inner = (
                <>
                  <span className={cn("mt-px shrink-0 font-mono text-[0.7rem] tabular-nums", active ? "text-primary" : "text-muted-foreground")}>{num}</span>
                  <span className={cn("min-w-0 leading-snug", active ? "font-medium text-foreground" : "text-muted-foreground")}>{p.title}</span>
                </>
              )
              return (
                <li key={p.slug}>
                  {active ? (
                    <span aria-current="page" className="flex items-start gap-2.5 border-l-2 border-primary bg-primary/[0.06] px-3 py-2 text-sm">
                      {inner}
                    </span>
                  ) : (
                    <Link href={`/blog/${p.slug}`} className="group flex items-start gap-2.5 border-l-2 border-transparent px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted/40">
                      <span className="mt-px shrink-0 font-mono text-[0.7rem] tabular-nums text-muted-foreground transition-colors group-hover:text-primary">{num}</span>
                      <span className="min-w-0 leading-snug text-muted-foreground transition-colors group-hover:text-foreground">{p.title}</span>
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}

      {more.length > 0 ? (
        <section className={cn("border border-border bg-card/30", inSeries && "mt-4")}>
          <header className="border-b border-border px-4 py-3">
            <Eyebrow>More reading</Eyebrow>
          </header>
          <ul className="divide-y divide-border">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block px-4 py-3.5 transition-colors hover:bg-muted/40">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">{seriesLabel(p)}</span>
                  <span className="mt-1 block font-serif text-sm leading-snug text-foreground transition-colors group-hover:text-primary">{p.title}</span>
                  <time className="mt-1.5 block font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">
                    {formatDate(p.publishedAt ?? p.createdAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-4 py-3">
            <Link href="/blog" className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-primary transition-opacity hover:opacity-80">
              All articles →
            </Link>
          </div>
        </section>
      ) : null}
    </aside>
  )
}
