"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText, Layers, Code2, MessageSquare, Users, LogOut, ExternalLink,
  Eye, EyeOff, Trash2, Plus, Ban, ShieldCheck, ArrowLeft, Upload,
} from "lucide-react"
import BlogMarkdown from "@/components/blog-markdown"
import type { BlogPost, BlogSeries, BlogSnippet } from "@/lib/blog/types"
import { compressImage } from "@/lib/compress-image"
import { cn } from "@/lib/utils"

// ── Shared control classes (v2: squared, mono labels, primary accents) ──────────
const input = "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
const monoInput = cn(input, "font-mono")
const btn = "inline-flex items-center justify-center gap-2 border border-border px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
const btnPrimary = "inline-flex items-center justify-center gap-2 bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
const btnDanger = "inline-flex items-center justify-center gap-2 border border-destructive/50 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
const eyebrow = "font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground"

// ── Public prop shapes (author/post resolved server-side; no passwordHash) ──────
export interface AdminComment {
  id: string
  postId: string
  postTitle: string
  postSlug: string
  authorName: string
  authorUsername: string
  content: string
  createdAt: string
  hidden: boolean
}
export interface AdminUser {
  id: string
  username: string
  displayName: string | null
  email: string
  role: "admin" | "user"
  blocked: boolean
  avatarUrl: string | null
  createdAt: string
}

interface AdminDashboardProps {
  posts: BlogPost[]
  series: BlogSeries[]
  snippets: BlogSnippet[]
  comments: AdminComment[]
  users: AdminUser[]
  adminName: string
}

type Section = "posts" | "series" | "snippets" | "comments" | "users"

// ── Series tree picker ──────────────────────────────────────────────────────────

function SeriesTreeNode({
  node, all, selectedId, onSelect, excludeId, depth = 0,
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
    <div className={depth ? "pl-4" : undefined}>
      <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm hover:text-foreground">
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
        <SeriesTreeNode key={child.id} node={child} all={all} selectedId={selectedId} onSelect={onSelect} excludeId={excludeId} depth={depth + 1} />
      ))}
    </div>
  )
}

