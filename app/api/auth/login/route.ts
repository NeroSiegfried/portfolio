import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import {
  ensureAdminAccountOnDemand,
  hashPassword,
  isSecureRequest,
  passwordNeedsRehash,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
} from "@/lib/blog/auth"
import { getPool } from "@/lib/blog/store"
import { rateLimit } from "@/lib/security/rate-limit"
import {
  clientIp,
  isAllowedOrigin,
  isValidEmail,
  normalizeEmail,
  rateLimitKey,
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

  const email = normalizeEmail(payload.email)
  const password = typeof payload.password === "string" ? payload.password : ""

  if (!isValidEmail(email) || !password || password.length > 256) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }

  const ip = clientIp(request)
  const ipLimit = await rateLimit("auth-login-ip", ip, 10, 15 * 60)
  const accountLimit = await rateLimit("auth-login-account", rateLimitKey(email), 5, 15 * 60)
  if (!ipLimit.ok || !accountLimit.ok) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(ipLimit.retryAfter, accountLimit.retryAfter)) },
      },
    )
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

  if (user.blocked || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  if (passwordNeedsRehash(user.passwordHash)) {
    await pool.query("UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2", [hashPassword(password), user.id])
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
  response.headers.set("Cache-Control", "no-store")
  setSessionCookie(response, token, isSecureRequest(request.url))
  return response
}
