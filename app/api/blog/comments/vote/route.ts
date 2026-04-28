import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { createId, updateDb } from "@/lib/blog/store"
import type { BlogCommentVote } from "@/lib/blog/types"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 })
  }

  const payload = (await request.json()) as {
    commentId?: string
    value?: number
  }

  const commentId = payload.commentId ?? ""
  const value = payload.value

  if (!commentId || (value !== 1 && value !== -1)) {
    return NextResponse.json({ error: "Comment and vote value are required." }, { status: 400 })
  }

  const result = await updateDb((db) => {
    const commentExists = db.comments.some((entry) => entry.id === commentId)
    if (!commentExists) {
      return { error: "Comment not found." }
    }

    const existing = db.commentVotes.find(
      (vote) => vote.commentId === commentId && vote.userId === user.id
    )

    if (!existing) {
      const vote: BlogCommentVote = {
        id: createId(),
        commentId,
        userId: user.id,
        value,
      }
      db.commentVotes.push(vote)
      return { ok: true }
    }

    if (existing.value === value) {
      db.commentVotes = db.commentVotes.filter((vote) => vote.id !== existing.id)
      return { ok: true }
    }

    existing.value = value
    return { ok: true }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json(result)
}
