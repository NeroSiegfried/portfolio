import { NextResponse } from "next/server"
import { readPostCommentsDb } from "@/lib/blog/store"
import { getCommentTree } from "@/lib/blog/store"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params

  // readPostCommentsDb accepts the slug and caches both the ID lookup and queries
  const { comments, commentVotes, users } = await readPostCommentsDb(slug)
  const tree = getCommentTree(comments, users, commentVotes)

  return NextResponse.json(
    { comments: tree },
    {
      headers: {
        // Cache for 30s at the edge, stale-while-revalidate for 60s
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  )
}
