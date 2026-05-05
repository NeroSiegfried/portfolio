/**
 * Next.js instrumentation hook — runs once when the server process starts.
 *
 * Strategy:
 * 1. Warm the TCP+SSL pool connection (eliminates the ~300ms handshake on first request)
 * 2. Fill the home + series caches synchronously (the most-hit pages are instantly fast)
 * 3. Warm per-post caches SEQUENTIALLY in the background — one at a time so the
 *    10-connection pool is never flooded. Previously running all posts in parallel
 *    consumed all pool connections and caused the first real requests to wait 3+ seconds.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!process.env.DATABASE_URL) return
    try {
      const { getPool, readBlogHomeDb, readSeriesDb, readBlogPostDb, readPostCommentsDb } =
        await import("@/lib/blog/store")
      const pool = getPool()

      // Establish the TCP+SSL connection so the first real request doesn't pay it.
      await pool.query("SELECT 1")

      // Prime the two most-hit caches synchronously before the server
      // starts accepting traffic for those pages.
      const [homeDb] = await Promise.all([readBlogHomeDb(), readSeriesDb()])

      // Warm per-post caches one-at-a-time in the background.
      // Non-blocking: real requests are never stalled waiting for this loop.
      const slugs = homeDb.posts
        .filter((p) => p.status === "published")
        .map((p) => p.slug)

      void (async () => {
        for (const slug of slugs) {
          await readBlogPostDb(slug).catch(() => {})
          await readPostCommentsDb(slug).catch(() => {})
          // Tiny gap between posts so the pool never hits max connections
          await new Promise((r) => setTimeout(r, 50))
        }
      })()
    } catch {
      // Non-fatal — pool will connect on demand if this fails
    }
  }
}
