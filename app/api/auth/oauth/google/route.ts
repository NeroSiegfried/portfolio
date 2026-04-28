// app/api/auth/oauth/google/route.ts
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 })
  }

  const url = new URL(request.url)
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? url.origin}/api/auth/oauth/google/callback`

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("access_type", "online")

  return NextResponse.redirect(authUrl.toString())
}
