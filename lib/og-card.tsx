/* Shared builder for the v2 Open Graph share cards (portfolio, blog, posts).
   The design mirrors the site hero: a real full-bleed image (hero-2.jpg, or a
   post's cover) under a dark legibility scrim, with squared burnt-orange accents,
   a thin inset frame and editorial type — deliberately NOT the old blue/glow/
   dot-grid card. Uses only existing site assets. Satori-safe styles only
   (flexbox, no grid; every multi-child node sets display:flex). */
import type { CSSProperties, ReactElement } from "react"

export const OG_SIZE = { width: 1200, height: 630 }

const BG     = "#0b0a0a"
const FG     = "#f4f1ea"
const MUTED  = "rgba(244,241,234,0.74)"
const FAINT  = "rgba(244,241,234,0.5)"
const ACCENT = "#fb460d"                 // --primary
const LINE   = "rgba(244,241,234,0.16)"
const SHADOW = "0 2px 20px rgba(0,0,0,0.55)"  // keeps text legible over bright image areas

/** Fetch an image and inline it as a data URL (satori can't load remote URLs).
    Returns "" on any failure so the caller can fall back. */
export async function fetchImageDataUrl(url: string): Promise<string> {
  if (!url) return ""
  try {
    // A social-card asset should never be able to stall an entire production
    // build when the public origin or CDN is slow. The card already has a
    // plain-background fallback, so fail fast and let that render instead.
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return ""
    const buf = Buffer.from(await res.arrayBuffer())
    const ct = res.headers.get("content-type") || "image/jpeg"
    return `data:${ct};base64,${buf.toString("base64")}`
  } catch {
    return ""
  }
}

export interface OgCardProps {
  imageSrc: string          // data URL of the feature image ("" → plain dark card)
  label: string             // squared chip, e.g. "PORTFOLIO" / "BLOG"
  eyebrow?: string          // small tracked line above the title
  title: string
  titleSize?: number
  subtitle?: string
  footer?: string
}

const flexCol: CSSProperties = { display: "flex", flexDirection: "column" }

export function OgCard({ imageSrc, label, eyebrow, title, titleSize = 76, subtitle, footer }: OgCardProps): ReactElement {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: BG, overflow: "hidden", fontFamily: "'Inter Tight', Inter, system-ui, sans-serif" }}>
      {imageSrc ? (
        <img src={imageSrc} width={OG_SIZE.width} height={OG_SIZE.height} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}

      {/* legibility scrims — left-weighted (text sits left) + bottom */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(11,10,10,0.95) 0%, rgba(11,10,10,0.82) 42%, rgba(11,10,10,0.4) 66%, rgba(11,10,10,0) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(11,10,10,0.94) 0%, rgba(11,10,10,0.25) 54%, rgba(11,10,10,0) 100%)" }} />

      {/* thin inset frame */}
      <div style={{ position: "absolute", top: 26, left: 26, right: 26, bottom: 26, border: `1px solid ${LINE}` }} />

      {/* content */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "58px 66px" }}>
        {/* top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={flexCol}>
            <span style={{ color: FG, fontSize: 22, fontWeight: 600, letterSpacing: -0.2, textShadow: SHADOW }}>Victor Nabasu</span>
            <span style={{ color: FAINT, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", marginTop: 3, textShadow: SHADOW }}>nerosiegfried.com</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(11,10,10,0.35)", border: `1px solid ${ACCENT}`, padding: "7px 13px" }}>
            <div style={{ width: 7, height: 7, background: ACCENT }} />
            <span style={{ color: ACCENT, fontSize: 13, fontWeight: 700, letterSpacing: 3, marginLeft: 9 }}>{label}</span>
          </div>
        </div>

        {/* bottom block */}
        <div style={flexCol}>
          {eyebrow ? <span style={{ color: MUTED, fontSize: 15, letterSpacing: 4, textTransform: "uppercase", marginBottom: 18, textShadow: SHADOW }}>{eyebrow}</span> : null}
          <div style={{ width: 54, height: 5, background: ACCENT, marginBottom: 20 }} />
          <div style={{ color: FG, fontSize: titleSize, fontWeight: 700, lineHeight: 1.02, letterSpacing: -1.8, maxWidth: 720, display: "flex", textShadow: SHADOW }}>{title}</div>
          {subtitle ? <span style={{ color: MUTED, fontSize: 23, lineHeight: 1.42, marginTop: 20, maxWidth: 640, display: "flex", textShadow: SHADOW }}>{subtitle}</span> : null}
          {footer ? <span style={{ color: FAINT, fontSize: 15, letterSpacing: 2.5, textTransform: "uppercase", marginTop: 24, display: "flex", textShadow: SHADOW }}>{footer}</span> : null}
        </div>
      </div>
    </div>
  )
}
