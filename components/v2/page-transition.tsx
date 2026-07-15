"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, type Variants } from "framer-motion"

/**
 * Site-wide page transition (portfolie/reado). On an internal link click a solid
 * accent screen sweeps DOWN to cover the current page top→bottom; the new route
 * is fetched underneath it; once the screen is fully down and the route has
 * committed, it continues down and off the bottom, revealing the new page's
 * content top→bottom. Because it's a single fixed overlay (the page content is
 * never wrapped in a transform) the fixed nav, sticky sidebars and custom cursor
 * keep working. Skipped on the frozen /v1 site, the /control admin, and for
 * users who prefer reduced motion.
 */

type Phase = "hidden" | "cover" | "reveal"

const isFrozen = (p: string) =>
  p === "/v1" || p.startsWith("/v1/") || p === "/control" || p.startsWith("/control/")

function internalUrl(anchor: HTMLAnchorElement) {
  const raw = anchor.getAttribute("href")
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return null
  if (anchor.target && anchor.target !== "_self") return null
  if (anchor.hasAttribute("download") || (anchor.getAttribute("rel") ?? "").includes("external")) return null

  try {
    const url = new URL(anchor.href, window.location.href)
    if (url.origin !== window.location.origin || isFrozen(url.pathname)) return null
    return url
  } catch {
    return null
  }
}

// hidden snaps instantly (it only ever resets while off-screen); cover/reveal
// use the shared sweep easing.
const variants: Variants = {
  hidden: { y: "-100%", transition: { duration: 0 } },
  cover: { y: "0%" },
  reveal: { y: "100%" },
}

export function PageTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>("hidden")

  const pendingPath = useRef<string | null>(null)
  const pendingHref = useRef<string | null>(null)
  const prefetched = useRef(new Set<string>())
  const coverDone = useRef(false)
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearFallback = () => {
    if (fallback.current) {
      clearTimeout(fallback.current)
      fallback.current = null
    }
  }

  const startReveal = useCallback(() => {
    clearFallback()
    coverDone.current = false
    pendingPath.current = null
    pendingHref.current = null
    setPhase("reveal")
  }, [])

  // Intercept eligible internal link clicks → cover, navigate, reveal.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const prefetch = (anchor: HTMLAnchorElement) => {
      const url = internalUrl(anchor)
      if (!url) return
      const href = url.pathname + url.search
      if (href === window.location.pathname + window.location.search || prefetched.current.has(href)) return
      prefetched.current.add(href)
      router.prefetch(href)
    }

    const onIntent = (e: Event) => {
      const anchor = (e.target as HTMLElement | null)?.closest("a")
      if (anchor instanceof HTMLAnchorElement) prefetch(anchor)
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest("a")
      if (!anchor) return
      if (!(anchor instanceof HTMLAnchorElement)) return
      const url = internalUrl(anchor)
      if (!url) return
      // Same page (identical path+query, or an in-page hash) → let the browser handle it.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      // Never wrap the frozen v1 site or the admin area in the v2 transition.
      if (isFrozen(window.location.pathname)) return

      e.preventDefault()
      prefetch(anchor)
      pendingPath.current = url.pathname
      pendingHref.current = url.pathname + url.search + url.hash
      coverDone.current = false
      setPhase("cover")
      // NB: we do NOT navigate yet — the curtain must fully cover the OLD page
      // first (otherwise the new page flashes underneath). We push once the cover
      // animation completes (see onAnimationComplete).
      clearFallback()
      // Safety net: never get stuck covered if the route never commits.
      fallback.current = setTimeout(startReveal, 2200)
    }

    document.addEventListener("click", onClick, true)
    document.addEventListener("pointerover", onIntent, true)
    document.addEventListener("focusin", onIntent, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("pointerover", onIntent, true)
      document.removeEventListener("focusin", onIntent, true)
      clearFallback()
    }
  }, [router, startReveal])

  // Reveal once the new route has committed AND the curtain is fully down.
  useEffect(() => {
    if (phase !== "cover") return
    if (coverDone.current && pendingPath.current && pathname === pendingPath.current) {
      startReveal()
    }
  }, [pathname, phase, startReveal])

  return (
    <motion.div
      aria-hidden
      className={phase === "hidden" ? "v2-curtain v2-curtain--idle" : "v2-curtain"}
      initial={false}
      animate={phase}
      variants={variants}
      // expo-out: the curtain shoots down fast (snappy start) then settles.
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => {
        // Key off `phase` (state) — the variant-name arg isn't reliable here.
        if (phase === "cover") {
          coverDone.current = true
          // Curtain now fully covers the OLD page → navigate underneath it.
          if (pendingHref.current) router.push(pendingHref.current)
          // Same-path navigations won't change `pathname`, so reveal right away.
          if (!pendingPath.current || pathname === pendingPath.current) startReveal()
        } else if (phase === "reveal") {
          setPhase("hidden")
        }
      }}
    />
  )
}
