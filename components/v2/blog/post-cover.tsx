import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Typographic cover panel — the "image" for image-led blog cards.
 *
 * Reado's cards are image-led (a mix of photographic AND typographic covers).
 * The posts here have no photos, so every card gets an on-brand typographic
 * cover: an oversized faint monogram + an accent tick, sized to the cover width
 * via container queries. Overlays (tags, issue number) are passed as children.
 */
export function PostCover({
  monogram,
  className,
  children,
}: {
  monogram: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn("relative overflow-hidden bg-secondary [container-type:inline-size]", className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[34cqw] font-bold uppercase leading-none tracking-[-0.05em] text-foreground/[0.08] transition-transform duration-700 ease-out group-hover:scale-[1.06]"
      >
        {monogram}
      </span>
      <span aria-hidden className="absolute bottom-3 left-3 h-1 w-9 bg-primary" />
      {children}
    </div>
  )
}
