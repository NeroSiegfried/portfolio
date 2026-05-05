import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { getPool } from "@/lib/blog/store"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 })

  const { id } = await params
  const pool = getPool()

  // Verify comment exists
  const commentRow = await pool.query(
    `SELECT id FROM comments WHERE id = $1 LIMIT 1`,
    [id]
  )
  if (!commentRow.rows.length) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 })
  }

  const existing = await pool.query(
    `SELECT 1 FROM comment_mutes WHERE user_id = $1 AND comment_id = $2`,
    [user.id, id]
  )

  if (existing.rows.length > 0) {
    await pool.query(
      `DELETE FROM comment_mutes WHERE user_id = $1 AND comment_id = $2`,
      [user.id, id]
    )
    return NextResponse.json({ muted: false })
  }

  await pool.query(
    `INSERT INTO comment_mutes (user_id, comment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [user.id, id]
  )
  return NextResponse.json({ muted: true })
}
