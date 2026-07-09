"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Follow / unfollow a series for new-post notifications. Squared v2 button
 * (extracted from the v1 SeriesPostNav). If the user isn't signed in the API
 * returns an error → we send them to the comments/login section.
 */
export function SeriesFollowButton({ seriesId }: { seriesId: string }) {
  const [following, setFollowing] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/blog/series/${seriesId}/follow`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { following?: boolean }) => setFollowing(d.following ?? false))
      .catch(() => {})
  }, [seriesId])

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/blog/series/${seriesId}/follow`, { method: "POST" })
      const d = (await res.json()) as { following?: boolean; error?: string }
      if (d.error) {
        window.location.hash = "comments"
        return
      }
      setFollowing(d.following ?? false)
    } finally {
      setBusy(false)
    }
  }

  if (following === null) return null

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={following ? "Unfollow series" : "Follow series for new-post notifications"}
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] transition-colors disabled:opacity-50",
        following
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary",
      )}
    >
      {following ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
      {following ? "Following" : "Follow"}
    </button>
  )
}
