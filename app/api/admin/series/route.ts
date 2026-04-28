import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { createId, nowIso, slugify, updateDb, upsertSeries } from "@/lib/blog/store"
import type { BlogSeries } from "@/lib/blog/types"

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
    type?: string
    parentId?: string | null
    themeClass?: string | null
    numberFormat?: string | null
  }

  const title = payload.title?.trim() ?? ""
  const slug = (payload.slug?.trim() || slugify(title)).toLowerCase()

  if (!title || !slug) {
    return NextResponse.json({ error: "Title and slug are required." }, { status: 400 })
  }

  const result = await updateDb((db) => {
    const current = payload.id ? db.series.find((series) => series.id === payload.id) ?? null : null

    const conflict = db.series.find(
      (series) =>
        series.slug === slug &&
        series.parentId === (payload.parentId ?? null) &&
        series.id !== (payload.id ?? "")
    )

    if (conflict) {
      return { error: "Slug already exists under this parent." }
    }

    const series: BlogSeries = {
      id: current?.id ?? createId(),
      slug,
      title,
      description: payload.description?.trim() ?? "",
      type: payload.type?.trim() || "general",
      parentId: payload.parentId ?? null,
      themeClass: payload.themeClass?.trim() || null,
      numberFormat: payload.numberFormat?.trim() || null,
      createdAt: current?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }

    upsertSeries(db, series)
    return { series }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  return NextResponse.json(result)
}
