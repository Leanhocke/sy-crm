"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError("Email oder Passwort falsch.")
      setLoading(false)
    } else {
      router.push("/")
    }
  }

  return (
    <div style={{
      minHeight:       "100vh",
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      background:      "var(--bg)",
      padding:         "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>

        {/* Logo */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            ShowYourself.me
          </p>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-faint)", marginTop: "0.25rem" }}>
            CRM — Interner Zugang
          </p>
        </div>

        <h1 style={{ fontSize: "1.6rem", fontWeight: 100, letterSpacing: "-0.02em", marginBottom: "2rem" }}>
          Anmelden
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="label" style={{ display: "block", marginBottom: "0.4rem" }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@showyourself.me"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label" style={{ display: "block", marginBottom: "0.4rem" }}>
              Passwort
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.8rem", color: "#991b1b", padding: "0.6rem 0.8rem", background: "#fef2f2" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Anmelden..." : "Anmelden →"}
          </button>
        </form>

        <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "var(--fg-faint)", lineHeight: 1.6 }}>
          Kein Zugang? Wende dich an den Admin.
        </p>
      </div>
    </div>
  )
}
