import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { hashPassword, isSecureRequest, setSessionCookie } from "@/lib/blog/auth"
import { createId, getPool } from "@/lib/blog/store"
import { rateLimit } from "@/lib/security/rate-limit"
import {
  cleanSingleLine,
  clientIp,
  isAllowedOrigin,
  isValidEmail,
  normalizeEmail,
  readJsonObject,
} from "@/lib/security/validation"

const SESSION_DURATION_DAYS = 14

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 })
  }
  const parsed = await readJsonObject(request, 4 * 1024)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const payload = parsed.body

  const username = cleanSingleLine(payload.username, 30).toLowerCase()
  const email = normalizeEmail(payload.email)
  const password = typeof payload.password === "string" ? payload.password : ""

  if (!username || username.length < 2 || !/^[a-z0-9_-]+$/.test(username) || !isValidEmail(email) || password.length < 12 || password.length > 256) {
    return NextResponse.json(
      { error: "Use a 2–30 character handle and a password of at least 12 characters." },
      { status: 400 }
    )
  }

  const registrationLimit = await rateLimit("auth-register-ip", clientIp(request), 5, 3600)
  if (!registrationLimit.ok) {
    return NextResponse.json(
      { error: "Too many account creation attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(registrationLimit.retryAfter) } },
    )
  }

  const pool = getPool()

  // Check for existing user — direct SQL, no full readDb()
  const existing = await pool.query("SELECT id FROM users WHERE email=$1 LIMIT 1", [email])
  if (existing.rows.length) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 })
  }

  const id = createId()
  const passwordHash = hashPassword(password)

  // Insert user — ON CONFLICT guards against race-condition double-submit
  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO users (id, username, email, password_hash, role, blocked, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'user', false, NOW(), NOW())
     ON CONFLICT DO NOTHING`,
    [id, username, email, passwordHash],
  )
  // Do not select the conflicting row: doing so would create a session for an
  // account this request did not insert (an account-takeover race).
  if ((inserted.rowCount ?? 0) !== 1) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 })
  }
  const userId = id

  // Create session directly
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
  await pool.query(
    `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
    [userId, token, expiresAt.toISOString()]
  )

  const response = NextResponse.json({ user: { id: userId, username, role: "user" } })
  response.headers.set("Cache-Control", "no-store")
  setSessionCookie(response, token, isSecureRequest(request.url))
  return response
}
