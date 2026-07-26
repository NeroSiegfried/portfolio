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

/** Trim + hard-cap a free-text field, collapsing newlines so it can't span lines. */
export function cleanSingleLine(v: unknown, max: number): string {
  if (typeof v !== "string") return ""
  return v.replace(/[\r\n\t]+/g, " ").trim().slice(0, max)
}

/** Normalizes an email into the identifier used to key per-account rate limits. */
export function rateLimitKey(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Rejects cross-origin POSTs (basic CSRF defense). A same-origin browser POST
 * always sends `Origin`; a missing header means a non-browser client, which
 * this check doesn't need to gate.
 */
export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return true
  const allowed = new Set<string>()
  if (process.env.NEXT_PUBLIC_SITE_URL) allowed.add(process.env.NEXT_PUBLIC_SITE_URL)
  try {
    allowed.add(new URL(req.url).origin)
  } catch {
    // ignore malformed request URL
  }
  return allowed.has(origin)
}

type JsonObjectResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; error: string; status: number }

/** Reads a JSON object body with a byte-size cap, rejecting non-object payloads. */
export async function readJsonObject(req: Request, maxBytes: number): Promise<JsonObjectResult> {
  const contentLength = req.headers.get("content-length")
  if (contentLength && Number(contentLength) > maxBytes) {
    return { ok: false, error: "Request body too large.", status: 413 }
  }

  let text: string
  try {
    text = await req.text()
  } catch {
    return { ok: false, error: "Invalid request body.", status: 400 }
  }
  if (text.length > maxBytes) {
    return { ok: false, error: "Request body too large.", status: 413 }
  }

  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    return { ok: false, error: "Invalid JSON body.", status: 400 }
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "Expected a JSON object body.", status: 400 }
  }
  return { ok: true, body: parsed as Record<string, unknown> }
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
