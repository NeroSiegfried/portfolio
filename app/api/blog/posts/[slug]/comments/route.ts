import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { readPostCommentsDb } from "@/lib/blog/store"
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

    return NextResponse.json(
      { comments: tree },
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
