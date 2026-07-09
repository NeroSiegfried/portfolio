import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { readSeriesDb } from "@/lib/blog/store"
import { findSeriesByPath, listPublishedPostsForSeries } from "@/lib/blog/queries"
import { Cursor } from "@/components/v2/cursor"
import { BlogNav } from "@/components/v2/blog/blog-nav"
import { Footer } from "@/components/v2/footer"
import { Eyebrow } from "@/components/v2/primitives"
import { PostCard } from "@/components/v2/blog/post-card"

export const revalidate = 60

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params
  const db = await readSeriesDb()
  const series = findSeriesByPath(db, slug)
  if (!series) return {}
  const description = series.description ?? `A series of posts by Victor Nabasu.`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nerosiegfried.com"
  const ogImage = `${siteUrl}/api/og/series?slug=${slug.join("/")}`
  return {
    title: series.title,
    description,
    openGraph: {
      title: `${series.title} — Series`,
      description,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${series.title} — Series`,
      description,
      images: [ogImage],
    },
  }
}

interface SeriesPageProps {
  params: Promise<{ slug: string[] }>
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { slug } = await params
  const db = await readSeriesDb()

  const series = findSeriesByPath(db, slug)
  if (!series) notFound()

  // Direct posts (this level) + direct child series (drill-down), preserving hierarchy.
  const allInTree = listPublishedPostsForSeries(db, series.id)
  const directPosts = allInTree.filter((p) => p.seriesId === series.id)
  const children = db.series
    .filter((s) => s.parentId === series.id)
    .sort((a, b) => a.title.localeCompare(b.title))
  const total = allInTree.length

  const childHref = (childSlug: string) => `/blog/series/${[...slug, childSlug].join("/")}`

  return (
    <>
      <Cursor />
      <BlogNav />

      <div className="relative bg-background">
        <div className="mx-3 border-x border-border md:mx-4">
          {/* Header */}
          <section className="px-4 pt-28 md:px-6 md:pt-32">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
              <Link href="/blog" className="transition-colors hover:text-primary">Blog</Link>
              {slug.slice(0, -1).map((segment, i) => {
                const href = `/blog/series/${slug.slice(0, i + 1).join("/")}`
                const segSeries = db.series.find((s) => s.slug === segment)
                return (
                  <span key={segment} className="flex items-center gap-2">
                    <span className="text-border">/</span>
                    <Link href={href} className="transition-colors hover:text-primary">{segSeries?.title ?? segment}</Link>
                  </span>
                )
              })}
              <span className="flex items-center gap-2">
                <span className="text-border">/</span>
                <span className="text-foreground">{series.title}</span>
              </span>
            </nav>

            <div className="mt-8 flex items-end justify-between gap-6 border-b border-border pb-5">
              <div>
                <Eyebrow className="mb-3 block">Series</Eyebrow>
                <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.02]">{series.title}</h1>
              </div>
              <Eyebrow className="hidden shrink-0 pb-1 sm:block">{total} {total === 1 ? "post" : "posts"}</Eyebrow>
            </div>
            {series.description ? (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{series.description}</p>
            ) : null}

            {/* Sub-series drill-down */}
            {children.length > 0 ? (
              <div className="mt-8">
                <Eyebrow className="mb-3 block">In this series</Eyebrow>
                <div className="flex flex-wrap gap-2">
                  {children.map((c) => (
                    <Link
                      key={c.id}
                      href={childHref(c.slug)}
                      className="inline-flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="text-primary">&#9670;</span> {c.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* Posts */}
          <section className="px-4 py-12 md:px-6 md:py-16">
            {directPosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {directPosts.map((post, i) => (
                  <PostCard key={post.id} post={post} no={`No. ${String(i + 1).padStart(3, "0")}`} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {children.length > 0 ? "Pick a sub-series above to read its posts." : "No posts in this series yet."}
              </p>
            )}
          </section>

          <Footer />
        </div>
      </div>
    </>
  )
}
