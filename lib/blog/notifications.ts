import { randomUUID } from "crypto"
import type { Pool } from "pg"

// ─── Comment Reply Notifications ──────────────────────────────────────────────

export async function notifyCommentReply(
  pool: Pool,
  opts: {
    newCommentId: string
    actorId: string
    actorName: string
    actorAvatarUrl: string | null
    postId: string
    postSlug: string
    postTitle: string
  }
) {
  // Walk up the ancestor chain of the new comment
  const ancestorRes = await pool.query<{ id: string; user_id: string }>(
    `WITH RECURSIVE anc AS (
       SELECT id, parent_id, user_id FROM comments WHERE id = $1
       UNION ALL
       SELECT c.id, c.parent_id, c.user_id FROM comments c JOIN anc a ON c.id = a.parent_id
     )
     SELECT id, user_id FROM anc WHERE id != $1`,
    [opts.newCommentId]
  )

  const ancestors = ancestorRes.rows
  if (!ancestors.length) return

  const ancestorIds = ancestors.map((r) => r.id)

  // Unique ancestor authors, excluding the commenter themselves
  const authorIds = [...new Set(ancestors.map((r) => r.user_id))].filter(
    (id) => id !== opts.actorId
  )

  for (const userId of authorIds) {
    // Skip if user has muted any comment in this ancestor chain
    const muteRes = await pool.query(
      `SELECT 1 FROM comment_mutes WHERE user_id = $1 AND comment_id = ANY($2) LIMIT 1`,
      [userId, ancestorIds]
    )
    if (muteRes.rows.length > 0) continue

    await pool.query(
      `INSERT INTO notifications (id, user_id, type, post_id, comment_id, actor_id, data, created_at)
       VALUES ($1, $2, 'comment_reply', $3, $4, $5, $6, NOW())`,
      [
        randomUUID(),
        userId,
        opts.postId,
        opts.newCommentId,
        opts.actorId,
        JSON.stringify({
          actorName: opts.actorName,
          actorAvatarUrl: opts.actorAvatarUrl ?? null,
          postSlug: opts.postSlug,
          postTitle: opts.postTitle,
        }),
      ]
    )
  }
}

// ─── Series Post Notifications ────────────────────────────────────────────────

export async function notifySeriesPost(
  pool: Pool,
  opts: {
    postId: string
    postSlug: string
    postTitle: string
    seriesId: string
    seriesTitle: string
    actorId: string
  }
) {
  const followersRes = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM series_follows WHERE series_id = $1 AND user_id != $2`,
    [opts.seriesId, opts.actorId]
  )

  for (const { user_id } of followersRes.rows) {
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, post_id, actor_id, data, created_at)
       VALUES ($1, $2, 'series_post', $3, $4, $5, NOW())`,
      [
        randomUUID(),
        user_id,
        opts.postId,
        opts.actorId,
        JSON.stringify({
          seriesId: opts.seriesId,
          seriesTitle: opts.seriesTitle,
          postSlug: opts.postSlug,
          postTitle: opts.postTitle,
        }),
      ]
    )
  }
}

// ─── Auto-follow Series ───────────────────────────────────────────────────────

export async function autoFollowSeries(
  pool: Pool,
  userId: string,
  seriesId: string
) {
  await pool.query(
    `INSERT INTO series_follows (user_id, series_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, seriesId]
  )
}
