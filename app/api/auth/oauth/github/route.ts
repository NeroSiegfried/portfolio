// app/api/auth/oauth/github/route.ts
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth is not configured." }, { status: 503 })
  }

  const url = new URL(request.url)
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? url.origin}/api/auth/oauth/github/callback`

  const authUrl = new URL("https://github.com/login/oauth/authorize")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("scope", "user:email")

  return NextResponse.redirect(authUrl.toString())
}
