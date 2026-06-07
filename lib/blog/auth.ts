import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { BlogUser, PublicUser } from "@/lib/blog/types"
import { createId, getPool } from "@/lib/blog/store"

const SESSION_COOKIE_NAME = "portfolio_blog_session"
const SESSION_DURATION_DAYS = 14

// Short-lived in-process cache for session → user lookups.
// Avoids a DB round-trip on every server render for logged-in users.
// TTL is intentionally short (30s) so revoked sessions take effect quickly.
const SESSION_USER_CACHE = new Map<string, { user: PublicUser | null; expires: number }>()
const SESSION_USER_TTL_MS = 30_000

function parseHash(passwordHash: string) {
  const [saltHex, digestHex] = passwordHash.split(":")
  if (!saltHex || !digestHex) return null
  return {
    salt: Buffer.from(saltHex, "hex"),
    digest: Buffer.from(digestHex, "hex"),
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16)
  const digest = pbkdf2Sync(password, salt, 100_000, 32, "sha256")
  return `${salt.toString("hex")}:${digest.toString("hex")}`
}

export function verifyPassword(password: string, passwordHash: string) {
  const parsed = parseHash(passwordHash)
  if (!parsed) return false
  const digest = pbkdf2Sync(password, parsed.salt, 100_000, 32, "sha256")
  return timingSafeEqual(digest, parsed.digest)
}

export function toPublicUser(user: BlogUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
  }
}

export async function removeSession(token: string | null) {
  if (!token) return
  SESSION_USER_CACHE.delete(token)
  const pool = getPool()
  await pool.query("DELETE FROM sessions WHERE token = $1", [token])
}

/**
 * Returns true when the request is coming from an https origin.
 * Pass the request URL (or just its hostname/protocol) so each call site
 * can make the decision at runtime rather than at module load time.
 * This prevents the bug where NEXT_PUBLIC_SITE_URL=https://… in .env.local
 * would cause secure:true cookies on http://localhost, which browsers silently drop.
 */
export function isSecureRequest(requestUrl: string | URL): boolean {
  try {
    const u = typeof requestUrl === "string" ? new URL(requestUrl) : requestUrl
    return u.protocol === "https:"
  } catch {
    return false
  }
}

export function setSessionCookie(response: NextResponse, token: string, secure: boolean) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  })
}

export function clearSessionCookie(response: NextResponse, secure: boolean) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  })
}

async function getCookieSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

export function invalidateSessionCache() {
  SESSION_USER_CACHE.clear()
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const token = await getCookieSessionToken()
  if (!token) return null

  const cached = SESSION_USER_CACHE.get(token)
  if (cached && cached.expires > Date.now()) return cached.user

  const pool = getPool()
  const result = await pool.query<{ id: string; username: string; role: string; display_name: string | null; avatar_url: string | null }>(
    `SELECT u.id, u.username, u.role, u.display_name, u.avatar_url
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [token]
  )

  const row = result.rows[0]
  const user: PublicUser | null = row
    ? {
        id: row.id,
        username: row.username,
        role: row.role as "admin" | "user",
        displayName: row.display_name ?? null,
        avatarUrl: row.avatar_url ?? null,
      }
    : null

  SESSION_USER_CACHE.set(token, { user, expires: Date.now() + SESSION_USER_TTL_MS })
  return user
}

export async function requireAdminUser() {
  const user = await getSessionUser()
  if (!user || user.role !== "admin") return null
  return user
}

function getAdminCredentials() {
  const adminEmail = process.env.BLOG_ADMIN_EMAIL
  const adminPassword = process.env.BLOG_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    return null
  }

  return {
    email: adminEmail.toLowerCase().trim(),
    password: adminPassword,
  }
}

export async function ensureAdminAccountOnDemand(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const credentials = getAdminCredentials()

  if (!credentials) return null
  if (normalizedEmail !== credentials.email || password !== credentials.password) return null

  const pool = getPool()

  // Check if an admin already exists
  const existing = await pool.query("SELECT * FROM users WHERE role='admin' LIMIT 1")
  if (existing.rows.length > 0) {
    const r = existing.rows[0]
    // Always keep the stored hash in sync with the current env credentials so that
    // changing BLOG_ADMIN_PASSWORD in the environment takes effect on next login.
    const freshHash = hashPassword(credentials.password)
    await pool.query(
      "UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2",
      [freshHash, r.id as string]
    )
    return {
      id: r.id as string,
      username: r.username as string,
      email: r.email as string,
      passwordHash: freshHash,
      role: r.role as "admin" | "user",
      createdAt: (r.created_at as Date).toISOString(),
      blocked: (r.blocked as boolean) ?? false,
    } as BlogUser
  }

  // Create admin account via direct INSERT
  const id = createId()
  const passwordHash = hashPassword(credentials.password)
  await pool.query(
    `INSERT INTO users (id, username, email, password_hash, role, blocked, created_at, updated_at)
     VALUES ($1, 'admin', $2, $3, 'admin', false, NOW(), NOW())
     ON CONFLICT (email) DO NOTHING`,
    [id, credentials.email, passwordHash]
  )

  const newAdmin = await pool.query("SELECT * FROM users WHERE email=$1 LIMIT 1", [credentials.email])
  if (!newAdmin.rows.length) return null
  const r = newAdmin.rows[0]
  return {
    id: r.id as string,
    username: r.username as string,
    email: r.email as string,
    passwordHash: r.password_hash as string,
    role: r.role as "admin" | "user",
    createdAt: (r.created_at as Date).toISOString(),
    blocked: (r.blocked as boolean) ?? false,
  } as BlogUser
}

export function getAdminEntryPath() {
  const value = process.env.ADMIN_ENTRY_PATH
  if (!value) return "/control"
  return value.startsWith("/") ? value : `/${value}`
}
