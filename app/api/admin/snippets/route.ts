import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { createId, nowIso, slugify, updateDb, upsertSnippet } from "@/lib/blog/store"
import type { BlogSnippet } from "@/lib/blog/types"

export async function POST(request: Request) {
  const admin = await requireAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 403 })
  }

  const payload = (await request.json()) as {
    id?: string
    title?: string
    slug?: string
    description?: string
    html?: string
    css?: string
    js?: string
  }

  const title = payload.title?.trim() ?? ""
  const slug = (payload.slug?.trim() || slugify(title)).toLowerCase()

  if (!title || !slug) {
    return NextResponse.json({ error: "Title and slug are required." }, { status: 400 })
  }

  const result = await updateDb((db) => {
    const current = payload.id ? db.snippets.find((snippet) => snippet.id === payload.id) ?? null : null
    const conflict = db.snippets.find(
      (snippet) => snippet.slug === slug && snippet.id !== (payload.id ?? "")
    )

    if (conflict) {
      return { error: "Snippet slug already exists." }
    }

    const snippet: BlogSnippet = {
      id: current?.id ?? createId(),
      slug,
      title,
      description: payload.description?.trim() ?? "",
      html: payload.html ?? "",
      css: payload.css ?? "",
      js: payload.js ?? "",
      createdAt: current?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }

    upsertSnippet(db, snippet)
    return { snippet }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  return NextResponse.json(result)
}
