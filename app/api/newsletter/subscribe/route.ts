import { NextResponse } from "next/server"
import {
  clientIp,
  isAllowedOrigin,
  isHoneypotTripped,
  isValidEmail,
  normalizeEmail,
  rateLimitKey,
  readJsonObject,
} from "@/lib/security/validation"
import { verifyTurnstile } from "@/lib/security/turnstile"
import { rateLimit } from "@/lib/security/rate-limit"
import { upsertPendingSubscriber } from "@/lib/newsletter/store"
import { sendEmail } from "@/lib/email/ses"
import { confirmEmail } from "@/lib/newsletter/emails"

export const runtime = "nodejs"

const RESPONSE_HEADERS = { "Cache-Control": "no-store" }

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: RESPONSE_HEADERS })
  }

  const parsed = await readJsonObject(req, 4 * 1024)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status, headers: RESPONSE_HEADERS })
  }
  const body = parsed.body

  // Honeypot: pretend success so bots don't learn the field is a trap.
  if (isHoneypotTripped(body.website)) {
    return NextResponse.json({ ok: true }, { headers: RESPONSE_HEADERS })
  }

  const email = normalizeEmail(body.email)
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400, headers: RESPONSE_HEADERS },
    )
  }

  const ip = clientIp(req)
  const ipLimit = await rateLimit("newsletter-ip", ip, 5, 3600)
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: { ...RESPONSE_HEADERS, "Retry-After": String(ipLimit.retryAfter) },
      },
    )
  }

  // First attempt from an IP this window goes through frictionlessly; a repeat
  // attempt (retry, or a script) must prove it's human before we send anything.
  const FREE_ATTEMPTS = 1
  if (ipLimit.count > FREE_ATTEMPTS && !(await verifyTurnstile(body.turnstileToken, ip, "newsletter"))) {
    return NextResponse.json(
      { error: "Please complete the verification below and try again.", turnstileRequired: true },
      { status: 400, headers: RESPONSE_HEADERS },
    )
  }

  // Apply the address-specific limit only after a human verification succeeds;
  // otherwise a bot could lock a victim out simply by naming their address.
  const addressLimit = await rateLimit("newsletter-address", rateLimitKey(email), 3, 24 * 3600)
  if (!addressLimit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: { ...RESPONSE_HEADERS, "Retry-After": String(addressLimit.retryAfter) },
      },
    )
  }

  try {
    const res = await upsertPendingSubscriber(email, ip)
    // Already confirmed → don't resend, but return the same generic response so
    // we never disclose whether an address is on the list.
    if (res.status !== "confirmed" && res.confirmToken) {
      const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? req.url).origin
      const confirmUrl = `${site}/api/newsletter/confirm?token=${res.confirmToken}`
      const unsubUrl = `${site}/api/newsletter/unsubscribe?token=${res.unsubscribeToken}`
      const { html, text } = confirmEmail(confirmUrl, unsubUrl)
      await sendEmail({
        to: email,
        subject: "Confirm your subscription",
        replyTo: process.env.CONTACT_TO,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        html,
        text,
      })
    }
    return NextResponse.json(
      { ok: true },
      {
        headers: {
          ...RESPONSE_HEADERS,
          "X-RateLimit-Remaining": String(Math.min(ipLimit.remaining, addressLimit.remaining)),
        },
      },
    )
  } catch (err) {
    console.error("[newsletter/subscribe]", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: RESPONSE_HEADERS },
    )
  }
}
