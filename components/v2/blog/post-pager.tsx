import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { BlogPostSummary } from "@/lib/blog/queries"
import { seriesLabel } from "@/components/v2/blog/helpers"
import { cn } from "@/lib/utils"

/**
 * Previous / next post navigation (reado). A squared two-column bar placed at
 * the top and bottom of an article. `size="sm"` is the slim top bar (single-line
 * title); `size="lg"` is the fuller bottom bar. Pure links → server component.
 */
export function PostPager({
  prev,
  next,
  size = "sm",
}: {
  prev: BlogPostSummary | null
  next: BlogPostSummary | null
  size?: "sm" | "lg"
}) {
  if (!prev && !next) return null
  const lg = size === "lg"

  return (
    <div className={cn("grid gap-3", prev && next ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          className="group flex min-w-0 items-center gap-3 border border-border bg-card/30 px-4 py-3.5 transition-colors hover:border-primary/60 md:px-5"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
          <span className="min-w-0">
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              Previous · {seriesLabel(prev)}
            </span>
            <span className={cn("mt-0.5 block truncate font-serif text-foreground transition-colors group-hover:text-primary", lg ? "text-base md:text-lg" : "text-sm")}>
              {prev.title}
            </span>
          </span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}

      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex min-w-0 items-center justify-end gap-3 border border-border bg-card/30 px-4 py-3.5 text-right transition-colors hover:border-primary/60 md:px-5"
        >
          <span className="min-w-0">
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              Next · {seriesLabel(next)}
            </span>
            <span className={cn("mt-0.5 block truncate font-serif text-foreground transition-colors group-hover:text-primary", lg ? "text-base md:text-lg" : "text-sm")}>
              {next.title}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
    </div>
  )
}
