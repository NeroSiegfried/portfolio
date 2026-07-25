// app/api/auth/oauth/github/callback/route.ts
import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { clearOAuthStateCookie, consumeOAuthState, setSessionCookie, isSecureRequest } from "@/lib/blog/auth"
import { createId, getPool } from "@/lib/blog/store"
import { hashPassword } from "@/lib/blog/auth"

const SESSION_DURATION_DAYS = 14

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const isLocal = !siteUrl || url.hostname === "localhost" || url.hostname === "127.0.0.1"
  const baseUrl = new URL(isLocal ? url.origin : siteUrl!).origin
  const failRedirect = `${baseUrl}/blog?auth_error=github`
  const failureResponse = NextResponse.redirect(failRedirect)
  const returnTo = consumeOAuthState(request, failureResponse, "github", url.searchParams.get("state"))

  if (!code || !returnTo) return failureResponse

  const clientId = isLocal ? process.env.GITHUB_CLIENT_ID_LOCAL : process.env.GITHUB_CLIENT_ID
  const clientSecret = isLocal ? process.env.GITHUB_CLIENT_SECRET_LOCAL : process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) return failureResponse

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })
  if (!tokenRes.ok) return failureResponse

  const tokenData = (await tokenRes.json()) as { access_token?: string }
  const accessToken = tokenData.access_token
  if (!accessToken) return failureResponse

  // Fetch GitHub user info + primary email
  const [userRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
    }),
    fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
    }),
  ])
  if (!userRes.ok) return failureResponse

  const ghUser = (await userRes.json()) as { login: string; id: number }
  const emails = emailsRes.ok
    ? ((await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>)
    : []
  const primaryEmail = (
    emails.find((e) => e.primary && e.verified)?.email ??
    emails.find((e) => e.verified)?.email ??
    `gh-${ghUser.id}@github.invalid`
  ).trim().toLowerCase()

  const pool = getPool()
  let userRow = await pool.query("SELECT * FROM users WHERE email=$1 LIMIT 1", [primaryEmail])
  if (!userRow.rows.length) {
    const id = createId()
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, role, blocked, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'user', false, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [id, ghUser.login.slice(0, 50), primaryEmail, hashPassword(createId())]
    )
    userRow = await pool.query("SELECT * FROM users WHERE email=$1 LIMIT 1", [primaryEmail])
  }
  if (!userRow.rows.length) return failureResponse

  const r = userRow.rows[0]
  // Never grant admin access via OAuth
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
  clearOAuthStateCookie(response, "github", isSecureRequest(url))
  setSessionCookie(response, token, isSecureRequest(url))
  return response
}
