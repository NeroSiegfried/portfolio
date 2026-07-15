import { randomUUID, randomBytes } from "crypto"
import { getPool } from "@/lib/blog/store"

/**
 * Self-hosted newsletter subscriber list with double opt-in.
 *   pending      → signed up, confirmation email sent, not yet confirmed
 *   confirmed    → clicked the confirmation link; a real subscriber
 *   unsubscribed → opted out (kept as a row so we honour suppression)
 */
export type SubscriberStatus = "pending" | "confirmed" | "unsubscribed"

let ensured = false
export async function ensureNewsletterTables() {
  if (ensured) return
  await getPool().query(
    `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
       id                text PRIMARY KEY,
       email             text UNIQUE NOT NULL,
       status            text NOT NULL DEFAULT 'pending',
       confirm_token     text,
       unsubscribe_token text NOT NULL,
       created_at        timestamptz NOT NULL DEFAULT now(),
       confirmed_at      timestamptz,
       unsubscribed_at   timestamptz,
       ip                text
     )`,
  )
  ensured = true
}

function newToken(): string {
  return randomBytes(24).toString("base64url")
}

export interface UpsertResult {
  status: SubscriberStatus
  confirmToken: string | null // null when already confirmed (no email needed)
  unsubscribeToken: string
  created: boolean
}

/**
 * Upsert a would-be subscriber into the `pending` state and return the tokens
 * the caller needs to send the confirmation email. Never reveals prior state to
 * the client (the route returns a generic response regardless).
 */
export async function upsertPendingSubscriber(email: string, ip: string): Promise<UpsertResult> {
  await ensureNewsletterTables()
  const pool = getPool()
  const existing = await pool.query<{
    status: SubscriberStatus
    confirm_token: string | null
    unsubscribe_token: string
  }>(`SELECT status, confirm_token, unsubscribe_token FROM newsletter_subscribers WHERE email=$1`, [email])

  if (existing.rows.length) {
    const row = existing.rows[0]
    if (row.status === "confirmed") {
      return { status: "confirmed", confirmToken: null, unsubscribeToken: row.unsubscribe_token, created: false }
    }
    // pending or previously unsubscribed → (re)send a confirmation
    const confirmToken = row.confirm_token ?? newToken()
    await pool.query(
      `UPDATE newsletter_subscribers
         SET status='pending', confirm_token=$2, unsubscribed_at=NULL, ip=$3
       WHERE email=$1`,
      [email, confirmToken, ip],
    )
    return { status: "pending", confirmToken, unsubscribeToken: row.unsubscribe_token, created: false }
  }

  const confirmToken = newToken()
  const unsubscribeToken = newToken()
  await pool.query(
    `INSERT INTO newsletter_subscribers (id, email, status, confirm_token, unsubscribe_token, ip)
     VALUES ($1, $2, 'pending', $3, $4, $5)`,
    [randomUUID(), email, confirmToken, unsubscribeToken, ip],
  )
  return { status: "pending", confirmToken, unsubscribeToken, created: true }
}

/** Confirm a pending subscriber by their confirm token. Returns true if one was confirmed. */
export async function confirmSubscriber(confirmToken: string): Promise<boolean> {
  await ensureNewsletterTables()
  const { rowCount } = await getPool().query(
    `UPDATE newsletter_subscribers
       SET status='confirmed', confirmed_at=now(), confirm_token=NULL
     WHERE confirm_token=$1 AND status='pending'`,
    [confirmToken],
  )
  return (rowCount ?? 0) > 0
}

/** Unsubscribe by token (used by the link and by RFC 8058 one-click POST). */
export async function unsubscribeByToken(unsubscribeToken: string): Promise<boolean> {
  await ensureNewsletterTables()
  const { rowCount } = await getPool().query(
    `UPDATE newsletter_subscribers
       SET status='unsubscribed', unsubscribed_at=now()
     WHERE unsubscribe_token=$1 AND status <> 'unsubscribed'`,
    [unsubscribeToken],
  )
  return (rowCount ?? 0) > 0
}
