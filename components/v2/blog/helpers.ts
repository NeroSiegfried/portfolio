import type { BlogPostSummary } from "@/lib/blog/queries"

export function formatDate(iso: string | null) {
  if (!iso) return "Draft"
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? "Draft"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function issueNo(total: number, index: number) {
  return `No. ${String(total - index).padStart(3, "0")}`
}

export function seriesLabel(post: BlogPostSummary) {
  return post.seriesPath.at(-1)?.title ?? "Article"
}

export function seriesHref(post: BlogPostSummary) {
  if (!post.seriesPath.length) return null
  return `/blog/series/${post.seriesPath.map((s) => s.slug).join("/")}`
}

/** Distinct per-post monogram — initials of the first two title words (punctuation stripped). */
export function monogramFor(post: BlogPostSummary) {
  const words = post.title.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean)
  const letters = words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? post.title).slice(0, 2)
  return letters.toUpperCase()
}
