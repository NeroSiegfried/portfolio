"use client"

// Responsive device composition (MacBook Pro + Studio Display + iPad Pro +
// iPhone 14 Pro). Ported verbatim from the v1 projects showcase so the v2
// projects section can reuse it while the v1 library stays untouched.
// Device frame CSS lives in app/globals.css (token-independent grays).
// NOTE: the inline styles here are COMPUTED GEOMETRY (ResizeObserver-driven
// transform:scale), the one allowed inline-style case — no static styling.

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import type { Project } from "@/lib/portfolio-data"

// CSS component natural dimensions (px)
const D = {
  iphone: { w: 428, h: 868 },
  ipad: { w: 560, h: 778 },
  studio: { w: 656, h: 500 },
  macbook: { w: 740, h: 434 },
} as const

const CSS_SCALE = {
  iphone: 303 / 868,
  ipad: 509 / 778,
  studio: 691 / 500,
  macbook: 434 / 434,
} as const

const SLOT = {
  iphone: { w: Math.round(D.iphone.w * CSS_SCALE.iphone), h: Math.round(D.iphone.h * CSS_SCALE.iphone) },
  ipad: { w: Math.round(D.ipad.w * CSS_SCALE.ipad), h: Math.round(D.ipad.h * CSS_SCALE.ipad) },
  studio: { w: Math.round(D.studio.w * CSS_SCALE.studio), h: Math.round(D.studio.h * CSS_SCALE.studio) },
  macbook: { w: Math.round(D.macbook.w * CSS_SCALE.macbook), h: Math.round(D.macbook.h * CSS_SCALE.macbook) },
} as const

const STAGE_H = 691
const STAGE_W = 1774
const COLLAPSE_W = 680

const POS = {
  iphone: { left: 0, top: STAGE_H - SLOT.iphone.h, z: 4 },
  ipad: { left: 88, top: STAGE_H - SLOT.ipad.h, z: 2 },
  studio: { left: 308, top: STAGE_H - SLOT.studio.h, z: 1 },
  macbook: { left: 1034, top: STAGE_H - SLOT.macbook.h, z: 3 },
} as const

