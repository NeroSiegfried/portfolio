// Database access for the build-log scripts.
//
// The blog database is Neon (via the Vercel integration). Normally that means a
// plain `pg` connection on 5432 — but some networks (and some corporate/ISP
// paths) let the TCP handshake through and then stall the Postgres TLS
// handshake, which shows up as an unexplained "connection timeout" against a
// database that is demonstrably up.
//
// Neon also speaks SQL over HTTPS on the same host, so this module tries the
// normal socket first and transparently falls back to HTTP. Both return the
// same `{ rows, rowCount }` shape, so callers don't care which one they got.
//
// Caveat for future callers: the HTTP transport runs every request as its own
// implicit transaction. Independent statements (what the seeder does) are fine;
// anything needing BEGIN/COMMIT across calls must use the socket transport.
import { Pool } from "pg"
import { readFileSync } from "fs"

/** Read a key out of a local env file, if that file exists. */
export function fromEnvFile(file, key) {
  try {
    const env = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8")
    const m = env.match(new RegExp(`^${key}="?([^"\\n]+)"?$`, "m"))
    return m ? m[1].trim() : null
  } catch {
    return null
  }
}

/**
 * Prefer the non-pooling connection for a one-shot admin script — a direct
 * connection rather than one through pgbouncer.
 * Refresh with: vercel env pull .env.vercel.local --environment=production
 */
export function resolveDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    fromEnvFile(".env.vercel.local", "POSTGRES_URL_NON_POOLING") ||
    fromEnvFile(".env.vercel.local", "DATABASE_URL") ||
    fromEnvFile(".env.local", "DATABASE_URL")
  if (!url) {
    throw new Error(
      "No database URL found. Set DATABASE_URL, or run:\n" +
        "  vercel env pull .env.vercel.local --environment=production",
    )
  }
  return url
}

function httpClient(url) {
  const endpoint = `https://${new URL(url).hostname}/sql`
  return {
    transport: "https",
    async query(text, params = []) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Neon-Connection-String": url,
          "Neon-Raw-Text-Output": "true",
          "Neon-Array-Mode": "false",
        },
        body: JSON.stringify({ query: text, params }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message ?? `Neon HTTP ${res.status}`)
      return { rows: body.rows ?? [], rowCount: body.rowCount ?? (body.rows?.length ?? 0) }
    },
    async end() {},
  }
}

/**
 * Open a database connection, socket-first with an HTTPS fallback.
 * `socketAttempts` also covers Neon waking suspended compute.
 */
export async function openDb({ socketAttempts = 2, quiet = false } = {}) {
  const url = resolveDatabaseUrl()
  const log = (m) => !quiet && console.log(m)

  for (let i = 1; i <= socketAttempts; i++) {
    // A Pool that failed to connect stays unhappy, so each attempt gets a new one.
    const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15000 })
    try {
      await pool.query("SELECT 1")
      log("· connected over postgres://")
      return {
        transport: "socket",
        query: (text, params) => pool.query(text, params),
        end: () => pool.end(),
      }
    } catch {
      await pool.end().catch(() => {})
      if (i < socketAttempts) log(`· database not answering on 5432 (attempt ${i}/${socketAttempts})`)
    }
  }

  const client = httpClient(url)
  await client.query("SELECT 1") // fail loudly here rather than mid-seed
  log("· port 5432 unreachable — connected over Neon SQL-over-HTTPS instead")
  return client
}
