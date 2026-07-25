// app/api/auth/oauth/google/route.ts
import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import {
  consumeOAuthState,
  clearOAuthStateCookie,
  createOAuthState,
  hashPassword,
  isSecureRequest,
  sanitizeReturnTo,
  setSessionCookie,
} from "@/lib/blog/auth"
import { createId, getPool } from "@/lib/blog/store"

const SESSION_DURATION_DAYS = 14

export async function GET(request: Request) {
  const url = new URL(request.url)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const isLocal = !siteUrl || url.hostname === "localhost" || url.hostname === "127.0.0.1"
  const baseUrl = new URL(isLocal ? url.origin : siteUrl!).origin
  // redirect_uri must exactly match what is registered in Google Console
  const redirectUri = `${baseUrl}/api/auth/oauth/google/`

  // ── CALLBACK: Google redirected back with ?code= ──────────────────────────
  const code = url.searchParams.get("code")
  if (code) {
    const failRedirect = `${baseUrl}/blog?auth_error=google`
    const failureResponse = NextResponse.redirect(failRedirect)
    const returnTo = consumeOAuthState(request, failureResponse, "google", url.searchParams.get("state"))
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!returnTo || !clientId || !clientSecret) return failureResponse

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
    if (!tokenRes.ok) return failureResponse

    const tokenData = (await tokenRes.json()) as { access_token?: string }
    const accessToken = tokenData.access_token
    if (!accessToken) return failureResponse

    const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userRes.ok) return failureResponse

    const googleUser = (await userRes.json()) as {
      sub: string; email: string; email_verified?: boolean; name?: string; given_name?: string
    }
    if (!googleUser.email || googleUser.email_verified !== true) return failureResponse
    const normalizedEmail = googleUser.email.trim().toLowerCase()

    const pool = getPool()
    let userRow = await pool.query("SELECT * FROM users WHERE email=$1 LIMIT 1", [normalizedEmail])
    if (!userRow.rows.length) {
      const id = createId()
      const username = (googleUser.given_name || googleUser.name || `google-${googleUser.sub}`).slice(0, 50)
      await pool.query(
        `INSERT INTO users (id, username, email, password_hash, role, blocked, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'user', false, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [id, username, normalizedEmail, hashPassword(createId())]
      )
      userRow = await pool.query("SELECT * FROM users WHERE email=$1 LIMIT 1", [normalizedEmail])
    }
    if (!userRow.rows.length) return failureResponse

    const r = userRow.rows[0]
    if ((r.role as string) === "admin" || (r.blocked as boolean)) return failureResponse

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
    await pool.query(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [r.id as string, token, expiresAt.toISOString()]
    )

    const response = NextResponse.redirect(`${baseUrl}${returnTo}`)
    clearOAuthStateCookie(response, "google", isSecureRequest(url))
    setSessionCookie(response, token, isSecureRequest(url))
    return response
  }

  // ── INITIATION: no code param — redirect user to Google ──────────────────
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 })
  }

  const returnTo = sanitizeReturnTo(url.searchParams.get("returnTo"))
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("access_type", "online")
  const response = NextResponse.redirect(authUrl.toString())
  authUrl.searchParams.set("state", createOAuthState(response, "google", returnTo, isSecureRequest(url)))
  response.headers.set("Location", authUrl.toString())
  response.headers.set("Cache-Control", "no-store")
  return response
}
