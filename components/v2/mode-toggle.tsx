"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

/** Minimal v2 theme toggle — a single icon button using the accent on hover. */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label="Toggle light / dark theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <Sun className={`h-4 w-4 ${isDark ? "hidden" : "block"}`} />
      <Moon className={`h-4 w-4 ${isDark ? "block" : "hidden"}`} />
    </button>
  )
}
