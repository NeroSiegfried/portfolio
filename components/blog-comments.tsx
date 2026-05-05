"use client"

import { useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Pencil, Trash2, ThumbsDown, ThumbsUp, EyeOff, UserRound } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { CommentNode, PublicUser } from "@/lib/blog/types"

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
  onRefresh: () => Promise<void>
  onUserChange?: (user: PublicUser | null) => void
}

function CommentItem({
  node,
  postId,
  currentUser,
  onRefresh,
}: {
  node: CommentNode
  postId: string
  currentUser: PublicUser | null
  onRefresh: () => Promise<void>
}) {
  const [reply, setReply] = useState("")
  const [showReply, setShowReply] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(node.content)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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

  const sendReply = async () => {
    if (!reply.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, parentId: node.id, content: reply }),
      })
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "Unable to reply.")
        return
      }
      setReply("")
      setShowReply(false)
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  const vote = async (value: 1 | -1) => {
    if (!currentUser || busy) return
    // Optimistic update
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
      // Revert on error
      setUserVote(prevVote)
      setScore(prevScore)
      setError(((await res.json()) as { error?: string }).error ?? "Unable to vote.")
      return
    }
    // Optionally sync server score
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

  // Hidden: placeholder for admins, nothing for regular users
  if (node.hidden && !isAdmin) return null
  if (node.hidden && isAdmin) {
    return (
      <div className="py-4 opacity-50">
        <p className="text-xs text-muted-foreground italic">[Comment hidden by moderator]</p>
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={unhide}
            disabled={busy}
            className="text-xs text-primary hover:underline disabled:opacity-40"
          >
            Unhide
          </button>
          <button
            type="button"
            onClick={() => deleteComment(true)}
            disabled={busy}
            className="text-xs text-destructive hover:underline disabled:opacity-40"
          >
            Hard delete
          </button>
        </div>
        {node.children.length > 0 && (
          <div className="mt-3 border-l border-border/40 pl-4">
            {node.children.map((child) => (
              <CommentItem
                key={child.id}
                node={child}
                postId={postId}
                currentUser={currentUser}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <CommentAvatar
          userId={node.userId}
          displayName={node.displayName}
          username={node.username}
          avatarUrl={node.avatarUrl}
          size="sm"
        />
        <span className="font-semibold text-foreground/70">{node.displayName ?? node.username}</span>
        {node.displayName && (
          <span className="text-muted-foreground/50">@{node.username}</span>
        )}
        <span>·</span>
        <span>
          {new Date(node.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        {node.editedAt && (
          <span className="rounded bg-muted px-1 py-0.5 text-[10px]">edited</span>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={busy}
            className="text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              disabled={busy}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setEditContent(node.content)
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{node.content}</p>
      )}

      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => vote(1)}
          disabled={!currentUser || busy}
          className={[
            "flex items-center gap-1 text-xs transition-colors disabled:opacity-40",
            userVote === 1 ? "text-secondary" : "text-muted-foreground hover:text-secondary",
          ].join(" ")}
        >
          <ThumbsUp className="h-3 w-3" />
        </button>
        <span className="text-xs tabular-nums text-muted-foreground">{score}</span>
        <button
          type="button"
          onClick={() => vote(-1)}
          disabled={!currentUser || busy}
          className={[
            "flex items-center gap-1 text-xs transition-colors disabled:opacity-40",
            userVote === -1 ? "text-primary" : "text-muted-foreground hover:text-primary",
          ].join(" ")}
        >
          <ThumbsDown className="h-3 w-3" />
        </button>

        {currentUser && (
          <button
            type="button"
            onClick={() => setShowReply((v) => !v)}
            className="ml-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Reply
          </button>
        )}

        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => (isAdmin ? deleteComment(false) : deleteComment())}
            disabled={busy}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
          >
            <EyeOff className="h-3 w-3" />
            {isAdmin ? "Hide" : "Delete"}
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => deleteComment(true)}
            disabled={busy}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" />
            Hard delete
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
            className="text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={sendReply}
              disabled={busy || !reply.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Posting…" : "Post Reply"}
            </button>
            <button
              type="button"
              onClick={() => setShowReply(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}

      {node.children.length > 0 && (
        <div className="mt-3 space-y-0 border-l border-border/40 pl-4">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              postId={postId}
              currentUser={currentUser}
              onRefresh={onRefresh}
            />
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
  onRefresh,
  onUserChange,
}: BlogCommentsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const authError = searchParams.get("auth_error")
  const returnTo = `${pathname}#comments`

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
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl ?? "")
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  const hasComments = useMemo(() => comments.length > 0, [comments])

  const submitComment = async () => {
    if (!content.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      })
      if (!res.ok) {
        setError(((await res.json()) as { error?: string }).error ?? "Unable to comment.")
        return
      }
      setContent("")
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
      <h2 className="mb-6 text-xl font-bold tracking-tight">Discussion</h2>

      {!currentUser ? (
        <div className="mb-8">
          {authError && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
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
              className="flex items-center justify-center gap-2.5 rounded-md border border-border/60 bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-foreground" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </a>
            <a
              href={`/api/auth/oauth/google?returnTo=${encodeURIComponent(returnTo)}`}
              className="flex items-center justify-center gap-2.5 rounded-md border border-border/60 bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-muted"
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
                className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={busy}
              />
            )}
            <input
              className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <input
              className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
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
              className="mt-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8">
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
                  setProfileError(null)
                  setProfileSaved(false)
                  setShowEditProfile((v) => !v)
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {showEditProfile ? "Close" : "Edit profile"}
              </button>
              <span className="text-border">·</span>
              <button
                type="button"
                onClick={logout}
                disabled={busy}
                className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* ── Inline profile editor ──────────────────────────── */}
          {showEditProfile && (
            <div className="mb-5 rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Display name
                </label>
                <input
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                  placeholder={currentUser.username}
                  maxLength={60}
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  disabled={profileBusy}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Avatar URL
                </label>
                <input
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  disabled={profileBusy}
                />
                <p className="text-[11px] text-muted-foreground/60">
                  Direct link to a square image. Leave blank to use your initials.
                </p>
              </div>
              {profileError && <p className="text-xs text-destructive">{profileError}</p>}
              {profileSaved && <p className="text-xs text-emerald-500">Changes saved.</p>}
              <button
                type="button"
                onClick={saveProfile}
                disabled={profileBusy}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
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
            className="text-sm"
            rows={3}
          />
          {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
          <button
            type="button"
            onClick={submitComment}
            disabled={busy || !content.trim()}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Posting…" : "Post Comment"}
          </button>
        </div>
      )}

      {hasComments ? (
        <div className="divide-y divide-border/30">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              node={comment}
              postId={postId}
              currentUser={currentUser}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
      )}
    </section>
  )
}
