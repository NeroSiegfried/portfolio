import { NextResponse } from "next/server"
import { createSession, hashPassword, setSessionCookie } from "@/lib/blog/auth"
import { createId, nowIso, readDb, updateDb, upsertUser } from "@/lib/blog/store"
import type { BlogUser } from "@/lib/blog/types"

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

  const existing = (await readDb()).users.find((user) => user.email === email)
  if (existing) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 })
  }

  const user: BlogUser = {
    id: createId(),
    username,
    email,
    passwordHash: hashPassword(password),
    role: "user",
    createdAt: nowIso(),
  }

  const token = await updateDb((db) => {
    upsertUser(db, user)
    return createSession(db, user.id).token
  })

  const response = NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } })
  setSessionCookie(response, token)
  return response
}
