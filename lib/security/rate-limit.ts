import { getPool } from "@/lib/blog/store"

/**
 * Postgres fixed-window rate limiter (no extra service). Keyed by action + a
 * caller identifier (usually IP) + a time bucket. Good enough to stop scripted
 * abuse of the public contact/newsletter endpoints.
 */
let ensured = false
async function ensure() {
  if (ensured) return
  await getPool().query(
    `CREATE TABLE IF NOT EXISTS rate_limits (
       id         text PRIMARY KEY,
       count      integer NOT NULL DEFAULT 0,
       expires_at timestamptz NOT NULL
     )`,
  )
  ensured = true
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfter: number // seconds until the window resets
}

export async function rateLimit(
  action: string,
  identifier: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  await ensure()
  const pool = getPool()
  const bucket = Math.floor(Date.now() / 1000 / windowSec)
  const id = `${action}:${identifier}:${bucket}`
  const expiresAt = new Date((bucket + 1) * windowSec * 1000)
  const { rows } = await pool.query<{ count: number }>(
    `INSERT INTO rate_limits (id, count, expires_at) VALUES ($1, 1, $2)
     ON CONFLICT (id) DO UPDATE SET count = rate_limits.count + 1
     RETURNING count`,
    [id, expiresAt],
  )
  const count = rows[0]?.count ?? 1
  // Best-effort cleanup of expired windows; never block the request on it.
  pool.query(`DELETE FROM rate_limits WHERE expires_at < now()`).catch(() => {})
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfter: Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
  }
}
