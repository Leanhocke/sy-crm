"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import { UserPlus, ToggleLeft, ToggleRight } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState({ name: "", email: "", password: "", role: "AGENT" })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") router.push("/dashboard")
  }, [session, router])

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users")
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    const res = await fetch("/api/admin/users", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    })

    if (res.ok) {
      setSuccess(`Nutzer "${form.name}" wurde angelegt.`)
      setForm({ name: "", email: "", password: "", role: "AGENT" })
      await loadUsers()
    } else {
      const data = await res.json()
      setError(data.error ?? "Fehler beim Anlegen")
    }
    setSaving(false)
  }

  async function toggleUser(id: string, isActive: boolean) {
    await fetch("/api/admin/users", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id, isActive: !isActive }),
    })
    await loadUsers()
  }

  return (
    <div className="app-layout">
      <Sidebar
        userName={session?.user?.name ?? ""}
        userRole={session?.user?.role ?? "ADMIN"}
        activeSessionId={null}
      />

      <main className="app-main" style={{ maxWidth: "800px" }}>
        <h1 className="heading" style={{ marginBottom: "0.3rem" }}>Admin</h1>
        <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)", marginBottom: "2.5rem" }}>
          Nutzerverwaltung
        </p>

        {/* Neuer Nutzer */}
        <div style={{ border: "1px solid var(--border)", padding: "1.75rem", marginBottom: "2.5rem" }}>
          <p className="label" style={{ marginBottom: "1.25rem" }}>
            <UserPlus size={13} style={{ display: "inline", marginRight: "0.4rem" }} />
            Neuen Mitarbeiter anlegen
          </p>

          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "0.4rem" }}>Name</label>
              <input
                className="input"
                placeholder="Max Mustermann"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "0.4rem" }}>Email</label>
              <input
                className="input"
                type="email"
                placeholder="max@showyourself.me"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "0.4rem" }}>Passwort</label>
              <input
                className="input"
                type="password"
                placeholder="Sicheres Passwort"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "0.4rem" }}>Rolle</label>
              <select
                className="input"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "1rem" }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? "Speichern..." : "Mitarbeiter anlegen →"}
              </button>
              {error   && <p style={{ fontSize: "0.78rem", color: "#991b1b" }}>{error}</p>}
              {success && <p style={{ fontSize: "0.78rem", color: "#166534" }}>{success}</p>}
            </div>
          </form>
        </div>

        {/* Nutzer-Liste */}
        <p className="label" style={{ marginBottom: "1rem" }}>Alle Mitarbeiter</p>

        {loading ? (
          <p style={{ color: "var(--fg-faint)", fontSize: "0.82rem" }}>Lade...</p>
        ) : (
          <div style={{ border: "1px solid var(--border)" }}>
            {users.map((user, i) => (
              <div key={user.id} style={{
                display:      "flex",
                alignItems:   "center",
                justifyContent: "space-between",
                padding:      "1rem 1.25rem",
                borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none",
                opacity:      user.isActive ? 1 : 0.5,
              }}>
                <div>
                  <p style={{ fontSize: "0.88rem", fontWeight: 400 }}>{user.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                    {user.email} · {user.role === "ADMIN" ? "Admin" : "Agent"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.08em",
                    padding: "0.2rem 0.5rem",
                    background: user.isActive ? "#f0fdf4" : "#f5f5f5",
                    color:      user.isActive ? "#166534" : "#888",
                  }}>
                    {user.isActive ? "AKTIV" : "INAKTIV"}
                  </span>
                  {user.id !== session?.user?.id && (
                    <button
                      onClick={() => toggleUser(user.id, user.isActive)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-faint)", display: "flex", alignItems: "center" }}
                      title={user.isActive ? "Deaktivieren" : "Aktivieren"}
                    >
                      {user.isActive
                        ? <ToggleRight size={20} style={{ color: "#166534" }} />
                        : <ToggleLeft  size={20} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "#f5f5f5" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", lineHeight: 1.7 }}>
            <strong>Hinweis:</strong> Neue Mitarbeiter können sich sofort unter der Vercel-URL anmelden.
            Teile ihnen die URL und ihr Passwort mit. Beim ersten Login sehen sie die Einführung automatisch.
          </p>
        </div>
      </main>
    </div>
  )
}
