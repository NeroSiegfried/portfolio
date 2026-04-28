import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { createId, updateDb } from "@/lib/blog/store"
import type { BlogPostVote } from "@/lib/blog/types"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 })
  }

  const payload = (await request.json()) as {
    postId?: string
  }

  const postId = payload.postId ?? ""
  if (!postId) {
    return NextResponse.json({ error: "Post id is required." }, { status: 400 })
  }

  const result = await updateDb((db) => {
    const postExists = db.posts.some((entry) => entry.id === postId && entry.status === "published")
    if (!postExists) {
      return { error: "Post not found." }
    }

    const existing = db.postVotes.find((entry) => entry.postId === postId && entry.userId === user.id)
    if (existing) {
      db.postVotes = db.postVotes.filter((entry) => entry.id !== existing.id)
      return { ok: true }
    }

    const vote: BlogPostVote = {
      id: createId(),
      postId,
      userId: user.id,
      value: 1,
    }

    db.postVotes.push(vote)
    return { ok: true }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json(result)
}
