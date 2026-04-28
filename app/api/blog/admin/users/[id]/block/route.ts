import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/blog/auth"
import { nowIso, updateDb } from "@/lib/blog/store"

// POST /api/blog/admin/users/[id]/block — admin blocks a user
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 })
  }

  const { id } = await params

  const result = await updateDb((db) => {
    const target = db.users.find((u) => u.id === id)
    if (!target) return { error: "User not found." }
    if (target.role === "admin") return { error: "Cannot block an admin." }
    target.blocked = true
    return { blocked: true, userId: id }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }
  return NextResponse.json(result)
}

// DELETE /api/blog/admin/users/[id]/block — admin unblocks a user
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 })
  }

  const { id } = await params

  const result = await updateDb((db) => {
    const target = db.users.find((u) => u.id === id)
    if (!target) return { error: "User not found." }
    target.blocked = false
    return { unblocked: true, userId: id }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }
  return NextResponse.json(result)
}
