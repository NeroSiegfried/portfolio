"use client"

import Link from "next/link"
import { AnimatedArrow } from "@/components/v2/animated-arrow"
import { useBasePath, withBase } from "@/lib/base-path"
import { cn } from "@/lib/utils"

export function Footer() {
  const basePath = useBasePath()
  const year = new Date().getFullYear()
  const link = "transition-colors hover:text-primary"
  const extLink = cn(link, "inline-flex w-fit items-center gap-1.5")
  const col = "flex flex-col gap-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"

  return (
    <footer className="overflow-hidden border-t border-border px-4 pb-8 pt-16 md:px-6">
      {/* Columns collapse to a single column on small screens. */}
      <div className="grid grid-cols-1 gap-8 min-[520px]:grid-cols-2 md:grid-cols-4">
        <nav className={col}>
          <Link href={`${withBase(basePath, "/")}#work`} className={link}>Work</Link>
          <Link href={`${withBase(basePath, "/")}#about`} className={link}>About</Link>
          <Link href={withBase(basePath, "/blog")} className={link}>Blog</Link>
          <Link href={`${withBase(basePath, "/")}#contact`} className={link}>Contact</Link>
        </nav>
        <div className={col}>
          <a href="mailto:victornabasu@yahoo.com" className={link}>victornabasu@yahoo.com</a>
          <span>+44 7881 177717</span>
          <span>London, UK</span>
        </div>
        <div className={col}>
          <a href="https://github.com/NeroSiegfried" target="_blank" rel="noopener noreferrer" className={extLink}>GitHub <AnimatedArrow /></a>
          <a href="https://www.linkedin.com/in/victor-nabasu-8b5223212/" target="_blank" rel="noopener noreferrer" className={extLink}>LinkedIn <AnimatedArrow /></a>
          <a href="https://x.com/NeroSiegfried" target="_blank" rel="noopener noreferrer" className={extLink}>X / Twitter <AnimatedArrow /></a>
        </div>
        <div className={col}>
          <Link href={withBase(basePath, "/v1")} className={extLink}>Previous site (v1) <AnimatedArrow /></Link>
        </div>
      </div>

      {/* Signature block (banter): a tall block wordmark that fills the container
          width EXACTLY via SVG (textLength) — so it never truncates regardless of
          the outer margins — with an elegant cursive signature centred on top at
          roughly half its height. */}
      <div className="v2-wordmark relative mt-14 flex items-center justify-center py-2">
        <svg viewBox="0 0 1000 230" preserveAspectRatio="xMidYMid meet" className="w-full select-none" aria-hidden>
          <text
            x="500"
            y="180"
            textAnchor="middle"
            textLength={1000}
            lengthAdjust="spacingAndGlyphs"
            fontSize={220}
            className="fill-[hsl(var(--foreground)/0.07)] font-display font-bold"
          >
            VICTOR NABASU
          </text>
        </svg>
        <span className="absolute font-script leading-none text-foreground text-[clamp(2rem,7cqw,5.5rem)]">
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
