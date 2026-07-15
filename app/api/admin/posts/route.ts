import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { createId, nowIso, slugify, getPool, getPostById, isSlugTaken, writePost } from "@/lib/blog/store"
import type { BlogPost, BlogPostStatus } from "@/lib/blog/types"
import { notifySeriesPost } from "@/lib/blog/notifications"
import { markReferenced, deleteImages, imageUrlsIn } from "@/lib/blog/media"

/** All CloudFront image URLs a post references (cover + body). */
function postImages(post: { coverImage?: string | null; content?: string | null }): string[] {
  return [...(post.coverImage ? [post.coverImage] : []), ...imageUrlsIn(post.content)]
}

export async function POST(request: Request) {
  const admin = await requireAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 403 })
  }

  try {
    const payload = (await request.json()) as {
      id?: string
      title?: string
      slug?: string
      excerpt?: string
      content?: string
      coverImage?: string | null
      customCss?: string | null
      seriesId?: string | null
      status?: BlogPostStatus
      position?: number
    }

    const title = payload.title?.trim() ?? ""
    const slug = (payload.slug?.trim() || slugify(title)).toLowerCase()

    if (!title || !slug) {
      return NextResponse.json({ error: "Title and slug are required." }, { status: 400 })
    }

    const status: BlogPostStatus = payload.status === "published" ? "published" : "draft"

    // Only the edited post changes — look it up + check the slug directly, then
    // write that single row (updateDb rewrote the WHOLE db, which timed out).
    if (await isSlugTaken(slug, payload.id ?? "")) {
      return NextResponse.json({ error: "Post slug already exists." }, { status: 409 })
    }

    const current = payload.id ? await getPostById(payload.id) : null
    const prevStatus = current?.status ?? null
    const publishedAt =
      status === "published" ? current?.publishedAt ?? nowIso() : current?.publishedAt ?? null

    const savedPost: BlogPost = {
      id: current?.id ?? createId(),
      slug,
      title,
      excerpt: payload.excerpt?.trim() ?? "",
      content: payload.content ?? "",
      coverImage: payload.coverImage?.trim() || null,
      customCss: payload.customCss ?? null,
      seriesId: payload.seriesId ?? null,
      position: payload.position ?? current?.position ?? 0,
      status,
      authorId: current?.authorId ?? admin.id,
      createdAt: current?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
      publishedAt,
    }

    await writePost(savedPost)

    // Uploads are permanent in place. Tag every image the saved post references
    // keep=true (protect from the lifecycle backstop); delete any image the edit
    // dropped from the previous version (code-driven GC).
    const nextImages = postImages(savedPost)
    void markReferenced(nextImages)
    if (current) {
      const kept = new Set(nextImages)
      void deleteImages(postImages(current).filter((u) => !kept.has(u)))
    }

    // Notify series followers when a post is freshly published into a series
    if (savedPost.status === "published" && prevStatus !== "published" && savedPost.seriesId) {
      const pool = getPool()
      const seriesRow = await pool.query<{ title: string }>(
        `SELECT title FROM series WHERE id = $1 LIMIT 1`,
        [savedPost.seriesId]
      )
      const seriesTitle = seriesRow.rows[0]?.title ?? ""
      void notifySeriesPost(pool, {
        postId: savedPost.id,
        postSlug: savedPost.slug,
        postTitle: savedPost.title,
        seriesId: savedPost.seriesId,
        seriesTitle,
        actorId: admin.id,
      }).catch(() => {})
    }

    return NextResponse.json({ post: savedPost })
  } catch (err) {
    // Never return an empty-body 500 — the client does res.json() on failure.
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[admin/posts] save failed:", detail)
    return NextResponse.json({ error: "Failed to save post.", detail }, { status: 500 })
  }
}
