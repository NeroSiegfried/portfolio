"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BlogMarkdown from "@/components/blog-markdown"
import type { BlogPost, BlogSeries, BlogSnippet } from "@/lib/blog/types"
import { compressImage } from "@/lib/compress-image"

interface AdminDashboardProps {
  posts: BlogPost[]
  series: BlogSeries[]
  snippets: BlogSnippet[]
}

// ── Series tree picker ──────────────────────────────────────────────────────────

function SeriesTreeNode({
  node,
  all,
  selectedId,
  onSelect,
  excludeId,
  depth = 0,
}: {
  node: BlogSeries
  all: BlogSeries[]
  selectedId: string
  onSelect: (id: string) => void
  excludeId?: string
  depth?: number
}) {
  if (node.id === excludeId) return null
  const children = all.filter((s) => s.parentId === node.id && s.id !== excludeId)
  return (
    <div style={{ paddingLeft: depth ? "1rem" : 0 }}>
      <label className="flex items-center gap-2 py-0.5 cursor-pointer hover:text-foreground text-sm">
        <input
          type="radio"
          name="seriesParent"
          value={node.id}
          checked={selectedId === node.id}
          onChange={() => onSelect(node.id)}
          className="accent-primary"
        />
        {node.title}
      </label>
      {children.map((child) => (
        <SeriesTreeNode
          key={child.id}
          node={child}
          all={all}
          selectedId={selectedId}
          onSelect={onSelect}
          excludeId={excludeId}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

function SeriesTreePicker({
  allSeries,
  value,
  onChange,
  excludeId,
}: {
  allSeries: BlogSeries[]
  value: string
  onChange: (id: string) => void
  excludeId?: string
}) {
  const roots = allSeries.filter((s) => !s.parentId && s.id !== excludeId)
  return (
    <div className="rounded-md border bg-muted/20 p-3 max-h-52 overflow-y-auto text-sm">
      <label className="flex items-center gap-2 py-0.5 cursor-pointer hover:text-foreground mb-1">
        <input
          type="radio"
          name="seriesParent"
          value=""
          checked={value === ""}
          onChange={() => onChange("")}
          className="accent-primary"
        />
        <span className="text-muted-foreground italic">No parent (root series)</span>
      </label>
      {roots.map((root) => (
        <SeriesTreeNode
          key={root.id}
          node={root}
          all={allSeries}
          selectedId={value}
          onSelect={onChange}
          excludeId={excludeId}
        />
      ))}
    </div>
  )
}

// ── Snippet templates ──────────────────────────────────────────────────────────

const SNIPPET_TEMPLATES: Record<string, { html: string; css: string; js: string }> = {
  regular: {
    html: `<div class="card">
  <h2>Hello, World!</h2>
  <p>A self-contained snippet.</p>
  <button id="btn">Click me</button>
</div>`,
    css: `body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  font-family: sans-serif;
}
.card {
  text-align: center;
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}`,
    js: `document.getElementById('btn').addEventListener('click', () => {
  alert('Hello!');
});`,
  },
  "multi-tab": {
    html: `<div id="tab1">
  <h2>Tab 1</h2>
  <p>First tab content.</p>
</div>`,
    css: `body { font-family: sans-serif; padding: 1rem; }`,
    js: `// This iframe renders as one tab in a multi-snippet block.
console.log('tab loaded');`,
  },
  "full-bleed": {
    html: `<canvas id="c"></canvas>`,
    css: `* { margin: 0; padding: 0; box-sizing: border-box; }
canvas { display: block; width: 100vw; height: 100vh; }`,
    js: `const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function draw() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(draw);
}
draw();`,
  },
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminDashboard({ posts, series, snippets }: AdminDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // ── Posts ──────────────────────────────────────────────────────────────────

  const [postId, setPostId] = useState("")
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [customCss, setCustomCss] = useState("")
  const [isDraft, setIsDraft] = useState(true)
  const [postSeriesId, setPostSeriesId] = useState("")
  const [postPosition, setPostPosition] = useState(0)
  const [cells, setCells] = useState<string[]>([""])
  const content = cells.join("\n\n")
  const [showPreview, setShowPreview] = useState(false)

  // ── Image upload for post cells ────────────────────────────────────────────
  const cellFileInputRef = useRef<HTMLInputElement>(null)
  const activeUploadCellRef = useRef<number>(-1)
  const [uploadingCell, setUploadingCell] = useState<number | null>(null)
  const [cellUploadError, setCellUploadError] = useState<string | null>(null)

  const handleCellImageUpload = (i: number) => {
    activeUploadCellRef.current = i
    cellFileInputRef.current?.click()
  }

  const handleCellFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    const cellIdx = activeUploadCellRef.current
    if (cellIdx < 0) return
    setUploadingCell(cellIdx)
    setCellUploadError(null)
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.82, skipBelowBytes: 300 * 1024 })
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "comment", contentType: compressed.type, size: compressed.size }),
      })
      if (!res.ok) {
        const j = (await res.json()) as { error?: string }
        throw new Error(j.error ?? "Upload failed")
      }
      const { uploadUrl, cfUrl } = (await res.json()) as { uploadUrl: string; cfUrl: string }
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": compressed.type }, body: compressed })
      if (!put.ok) throw new Error("Upload failed: could not store file.")
      setCells((prev) =>
        prev.map((c, idx) => {
          if (idx !== cellIdx) return c
          const sep = c && !c.endsWith("\n") ? "\n\n" : ""
          return c + sep + `![image](${cfUrl})`
        })
      )
    } catch (err) {
      setCellUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingCell(null)
    }
  }

  const snippetsBySlug = useMemo(
    () => new Map(snippets.map((s) => [s.slug, s])),
    [snippets]
  )

  const loadPost = (nextId: string) => {
    const next = posts.find((p) => p.id === nextId) ?? null
    setPostId(nextId)
    setTitle(next?.title ?? "")
    setSlug(next?.slug ?? "")
    setExcerpt(next?.excerpt ?? "")
    setCustomCss(next?.customCss ?? "")
    setIsDraft((next?.status ?? "draft") === "draft")
    setPostSeriesId(next?.seriesId ?? "")
    setPostPosition(next?.position ?? 0)
    const blocks = (next?.content ?? "").split(/\n\n+/)
    setCells(blocks.length > 0 && blocks.some((b) => b.trim()) ? blocks : [""])
    setShowPreview(false)
    setError(null)
  }

  const savePost = async () => {
    setError(null)
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: postId || undefined,
        title, slug, excerpt, content,
        customCss: customCss || null,
        status: isDraft ? "draft" : "published",
        seriesId: postSeriesId || null,
        position: postPosition,
      }),
    })
    if (!res.ok) {
      const p = (await res.json()) as { error?: string }
      setError(p.error ?? "Unable to save post.")
      return
    }
    const saved = (await res.json()) as { post?: BlogPost }
    if (saved.post) setPostId(saved.post.id)
    startTransition(() => router.refresh())
  }

  const deletePost = async () => {
    if (!postId) return
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" })
    if (!res.ok) {
      const p = (await res.json()) as { error?: string }
      setError(p.error ?? "Delete failed.")
      return
    }
    loadPost("")
    startTransition(() => router.refresh())
  }

  // ── Series ─────────────────────────────────────────────────────────────────

  const [seriesId, setSeriesId] = useState("")
  const [seriesTitle, setSeriesTitle] = useState("")
  const [seriesSlug, setSeriesSlug] = useState("")
  const [seriesDescription, setSeriesDescription] = useState("")
  const [seriesType, setSeriesType] = useState("general")
  const [seriesParentId, setSeriesParentId] = useState("")
  const [seriesThemeClass, setSeriesThemeClass] = useState("")
  const [seriesNumberFormat, setSeriesNumberFormat] = useState("")
  const loadSeries = (nextId: string) => {
    const next = series.find((s) => s.id === nextId) ?? null
    setSeriesId(nextId)
    setSeriesTitle(next?.title ?? "")
    setSeriesSlug(next?.slug ?? "")
    setSeriesDescription(next?.description ?? "")
    setSeriesType(next?.type ?? "general")
    setSeriesParentId(next?.parentId ?? "")
    setSeriesThemeClass(next?.themeClass ?? "")
    setSeriesNumberFormat(next?.numberFormat ?? "")
    setError(null)
  }

  const saveSeries = async () => {
    setError(null)
    const res = await fetch("/api/admin/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: seriesId || undefined,
        title: seriesTitle, slug: seriesSlug,
        description: seriesDescription, type: seriesType,
        parentId: seriesParentId || null,
        themeClass: seriesThemeClass || null,
        numberFormat: seriesNumberFormat || null,
      }),
    })
    if (!res.ok) {
      const p = (await res.json()) as { error?: string }
      setError(p.error ?? "Unable to save series.")
      return
    }
    const saved = (await res.json()) as { series?: BlogSeries }
    if (saved.series) setSeriesId(saved.series.id)
    startTransition(() => router.refresh())
  }

  const deleteSeries = async () => {
    if (!seriesId) return
    if (!confirm(`Delete series "${seriesTitle}"? Child series will be un-parented.`)) return
    const res = await fetch(`/api/admin/series/${seriesId}`, { method: "DELETE" })
    if (!res.ok) {
      const p = (await res.json()) as { error?: string }
      setError(p.error ?? "Delete failed.")
      return
    }
    loadSeries("")
    startTransition(() => router.refresh())
  }

  // ── Snippets ───────────────────────────────────────────────────────────────

  const [snippetId, setSnippetId] = useState("")
  const [snippetTitle, setSnippetTitle] = useState("")
  const [snippetSlug, setSnippetSlug] = useState("")
  const [snippetDescription, setSnippetDescription] = useState("")
  const [snippetHtml, setSnippetHtml] = useState("<div>Hello snippet</div>")
  const [snippetCss, setSnippetCss] = useState("body { font-family: sans-serif; }")
  const [snippetJs, setSnippetJs] = useState("console.log('snippet loaded')")
  const [snippetTemplate, setSnippetTemplate] = useState("regular")

  const loadSnippet = (nextId: string) => {
    const next = snippets.find((s) => s.id === nextId) ?? null
    setSnippetId(nextId)
    setSnippetTitle(next?.title ?? "")
    setSnippetSlug(next?.slug ?? "")
    setSnippetDescription(next?.description ?? "")
    setSnippetHtml(next?.html ?? "<div>Hello snippet</div>")
    setSnippetCss(next?.css ?? "body { font-family: sans-serif; }")
    setSnippetJs(next?.js ?? "console.log('snippet loaded')")
    setError(null)
  }

  const applyTemplate = () => {
    const tpl = SNIPPET_TEMPLATES[snippetTemplate]
    if (!tpl) return
    setSnippetHtml(tpl.html)
    setSnippetCss(tpl.css)
    setSnippetJs(tpl.js)
  }

  const saveSnippet = async () => {
    setError(null)
    const res = await fetch("/api/admin/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: snippetId || undefined,
        title: snippetTitle, slug: snippetSlug,
        description: snippetDescription,
        html: snippetHtml, css: snippetCss, js: snippetJs,
      }),
    })
    if (!res.ok) {
      const p = (await res.json()) as { error?: string }
      setError(p.error ?? "Unable to save snippet.")
      return
    }
    const saved = (await res.json()) as { snippet?: BlogSnippet }
    if (saved.snippet) setSnippetId(saved.snippet.id)
    startTransition(() => router.refresh())
  }

  const deleteSnippet = async () => {
    if (!snippetId) return
    if (!confirm(`Delete snippet "${snippetTitle}"?`)) return
    const res = await fetch(`/api/admin/snippets/${snippetId}`, { method: "DELETE" })
    if (!res.ok) {
      const p = (await res.json()) as { error?: string }
      setError(p.error ?? "Delete failed.")
      return
    }
    loadSnippet("")
    startTransition(() => router.refresh())
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.refresh()
    router.push("/control")
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* Top navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to site
        </Link>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Sign out
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
          <TabsTrigger value="snippets">Snippets</TabsTrigger>
        </TabsList>

        {/* ── Posts ── */}
        <TabsContent value="posts">
          {showPreview ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← Back to editor
                </button>
                <span className="font-medium">{title || "Untitled"}</span>
                {isDraft && (
                  <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded px-1.5 py-0.5 text-xs">
                    Draft
                  </span>
                )}
              </div>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <BlogMarkdown markdown={content} snippetsBySlug={snippetsBySlug} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  value={postId}
                  onChange={(e) => loadPost(e.target.value)}
                >
                  <option value="">— New post —</option>
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.status === "draft" ? "(draft)" : ""}
                    </option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => loadPost("")}>New</Button>
              </div>

              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
                placeholder="slug-here"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Excerpt (shown in listings)"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y"
                placeholder="Custom CSS for this post (optional — scoped to the post page)"
                rows={3}
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
              />

              <div className="flex items-center gap-6 text-sm flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDraft}
                    onChange={(e) => setIsDraft(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>Draft (unpublished)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Series:</span>
                  <select
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    value={postSeriesId}
                    onChange={(e) => setPostSeriesId(e.target.value)}
                  >
                    <option value="">None</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Order:</span>
                  <input
                    type="number"
                    min={0}
                    className="w-16 rounded-md border bg-background px-2 py-2 text-sm"
                    title="Series position (0 = unset, 1 = first, 2 = second, …)"
                    placeholder="0"
                    value={postPosition}
                    onChange={(e) => setPostPosition(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Notebook editor — each block is a separate markdown cell. Embed snippets with{" "}
                  <code className="text-xs bg-muted px-1 rounded">{`{{snippet:slug}}`}</code>
                  {" or "}
                  <code className="text-xs bg-muted px-1 rounded">{`{{snippet:slug wide}}`}</code>
                </p>

                {/* ── Notebook cells ── */}
                {/* Hidden file input for image uploads */}
                <input
                  ref={cellFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleCellFileChange}
                />
                {cellUploadError && (
                  <p className="text-xs text-destructive">{cellUploadError}</p>
                )}

                <div className="space-y-2">
                  {/* Insert before first cell */}
                  <button
                    type="button"
                    onClick={() => setCells((prev) => ["", ...prev])}
                    className="w-full py-1 text-xs text-muted-foreground/50 hover:text-primary hover:bg-muted/30 rounded transition-colors border border-dashed border-border/30 hover:border-primary/40"
                  >
                    + cell
                  </button>

                  {cells.map((cell, i) => (
                    <div key={i} className="group relative rounded-md border border-border/60 bg-background focus-within:border-primary/60 transition-colors">
                      {/* Cell number badge */}
                      <div className="flex items-center justify-between px-2 pt-1.5 pb-0">
                        <span className="text-[10px] text-muted-foreground/40 select-none font-mono">
                          [{i + 1}]
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="Upload image"
                            onClick={() => handleCellImageUpload(i)}
                            disabled={uploadingCell !== null}
                            className="text-[10px] text-muted-foreground/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                          >
                            {uploadingCell === i ? "↑ uploading…" : "📷 image"}
                          </button>
                          {cells.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setCells((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove cell"
                            >
                              ✕ remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editor textarea */}
                      <textarea
                        className="w-full bg-transparent px-3 py-2 text-sm font-mono leading-relaxed resize-none outline-none min-h-[80px]"
                        rows={Math.max(3, cell.split("\n").length + 1)}
                        value={cell}
                        onChange={(e) => setCells((prev) => prev.map((c, idx) => idx === i ? e.target.value : c))}
                        placeholder={i === 0 ? "# Start writing…" : "Continue…"}
                        spellCheck={false}
                        onKeyDown={(e) => {
                          // Shift+Enter inserts a new cell below
                          if (e.key === "Enter" && e.shiftKey) {
                            e.preventDefault()
                            setCells((prev) => [...prev.slice(0, i + 1), "", ...prev.slice(i + 1)])
                          }
                        }}
                      />

                      {/* Live markdown preview */}
                      {cell.trim() && (
                        <div className="border-t border-border/40 px-3 py-3 prose prose-sm dark:prose-invert max-w-none text-sm">
                          <BlogMarkdown markdown={cell} snippetsBySlug={snippetsBySlug} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Insert after last cell */}
                  <button
                    type="button"
                    onClick={() => setCells((prev) => [...prev, ""])}
                    className="w-full py-1 text-xs text-muted-foreground/50 hover:text-primary hover:bg-muted/30 rounded transition-colors border border-dashed border-border/30 hover:border-primary/40"
                  >
                    + cell
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button onClick={savePost} disabled={isPending}>Save Post</Button>
                <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!content}>
                  Preview
                </Button>
                {postId && (
                  <Button
                    variant="ghost"
                    onClick={deletePost}
                    disabled={isPending}
                    className="text-destructive hover:text-destructive ml-auto"
                  >
                    Delete Post
                  </Button>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Series ── */}
        <TabsContent value="series">
          <div className="space-y-4">
            {series.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Existing series</p>
                <div className="divide-y divide-border/40 rounded-md border overflow-hidden">
                  {series.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => loadSeries(s.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors flex items-center justify-between${
                        seriesId === s.id ? " bg-muted/60 font-medium" : ""
                      }`}
                    >
                      <span>{s.title}</span>
                      <span className="text-xs text-muted-foreground">{s.type}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => loadSeries("")}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  + New series
                </button>
              </div>
            )}

            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Series title"
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
            />
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              placeholder="series-slug"
              value={seriesSlug}
              onChange={(e) => setSeriesSlug(e.target.value)}
            />
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
              rows={3}
              placeholder="Description"
              value={seriesDescription}
              onChange={(e) => setSeriesDescription(e.target.value)}
            />
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Type (course, book, webnovel, general…)"
              value={seriesType}
              onChange={(e) => setSeriesType(e.target.value)}
            />

            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Parent series</p>
              <SeriesTreePicker
                allSeries={series}
                value={seriesParentId}
                onChange={setSeriesParentId}
                excludeId={seriesId || undefined}
              />
            </div>

            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Theme class (optional, e.g. theme-arc)"
              value={seriesThemeClass}
              onChange={(e) => setSeriesThemeClass(e.target.value)}
            />
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Number format (optional) — e.g. Project {n}, Chapter {roman}, Part {ROMAN}"
              value={seriesNumberFormat}
              onChange={(e) => setSeriesNumberFormat(e.target.value)}
            />

            <div className="flex items-center gap-3">
              <Button onClick={saveSeries} disabled={isPending}>Save Series</Button>
              {seriesId && (
                <Button
                  variant="ghost"
                  onClick={deleteSeries}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive ml-auto"
                >
                  Delete Series
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Snippets ── */}
        <TabsContent value="snippets">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <select
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                value={snippetId}
                onChange={(e) => loadSnippet(e.target.value)}
              >
                <option value="">— New snippet —</option>
                {snippets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.slug})
                  </option>
                ))}
              </select>
              <Button variant="ghost" size="sm" onClick={() => loadSnippet("")}>New</Button>
            </div>

            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Snippet title"
              value={snippetTitle}
              onChange={(e) => setSnippetTitle(e.target.value)}
            />
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              placeholder="snippet-slug"
              value={snippetSlug}
              onChange={(e) => setSnippetSlug(e.target.value)}
            />
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Description (optional)"
              value={snippetDescription}
              onChange={(e) => setSnippetDescription(e.target.value)}
            />

            {/* Template generator */}
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="text-muted-foreground">Template:</span>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={snippetTemplate}
                onChange={(e) => setSnippetTemplate(e.target.value)}
              >
                <option value="regular">Regular</option>
                <option value="multi-tab">Multi-tab</option>
                <option value="full-bleed">Full-bleed canvas</option>
              </select>
              <Button variant="outline" size="sm" onClick={applyTemplate}>Use Template</Button>
            </div>

            {/* Tabbed code editor */}
            <Tabs defaultValue="html" className="w-full">
              <TabsList>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="js">JS</TabsTrigger>
              </TabsList>
              <TabsContent value="html">
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono leading-relaxed resize-y"
                  rows={18}
                  value={snippetHtml}
                  onChange={(e) => setSnippetHtml(e.target.value)}
                  spellCheck={false}
                />
              </TabsContent>
              <TabsContent value="css">
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono leading-relaxed resize-y"
                  rows={18}
                  value={snippetCss}
                  onChange={(e) => setSnippetCss(e.target.value)}
                  spellCheck={false}
                />
              </TabsContent>
              <TabsContent value="js">
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono leading-relaxed resize-y"
                  rows={18}
                  value={snippetJs}
                  onChange={(e) => setSnippetJs(e.target.value)}
                  spellCheck={false}
                />
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-3">
              <Button onClick={saveSnippet} disabled={isPending}>Save Snippet</Button>
              {snippetId && (
                <Button
                  variant="ghost"
                  onClick={deleteSnippet}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive ml-auto"
                >
                  Delete Snippet
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
