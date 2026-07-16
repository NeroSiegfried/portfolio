"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      remove?: (id: string) => void
    }
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

/**
 * Cloudflare Turnstile widget. Calls `onVerify` with the token (or "" on
 * expiry/error). If NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset it renders nothing
 * and reports an empty token, so forms still work locally / before it's
 * configured. The server permits that only during local development and fails
 * closed when the production secret is missing.
 */
export function Turnstile({
  onVerify,
  action,
  className,
}: {
  onVerify: (token: string) => void
  action: "contact" | "newsletter"
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY) {
      onVerify("")
      return
    }
    let cancelled = false

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        action,
        callback: (token: string) => onVerify(token),
        "error-callback": () => onVerify(""),
        "expired-callback": () => onVerify(""),
        theme: "auto",
        size: "flexible",
      })
    }

    if (window.turnstile) {
      render()
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
      if (!script) {
        script = document.createElement("script")
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
      script.addEventListener("load", render)
    }
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetId.current)
        widgetId.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!SITE_KEY) return null
  // w-full + overflow-x-auto: Turnstile's "flexible" size still has a 300px
  // floor (Cloudflare's own minimum), which is wider than the available
  // column on narrow phones. Without this, the widget forces its flex/grid
  // ancestors wider than the viewport instead of just scrolling locally.
  return (
    <div className={cn("w-full max-w-full overflow-x-auto", className)}>
      <div ref={ref} aria-label="Security verification" />
    </div>
  )
}
