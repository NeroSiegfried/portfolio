import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { readBlogPostDb } from "@/lib/blog/store"
import { findPublishedPostBySlug, listSnippetsBySlug } from "@/lib/blog/queries"
import BlogMarkdown from "@/components/blog-markdown"
import PostVoteButton from "@/components/post-vote-button"
import LazyComments from "@/components/lazy-comments"
import { Cursor } from "@/components/v2/cursor"
import { BlogNav } from "@/components/v2/blog/blog-nav"
import { Footer } from "@/components/v2/footer"
import { Eyebrow } from "@/components/v2/primitives"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"
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
  if (!db) notFound()
  const post = findPublishedPostBySlug(db, "features-demo")
  if (!post) notFound()

  const snippetsBySlug = listSnippetsBySlug(db)
  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "Draft"

  return (
    <>
      <Cursor />
      <BlogNav />

      <div className="relative bg-background">
        <div className="mx-3 border-x border-border md:mx-4">
          <article>
            <div className="px-4 pt-28 md:px-6 md:pt-32">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                <Link href="/blog" className="transition-colors hover:text-primary">Blog</Link>
                <span className="text-border">/</span>
                <span className="text-foreground">Features</span>
              </nav>

              <div className="mx-auto mt-8 max-w-3xl">
                <div className="flex items-center gap-4">
                  <Eyebrow className="text-primary">Demo</Eyebrow>
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">{publishedLabel}</span>
                </div>
                <h1 className="mt-5 font-serif text-4xl leading-[1.08] text-foreground md:text-[3.25rem] md:leading-[1.04]">{post.title}</h1>
                {post.excerpt ? <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p> : null}
                <div className="mt-7">
                  <PostVoteButton postId={post.id} initialScore={post.upvotes} />
                </div>
              </div>
            </div>

            {post.coverImage ? (
              <div className="mt-10 px-4 md:px-6">
                <div className="relative mx-auto aspect-[16/9] max-w-5xl overflow-hidden border border-border bg-secondary">
                  <Image src={post.coverImage} alt={post.title} fill priority sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
                </div>
              </div>
            ) : null}

            <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
              <div className="post-body">
                <BlogMarkdown markdown={post.content} snippetsBySlug={snippetsBySlug} />
              </div>
            </div>
          </article>

          <div id="comments" className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
            <div className="border-t border-border pt-10">
              <LazyComments postId={post.id} postSlug="features-demo" />
            </div>
            <div className="mt-10">
              <Link href="/blog" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
              </Link>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </>
  )
}
