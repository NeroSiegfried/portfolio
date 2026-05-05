import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { hashPassword, isSecureRequest, setSessionCookie } from "@/lib/blog/auth"
import { createId, getPool } from "@/lib/blog/store"

const SESSION_DURATION_DAYS = 14

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    username?: string
    email?: string
    password?: string
  }

  const username = payload.username?.trim()
  const email = payload.email?.trim().toLowerCase()
  const password = payload.password ?? ""

  if (!username || !email || password.length < 8) {
    return NextResponse.json(
      { error: "Provide username, email, and password (min 8 chars)." },
      { status: 400 }
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
  await pool.query(
    `INSERT INTO users (id, username, email, password_hash, role, blocked, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'user', false, NOW(), NOW())
     ON CONFLICT (email) DO NOTHING`,
    [id, username, email, passwordHash]
  )

  // If ON CONFLICT fired (race condition), return 409
  const inserted = await pool.query("SELECT id FROM users WHERE email=$1 LIMIT 1", [email])
  if (!inserted.rows.length) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 })
  }
  const userId = inserted.rows[0].id as string

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
  setSessionCookie(response, token, isSecureRequest(request.url))
  return response
}
