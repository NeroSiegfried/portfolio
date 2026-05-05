"use client"

import { useEffect, useState, useTransition } from "react"
import { ThumbsUp } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"

interface PostVoteButtonProps {
  postId: string
  initialScore: number
  /** Whether the current user has already upvoted this post (server-provided). */
  initialVoted?: boolean
}

export default function PostVoteButton({
  postId,
  initialScore,
  initialVoted = false,
}: PostVoteButtonProps) {
  const { user } = useCurrentUser()
  const isLoggedIn = Boolean(user)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [voted, setVoted] = useState(initialVoted)
  const [score, setScore] = useState(initialScore)

  // Fetch current user's actual vote state on mount (ISR page can't do this server-side)
  useEffect(() => {
    fetch(`/api/blog/posts/vote/status?postId=${encodeURIComponent(postId)}`, {
      cache: "no-store",
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { voted: boolean; score: number } | null) => {
        if (data) {
          setVoted(data.voted)
          setScore(data.score)
        }
      })
      .catch(() => {/* non-critical */})
  }, [postId])

  const vote = async () => {
    if (!isLoggedIn) {
      setError("Sign in to upvote.")
      return
    }

    // Optimistic toggle
    const prevVoted = voted
    const prevScore = score
    setVoted(!prevVoted)
    setScore(prevVoted ? score - 1 : score + 1)
    setError(null)

    const response = await fetch("/api/blog/posts/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })

    if (!response.ok) {
      // Revert on failure
      setVoted(prevVoted)
      setScore(prevScore)
      const payload = (await response.json()) as { error?: string }
      setError(payload.error ?? "Unable to update vote.")
      return
    }

    // Sync to authoritative score from server
    const payload = (await response.json()) as { score?: number }
    if (typeof payload.score === "number") setScore(payload.score)

    // No router.refresh() needed — score is synced directly from server response
    startTransition(() => {/* state already updated */})
  }

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={vote}
          disabled={isPending}
          className={[
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
            voted
              ? "border-secondary bg-secondary/10 text-secondary"
              : "border-border/60 text-muted-foreground hover:border-secondary/70 hover:text-secondary active:bg-secondary/10",
          ].join(" ")}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {voted ? "Upvoted" : "Upvote"}
        </button>
        <span className="text-sm tabular-nums text-muted-foreground">{score}</span>
      </div>
      {/* Fixed height to prevent layout shift */}
      <div className="mt-1.5 h-4">
        {error && <p className="text-xs text-muted-foreground">{error}</p>}
      </div>
    </div>
  )
}
