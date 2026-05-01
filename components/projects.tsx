"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, ExternalLink, Github, LayoutGrid } from "lucide-react"

type ShowcaseMode = "web" | "picture"

interface Project {
  id: number
  title: string
  description: string
  technologies: string[]
  showcaseMode: ShowcaseMode
  /** Screenshot shown in the MacBook frame */
  desktopPreviewUrl?: string
  /** Screenshot shown in the iPhone 14 Pro frame */
  mobilePreviewUrl?: string
  /** Screenshot shown in the iPad Pro frame (landscape) */
  ipadUrl?: string
  /** Screenshot shown in the Studio Display / Pro Display XDR frame */
  studioDisplayUrl?: string
  pictureSlides?: string[]
  liveUrl?: string
  githubUrl?: string
  blogPostSlug?: string
}

const projects: Project[] = [
  {
    id: 9,
    title: "LoopBridge (ongoing)",
    description:
      "A website development project for a crypto trading community. Built in plain HTML, CSS, and JavaScript to keep contribution simple for frontend developers across different stacks.",
    technologies: ["HTML", "CSS", "JavaScript"],
    showcaseMode: "web",
    desktopPreviewUrl: "/projects/LoopBridge.png",
    liveUrl: "https://nerosiegfried.github.io/LoopBridge/",
    githubUrl: "https://github.com/NeroSiegfried/LoopBridge",
    blogPostSlug: "loopbridge-build-log",
  },
  {
    id: 1,
    title: "Anagrams - Word Puzzle Game",
    description:
      "A cozy word-play challenge with casino-style elegance featuring both single-player and real-time multiplayer modes. This project tested AI-assisted workflows for complex web app development.",
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Neon", "Vercel", "Cursor"],
    showcaseMode: "web",
    desktopPreviewUrl: "/projects/Anagrams.png",
    liveUrl: "https://v0-anagram-game-requirements.vercel.app/",
    githubUrl: "https://github.com/NeroSiegfried/anagrams2",
    blogPostSlug: "anagrams-architecture-notes",
  },
  {
    id: 2,
    title: "Simple SQL Server",
    description:
      "A lightweight SQLite-style database in C with persistence, page management, and command parsing, implemented from scratch while following and extending the cstack tutorial path.",
    technologies: ["C", "Bash", "RSpec"],
    showcaseMode: "picture",
    pictureSlides: [],
    githubUrl: "https://github.com/NeroSiegfried/C-Database",
    blogPostSlug: "c-database-from-scratch",
  },
  {
    id: 3,
    title: "EasyChess DSML",
    description:
      "A domain-specific modeling language for chess notation with syntax highlighting, validation, and generation tooling built with Java, Xtext, and Xtend.",
    technologies: ["Java", "Xtext", "Xtend"],
    showcaseMode: "picture",
    pictureSlides: [],
    githubUrl: "https://github.com/NeroSiegfried/EasyChess-DSL",
    blogPostSlug: "easychess-dsl",
  },
  {
    id: 4,
    title: "Fitness Tracker",
    description:
      "A fitness app that suggests workouts and meals for beginners via AI APIs, including workout history and progression tracking for consistent improvement.",
    technologies: ["React", "Node.js", "OpenAI API"],
    showcaseMode: "web",
    githubUrl: "https://github.com/NeroSiegfried/fitness-tracker",
    blogPostSlug: "fitness-tracker-ai",
  },
  {
    id: 5,
    title: "Anagrams Game (Legacy)",
    description:
      "A browser-based single-player clone inspired by Game Pigeon anagrams, focused on core gameplay mechanics and UX flow experimentation.",
    technologies: ["JavaScript", "HTML", "CSS"],
    showcaseMode: "web",
    githubUrl: "https://github.com/NeroSiegfried/anagrams-game",
    blogPostSlug: "anagrams-legacy",
  },
  {
    id: 6,
    title: "Blog Platform",
    description:
      "A multi-role blog with owner, user, and guest experiences; implemented with EJS templates and PostgreSQL to showcase full-stack web delivery.",
    technologies: ["EJS", "HTML", "CSS", "JavaScript", "PostgreSQL"],
    showcaseMode: "web",
    githubUrl: "https://github.com/NeroSiegfried/blog-project",
    blogPostSlug: "blog-platform-ejs",
  },
  {
    id: 7,
    title: "Report Generator",
    description:
      "A departmental report automation app that scrapes external data and composes structured output, with AI-assisted insight suggestions for newcomers.",
    technologies: ["Python", "Flask", "BeautifulSoup", "AI API"],
    showcaseMode: "picture",
    pictureSlides: [],
    githubUrl: "https://github.com/NeroSiegfried/report-generator",
    blogPostSlug: "report-generator-ai",
  },
  {
    id: 8,
    title: "Model Surveillance Satellite",
    description:
      "A team-built surveillance satellite prototype involving networking, image processing, and systems-level programming.",
    technologies: ["Python", "Linux", "Bash", "FFmpeg"],
    showcaseMode: "picture",
    pictureSlides: ["/projects/model-satellite.jpg"],
    blogPostSlug: "model-surveillance-satellite",
  },
]

