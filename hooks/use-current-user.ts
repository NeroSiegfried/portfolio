"use client"

import { useEffect, useState } from "react"
import type { PublicUser } from "@/lib/blog/types"

/**
 * Fetches the current session user from /api/auth/me on mount.
 * Returns null while loading so the UI can render an unauthenticated shell
 * immediately (important for ISR-cached pages served from CloudFront edge).
 */
export function useCurrentUser() {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: PublicUser | null }) => {
        setUser(data.user ?? null)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => setReady(true))
  }, [])

  return { user, ready }
}
