import type { Metadata } from "next"
import { readBlogHomeDb } from "@/lib/blog/store"
import { listPublishedPosts, listSeriesTree } from "@/lib/blog/queries"
import { getAdminEntryPath } from "@/lib/blog/auth"
import AdminEntryHotkey from "@/components/admin-entry-hotkey"
import { Cursor } from "@/components/v2/cursor"
import { BlogNav } from "@/components/v2/blog/blog-nav"
import { BlogIndex } from "@/components/v2/blog/blog-index"
import { Footer } from "@/components/v2/footer"

// ISR: rebuild at most every 60s. CloudFront/CDN serves cached HTML from
// the nearest edge node — no Lambda round-trip to us-east-1 for repeat visitors.
export const revalidate = 60

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Dev logs, structured learning series, and interactive articles by Victor Nabasu.",
  openGraph: {
    title: "Blog — Victor Nabasu",
    description:
      "Dev logs, structured learning series, and interactive articles by Victor Nabasu.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Victor Nabasu",
  },
}

export default async function BlogHomePage() {
  let db: Awaited<ReturnType<typeof readBlogHomeDb>>
  try {
    db = await readBlogHomeDb()
  } catch (err) {
    console.error("[blog/page] DB unavailable during render:", err)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Blog is temporarily unavailable. Please try again in a moment.</p>
      </div>
    )
  }

  const posts = listPublishedPosts(db)
  const seriesTree = listSeriesTree(db)
  const adminPath = getAdminEntryPath()

  return (
    <>
      <Cursor />
      <BlogNav />
      <AdminEntryHotkey adminPath={adminPath} />
      {/* Framed content column — mirrors the portfolio home so the two feel unified. */}
      <div className="relative bg-background">
        <div className="mx-3 border-x border-border md:mx-4">
          <BlogIndex posts={posts} seriesTree={seriesTree} />
          <Footer />
        </div>
      </div>
    </>
  )
}
