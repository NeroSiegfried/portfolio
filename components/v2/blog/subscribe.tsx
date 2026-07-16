"use client"

import { useState } from "react"
import { AnimatedArrow } from "@/components/v2/animated-arrow"
import { Turnstile } from "@/components/turnstile"

/**
 * Newsletter subscribe box (reado "Don't miss a thing"). Posts to
 * /api/newsletter/subscribe, which stores a pending subscriber and sends a
 * double-opt-in confirmation email. Protected by an invisible honeypot +
 * Cloudflare Turnstile (server also rate-limits). `id="subscribe"` is the nav
 * button's scroll target.
 */
export function Subscribe() {
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("") // honeypot
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<null | "ok" | "err" | "loading">(null)
  const [errMsg, setErrMsg] = useState("")
  // The first submit attempt goes through frictionlessly; the server only asks
  // for Turnstile once it sees a repeat attempt from the same IP, and tells us
  // via `turnstileRequired` so we know to reveal the widget.
  const [verifyRequired, setVerifyRequired] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    try {
      const r = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website, turnstileToken: token }),
      })
      const data = (await r.json().catch(() => ({}))) as { error?: string; turnstileRequired?: boolean }
      if (!r.ok) {
        if (data.turnstileRequired) setVerifyRequired(true)
        setErrMsg(data.error ?? "Something went wrong. Please try again.")
        setStatus("err")
        return
      }
      setEmail("")
      setStatus("ok")
    } catch {
      setErrMsg("Something went wrong. Please try again.")
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
        {/* Honeypot — hidden from users, catches naive bots. */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-px w-px overflow-hidden"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="group inline-flex shrink-0 items-center justify-center gap-2 bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground transition-opacity disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : (<>Subscribe <AnimatedArrow className="text-sm" /></>)}
        </button>
      </form>
      {verifyRequired ? <Turnstile onVerify={setToken} className="mt-3" /> : null}
      {status === "ok" ? (
        <p className="mt-3 font-mono text-xs text-primary">Almost there — check your inbox to confirm your subscription.</p>
      ) : null}
      {status === "err" ? <p className="mt-3 font-mono text-xs text-destructive">{errMsg}</p> : null}
    </div>
  )
}
