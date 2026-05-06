import { ImageResponse } from "next/og"
import { readBlogPostDb } from "@/lib/blog/store"
import { findPublishedPostBySlug } from "@/lib/blog/queries"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateImageMetadata({ params }: Props) {
  const { slug } = await params
  return [{ id: slug }]
}

export default async function OGImage({ params }: Props) {
  const { slug } = await params

  let title = "Blog Post"
  let excerpt = ""
  let seriesLabel = ""

  try {
    const db = await readBlogPostDb(slug)
    if (db) {
      const post = findPublishedPostBySlug(db, slug)
      if (post) {
        title = post.title
        excerpt = post.excerpt ?? ""
        seriesLabel = post.seriesPath.at(-1)?.title ?? ""
      }
    }
  } catch {
    // fallback to defaults
  }

  // Clamp title length so it fits
  const shortTitle = title.length > 60 ? `${title.slice(0, 58)}…` : title
  const shortExcerpt = excerpt.length > 120 ? `${excerpt.slice(0, 118)}…` : excerpt

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 60%, #1c1917 100%)",
          padding: "64px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top row: series label + logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316" }} />
            <span style={{ color: "#f97316", fontSize: 18, fontWeight: 600, letterSpacing: 2 }}>
              {seriesLabel ? seriesLabel.toUpperCase() : "BLOG"}
            </span>
          </div>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
              <path
                d="M14 48 L14 16 L22 16 L38 36 L38 16 L46 16 L46 48 L38 48 L22 28 L22 48 Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* Middle: title */}
        <div
          style={{
            color: "#ffffff",
            fontSize: shortTitle.length > 40 ? 52 : 64,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: -1.5,
            maxWidth: 1000,
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          {shortTitle}
        </div>

        {/* Bottom: excerpt + author */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          {shortExcerpt && (
            <div
              style={{
                color: "#71717a",
                fontSize: 22,
                lineHeight: 1.5,
                maxWidth: 900,
              }}
            >
              {shortExcerpt}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 16,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              VN
            </div>
            <span style={{ color: "#a1a1aa", fontSize: 20, fontWeight: 500 }}>Victor Nabasu</span>
            <span style={{ color: "#3f3f46", fontSize: 20 }}>·</span>
            <span style={{ color: "#52525b", fontSize: 20 }}>nerosiegfried.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
