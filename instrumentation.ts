/**
 * Next.js instrumentation hook — runs once when the server process starts.
 *
 * Warms the TCP+SSL pool connection and primes the two most-hit caches
 * (home + series). Per-post warmup was removed: it kept idle connections
 * alive across all Vercel instances and exhausted RDS max_connections.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!process.env.DATABASE_URL) return
    try {
      const { getPool, readBlogHomeDb, readSeriesDb } =
        await import("@/lib/blog/store")
      const pool = getPool()

      // Establish the TCP+SSL connection so the first real request doesn't pay it.
      await pool.query("SELECT 1")

      // Prime the two most-hit caches before the server starts accepting traffic.
      await Promise.all([readBlogHomeDb(), readSeriesDb()])
    } catch {
      // Non-fatal — pool will connect on demand if this fails
    }
  }
}
