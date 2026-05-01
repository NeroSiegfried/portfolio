"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpDown } from "lucide-react"
import type { BlogPostSummary } from "@/lib/blog/queries"
import BlogLink from "@/components/blog-link"

interface BlogPostListProps {
  posts: BlogPostSummary[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function BlogPostList({ posts }: BlogPostListProps) {
  const [order, setOrder] = useState<"desc" | "asc">("desc")

  const sorted = [...posts].sort((a, b) => {
    const ta = new Date(a.publishedAt ?? a.createdAt).getTime()
    const tb = new Date(b.publishedAt ?? b.createdAt).getTime()
    return order === "desc" ? tb - ta : ta - tb
  })

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Articles</h2>
        <button
          type="button"
          onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
          className="flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-orange-500/60 hover:text-orange-600"
        >
          <ArrowUpDown className="h-3 w-3" />
          {order === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No published posts yet.</p>
      ) : (
        <div className="divide-y divide-border/40">
          {sorted.map((post) => (
            <article key={post.id} className="group py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <BlogLink
                  href={`/blog/${post.slug}`}
                  prefetch={true}
                  className="text-base font-semibold leading-snug transition-colors group-hover:text-primary sm:text-lg"
                >
                  {post.title}
                </BlogLink>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {post.publishedAt ? formatDate(post.publishedAt) : "Draft"}
                </time>
              </div>

              <p className="mt-1.5 text-sm text-muted-foreground">{post.excerpt}</p>

              {post.seriesPath.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {post.seriesPath.map((series, i) => {
                    const href = `/blog/series/${post.seriesPath
                      .slice(0, i + 1)
                      .map((s) => s.slug)
                      .join("/")}`
                    return (
                      <BlogLink
                        key={series.id}
                        href={href}
                        className="rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary/75 transition-all hover:border-primary hover:bg-primary/15 hover:text-primary"
                      >
                        {series.title}
                      </BlogLink>
                    )
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
