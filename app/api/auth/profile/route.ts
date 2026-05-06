import { NextResponse } from "next/server"
import { getSessionUser, invalidateSessionCache } from "@/lib/blog/auth"
import { getPool } from "@/lib/blog/store"
import { permanentizeUrl } from "@/lib/blog/media"

export async function PATCH(req: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { displayName, username, avatarUrl } = body as { displayName?: string | null; username?: string; avatarUrl?: string | null }

  // Basic validation
  if (displayName !== undefined && displayName !== null) {
    if (typeof displayName !== "string" || displayName.trim().length > 60) {
      return NextResponse.json({ error: "Display name must be 60 characters or fewer." }, { status: 400 })
    }
  }
  if (username !== undefined) {
    if (typeof username !== "string" || username.trim().length < 2 || username.trim().length > 30) {
      return NextResponse.json({ error: "Handle must be between 2 and 30 characters." }, { status: 400 })
    }
    if (!/^[a-z0-9_-]+$/.test(username.trim())) {
      return NextResponse.json({ error: "Handle may only contain lowercase letters, numbers, _ and -." }, { status: 400 })
    }
    // Check uniqueness (pool will be initialised below if not already)
    const checkPool = getPool()
    const taken = await checkPool.query<{ id: string }>(
      `SELECT id FROM users WHERE username = $1 AND id != $2`,
      [username.trim(), user.id]
    )
    if (taken.rows.length > 0) {
      return NextResponse.json({ error: "That handle is already taken." }, { status: 409 })
    }
  }
  if (avatarUrl !== undefined && avatarUrl !== null) {
    if (typeof avatarUrl !== "string" || avatarUrl.length > 500) {
      return NextResponse.json({ error: "Avatar URL is too long." }, { status: 400 })
    }
    if (avatarUrl.trim() && !avatarUrl.startsWith("http://") && !avatarUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Avatar URL must start with http:// or https://" }, { status: 400 })
    }
  }

  const pool = getPool()

  // If the avatar URL points to a temporary uploads/ object, copy it to permanent storage
  const finalAvatarUrl = avatarUrl?.trim()
    ? await permanentizeUrl(avatarUrl.trim(), `media/avatars/${user.id}`)
    : (avatarUrl?.trim() || null)

  await pool.query(
    `UPDATE users SET
       display_name = $1,
       avatar_url   = $2,
       username     = COALESCE($4, username),
       updated_at   = NOW()
     WHERE id = $3`,
    [
      displayName?.trim() || null,
      finalAvatarUrl,
      user.id,
      username?.trim() || null,
    ]
  )

  // Invalidate session cache so /api/auth/me returns fresh data immediately
  invalidateSessionCache()

  return NextResponse.json({ ok: true })
}
