import { ImageResponse } from "next/og"
import { readBlogPostDb } from "@/lib/blog/store"
import { findPublishedPostBySlug } from "@/lib/blog/queries"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Colours from globals.css CSS variables (dark mode)
const BG       = "#1a1a1a"  // --background 0 0% 10%
const CARD     = "#262626"  // --card 0 0% 15%
const BORDER   = "#333333"  // --border 0 0% 20%
const PRIMARY  = "#2e73ff"  // --primary hsl(220 100% 59%)
const SECONDARY= "#f55c14"  // --secondary hsl(12 100% 54%)
const FG       = "#f5f7fc"  // --foreground
const MUTED_FG = "#a3a3a3"  // --muted-foreground 0 0% 64%

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

  // Fetch assets via HTTP — works reliably in all serverless environments
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nerosiegfried.com"
  let portraitSrc = ""
  let logoSrc = ""
  try {
    const [portraitRes, logoRes] = await Promise.all([
      fetch(`${siteUrl}/victor-nabasu.jpg`),
      fetch(`${siteUrl}/logo.svg`),
    ])
    if (portraitRes.ok) {
      const buf = await portraitRes.arrayBuffer()
      portraitSrc = `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`
    }
    if (logoRes.ok) {
      const buf = await logoRes.arrayBuffer()
      logoSrc = `data:image/svg+xml;base64,${Buffer.from(buf).toString("base64")}`
    }
  } catch {
    // assets unavailable — render text-only fallback
  }

  const shortTitle   = title.length > 52   ? `${title.slice(0, 50)}…`   : title
  const shortExcerpt = excerpt.length > 100 ? `${excerpt.slice(0, 98)}…` : excerpt
  const titleSize    = shortTitle.length > 36 ? 50 : shortTitle.length > 24 ? 60 : 72

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex",
          background: BG,
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Blue radial glow — top-left */}
        <div style={{ position: "absolute", top: -120, left: -80, width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, ${PRIMARY}22 0%, transparent 70%)` }} />
        {/* Orange radial glow — bottom-right (behind portrait) */}
        <div style={{ position: "absolute", bottom: -100, right: 200, width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(circle, ${SECONDARY}18 0%, transparent 70%)` }} />
        {/* Subtle dot-grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

        {/* Portrait — right bleed */}
        {portraitSrc && (
          <div style={{ position: "absolute", right: 0, top: 0, width: 400, height: "100%", display: "flex", overflow: "hidden" }}>
            {/* Left-edge fade */}
            <div style={{ position: "absolute", left: 0, top: 0, width: 200, height: "100%", background: `linear-gradient(to right, ${BG} 0%, transparent 100%)`, zIndex: 2 }} />
            {/* Bottom-edge fade */}
            <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 220, background: `linear-gradient(to top, ${BG} 0%, transparent 100%)`, zIndex: 2 }} />
            {/* Blue tint overlay */}
            <div style={{ position: "absolute", inset: 0, background: `${PRIMARY}12`, zIndex: 1 }} />
            <img src={portraitSrc} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: 0.65 }} />
          </div>
        )}

        {/* Content column */}
        <div
          style={{
            position: "relative", zIndex: 10,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            padding: "48px 56px",
            width: portraitSrc ? 760 : "100%",
            height: "100%",
          }}
        >
          {/* ── Top bar: logo + name / category pill ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {logoSrc
                ? <img src={logoSrc} style={{ width: 44, height: 44 }} />
                : <div style={{ width: 44, height: 44, borderRadius: 10, background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800 }}>N</div>
              }
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: FG,      fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>Victor Nabasu</span>
                <span style={{ color: MUTED_FG, fontSize: 13, letterSpacing: 0.3 }}>nerosiegfried.com</span>
              </div>
            </div>
            {/* Category pill — orange */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: `${SECONDARY}18`, border: `1px solid ${SECONDARY}44`, borderRadius: 100, padding: "5px 13px" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: SECONDARY }} />
              <span style={{ color: SECONDARY, fontSize: 12, fontWeight: 700, letterSpacing: 1.8 }}>
                {seriesLabel ? seriesLabel.toUpperCase() : "BLOG"}
              </span>
            </div>
          </div>

          {/* ── Middle: accent + title + excerpt ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1, justifyContent: "center", paddingBottom: 8 }}>
            {/* Blue accent bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 3, borderRadius: 2, background: PRIMARY }} />
              <div style={{ width: 10, height: 3, borderRadius: 2, background: `${PRIMARY}55` }} />
            </div>
            <div style={{ color: FG, fontSize: titleSize, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>
              {shortTitle}
            </div>
            {shortExcerpt && (
              <div style={{ color: MUTED_FG, fontSize: 19, lineHeight: 1.6 }}>
                {shortExcerpt}
              </div>
            )}
          </div>

          {/* ── Bottom: author ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
            {/* Small avatar circle with blue ring */}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>VN</div>
            <span style={{ color: MUTED_FG, fontSize: 15, fontWeight: 500 }}>Victor Nabasu</span>
            <span style={{ color: BORDER, fontSize: 15 }}>·</span>
            <span style={{ color: `${MUTED_FG}88`, fontSize: 15 }}>nerosiegfried.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
