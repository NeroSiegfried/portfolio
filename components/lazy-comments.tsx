"use client"

import { useEffect, useState, useCallback } from "react"
import BlogComments from "@/components/blog-comments"
import type { CommentNode, PublicUser } from "@/lib/blog/types"

interface LazyCommentsProps {
  postId: string
  postSlug: string
}

export default function LazyComments({ postId, postSlug }: LazyCommentsProps) {
  const [comments, setComments] = useState<CommentNode[]>([])
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null)
  const [mutedCommentIds, setMutedCommentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const [commentsRes, userRes] = await Promise.all([
          fetch(`/api/blog/posts/${postSlug}/comments`, { cache: "no-store" }),
          fetch("/api/auth/me", { cache: "no-store" }),
        ])
        if (!commentsRes.ok) throw new Error("Failed to load comments")
        const data = (await commentsRes.json()) as { comments: CommentNode[]; mutedCommentIds?: string[] }
        setComments(data.comments)
        setMutedCommentIds(data.mutedCommentIds ?? [])
        if (userRes.ok) {
          const userData = (await userRes.json()) as { user: PublicUser | null }
          setCurrentUser(userData.user ?? null)
        } else {
          setCurrentUser(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load comments")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [postSlug]
  )

  useEffect(() => {
    void load(false)
  }, [load])

  const onRefresh = useCallback(async () => {
    await load(true)
  }, [load])

  if (loading) {
    return (
      <div className="space-y-3 py-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 text-sm text-destructive">
        {error}{" "}
        <button onClick={() => void load(false)} className="underline hover:no-underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {refreshing && (
        <div className="absolute right-0 top-0 text-xs text-muted-foreground animate-pulse select-none">
          Refreshing…
        </div>
      )}
      <BlogComments
        postId={postId}
        comments={comments}
        currentUser={currentUser}
        mutedCommentIds={mutedCommentIds}
        onRefresh={onRefresh}
        onUserChange={setCurrentUser}
      />
    </div>
  )
}

