import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { getPool } from "@/lib/blog/store"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ notifications: [], unreadCount: 0 })

  const pool = getPool()
  const res = await pool.query(
    `SELECT id, type, read_at, created_at, post_id, comment_id, actor_id, data
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 30`,
    [user.id]
  )

  const unreadCount = res.rows.filter((r) => !r.read_at).length
  return NextResponse.json({ notifications: res.rows, unreadCount })
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

  const { ids } = (await req.json()) as { ids?: string[] }
  const pool = getPool()

  if (ids && ids.length > 0) {
    await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND id = ANY($2) AND read_at IS NULL`,
      [user.id, ids]
    )
  } else {
    await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
      [user.id]
    )
  }

  return NextResponse.json({ ok: true })
}
