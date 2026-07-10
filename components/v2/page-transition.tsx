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
    setPhase("reveal")
  }, [])

  // Intercept eligible internal link clicks → cover, navigate, reveal.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest("a")
      if (!anchor) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download") || (anchor.getAttribute("rel") ?? "").includes("external")) return

      const raw = anchor.getAttribute("href")
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return

      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      // Same page (identical path+query, or an in-page hash) → let the browser handle it.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      // Never wrap the frozen v1 site or the admin area in the v2 transition.
      if (isFrozen(url.pathname) || isFrozen(window.location.pathname)) return

      e.preventDefault()
      pendingPath.current = url.pathname
      coverDone.current = false
      setPhase("cover")
      // Load the destination underneath the curtain as it drops (overlapped).
      router.push(url.pathname + url.search + url.hash)
      clearFallback()
      // Safety net: never get stuck covered if the route never commits.
      fallback.current = setTimeout(startReveal, 1400)
    }

    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
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
      transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={(def) => {
        if (def === "cover") {
          coverDone.current = true
          // If the route already committed while the curtain was dropping, reveal now.
          if (pathname === pendingPath.current || !pendingPath.current) startReveal()
        } else if (def === "reveal") {
          setPhase("hidden")
        }
      }}
    />
  )
}
