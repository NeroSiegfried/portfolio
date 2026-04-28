import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { clearSessionCookie, removeSession } from "@/lib/blog/auth"

const SESSION_COOKIE_NAME = "portfolio_blog_session"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
  await removeSession(token)

  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response)
  return response
}
