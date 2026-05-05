import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { readPostCommentsDb, getPool } from "@/lib/blog/store"
import { getCommentTree } from "@/lib/blog/store"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params

    const [{ comments, commentVotes, users }, currentUser] = await Promise.all([
      readPostCommentsDb(slug),
      getSessionUser(),
    ])
    const tree = getCommentTree(comments, users, commentVotes, currentUser?.id)

    // Return which comment threads the current user has muted
    let mutedCommentIds: string[] = []
    if (currentUser) {
      const pool = getPool()
      const muteRes = await pool.query<{ comment_id: string }>(
        `SELECT comment_id FROM comment_mutes WHERE user_id = $1`,
        [currentUser.id]
      )
      mutedCommentIds = muteRes.rows.map((r) => r.comment_id)
    }

    return NextResponse.json(
      { comments: tree, mutedCommentIds },
      {
        headers: {
          // Never cache — mutations must be immediately visible
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[comments GET]", message, err)
    return NextResponse.json(
      { error: "Failed to load comments.", detail: message },
      { status: 500 }
    )
  }
}
