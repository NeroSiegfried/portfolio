import { getPool } from "@/lib/blog/store"
import type { Project } from "@/lib/portfolio-data"

/**
 * Ensure a published build-log post exists for a portfolio project.
 *
 * Build logs live in the "Portfolio Projects" series (`portfolio-projects`),
 * authored by the site admin, and published. The blog post page renders the
 * project's live-site + repository links automatically for any post whose slug
 * matches a project's `blogPostSlug` (see `projectByBlogSlug`).
 *
 * Idempotent — a no-op if the slug already exists. Column names match the
 * snake_case schema used everywhere else in `lib/blog/store.ts`.
 *
 * NOTE: the runnable, self-contained equivalent is `scripts/seed-build-logs.mjs`
 * (no Next runtime needed). This function exists for wiring into admin actions.
 */
export async function createPostForProject(project: Pick<Project, "title" | "description" | "blogPostSlug">) {
  if (!project.blogPostSlug) return
  if (!process.env.DATABASE_URL) {
    console.warn("[build-logs] DATABASE_URL not set; skipping post creation for", project.title)
    return
  }

  const pool = getPool()
  const exists = await pool.query("SELECT id FROM posts WHERE slug=$1 LIMIT 1", [project.blogPostSlug])
  if ((exists.rowCount ?? 0) > 0) return

  const seriesRow = await pool.query("SELECT id FROM series WHERE slug='portfolio-projects' LIMIT 1")
  const seriesId = seriesRow.rows[0]?.id ?? "s_portfolio"
  const adminRow = await pool.query("SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1")
  const authorId = adminRow.rows[0]?.id
  if (!authorId) {
    console.warn("[build-logs] no admin user found; skipping post creation for", project.title)
    return
  }

  await pool.query(
    `INSERT INTO posts (id, slug, title, excerpt, content, series_id, status, author_id, created_at, updated_at, published_at, position)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'published', $6, NOW(), NOW(), NOW(), 0)`,
    [
      project.blogPostSlug,
      `${project.title} — Build Log`,
      project.description.slice(0, 155),
      `# ${project.title} — Build Log\n\n${project.description}\n\n_Full build log coming soon._`,
      seriesId,
      authorId,
    ],
  )
  console.log(`[build-logs] created ${project.blogPostSlug}`)
}
