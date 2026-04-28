import Link from "next/link"
import { notFound } from "next/navigation"
import { readDb } from "@/lib/blog/store"
import { findSeriesByPath, listPublishedPostsForSeries } from "@/lib/blog/queries"
import SeriesTreeBrowser from "@/components/series-tree-browser"
import Footer from "@/components/footer"
import { ModeToggle } from "@/components/mode-toggle"

export const dynamic = "force-dynamic"

interface SeriesPageProps {
  params: Promise<{
    slug: string[]
  }>
}

function truncate(s: string, maxLen = 20) {
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { slug } = await params
  const db = await readDb()

  const series = findSeriesByPath(db, slug)
  if (!series) {
    notFound()
  }

  const posts = listPublishedPostsForSeries(db, series.id)

  return (
    <div className="relative min-h-screen bg-background">
      {/* Non-sticky top bar — same style as Hero */}
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            ← Portfolio
          </Link>
          <ModeToggle />
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20 pt-28">
        {/* Breadcrumb: Blog › [Parent series…] › Current Series */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
          <Link
            href="/blog"
            className="rounded px-1 text-muted-foreground transition-colors hover:text-primary"
          >
            Blog
          </Link>
          {slug.slice(0, -1).map((segment, i) => {
            const href = `/blog/series/${slug.slice(0, i + 1).join("/")}`
            const segSeries = db.series.find((s) => s.slug === segment)
            const label = segSeries ? truncate(segSeries.title) : segment
            return (
              <span key={segment} className="flex items-center gap-1.5">
                <span className="text-border select-none">›</span>
                <Link
                  href={href}
                  className="rounded px-1 text-muted-foreground transition-colors hover:text-primary"
                  title={segSeries?.title}
                >
                  {label}
                </Link>
              </span>
            )
          })}
          {/* Current series — not a link */}
          <span className="flex items-center gap-1.5">
            <span className="text-border select-none">›</span>
            <span className="rounded px-1 font-medium text-foreground">{series.title}</span>
          </span>
        </nav>

        {/* Series header */}
        <header className="mb-10 border-b border-border/40 pb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Series
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{series.title}</h1>
          {series.description && (
            <p className="mt-3 text-base text-muted-foreground">{series.description}</p>
          )}
        </header>

        <SeriesTreeBrowser rootSeriesId={series.id} allSeries={db.series} posts={posts} />
      </main>

      <Footer />
    </div>
  )
}
