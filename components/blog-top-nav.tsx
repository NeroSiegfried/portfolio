"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import BlogLink from "@/components/blog-link"
import PortfolioLink from "@/components/portfolio-link"

export default function BlogTopNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { href: "/blog", label: "Blog" },
    { href: "/blog/features", label: "Features Demo" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Left: back to portfolio + nav links */}
        <div className="flex items-center gap-1 text-sm">
          <PortfolioLink className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-primary">
            ← Portfolio
          </PortfolioLink>

          <span className="text-border/60 select-none px-1">/</span>


          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname === link.href.replace(/^\/blog/, "") || pathname === "/"  && link.href === "/blog"
              return (
                <BlogLink
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors hover:text-primary ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </BlogLink>
              )
            })}
          </nav>
        </div>

        {/* Right: theme toggle + hamburger */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-border/50 bg-background/95 pb-3 pt-1 sm:hidden">
          <nav className="container mx-auto flex max-w-5xl flex-col px-4">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname === link.href.replace(/^\/blog/, "") || pathname === "/" && link.href === "/blog"
              return (
                <BlogLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </BlogLink>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
