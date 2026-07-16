/** Shared input validation + request helpers for the public form endpoints. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.length >= 3 &&
    email.length <= 254 &&
    EMAIL_RE.test(email)
  )
}

export function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : ""
}

/** True when the hidden honeypot field was filled → almost certainly a bot. */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0
}

/** Trim + hard-cap a free-text field. */
export function clampString(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : ""
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const h = req.headers
  // The site is Cloudflare-proxied in front of Vercel, so x-forwarded-for /
  // x-real-ip carry Cloudflare's own edge IP (a different one per request),
  // not the visitor's - cf-connecting-ip is Cloudflare's dedicated header for
  // the true client IP, set fresh at their edge, not client-suppliable.
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  )
}
