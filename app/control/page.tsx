"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

export default function ControlLoginPage() {
  const router = useRouter()
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

    router.push("/control/dashboard")
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-20">
      <div className="rounded-lg border p-6">
        <h1 className="text-2xl font-bold">Control Access</h1>
        <p className="mt-2 text-sm text-muted-foreground">Author/admin login for blog management.</p>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => { e.preventDefault(); login() }}
        >
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="Admin email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="relative">
            <input
              className="w-full rounded-md border bg-background px-3 py-2 pr-10"
              placeholder="Admin password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Enter Dashboard"}
          </Button>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </form>
      </div>
    </main>
  )
}
