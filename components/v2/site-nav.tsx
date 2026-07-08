"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ModeToggle } from "@/components/v2/mode-toggle"
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

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled ? "border-border bg-background/80 backdrop-blur-md" : "border-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="font-display text-lg font-semibold tracking-tight">
          Victor Nabasu
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <ul className="mr-1 hidden items-center gap-6 md:flex">
            {sectionLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href={withBase(basePath, "/blog")}
                className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Blog
              </Link>
            </li>
          </ul>
          <ModeToggle />
          <a
            href="#contact"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Contact
          </a>
        </div>
      </nav>
    </header>
  )
}
