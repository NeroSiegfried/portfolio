import { NextResponse } from "next/server"
import {
  createSession,
  ensureAdminAccountOnDemand,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
} from "@/lib/blog/auth"
import { readDb, updateDb } from "@/lib/blog/store"

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

  const db = await readDb()
  const user = db.users.find((entry) => entry.email === email)

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  const token = await updateDb((state) => createSession(state, user.id).token)
  const response = NextResponse.json({ user: toPublicUser(user) })
  setSessionCookie(response, token)
  return response
}
