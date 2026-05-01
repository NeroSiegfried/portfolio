// app/api/auth/oauth/google/route.ts
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 })
  }

  const url = new URL(request.url)
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1"
  // When running locally always use url.origin so Google redirects back to localhost,
  // not to the production NEXT_PUBLIC_SITE_URL.
  const baseUrl = isLocal ? url.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? url.origin)
  const redirectUri = `${baseUrl}/api/auth/oauth/google/callback`

  // Preserve the page the user was on so we can redirect back after auth
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
