"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ThumbsUp } from "lucide-react"

interface PostVoteButtonProps {
  postId: string
  initialScore: number
  isLoggedIn: boolean
  /** Whether the current user has already upvoted this post (server-provided). */
  initialVoted?: boolean
}

export default function PostVoteButton({
  postId,
  initialScore,
  isLoggedIn,
  initialVoted = false,
}: PostVoteButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [voted, setVoted] = useState(initialVoted)

  const vote = async () => {
    if (!isLoggedIn) {
      setError("Sign in to upvote.")
      return
    }

    // Optimistic toggle
    setVoted((prev) => !prev)
    setError(null)

    const response = await fetch("/api/blog/posts/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })

    if (!response.ok) {
      // Revert on failure
      setVoted((prev) => !prev)
      const payload = (await response.json()) as { error?: string }
      setError(payload.error ?? "Unable to update vote.")
      return
    }

    startTransition(() => {
      router.refresh()
    })
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
        <span className="text-sm tabular-nums text-muted-foreground">{initialScore}</span>
      </div>
      {/* Fixed height to prevent layout shift */}
      <div className="mt-1.5 h-4">
        {error && <p className="text-xs text-muted-foreground">{error}</p>}
      </div>
    </div>
  )
}
