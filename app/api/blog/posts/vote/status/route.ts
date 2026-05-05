import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { getPool } from "@/lib/blog/store"

/** GET /api/blog/posts/vote/status?postId=xxx
 *  Returns { voted: boolean, score: number } for the current session user.
 *  Used by PostVoteButton to hydrate its voted state on mount.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const postId = url.searchParams.get("postId") ?? ""
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 })
  }

  const pool = getPool()

  const [scoreRow, user] = await Promise.all([
    pool.query<{ score: number }>(
      "SELECT COALESCE(SUM(value),0)::int AS score FROM post_votes WHERE post_id=$1",
      [postId]
    ),
    getSessionUser(),
  ])

  const score = scoreRow.rows[0]?.score ?? 0

  if (!user) {
    return NextResponse.json({ voted: false, score }, { headers: { "Cache-Control": "no-store" } })
  }

  const voteRow = await pool.query(
    "SELECT 1 FROM post_votes WHERE post_id=$1 AND user_id=$2 LIMIT 1",
    [postId, user.id]
  )

  return NextResponse.json(
    { voted: voteRow.rows.length > 0, score },
    { headers: { "Cache-Control": "no-store" } }
  )
}
