import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { BlogPostSummary } from "@/lib/blog/queries"
import { monogramFor, seriesLabel } from "@/components/v2/blog/helpers"
import { cn } from "@/lib/utils"

/** Small square thumbnail — the post's cover image, or a typographic monogram. */
function Thumb({ post }: { post: BlogPostSummary }) {
  return (
    <span className="relative aspect-square h-12 w-12 shrink-0 overflow-hidden border border-border bg-secondary">
      {post.coverImage ? (
        <Image src={post.coverImage} alt="" fill sizes="48px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-display text-sm font-semibold text-muted-foreground">
          {monogramFor(post)}
        </span>
      )}
    </span>
  )
}

/**
 * Previous / next post navigation (reado). A squared two-column bar placed at
 * the top and bottom of an article, each side showing a thumbnail. The grid is
 * always two columns on ≥sm, so a lone prev/next stays half-width (the other
 * cell is an empty placeholder). `size="lg"` is the fuller bottom bar.
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
    <div className="grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          className="group flex min-w-0 items-center gap-3.5 border border-border bg-card/30 px-4 py-3 transition-colors hover:border-primary/60 md:px-5"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
          <Thumb post={prev} />
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
          className="group flex min-w-0 items-center justify-end gap-3.5 border border-border bg-card/30 px-4 py-3 text-right transition-colors hover:border-primary/60 md:px-5"
        >
          <span className="min-w-0">
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              Next · {seriesLabel(next)}
            </span>
            <span className={cn("mt-0.5 block truncate font-serif text-foreground transition-colors group-hover:text-primary", lg ? "text-base md:text-lg" : "text-sm")}>
              {next.title}
            </span>
          </span>
          <Thumb post={next} />
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
    </div>
  )
}
