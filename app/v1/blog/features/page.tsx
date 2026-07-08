import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { readBlogPostDb } from "@/lib/blog/store"

export const dynamic = "force-dynamic"
import { findPublishedPostBySlug, listSnippetsBySlug } from "@/lib/blog/queries"
import BlogMarkdown from "@/components/blog-markdown"
import PostVoteButton from "@/components/post-vote-button"
import LazyComments from "@/components/lazy-comments"
import BlogTopNav from "@/components/blog-top-nav"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Features Demo",
  description:
    "Interactive demo of all blog features — markdown, code snippets, comments, voting and more.",
  openGraph: {
    title: "Blog Features Demo — Victor Nabasu",
    description: "Interactive demo of all blog features — markdown, code snippets, comments, voting and more.",
    type: "article",
  },
}

export default async function BlogFeaturesDemoPage() {
  const db = await readBlogPostDb("features-demo")
  if (!db) {
    notFound()
  }
  const post = findPublishedPostBySlug(db, "features-demo")
  if (!post) {
    notFound()
  }

  const snippetsBySlug = listSnippetsBySlug(db)

  return (
    <div className="min-h-screen bg-background">
      <BlogTopNav />

      <main className="container mx-auto px-4 pb-20 pt-10">
        {/* Breadcrumb */}
        {post.seriesPath.length > 0 && (
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
            {post.seriesPath.map((series, i) => {
              const href = `/v1/blog/series/${post.seriesPath
                .slice(0, i + 1)
                .map((s) => s.slug)
                .join("/")}`
              return (
                <span key={series.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-border select-none">›</span>}
                  <Link
                    href={href}
                    className="rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary/75 transition-all hover:border-primary hover:bg-primary/15 hover:text-primary"
                  >
                    {series.title}
                  </Link>
                </span>
              )
            })}
          </nav>
        )}

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

          <BlogMarkdown markdown={post.content} snippetsBySlug={snippetsBySlug} />
        </article>

        <div className="mt-12 border-t border-border/40 pt-10">
          <LazyComments postId={post.id} postSlug="features-demo" />
        </div>

        <div className="mt-10">
          <Link href="/v1/blog" className="text-sm text-muted-foreground transition-colors hover:text-primary">
            ← Back to Blog
          </Link>
        </div>
      </main>
    </div>
  )
}
