/** Shared input validation + request helpers for public-facing endpoints. */

import { createHash } from "node:crypto"
import { isIP } from "node:net"

// Deliberately pragmatic rather than attempting to implement all of RFC 5322.
// This matches what browsers and SES can reliably handle and rejects whitespace,
// control characters, malformed labels, and header-injection payloads.
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
const SINGLE_LINE_CONTROL_RE = /[\u0000-\u001f\u007f]/
const MULTILINE_CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/

export function isValidEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.length >= 3 &&
    email.length <= 254 &&
    !email.includes("..") &&
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

/** Validate a short field that must never contain line breaks or controls. */
export function cleanSingleLine(v: unknown, max: number): string {
  if (typeof v !== "string") return ""
  const value = v.trim().normalize("NFC")
  if (!value || value.length > max || SINGLE_LINE_CONTROL_RE.test(value)) return ""
  return value
}

/** Validate multiline user content without silently truncating it. */
export function cleanMultiline(v: unknown, max: number): string {
  if (typeof v !== "string") return ""
  const value = v.trim().normalize("NFC")
  if (!value || value.length > max || MULTILINE_CONTROL_RE.test(value)) return ""
  return value
}

/**
 * Best-effort client IP from the hosting proxy, constrained to a real IP.
 * The site is Cloudflare-proxied in front of Vercel, so `x-forwarded-for` /
 * `x-real-ip` carry Cloudflare's own edge IP (a different one per request),
 * not the visitor's — `cf-connecting-ip` is Cloudflare's dedicated header for
 * the true client IP and is set fresh at their edge, not client-suppliable.
 */
export function clientIp(req: Request): string {
  const h = req.headers
  const candidate = (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  )
  return isIP(candidate) ? candidate : "unknown"
}

/** Stable, non-reversible rate-limit key so email addresses never enter the table. */
export function rateLimitKey(value: string): string {
  return createHash("sha256").update(value).digest("base64url").slice(0, 32)
}

/**
 * Browser requests that mutate state must come from this deployment or the
 * configured canonical site. Requests without Origin remain usable by trusted
 * server clients, but explicit cross-site browser requests are rejected.
 */
export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site"

  const allowed = new Set<string>()
  try {
    allowed.add(new URL(req.url).origin)
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin)
    }
  } catch {
    return false
  }

  try {
    return allowed.has(new URL(origin).origin)
  } catch {
    return false
  }
}

export type JsonObjectResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: 400 | 413 | 415; error: string }

/** Parse a small JSON object with content-type and byte-size enforcement. */
export async function readJsonObject(req: Request, maxBytes: number): Promise<JsonObjectResult> {
  const contentType = req.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
  if (contentType !== "application/json") {
    return { ok: false, status: 415, error: "Content-Type must be application/json." }
  }

  const declaredLength = Number(req.headers.get("content-length"))
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large." }
  }

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return { ok: false, status: 400, error: "Invalid request." }
  }
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large." }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, status: 400, error: "Invalid request." }
    }
    return { ok: true, body: parsed as Record<string, unknown> }
  } catch {
    return { ok: false, status: 400, error: "Invalid request." }
  }
}