function SeriesTreePicker({
  allSeries, value, onChange, excludeId,
}: {
  allSeries: BlogSeries[]
  value: string
  onChange: (id: string) => void
  excludeId?: string
}) {
  const roots = allSeries.filter((s) => !s.parentId && s.id !== excludeId)
  return (
    <div className="max-h-52 overflow-y-auto border border-border bg-muted/20 p-3 text-sm">
      <label className="mb-1 flex cursor-pointer items-center gap-2 py-0.5 hover:text-foreground">
        <input
          type="radio"
          name="seriesParent"
          value=""
          checked={value === ""}
          onChange={() => onChange("")}
          className="accent-primary"
        />
        <span className="italic text-muted-foreground">No parent (root series)</span>
      </label>
      {roots.map((root) => (
        <SeriesTreeNode key={root.id} node={root} all={allSeries} selectedId={value} onSelect={onChange} excludeId={excludeId} />
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

export default function AdminDashboard({ posts, series, snippets, comments, users, adminName }: AdminDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [section, setSection] = useState<Section>("posts")

  // ── Posts ──────────────────────────────────────────────────────────────────

  const [postId, setPostId] = useState("")
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [coverImage, setCoverImage] = useState("")
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

  // ── Cover image upload (card + article header) ─────────────────────────────
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setCoverUploading(true)
    setError(null)
    try {
      const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1200, quality: 0.82, skipBelowBytes: 300 * 1024 })
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "comment", contentType: compressed.type, size: compressed.size }),
      })
      if (!res.ok) {
        const j = (await res.json()) as { error?: string }
        throw new Error(j.error ?? "Upload failed")
      }
      const { uploadUrl, cfUrl, tagging } = (await res.json()) as { uploadUrl: string; cfUrl: string; tagging?: string }
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": compressed.type, ...(tagging ? { "x-amz-tagging": tagging } : {}) }, body: compressed })
      if (!put.ok) throw new Error("Upload failed: could not store file.")
      setCoverImage(cfUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setCoverUploading(false)
    }
  }

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
      const { uploadUrl, cfUrl, tagging } = (await res.json()) as { uploadUrl: string; cfUrl: string; tagging?: string }
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": compressed.type, ...(tagging ? { "x-amz-tagging": tagging } : {}) }, body: compressed })
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

  const snippetsBySlug = useMemo(() => new Map(snippets.map((s) => [s.slug, s])), [snippets])

  const loadPost = (nextId: string) => {
    const next = posts.find((p) => p.id === nextId) ?? null
    setPostId(nextId)
    setTitle(next?.title ?? "")
    setSlug(next?.slug ?? "")
    setExcerpt(next?.excerpt ?? "")
    setCoverImage(next?.coverImage ?? "")
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
        coverImage: coverImage || null,
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
  const [codeTab, setCodeTab] = useState<"html" | "css" | "js">("html")

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

  // ── Moderation: comments ─────────────────────────────────────────────────────
  const [commentFilter, setCommentFilter] = useState<"all" | "visible" | "hidden">("all")
  const [commentQuery, setCommentQuery] = useState("")
  const [modBusy, setModBusy] = useState<string | null>(null)

  const filteredComments = useMemo(() => {
    const q = commentQuery.trim().toLowerCase()
    return comments.filter((c) => {
      if (commentFilter === "visible" && c.hidden) return false
      if (commentFilter === "hidden" && !c.hidden) return false
      if (q && !`${c.content} ${c.authorName} ${c.authorUsername} ${c.postTitle}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [comments, commentFilter, commentQuery])

  const setCommentHidden = async (id: string, hidden: boolean) => {
    setModBusy(id)
    setError(null)
    try {
      // Soft-hide is a DELETE; unhide is a PATCH { hidden: false } (mirrors the public thread).
      const res = hidden
        ? await fetch(`/api/blog/comments/${id}`, { method: "DELETE" })
        : await fetch(`/api/blog/comments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hidden: false }),
          })
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Action failed.")
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.")
    } finally {
      setModBusy(null)
    }
  }

  const hardDeleteComment = async (id: string) => {
    if (!confirm("Permanently delete this comment and its replies? This cannot be undone.")) return
    setModBusy(id)
    setError(null)
    try {
      const res = await fetch(`/api/blog/comments/${id}?hard=1`, { method: "DELETE" })
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Delete failed.")
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.")
    } finally {
      setModBusy(null)
    }
  }

  // ── Moderation: users ─────────────────────────────────────────────────────────
  const [userQuery, setUserQuery] = useState("")
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => `${u.username} ${u.displayName ?? ""} ${u.email}`.toLowerCase().includes(q))
  }, [users, userQuery])

  const setUserBlocked = async (id: string, blocked: boolean) => {
    setModBusy(id)
    setError(null)
    try {
      const res = await fetch(`/api/blog/admin/users/${id}/block`, { method: blocked ? "POST" : "DELETE" })
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Action failed.")
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.")
    } finally {
      setModBusy(null)
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.refresh()
    router.push("/control")
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

  const hiddenCount = comments.filter((c) => c.hidden).length
  const nav: { id: Section; label: string; icon: typeof FileText; count: number }[] = [
    { id: "posts", label: "Posts", icon: FileText, count: posts.length },
    { id: "series", label: "Series", icon: Layers, count: series.length },
    { id: "snippets", label: "Snippets", icon: Code2, count: snippets.length },
    { id: "comments", label: "Comments", icon: MessageSquare, count: comments.length },
    { id: "users", label: "Users", icon: Users, count: users.length },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3.5 md:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg font-semibold tracking-tight">Control</span>
            <span className={cn(eyebrow, "hidden sm:inline")}>Dashboard</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <span className="hidden sm:inline">@{adminName}</span>
            <Link href="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">View site</span>
            </Link>
            <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 transition-colors hover:text-destructive">
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:gap-10 md:px-6 md:py-10">
        {/* Sidebar nav */}
        <aside className="md:w-56 md:shrink-0">
          <nav className="flex gap-2 overflow-x-auto pb-1 md:sticky md:top-24 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
            {nav.map((s) => {
              const Icon = s.icon
              const active = section === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "group inline-flex shrink-0 items-center gap-2.5 border px-3.5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors md:w-full",
                    active
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                  <span className={cn("ml-auto tabular-nums", active ? "text-primary/70" : "text-muted-foreground/60")}>{s.count}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main panel */}
        <main className="min-w-0 flex-1">
          {error ? (
            <div className="mb-5 border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</div>
          ) : null}

          {/* ── Posts ── */}
          {section === "posts" && (
            showPreview ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <button type="button" onClick={() => setShowPreview(false)} className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to editor
                  </button>
                  <span className="font-medium">{title || "Untitled"}</span>
                  {isDraft && <span className="border border-border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Draft</span>}
                </div>
                <div className="prose prose-neutral max-w-none dark:prose-invert">
                  <BlogMarkdown markdown={content} snippetsBySlug={snippetsBySlug} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-1 flex items-end justify-between border-b border-border pb-4">
                  <div>
                    <span className={cn(eyebrow, "mb-2 block")}>Posts</span>
                    <h2 className="font-serif text-2xl tracking-tight md:text-3xl">{postId ? "Edit post" : "New post"}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select className={input} value={postId} onChange={(e) => loadPost(e.target.value)}>
                    <option value="">— New post —</option>
                    {posts.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} {p.status === "draft" ? "(draft)" : ""}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => loadPost("")} className={btn}><Plus className="h-3.5 w-3.5" /> New</button>
                </div>

                <input className={input} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input className={monoInput} placeholder="slug-here" value={slug} onChange={(e) => setSlug(e.target.value)} />
                <input className={input} placeholder="Excerpt (shown in listings)" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />

                {/* Cover image — used as the card image and the article header image. */}
                <div className="flex flex-wrap items-center gap-2">
                  <input className={cn(input, "min-w-0 flex-1")} placeholder="Cover image URL (card + article header — optional)" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
                  <input ref={coverFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCoverFileChange} />
                  <button type="button" onClick={() => coverFileInputRef.current?.click()} disabled={coverUploading} className={btn}>
                    <Upload className="h-3.5 w-3.5" /> {coverUploading ? "Uploading…" : "Upload"}
                  </button>
                  {coverImage ? (
                    <button type="button" onClick={() => setCoverImage("")} className={btn}>Clear</button>
                  ) : null}
                </div>
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImage} alt="Cover preview" className="h-28 w-auto border border-border object-cover" />
                ) : null}

                <textarea className={cn(monoInput, "resize-y")} placeholder="Custom CSS for this post (optional — scoped to the post page)" rows={3} value={customCss} onChange={(e) => setCustomCss(e.target.value)} />

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} className="accent-primary" />
                    <span>Draft (unpublished)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={eyebrow}>Series</span>
                    <select className={input} value={postSeriesId} onChange={(e) => setPostSeriesId(e.target.value)}>
                      <option value="">None</option>
                      {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={eyebrow}>Order</span>
                    <input type="number" min={0} className={cn(input, "w-16")} title="Series position (0 = unset, 1 = first, …)" placeholder="0" value={postPosition} onChange={(e) => setPostPosition(Number(e.target.value))} />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    Notebook editor — each block is a separate markdown cell. Embed snippets with{" "}
                    <code className="bg-muted px-1 text-xs">{`{{snippet:slug}}`}</code>
                    {" or "}
                    <code className="bg-muted px-1 text-xs">{`{{snippet:slug wide}}`}</code>
                  </p>

                  <input ref={cellFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCellFileChange} />
                  {cellUploadError && <p className="text-xs text-destructive">{cellUploadError}</p>}

                  <div className="space-y-2">
                    <button type="button" onClick={() => setCells((prev) => ["", ...prev])} className="w-full border border-dashed border-border/50 py-1.5 text-xs text-muted-foreground/60 transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-primary">
                      + cell
                    </button>

                    {cells.map((cell, i) => (
                      <div key={i} className="group relative border border-border bg-background transition-colors focus-within:border-primary/60">
                        <div className="flex items-center justify-between px-2 pb-0 pt-1.5">
                          <span className="select-none font-mono text-[10px] text-muted-foreground/50">[{i + 1}]</span>
                          <div className="flex items-center gap-2">
                            <button type="button" title="Upload image" onClick={() => handleCellImageUpload(i)} disabled={uploadingCell !== null}
                              className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 opacity-0 transition-colors hover:text-primary disabled:opacity-30 group-hover:opacity-100">
                              {uploadingCell === i ? "Uploading…" : "Image"}
                            </button>
                            {cells.length > 1 && (
                              <button type="button" onClick={() => setCells((prev) => prev.filter((_, idx) => idx !== i))}
                                className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 opacity-0 transition-colors hover:text-destructive group-hover:opacity-100" title="Remove cell">
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea
                          className="min-h-[80px] w-full resize-none bg-transparent px-3 py-2 font-mono text-sm leading-relaxed outline-none"
                          rows={Math.max(3, cell.split("\n").length + 1)}
                          value={cell}
                          onChange={(e) => setCells((prev) => prev.map((c, idx) => (idx === i ? e.target.value : c)))}
                          placeholder={i === 0 ? "# Start writing…" : "Continue…"}
                          spellCheck={false}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.shiftKey) {
                              e.preventDefault()
                              setCells((prev) => [...prev.slice(0, i + 1), "", ...prev.slice(i + 1)])
                            }
                          }}
                        />
                        {cell.trim() && (
                          <div className="prose prose-sm max-w-none border-t border-border/60 px-3 py-3 text-sm dark:prose-invert">
                            <BlogMarkdown markdown={cell} snippetsBySlug={snippetsBySlug} />
                          </div>
                        )}
                      </div>
                    ))}

                    <button type="button" onClick={() => setCells((prev) => [...prev, ""])} className="w-full border border-dashed border-border/50 py-1.5 text-xs text-muted-foreground/60 transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-primary">
                      + cell
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <button type="button" onClick={savePost} disabled={isPending} className={btnPrimary}>{isPending ? "Saving…" : "Save post"}</button>
                  <button type="button" onClick={() => setShowPreview(true)} disabled={!content} className={btn}><Eye className="h-3.5 w-3.5" /> Preview</button>
                  {postId && (
                    <button type="button" onClick={deletePost} disabled={isPending} className={cn(btnDanger, "ml-auto")}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  )}
                </div>
              </div>
            )
          )}

          {/* ── Series ── */}
          {section === "series" && (
            <div className="space-y-4">
              <div className="mb-1 flex items-end justify-between border-b border-border pb-4">
                <div>
                  <span className={cn(eyebrow, "mb-2 block")}>Series</span>
                  <h2 className="font-serif text-2xl tracking-tight md:text-3xl">{seriesId ? "Edit series" : "New series"}</h2>
                </div>
                <button type="button" onClick={() => loadSeries("")} className={btn}><Plus className="h-3.5 w-3.5" /> New</button>
              </div>

              {series.length > 0 && (
                <div>
                  <p className={cn(eyebrow, "mb-2")}>Existing series</p>
                  <div className="divide-y divide-border border border-border">
                    {series.map((s) => (
                      <button key={s.id} type="button" onClick={() => loadSeries(s.id)}
                        className={cn("flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/40", seriesId === s.id && "bg-muted/60 font-medium")}>
                        <span>{s.title}</span>
                        <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">{s.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input className={input} placeholder="Series title" value={seriesTitle} onChange={(e) => setSeriesTitle(e.target.value)} />
              <input className={monoInput} placeholder="series-slug" value={seriesSlug} onChange={(e) => setSeriesSlug(e.target.value)} />
              <textarea className={cn(input, "resize-y")} rows={3} placeholder="Description" value={seriesDescription} onChange={(e) => setSeriesDescription(e.target.value)} />
              <input className={input} placeholder="Type (course, book, webnovel, general…)" value={seriesType} onChange={(e) => setSeriesType(e.target.value)} />

              <div>
                <p className={cn(eyebrow, "mb-1.5")}>Parent series</p>
                <SeriesTreePicker allSeries={series} value={seriesParentId} onChange={setSeriesParentId} excludeId={seriesId || undefined} />
              </div>

              <input className={input} placeholder="Theme class (optional, e.g. theme-arc)" value={seriesThemeClass} onChange={(e) => setSeriesThemeClass(e.target.value)} />
              <input className={input} placeholder="Number format (optional) — e.g. Project {n}, Chapter {roman}" value={seriesNumberFormat} onChange={(e) => setSeriesNumberFormat(e.target.value)} />

              <div className="flex items-center gap-3 border-t border-border pt-4">
                <button type="button" onClick={saveSeries} disabled={isPending} className={btnPrimary}>{isPending ? "Saving…" : "Save series"}</button>
                {seriesId && <button type="button" onClick={deleteSeries} disabled={isPending} className={cn(btnDanger, "ml-auto")}><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
              </div>
            </div>
          )}

          {/* ── Snippets ── */}
          {section === "snippets" && (
            <div className="space-y-4">
              <div className="mb-1 flex items-end justify-between border-b border-border pb-4">
                <div>
                  <span className={cn(eyebrow, "mb-2 block")}>Snippets</span>
                  <h2 className="font-serif text-2xl tracking-tight md:text-3xl">{snippetId ? "Edit snippet" : "New snippet"}</h2>
                </div>
                <button type="button" onClick={() => loadSnippet("")} className={btn}><Plus className="h-3.5 w-3.5" /> New</button>
              </div>

              <select className={input} value={snippetId} onChange={(e) => loadSnippet(e.target.value)}>
                <option value="">— New snippet —</option>
                {snippets.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.slug})</option>)}
              </select>

              <input className={input} placeholder="Snippet title" value={snippetTitle} onChange={(e) => setSnippetTitle(e.target.value)} />
              <input className={monoInput} placeholder="snippet-slug" value={snippetSlug} onChange={(e) => setSnippetSlug(e.target.value)} />
              <input className={input} placeholder="Description (optional)" value={snippetDescription} onChange={(e) => setSnippetDescription(e.target.value)} />

              {/* Template generator */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={eyebrow}>Template</span>
                <select className={input} value={snippetTemplate} onChange={(e) => setSnippetTemplate(e.target.value)}>
                  <option value="regular">Regular</option>
                  <option value="multi-tab">Multi-tab</option>
                  <option value="full-bleed">Full-bleed canvas</option>
                </select>
                <button type="button" onClick={applyTemplate} className={btn}>Use template</button>
              </div>

              {/* Code editor tabs */}
              <div>
                <div className="flex border-b border-border">
                  {(["html", "css", "js"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setCodeTab(t)}
                      className={cn("-mb-px border-b-2 px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors",
                        codeTab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                      {t}
                    </button>
                  ))}
                </div>
                {codeTab === "html" && <textarea className={cn(monoInput, "mt-2 resize-y text-xs leading-relaxed")} rows={18} value={snippetHtml} onChange={(e) => setSnippetHtml(e.target.value)} spellCheck={false} />}
                {codeTab === "css" && <textarea className={cn(monoInput, "mt-2 resize-y text-xs leading-relaxed")} rows={18} value={snippetCss} onChange={(e) => setSnippetCss(e.target.value)} spellCheck={false} />}
                {codeTab === "js" && <textarea className={cn(monoInput, "mt-2 resize-y text-xs leading-relaxed")} rows={18} value={snippetJs} onChange={(e) => setSnippetJs(e.target.value)} spellCheck={false} />}
              </div>

              <div className="flex items-center gap-3 border-t border-border pt-4">
                <button type="button" onClick={saveSnippet} disabled={isPending} className={btnPrimary}>{isPending ? "Saving…" : "Save snippet"}</button>
                {snippetId && <button type="button" onClick={deleteSnippet} disabled={isPending} className={cn(btnDanger, "ml-auto")}><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
              </div>
            </div>
          )}

          {/* ── Comments moderation ── */}
          {section === "comments" && (
            <div className="space-y-4">
              <div className="mb-1 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className={cn(eyebrow, "mb-2 block")}>Moderation</span>
                  <h2 className="font-serif text-2xl tracking-tight md:text-3xl">Comments</h2>
                </div>
                <span className={eyebrow}>{comments.length} total · {hiddenCount} hidden</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["all", "visible", "hidden"] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setCommentFilter(f)}
                    className={cn("border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] transition-colors",
                      commentFilter === f ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                    {f}
                  </button>
                ))}
                <input className={cn(input, "ml-auto max-w-xs")} placeholder="Search comments…" value={commentQuery} onChange={(e) => setCommentQuery(e.target.value)} />
              </div>

              {filteredComments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No comments match.</p>
              ) : (
                <ul className="divide-y divide-border border border-border">
                  {filteredComments.map((c) => (
                    <li key={c.id} className={cn("p-4", c.hidden && "bg-muted/20")}>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{c.authorName}</span>
                        <span className="text-muted-foreground/60">@{c.authorUsername}</span>
                        <span>·</span>
                        <span>{fmtDate(c.createdAt)}</span>
                        {c.hidden && <span className="border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]">hidden</span>}
                        <Link href={`/blog/${c.postSlug}#comment-${c.id}`} className="ml-auto inline-flex items-center gap-1 font-mono uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary">
                          {c.postTitle} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground/90">{c.content}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {c.hidden ? (
                          <button type="button" onClick={() => setCommentHidden(c.id, false)} disabled={modBusy === c.id} className={cn(btn, "px-3 py-1.5")}>
                            <Eye className="h-3.5 w-3.5" /> Unhide
                          </button>
                        ) : (
                          <button type="button" onClick={() => setCommentHidden(c.id, true)} disabled={modBusy === c.id} className={cn(btn, "px-3 py-1.5")}>
                            <EyeOff className="h-3.5 w-3.5" /> Hide
                          </button>
                        )}
                        <button type="button" onClick={() => hardDeleteComment(c.id)} disabled={modBusy === c.id} className={cn(btnDanger, "px-3 py-1.5")}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Users ── */}
          {section === "users" && (
            <div className="space-y-4">
              <div className="mb-1 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className={cn(eyebrow, "mb-2 block")}>Moderation</span>
                  <h2 className="font-serif text-2xl tracking-tight md:text-3xl">Users</h2>
                </div>
                <input className={cn(input, "max-w-xs")} placeholder="Search users…" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
              </div>

              {filteredUsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No users match.</p>
              ) : (
                <ul className="divide-y divide-border border border-border">
                  {filteredUsers.map((u) => (
                    <li key={u.id} className="flex flex-wrap items-center gap-3 p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground">
                        {(u.displayName ?? u.username).charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium">
                          {u.displayName ?? u.username}
                          {u.role === "admin" && <span className="inline-flex items-center gap-1 border border-primary/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary"><ShieldCheck className="h-3 w-3" /> admin</span>}
                          {u.blocked && <span className="border border-destructive/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-destructive">blocked</span>}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">@{u.username} · {u.email}</p>
                      </div>
                      <div className="ml-auto">
                        {u.role === "admin" ? (
                          <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground/60">—</span>
                        ) : u.blocked ? (
                          <button type="button" onClick={() => setUserBlocked(u.id, false)} disabled={modBusy === u.id} className={cn(btn, "px-3 py-1.5")}>
                            <ShieldCheck className="h-3.5 w-3.5" /> Unblock
                          </button>
                        ) : (
                          <button type="button" onClick={() => setUserBlocked(u.id, true)} disabled={modBusy === u.id} className={cn(btnDanger, "px-3 py-1.5")}>
                            <Ban className="h-3.5 w-3.5" /> Block
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
