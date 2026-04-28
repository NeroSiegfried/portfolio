import { redirect } from "next/navigation"
import { requireAdminUser } from "@/lib/blog/auth"
import { readDb } from "@/lib/blog/store"
import AdminDashboard from "@/components/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const admin = await requireAdminUser()
  if (!admin) {
    redirect("/control")
  }

  const db = readDb()

  return (
    <main className="container mx-auto px-4 py-10">
      <header className="mb-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">Blog Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Logged in as {admin.username}.</p>
      </header>

      <div className="max-w-3xl mx-auto">
        <AdminDashboard
          posts={[...db.posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))}
          series={[...db.series].sort((a, b) => a.title.localeCompare(b.title))}
          snippets={[...db.snippets].sort((a, b) => a.title.localeCompare(b.title))}
        />
      </div>
    </main>
  )
}
