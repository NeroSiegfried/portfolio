// app/api/auth/oauth/google/route.ts
import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { setSessionCookie, hashPassword, isSecureRequest } from "@/lib/blog/auth"
import { createId, getPool } from "@/lib/blog/store"

const SESSION_DURATION_DAYS = 14

export async function GET(request: Request) {
  const url = new URL(request.url)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const isLocal = !siteUrl || url.hostname === "localhost" || url.hostname === "127.0.0.1"
  const baseUrl = isLocal ? url.origin : siteUrl!
  // redirect_uri must exactly match what is registered in Google Console
  const redirectUri = `${baseUrl}/api/auth/oauth/google/`

  // ── CALLBACK: Google redirected back with ?code= ──────────────────────────
  const code = url.searchParams.get("code")
  if (code) {
    const stateParam = url.searchParams.get("state")
    let returnTo = "/blog"
    try {
      if (stateParam) returnTo = Buffer.from(stateParam, "base64url").toString("utf-8")
    } catch { /* ignore */ }
    if (!returnTo.startsWith("/")) returnTo = "/blog"

    const failRedirect = `${baseUrl}/blog?auth_error=google`
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) return NextResponse.redirect(failRedirect)

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })
    if (!tokenRes.ok) return NextResponse.redirect(failRedirect)

    const tokenData = (await tokenRes.json()) as { access_token?: string }
    const accessToken = tokenData.access_token
    if (!accessToken) return NextResponse.redirect(failRedirect)

    const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userRes.ok) return NextResponse.redirect(failRedirect)

    const googleUser = (await userRes.json()) as {
      sub: string; email: string; name?: string; given_name?: string
    }
    if (!googleUser.email) return NextResponse.redirect(failRedirect)

    const pool = getPool()
    let userRow = await pool.query("SELECT * FROM users WHERE email=$1 LIMIT 1", [googleUser.email])
    if (!userRow.rows.length) {
      const id = createId()
      const username = (googleUser.given_name || googleUser.name || `google-${googleUser.sub}`).slice(0, 50)
      await pool.query(
        `INSERT INTO users (id, username, email, password_hash, role, blocked, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'user', false, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [id, username, googleUser.email, hashPassword(createId())]
      )
      userRow = await pool.query("SELECT * FROM users WHERE email=$1 LIMIT 1", [googleUser.email])
    }
    if (!userRow.rows.length) return NextResponse.redirect(failRedirect)

    const r = userRow.rows[0]
    if ((r.role as string) === "admin") return NextResponse.redirect(failRedirect)

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
    await pool.query(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [r.id as string, token, expiresAt.toISOString()]
    )

    const response = NextResponse.redirect(`${baseUrl}${returnTo}`)
    setSessionCookie(response, token, isSecureRequest(url))
    return response
  }

  // ── INITIATION: no code param — redirect user to Google ──────────────────
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 })
  }

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
