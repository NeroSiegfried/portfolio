"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, LoaderCircle, Mail, MapPin, Phone, Send, ShieldCheck } from "lucide-react"
import { Eyebrow } from "@/components/v2/primitives"
import { Turnstile } from "@/components/turnstile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [website, setWebsite] = useState("") // honeypot — real users never fill this
  const [token, setToken] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<null | "ok" | "err">(null)
  const [errMsg, setErrMsg] = useState("")
  const [verificationKey, setVerificationKey] = useState(0)
  // The first submit attempt goes through frictionlessly; the server only asks
  // for Turnstile once it sees a repeat attempt from the same IP, and tells us
  // via `turnstileRequired` so we know to reveal the widget.
  const [verifyRequired, setVerifyRequired] = useState(false)

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (TURNSTILE_ENABLED && verifyRequired && !token) {
      setErrMsg("Please complete the security check before sending.")
      setStatus("err")
      return
    }
    setSubmitting(true)
    setStatus(null)
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website, turnstileToken: token }),
      })
      const data = (await r.json().catch(() => ({}))) as { error?: string; turnstileRequired?: boolean }
      if (!r.ok) {
        if (data.turnstileRequired) setVerifyRequired(true)
        setErrMsg(data.error ?? "Something went wrong. Please email me instead.")
        setStatus("err")
        return
      }
      setForm({ name: "", email: "", message: "" })
      setStatus("ok")
    } catch {
      setErrMsg("Something went wrong. Please email me instead.")
      setStatus("err")
    } finally {
      setSubmitting(false)
      if (TURNSTILE_ENABLED && verifyRequired) {
        setToken("")
        setVerificationKey((value) => value + 1)
      }
    }
  }

  const field = "rounded-none border-border bg-background/70 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
  const social =
    "border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"

  return (
    <section id="contact" className="scroll-mt-16 border-t border-border px-4 py-14 md:px-6 md:py-20">
      <div className="w-full">
        <Eyebrow>Contact</Eyebrow>
        <h2 className="mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.02]">
          Let&rsquo;s build something worth shipping.
        </h2>

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-8">
            <div className="space-y-5">
              <a href="mailto:victornabasu@yahoo.com" className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-primary">
                <Mail className="h-4 w-4 text-primary" /> <span>victornabasu@yahoo.com</span>
              </a>
              <a href="tel:+447881177717" className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-primary">
                <Phone className="h-4 w-4 text-primary" /> <span>+44 7881 177717 (UK)</span>
              </a>
              <a href="tel:+2348099016465" className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-primary">
                <Phone className="h-4 w-4 text-primary" /> <span>+234 8099 016465 (NG)</span>
              </a>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> <span>London, UK — in person &amp; remote</span>
              </div>
            </div>
            <div>
              <Eyebrow className="mb-3 block">Elsewhere</Eyebrow>
              <div className="flex flex-wrap gap-3">
                <a href="https://github.com/NeroSiegfried" target="_blank" rel="noopener noreferrer" className={social}>GitHub</a>
                <a href="https://www.linkedin.com/in/victor-nabasu-8b5223212/" target="_blank" rel="noopener noreferrer" className={social}>LinkedIn</a>
                <a href="https://x.com/NeroSiegfried" target="_blank" rel="noopener noreferrer" className={social}>X</a>
              </div>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="border border-border bg-card/30 p-5 sm:p-7"
            aria-busy={submitting}
          >
            <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Eyebrow>Project enquiry</Eyebrow>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">Start the conversation.</h3>
              </div>
              <span className="inline-flex w-fit items-center gap-2 border border-border px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                Usually replies in 1–2 days
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name" className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                  Your name
                </Label>
                <Input
                  id="contact-name"
                  required
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  value={form.name}
                  onChange={change}
                  placeholder="Ada Lovelace"
                  className={`${field} h-12`}
                  suppressHydrationWarning
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email" className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                  Email address
                </Label>
                <Input
                  id="contact-email"
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  value={form.email}
                  onChange={change}
                  placeholder="ada@example.com"
                  className={`${field} h-12`}
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <Label htmlFor="contact-message" className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                  What are you building?
                </Label>
                <span className="font-mono text-[0.65rem] text-muted-foreground" aria-hidden="true">
                  {form.message.length}/5000
                </span>
              </div>
              <Textarea
                id="contact-message"
                required
                name="message"
                minLength={10}
                maxLength={5000}
                value={form.message}
                onChange={change}
                placeholder="A little context, the problem to solve, and your ideal timeline…"
                rows={6}
                className={`${field} min-h-40 resize-y py-3 leading-relaxed`}
                suppressHydrationWarning
              />
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
              <Turnstile key={verificationKey} action="contact" onVerify={setToken} className="mt-5" />
            ) : null}

            <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex max-w-xs items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Your details are used only to reply to this enquiry.
              </p>
              <Button
              type="submit"
                disabled={submitting || (verifyRequired && !token)}
                className="h-12 shrink-0 rounded-none px-6 font-mono text-xs uppercase tracking-[0.14em]"
              >
                {submitting ? (
                  <><LoaderCircle className="animate-spin" aria-hidden="true" /> Sending…</>
                ) : (
                  <>Send message <Send aria-hidden="true" /></>
                )}
              </Button>
            </div>

            <div className="mt-4 min-h-12" aria-live="polite" aria-atomic="true">
              {status === "ok" ? (
                <p className="flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground" role="status">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Thanks — your message is on its way. I&rsquo;ll get back to you soon.
                </p>
              ) : null}
              {status === "err" ? (
                <p className="flex items-center gap-2 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {errMsg}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
