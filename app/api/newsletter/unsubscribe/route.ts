import { NextResponse } from "next/server"
import { unsubscribeByToken } from "@/lib/newsletter/store"

export const runtime = "nodejs"

// GET — user clicked the unsubscribe link → mark unsubscribed and show a page.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token") ?? ""
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? url.origin).origin
  const ok = token ? await unsubscribeByToken(token).catch(() => false) : false
  const response = NextResponse.redirect(`${site}/newsletter/unsubscribed${ok ? "" : "?error=1"}`)
  response.headers.set("Cache-Control", "no-store")
  return response
}

// POST — RFC 8058 one-click unsubscribe (List-Unsubscribe-Post). Just 200.
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? ""
  if (token) await unsubscribeByToken(token).catch(() => {})
  return new NextResponse(null, { status: 200, headers: { "Cache-Control": "no-store" } })
}
