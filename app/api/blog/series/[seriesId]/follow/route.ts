import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { getPool } from "@/lib/blog/store"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ following: false })

  const { seriesId } = await params
  const pool = getPool()
  const res = await pool.query(
    `SELECT 1 FROM series_follows WHERE user_id = $1 AND series_id = $2`,
    [user.id, seriesId]
  )
  return NextResponse.json({ following: res.rows.length > 0 })
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 })

  const { seriesId } = await params
  const pool = getPool()

  const existing = await pool.query(
    `SELECT 1 FROM series_follows WHERE user_id = $1 AND series_id = $2`,
    [user.id, seriesId]
  )

  if (existing.rows.length > 0) {
    await pool.query(
      `DELETE FROM series_follows WHERE user_id = $1 AND series_id = $2`,
      [user.id, seriesId]
    )
    return NextResponse.json({ following: false })
  }

  await pool.query(
    `INSERT INTO series_follows (user_id, series_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [user.id, seriesId]
  )
  return NextResponse.json({ following: true })
}
