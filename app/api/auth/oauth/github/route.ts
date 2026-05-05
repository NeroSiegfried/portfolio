// app/api/auth/oauth/github/route.ts
import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { setSessionCookie, hashPassword } from "@/lib/blog/auth"
import { createId, getPool } from "@/lib/blog/store"

const SESSION_DURATION_DAYS = 14

export async function GET(request: Request) {
  const url = new URL(request.url)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const isLocal = !siteUrl || url.hostname === "localhost" || url.hostname === "127.0.0.1"
  const baseUrl = isLocal ? url.origin : siteUrl!
  // redirect_uri must exactly match what is registered in GitHub OAuth app
  const redirectUri = `${baseUrl}/api/auth/oauth/github/`

  const clientId = isLocal ? process.env.GITHUB_CLIENT_ID_LOCAL : process.env.GITHUB_CLIENT_ID
  const clientSecret = isLocal ? process.env.GITHUB_CLIENT_SECRET_LOCAL : process.env.GITHUB_CLIENT_SECRET

  // ── CALLBACK: GitHub redirected back with ?code= ─────────────────────────
  const code = url.searchParams.get("code")
  if (code) {
    const stateParam = url.searchParams.get("state")
    let returnTo = "/blog"
    try {
      if (stateParam) returnTo = Buffer.from(stateParam, "base64url").toString("utf-8")
    } catch { /* ignore */ }
    if (!returnTo.startsWith("/")) returnTo = "/blog"

    const failRedirect = `${baseUrl}/blog?auth_error=github`
    if (!clientId || !clientSecret) return NextResponse.redirect(failRedirect)

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    })
    if (!tokenRes.ok) return NextResponse.redirect(failRedirect)

    const tokenData = (await tokenRes.json()) as { access_token?: string }
    const accessToken = tokenData.access_token
    if (!accessToken) return NextResponse.redirect(failRedirect)

    const [userRes, emailsRes] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
      }),
    ])
    if (!userRes.ok) return NextResponse.redirect(failRedirect)

    const ghUser = (await userRes.json()) as { login: string; id: number }
    const emails = emailsRes.ok
      ? ((await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>)
      : []
    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email ??
      emails.find((e) => e.verified)?.email ??
      `gh-${ghUser.id}@github.invalid`

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
    setSessionCookie(response, token)
    return response
  }

  // ── INITIATION: no code param — redirect user to GitHub ──────────────────
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth is not configured." }, { status: 503 })
  }

  const returnTo = url.searchParams.get("returnTo") ?? "/blog"
  const authUrl = new URL("https://github.com/login/oauth/authorize")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("scope", "user:email")
  authUrl.searchParams.set("state", Buffer.from(returnTo).toString("base64url"))

  return NextResponse.redirect(authUrl.toString())
}
