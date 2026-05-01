import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { directToggleCommentVote } from "@/lib/blog/store"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 })
  }

  const payload = (await request.json()) as { commentId?: string; value?: number }
  const commentId = payload.commentId ?? ""
  const value = payload.value

  if (!commentId || (value !== 1 && value !== -1)) {
    return NextResponse.json({ error: "Comment and vote value are required." }, { status: 400 })
  }

  try {
    const score = await directToggleCommentVote(commentId, user.id, value as 1 | -1)
    return NextResponse.json({ ok: true, score })
  } catch (err) {
    console.error("[comment-vote]:", err)
    return NextResponse.json({ error: "Failed to record vote." }, { status: 500 })
  }
}