const CLOSE_ANIMATION_MS = 420

/**
 * ═══════════════════════════════════════════════════════════════════
 * RECOMMENDED SCREENSHOT SIZES FOR DEVICE FRAMES
 *
 * Screenshots should match the CSS frame's screen aspect ratio so they
 * fill the frame cleanly without letterboxing. Capture at 2× for crisp
 * display on HiDPI/Retina screens, then store at 1× (halved) dimensions.
 *
 * ┌──────────────────┬────────────────┬───────────────┬─────────────────────────────┐
 * │ Device           │ Screen (CSS px)│ Aspect ratio  │ Recommended capture size    │
 * ├──────────────────┼────────────────┼───────────────┼─────────────────────────────┤
 * │ MacBook Pro 14"  │  600 × 375 px  │  1.600 : 1    │  1200 × 750 px  (2× retina) │
 * │                  │                │               │  Window size: 1440 × 900 px │
 * │                  │                │               │  (matches 3456×2160 native) │
 * ├──────────────────┼────────────────┼───────────────┼─────────────────────────────┤
 * │ Studio Display   │  628 × 351 px  │  ~16 : 9      │  2560 × 1440 px (full 1440p)│
 * │   27" (CSS)      │ (sd-screen      │               │  or 5120 × 2880 (native 5K) │
 * │                  │  inset 14px)   │               │  Resize to ≤1280 × 720 px   │
 * │                  │                │               │  for web delivery            │
 * ├──────────────────┼────────────────┼───────────────┼─────────────────────────────┤
 * │ iPad Pro 11"     │  506 × 724 px  │  0.699 : 1    │  1012 × 1448 px (2× retina) │
 * │   (portrait)     │                │  (portrait)   │  Matches 2388 × 1668 native │
 * │                  │                │               │  Resize portrait viewport   │
 * ├──────────────────┼────────────────┼───────────────┼─────────────────────────────┤
 * │ iPhone 14 Pro    │  390 × 830 px  │  0.470 : 1    │   780 × 1664 px (2× retina) │
 * │   (portrait)     │                │  (portrait)   │  Matches 2556 × 1179 native │
 * │                  │                │               │  Use Chrome DevTools @ 390px│
 * └──────────────────┴────────────────┴───────────────┴─────────────────────────────┘
 *
 * WORKFLOW TIP (browser-based):
 *   1. Open Chrome DevTools → device toolbar (Ctrl/Cmd+Shift+M)
 *   2. Set viewport to the "Window size" listed above
 *   3. Set device pixel ratio to 2 for retina captures
 *   4. Capture full-page screenshot: DevTools → ⋮ → Capture screenshot
 *   5. Save to /public/projects/<project-name>-<device>.png
 *
 * STUDIO DISPLAY NOTE:
 *   The Studio Display frame has no set pixel density — its CSS uses the
 *   sd-screen element (628 × 351 px visible after 14 px inset). For maximum
 *   quality, supply a 2560 × 1440 screenshot; the <img> is object-fit:cover.
 * ═══════════════════════════════════════════════════════════════════
 */

