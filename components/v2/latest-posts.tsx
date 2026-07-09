"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { SectionHead } from "@/components/v2/primitives"
import { useBasePath, withBase } from "@/lib/base-path"

export interface LatestPost {
  slug: string
  title: string
  excerpt: string | null
  series: string | null
  date: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function LatestPosts({ posts }: { posts: LatestPost[] }) {
  const basePath = useBasePath()
  if (!posts?.length) return null

  return (
    <section className="border-t border-border px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Writing"
          label="From the blog"
          title={
            <span className="flex items-center gap-3">
              Latest from the blog
            </span>
          }
        />
        <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
          {posts.slice(0, 3).map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-background"
            >
              <Link href={withBase(basePath, `/blog/${post.slug}`)} className="group flex h-full flex-col p-6 transition-colors hover:bg-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                    {post.series ?? "Article"}
                  </span>
                  <span className="font-mono text-[0.7rem] text-muted-foreground">{formatDate(post.date)}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl leading-snug text-foreground">{post.title}</h3>
                {post.excerpt ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                ) : null}
                <span className="mt-auto flex items-center gap-1.5 pt-6 font-mono text-xs uppercase tracking-[0.12em] text-primary">
                  Read <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="mt-8">
          <Link
            href={withBase(basePath, "/blog")}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary"
          >
            View all posts <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
