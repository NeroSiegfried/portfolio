"use client"

import Link from "next/link"
import { useBasePath, withBase } from "@/lib/base-path"

export function Footer() {
  const basePath = useBasePath()
  const year = new Date().getFullYear()
  const link = "transition-colors hover:text-primary"

  return (
    <footer className="border-t border-border px-5 pb-10 pt-16 md:px-8">
      <div className="w-full">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <a href="#top" className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
              Victor Nabasu
            </a>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Software Engineer · Full-Stack Developer
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <a href="#work" className={link}>Work</a>
            <a href="#about" className={link}>About</a>
            <Link href={withBase(basePath, "/blog")} className={link}>Blog</Link>
            <a href="#contact" className={link}>Contact</a>
            <a href="https://github.com/NeroSiegfried" target="_blank" rel="noopener noreferrer" className={link}>GitHub</a>
            <a href="https://www.linkedin.com/in/victor-nabasu-8b5223212/" target="_blank" rel="noopener noreferrer" className={link}>LinkedIn</a>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} Victor Nabasu. All rights reserved.</span>
          <Link href={withBase(basePath, "/v1")} className={link}>
            View the previous site (v1) →
          </Link>
        </div>
      </div>
    </footer>
  )
}