function BlueBubble({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
      {children}
    </span>
  )
}

function CompactTech({ stack }: { stack: string[] }) {
  const visible = stack.slice(0, 2)
  const hiddenCount = Math.max(0, stack.length - visible.length)

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {visible.map((tech) => (
        <BlueBubble key={tech}>{tech}</BlueBubble>
      ))}
      {hiddenCount > 0 ? (
        <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          +{hiddenCount} more
        </span>
      ) : null}
    </div>
  )
}

/**
 * DeviceShowcase — responsive 4-device composition.
 *
 * Device proportions are derived from real-world physical dimensions
 * (Apple specs, mm), normalized using MacBook Pro 14" lid height as the
 * reference unit (211 mm → 434 CSS px → 2.057 px/mm).
 *
 * Real physical sizes (mm):
 *   iPhone 14 Pro        71.5 ×  147.5  → slot  147 × 303 px
 *   iPad Pro 11" 2021   178.5 ×  247.6  → slot  367 × 509 px
 *   Studio Display 27"  596.7 ×  335.7  → slot  907 × 691 px  (screen panel)
 *   MacBook Pro 14" lid 312.6 ×  211.0  → slot  643 × 434 px
 *
 * CSS component natural sizes (px):
 *   iPhone:  428 × 868   scale → 0.349  (slot height 303 / CSS height 868)
 *   iPad:    560 × 778   scale → 0.654  (509 / 778)
 *   Studio:  656 × 500   scale → 1.382  (691 / 500 — Studio is 27", scales up)
 *   MacBook: 740 × 434   scale → 1.000  (reference)
 *
 * Stage: 1774 × 691 px (natural units). All devices bottom-aligned.
 * Z-order: iPhone=4 (front), MacBook=3, iPad=2, Studio=1 (back).
 * Below COLLAPSE_W the stage switches to a single vertical column.
 */

// CSS component natural dimensions (px)
const D = {
  iphone:  { w: 428,  h: 868 },
  ipad:    { w: 560,  h: 778 },
  studio:  { w: 656,  h: 500 },
  macbook: { w: 740,  h: 434 },
} as const

// Physical-proportion scale factors: CSS frame → real-world relative slot size
const CSS_SCALE = {
  iphone:  303 / 868,   // 0.349
  ipad:    509 / 778,   // 0.654
  studio:  691 / 500,   // 1.382  (studio display is huge — scales UP)
  macbook: 434 / 434,   // 1.000  (reference)
} as const

// Slot sizes after applying CSS_SCALE (display footprint in stage natural px)
const SLOT = {
  iphone:  { w: Math.round(D.iphone.w  * CSS_SCALE.iphone),  h: Math.round(D.iphone.h  * CSS_SCALE.iphone)  },
  ipad:    { w: Math.round(D.ipad.w    * CSS_SCALE.ipad),    h: Math.round(D.ipad.h    * CSS_SCALE.ipad)    },
  studio:  { w: Math.round(D.studio.w  * CSS_SCALE.studio),  h: Math.round(D.studio.h  * CSS_SCALE.studio)  },
  macbook: { w: Math.round(D.macbook.w * CSS_SCALE.macbook), h: Math.round(D.macbook.h * CSS_SCALE.macbook) },
} as const

const STAGE_H    = 691   // = Studio slot height (tallest — it's 27 inches)
const STAGE_W    = 1774  // wide enough for all 4 devices with overlaps
const COLLAPSE_W = 680   // container px below which we switch to vertical stack

