"use client"

import Link from "next/link"
import { useBasePath, withBase } from "@/lib/base-path"

export function Footer() {
  const basePath = useBasePath()
  const year = new Date().getFullYear()
  const link = "transition-colors hover:text-primary"

  return (
    <footer className="border-t border-border px-5 pb-8 pt-16 md:px-8">
      {/* Columns (banter): nav · contact · socials */}
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <nav className="flex flex-col gap-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <a href="#work" className={link}>Work</a>
          <a href="#about" className={link}>About</a>
          <Link href={withBase(basePath, "/blog")} className={link}>Blog</Link>
          <a href="#contact" className={link}>Contact</a>
        </nav>
        <div className="flex flex-col gap-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <a href="mailto:victornabasu@yahoo.com" className={link}>victornabasu@yahoo.com</a>
          <span>+44 7881 177717</span>
          <span>London, UK</span>
        </div>
        <div className="flex flex-col gap-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <a href="https://github.com/NeroSiegfried" target="_blank" rel="noopener noreferrer" className={link}>GitHub ↗</a>
          <a href="https://www.linkedin.com/in/victor-nabasu-8b5223212/" target="_blank" rel="noopener noreferrer" className={link}>LinkedIn ↗</a>
          <a href="https://x.com/NeroSiegfried" target="_blank" rel="noopener noreferrer" className={link}>X / Twitter ↗</a>
        </div>
        <div className="flex flex-col gap-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <Link href={withBase(basePath, "/v1")} className={link}>Previous site (v1) ↗</Link>
        </div>
      </div>

      {/* Signature block (banter): transparent block wordmark + cursive on top. */}
      <div className="relative mt-14 flex items-center justify-center overflow-hidden py-6">
        <span
          aria-hidden
          className="pointer-events-none select-none whitespace-nowrap font-display text-[19vw] font-bold uppercase leading-none tracking-tighter text-foreground/[0.06]"
        >
          Victor Nabasu
        </span>
        <span className="absolute font-script text-6xl leading-none text-foreground sm:text-7xl md:text-8xl">
          Victor Nabasu
        </span>
      </div>

      <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} Victor Nabasu. All rights reserved.</span>
        <span className="uppercase tracking-[0.12em]">Software Engineer · Full-Stack Developer</span>
      </div>
    </footer>
  )
}
