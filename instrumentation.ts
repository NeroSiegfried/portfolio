/**
 * Next.js instrumentation hook — runs once when the server process starts.
 *
 * 1. Pre-warms the PostgreSQL connection pool (avoids TCP+SSL handshake on first request)
 * 2. Primes the blog home and series caches
 * 3. Pre-loads comments for all published posts so first comment views are fast
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!process.env.DATABASE_URL) return
    try {
      const { getPool, readBlogHomeDb, readSeriesDb, readBlogPostDb, readPostCommentsDb } = await import("@/lib/blog/store")
      const pool = getPool()

      // Await the ping so the connection is fully established before any request arrives
      await pool.query("SELECT 1")

      // Pre-warm home + series caches synchronously (fast — no content column fetched)
      const [homeDb] = await Promise.all([
        readBlogHomeDb(),
        readSeriesDb(),
      ])

      // Pre-warm per-post DB cache + comments cache for all published posts
      const slugs = homeDb.posts
        .filter((p) => p.status === "published")
        .map((p) => p.slug)
      await Promise.all([
        ...slugs.map((slug) => readBlogPostDb(slug).catch(() => {})),
        ...slugs.map((slug) => readPostCommentsDb(slug).catch(() => {})),
      ])
    } catch {
      // Non-fatal — pool will connect on demand if this fails
    }
  }
}
