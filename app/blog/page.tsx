import Link from "next/link"
import { readBlogHomeDb } from "@/lib/blog/store"
import { listPublishedPosts, listSeriesTree, listPostsChronological } from "@/lib/blog/queries"
import { getAdminEntryPath } from "@/lib/blog/auth"
import AdminEntryHotkey from "@/components/admin-entry-hotkey"
import BlogPostList from "@/components/blog-post-list"
import BlogSeriesNav from "@/components/blog-series-nav"
import BlogArchiveSidebar from "@/components/blog-archive-sidebar"
import Footer from "@/components/footer"
import { ModeToggle } from "@/components/mode-toggle"
import PortfolioLink from "@/components/portfolio-link"

// ISR: rebuild at most every 60s. CloudFront/CDN serves cached HTML from
// the nearest edge node — no Lambda round-trip to us-east-1 for repeat visitors.
export const revalidate = 60

export default async function BlogHomePage() {
  let db: Awaited<ReturnType<typeof readBlogHomeDb>>
  try {
    db = await readBlogHomeDb()
  } catch (err) {
    console.error("[blog/page] DB unavailable during render:", err)
    // Return a minimal fallback rather than crashing the whole page
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Blog is temporarily unavailable. Please try again in a moment.</p>
      </div>
    )
  }
  const posts = listPublishedPosts(db)
  const chronoPosts = listPostsChronological(db)
  const seriesTree = listSeriesTree(db)
  const adminPath = getAdminEntryPath()

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      {/* Non-sticky top bar: portfolio link + theme toggle — same style as Hero */}
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-6">
          <PortfolioLink className="text-sm text-muted-foreground transition-colors hover:text-primary">
            ← Portfolio
          </PortfolioLink>
          <ModeToggle />
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20 pt-28 flex-1">
        {/* Page header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Blog</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Dev logs, structured learning series, and interactive articles.
          </p>
          <AdminEntryHotkey adminPath={adminPath} />
        </header>

        {/*
          Two-column layout on lg+: [220px sidebar | post list]
          On narrow screens the grid collapses to a single column and
          the sidebar naturally flows to the bottom (order-last).
          No collapsible/details — the full sidebar is always visible.
        */}
        {/*
          Three-section layout:
            Mobile:  Series (row 1) → Post list (row 2) → Archive (row 3)
            Desktop: [Series    | Post list (spans 2 rows)]
                     [Archive   |                          ]
        */}
        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-16">
          {/* Series — mobile: first; desktop: col 1 row 1 */}
          <aside className="lg:col-start-1 lg:row-start-1">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Series
            </h2>
            <div className="rounded-md border border-border/40 bg-card/30 p-3">
              <BlogSeriesNav tree={seriesTree} />
            </div>
          </aside>

          {/* Post list — mobile: second; desktop: col 2 spanning both rows */}
          <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <BlogPostList posts={posts} />
          </div>

          {/* Archive — mobile: last; desktop: col 1 row 2 */}
          <aside className="lg:col-start-1 lg:row-start-2">
            <div className="rounded-md border border-border/40 bg-card/30 p-3">
              <BlogArchiveSidebar posts={chronoPosts} />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
