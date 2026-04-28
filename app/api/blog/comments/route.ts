import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { createId, nowIso, updateDb } from "@/lib/blog/store"
import type { BlogComment } from "@/lib/blog/types"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 })
  }

  const payload = (await request.json()) as {
    postId?: string
    parentId?: string | null
    content?: string
  }

  const postId = payload.postId ?? ""
  const parentId = payload.parentId ?? null
  const content = payload.content?.trim() ?? ""

  if (!postId || !content) {
    return NextResponse.json({ error: "Post and content are required." }, { status: 400 })
  }

  const comment: BlogComment = {
    id: createId(),
    postId,
    userId: user.id,
    parentId,
    content,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  const result = await updateDb((db) => {
    const postExists = db.posts.some((post) => post.id === postId && post.status === "published")
    if (!postExists) {
      return { error: "Post not found." }
    }

    const author = db.users.find((u) => u.id === user.id)
    if (author?.blocked) {
      return { error: "Your account has been suspended." }
    }

    if (parentId) {
      const parent = db.comments.find((entry) => entry.id === parentId && entry.postId === postId)
      if (!parent) {
        return { error: "Parent comment not found." }
      }
    }

    db.comments.push(comment)
    return { comment }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json(result)
}
