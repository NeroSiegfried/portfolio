import { NextResponse } from "next/server"
import { isValidEmail, normalizeEmail, isHoneypotTripped, clientIp } from "@/lib/security/validation"
import { verifyTurnstile } from "@/lib/security/turnstile"
import { rateLimit } from "@/lib/security/rate-limit"
import { upsertPendingSubscriber } from "@/lib/newsletter/store"
import { sendEmail } from "@/lib/email/ses"
import { confirmEmail } from "@/lib/newsletter/emails"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // Honeypot: pretend success so bots don't learn the field is a trap.
  if (isHoneypotTripped(body.website)) return NextResponse.json({ ok: true })

  const email = normalizeEmail(body.email)
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  const ip = clientIp(req)
  const rl = await rateLimit("newsletter", ip, 5, 3600) // 5 / hour / IP
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 })
  }

  try {
    const res = await upsertPendingSubscriber(email, ip)
    // Already confirmed → don't resend, but return the same generic response so
    // we never disclose whether an address is on the list.
    if (res.status !== "confirmed" && res.confirmToken) {
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
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
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[newsletter/subscribe]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
