import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { nowIso, updateDb } from "@/lib/blog/store"

const EDIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// PATCH /api/blog/comments/[id] — edit own comment or admin toggle-hide
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 })

  const { id } = await params
  const payload = (await request.json()) as { content?: string; hidden?: boolean }

  // Admin-only: toggle visibility
  if (typeof payload.hidden === "boolean") {
    if (user.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 })
    const result = await updateDb((db) => {
      const comment = db.comments.find((c) => c.id === id)
      if (!comment) return { error: "Comment not found." }
      comment.hidden = payload.hidden!
      comment.updatedAt = nowIso()
      return { hidden: comment.hidden }
    })
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 })
    return NextResponse.json(result)
  }

  const content = payload.content?.trim() ?? ""
  if (!content) return NextResponse.json({ error: "Content is required." }, { status: 400 })

  const result = updateDb((db) => {
    const comment = db.comments.find((c) => c.id === id)
    if (!comment) return { error: "Comment not found." }

    const isOwner = comment.userId === user.id
    const isAdmin = user.role === "admin"

    if (!isOwner && !isAdmin) return { error: "Not allowed." }

    if (isOwner && !isAdmin) {
      const age = Date.now() - new Date(comment.createdAt).getTime()
      if (age > EDIT_WINDOW_MS) return { error: "Edit window expired (15 minutes)." }
    }

    comment.content = content
    comment.editedAt = nowIso()
    comment.updatedAt = nowIso()
    return { comment }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 })
  }
  return NextResponse.json(result)
}

// DELETE /api/blog/comments/[id] — owner soft-deletes; admin can hard-delete
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 })

  const { id } = await params
  const url = new URL(request.url)
  const hard = url.searchParams.get("hard") === "1" && user.role === "admin"

  const result = updateDb((db) => {
    const comment = db.comments.find((c) => c.id === id)
    if (!comment) return { error: "Comment not found." }

    const isOwner = comment.userId === user.id
    const isAdmin = user.role === "admin"

    if (!isOwner && !isAdmin) return { error: "Not allowed." }

    if (hard) {
      db.comments = db.comments.filter((c) => c.id !== id)
      return { deleted: true }
    }

    comment.hidden = true
    comment.updatedAt = nowIso()
    return { hidden: true }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 })
  }
  return NextResponse.json(result)
}
