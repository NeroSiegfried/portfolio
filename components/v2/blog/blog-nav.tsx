"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { ModeToggle } from "@/components/v2/mode-toggle"
import { HoverSlide } from "@/components/v2/hover-slide"
import InboxButton from "@/components/blog-inbox"
import { cn } from "@/lib/utils"

/**
 * Fixed, scroll-aware blog nav — mirrors the portfolio SiteNav frame so the two
 * sections feel unified. Left: back to portfolio. Centre: blog wordmark + links.
 * Right: inbox + theme toggle. (The v2 blog lives at /blog, base path "".)
 */
export function BlogNav() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y > lastY.current && y > 140) setHidden(true)
      else setHidden(false)
      lastY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const linkCls = "font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"

  return (
    <header
      className={cn(
        "fixed inset-x-4 top-4 z-50 border border-border bg-card transition-transform duration-300 sm:inset-x-6 lg:inset-x-8",
        hidden ? "-translate-y-[160%]" : "translate-y-0",
      )}
    >
      <div className="grid grid-cols-2 items-center px-5 py-4 md:grid-cols-3 md:px-7 md:py-[1.15rem]">
        <Link href="/" className={cn(linkCls, "inline-flex items-center gap-2 justify-self-start")}>
          <ArrowLeft className="h-3.5 w-3.5" /> <HoverSlide>Portfolio</HoverSlide>
        </Link>

        <Link href="/blog" className="hidden justify-self-center font-display text-lg font-semibold tracking-tight text-card-foreground md:block">
          <HoverSlide>Writing</HoverSlide>
        </Link>

        <div className="flex items-center justify-self-end gap-2 sm:gap-3">
          <InboxButton />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
