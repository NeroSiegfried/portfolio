import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { updateDb } from "@/lib/blog/store"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 })

  const { id } = await params

  const result = await updateDb((db) => {
    const exists = db.snippets.some((s) => s.id === id)
    if (!exists) return { error: "Snippet not found." }
    db.snippets = db.snippets.filter((s) => s.id !== id)
    return { deleted: true }
  })

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 })
  return NextResponse.json(result)
}
