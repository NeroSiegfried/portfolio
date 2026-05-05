import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { getPool } from "@/lib/blog/store"
import { autoFollowSeries, notifyCommentReply } from "@/lib/blog/notifications"

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

  const pool = getPool()

  // Validate post exists and grab seriesId + slug + title for notifications
  const postRow = await pool.query<{ id: string; series_id: string | null; slug: string; title: string }>(
    "SELECT id, series_id, slug, title FROM posts WHERE id=$1 AND status='published' LIMIT 1",
    [postId]
  )
  if (!postRow.rows.length) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 })
  }
  const post = postRow.rows[0]

  // Check not blocked
  const userRow = await pool.query("SELECT blocked FROM users WHERE id=$1 LIMIT 1", [user.id])
  if (userRow.rows[0]?.blocked) {
    return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 })
  }

  // Validate parent comment if replying
  if (parentId) {
    const parentRow = await pool.query(
      "SELECT id FROM comments WHERE id=$1 AND post_id=$2 LIMIT 1",
      [parentId, postId]
    )
    if (!parentRow.rows.length) {
      return NextResponse.json({ error: "Parent comment not found." }, { status: 404 })
    }
  }

  const id = randomUUID()
  const now = new Date().toISOString()
  await pool.query(
    `INSERT INTO comments (id, post_id, user_id, parent_id, content, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $6)`,
    [id, postId, user.id, parentId, content, now]
  )

  // Auto-follow series (non-blocking, fire-and-forget)
  if (post.series_id) {
    void autoFollowSeries(pool, user.id, post.series_id).catch(() => {})
  }

  // Notify ancestor comment authors of the reply (non-blocking)
  if (parentId) {
    void notifyCommentReply(pool, {
      newCommentId: id,
      actorId: user.id,
      actorName: user.displayName ?? user.username,
      actorAvatarUrl: user.avatarUrl ?? null,
      postId,
      postSlug: post.slug,
      postTitle: post.title,
    }).catch(() => {})
  }

  const comment = { id, postId, userId: user.id, parentId, content, createdAt: now, updatedAt: now }
  return NextResponse.json({ comment })
}
