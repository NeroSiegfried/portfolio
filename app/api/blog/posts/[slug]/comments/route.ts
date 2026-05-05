import { NextResponse } from "next/server"
import { readPostCommentsDb } from "@/lib/blog/store"
import { getCommentTree } from "@/lib/blog/store"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params

    const { comments, commentVotes, users } = await readPostCommentsDb(slug)
    const tree = getCommentTree(comments, users, commentVotes)

    return NextResponse.json(
      { comments: tree },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
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