function ScaledBox({ w, h, scale, children }: { w: number; h: number; scale: number; children: React.ReactNode }) {
  return (
    <div style={{ width: w * scale, height: h * scale, position: "relative", overflow: "hidden", flexShrink: 0, ["--device-scale" as string]: scale }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  )
}

type DeviceType = "macbook" | "ipad" | "iphone" | "studio"

const WALLPAPERS: Record<DeviceType, { lg: string; md: string; sm: string }> = {
  macbook: { lg: "/wallpapers/macbook.jpg", md: "/wallpapers/macbook-md.jpg", sm: "/wallpapers/macbook-sm.jpg" },
  ipad: { lg: "/wallpapers/ipad.jpg", md: "/wallpapers/ipad-md.jpg", sm: "/wallpapers/ipad-sm.jpg" },
  iphone: { lg: "/wallpapers/iphone.jpg", md: "/wallpapers/iphone-md.jpg", sm: "/wallpapers/iphone-sm.jpg" },
  studio: { lg: "/wallpapers/studio_display.jpg", md: "/wallpapers/studio_display-md.jpg", sm: "/wallpapers/studio_display-sm.jpg" },
}

function ScreenContent({
  url, alt, deviceType, fallbackLiveUrl, projectId, projectPosition = 0,
}: {
  url?: string
  alt: string
  deviceType: DeviceType
  fallbackLiveUrl?: string
  projectId?: number
  projectPosition?: number
}) {
  const imgStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" }
  const wrapStyle: React.CSSProperties = { position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit" }

  const hiUrl = url ?? (fallbackLiveUrl && projectId != null ? `/projects/${projectId}-${deviceType}.png` : null)
  const isProjectFile = typeof hiUrl === "string" && hiUrl.startsWith("/projects/") && hiUrl.endsWith(".png")
  const loUrl = isProjectFile ? hiUrl.replace(".png", "-lo.jpg") : hiUrl
  const mdUrl = isProjectFile ? hiUrl.replace(".png", "-md.jpg") : hiUrl

  const [src, setSrc] = useState<string | null>(loUrl ?? null)

  useEffect(() => {
    if (!hiUrl || !isProjectFile || !loUrl || !mdUrl) return
    const preload = (u: string): Promise<string> =>
      new Promise((resolve) => {
        const img = document.createElement("img")
        img.onload = () => resolve(u)
        img.onerror = () => resolve("")
        img.src = u
      })
    const getTarget = (): "md" | "hi" | null => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conn = (navigator as any).connection as { saveData?: boolean; effectiveType?: string } | undefined
      if (conn?.saveData) return null
      const et = conn?.effectiveType
      if (et === "slow-2g" || et === "2g") return null
      if (et === "3g") return "md"
      return (window.devicePixelRatio ?? 1) >= 2 ? "hi" : "md"
    }
    const upgrade = async () => {
      await new Promise<void>((r) => setTimeout(r, projectPosition * 400))
      const target = getTarget()
      if (!target) return
      const loaded = await preload(mdUrl)
      if (loaded) setSrc(loaded)
      if (target === "hi") {
        const hi = await preload(hiUrl)
        if (hi) setSrc(hi)
      }
    }
    if (document.readyState === "complete") {
      upgrade()
    } else {
      window.addEventListener("load", upgrade, { once: true })
      return () => window.removeEventListener("load", upgrade)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiUrl, loUrl, mdUrl, projectPosition])

  if (!hiUrl) {
    const wp = WALLPAPERS[deviceType]
    return (
      <div style={wrapStyle}>
        <picture style={{ width: "100%", height: "100%", display: "block" }}>
          <source srcSet={wp.sm} media="(max-width: 640px)" />
          <source srcSet={wp.md} media="(max-width: 1280px)" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wp.lg} alt={alt} loading="lazy" decoding="async" style={imgStyle} />
        </picture>
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src ?? loUrl ?? ""}
        alt={alt}
        loading={projectPosition === 0 ? "eager" : "lazy"}
        decoding="async"
        style={imgStyle}
        onError={(e) => {
          const el = e.currentTarget
          if (el.src !== hiUrl) el.src = hiUrl
        }}
      />
    </div>
  )
}

function MacbookFrame({ project, projectPosition }: { project: Project; projectPosition: number }) {
  return (
    <div className="device device-macbook-pro">
      <div className="device-frame">
        <div className="device-screen">
          <ScreenContent url={project.desktopPreviewUrl} alt={`${project.title} — desktop`} deviceType="macbook" fallbackLiveUrl={project.liveUrl} projectId={project.id} projectPosition={projectPosition} />
        </div>
      </div>
      <div className="device-stripe" />
      <div className="device-header" />
      <div className="device-sensors" />
      <div className="device-btns" />
      <div className="device-power" />
      <div className="device-home" />
    </div>
  )
}

function IpadFrame({ project, projectPosition }: { project: Project; projectPosition: number }) {
  return (
    <div className="device device-ipad-pro">
      <div className="device-frame">
        <div className="device-screen">
          <ScreenContent url={project.ipadUrl} alt={`${project.title} — tablet`} deviceType="ipad" fallbackLiveUrl={project.liveUrl} projectId={project.id} projectPosition={projectPosition} />
        </div>
      </div>
      <div className="device-stripe" />
      <div className="device-header" />
      <div className="device-sensors" />
      <div className="device-btns" />
      <div className="device-power" />
      <div className="device-home" />
    </div>
  )
}

function IphoneFrame({ project, projectPosition }: { project: Project; projectPosition: number }) {
  return (
    <div className="device device-iphone-14-pro">
      <div className="device-frame">
        <div className="device-screen">
          <ScreenContent url={project.mobilePreviewUrl} alt={`${project.title} — mobile`} deviceType="iphone" fallbackLiveUrl={project.liveUrl} projectId={project.id} projectPosition={projectPosition} />
        </div>
      </div>
      <div className="device-stripe" />
      <div className="device-header" />
      <div className="device-sensors" />
      <div className="device-btns" />
      <div className="device-power" />
      <div className="device-home" />
    </div>
  )
}

function StudioDisplayFrame({ project, projectPosition }: { project: Project; projectPosition: number }) {
  return (
    <div className="studio-display">
      <div className="sd-bezels">
        <div className="sd-screen">
          <ScreenContent url={project.studioDisplayUrl} alt={`${project.title} — display`} deviceType="studio" fallbackLiveUrl={project.liveUrl} projectId={project.id} projectPosition={projectPosition} />
        </div>
      </div>
      <div className="sd-stand">
        <div className="sd-stand-body" />
        <div className="sd-stand-foot" />
      </div>
    </div>
  )
}

export function WebPreview({ project, projectPosition }: { project: Project; projectPosition: number }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)

  useLayoutEffect(() => {
    const el = outerRef.current
    if (!el) return
    setContainerW(el.getBoundingClientRect().width)
    const obs = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const stageScale = containerW > 0 ? containerW / STAGE_W : 0
  const collapsed = containerW > 0 && containerW < COLLAPSE_W
  const pairTotalSlotW = SLOT.iphone.w + SLOT.ipad.w
  const pairScale = containerW > 0 ? containerW / pairTotalSlotW : 0

  return (
    <div ref={outerRef} className="mx-auto mt-8 w-full">
      {containerW === 0 && <div style={{ height: 200 }} />}

      {collapsed && (
        <div className="flex flex-col gap-8">
          <ScaledBox w={D.macbook.w} h={D.macbook.h} scale={(containerW / SLOT.macbook.w) * CSS_SCALE.macbook}>
            <MacbookFrame project={project} projectPosition={projectPosition} />
          </ScaledBox>
          <ScaledBox w={D.studio.w} h={D.studio.h} scale={(containerW / SLOT.studio.w) * CSS_SCALE.studio}>
            <StudioDisplayFrame project={project} projectPosition={projectPosition} />
          </ScaledBox>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
            <ScaledBox w={D.ipad.w} h={D.ipad.h} scale={pairScale * CSS_SCALE.ipad}>
              <IpadFrame project={project} projectPosition={projectPosition} />
            </ScaledBox>
            <div style={{ marginLeft: -30 * pairScale * CSS_SCALE.iphone }}>
              <ScaledBox w={D.iphone.w} h={D.iphone.h} scale={pairScale * CSS_SCALE.iphone}>
                <IphoneFrame project={project} projectPosition={projectPosition} />
              </ScaledBox>
            </div>
          </div>
        </div>
      )}

      {!collapsed && containerW > 0 && (
        <div style={{ position: "relative", overflow: "hidden", width: "100%", height: STAGE_H * stageScale }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: STAGE_W, height: STAGE_H, transform: `scale(${stageScale})`, transformOrigin: "top left" }}>
            <div style={{ position: "absolute", left: POS.studio.left, top: POS.studio.top, zIndex: POS.studio.z, width: D.studio.w, height: D.studio.h, transform: `scale(${CSS_SCALE.studio})`, transformOrigin: "top left" }}>
              <StudioDisplayFrame project={project} projectPosition={projectPosition} />
            </div>
            <div style={{ position: "absolute", left: POS.ipad.left, top: POS.ipad.top, zIndex: POS.ipad.z, width: D.ipad.w, height: D.ipad.h, transform: `scale(${CSS_SCALE.ipad})`, transformOrigin: "top left" }}>
              <IpadFrame project={project} projectPosition={projectPosition} />
            </div>
            <div style={{ position: "absolute", left: POS.macbook.left, top: POS.macbook.top, zIndex: POS.macbook.z, width: D.macbook.w, height: D.macbook.h, transform: `scale(${CSS_SCALE.macbook})`, transformOrigin: "top left" }}>
              <MacbookFrame project={project} projectPosition={projectPosition} />
            </div>
            <div style={{ position: "absolute", left: POS.iphone.left, top: POS.iphone.top, zIndex: POS.iphone.z, width: D.iphone.w, height: D.iphone.h, transform: `scale(${CSS_SCALE.iphone})`, transformOrigin: "top left" }}>
              <IphoneFrame project={project} projectPosition={projectPosition} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function PicturePreview({ project }: { project: Project }) {
  const slides = project.pictureSlides ?? []
  const [index, setIndex] = useState(0)

  useEffect(() => setIndex(0), [project.id])
  if (!slides.length) return null

  const previous = () => setIndex((c) => (c - 1 + slides.length) % slides.length)
  const next = () => setIndex((c) => (c + 1) % slides.length)

  return (
    <div className="mx-auto mt-8 w-full max-w-5xl">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-border">
        <div className="relative aspect-[16/9] w-full">
          <Image src={slides[index]} alt={`${project.title} image ${index + 1}`} fill sizes="(max-width: 1024px) 100vw, 1200px" className="object-cover" />
        </div>
      </div>
      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={previous}>Prev</Button>
          <p className="text-xs text-muted-foreground">{index + 1} / {slides.length}</p>
          <Button type="button" variant="outline" size="sm" onClick={next}>Next</Button>
        </div>
      )}
    </div>
  )
}
