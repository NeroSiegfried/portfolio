import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import {
  ensureAdminAccountOnDemand,
  isSecureRequest,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
} from "@/lib/blog/auth"
import { getPool } from "@/lib/blog/store"

const SESSION_DURATION_DAYS = 14

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    email?: string
    password?: string
  }

  const email = payload.email?.trim().toLowerCase()
  const password = payload.password ?? ""

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }

  await ensureAdminAccountOnDemand(email, password)

  // Direct SQL lookup — avoids full readDb() just to find one user
  const pool = getPool()
  const userRow = await pool.query("SELECT * FROM users WHERE email=$1 LIMIT 1", [email])
  if (!userRow.rows.length) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }
  const r = userRow.rows[0]
  const user = {
    id: r.id as string,
    username: r.username as string,
    email: r.email as string,
    passwordHash: r.password_hash as string,
    role: r.role as "admin" | "user",
    createdAt: (r.created_at as Date).toISOString(),
    blocked: (r.blocked as boolean) ?? false,
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  // Create session directly in DB — avoids updateDb full read+write cycle
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
  await pool.query(
    `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
    [user.id, token, expiresAt.toISOString()]
  )

  const response = NextResponse.json({ user: toPublicUser(user) })
  setSessionCookie(response, token, isSecureRequest(request.url))
  return response
}
