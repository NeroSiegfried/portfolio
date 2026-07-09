import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { createId, nowIso, slugify, updateDb, upsertPost, getPool } from "@/lib/blog/store"
import type { BlogPost, BlogPostStatus } from "@/lib/blog/types"
import { notifySeriesPost } from "@/lib/blog/notifications"

export async function POST(request: Request) {
  const admin = await requireAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 403 })
  }

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

  const result = await updateDb((db) => {
    const current = payload.id ? db.posts.find((post) => post.id === payload.id) ?? null : null
    const conflict = db.posts.find((post) => post.slug === slug && post.id !== (payload.id ?? ""))

    if (conflict) {
      return { error: "Post slug already exists." }
    }

    const publishedAt =
      status === "published"
        ? current?.publishedAt ?? nowIso()
        : current?.publishedAt ?? null

    const post: BlogPost = {
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

    // Pass previous status so we can detect a fresh publish event
    const prevStatus = current?.status ?? null

    upsertPost(db, post)
    return { post, prevStatus }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  // Notify series followers when a post is freshly published into a series
  const { post: savedPost, prevStatus } = result as { post: BlogPost; prevStatus: string | null }
  if (
    savedPost.status === "published" &&
    prevStatus !== "published" &&
    savedPost.seriesId
  ) {
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
}
