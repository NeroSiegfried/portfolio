import { NextResponse } from "next/server"
import { clampString, isValidEmail, normalizeEmail, isHoneypotTripped, clientIp } from "@/lib/security/validation"
import { verifyTurnstile } from "@/lib/security/turnstile"
import { rateLimit } from "@/lib/security/rate-limit"
import { sendEmail } from "@/lib/email/ses"
import { contactNotificationEmail } from "@/lib/newsletter/emails"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({ status: "ok" })
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // Honeypot: silently accept so bots think they succeeded.
  if (isHoneypotTripped(body.website)) return NextResponse.json({ success: true })

  const name = clampString(body.name, 120)
  const email = normalizeEmail(body.email)
  const message = clampString(body.message, 5000)
  if (!name || !isValidEmail(email) || message.length < 2) {
    return NextResponse.json(
      { error: "Please provide your name, a valid email, and a message." },
      { status: 400 },
    )
  }

  const ip = clientIp(req)
  const rl = await rateLimit("contact", ip, 5, 3600) // 5 / hour / IP
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 })
  }

  const to = process.env.CONTACT_TO ?? "victornabasu@yahoo.com"
  try {
    const { html, text } = contactNotificationEmail(name, email, message)
    await sendEmail({ to, subject: `New message from ${name}`, replyTo: email, html, text })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[contact]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Failed to send. Please try again." }, { status: 500 })
  }
}
