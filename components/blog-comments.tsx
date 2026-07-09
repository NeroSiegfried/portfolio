"use client"

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Pencil, Trash2, ThumbsDown, ThumbsUp, EyeOff, UserRound, ImageIcon, BellOff, Bell, X, ZoomIn, ZoomOut, Check, ArrowUpDown } from "lucide-react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Textarea } from "@/components/ui/textarea"
import type { CommentNode, PublicUser } from "@/lib/blog/types"
import { sortCommentTree, type CommentSortOrder } from "@/lib/blog/sort"
import { compressImage } from "@/lib/compress-image"

// ─── Avatar helper ─────────────────────────────────────────────────────────────

function avatarColor(id: string): string {
  const colors = [
    "bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-violet-500",
    "bg-pink-500", "bg-cyan-500", "bg-amber-500", "bg-rose-500",
    "bg-indigo-500", "bg-teal-500",
  ]
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return colors[Math.abs(h) % colors.length]
}

function CommentAvatar({
  userId,
  displayName,
  username,
  avatarUrl,
  size = "sm",
}: {
  userId: string
  displayName: string | null
  username: string
  avatarUrl: string | null
  size?: "sm" | "md"
}) {
  const label = displayName ?? username
  const initial = label.charAt(0).toUpperCase()
  const colorClass = avatarColor(userId)
  const sizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-sm"

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={label}
        className={`${sizeClass} rounded-full object-cover shrink-0 ring-1 ring-border/40`}
      />
    )
  }
  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
    >
      {initial}
    </div>
  )
}

const EDIT_WINDOW_MS = 15 * 60 * 1000

interface BlogCommentsProps {
  postId: string
  comments: CommentNode[]
  currentUser: PublicUser | null
  mutedCommentIds?: string[]
  onRefresh: () => Promise<void>
  onUserChange?: (user: PublicUser | null) => void
}

// ─── Image upload helper ─────────────────────────────────────────────────────
// All uploads go browser → S3 directly via presigned PUT (no Vercel body limit).
// File bytes never touch the Next.js server; size + type are validated here
// (magic bytes) and on the server (size + declared type) before the URL is issued.

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/jpg":  [0xff, 0xd8, 0xff],
  "image/png":  [0x89, 0x50, 0x4e, 0x47],
  "image/gif":  [0x47, 0x49, 0x46, 0x38],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
}

async function checkMagicBytes(file: File): Promise<boolean> {
  const sig = MAGIC_BYTES[file.type]
  if (!sig) return false
  const buf = await file.slice(0, sig.length).arrayBuffer()
  const bytes = new Uint8Array(buf)
  return sig.every((b, i) => bytes[i] === b)
}

async function uploadImagePresigned(
  file: File,
  purpose: "avatar" | "comment"
): Promise<string> {
  const compressed = await compressImage(file, {
    maxWidth:       purpose === "avatar" ? 400  : 1200,
    maxHeight:      purpose === "avatar" ? 400  : 1200,
    quality:        purpose === "avatar" ? 0.88 : 0.82,
    skipBelowBytes: purpose === "avatar" ? 100 * 1024 : 300 * 1024,
  })

  // Validate magic bytes on the (possibly re-encoded) result
  if (!(await checkMagicBytes(compressed))) {
    throw new Error("File content does not match its declared type.")
  }

  // Ask the server for a presigned PUT URL (tiny JSON request — no file bytes)
  const res = await fetch("/api/upload", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ purpose, contentType: compressed.type, size: compressed.size }),
  })
  if (!res.ok) {
    let msg = "Upload failed."
    try { const e = (await res.json()) as { error?: string }; if (e.error) msg = e.error } catch {}
    throw new Error(msg)
  }
  const { uploadUrl, cfUrl } = (await res.json()) as { uploadUrl?: string; cfUrl?: string }
  if (!uploadUrl || !cfUrl) throw new Error("Upload failed: incomplete server response.")

  // PUT the file directly to S3
  const put = await fetch(uploadUrl, {
    method:  "PUT",
    headers: { "Content-Type": compressed.type },
    body:    compressed,
  })
  if (!put.ok) throw new Error("Upload failed: could not store file.")

  return cfUrl
}

// ─── Pending-image state helpers ─────────────────────────────────────────────

interface PendingImage {
  id:         string
  url:        string | null   // null while uploading
  alt:        string
  uploading:  boolean
  error?:     string
}

