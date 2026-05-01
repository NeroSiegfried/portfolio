"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react"
import type { BlogSeries } from "@/lib/blog/types"
import type { BlogPostSummary } from "@/lib/blog/queries"
import BlogLink from "@/components/blog-link"

interface SeriesTreeBrowserProps {
  rootSeriesId: string
  allSeries: BlogSeries[]
  posts: BlogPostSummary[]
}

type TreeItem =
  | {
      id: string
      type: "series"
      title: string
      date: string
      slugPath: string[]
    }
  | {
      id: string
      type: "post"
      title: string
      date: string
      slug: string
    }

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function SeriesTreeBrowser({ rootSeriesId, allSeries, posts }: SeriesTreeBrowserProps) {
  const [expandedSeriesIds, setExpandedSeriesIds] = useState<Set<string>>(new Set([rootSeriesId]))
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  const byId = useMemo(() => new Map(allSeries.map((series) => [series.id, series])), [allSeries])

  const root = byId.get(rootSeriesId)
  if (!root) {
    return <p className="text-sm text-muted-foreground">Series not found.</p>
  }

  const collectDescendantIds = (seriesId: string): string[] => {
    const result: string[] = [seriesId]
    const directChildren = allSeries.filter((series) => series.parentId === seriesId)
    for (const child of directChildren) {
      result.push(...collectDescendantIds(child.id))
    }
    return result
  }

  const descendants = collectDescendantIds(rootSeriesId)

  const seriesSlugPath = (seriesId: string) => {
    const path: string[] = []
    let current = byId.get(seriesId) ?? null
    while (current) {
      path.unshift(current.slug)
      current = current.parentId ? byId.get(current.parentId) ?? null : null
    }
    return path
  }

  const getLayerItems = (seriesId: string): TreeItem[] => {
    const childSeriesItems: TreeItem[] = allSeries
      .filter((series) => series.parentId === seriesId)
      .map((series) => ({
        id: series.id,
        type: "series",
        title: series.title,
        date: series.createdAt,
        slugPath: seriesSlugPath(series.id),
      }))

    const directPostItems: TreeItem[] = posts
      .filter((post) => post.seriesId === seriesId)
      .map((post) => ({
        id: post.id,
        type: "post",
        title: post.title,
        date: post.publishedAt ?? post.createdAt,
        slug: post.slug,
      }))

    return [...childSeriesItems, ...directPostItems].sort((first, second) => {
      const diff = new Date(second.date).getTime() - new Date(first.date).getTime()
      return sortOrder === "desc" ? diff : -diff
    })
  }

  const toggleSeries = (seriesId: string) => {
    setExpandedSeriesIds((current) => {
      const next = new Set(current)
      if (next.has(seriesId)) {
        next.delete(seriesId)
      } else {
        next.add(seriesId)
      }
      return next
    })
  }

  const expandAll = () => setExpandedSeriesIds(new Set(descendants))
  const collapseAll = () => setExpandedSeriesIds(new Set([rootSeriesId]))

  const renderLayer = (seriesId: string, depth = 0): React.ReactNode => {
    const items = getLayerItems(seriesId)
    if (!items.length) return null

    return (
      <ul className="space-y-1.5">
        {items.map((item) => {
          if (item.type === "post") {
            return (
              <li key={item.id}>
                <BlogLink
                  href={`/blog/${item.slug}`}
                  className="group flex items-center justify-between rounded-md border border-border/40 bg-card/30 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <span className="text-sm font-medium transition-colors group-hover:text-primary">
                    {item.title}
                  </span>
                  <time className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date)}</time>
                </BlogLink>
              </li>
            )
          }

          const open = expandedSeriesIds.has(item.id)
          const seriesHref = `/blog/series/${item.slugPath.join("/")}`

          return (
            <li key={item.id}>
              <div className="flex items-center gap-1">
                {/* Expand/collapse toggle */}
                <button
                  type="button"
                  onClick={() => toggleSeries(item.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={open ? "Collapse" : "Expand"}
                >
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {/* Series row — click goes to series page */}
                <BlogLink
                  href={seriesHref}
                  className="group flex flex-1 items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 transition-colors hover:border-primary/50 hover:bg-primary/10"
                >
                  <span className="text-sm font-semibold text-primary/80 transition-colors group-hover:text-primary">
                    {item.title}
                  </span>
                  <time className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date)}</time>
                </BlogLink>
              </div>

              {open && (
                <div className="ml-9 mt-1.5 space-y-1.5 border-l border-border/40 pl-3">
                  {renderLayer(item.id, depth + 1)}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contents</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1 rounded-md border border-border/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-orange-500/40 hover:text-orange-600"
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortOrder === "desc" ? "Newest first" : "Oldest first"}
          </button>
          <button
            type="button"
            onClick={expandAll}
            className="rounded-md border border-border/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-md border border-border/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            Collapse all
          </button>
        </div>
      </div>

      {renderLayer(rootSeriesId)}
    </section>
  )
}
