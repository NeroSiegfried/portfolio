"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ModeToggle } from "@/components/v2/mode-toggle"
import { HoverSlide } from "@/components/v2/hover-slide"
import { useBasePath, withBase } from "@/lib/base-path"
import { cn } from "@/lib/utils"

const sectionLinks = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#stack", label: "Stack" },
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const basePath = useBasePath()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const linkCls = "font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled ? "border-border bg-background/80 backdrop-blur-md" : "border-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="font-display text-lg font-semibold tracking-tight">
          <HoverSlide>Victor Nabasu</HoverSlide>
        </a>
        <div className="flex items-center gap-3 sm:gap-5">
          <ul className="mr-1 hidden items-center gap-7 md:flex">
            {sectionLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={linkCls}>
                  <HoverSlide>{l.label}</HoverSlide>
                </a>
              </li>
            ))}
            <li>
              <Link href={withBase(basePath, "/blog")} className={linkCls}>
                <HoverSlide>Blog</HoverSlide>
              </Link>
            </li>
          </ul>
          <ModeToggle />
          <a
            href="#contact"
            className="inline-flex items-center bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-primary-foreground"
          >
            <HoverSlide>Contact</HoverSlide>
          </a>
        </div>
      </nav>
    </header>
  )
}
