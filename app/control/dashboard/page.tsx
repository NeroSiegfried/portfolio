import { redirect } from "next/navigation"
import { requireAdminUser } from "@/lib/blog/auth"
import { readDb } from "@/lib/blog/store"
import AdminDashboard, { type AdminComment, type AdminUser } from "@/components/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const admin = await requireAdminUser()
  if (!admin) {
    redirect("/control")
  }

  const db = await readDb()

  // Resolve author + post for each comment server-side (moderation list).
  const postById = new Map(db.posts.map((p) => [p.id, p]))
  const userById = new Map(db.users.map((u) => [u.id, u]))
  const comments: AdminComment[] = [...db.comments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => {
      const post = postById.get(c.postId)
      const author = userById.get(c.userId)
      return {
        id: c.id,
        postId: c.postId,
        postTitle: post?.title ?? "(unknown post)",
        postSlug: post?.slug ?? "",
        authorName: author?.displayName ?? author?.username ?? "(unknown)",
        authorUsername: author?.username ?? "",
        content: c.content,
        createdAt: c.createdAt,
        hidden: c.hidden ?? false,
      }
    })

  // Blocked first, then alphabetical. Strip passwordHash — never send it to the client.
  const users: AdminUser[] = [...db.users]
    .sort((a, b) => (a.blocked === b.blocked ? a.username.localeCompare(b.username) : a.blocked ? -1 : 1))
    .map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      blocked: u.blocked,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
    }))

  return (
    <AdminDashboard
      posts={[...db.posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))}
      series={[...db.series].sort((a, b) => a.title.localeCompare(b.title))}
      snippets={[...db.snippets].sort((a, b) => a.title.localeCompare(b.title))}
      comments={comments}
      users={users}
      adminName={admin.username}
    />
  )
}
