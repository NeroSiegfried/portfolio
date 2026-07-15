import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { updateDb, getPostById } from "@/lib/blog/store"
import { deleteImages, imageUrlsIn } from "@/lib/blog/media"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 })

  const { id } = await params

  // Grab the post (with content + cover) before it's gone so we can reclaim its
  // images once the delete commits.
  const doomed = await getPostById(id)

  const result = await updateDb((db) => {
    const exists = db.posts.some((p) => p.id === id)
    if (!exists) return { error: "Post not found." }
    db.posts = db.posts.filter((p) => p.id !== id)
    return { deleted: true }
  })

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 })

  // Code-driven GC: the post is gone, so its cover + body images are now orphans.
  if (doomed) {
    void deleteImages([...(doomed.coverImage ? [doomed.coverImage] : []), ...imageUrlsIn(doomed.content)])
  }
  return NextResponse.json(result)
}
