// components/contact.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Turnstile } from "@/components/turnstile"
import { AlertCircle, CheckCircle2, LoaderCircle, Send, Mail, Phone, MapPin } from "lucide-react"

const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

export default function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [website, setWebsite] = useState("")
  const [token, setToken] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<null | "ok" | "err">(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [verificationKey, setVerificationKey] = useState(0)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (TURNSTILE_ENABLED && !token) {
      setStatus("err")
      setStatusMessage("Please complete the security check before sending.")
      return
    }
    setIsSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formState, website, turnstileToken: token }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? "There was an error sending your message.")

      setFormState({ name: "", email: "", message: "" })
      setStatus("ok")
      setStatusMessage("Thanks — your message is on its way. I’ll get back to you soon.")
    } catch (error) {
      setStatus("err")
      setStatusMessage(error instanceof Error ? error.message : "There was an error sending your message.")
    } finally {
      setIsSubmitting(false)
      if (TURNSTILE_ENABLED) {
        setToken("")
        setVerificationKey((value) => value + 1)
      }
    }
  }

  return (
    <section id="contact" className="py-20 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-center mb-16 text-4xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Get In Touch
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full border-none shadow-lg">
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="text-2xl font-bold mb-6 text-center lg:text-left">Contact Information</h3>
                <div className="space-y-5 flex-grow">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold">Email</h4>
                      <a
                        href="mailto:victornabasu@yahoo.com"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        victornabasu@yahoo.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold">Phone (UK)</h4>
                      <a
                        href="tel:+447881177717"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        +44 7881 177717
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold">Phone (Nigeria)</h4>
                      <a
                        href="tel:+2348099016465"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        +234 8099 016465
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold">Location</h4>
                      <span className="text-sm text-muted-foreground">
                        London, UK (in-person & Remote)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <h4 className="font-medium mb-4">Social Profiles</h4>
                  <div className="flex gap-4">
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href="https://github.com/NeroSiegfried"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-github"
                        >
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                          <path d="M9 18c-4.51 2-5-2-7-2"></path>
                        </svg>
                      </a>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href="https://www.linkedin.com/in/victor-nabasu-8b5223212/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-linkedin"
                        >
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect width="4" height="12" x="2" y="9"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-6 text-center lg:text-left">
                  Send Me a Message
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      autoComplete="name"
                      maxLength={100}
                      value={formState.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                      className="h-12"
                      suppressHydrationWarning
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      maxLength={254}
                      value={formState.email}
                      onChange={handleChange}
                      placeholder="Your email address"
                      required
                      className="h-12"
                      suppressHydrationWarning
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-base">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      minLength={10}
                      maxLength={5000}
                      value={formState.message}
                      onChange={handleChange}
                      placeholder="Your message"
                      required
                      className="min-h-[150px] resize-none"
                      suppressHydrationWarning
                    />
                  </div>
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
                  <Turnstile key={verificationKey} action="contact" onVerify={setToken} />
                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary text-white transition-transform duration-200 hover:scale-[1.03]"
                    disabled={isSubmitting || (TURNSTILE_ENABLED && !token)}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Send Message
                      </span>
                    )}
                  </Button>
                  <div className="min-h-12" aria-live="polite" aria-atomic="true">
                    {status ? (
                      <p
                        className={status === "ok" ? "flex items-center gap-2 text-sm text-primary" : "flex items-center gap-2 text-sm text-destructive"}
                        role={status === "ok" ? "status" : "alert"}
                      >
                        {status === "ok" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <AlertCircle className="h-4 w-4" aria-hidden="true" />}
                        {statusMessage}
                      </p>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
