import { notFound } from "next/navigation"
import Link from "next/link"
import { readBlogPostDb, getPostVote } from "@/lib/blog/store"
import { findPublishedPostBySlug, listSnippetsBySlug, listPublishedPostsForSeries } from "@/lib/blog/queries"
import BlogMarkdown from "@/components/blog-markdown"
import PostVoteButton from "@/components/post-vote-button"
import LazyComments from "@/components/lazy-comments"
import SeriesPostNav from "@/components/series-post-nav"
import Footer from "@/components/footer"
import { ModeToggle } from "@/components/mode-toggle"
import PortfolioLink from "@/components/portfolio-link"
import BlogLink from "@/components/blog-link"

// ISR: rebuild at most every 60s. The page HTML is cached at CloudFront edge.
export const revalidate = 60

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

/** Truncate a string to maxLen chars, adding "…" if cut. */
function truncate(s: string, maxLen = 20) {
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params

  const db = await readBlogPostDb(slug)
  if (!db) {
    notFound()
  }
  const post = findPublishedPostBySlug(db, slug)
  if (!post) {
    notFound()
  }

  const snippetsBySlug = listSnippetsBySlug(db)

  // Series sibling posts (sorted by publishedAt asc) — used for prev/next nav.
  // Filter to EXACT seriesId match only (not recursive sub-series) so that
  // prev/next always refers to adjacent posts in the same series level.
  const seriesPosts = post.seriesId
    ? listPublishedPostsForSeries(db, post.seriesId)
        .filter((p) => p.seriesId === post.seriesId)
        .sort((a, b) => {
          const at = new Date(a.publishedAt ?? a.createdAt).getTime()
          const bt = new Date(b.publishedAt ?? b.createdAt).getTime()
          return at - bt
        })
    : []
  const immediateSeriesTitle = post.seriesPath.at(-1)?.title ?? ""
  const immediateSeriesNumberFormat = post.seriesPath.at(-1)?.numberFormat ?? null

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden bg-background">
      {post.customCss && (
        <style dangerouslySetInnerHTML={{ __html: post.customCss }} />
      )}
      {/* Non-sticky top bar — same style as Hero */}
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-6">
          <PortfolioLink className="text-sm text-muted-foreground transition-colors hover:text-primary">
            ← Portfolio
          </PortfolioLink>
          <ModeToggle />
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20 pt-28 flex-1">
        <div className="mx-auto max-w-3xl">
        {/*
          Breadcrumb: Blog › [Series₁ (truncated)] › … › Post Title (not truncated, no link)
          When the post has no series, it's just: Blog › Post Title
        */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
          <BlogLink
            href="/blog"
            className="rounded px-1 text-muted-foreground transition-colors hover:text-primary"
          >
            Blog
          </BlogLink>

          {post.seriesPath.map((series, i) => {
            const href = `/blog/series/${post.seriesPath
              .slice(0, i + 1)
              .map((s) => s.slug)
              .join("/")}`
            const isLast = i === post.seriesPath.length - 1
            return (
              <span key={series.id} className="flex items-center gap-1.5">
                <span className="text-border select-none">›</span>
                {isLast ? (
                  // Last series segment before the post title: still a link but truncated
                  <BlogLink
                    href={href}
                    className="rounded px-1 text-muted-foreground transition-colors hover:text-primary"
                    title={series.title}
                  >
                    {truncate(series.title)}
                  </BlogLink>
                ) : (
                  <BlogLink
                    href={href}
                    className="rounded px-1 text-muted-foreground transition-colors hover:text-primary"
                    title={series.title}
                  >
                    {truncate(series.title)}
                  </BlogLink>
                )}
              </span>
            )
          })}

          {/* Current page — not a link, full title */}
          <span className="flex items-center gap-1.5">
            <span className="text-border select-none">›</span>
            <span className="rounded px-1 font-medium text-foreground">{post.title}</span>
          </span>
        </nav>

        <article>
          <header className="mb-8 border-b border-border/40 pb-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{post.title}</h1>
            {post.excerpt && (
              <p className="mt-3 text-base text-muted-foreground">{post.excerpt}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <time className="text-xs text-muted-foreground">
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Draft"}
              </time>
              <PostVoteButton postId={post.id} initialScore={post.upvotes} />
            </div>
          </header>

          {seriesPosts.length > 1 && (
            <SeriesPostNav posts={seriesPosts} currentSlug={slug} seriesTitle={immediateSeriesTitle} numberFormat={immediateSeriesNumberFormat} />
          )}

          <BlogMarkdown markdown={post.content} snippetsBySlug={snippetsBySlug} />

          {seriesPosts.length > 1 && (
            <SeriesPostNav posts={seriesPosts} currentSlug={slug} seriesTitle={immediateSeriesTitle} numberFormat={immediateSeriesNumberFormat} />
          )}
        </article>

        <div id="comments" className="mt-12 border-t border-border/40 pt-10">
          <LazyComments postId={post.id} postSlug={slug} />
        </div>
        </div>{/* end max-w-3xl inner column */}
      </main>

      <Footer />
    </div>
  )
}
