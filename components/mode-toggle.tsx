"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

/**
 * Theme toggle — circular border+icon button.
 * Light mode: orange border, sun icon, orange glow on hover.
 * Dark mode: blue border, moon icon, blue glow on hover.
 */
export function ModeToggle() {
  const { setTheme } = useTheme()

  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
    >
      <Sun  className="theme-icon theme-icon-sun"  aria-hidden="true" />
      <Moon className="theme-icon theme-icon-moon" aria-hidden="true" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
