import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { createId, nowIso, slugify, updateDb, upsertPost } from "@/lib/blog/store"
import type { BlogPost, BlogPostStatus } from "@/lib/blog/types"

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
      customCss: payload.customCss ?? null,
      seriesId: payload.seriesId ?? null,
      position: payload.position ?? current?.position ?? 0,
      status,
      authorId: current?.authorId ?? admin.id,
      createdAt: current?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
      publishedAt,
    }

    upsertPost(db, post)
    return { post }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  return NextResponse.json(result)
}
