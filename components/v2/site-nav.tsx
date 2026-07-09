"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"
import { ModeToggle } from "@/components/v2/mode-toggle"
import { HoverSlide } from "@/components/v2/hover-slide"
import { useBasePath, withBase } from "@/lib/base-path"
import { cn } from "@/lib/utils"

const links = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#stack", label: "Stack" },
]

export function SiteNav() {
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const basePath = useBasePath()
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      // Hide when scrolling down past the hero; reveal when scrolling up.
      if (y > lastY.current && y > 140) setHidden(true)
      else setHidden(false)
      lastY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const linkCls = "inline-flex items-center font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"

  return (
    <header
      className={cn(
        "fixed inset-x-4 top-4 z-50 border border-border bg-card transition-transform duration-300 md:inset-x-6",
        hidden && !open ? "-translate-y-[160%]" : "translate-y-0",
      )}
    >
      <div className="grid grid-cols-2 items-center px-4 py-4 md:grid-cols-3 md:px-6 md:py-[1.15rem]">
        <a href="#top" className="inline-flex items-center justify-self-start font-display text-lg font-semibold tracking-tight text-card-foreground">
          <HoverSlide>Victor Nabasu</HoverSlide>
        </a>

        <nav className="hidden justify-self-center md:block">
          <ul className="flex items-center gap-9">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={linkCls}><HoverSlide>{l.label}</HoverSlide></a>
              </li>
            ))}
            <li>
              <Link href={withBase(basePath, "/blog")} className={linkCls}><HoverSlide>Blog</HoverSlide></Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center justify-self-end gap-2 sm:gap-3">
          <ModeToggle />
          <a href="#contact" className="hidden items-center bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-primary-foreground sm:inline-flex">
            <HoverSlide>Contact</HoverSlide>
          </a>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center border border-border text-card-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border px-4 py-5 md:hidden">
          <ul className="flex flex-col gap-4">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="font-display text-2xl font-semibold tracking-tight text-card-foreground">{l.label}</a>
              </li>
            ))}
            <li>
              <Link href={withBase(basePath, "/blog")} onClick={() => setOpen(false)} className="font-display text-2xl font-semibold tracking-tight text-card-foreground">Blog</Link>
            </li>
            <li>
              <a href="#contact" onClick={() => setOpen(false)} className="mt-1 inline-flex bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-primary-foreground">Contact</a>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  )
}
