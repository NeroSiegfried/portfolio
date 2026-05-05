// app/api/auth/oauth/google/route.ts
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 })
  }

  const url = new URL(request.url)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const isLocal = !siteUrl || url.hostname === "localhost" || url.hostname === "127.0.0.1"
  const baseUrl = isLocal ? url.origin : siteUrl!
  const redirectUri = `${baseUrl}/api/auth/oauth/google/callback`

  const returnTo = url.searchParams.get("returnTo") ?? "/blog"

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("access_type", "online")
  authUrl.searchParams.set("state", Buffer.from(returnTo).toString("base64url"))

  return NextResponse.redirect(authUrl.toString())
}
