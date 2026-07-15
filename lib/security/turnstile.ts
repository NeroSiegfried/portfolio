/**
 * Server-side Cloudflare Turnstile verification.
 *   TURNSTILE_SECRET_KEY — server secret (verify)
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — public site key (widget, client-side)
 *
 * If the secret is unset the check is skipped (so local dev / a not-yet-configured
 * deploy still works) — the honeypot + rate limiter still apply. Set the secret in
 * production to actually enforce it.
 */
export async function verifyTurnstile(token: unknown, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification")
    return true
  }
  if (typeof token !== "string" || !token) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip && ip !== "unknown") body.append("remoteip", ip)
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
