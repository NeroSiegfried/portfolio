// app/api/auth/oauth/github/route.ts
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1"

  const clientId = isLocal ? process.env.GITHUB_CLIENT_ID_LOCAL : process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth is not configured." }, { status: 503 })
  }

  // When local, use url.origin so GitHub redirects back to localhost, not production.
  const baseUrl = isLocal ? url.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? url.origin)
  const redirectUri = `${baseUrl}/api/auth/oauth/github/callback`

  // Preserve the page the user was on so we can redirect back after auth
  const returnTo = url.searchParams.get("returnTo") ?? "/blog"

  const authUrl = new URL("https://github.com/login/oauth/authorize")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("scope", "user:email")
  authUrl.searchParams.set("state", Buffer.from(returnTo).toString("base64url"))

  return NextResponse.redirect(authUrl.toString())
}
