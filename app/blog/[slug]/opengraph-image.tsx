import { ImageResponse } from "next/og"
import { readBlogPostDb } from "@/lib/blog/store"
import { findPublishedPostBySlug } from "@/lib/blog/queries"
import fs from "fs"
import path from "path"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

interface Props {
  params: Promise<{ slug: string }>
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

  // Load assets
  const publicDir = path.join(process.cwd(), "public")
  const logoSvgB64 = fs.readFileSync(path.join(publicDir, "logo.svg")).toString("base64")
  const logoSrc = `data:image/svg+xml;base64,${logoSvgB64}`
  const portraitBuf = fs.readFileSync(path.join(publicDir, "victor-nabasu.jpg"))
  const portraitSrc = `data:image/jpeg;base64,${portraitBuf.toString("base64")}`

  const shortTitle = title.length > 55 ? `${title.slice(0, 53)}…` : title
  const shortExcerpt = excerpt.length > 110 ? `${excerpt.slice(0, 108)}…` : excerpt
  const titleFontSize = shortTitle.length > 38 ? 50 : shortTitle.length > 25 ? 60 : 72

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#09090b",
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle dot-grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Left glow */}
        <div
          style={{
            position: "absolute",
            left: -120,
            top: "50%",
            transform: "translateY(-50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Portrait photo — right side, full-height bleed */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 420,
            height: "100%",
            display: "flex",
            overflow: "hidden",
          }}
        >
          {/* Fade mask on left edge of portrait */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 180,
              height: "100%",
              background: "linear-gradient(to right, #09090b 0%, transparent 100%)",
              zIndex: 2,
            }}
          />
          {/* Fade at bottom */}
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100%",
              height: 200,
              background: "linear-gradient(to top, #09090b 0%, transparent 100%)",
              zIndex: 2,
            }}
          />
          <img
            src={portraitSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              opacity: 0.75,
              filter: "grayscale(20%)",
            }}
          />
        </div>

        {/* Content column */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 60px",
            width: 780,
            height: "100%",
          }}
        >
          {/* Top: logo + category label */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={logoSrc} style={{ width: 48, height: 48 }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#ffffff", fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>
                  Victor Nabasu
                </span>
                <span style={{ color: "#71717a", fontSize: 14, letterSpacing: 0.5 }}>nerosiegfried.com</span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(249,115,22,0.12)",
                border: "1px solid rgba(249,115,22,0.3)",
                borderRadius: 100,
                padding: "6px 14px",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316" }} />
              <span style={{ color: "#f97316", fontSize: 13, fontWeight: 600, letterSpacing: 1.5 }}>
                {seriesLabel ? seriesLabel.toUpperCase() : "BLOG"}
              </span>
            </div>
          </div>

          {/* Middle: title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, justifyContent: "center" }}>
            {/* Orange accent line */}
            <div style={{ width: 48, height: 4, borderRadius: 2, background: "#f97316" }} />
            <div
              style={{
                color: "#ffffff",
                fontSize: titleFontSize,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: -2,
              }}
            >
              {shortTitle}
            </div>
            {shortExcerpt && (
              <div
                style={{
                  color: "#71717a",
                  fontSize: 20,
                  lineHeight: 1.55,
                }}
              >
                {shortExcerpt}
              </div>
            )}
          </div>

          {/* Bottom: date area / domain stamp */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: 20,
            }}
          >
            <span style={{ color: "#3f3f46", fontSize: 16 }}>Written by</span>
            <span style={{ color: "#a1a1aa", fontSize: 16, fontWeight: 600 }}>Victor Nabasu</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
