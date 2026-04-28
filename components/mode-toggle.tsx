"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

/**
 * Theme toggle — fully CSS-driven, zero hydration flash.
 *
 * Both Sun and Moon icons are always in the DOM.
 * Visibility is controlled by the `.dark` class that next-themes
 * writes to <html> synchronously from localStorage — the correct
 * state is painted on the very first frame, no "light flash" ever.
 *
 * Animations: sun rotates & scales out, moon rotates & scales in
 * (and vice versa), all via CSS transitions on `.dark` selector.
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
      className="theme-switch"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
    >
      <span className="theme-switch-track">
        {/* Slider translates the thumb left ↔ right */}
        <span className="theme-switch-thumb-slider">
          {/* Thumb circle — shows one icon at a time via CSS rotation */}
          <span className="theme-switch-thumb">
            <Sun  className="theme-icon theme-icon-sun"  aria-hidden="true" />
            <Moon className="theme-icon theme-icon-moon" aria-hidden="true" />
          </span>
        </span>
      </span>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
