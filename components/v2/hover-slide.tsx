import { cn } from "@/lib/utils"

/**
 * Hover text-slide (portfolie / portfoliod nav pattern): the label slides up on
 * hover to reveal an identical copy. Pure CSS (see `.v2-slide` in globals.css);
 * put this inside an <a>/<button> and the parent hover drives it.
 */
export function HoverSlide({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn("v2-slide", className)}>
      <span data-text={children}>{children}</span>
    </span>
  )
}
