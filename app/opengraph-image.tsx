import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Victor Nabasu — Full Stack Developer & Engineer"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 60%, #1c1917 100%)",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid accent lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo mark — N monogram */}
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 72,
            width: 72,
            height: 72,
            borderRadius: 16,
            background: "#27272a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
            <path
              d="M14 48 L14 16 L22 16 L38 36 L38 16 L46 16 L46 48 L38 48 L22 28 L22 48 Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#f97316",
            }}
          />
          <span style={{ color: "#f97316", fontSize: 18, fontWeight: 600, letterSpacing: 2 }}>
            PORTFOLIO
          </span>
        </div>

        {/* Name */}
        <div
          style={{
            color: "#ffffff",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            marginBottom: 20,
          }}
        >
          Victor Nabasu
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: "#a1a1aa",
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.4,
            maxWidth: 780,
          }}
        >
          Full Stack Developer & Engineer · MSc Advanced Software Engineering, King's College London
        </div>
      </div>
    ),
    { ...size }
  )
}