// Bottom-aligned horizontal layout:
//   iPhone visible ~60 % before iPad: left_ipad  ≈ 0.60 × SLOT.iphone.w  ≈  88
//   iPad    visible ~60 % before Studio: left_studio ≈ 88 + 0.60×SLOT.ipad.w ≈ 308
//   Studio  visible ~80 % before MacBook: left_macbook ≈ 308 + 0.80×SLOT.studio.w ≈ 1034
const POS = {
  iphone:  { left: 0,    top: STAGE_H - SLOT.iphone.h,  z: 4 },
  ipad:    { left: 88,   top: STAGE_H - SLOT.ipad.h,    z: 2 },
  studio:  { left: 308,  top: STAGE_H - SLOT.studio.h,  z: 1 },
  macbook: { left: 1034, top: STAGE_H - SLOT.macbook.h, z: 3 },
} as const

/**
 * Wraps a naturally-sized element so that its layout footprint matches
 * its post-scale size.  Children are rendered at natural px then scaled
 * down from the top-left corner.
 */
function ScaledBox({
  w, h, scale, children,
}: {
  w: number; h: number; scale: number; children: React.ReactNode
}) {
  return (
    <div style={{ width: w * scale, height: h * scale, position: "relative", overflow: "hidden", flexShrink: 0, ["--device-scale" as string]: scale }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: w, height: h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}>
        {children}
      </div>
    </div>
  )
}

type DeviceType = "macbook" | "ipad" | "iphone" | "studio"

const WALLPAPERS: Record<DeviceType, { lg: string; md: string; sm: string }> = {
  macbook: {
    lg: "/wallpapers/macbook.jpg",
    md: "/wallpapers/macbook-md.jpg",
    sm: "/wallpapers/macbook-sm.jpg",
  },
  ipad: {
    lg: "/wallpapers/ipad.jpg",
    md: "/wallpapers/ipad-md.jpg",
    sm: "/wallpapers/ipad-sm.jpg",
  },
  iphone: {
    lg: "/wallpapers/iphone.jpg",
    md: "/wallpapers/iphone-md.jpg",
    sm: "/wallpapers/iphone-sm.jpg",
  },
  studio: {
    lg: "/wallpapers/studio_display.jpg",
    md: "/wallpapers/studio_display-md.jpg",
    sm: "/wallpapers/studio_display-sm.jpg",
  },
}

/**
 * Renders the content inside a device screen area.
 * When a URL is supplied → <img> filling the screen.
 * When no URL → Apple wallpaper for that device type, loaded responsively.
 */
function ScreenContent({ url, alt, deviceType }: { url?: string; alt: string; deviceType: DeviceType }) {
  const imgStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" }
  // Wrapper fills the device-screen (which is position:relative), clips to its border-radius,
  // and ensures the wallpaper never bleeds outside the rounded corners.
  const wrapStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    borderRadius: "inherit",
  }

  if (url) {
    return (
      <div style={wrapStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} loading="lazy" decoding="async" style={imgStyle} />
      </div>
    )
  }

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

