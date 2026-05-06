import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const alt = "Victor Nabasu — Full Stack Developer & Engineer"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const BG        = "#1a1a1a"
const BORDER    = "#333333"
const PRIMARY   = "#2e73ff"
const SECONDARY = "#f55c14"
const FG        = "#f5f7fc"
const MUTED_FG  = "#a3a3a3"

export default async function OGImage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nerosiegfried.com"
  let portraitSrc = ""
  let logoSrc = ""
  try {
    const [portraitRes, logoRes] = await Promise.all([
      fetch(`${siteUrl}/victor-nabasu.jpg`),
      fetch(`${siteUrl}/logo.svg`),
    ])
    if (portraitRes.ok) portraitSrc = `data:image/jpeg;base64,${Buffer.from(await portraitRes.arrayBuffer()).toString("base64")}`
    if (logoRes.ok)    logoSrc    = `data:image/svg+xml;base64,${Buffer.from(await logoRes.arrayBuffer()).toString("base64")}`
  } catch { /* render text-only fallback */ }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BG, fontFamily: "'Inter', system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Blue glow — top-left */}
        <div style={{ position: "absolute", top: -140, left: -100, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${PRIMARY}26 0%, transparent 70%)` }} />
        {/* Orange glow — bottom-right */}
        <div style={{ position: "absolute", bottom: -80, right: 160, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${SECONDARY}1a 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

        {/* Portrait */}
        {portraitSrc && (
          <div style={{ position: "absolute", right: 0, top: 0, width: 400, height: "100%", display: "flex", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 200, height: "100%", background: `linear-gradient(to right, ${BG} 0%, transparent 100%)`, zIndex: 2 }} />
            <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 220, background: `linear-gradient(to top, ${BG} 0%, transparent 100%)`, zIndex: 2 }} />
            <div style={{ position: "absolute", inset: 0, background: `${PRIMARY}10`, zIndex: 1 }} />
            <img src={portraitSrc} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: 0.65 }} />
          </div>
        )}

        {/* Content */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 56px", width: portraitSrc ? 760 : "100%", height: "100%" }}>
          {/* Top */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {logoSrc
                ? <img src={logoSrc} style={{ width: 44, height: 44 }} />
                : <div style={{ width: 44, height: 44, borderRadius: 10, background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800 }}>N</div>
              }
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: FG,       fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>Victor Nabasu</span>
                <span style={{ color: MUTED_FG, fontSize: 13, letterSpacing: 0.3 }}>nerosiegfried.com</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: `${SECONDARY}18`, border: `1px solid ${SECONDARY}44`, borderRadius: 100, padding: "5px 13px" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: SECONDARY }} />
              <span style={{ color: SECONDARY, fontSize: 12, fontWeight: 700, letterSpacing: 1.8 }}>PORTFOLIO</span>
            </div>
          </div>

          {/* Middle */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 3, borderRadius: 2, background: PRIMARY }} />
              <div style={{ width: 10, height: 3, borderRadius: 2, background: `${PRIMARY}55` }} />
            </div>
            <div style={{ color: FG, fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Victor Nabasu</div>
            <div style={{ color: MUTED_FG, fontSize: 21, lineHeight: 1.55 }}>Full Stack Developer & Engineer · MSc Advanced Software Engineering, King's College London</div>
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
            <span style={{ color: MUTED_FG, fontSize: 15 }}>Software Engineer</span>
            <span style={{ color: BORDER,   fontSize: 15 }}>·</span>
            <span style={{ color: `${MUTED_FG}88`, fontSize: 15 }}>London, UK</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
