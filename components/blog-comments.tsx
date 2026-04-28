"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, ThumbsDown, ThumbsUp, EyeOff } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { CommentNode, PublicUser } from "@/lib/blog/types"

const EDIT_WINDOW_MS = 15 * 60 * 1000

interface BlogCommentsProps {
  postId: string
  comments: CommentNode[]
  currentUser: PublicUser | null
}

function CommentItem({
  node,
  postId,
  currentUser,
}: {
  node: CommentNode
  postId: string
  currentUser: PublicUser | null
}) {
  const router = useRouter()
  const [reply, setReply] = useState("")
  const [showReply, setShowReply] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(node.content)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Optimistic vote tracking: 1 = upvoted, -1 = downvoted, 0 = no vote
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0)

  const isOwner = currentUser?.id === node.userId
  const isAdmin = currentUser?.role === "admin"
  const canEdit =
    isOwner &&
    !node.hidden &&
    Date.now() - new Date(node.createdAt).getTime() < EDIT_WINDOW_MS
  const canDelete = isOwner || isAdmin

  const refresh = () => startTransition(() => router.refresh())

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
              refresh()
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
            <CommentItem key={child.id} node={child} postId={postId} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BlogComments({ postId, comments, currentUser }: BlogCommentsProps) {
  const router = useRouter()
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
    startTransition(() => router.refresh())
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
    startTransition(() => router.refresh())
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    startTransition(() => router.refresh())
  }

  return (
    <section>
      <h2 className="mb-6 text-xl font-bold tracking-tight">Discussion</h2>

      {!currentUser ? (
        <div className="mb-8">
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
            <CommentItem key={comment.id} node={comment} postId={postId} currentUser={currentUser} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
      )}
    </section>
  )
}

