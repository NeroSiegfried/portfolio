"use client"

import Link from "next/link"
import { useBasePath, withBase } from "@/lib/base-path"

export function Footer() {
  const basePath = useBasePath()
  const year = new Date().getFullYear()
  const link = "transition-colors hover:text-primary"
  const col = "flex flex-col gap-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"

  return (
    <footer className="overflow-hidden border-t border-border px-4 pb-8 pt-16 md:px-6">
      {/* Columns collapse to a single column on small screens. */}
      <div className="grid grid-cols-1 gap-8 min-[520px]:grid-cols-2 md:grid-cols-4">
        <nav className={col}>
          <a href="#work" className={link}>Work</a>
          <a href="#about" className={link}>About</a>
          <Link href={withBase(basePath, "/blog")} className={link}>Blog</Link>
          <a href="#contact" className={link}>Contact</a>
        </nav>
        <div className={col}>
          <a href="mailto:victornabasu@yahoo.com" className={link}>victornabasu@yahoo.com</a>
          <span>+44 7881 177717</span>
          <span>London, UK</span>
        </div>
        <div className={col}>
          <a href="https://github.com/NeroSiegfried" target="_blank" rel="noopener noreferrer" className={link}>GitHub ↗</a>
          <a href="https://www.linkedin.com/in/victor-nabasu-8b5223212/" target="_blank" rel="noopener noreferrer" className={link}>LinkedIn ↗</a>
          <a href="https://x.com/NeroSiegfried" target="_blank" rel="noopener noreferrer" className={link}>X / Twitter ↗</a>
        </div>
        <div className={col}>
          <Link href={withBase(basePath, "/v1")} className={link}>Previous site (v1) ↗</Link>
        </div>
      </div>

      {/* Signature block (banter): transparent block wordmark + cursive on top, fits any width. */}
      <div className="relative mt-14 flex items-center justify-center overflow-hidden py-4">
        <span
          aria-hidden
          className="pointer-events-none select-none whitespace-nowrap font-display text-[13vw] font-bold uppercase leading-none tracking-tighter text-foreground/[0.06]"
        >
          Victor Nabasu
        </span>
        <span className="absolute font-script leading-none text-foreground text-[clamp(2.5rem,9vw,7rem)]">
          Victor Nabasu
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} Victor Nabasu. All rights reserved.</span>
        <span className="uppercase tracking-[0.12em]">Software Engineer · Full-Stack Developer</span>
      </div>
    </footer>
  )
}
