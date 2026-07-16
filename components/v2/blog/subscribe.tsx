"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole, Mail } from "lucide-react"
import { AnimatedArrow } from "@/components/v2/animated-arrow"
import { Turnstile } from "@/components/turnstile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

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
  const [verificationKey, setVerificationKey] = useState(0)
  // The first submit attempt goes through frictionlessly; the server only asks
  // for Turnstile once it sees a repeat attempt from the same IP, and tells us
  // via `turnstileRequired` so we know to reveal the widget.
  const [verifyRequired, setVerifyRequired] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (TURNSTILE_ENABLED && verifyRequired && !token) {
      setErrMsg("Please complete the security check before subscribing.")
      setStatus("err")
      return
    }
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
    } finally {
      if (TURNSTILE_ENABLED && verifyRequired) {
        setToken("")
        setVerificationKey((value) => value + 1)
      }
    }
  }

  return (
    <div id="subscribe" className="relative scroll-mt-28 overflow-hidden border border-border bg-card/40">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
      <div>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center border border-primary/40 bg-primary/5 text-primary">
              <Mail className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">Field notes / Newsletter</p>
          </div>
          <h3 className="mt-5 max-w-md font-serif text-3xl leading-tight text-foreground">Don&rsquo;t miss the next build log.</h3>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Practical notes on databases, DSLs, systems, and the details behind shipped projects. Sent only when there is something worth reading.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
            <span>Double opt-in</span>
            <span aria-hidden="true">/</span>
            <span>No tracking pixels</span>
            <span aria-hidden="true">/</span>
            <span>Leave any time</span>
          </div>
        </div>

        <form onSubmit={submit} className="border-t border-border bg-background/40 p-6 md:p-8" aria-busy={status === "loading"}>
          <Label htmlFor="newsletter-email" className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
            Email address
          </Label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Input
              id="newsletter-email"
              required
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 min-w-0 rounded-none border-border bg-background focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-describedby="newsletter-privacy"
              suppressHydrationWarning
            />
            <Button
              type="submit"
              disabled={status === "loading" || (verifyRequired && !token)}
              className="group h-12 shrink-0 rounded-none px-5 font-mono text-xs uppercase tracking-[0.14em]"
            >
              {status === "loading" ? (
                <><LoaderCircle className="animate-spin" aria-hidden="true" /> Sending…</>
              ) : (
                <>Subscribe <AnimatedArrow className="text-sm" /></>
              )}
            </Button>
          </div>
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
          {TURNSTILE_ENABLED && verifyRequired ? (
            <Turnstile key={verificationKey} action="newsletter" onVerify={setToken} className="mt-4" />
          ) : null}
          <p id="newsletter-privacy" className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            Check your inbox to confirm. Your address is used only for this newsletter.
          </p>
          <div className="mt-4 min-h-12" aria-live="polite" aria-atomic="true">
            {status === "ok" ? (
              <p className="flex items-start gap-2 border border-primary/30 bg-primary/5 px-3 py-3 text-xs leading-relaxed text-foreground" role="status">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Almost there — open the confirmation link in your inbox.
              </p>
            ) : null}
            {status === "err" ? (
              <p className="flex items-start gap-2 border border-destructive/30 bg-destructive/5 px-3 py-3 text-xs leading-relaxed text-destructive" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {errMsg}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}
