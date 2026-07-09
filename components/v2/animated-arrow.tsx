import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Diagonal arrow that animates on hover of the nearest <a>, <button>, or an
 * ancestor with the Tailwind `group` class (stitch-bloom `btn-split` behaviour):
 * the visible arrow slides out to the top-right while an identical copy slides in
 * from the bottom-left. Sizes to the surrounding font (`1em`); pass `className`
 * (e.g. `text-sm`) to tune it. Behaviour lives in `.v2-arrow*` CSS.
 */
export function AnimatedArrow({ className }: { className?: string }) {
  return (
    <span className={cn("v2-arrow", className)} aria-hidden>
      <ArrowUpRight className="v2-arrow__i v2-arrow__i--1" />
      <ArrowUpRight className="v2-arrow__i v2-arrow__i--2" />
    </span>
  )
}
