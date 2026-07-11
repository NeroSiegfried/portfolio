import { ImageResponse } from "next/og"
import { readBlogPostDb } from "@/lib/blog/store"
import { findPublishedPostBySlug } from "@/lib/blog/queries"
import { OG_SIZE, fetchImageDataUrl, OgCard } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Article — Victor Nabasu"
export const size = OG_SIZE
export const contentType = "image/png"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function OGImage({ params }: Props) {
  const { slug } = await params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nerosiegfried.com"

  let title = "Blog Post"
  let excerpt = ""
  let seriesLabel = ""
  let coverImage = ""

  try {
    const db = await readBlogPostDb(slug)
    if (db) {
      const post = findPublishedPostBySlug(db, slug)
      if (post) {
        title = post.title
        excerpt = post.excerpt ?? ""
        seriesLabel = post.seriesPath.at(-1)?.title ?? ""
        coverImage = post.coverImage ?? ""
      }
    }
  } catch {
    /* fall back to defaults */
  }

  // Feature image: the post's cover, else the hero (portfolio) image.
  const coverUrl = coverImage
    ? (coverImage.startsWith("http") ? coverImage : `${siteUrl}${coverImage.startsWith("/") ? "" : "/"}${coverImage}`)
    : ""
  const imageSrc =
    (await fetchImageDataUrl(coverUrl)) || (await fetchImageDataUrl(`${siteUrl}/hero/hero-2.jpg`))

  const shortTitle = title.length > 76 ? `${title.slice(0, 74)}…` : title
  const titleSize = shortTitle.length > 52 ? 48 : shortTitle.length > 34 ? 58 : 70
  const shortExcerpt = excerpt.length > 116 ? `${excerpt.slice(0, 114)}…` : excerpt

  return new ImageResponse(
    OgCard({
      imageSrc,
      label: seriesLabel ? seriesLabel.toUpperCase().slice(0, 22) : "ARTICLE",
      eyebrow: seriesLabel || "Article",
      title: shortTitle,
      titleSize,
      subtitle: shortExcerpt,
      footer: "Written by Victor Nabasu",
    }),
    OG_SIZE
  )
}
