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
    const exists = db.series.some((s) => s.id === id)
    if (!exists) return { error: "Series not found." }
    db.series = db.series.filter((s) => s.id !== id)
    // Un-parent any child series
    db.series.forEach((s) => { if (s.parentId === id) s.parentId = null })
    // Remove seriesId from posts
    db.posts.forEach((p) => { if (p.seriesId === id) p.seriesId = null })
    return { deleted: true }
  })

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 })
  return NextResponse.json(result)
}
