import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { getPool } from "@/lib/blog/store"

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
  const pool = getPool()

  // Admin-only: toggle visibility
  if (typeof payload.hidden === "boolean") {
    if (user.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 })
    const res = await pool.query(
      "UPDATE comments SET hidden=$1, updated_at=NOW() WHERE id=$2 RETURNING hidden",
      [payload.hidden, id]
    )
    if (!res.rows.length) return NextResponse.json({ error: "Comment not found." }, { status: 404 })
    return NextResponse.json({ hidden: res.rows[0].hidden as boolean })
  }

  const content = payload.content?.trim() ?? ""
  if (!content) return NextResponse.json({ error: "Content is required." }, { status: 400 })

  const commentRow = await pool.query("SELECT * FROM comments WHERE id=$1 LIMIT 1", [id])
  if (!commentRow.rows.length) return NextResponse.json({ error: "Comment not found." }, { status: 404 })
  const comment = commentRow.rows[0]

  const isOwner = (comment.user_id as string) === user.id
  const isAdmin = user.role === "admin"
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Not allowed." }, { status: 403 })

  if (isOwner && !isAdmin) {
    const age = Date.now() - new Date(comment.created_at as string).getTime()
    if (age > EDIT_WINDOW_MS) return NextResponse.json({ error: "Edit window expired (15 minutes)." }, { status: 403 })
  }

  await pool.query(
    "UPDATE comments SET content=$1, edited_at=NOW(), updated_at=NOW() WHERE id=$2",
    [content, id]
  )
  return NextResponse.json({ comment: { ...comment, content, updatedAt: new Date().toISOString() } })
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
  const pool = getPool()

  const commentRow = await pool.query("SELECT user_id FROM comments WHERE id=$1 LIMIT 1", [id])
  if (!commentRow.rows.length) return NextResponse.json({ error: "Comment not found." }, { status: 404 })

  const isOwner = (commentRow.rows[0].user_id as string) === user.id
  const isAdmin = user.role === "admin"
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Not allowed." }, { status: 403 })

  if (hard) {
    await pool.query("DELETE FROM comments WHERE id=$1", [id])
    return NextResponse.json({ deleted: true })
  }

  await pool.query("UPDATE comments SET hidden=true, updated_at=NOW() WHERE id=$1", [id])
  return NextResponse.json({ hidden: true })
}
