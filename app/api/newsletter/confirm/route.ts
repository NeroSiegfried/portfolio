import { NextResponse } from "next/server"
import { confirmSubscriber } from "@/lib/newsletter/store"

export const runtime = "nodejs"

// GET /api/newsletter/confirm?token=… — clicked from the double-opt-in email.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token") ?? ""
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin
  const ok = token ? await confirmSubscriber(token).catch(() => false) : false
  return NextResponse.redirect(`${site}/newsletter/confirmed${ok ? "" : "?error=1"}`)
}