function MacbookFrame({ project }: { project: Project }) {
  return (
    <div className="device device-macbook-pro">
      <div className="device-frame">
        <div className="device-screen">
          <ScreenContent url={project.desktopPreviewUrl} alt={`${project.title} — desktop`} deviceType="macbook" />
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

function IpadFrame({ project }: { project: Project }) {
  return (
    <div className="device device-ipad-pro">
      <div className="device-frame">
        <div className="device-screen">
          <ScreenContent url={project.ipadUrl} alt={`${project.title} — tablet`} deviceType="ipad" />
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

function IphoneFrame({ project }: { project: Project }) {
  return (
    <div className="device device-iphone-14-pro">
      <div className="device-frame">
        <div className="device-screen">
          <ScreenContent url={project.mobilePreviewUrl} alt={`${project.title} — mobile`} deviceType="iphone" />
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

function StudioDisplayFrame({ project }: { project: Project }) {
  return (
    <div className="studio-display">
      <div className="sd-bezels">
        {/* sd-screen is position:absolute — overlay/img children are contained within it */}
        <div className="sd-screen">
          <ScreenContent url={project.studioDisplayUrl} alt={`${project.title} — display`} deviceType="studio" />
        </div>
      </div>
      <div className="sd-stand">
        <div className="sd-stand-body" />
        <div className="sd-stand-foot" />
      </div>
    </div>
  )
}

function WebPreview({ project }: { project: Project }) {
  const outerRef  = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)

  useLayoutEffect(() => {
    const el = outerRef.current
    if (!el) return
    // Measure synchronously before first paint to avoid mid-animation re-render
    setContainerW(el.getBoundingClientRect().width)
    const obs = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Scale the entire stage to fill the container width
  const stageScale = containerW > 0 ? containerW / STAGE_W : 0
  // Collapse to vertical stack on narrow containers
  const collapsed  = containerW > 0 && containerW < COLLAPSE_W
  // Uniform scale for vertical stack: fit widest slot (Studio Display) to container
  const stackScale = containerW > 0 ? Math.min(1, containerW / SLOT.studio.w) : 0
  // Scale for paired iPhone+iPad row: together they fill the container width
  // Natural pair slot width = SLOT.iphone.w + SLOT.ipad.w
  const pairTotalSlotW = SLOT.iphone.w + SLOT.ipad.w
  const pairScale = containerW > 0 ? containerW / pairTotalSlotW : 0

  return (
    <div ref={outerRef} className="mx-auto mt-8 w-full">

      {/* ── Before first measurement: reserve space to prevent layout shift ── */}
      {containerW === 0 && <div style={{ height: 200 }} />}

      {/* ── Narrow / mobile: single vertical column ── */}
      {collapsed && (
        <div className="flex flex-col gap-8">
          {/*
           * MacBook Pro — fills full container width.
           * Scale = containerW / (D.macbook.w * CSS_SCALE.macbook) = containerW / SLOT.macbook.w
           */}
          <ScaledBox
            w={D.macbook.w} h={D.macbook.h}
            scale={containerW / SLOT.macbook.w * CSS_SCALE.macbook}
          >
            <MacbookFrame project={project} />
          </ScaledBox>

          {/*
           * Studio Display — fills full container width.
           */}
          <ScaledBox
            w={D.studio.w} h={D.studio.h}
            scale={containerW / SLOT.studio.w * CSS_SCALE.studio}
          >
            <StudioDisplayFrame project={project} />
          </ScaledBox>

          {/*
           * iPad + iPhone — side by side, bottom-aligned, overlapping.
           * Together they fill full container width at pairScale.
           * iPhone overlaps iPad by ~30 slot-px (matching the desktop z-overlap feel).
           */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
            <ScaledBox
              w={D.ipad.w} h={D.ipad.h}
              scale={pairScale * CSS_SCALE.ipad}
            >
              <IpadFrame project={project} />
            </ScaledBox>
            <div style={{ marginLeft: -30 * pairScale * CSS_SCALE.iphone }}>
            <ScaledBox
              w={D.iphone.w} h={D.iphone.h}
              scale={pairScale * CSS_SCALE.iphone}
            >
              <IphoneFrame project={project} />
            </ScaledBox>
            </div>
          </div>
        </div>
      )}

      {/* ── Wide / desktop: overlapping stage composition ── */}
      {!collapsed && containerW > 0 && (
        /*
         * Outer div has the scaled height so the page flow is correct.
         * Inner div is the STAGE_W × STAGE_H natural-size stage, scaled from top-left.
         * Each device is positioned at POS.*.left/top (slot top-left corner) and
         * then scaled by CSS_SCALE so it occupies exactly its SLOT footprint.
         */
        <div style={{ position: "relative", overflow: "hidden", width: "100%", height: STAGE_H * stageScale }}>
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: STAGE_W, height: STAGE_H,
            transform: `scale(${stageScale})`,
            transformOrigin: "top left",
          }}>
            {/* Studio Display — z=1, furthest back */}
            <div style={{ position: "absolute", left: POS.studio.left, top: POS.studio.top, zIndex: POS.studio.z,
              width: D.studio.w, height: D.studio.h,
              transform: `scale(${CSS_SCALE.studio})`, transformOrigin: "top left" }}>
              <StudioDisplayFrame project={project} />
            </div>
            {/* iPad Pro — z=2, behind iPhone */}
            <div style={{ position: "absolute", left: POS.ipad.left, top: POS.ipad.top, zIndex: POS.ipad.z,
              width: D.ipad.w, height: D.ipad.h,
              transform: `scale(${CSS_SCALE.ipad})`, transformOrigin: "top left" }}>
              <IpadFrame project={project} />
            </div>
            {/* MacBook Pro — z=3, slightly in front of Studio Display */}
            <div style={{ position: "absolute", left: POS.macbook.left, top: POS.macbook.top, zIndex: POS.macbook.z,
              width: D.macbook.w, height: D.macbook.h,
              transform: `scale(${CSS_SCALE.macbook})`, transformOrigin: "top left" }}>
              <MacbookFrame project={project} />
            </div>
            {/* iPhone 14 Pro — z=4, front-left */}
            <div style={{ position: "absolute", left: POS.iphone.left, top: POS.iphone.top, zIndex: POS.iphone.z,
              width: D.iphone.w, height: D.iphone.h,
              transform: `scale(${CSS_SCALE.iphone})`, transformOrigin: "top left" }}>
              <IphoneFrame project={project} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


function PicturePreview({ project }: { project: Project }) {
  const slides = project.pictureSlides ?? []
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [project.id])

  if (!slides.length) {
    return null
  }

  const previous = () => {
    setIndex((current) => (current - 1 + slides.length) % slides.length)
  }

  const next = () => {
    setIndex((current) => (current + 1) % slides.length)
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-5xl">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border bg-card">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={slides[index]}
            alt={`${project.title} image ${index + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-cover"
          />
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={previous}>
            Prev
          </Button>
          <p className="text-xs text-muted-foreground">
            {index + 1} / {slides.length}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={next}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ProjectActions({ project }: { project: Project }) {
  return (
    <div className="mt-6 mb-8 flex flex-col gap-3 sm:flex-row justify-center">
      {/* Repo + Read Article: side-by-side below sm, become direct flex children at sm+ */}
      <div className="flex gap-3 max-[380px]:flex-col sm:contents">
        {project.blogPostSlug ? (
          <Button asChild size="default" variant="outline" className="flex-1 gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground sm:max-w-[190px]">
            <a
              href={`/blog/${project.blogPostSlug}`}
              onClick={(e) => {
                const host = window.location.hostname
                if (host !== "localhost" && host !== "127.0.0.1") {
                  const apex = host.replace(/^www\./, "")
                  e.preventDefault()
                  window.location.href = `${window.location.protocol}//blog.${apex}/${project.blogPostSlug}`
                }
              }}
            >
              <BookOpen className="h-4 w-4" />
              Read Article
            </a>
          </Button>
        ) : (
          <div className="flex-1">
            <p className="text-sm text-muted-foreground text-center">(coming soon...)</p>
          </div>
        )}

        {project.githubUrl ? (
          <Button asChild size="default" variant="outline" className="flex-1 gap-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground sm:max-w-[190px]">
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              Repository
            </a>
          </Button>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Live Site: full-width below sm, flex-1 at sm+ */}
      {project.liveUrl ? (
        <Button asChild size="default" className="w-full gap-2 sm:flex-1 sm:max-w-[190px]">
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Live Site
          </a>
        </Button>
      ) : null}
    </div>
  )
}

export default function Projects() {
  const [visible, setVisible] = useState(3)
  const [activeId, setActiveId] = useState<number | null>(projects[0]?.id ?? null)
  // Track which items have been opened at least once (so content stays mounted for smooth transitions)
  // Start with the initially visible items mounted so their previews begin loading immediately.
  const [mountedIds, setMountedIds] = useState<Set<number>>(() =>
    new Set(projects.slice(0, 3).map((p) => p.id))
  )
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const visibleProjects = projects.slice(0, visible)

  const toggleItem = (projectId: number) => {
    if (projectId === activeId) {
      setActiveId(null)
      return
    }
    setActiveId(projectId)
    setMountedIds((prev) => new Set([...prev, projectId]))
    setTimeout(() => {
      itemRefs.current.get(projectId)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 380)
  }

  const showMore = () => setVisible((current) => Math.min(current + 3, projects.length))
  const showAll = () => setVisible(projects.length)

  // Preload preview images and mount visible project previews as soon as the component mounts.
  useEffect(() => {
    // Ensure the initially visible projects are mounted (in case visible default changes)
    setMountedIds((prev) => {
      const next = new Set(prev)
      projects.slice(0, visible).forEach((p) => next.add(p.id))
      return next
    })

    // Collect preview image URLs for warming the browser cache.
    const urls: string[] = []
    projects.forEach((p) => {
      if (p.desktopPreviewUrl) urls.push(p.desktopPreviewUrl)
      if (p.mobilePreviewUrl) urls.push(p.mobilePreviewUrl)
      if (p.ipadUrl) urls.push(p.ipadUrl)
      if (p.studioDisplayUrl) urls.push(p.studioDisplayUrl)
      if (p.pictureSlides?.length) urls.push(...p.pictureSlides)
    })

    // Start low-priority image preloads (do not block rendering). We'll space them out
    // a bit to avoid spiking network on load.
    const timers: number[] = []
    urls.forEach((u, i) => {
      const t = window.setTimeout(() => {
        try {
          const img = document.createElement("img") as HTMLImageElement
          img.src = u
        } catch {
          // ignore
        }
      }, i * 150) // stagger by 150ms
      timers.push(t)
    })

    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [visible])

  return (
    <section id="projects" className="py-20">
      <div className="w-full">
        <motion.h2
          className="mb-14 px-4 text-center text-4xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          My Projects
        </motion.h2>

        <div className="w-full">
          {visibleProjects.map((project, idx) => {
            const isOpen = activeId === project.id

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                ref={(el) => {
                  if (el) itemRefs.current.set(project.id, el as HTMLDivElement)
                  else itemRefs.current.delete(project.id)
                }}
                className={`relative w-full border-t border-b border-border/60 transition-colors duration-300 cursor-pointer ${isOpen ? "bg-primary/[0.03]" : "bg-card/40"}`}
                onClick={() => toggleItem(project.id)}
              >
                <div className="px-4 pt-4 md:px-8">
                  <div className="container mx-auto">
                    <div className="w-full text-left">
                      <div className="mb-3">
                        <h3 className="text-left text-2xl font-semibold tracking-tight">
                          {project.title}
                        </h3>
                      </div>
                      <p className="mb-3 text-justify text-base text-muted-foreground">
                        {project.description}
                      </p>
                      <div className="mb-2">
                        {isOpen ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            {project.technologies.map((tech) => (
                              <BlueBubble key={tech}>{tech}</BlueBubble>
                            ))}
                          </div>
                        ) : (
                          <CompactTech stack={project.technologies} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  aria-hidden="true"
                  className={`project-accent-bar ${isOpen ? "project-accent-bar-open" : ""}`}
                />

                <div className="px-4 md:px-8">
                  <div className="container mx-auto">
                    {/* CSS grid-rows accordion: 0fr → 1fr transition avoids layout reflow jank */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        transition: "grid-template-rows 0.35s ease, opacity 0.35s ease",
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div style={{ overflow: "hidden", minHeight: 0 }}>
                        {mountedIds.has(project.id) && (
                          <>
                            {project.showcaseMode === "web" ? (
                              <WebPreview project={project} />
                            ) : (
                              <PicturePreview project={project} />
                            )}
                            <ProjectActions project={project} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {visible < projects.length ? (
          <motion.div
            className="mt-12 flex flex-row gap-4 justify-center max-[380px]:flex-col max-[380px]:gap-3 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={showMore}
              variant="outline"
              className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground w-auto max-[380px]:w-full"
            >
              Show More
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              onClick={showAll}
              variant="outline"
              className="gap-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground w-auto max-[380px]:w-full"
            >
              Show All
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : null}
      </div>
    </section>
  )
}
