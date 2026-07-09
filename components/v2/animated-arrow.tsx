import { ArrowUpRight, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Diagonal arrow that animates on hover of the nearest <a>, <button>, or an
 * ancestor with the Tailwind `group` class (stitch-bloom `btn-split` behaviour):
 * the visible arrow slides out while an identical copy slides in from the
 * opposite edge. `direction="up-right"` (default) blooms diagonally; `"left"`
 * renders a back arrow that blooms horizontally. Sizes to the surrounding font
 * (`1em`); pass `className` (e.g. `text-sm`) to tune it. CSS lives in `.v2-arrow*`.
 */
export function AnimatedArrow({
  className,
  direction = "up-right",
}: {
  className?: string
  direction?: "up-right" | "left"
}) {
  const Icon = direction === "left" ? ArrowLeft : ArrowUpRight
  return (
    <span className={cn("v2-arrow", direction === "left" && "v2-arrow--left", className)} aria-hidden>
      <Icon className="v2-arrow__i v2-arrow__i--1" />
      <Icon className="v2-arrow__i v2-arrow__i--2" />
    </span>
  )
}
