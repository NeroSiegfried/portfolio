"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
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
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const basePath = useBasePath()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const linkCls = "font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || open ? "border-b border-border bg-background/90 backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <div className="mx-4 grid grid-cols-2 items-center px-5 py-5 sm:mx-6 md:grid-cols-3 md:px-8 lg:mx-8">
        {/* left: wordmark */}
        <a href="#top" className="justify-self-start font-display text-base font-semibold tracking-tight">
          <HoverSlide>Victor Nabasu</HoverSlide>
        </a>

        {/* center: links (desktop) */}
        <nav className="hidden justify-self-center md:block">
          <ul className="flex items-center gap-9">
            {links.map((l) => (
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
        </nav>

        {/* right: controls */}
        <div className="flex items-center justify-self-end gap-3">
          <ModeToggle />
          <a
            href="#contact"
            className="hidden items-center bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-primary-foreground sm:inline-flex"
          >
            <HoverSlide>Contact</HoverSlide>
          </a>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center border border-border text-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {open ? (
        <div className="mx-4 border-t border-border bg-background px-5 py-6 sm:mx-6 md:hidden">
          <ul className="flex flex-col gap-4">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="font-display text-2xl font-semibold tracking-tight">
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link href={withBase(basePath, "/blog")} onClick={() => setOpen(false)} className="font-display text-2xl font-semibold tracking-tight">
                Blog
              </Link>
            </li>
            <li>
              <a href="#contact" onClick={() => setOpen(false)} className="mt-2 inline-flex bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-primary-foreground">
                Contact
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  )
}
