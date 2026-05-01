"use client"

import { useEffect, useState, useCallback } from "react"
import BlogComments from "@/components/blog-comments"
import type { CommentNode, PublicUser } from "@/lib/blog/types"

interface LazyCommentsProps {
  postId: string
  postSlug: string
  currentUser: PublicUser | null
}

/**
 * Fetches comments immediately when the component mounts (no scroll-triggered delay).
 * The component itself is rendered below the fold via the article layout, so the
 * initial page paint is not blocked — we just kick off the fetch right away.
 */
export default function LazyComments({ postId, postSlug, currentUser }: LazyCommentsProps) {
  const [comments, setComments] = useState<CommentNode[] | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/blog/posts/${postSlug}/comments`)
      if (res.ok) {
        const data = (await res.json()) as { comments: CommentNode[] }
        setComments(data.comments)
      }
    } finally {
      setLoading(false)
    }
  }, [postSlug])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      {loading && (
        <div className="space-y-3 py-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {comments !== null && (
        <BlogComments postId={postId} comments={comments} currentUser={currentUser} />
      )}
    </div>
  )
}

