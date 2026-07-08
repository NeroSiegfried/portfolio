"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Bell, BellOff } from "lucide-react"
import type { BlogPostSummary } from "@/lib/blog/queries"
import { formatSeriesEntry } from "@/lib/blog/format"
import BlogLink from "@/components/blog-link"
import { useBlogSubdomain } from "@/lib/blog/subdomain-context"
import { toBlogRelativePath } from "@/components/blog-link"
import { useBasePath, withBase } from "@/lib/base-path"

interface SeriesPostNavProps {
  /** All posts in the same series (ordered by publishedAt asc, oldest first). */
  posts: BlogPostSummary[]
  /** Current post slug. */
  currentSlug: string
  /** Name of the immediate series this post belongs to. */
  seriesTitle: string
  /** Optional number format string from the series, e.g. "Project {n}", "Chapter {roman}" */
  numberFormat?: string | null
  /** Series ID — used for follow/unfollow. */
  seriesId?: string | null
}

export default function SeriesPostNav({ posts, currentSlug, seriesTitle, numberFormat, seriesId }: SeriesPostNavProps) {
  if (posts.length < 2) return null

  const isBlogSubdomain = useBlogSubdomain()
  const basePath = useBasePath()
  const idx = posts.findIndex((p) => p.slug === currentSlug)
  const prev = idx > 0 ? posts[idx - 1] : null
  const next = idx < posts.length - 1 ? posts[idx + 1] : null

  // ── Follow state ──────────────────────────────────────────────────────────
  const [following, setFollowing] = useState<boolean | null>(null)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    if (!seriesId) return
    fetch(`/api/blog/series/${seriesId}/follow`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { following?: boolean }) => setFollowing(d.following ?? false))
      .catch(() => {})
  }, [seriesId])

  const toggleFollow = async () => {
    if (!seriesId || followBusy) return
    setFollowBusy(true)
    try {
      const res = await fetch(`/api/blog/series/${seriesId}/follow`, { method: "POST" })
      const d = (await res.json()) as { following?: boolean; error?: string }
      if (d.error) {
        // Not logged in — redirect to comments section to prompt login
        window.location.hash = "comments"
        return
      }
      setFollowing(d.following ?? false)
    } finally {
      setFollowBusy(false)
    }
  }

  return (
    <nav
      aria-label="Posts in this series"
      className="my-8 rounded-lg border border-border/40 bg-card/30 p-4"
    >
      {/* Series label + position + follow */}
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider truncate">{seriesTitle}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="tabular-nums">
            {formatSeriesEntry(numberFormat, idx + 1)} / {formatSeriesEntry(numberFormat, posts.length)}
          </span>
          {seriesId && following !== null && (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={followBusy}
              title={following ? "Unfollow series" : "Follow series for new-post notifications"}
              className={[
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-50",
                following
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              ].join(" ")}
            >
              {following ? (
                <><BellOff className="h-3 w-3" /> Following</>
              ) : (
                <><Bell className="h-3 w-3" /> Follow</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Jump-to dropdown — full width, shows formatted entry numbers */}
      <select
        className="mb-4 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        value={currentSlug}
        onChange={(e) => {
          const path = isBlogSubdomain
            ? toBlogRelativePath(`/blog/${e.target.value}`)
            : `/blog/${e.target.value}`
          window.location.href = withBase(basePath, path)
        }}
      >
        {posts.map((p, i) => (
          <option key={p.slug} value={p.slug}>
            {formatSeriesEntry(numberFormat, i + 1)}. {p.title}
          </option>
        ))}
      </select>

      {/* Prev / Next — always equal 50/50 columns, text truncates */}
      <div className="grid grid-cols-2 gap-2">
        {prev ? (
          <BlogLink
            href={`/blog/${prev.slug}`}
            className="flex items-center gap-1.5 overflow-hidden rounded-md border border-border/40 px-3 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 min-w-0"
          >
            <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 overflow-hidden">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                ← {formatSeriesEntry(numberFormat, idx)}
              </span>
              <span className="block truncate font-medium">{prev.title}</span>
            </span>
          </BlogLink>
        ) : (
          <div />
        )}

        {next ? (
          <BlogLink
            href={`/blog/${next.slug}`}
            className="flex items-center justify-end gap-1.5 overflow-hidden rounded-md border border-border/40 px-3 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 min-w-0 text-right"
          >
            <span className="min-w-0 overflow-hidden">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                {formatSeriesEntry(numberFormat, idx + 2)} →
              </span>
              <span className="block truncate font-medium">{next.title}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </BlogLink>
        ) : (
          <div />
        )}
      </div>
    </nav>
  )
}
