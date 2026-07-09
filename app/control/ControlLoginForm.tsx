"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"

export default function ControlLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true)
    setError(null)
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string }
      setError(payload.error ?? "Login failed.")
      setLoading(false)
      return
    }

    const payload = (await response.json()) as { user?: { role?: string } }
    if (payload.user?.role !== "admin") {
      setError("This entry is restricted to admin only.")
      setLoading(false)
      return
    }

    // Full page navigation so the browser sends the fresh session cookie to the
    // server component, bypassing any stale Next.js RSC cache built pre-login.
    window.location.href = "/control/dashboard"
  }

  const input = "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md border border-border bg-card/40 p-6 md:p-8">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">Control</span>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">Access</h1>
        <p className="mt-2 text-sm text-muted-foreground">Author / admin login for blog management.</p>

        <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); login() }}>
          <input
            className={input}
            placeholder="Admin email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="relative">
            <input
              className={`${input} pr-10`}
              placeholder="Admin password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Enter dashboard"}
          </button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>

        <Link href="/" className="mt-6 inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to site
        </Link>
      </div>
    </main>
  )
}