function addFilesToPending(
  files: FileList | null,
  setPending: React.Dispatch<React.SetStateAction<PendingImage[]>>
) {
  if (!files?.length) return
  for (const file of Array.from(files)) {
    const id = Math.random().toString(36).slice(2)
    setPending((prev) => [...prev, { id, url: null, alt: "", uploading: true }])
    uploadImagePresigned(file, "comment")
      .then((url) =>
        setPending((prev) =>
          prev.map((img) => (img.id === id ? { ...img, url, uploading: false } : img))
        )
      )
      .catch((e: unknown) =>
        setPending((prev) =>
          prev.map((img) =>
            img.id === id
              ? { ...img, uploading: false, error: e instanceof Error ? e.message : "Upload failed." }
              : img
          )
        )
      )
  }
}

function buildContent(text: string, images: PendingImage[]): string {
  const ready = images.filter((i) => i.url && !i.uploading && !i.error)
  const imgMd = ready.map((i) => `![${i.alt || "image"}](${i.url})`).join("\n")
  return [text.trim(), imgMd].filter(Boolean).join("\n")
}

// ─── Image chips UI ──────────────────────────────────────────────────────────

function ImageChips({
  images,
  onSetAlt,
  onRemove,
  compact = false,
}: {
  images:   PendingImage[]
  onSetAlt: (id: string, alt: string) => void
  onRemove: (id: string) => void
  compact?: boolean
}) {
  if (!images.length) return null
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative flex items-start gap-2 border border-border/50 bg-muted/30 p-2"
        >
          {/* Thumbnail */}
          <div className="shrink-0">
            {img.uploading ? (
              <div className={`${compact ? "h-12 w-12" : "h-16 w-16"} rounded-md bg-muted animate-pulse flex items-center justify-center`}>
                <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
              </div>
            ) : img.error ? (
              <div className={`${compact ? "h-12 w-12" : "h-16 w-16"} rounded-md bg-destructive/10 flex items-center justify-center p-1`}>
                <span className="text-[9px] text-destructive text-center leading-tight">{img.error}</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.url!}
                alt={img.alt || "Preview"}
                className={`${compact ? "h-12 w-12" : "h-16 w-16"} rounded-md object-cover`}
              />
            )}
          </div>

          {/* Alt text input */}
          {!img.error && (
            <textarea
              placeholder="Alt text (optional)"
              value={img.alt}
              onChange={(e) => onSetAlt(img.id, e.target.value)}
              disabled={img.uploading}
              rows={compact ? 2 : 3}
              className="flex-1 min-w-0 resize-none border border-border/40 bg-background px-2 py-1 text-[11px] outline-none focus:border-primary disabled:opacity-50"
            />
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(img.id)}
            aria-label="Remove image"
            className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Comment content renderer ─────────────────────────────────────────────────
// Memoized so ReactMarkdown (and the img elements inside it) only re-renders
// when the comment content itself changes — not when parent state (textarea
// text, pending images, etc.) updates on every keystroke.

const CommentContent = memo(function CommentContent({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none
      [&_p]:my-0.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0
      [&_img]:max-h-64 [&_img]:max-w-full [&_img]:rounded-md [&_img]:object-contain [&_img]:my-1
      [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
      [&_code]:text-xs [&_code]:bg-muted [&_code]:rounded [&_code]:px-1
      [&_pre]:bg-muted [&_pre]:rounded [&_pre]:p-2 [&_pre]:overflow-x-auto
      [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_h4]:text-sm [&_h5]:text-sm [&_h6]:text-sm"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          img: ({ src, alt }) =>
            src ? <img src={src} alt={alt ?? ""} className="max-h-64 max-w-full rounded-md object-contain my-1" /> : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})

// ─── Avatar crop modal ───────────────────────────────────────────────────────

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = imageSrc
  })
  const canvas = document.createElement("canvas")
  const size = Math.min(pixelCrop.width, pixelCrop.height)
  canvas.width  = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Canvas export failed")), "image/jpeg", 0.9)
  )
}

