import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import Script from "next/script"
import { readBlogPostDb } from "@/lib/blog/store"
import { findPublishedPostBySlug, listPublishedPosts, listSnippetsBySlug, listPublishedPostsForSeries } from "@/lib/blog/queries"
import { projectByBlogSlug } from "@/lib/portfolio-data"
import BlogMarkdown from "@/components/blog-markdown"
import PostVoteButton from "@/components/post-vote-button"
import { scopePostCss } from "@/lib/blog/scope-css"
import LazyComments from "@/components/lazy-comments"
import { Cursor } from "@/components/v2/cursor"
import { BlogNav } from "@/components/v2/blog/blog-nav"
import { Footer } from "@/components/v2/footer"
import { Eyebrow } from "@/components/v2/primitives"
import { AnimatedArrow } from "@/components/v2/animated-arrow"
import { PostPager } from "@/components/v2/blog/post-pager"
import { PostSidebar } from "@/components/v2/blog/post-sidebar"

// ISR: rebuild at most every 60s. The page HTML is cached at CloudFront edge.
export const revalidate = 60

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const db = await readBlogPostDb(slug)
    if (!db) return {}
    const post = findPublishedPostBySlug(db, slug)
    if (!post) return {}
    const description = post.excerpt ?? `A blog post by Victor Nabasu.`
    const seriesLabel = post.seriesPath.at(-1)?.title
    const fullTitle = seriesLabel ? `${post.title} — ${seriesLabel}` : post.title
    return {
      title: post.title,
      description,
      openGraph: {
        title: fullTitle,
        description,
        type: "article",
        publishedTime: post.publishedAt ?? undefined,
        authors: ["Victor Nabasu"],
      },
      twitter: {
        card: "summary_large_image",
        title: fullTitle,
        description,
      },
    }
  } catch {
    return {}
  }
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params

  let db: Awaited<ReturnType<typeof readBlogPostDb>>
  try {
    db = await readBlogPostDb(slug)
  } catch (err) {
    console.error(`[blog/${slug}] DB unavailable during render:`, err)
    notFound()
  }
  if (!db) notFound()
  const post = findPublishedPostBySlug(db, slug)
  if (!post) notFound()

  const snippetsBySlug = listSnippetsBySlug(db)

  // Series sibling posts (exact series level) for prev/next nav.
  const seriesPosts = post.seriesId
    ? listPublishedPostsForSeries(db, post.seriesId)
        .filter((p) => p.seriesId === post.seriesId)
        .sort((a, b) => {
          const ap = a.position ?? 0
          const bp = b.position ?? 0
          if (ap !== 0 || bp !== 0) {
            if (ap !== 0 && bp !== 0) return ap - bp
            if (ap !== 0) return -1
            return 1
          }
          const at = new Date(a.publishedAt ?? a.createdAt).getTime()
          const bt = new Date(b.publishedAt ?? b.createdAt).getTime()
          if (at !== bt) return at - bt
          const ac = new Date(a.createdAt).getTime()
          const bc = new Date(b.createdAt).getTime()
          if (ac !== bc) return ac - bc
          return a.id.localeCompare(b.id)
        })
    : []
  const immediateSeriesTitle = post.seriesPath.at(-1)?.title ?? ""
  const immediateSeriesNumberFormat = post.seriesPath.at(-1)?.numberFormat ?? null

  // All published posts — used for the sidebar's "more reading" list and for the
  // prev/next pager when the post isn't part of a multi-post series.
  const allPosts = listPublishedPosts(db)
  const chronoAsc = [...allPosts].sort(
    (a, b) => new Date(a.publishedAt ?? a.createdAt).getTime() - new Date(b.publishedAt ?? b.createdAt).getTime(),
  )

  // Reading order for prev/next: series progression when in a series, else the
  // global chronological order (oldest → newest).
  const order = seriesPosts.length > 1 ? seriesPosts : chronoAsc
  const orderIdx = order.findIndex((p) => p.slug === slug)
  const prevPost = orderIdx > 0 ? order[orderIdx - 1] : null
  const nextPost = orderIdx >= 0 && orderIdx < order.length - 1 ? order[orderIdx + 1] : null

  // Sidebar "more reading": recent posts outside this series (avoids duplicating
  // the in-series list), newest first.
  const seriesSlugs = new Set(seriesPosts.map((p) => p.slug))
  const recentPosts = [...allPosts]
    .filter((p) => p.slug !== slug && !seriesSlugs.has(p.slug))
    .sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime())

  const project = projectByBlogSlug(slug)
  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "Draft"

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nerosiegfried.com"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    author: { "@type": "Person", name: "Victor Nabasu", url: siteUrl },
    publisher: { "@type": "Person", name: "Victor Nabasu", url: siteUrl },
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt ?? post.publishedAt ?? post.createdAt,
    url: `${siteUrl}/blog/${slug}`,
    image: post.coverImage ?? `${siteUrl}/blog/${slug}/opengraph-image`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/blog/${slug}` },
  }

  const extLink = "group inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors"

  return (
    <>
      <Script id="json-ld-post" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {post.customCss && <style dangerouslySetInnerHTML={{ __html: scopePostCss(post.customCss) }} />}
      <Cursor />
      <BlogNav />

      <div className="relative bg-background">
        <div className="mx-3 border-x border-border md:mx-4">
          {/* Breadcrumb + top prev/next pager */}
          <div className="px-4 pt-28 md:px-6 md:pt-32">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
              <Link href="/blog" className="transition-colors hover:text-primary">Blog</Link>
              {post.seriesPath.map((series, i) => (
                <span key={series.id} className="flex items-center gap-2">
                  <span className="text-border">/</span>
                  <Link
                    href={`/blog/series/${post.seriesPath.slice(0, i + 1).map((s) => s.slug).join("/")}`}
                    className="transition-colors hover:text-primary"
                  >
                    {series.title}
                  </Link>
                </span>
              ))}
            </nav>
            {prevPost || nextPost ? (
              <div className="mt-5">
                <PostPager prev={prevPost} next={nextPost} size="sm" />
              </div>
            ) : null}
          </div>

          <article>
            {/* Header */}
            <header className="px-4 pt-10 md:px-6">
              <div className="max-w-4xl">
                <div className="flex items-center gap-4">
                  <Eyebrow className="text-primary">{post.seriesPath.at(-1)?.title ?? "Article"}</Eyebrow>
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">{publishedLabel}</span>
                </div>
                <h1 className="mt-5 font-serif text-4xl leading-[1.08] text-foreground md:text-[3.25rem] md:leading-[1.04]">
                  {post.title}
                </h1>
                {post.excerpt ? (
                  <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
                ) : null}

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <PostVoteButton postId={post.id} initialScore={post.upvotes} />
                  {project?.liveUrl ? (
                    <div className="inline-flex flex-wrap items-center gap-5 border border-border bg-card/40 px-4 py-2.5">
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={`${extLink} text-foreground hover:text-primary`}>
                        Live site <AnimatedArrow className="text-sm" />
                      </a>
                      {project.githubUrl ? (
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={`${extLink} text-muted-foreground hover:text-primary`}>
                          Repository <AnimatedArrow className="text-sm" />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </header>

            {/* Cover image */}
            {post.coverImage ? (
              <div className="mt-10 px-4 md:px-6">
                <div className="relative aspect-[16/9] overflow-hidden border border-border bg-secondary">
                  <Image src={post.coverImage} alt={post.title} fill priority sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
                </div>
              </div>
            ) : null}

            {/* Body — reading column (left) + sticky post-nav sidebar (right) */}
            <div className="px-4 py-12 md:px-6 md:py-16">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12 xl:gap-16">
                <div className="min-w-0">
                  <div className="post-body max-w-3xl">
                    <BlogMarkdown markdown={post.content} snippetsBySlug={snippetsBySlug} />
                  </div>
                </div>
                <PostSidebar
                  seriesPosts={seriesPosts}
                  currentSlug={slug}
                  seriesTitle={immediateSeriesTitle}
                  numberFormat={immediateSeriesNumberFormat}
                  seriesId={post.seriesId}
                  recentPosts={recentPosts}
                />
              </div>
            </div>
          </article>

          {/* Bottom prev/next pager */}
          {prevPost || nextPost ? (
            <div className="px-4 pb-2 md:px-6">
              <PostPager prev={prevPost} next={nextPost} size="lg" />
            </div>
          ) : null}

          {/* Comments */}
          <div id="comments" className="px-4 pb-16 pt-8 md:px-6">
            <div className="max-w-3xl border-t border-border pt-10">
              <LazyComments postId={post.id} postSlug={slug} />
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </>
  )
}
