import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { reconcileMedia } from "@/lib/blog/media-sweep"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set. */
function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`
}

async function run() {
  try {
    const result = await reconcileMedia()
    console.log("[media-sweep]", result)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[media-sweep] failed:", detail)
    return NextResponse.json({ error: "Sweep failed.", detail }, { status: 500 })
  }
}

// GET — the scheduled Vercel Cron invocation (see vercel.json › crons).
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  return run()
}

// POST — manual trigger; a valid cron secret OR an admin session is accepted.
export async function POST(req: Request) {
  if (!cronAuthorized(req)) {
    const admin = await requireAdminUser()
    if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 })
  }
  return run()
}