function AvatarCropModal({
  src,
  onConfirm,
  onCancel,
  busy,
}: {
  src: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
  busy: boolean
}) {
  const [crop, setCrop]     = useState({ x: 0, y: 0 })
  const [zoom, setZoom]     = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-background shadow-xl overflow-hidden">
        <div className="p-4 pb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Crop avatar</p>
          <button onClick={onCancel} disabled={busy} className="text-muted-foreground hover:text-foreground disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative h-72 bg-muted">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setCroppedArea(areaPixels)}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-2 px-4 py-3">
          <ZoomOut className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <ZoomIn className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/50 px-4 py-3">
          <button onClick={onCancel} disabled={busy}
            className="border border-border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!croppedArea) return
              const blob = await getCroppedBlob(src, croppedArea)
              onConfirm(blob)
            }}
            disabled={busy || !croppedArea}
            className="flex items-center gap-1.5 bg-primary px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-50"
          >
            <Check className="h-3 w-3" />
            {busy ? "Uploading…" : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  )
}

function CommentItem({
  node,
  postId,
  currentUser,
  mutedIds,
  onRefresh,
}: {
  node: CommentNode
  postId: string
  currentUser: PublicUser | null
  mutedIds: Set<string>
  onRefresh: () => Promise<void>
}) {
  const [reply, setReply] = useState("")
  const [showReply, setShowReply] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(node.content)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Edit box: still uses markdown-in-textarea approach (presigned upload)
  const [editUploadingImg, setEditUploadingImg] = useState(false)
  const editImgRef = useRef<HTMLInputElement>(null)

  // Reply box: chips UI
  const [replyPendingImages, setReplyPendingImages] = useState<PendingImage[]>([])
  const replyFileRef = useRef<HTMLInputElement>(null)

  // Mute state — seeded from server, toggled locally
  const [muted, setMuted] = useState(() => mutedIds.has(node.id))
  const [muteBusy, setMuteBusy] = useState(false)

  // Optimistic vote state — seeded from server
  const [userVote, setUserVote] = useState<1 | -1 | 0>(node.currentUserVote)
  const [score, setScore] = useState(node.score)

  const isOwner = currentUser?.id === node.userId
  const isAdmin = currentUser?.role === "admin"
  const canEdit =
    isOwner &&
    !node.hidden &&
    Date.now() - new Date(node.createdAt).getTime() < EDIT_WINDOW_MS
  const canDelete = isOwner || isAdmin

  const insertEditImage = async () => {
    const file = editImgRef.current?.files?.[0]
    if (!file) return
    if (editImgRef.current) editImgRef.current.value = ""
    setEditUploadingImg(true)
    setError(null)
    try {
      const url = await uploadImagePresigned(file, "comment")
      setEditContent((prev) => prev + (prev ? "\n" : "") + `![image](${url})`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed.")
    } finally {
      setEditUploadingImg(false)
    }
  }

  const toggleMute = async () => {
    if (muteBusy) return
    setMuteBusy(true)
    try {
      const res = await fetch(`/api/blog/comments/${node.id}/mute`, { method: "POST" })
      const d = (await res.json()) as { muted?: boolean }
      setMuted(d.muted ?? !muted)
    } finally {
      setMuteBusy(false)
    }
  }

  const sendReply = async () => {
    const fullContent = buildContent(reply, replyPendingImages)
    if (!fullContent || busy || replyPendingImages.some((i) => i.uploading)) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, parentId: node.id, content: fullContent }),
      })
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "Unable to reply.")
        return
      }
      setReply("")
      setReplyPendingImages([])
      setShowReply(false)
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  const vote = async (value: 1 | -1) => {
    if (!currentUser || busy) return
    const prevVote = userVote
    const prevScore = score
    const newVote = prevVote === value ? 0 : value
    const scoreDelta = newVote - prevVote
    setUserVote(newVote)
    setScore(prevScore + scoreDelta)

    const res = await fetch("/api/blog/comments/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: node.id, value }),
    })
    if (!res.ok) {
      setUserVote(prevVote)
      setScore(prevScore)
      setError(((await res.json()) as { error?: string }).error ?? "Unable to vote.")
      return
    }
    const data = (await res.json()) as { score?: number }
    if (typeof data.score === "number") setScore(data.score)
    setError(null)
    await onRefresh()
  }

  const saveEdit = async () => {
    if (!editContent.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/blog/comments/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "Unable to edit.")
        return
      }
      setEditing(false)
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  const deleteComment = async (hard = false) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const url = hard ? `/api/blog/comments/${node.id}?hard=1` : `/api/blog/comments/${node.id}`
      const res = await fetch(url, { method: "DELETE" })
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "Unable to delete.")
        return
      }
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  const unhide = async () => {
    await fetch(`/api/blog/comments/${node.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: false }),
    })
    await onRefresh()
  }

  // Hidden comments:
  // - Non-admins: show a greyed-out placeholder (not invisible)
  // - Admins: show actual content with opacity + moderation controls
  if (node.hidden && !isAdmin) {
    return (
      <div id={`comment-${node.id}`} className="py-4">
        <div className="flex items-center gap-2 border border-border/40 bg-muted/20 px-3 py-2.5">
          <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <span className="text-xs italic text-muted-foreground/50">This comment was hidden by a moderator.</span>
        </div>
        {node.children.length > 0 && (
          <div className="mt-3 border-l border-border/40 pl-4">
            {node.children.map((child) => (
              <CommentItem key={child.id} node={child} postId={postId} currentUser={currentUser} mutedIds={mutedIds} onRefresh={onRefresh} />
            ))}
          </div>
        )}
      </div>
    )
  }
  if (node.hidden && isAdmin) {
    return (
      <div id={`comment-${node.id}`} className="py-4">
        {/* Content shown at reduced opacity */}
        <div className="opacity-40">
          <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <CommentAvatar userId={node.userId} displayName={node.displayName} username={node.username} avatarUrl={node.avatarUrl} size="sm" />
            <span className="font-semibold text-foreground/70">{node.displayName ?? node.username}</span>
            {node.displayName && <span className="text-muted-foreground/50">@{node.username}</span>}
            <span>·</span>
            <span>{new Date(node.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <CommentContent content={node.content} />
        </div>
        {/* Admin controls */}
        <div className="mt-2 flex items-center gap-2">
          <span className="border border-border/40 bg-muted/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">hidden</span>
          <button type="button" onClick={unhide} disabled={busy} className="text-xs text-primary hover:underline disabled:opacity-40">Unhide</button>
          <button type="button" onClick={() => deleteComment(true)} disabled={busy} className="text-xs text-destructive hover:underline disabled:opacity-40">Hard delete</button>
        </div>
        {node.children.length > 0 && (
          <div className="mt-3 border-l border-border/40 pl-4">
            {node.children.map((child) => (
              <CommentItem key={child.id} node={child} postId={postId} currentUser={currentUser} mutedIds={mutedIds} onRefresh={onRefresh} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div id={`comment-${node.id}`} className="py-4">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <CommentAvatar userId={node.userId} displayName={node.displayName} username={node.username} avatarUrl={node.avatarUrl} size="sm" />
        <span className="font-semibold text-foreground/70">{node.displayName ?? node.username}</span>
        {node.displayName && <span className="text-muted-foreground/50">@{node.username}</span>}
        <span>·</span>
        <span>
          {new Date(node.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        {node.editedAt && <span className="bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]">edited</span>}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} disabled={busy || editUploadingImg} className="rounded-none text-sm" rows={3} />
          {/* Hidden file input for edit image upload */}
          <input ref={editImgRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
            onChange={() => void insertEditImage()} />
          <div className="flex items-center gap-2">
            <button type="button" onClick={saveEdit} disabled={busy || editUploadingImg} className="bg-primary px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => editImgRef.current?.click()} disabled={editUploadingImg}
              className="border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-40" title="Attach image">
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
            {editUploadingImg && <span className="text-xs text-muted-foreground animate-pulse">Uploading…</span>}
            <button type="button" onClick={() => { setEditing(false); setEditContent(node.content) }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      ) : (
        <CommentContent content={node.content} />
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => vote(1)} disabled={!currentUser || busy}
          className={["flex items-center gap-1 text-xs transition-colors disabled:opacity-40", userVote === 1 ? "text-secondary" : "text-muted-foreground hover:text-secondary"].join(" ")}>
          <ThumbsUp className="h-3 w-3" />
        </button>
        <span className={`text-xs tabular-nums ${score > 0 ? "text-destructive" : score < 0 ? "text-primary" : "text-muted-foreground"}`}>{score}</span>
        <button type="button" onClick={() => vote(-1)} disabled={!currentUser || busy}
          className={["flex items-center gap-1 text-xs transition-colors disabled:opacity-40", userVote === -1 ? "text-primary" : "text-muted-foreground hover:text-primary"].join(" ")}>
          <ThumbsDown className="h-3 w-3" />
        </button>

        {currentUser && (
          <button type="button" onClick={() => setShowReply((v) => !v)}
            className="ml-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            Reply
          </button>
        )}

        {canEdit && !editing && (
          <button type="button" onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}

        {canDelete && (
          <button type="button" onClick={() => (isAdmin ? deleteComment(false) : deleteComment())} disabled={busy}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40">
            <EyeOff className="h-3 w-3" /> {isAdmin ? "Hide" : "Delete"}
          </button>
        )}

        {isAdmin && (
          <button type="button" onClick={() => deleteComment(true)} disabled={busy}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40">
            <Trash2 className="h-3 w-3" /> Hard delete
          </button>
        )}

        {currentUser && (
          <button type="button" onClick={toggleMute} disabled={muteBusy}
            title={muted ? "Unmute thread — you'll receive notifications again" : "Mute thread — stop notifications for this comment and replies"}
            className={[
              "flex items-center gap-1 text-xs transition-colors disabled:opacity-40",
              muted ? "text-primary hover:text-muted-foreground" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}>
            {muted ? <><BellOff className="h-3 w-3" /> Muted</> : <><Bell className="h-3 w-3" /> Mute</>}
          </button>
        )}
      </div>

      {showReply && currentUser && (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Write a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={busy}
            className="rounded-none text-sm"
            rows={2}
          />
          <ImageChips
            images={replyPendingImages}
            compact
            onSetAlt={(id, alt) =>
              setReplyPendingImages((prev) =>
                prev.map((img) => (img.id === id ? { ...img, alt } : img))
              )
            }
            onRemove={(id) =>
              setReplyPendingImages((prev) => prev.filter((img) => img.id !== id))
            }
          />
          {/* Hidden file input for reply images */}
          <input
            ref={replyFileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              addFilesToPending(e.target.files, setReplyPendingImages)
              if (replyFileRef.current) replyFileRef.current.value = ""
            }}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={sendReply}
              disabled={busy || replyPendingImages.some((i) => i.uploading) || !buildContent(reply, replyPendingImages)}
              className={`px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.12em] transition-all ${
                busy || replyPendingImages.some((i) => i.uploading) || !buildContent(reply, replyPendingImages)
                  ? "cursor-not-allowed border border-primary bg-transparent text-primary"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {busy ? "Posting…" : "Post Reply"}
            </button>
            <button
              type="button"
              onClick={() => replyFileRef.current?.click()}
              className="border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              title="Attach image or GIF"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => { setShowReply(false); setReplyPendingImages([]) }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}

      {node.children.length > 0 && (
        <div className="mt-3 space-y-0 border-l border-border/40 pl-4">
          {node.children.map((child) => (
            <CommentItem key={child.id} node={child} postId={postId} currentUser={currentUser} mutedIds={mutedIds} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BlogComments({
  postId,
  comments,
  currentUser,
  mutedCommentIds = [],
  onRefresh,
  onUserChange,
}: BlogCommentsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const authError = searchParams.get("auth_error")
  const returnTo = `${pathname}#comments`

  const mutedSet = useMemo(() => new Set(mutedCommentIds), [mutedCommentIds])

  const [content, setContent] = useState("")
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Profile editing state
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState(currentUser?.displayName ?? "")
  const [editUsername, setEditUsername] = useState(currentUser?.username ?? "")
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl ?? "")
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  // Main comment box: chips UI
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const mainFileRef = useRef<HTMLInputElement>(null)

  // Avatar upload: pick file → crop modal → upload cropped blob
  const avatarFileRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading]     = useState(false)
  const [avatarCropSrc,   setAvatarCropSrc]       = useState<string | null>(null)

  const openCropModal = (file: File) => {
    const url = URL.createObjectURL(file)
    setAvatarCropSrc(url)
  }

  const handleCropConfirm = async (blob: Blob) => {
    setAvatarUploading(true)
    setProfileError(null)
    try {
      const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" })
      const url = await uploadImagePresigned(croppedFile, "avatar")
      setEditAvatarUrl(url)
      if (avatarCropSrc) URL.revokeObjectURL(avatarCropSrc)
      setAvatarCropSrc(null)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Avatar upload failed.")
    } finally {
      setAvatarUploading(false)
    }
  }

  const [sortOrder, setSortOrder] = useState<CommentSortOrder>("top")

  const hasComments = useMemo(() => comments.length > 0, [comments])

  const sortedComments = useMemo(
    () => sortCommentTree(comments, sortOrder),
    [comments, sortOrder]
  )

  const submitComment = async () => {
    const fullContent = buildContent(content, pendingImages)
    if (!fullContent || busy || pendingImages.some((i) => i.uploading)) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: fullContent }),
      })
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "Unable to comment.")
        return
      }
      setContent("")
      setPendingImages([])
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  const submitAuth = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = authMode === "login" ? { email, password } : { username, email, password }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "Authentication failed.")
        return
      }
      // Fetch updated user and comments immediately
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  const saveProfile = async () => {
    if (profileBusy) return
    setProfileBusy(true)
    setProfileError(null)
    setProfileSaved(false)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editDisplayName.trim() || null,
          username: editUsername.trim() || undefined,
          avatarUrl: editAvatarUrl.trim() || null,
        }),
      })
      if (!res.ok) {
        setProfileError(((await res.json()) as { error?: string }).error ?? "Unable to save profile.")
        return
      }
      setProfileSaved(true)
      await onRefresh()
      setTimeout(() => setProfileSaved(false), 3000)
    } finally {
      setProfileBusy(false)
    }
  }

  const logout = async () => {
    if (busy) return
    setBusy(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      onUserChange?.(null)
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="comments">
      <div className="mb-7 border-b border-border pb-4">
        <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Discussion</span>
        <h2 className="font-serif text-2xl leading-tight tracking-tight text-foreground md:text-3xl">Join the conversation</h2>
      </div>

      {!currentUser ? (
        <div className="mb-8 border border-border bg-card/30 p-5 md:p-6">
          {authError && (
            <div className="mb-4 border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {authError === "github" && "GitHub login failed. Make sure GitHub OAuth is configured and try again."}
              {authError === "google" && "Google login failed. Make sure Google OAuth is configured and try again."}
              {authError !== "github" && authError !== "google" && "Login failed. Please try again."}
            </div>
          )}

          {/* Tab switcher */}
          <div className="mb-5 flex border-b border-border/40">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`-mb-px px-4 py-2.5 text-sm font-medium transition-colors ${
                authMode === "login"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              className={`-mb-px px-4 py-2.5 text-sm font-medium transition-colors ${
                authMode === "register"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <div className="flex flex-col gap-2.5 sm:max-w-sm">
            <p className="mb-1 text-sm text-muted-foreground">
              {authMode === "login" ? "Sign in to leave a comment." : "Create a free account to comment."}
            </p>

            {/* OAuth buttons */}
            <a
              href={`/api/auth/oauth/github?returnTo=${encodeURIComponent(returnTo)}`}
              className="flex items-center justify-center gap-2.5 border border-border bg-card px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] transition-colors hover:border-primary hover:bg-muted/40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-foreground" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </a>
            <a
              href={`/api/auth/oauth/google?returnTo=${encodeURIComponent(returnTo)}`}
              className="flex items-center justify-center gap-2.5 border border-border bg-card px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] transition-colors hover:border-primary hover:bg-muted/40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            {authMode === "register" && (
              <input
                className="border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={busy}
              />
            )}
            <input
              className="border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <input
              className="border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void submitAuth() }}
              disabled={busy}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="button"
              onClick={submitAuth}
              disabled={busy}
              className="mt-1 bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8 border border-border bg-card/30 p-5 md:p-6">
          {/* ── Profile card ───────────────────────────────────── */}
          <div className="mb-4 flex items-center gap-3">
            <CommentAvatar
              userId={currentUser.id}
              displayName={currentUser.displayName}
              username={currentUser.username}
              avatarUrl={currentUser.avatarUrl}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate">
                {currentUser.displayName ?? currentUser.username}
              </p>
              {currentUser.displayName && (
                <p className="text-xs text-muted-foreground leading-tight">@{currentUser.username}</p>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditDisplayName(currentUser.displayName ?? "")
                  setEditAvatarUrl(currentUser.avatarUrl ?? "")
                  setEditUsername(currentUser.username ?? "")
                  setProfileError(null)
                  setProfileSaved(false)
                  setShowEditProfile((v) => !v)
                }}
                className={`text-muted-foreground transition-colors ${showEditProfile ? "hover:text-destructive" : "hover:text-primary"}`}
              >
                {showEditProfile ? "Close" : "Edit profile"}
              </button>
              <span className="text-border">·</span>
              <button
                type="button"
                onClick={logout}
                disabled={busy}
                className="text-destructive/50 transition-colors hover:text-destructive disabled:opacity-50"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* ── Inline profile editor ──────────────────────────── */}
          {showEditProfile && (
            <div className="mb-5 border border-border bg-muted/20 p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Handle
                </label>
                <div className="flex items-center gap-1 border border-border bg-background px-3 py-2.5 focus-within:border-primary transition-colors">
                  <span className="text-xs text-muted-foreground select-none">@</span>
                  <input
                    className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                    placeholder={currentUser.username}
                    maxLength={30}
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase())}
                    disabled={profileBusy}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/60">Lowercase letters, numbers, _ and - only. Must be unique.</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Display name
                </label>
                <input
                  className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                  placeholder={currentUser.username}
                  maxLength={60}
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  disabled={profileBusy}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Avatar
                </label>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                    placeholder="https://example.com/avatar.jpg"
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    disabled={profileBusy || avatarUploading}
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={profileBusy || avatarUploading}
                    title="Upload image"
                    className="shrink-0 border border-border p-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-40"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                </div>
                {/* Hidden file input for avatar — opens the crop modal */}
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) openCropModal(f)
                    if (avatarFileRef.current) avatarFileRef.current.value = ""
                  }}
                />
                {avatarUploading && (
                  <p className="text-[11px] text-muted-foreground animate-pulse">Uploading…</p>
                )}
                {/* Crop modal */}
                {avatarCropSrc && (
                  <AvatarCropModal
                    src={avatarCropSrc}
                    onConfirm={handleCropConfirm}
                    onCancel={() => {
                      URL.revokeObjectURL(avatarCropSrc)
                      setAvatarCropSrc(null)
                    }}
                    busy={avatarUploading}
                  />
                )}
                <p className="text-[11px] text-muted-foreground/60">
                  Upload or paste a direct link. Leave blank to use your initials.
                </p>
              </div>
              {profileError && <p className="text-xs text-destructive">{profileError}</p>}
              {profileSaved && <p className="text-xs text-emerald-500">Changes saved.</p>}
              <button
                type="button"
                onClick={saveProfile}
                disabled={profileBusy}
                className="bg-primary px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {profileBusy ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
          <Textarea
            placeholder="Write a comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submitComment()
            }}
            disabled={busy}
            className="rounded-none text-sm"
            rows={3}
          />
          <ImageChips
            images={pendingImages}
            onSetAlt={(id, alt) =>
              setPendingImages((prev) =>
                prev.map((img) => (img.id === id ? { ...img, alt } : img))
              )
            }
            onRemove={(id) =>
              setPendingImages((prev) => prev.filter((img) => img.id !== id))
            }
          />
          {/* Hidden file input for comment images */}
          <input
            ref={mainFileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              addFilesToPending(e.target.files, setPendingImages)
              if (mainFileRef.current) mainFileRef.current.value = ""
            }}
          />
          {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={submitComment}
              disabled={busy || pendingImages.some((i) => i.uploading) || !buildContent(content, pendingImages)}
              className={`px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] transition-all ${
                busy || pendingImages.some((i) => i.uploading) || !buildContent(content, pendingImages)
                  ? "cursor-not-allowed border border-primary bg-transparent text-primary"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {busy ? "Posting…" : "Post Comment"}
            </button>
            <button
              type="button"
              onClick={() => mainFileRef.current?.click()}
              title="Attach image or GIF"
              className="border border-border p-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {hasComments ? (
        <div>
          {/* Sort control */}
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <ArrowUpDown className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            {(["top", "newest", "oldest"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setSortOrder(o)}
                className={`border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] transition-colors ${
                  sortOrder === o
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary"
                }`}
              >
                {o === "top" ? "Top" : o === "newest" ? "Newest" : "Oldest"}
              </button>
            ))}
          </div>
          <div className="divide-y divide-border/60">
            {sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                node={comment}
                postId={postId}
                currentUser={currentUser}
                mutedIds={mutedSet}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet — be the first to drop one!</p>
      )}
    </section>
  )
}
