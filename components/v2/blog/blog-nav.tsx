"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { ModeToggle } from "@/components/v2/mode-toggle"
import { HoverSlide } from "@/components/v2/hover-slide"
import { AnimatedArrow } from "@/components/v2/animated-arrow"
import InboxButton from "@/components/blog-inbox"
import { cn } from "@/lib/utils"

/**
 * Fixed, scroll-aware blog nav (aligned to the mx-4/md:mx-6 content frame).
 * Left: back to portfolio. Centre: blog wordmark. Right: search + inbox + theme
 * + a Subscribe button (mirrors the portfolio nav's Contact CTA). Search opens an
 * inline bar and routes to /blog?q=… which the feed reads client-side.
 */
export function BlogNav() {
  const router = useRouter()
  const [hidden, setHidden] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(q.trim() ? `/blog?q=${encodeURIComponent(q.trim())}` : "/blog")
    setSearchOpen(false)
  }

  const iconBtn = "inline-flex h-9 w-9 items-center justify-center border border-border text-card-foreground transition-colors hover:border-primary hover:text-primary"

  return (
    <header
      className={cn(
        "fixed inset-x-4 top-4 z-50 border border-border bg-card transition-transform duration-300 md:inset-x-6",
        hidden ? "-translate-y-[160%]" : "translate-y-0",
      )}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 md:px-6 md:py-[0.9rem]">
        <Link href="/" className="group inline-flex items-center gap-2 justify-self-start font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground">
          <AnimatedArrow direction="left" className="text-sm" /> <HoverSlide className="hidden sm:inline-flex">Portfolio</HoverSlide>
        </Link>

        <Link href="/blog" className="justify-self-center font-display text-lg font-semibold tracking-tight text-card-foreground">
          <HoverSlide>Writing</HoverSlide>
        </Link>

        <div className="flex items-center justify-self-end gap-2 sm:gap-2.5">
          <button type="button" aria-label="Search" onClick={() => setSearchOpen((o) => !o)} className={iconBtn}>
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
          <div className="hidden sm:contents"><InboxButton /></div>
          <ModeToggle />
          <Link
            href="/blog#subscribe"
            className="hidden items-center bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-primary-foreground sm:inline-flex"
          >
            <HoverSlide>Subscribe</HoverSlide>
          </Link>
        </div>
      </div>

      {searchOpen ? (
        <form onSubmit={submit} className="flex items-center gap-3 border-t border-border px-4 py-3 md:px-6">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            placeholder="Search articles…"
            className="w-full bg-transparent font-mono text-xs uppercase tracking-[0.1em] text-card-foreground outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-primary">Go</button>
        </form>
      ) : null}
    </header>
  )
}
