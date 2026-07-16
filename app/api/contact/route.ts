import { NextResponse } from "next/server"
import {
  cleanMultiline,
  cleanSingleLine,
  clientIp,
  isAllowedOrigin,
  isHoneypotTripped,
  isValidEmail,
  normalizeEmail,
  readJsonObject,
} from "@/lib/security/validation"
import { verifyTurnstile } from "@/lib/security/turnstile"
import { rateLimit } from "@/lib/security/rate-limit"
import { sendEmail } from "@/lib/email/ses"
import { contactNotificationEmail } from "@/lib/newsletter/emails"

export const runtime = "nodejs"

const RESPONSE_HEADERS = { "Cache-Control": "no-store" }

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: RESPONSE_HEADERS })
  }

  const parsed = await readJsonObject(req, 16 * 1024)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status, headers: RESPONSE_HEADERS })
  }
  const body = parsed.body

  // Honeypot: silently accept so bots think they succeeded.
  if (isHoneypotTripped(body.website)) {
    return NextResponse.json({ success: true }, { headers: RESPONSE_HEADERS })
  }

  const name = cleanSingleLine(body.name, 100)
  const email = normalizeEmail(body.email)
  const message = cleanMultiline(body.message, 5000)
  if (!name || !isValidEmail(email) || message.length < 10) {
    return NextResponse.json(
      { error: "Please provide your name, a valid email, and a message of at least 10 characters." },
      { status: 400, headers: RESPONSE_HEADERS },
    )
  }

  const ip = clientIp(req)
  const rl = await rateLimit("contact", ip, 5, 3600) // 5 / hour / IP
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      {
        status: 429,
        headers: { ...RESPONSE_HEADERS, "Retry-After": String(rl.retryAfter) },
      },
    )
  }

  // First attempt from an IP this window goes through frictionlessly; a repeat
  // attempt (retry, or a script) must prove it's human before we send anything.
  const FREE_ATTEMPTS = 1
  if (rl.count > FREE_ATTEMPTS && !(await verifyTurnstile(body.turnstileToken, ip, "contact"))) {
    return NextResponse.json(
      { error: "Please complete the verification below and try again.", turnstileRequired: true },
      { status: 400, headers: RESPONSE_HEADERS },
    )
  }

  const to = process.env.CONTACT_TO ?? "victornabasu@yahoo.com"
  try {
    const { html, text } = contactNotificationEmail(name, email, message)
    await sendEmail({ to, subject: `New message from ${name}`, replyTo: email, html, text })
    return NextResponse.json(
      { success: true },
      { headers: { ...RESPONSE_HEADERS, "X-RateLimit-Remaining": String(rl.remaining) } },
    )
  } catch (err) {
    console.error("[contact]", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: "Failed to send. Please try again." },
      { status: 500, headers: RESPONSE_HEADERS },
    )
  }
}
