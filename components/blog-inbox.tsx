"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Bell, MessageSquareReply, BookOpenCheck, CheckCheck } from "lucide-react"
import BlogLink from "@/components/blog-link"
import type { AppNotification } from "@/lib/blog/types"

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function NotificationRow({
  n,
  onRead,
}: {
  n: AppNotification
  onRead: (id: string) => void
}) {
  const isRead = !!n.read_at
  const slug = n.data.postSlug

  const content =
    n.type === "comment_reply" ? (
      <span>
        <span className="font-medium text-foreground/80">{n.data.actorName ?? "Someone"}</span>
        {" replied to your comment"}
        {n.data.postTitle ? (
          <> in <span className="font-medium text-foreground/80">{n.data.postTitle}</span></>
        ) : null}
      </span>
    ) : (
      <span>
        New post in{" "}
        <span className="font-medium text-foreground/80">{n.data.seriesTitle ?? "a series"}</span>
        {n.data.postTitle ? (
          <>: <span className="font-medium text-foreground/80">{n.data.postTitle}</span></>
        ) : null}
      </span>
    )

  const icon =
    n.type === "comment_reply" ? (
      <MessageSquareReply className="h-3.5 w-3.5 shrink-0 text-primary" />
    ) : (
      <BookOpenCheck className="h-3.5 w-3.5 shrink-0 text-secondary" />
    )

  const href = slug
    ? n.type === "comment_reply" && n.comment_id
      ? `/blog/${slug}#comment-${n.comment_id}`
      : `/blog/${slug}`
    : null

  const inner = (
    <div
      className={[
        "flex items-start gap-2.5 rounded-md px-3 py-2.5 transition-colors",
        isRead
          ? "text-muted-foreground"
          : "bg-primary/5 text-foreground",
        href ? "hover:bg-muted/60 cursor-pointer" : "",
      ].join(" ")}
      onClick={() => { if (!isRead) onRead(n.id) }}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug">{content}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground/60">{relativeTime(n.created_at)}</p>
      </div>
      {!isRead && (
        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      )}
    </div>
  )

  if (href) {
    return (
      <BlogLink href={href} prefetch={false}>
        {inner}
      </BlogLink>
    )
  }
  return inner
}

export default function InboxButton() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as { notifications: AppNotification[]; unreadCount: number }
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch { /* silent */ }
  }, [])

  // Fetch on mount and every 60s
  useEffect(() => {
    void fetchNotifications()
    const interval = setInterval(() => void fetchNotifications(), 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Re-fetch when panel opens
  useEffect(() => {
    if (open) void fetchNotifications()
  }, [open, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {})
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    )
    setUnreadCount(0)
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {})
  }, [])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className={`relative rounded-md p-1.5 transition-colors hover:text-primary ${open ? "text-primary" : "text-muted-foreground"}`}
      >
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border/50 bg-background shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationRow key={n.id} n={n} onRead={markRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
