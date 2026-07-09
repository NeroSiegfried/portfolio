"use client"

import { useState } from "react"
import { Mail, MapPin, Phone, Send } from "lucide-react"
import { Eyebrow } from "@/components/v2/primitives"
import { cn } from "@/lib/utils"

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<null | "ok" | "err">(null)

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error("bad response")
      setForm({ name: "", email: "", message: "" })
      setStatus("ok")
    } catch {
      setStatus("err")
    } finally {
      setSubmitting(false)
    }
  }

  const field =
    "w-full border border-border bg-transparent px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
  const social =
    "border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors hover:border-primary hover:text-primary"

  return (
    <section id="contact" className="scroll-mt-20 border-t border-border px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
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

          <form onSubmit={submit} className="space-y-4">
            <input required name="name" value={form.name} onChange={change} placeholder="Your name" className={field} suppressHydrationWarning />
            <input required type="email" name="email" value={form.email} onChange={change} placeholder="Your email" className={field} suppressHydrationWarning />
            <textarea required name="message" value={form.message} onChange={change} placeholder="Your message" rows={5} className={cn(field, "resize-none")} suppressHydrationWarning />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-60"
            >
              {submitting ? "Sending…" : (<>Send message <Send className="h-4 w-4" /></>)}
            </button>
            {status === "ok" ? <p className="font-mono text-xs text-primary">Thanks — I&rsquo;ll get back to you soon.</p> : null}
            {status === "err" ? <p className="font-mono text-xs text-destructive">Something went wrong. Please email me instead.</p> : null}
          </form>
        </div>
      </div>
    </section>
  )
}
