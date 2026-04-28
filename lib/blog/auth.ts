import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { BlogDb, BlogSession, BlogUser, PublicUser } from "@/lib/blog/types"
import { createId, nowIso, readDb, updateDb, upsertSession, upsertUser } from "@/lib/blog/store"

const SESSION_COOKIE_NAME = "portfolio_blog_session"
const SESSION_DURATION_DAYS = 14

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
  }
}

function getSessionExpiryIso() {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + SESSION_DURATION_DAYS)
  return expiry.toISOString()
}

export function createSession(db: BlogDb, userId: string): BlogSession {
  const session: BlogSession = {
    token: randomBytes(32).toString("hex"),
    userId,
    createdAt: nowIso(),
    expiresAt: getSessionExpiryIso(),
  }

  upsertSession(db, session)
  return session
}

export async function removeSession(token: string | null) {
  if (!token) return

  await updateDb((db) => {
    db.sessions = db.sessions.filter((session) => session.token !== token)
  })
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

async function getCookieSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

function pruneExpiredSessions(db: BlogDb) {
  const now = Date.now()
  db.sessions = db.sessions.filter((session) => new Date(session.expiresAt).getTime() > now)
}

export async function getSessionUser() {
  const token = await getCookieSessionToken()
  if (!token) return null

  const db = await readDb()
  pruneExpiredSessions(db)

  const session = db.sessions.find((entry) => entry.token === token)
  if (!session) return null

  const user = db.users.find((entry) => entry.id === session.userId)
  if (!user) return null

  return toPublicUser(user)
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
  if (normalizedEmail !== credentials.email || password !== credentials.password) {
    return null
  }

  return await updateDb((db) => {
    const existingAdmin = db.users.find((user) => user.role === "admin")
    if (existingAdmin) return existingAdmin

    const admin: BlogUser = {
      id: createId(),
      username: "admin",
      email: credentials.email,
      passwordHash: hashPassword(credentials.password),
      role: "admin",
      createdAt: nowIso(),
    }

    upsertUser(db, admin)
    return admin
  })
}

export function getAdminEntryPath() {
  const value = process.env.ADMIN_ENTRY_PATH
  if (!value) return "/control"
  return value.startsWith("/") ? value : `/${value}`
}
