"use client"

import { useState } from "react"
import { AnimatedArrow } from "@/components/v2/animated-arrow"

/**
 * Newsletter subscribe box (reado "Don't miss a thing"). A tasteful bordered
 * box (no pills). Posts to the existing /api/contact endpoint so the owner is
 * notified of new subscribers. `id="subscribe"` is the target of the nav button.
 */
export function Subscribe() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<null | "ok" | "err" | "loading">(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter subscriber",
          email,
          message: "Newsletter subscription request from the blog.",
        }),
      })
      if (!r.ok) throw new Error("bad response")
      setEmail("")
      setStatus("ok")
    } catch {
      setStatus("err")
    }
  }

  return (
    <div id="subscribe" className="scroll-mt-28 border border-border bg-card/40 p-6 md:p-7">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">Newsletter</p>
      <h3 className="mt-3 font-serif text-2xl leading-snug text-foreground">Don&rsquo;t miss a build log.</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        New posts on databases, DSLs, systems and shipped projects — straight to your inbox. No spam.
      </p>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          suppressHydrationWarning
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="group inline-flex shrink-0 items-center justify-center gap-2 bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground transition-opacity disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : (<>Subscribe <AnimatedArrow className="text-sm" /></>)}
        </button>
      </form>
      {status === "ok" ? <p className="mt-3 font-mono text-xs text-primary">You&rsquo;re on the list — thanks!</p> : null}
      {status === "err" ? <p className="mt-3 font-mono text-xs text-destructive">Something went wrong. Please try again.</p> : null}
    </div>
  )
}
