import Link from "next/link"
import type { BlogPostSummary } from "@/lib/blog/queries"
import BlogLink from "@/components/blog-link"

interface BlogArchiveSidebarProps {
  posts: BlogPostSummary[]
}

/**
 * Classic blog archive: posts grouped by year, newest first.
 * Lives below the series tree in the blog sidebar.
 */
interface DateGroupSection {
  label: string
  posts: BlogPostSummary[]
}

export default function BlogArchiveSidebar({ posts }: BlogArchiveSidebarProps) {
  if (posts.length === 0) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  // Helper to check if two dates are the same day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  // Helper to check if date is in current month
  const isInCurrentMonth = (d: Date) => {
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  }

  // Separate posts into hierarchical buckets
  const sections: DateGroupSection[] = []
  const processed = new Set<string>()

  // Today
  const todayPosts = posts.filter((p) => {
    const d = p.publishedAt ? new Date(p.publishedAt) : null
    return d ? isSameDay(d, today) : false
  })
  if (todayPosts.length > 0) {
    sections.push({ label: "Today", posts: todayPosts })
    todayPosts.forEach((p) => processed.add(p.id))
  }

  // This month (excluding today)
  const thisMonthPosts = posts.filter((p) => {
    if (processed.has(p.id)) return false
    const d = p.publishedAt ? new Date(p.publishedAt) : null
    return d ? isInCurrentMonth(d) : false
  })
  if (thisMonthPosts.length > 0) {
    sections.push({
      label: today.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      posts: thisMonthPosts,
    })
    thisMonthPosts.forEach((p) => processed.add(p.id))
  }

  // Other months in current year (grouped by month)
  const monthsCurrentYear = new Map<string, BlogPostSummary[]>()
  for (const post of posts) {
    if (processed.has(post.id)) continue
    const d = post.publishedAt ? new Date(post.publishedAt) : null
    if (!d || d.getFullYear() !== currentYear) continue

    const monthKey = d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    if (!monthsCurrentYear.has(monthKey)) monthsCurrentYear.set(monthKey, [])
    monthsCurrentYear.get(monthKey)!.push(post)
    processed.add(post.id)
  }

  // Sort months descending within current year
  const monthKeys = Array.from(monthsCurrentYear.keys()).sort((a, b) => {
    const dateA = new Date(a)
    const dateB = new Date(b)
    return dateB.getTime() - dateA.getTime()
  })
  monthKeys.forEach((key) => {
    sections.push({ label: key, posts: monthsCurrentYear.get(key)! })
  })

  // Past years (just year grouping, newest first)
  const byPastYear = new Map<number, BlogPostSummary[]>()
  for (const post of posts) {
    if (processed.has(post.id)) continue
    const year = post.publishedAt
      ? new Date(post.publishedAt).getFullYear()
      : new Date().getFullYear()
    if (!byPastYear.has(year)) byPastYear.set(year, [])
    byPastYear.get(year)!.push(post)
    processed.add(post.id)
  }

  const pastYears = Array.from(byPastYear.keys()).sort((a, b) => b - a)
  pastYears.forEach((year) => {
    sections.push({ label: year.toString(), posts: byPastYear.get(year)! })
  })

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Archive
      </h2>
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 text-xs font-semibold text-foreground/60">
              {section.label}
            </p>
            <ul className="space-y-1.5">
              {section.posts.map((post) => (
                <li key={post.id}>
                  <BlogLink
                    href={`/blog/${post.slug}`}
                    className="flex items-start gap-2 rounded-sm text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {post.publishedAt && (
                      <time
                        dateTime={post.publishedAt}
                        className="mt-px shrink-0 text-xs tabular-nums text-muted-foreground/60"
                      >
                        {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </time>
                    )}
                    <span className="leading-snug">{post.title}</span>
                  </BlogLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
