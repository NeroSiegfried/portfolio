import Image from "next/image"
import Link from "next/link"
import type { BlogPostSummary } from "@/lib/blog/queries"
import { AnimatedArrow } from "@/components/v2/animated-arrow"
import { PostCover } from "@/components/v2/blog/post-cover"
import { formatDate, monogramFor, seriesLabel } from "@/components/v2/blog/helpers"
import { cn } from "@/lib/utils"

/**
 * Reado-style post card: a bordered box with an image-led cover (the post's
 * cover image, or a typographic monogram fallback), a squared series tag, serif
 * title, excerpt and read link. On hover the cover greys + a veil fades in while
 * the title gets a highlighter sweep (`.v2-card-cover` / `.v2-hl` in globals.css).
 */
export function PostCard({ post, no, size = "sm" }: { post: BlogPostSummary; no: string; size?: "sm" | "lg" }) {
  const label = seriesLabel(post)
  return (
    <Link
      href={`/blog/${post.slug}`}
      data-cursor
      data-cursor-label="Read post"
      className="group flex h-full flex-col border border-border bg-card/30 transition-colors hover:border-primary/50"
    >
      <div className={cn("v2-card-cover relative", size === "lg" ? "aspect-[16/10]" : "aspect-[4/3]")}>
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <PostCover monogram={monogramFor(post)} className="absolute inset-0 h-full w-full" />
        )}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center border border-border/70 bg-background/75 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-foreground backdrop-blur-sm">
          {label}
        </span>
        <span className="absolute right-3 top-3 z-10 font-mono text-[0.62rem] tracking-[0.14em] text-white mix-blend-difference">{no}</span>
      </div>
      <div className={cn("flex flex-1 flex-col p-5", size === "lg" && "md:p-6")}>
        <h3 className={cn("font-serif leading-snug text-foreground", size === "lg" ? "text-2xl md:text-3xl" : "text-xl")}>
          <span className="v2-hl">{post.title}</span>
        </h3>
        {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p> : null}
        <div className="mt-auto flex items-center gap-3 pt-5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <time>{formatDate(post.publishedAt ?? post.createdAt)}</time>
          <span className="ml-auto inline-flex items-center gap-1.5 text-primary">Read <AnimatedArrow className="text-sm" /></span>
        </div>
      </div>
    </Link>
  )
}
