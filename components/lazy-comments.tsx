"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import BlogComments from "@/components/blog-comments"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { CommentNode } from "@/lib/blog/types"

interface LazyCommentsProps {
  postId: string
  postSlug: string
}

export default function LazyComments({ postId, postSlug }: LazyCommentsProps) {
  const { user: currentUser } = useCurrentUser()
  const [comments, setComments] = useState<CommentNode[] | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/blog/posts/${postSlug}/comments`, {
        cache: "no-store",
      })
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
        <Suspense fallback={null}>
          <BlogComments
            postId={postId}
            comments={comments}
            currentUser={currentUser}
            onRefresh={load}
          />
        </Suspense>
      )}
    </div>
  )
}

