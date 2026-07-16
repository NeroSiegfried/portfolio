/**
 * Server-side Cloudflare Turnstile verification.
 *   TURNSTILE_SECRET_KEY — server secret (verify)
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — public site key (widget, client-side)
 *
 * Local development may omit the secret. Production fails closed so an omitted
 * environment variable cannot silently disable bot protection.
 */
export async function verifyTurnstile(
  token: unknown,
  ip?: string,
  expectedAction?: "contact" | "newsletter",
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[turnstile] TURNSTILE_SECRET_KEY is required in production")
      return false
    }
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
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean; action?: string; hostname?: string }
    if (data.success !== true) return false
    if (expectedAction && data.action !== expectedAction) return false

    const configuredSite = process.env.NEXT_PUBLIC_SITE_URL
    if (configuredSite && data.hostname) {
      const expectedHostname = new URL(configuredSite).hostname
      if (data.hostname !== expectedHostname) return false
    }
    return true
  } catch {
    return false
  }
}
