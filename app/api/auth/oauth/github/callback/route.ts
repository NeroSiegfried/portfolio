// app/api/auth/oauth/github/callback/route.ts
import { NextResponse } from "next/server"
import { createSession, setSessionCookie, toPublicUser } from "@/lib/blog/auth"
import { createId, nowIso, readDb, updateDb, upsertUser } from "@/lib/blog/store"
import { hashPassword } from "@/lib/blog/auth"
import type { BlogUser } from "@/lib/blog/types"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin
  const failRedirect = `${siteUrl}/blog?auth_error=github`

  if (!code) return NextResponse.redirect(failRedirect)

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) return NextResponse.redirect(failRedirect)

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })
  if (!tokenRes.ok) return NextResponse.redirect(failRedirect)

  const tokenData = (await tokenRes.json()) as { access_token?: string }
  const accessToken = tokenData.access_token
  if (!accessToken) return NextResponse.redirect(failRedirect)

  // Fetch GitHub user info
  const [userRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
    }),
    fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
    }),
  ])

  if (!userRes.ok) return NextResponse.redirect(failRedirect)

  const ghUser = (await userRes.json()) as { login: string; id: number; name?: string }
  const emails = emailsRes.ok
    ? ((await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>)
    : []
  const primaryEmail =
    emails.find((e) => e.primary && e.verified)?.email ??
    emails.find((e) => e.verified)?.email ??
    `gh-${ghUser.id}@github.invalid`

  const db = await readDb()
  let user = db.users.find((u) => u.email === primaryEmail)

  if (!user) {
    // Create new blog user from GitHub identity
    const newUser: BlogUser = {
      id: createId(),
      username: ghUser.login,
      email: primaryEmail,
      passwordHash: hashPassword(createId()), // unusable random password
      role: "user",
      createdAt: nowIso(),
    }
    user = await updateDb((state) => {
      upsertUser(state, newUser)
      return newUser
    })
  }

  if (!user || user.role === "admin") {
    // Never let OAuth grant admin access
    return NextResponse.redirect(failRedirect)
  }

  const token = await updateDb((state) => createSession(state, user!.id).token)
  const response = NextResponse.redirect(`${siteUrl}/blog`)
  setSessionCookie(response, token)
  return response
}
