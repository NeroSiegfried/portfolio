import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { deletePost, getPostById } from "@/lib/blog/store"
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

  const deleted = await deletePost(id)
  if (!deleted) return NextResponse.json({ error: "Post not found." }, { status: 404 })

  // Code-driven GC: the post is gone, so its cover + body images are now orphans.
  // Only reached once the row is really gone, so images are never reclaimed out
  // from under a post that still exists.
  if (doomed) {
    void deleteImages([...(doomed.coverImage ? [doomed.coverImage] : []), ...imageUrlsIn(doomed.content)])
  }
  return NextResponse.json({ deleted: true })
}
