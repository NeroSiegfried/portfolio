"use client"

import { useMemo, useState, useTransition } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Pencil, Trash2, ThumbsDown, ThumbsUp, EyeOff } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { CommentNode, PublicUser } from "@/lib/blog/types"

const EDIT_WINDOW_MS = 15 * 60 * 1000

interface BlogCommentsProps {
  postId: string
  comments: CommentNode[]
  currentUser: PublicUser | null
  onRefresh: () => Promise<void>
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
  const [isPending, startTransition] = useTransition()
  // Optimistic vote tracking — seeded from server so persists across refreshes
  const [userVote, setUserVote] = useState<1 | -1 | 0>(node.currentUserVote)

  const isOwner = currentUser?.id === node.userId
  const isAdmin = currentUser?.role === "admin"
  const canEdit =
    isOwner &&
    !node.hidden &&
    Date.now() - new Date(node.createdAt).getTime() < EDIT_WINDOW_MS
  const canDelete = isOwner || isAdmin

  const refresh = () => startTransition(() => { void onRefresh() })

  const sendReply = async () => {
    if (!reply.trim()) return
    const res = await fetch("/api/blog/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, parentId: node.id, content: reply }),
    })
    if (!res.ok) { setError(((await res.json()) as { error?: string }).error ?? "Unable to reply."); return }
    setReply(""); setShowReply(false); setError(null); refresh()
  }

  const vote = async (value: 1 | -1) => {
    // Optimistic: same value toggles off, different value switches
    const prev = userVote
    setUserVote(prev === value ? 0 : value)

    const res = await fetch("/api/blog/comments/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: node.id, value }),
    })
    if (!res.ok) {
      setUserVote(prev) // revert
      setError(((await res.json()) as { error?: string }).error ?? "Unable to vote.")
      return
    }
    setError(null); refresh()
  }

  const saveEdit = async () => {
    if (!editContent.trim()) return
    const res = await fetch(`/api/blog/comments/${node.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    })
    if (!res.ok) { setError(((await res.json()) as { error?: string }).error ?? "Unable to edit."); return }
    setEditing(false); setError(null); refresh()
  }

  const deleteComment = async (hard = false) => {
    const url = hard ? `/api/blog/comments/${node.id}?hard=1` : `/api/blog/comments/${node.id}`
    const res = await fetch(url, { method: "DELETE" })
    if (!res.ok) { setError(((await res.json()) as { error?: string }).error ?? "Unable to delete."); return }
    setError(null); refresh()
  }

  const hideComment = async () => deleteComment(false)

  // Hidden comments: show placeholder for admins, nothing for others
  if (node.hidden && !isAdmin) return null
  if (node.hidden && isAdmin) {
    return (
      <div className="py-4 opacity-50">
        <p className="text-xs text-muted-foreground italic">[Comment hidden by moderator]</p>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await fetch(`/api/blog/comments/${node.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hidden: false }),
              })
              void onRefresh()
            }}
            disabled={isPending}
            className="text-xs text-primary hover:underline disabled:opacity-40"
          >
            Unhide
          </button>
          <button
            type="button"
            onClick={() => deleteComment(true)}
            disabled={isPending}
            className="text-xs text-destructive hover:underline disabled:opacity-40"
          >
            Hard delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/70">{node.username}</span>
        <span>·</span>
        <span>{new Date(node.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
        {node.editedAt && <span className="rounded bg-muted px-1 py-0.5 text-[10px]">edited</span>}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={isPending}
            className="text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <button type="button" onClick={saveEdit} disabled={isPending}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
              Save
            </button>
            <button type="button" onClick={() => { setEditing(false); setEditContent(node.content) }}
              className="text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{node.content}</p>
      )}

      <div className="mt-2.5 flex items-center gap-3">
        <button type="button" onClick={() => vote(1)} disabled={!currentUser || isPending}
          className={[
            "flex items-center gap-1 text-xs transition-colors disabled:opacity-40",
            userVote === 1
              ? "text-secondary"
              : "text-muted-foreground hover:text-secondary",
          ].join(" ")}>
          <ThumbsUp className="h-3 w-3" />
        </button>
        <span className="text-xs tabular-nums text-muted-foreground">{node.score}</span>
        <button type="button" onClick={() => vote(-1)} disabled={!currentUser || isPending}
          className={[
            "flex items-center gap-1 text-xs transition-colors disabled:opacity-40",
            userVote === -1
              ? "text-primary"
              : "text-muted-foreground hover:text-primary",
          ].join(" ")}>
          <ThumbsDown className="h-3 w-3" />
        </button>
        <button type="button" onClick={() => setShowReply((v) => !v)}
          className="ml-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          Reply
        </button>
        {canEdit && !editing && (
          <button type="button" onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
        {canDelete && (
          <button type="button" onClick={() => isAdmin ? hideComment() : deleteComment()}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40">
            {isAdmin ? <EyeOff className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
            {isAdmin ? "Hide" : "Delete"}
          </button>
        )}
        {isAdmin && (
          <button type="button" onClick={() => deleteComment(true)} disabled={isPending}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40">
            <Trash2 className="h-3 w-3" />
            Hard delete
          </button>
        )}
      </div>

      {showReply && (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Write a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={!currentUser}
            className="text-sm"
            rows={2}
          />
          <button type="button" onClick={sendReply} disabled={!currentUser || isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
            Post Reply
          </button>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-muted-foreground">{error}</p>}

      {node.children.length > 0 && (
        <div className="mt-3 space-y-0 border-l border-border/40 pl-4">
          {node.children.map((child) => (
            <CommentItem key={child.id} node={child} postId={postId} currentUser={currentUser} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BlogComments({ postId, comments, currentUser, onRefresh }: BlogCommentsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const authError = searchParams.get("auth_error")
  // After OAuth, send user back to this article at the comments anchor
  const returnTo = `${pathname}#comments`
  const [content, setContent] = useState("")
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasComments = useMemo(() => comments.length > 0, [comments])

  const submitComment = async () => {
    if (!content.trim()) return

    const response = await fetch("/api/blog/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content }),
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string }
      setError(payload.error ?? "Unable to comment.")
      return
    }

    setContent("")
    setError(null)
    startTransition(() => { void onRefresh() })
  }

  const submitAuth = async () => {
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register"
    const body = authMode === "login" ? { email, password } : { username, email, password }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string }
      setError(payload.error ?? "Authentication failed.")
      return
    }

    setError(null)
    startTransition(() => { void onRefresh() })
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    startTransition(() => { void onRefresh() })
  }

  return (
    <section>
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
          {/* Underline tab switcher */}
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
              />
            )}
            <input
              className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-xs text-muted-foreground">{error}</p>}
            <button
              type="button"
              onClick={submitAuth}
              disabled={isPending}
              className="mt-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {authMode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Signed in as <span className="font-medium text-foreground/80">{currentUser.username}</span></span>
            <button
              type="button"
              onClick={logout}
              className="transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </div>
          <Textarea
            placeholder="Write a comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="text-sm"
            rows={3}
          />
          {error && <p className="mt-1.5 text-xs text-muted-foreground">{error}</p>}
          <button
            type="button"
            onClick={submitComment}
            disabled={isPending}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Post Comment
          </button>
        </div>
      )}

      {hasComments ? (
        <div className="divide-y divide-border/30">
          {comments.map((comment) => (
            <CommentItem key={comment.id} node={comment} postId={postId} currentUser={currentUser} onRefresh={onRefresh} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
      )}
    </section>
  )
}

