import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { directTogglePostVote } from "@/lib/blog/store"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 })
  }

  const payload = (await request.json()) as { postId?: string }
  const postId = payload.postId ?? ""
  if (!postId) {
    return NextResponse.json({ error: "Post id is required." }, { status: 400 })
  }

  try {
    const score = await directTogglePostVote(postId, user.id)
    return NextResponse.json({ ok: true, score })
  } catch (err) {
    console.error("[post-vote]:", err)
    return NextResponse.json({ error: "Failed to record vote." }, { status: 500 })
  }
}
