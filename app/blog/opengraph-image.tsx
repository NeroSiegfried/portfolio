import { ImageResponse } from "next/og"
import fs from "fs"
import path from "path"

export const runtime = "nodejs"
export const alt = "Blog — Victor Nabasu"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  const publicDir = path.join(process.cwd(), "public")
  const logoSrc = `data:image/svg+xml;base64,${fs.readFileSync(path.join(publicDir, "logo.svg")).toString("base64")}`
  const portraitSrc = `data:image/jpeg;base64,${fs.readFileSync(path.join(publicDir, "victor-nabasu.jpg")).toString("base64")}`

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
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "absolute", left: -120, top: "50%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 420, height: "100%", display: "flex", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 180, height: "100%", background: "linear-gradient(to right, #09090b 0%, transparent 100%)", zIndex: 2 }} />
          <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 200, background: "linear-gradient(to top, #09090b 0%, transparent 100%)", zIndex: 2 }} />
          <img src={portraitSrc} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: 0.7, filter: "grayscale(15%)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 60px", width: 780, height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={logoSrc} style={{ width: 48, height: 48 }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#ffffff", fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>Victor Nabasu</span>
                <span style={{ color: "#71717a", fontSize: 14, letterSpacing: 0.5 }}>nerosiegfried.com</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 100, padding: "6px 14px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316" }} />
              <span style={{ color: "#f97316", fontSize: 13, fontWeight: 600, letterSpacing: 1.5 }}>BLOG</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ width: 48, height: 4, borderRadius: 2, background: "#f97316" }} />
            <div style={{ color: "#ffffff", fontSize: 80, fontWeight: 800, lineHeight: 1.0, letterSpacing: -2 }}>The Blog</div>
            <div style={{ color: "#71717a", fontSize: 22, lineHeight: 1.5 }}>Dev logs, structured learning series, and interactive articles.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 }}>
            <span style={{ color: "#3f3f46", fontSize: 16 }}>Written by</span>
            <span style={{ color: "#52525b", fontSize: 16 }}>Victor Nabasu</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
