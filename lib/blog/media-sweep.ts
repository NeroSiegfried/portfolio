import { getPool } from "@/lib/blog/store"
import { listObjects, imageUrlsIn, extractKey, deleteKey, setKeepTag } from "@/lib/blog/media"

/** Grace period before an unreferenced upload is considered a true orphan. */
const GRACE_MS = 30 * 24 * 60 * 60 * 1000

export interface SweepResult {
  scanned: number
  referenced: number
  deleted: number
  tagged: number
  skipped: number
}

/** Every S3 key currently referenced anywhere in the blog DB. */
async function referencedKeys(): Promise<Set<string>> {
  const pool = getPool()
  const keys = new Set<string>()
  const add = (url?: string | null) => {
    if (!url) return
    const k = extractKey(url)
    if (k) keys.add(k)
  }

  const posts = await pool.query<{ content: string | null; cover_image: string | null }>(
    "SELECT content, cover_image FROM posts",
  )
  for (const r of posts.rows) {
    add(r.cover_image)
    for (const u of imageUrlsIn(r.content)) add(u)
  }

  const comments = await pool.query<{ content: string | null }>("SELECT content FROM comments")
  for (const r of comments.rows) for (const u of imageUrlsIn(r.content)) add(u)

  const users = await pool.query<{ avatar_url: string | null }>(
    "SELECT avatar_url FROM users WHERE avatar_url IS NOT NULL",
  )
  for (const r of users.rows) add(r.avatar_url)

  return keys
}

/**
 * Reconciliation sweep — the **primary, code-driven orphan finder**. It cross-
 * references every stored object against the DB, so it can find orphans the
 * lifecycle rule never could (e.g. an image whose content was deleted). The S3
 * lifecycle rule is only the backstop for when this sweep isn't running.
 *
 * For every object under `uploads/` and `media/`:
 *   • referenced in the DB              → ensure keep=true (self-heal a missed tag)
 *   • unreferenced & older than grace   → delete (the orphan)
 *   • unreferenced but still young      → ensure keep=false, so the S3 backstop
 *     can expire it later even if this sweep stops running
 *
 * Deletes/tags are best-effort (logged, not thrown) so one bad object can't
 * abort the whole run.
 */
export async function reconcileMedia(now = Date.now()): Promise<SweepResult> {
  const referenced = await referencedKeys()
  const objects = [...(await listObjects("uploads/")), ...(await listObjects("media/"))]

  const result: SweepResult = { scanned: objects.length, referenced: 0, deleted: 0, tagged: 0, skipped: 0 }

  for (const obj of objects) {
    const managedByRule = obj.key.startsWith("uploads/") // only uploads/ carries the tag rule

    if (referenced.has(obj.key)) {
      result.referenced++
      if (managedByRule) {
        await setKeepTag(obj.key, true)
        result.tagged++
      }
      continue
    }

    const age = now - (obj.lastModified?.getTime() ?? now)
    if (age > GRACE_MS) {
      await deleteKey(obj.key)
      result.deleted++
    } else if (managedByRule) {
      await setKeepTag(obj.key, false)
      result.tagged++
    } else {
      result.skipped++ // young, unreferenced media/ object — leave it for now
    }
  }

  return result
}
