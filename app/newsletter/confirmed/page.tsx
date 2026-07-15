import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Subscription confirmed", robots: { index: false } }

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const failed = (await searchParams).error === "1"
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-md border border-border bg-card/40 p-8 text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">Newsletter</p>
        <h1 className="mt-3 font-serif text-2xl text-foreground">
          {failed ? "Link invalid or expired" : "You’re subscribed."}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {failed
            ? "That confirmation link is invalid or has already been used. Please subscribe again."
            : "Thanks for confirming — new build logs will land straight in your inbox."}
        </p>
        <Link
          href="/blog"
          className="mt-6 inline-flex items-center bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground"
        >
          {failed ? "Back to the blog" : "Read the blog"}
        </Link>
      </div>
    </main>
  )
}
