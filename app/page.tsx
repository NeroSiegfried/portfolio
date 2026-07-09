import { Analytics } from "@vercel/analytics/next"
import { Cursor } from "@/components/v2/cursor"
import { SiteNav } from "@/components/v2/site-nav"
import { Hero } from "@/components/v2/hero"
import { Stats } from "@/components/v2/stats"
import { About } from "@/components/v2/about"
import { Services } from "@/components/v2/services"
import { Projects } from "@/components/v2/projects"
import { TechStack } from "@/components/v2/tech-stack"
import { LatestPosts, type LatestPost } from "@/components/v2/latest-posts"
import { Faq } from "@/components/v2/faq"
import { Contact } from "@/components/v2/contact"
import { Footer } from "@/components/v2/footer"
import { readBlogHomeDb } from "@/lib/blog/store"
import { listPublishedPosts } from "@/lib/blog/queries"

// ISR: the home now surfaces the 3 latest blog posts.
export const revalidate = 60

const isVercel = !!process.env.VERCEL

async function getLatestPosts(): Promise<LatestPost[]> {
  try {
    const db = await readBlogHomeDb()
    const posts = listPublishedPosts(db)
    return posts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any): LatestPost => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt ?? null,
        series: p.seriesPath?.at?.(-1)?.title ?? null,
        date: p.publishedAt ?? p.createdAt ?? null,
      }))
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
      .slice(0, 3)
  } catch (err) {
    console.error("[home] latest posts unavailable:", err)
    return []
  }
}

export default async function Home() {
  const latest = await getLatestPosts()
  return (
    <>
      {isVercel && <Analytics />}
      <Cursor />
      <SiteNav />
      {/* Frame: vertical rules mark the (tight) margins; sections add top rules. */}
      <main className="mx-4 flex-1 border-x border-border sm:mx-6 lg:mx-8">
        <Hero />
        <Stats />
        <About />
        <Services />
        <Projects />
        <TechStack />
        <LatestPosts posts={latest} />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
