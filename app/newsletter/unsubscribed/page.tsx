import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Unsubscribed", robots: { index: false } }

export default async function UnsubscribedPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const failed = (await searchParams).error === "1"
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-md border border-border bg-card/40 p-8 text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">Newsletter</p>
        <h1 className="mt-3 font-serif text-2xl text-foreground">
          {failed ? "Link invalid or expired" : "You’ve unsubscribed."}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {failed
            ? "That unsubscribe link is invalid. If you keep getting emails, reply and I’ll remove you manually."
            : "You won’t receive any more newsletter emails. You can re-subscribe any time from the blog."}
        </p>
        <Link
          href="/blog"
          className="mt-6 inline-flex items-center bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground"
        >
          Back to the blog
        </Link>
      </div>
    </main>
  )
}
