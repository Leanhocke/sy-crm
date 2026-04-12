"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import Sidebar from "@/components/Sidebar"
import { Play, Square, Clock } from "lucide-react"

interface Session {
  id: string
  startedAt: string
  endedAt: string | null
  totalCalls: number
  calls: { outcome: string }[]
}

function outcomeLabel(o: string) {
  const map: Record<string, string> = {
    NOT_REACHED: "Nicht erreicht",
    NO_INTEREST: "Kein Interesse",
    INTERESTED:  "Interessiert",
    FOLLOW_UP:   "Rückruf",
    CLOSED:      "Abgeschlossen",
    VOICEMAIL:   "Mailbox",
    WRONG_NUMBER:"Falsche Nr.",
  }
  return map[o] ?? o
}

function formatDuration(start: string, end: string | null) {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime()
  const h  = Math.floor(ms / 3600000)
  const m  = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

export default function SessionsPage() {
  const { data: session } = useSession()
  const [sessions,       setSessions]       = useState<Session[]>([])
  const [activeSession,  setActiveSession]  = useState<Session | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [actionLoading,  setActionLoading]  = useState(false)

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/sessions")
    if (res.ok) {
      const { sessions: list, activeSession: active } = await res.json()
      setSessions(list)
      setActiveSession(active)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])

  async function startSession() {
    setActionLoading(true)
    await fetch("/api/sessions", { method: "POST" })
    await loadSessions()
    setActionLoading(false)
  }

  async function stopSession() {
    if (!activeSession) return
    setActionLoading(true)
    await fetch(`/api/sessions/${activeSession.id}`, { method: "PATCH" })
    await loadSessions()
    setActionLoading(false)
  }

  return (
    <div className="app-layout">
      <Sidebar
        userName={session?.user?.name ?? ""}
        userRole={session?.user?.role ?? "AGENT"}
        activeSessionId={activeSession?.id ?? null}
      />

      <main className="app-main">
        <h1 className="heading" style={{ marginBottom: "0.3rem" }}>Sessions</h1>
        <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)", marginBottom: "2.5rem" }}>
          Starte eine Session wenn du anfängst zu telefonieren. So werden deine Anrufe getrackt.
        </p>

        {/* Aktive Session */}
        <div style={{ border: "1px solid var(--border)", padding: "2rem", marginBottom: "2.5rem" }}>
          <p className="label" style={{ marginBottom: "1rem" }}>Aktuelle Session</p>

          {activeSession ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#166534", display: "inline-block" }} />
                <span style={{ fontSize: "0.9rem", fontWeight: 400 }}>Session aktiv</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "2rem", marginBottom: "1.5rem" }}>
                <div>
                  <p className="label">Gestartet</p>
                  <p style={{ fontSize: "1rem", fontWeight: 300, marginTop: "0.25rem" }}>
                    {new Date(activeSession.startedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                  </p>
                </div>
                <div>
                  <p className="label">Dauer</p>
                  <p style={{ fontSize: "1rem", fontWeight: 300, marginTop: "0.25rem" }}>
                    {formatDuration(activeSession.startedAt, null)}
                  </p>
                </div>
                <div>
                  <p className="label">Anrufe</p>
                  <p style={{ fontSize: "1rem", fontWeight: 300, marginTop: "0.25rem" }}>
                    {activeSession.totalCalls}
                  </p>
                </div>
              </div>
              <button className="btn btn-outline" onClick={stopSession} disabled={actionLoading} style={{ gap: "0.5rem" }}>
                <Square size={13} />
                {actionLoading ? "..." : "Session beenden"}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--fg-faint)" }}>
                <Clock size={14} strokeWidth={1.5} />
                <span style={{ fontSize: "0.82rem" }}>Keine aktive Session</span>
              </div>
              <button className="btn btn-primary" onClick={startSession} disabled={actionLoading} style={{ gap: "0.5rem" }}>
                <Play size={13} />
                {actionLoading ? "..." : "Session starten"}
              </button>
            </div>
          )}
        </div>

        {/* Session-Verlauf */}
        <p className="label" style={{ marginBottom: "1rem" }}>Verlauf</p>

        {loading ? (
          <p style={{ color: "var(--fg-faint)", fontSize: "0.82rem" }}>Lade...</p>
        ) : sessions.filter(s => s.endedAt).length === 0 ? (
          <p style={{ color: "var(--fg-faint)", fontSize: "0.82rem" }}>Noch keine abgeschlossenen Sessions.</p>
        ) : (
          <div style={{ border: "1px solid var(--border)" }}>
            {sessions.filter(s => s.endedAt).map((s, i, arr) => {
              // Outcome-Zusammenfassung
              const outcomes: Record<string, number> = {}
              s.calls.forEach(c => { outcomes[c.outcome] = (outcomes[c.outcome] ?? 0) + 1 })

              return (
                <div key={s.id} style={{
                  padding:      "1.25rem 1.5rem",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "0.88rem", fontWeight: 400, marginBottom: "0.25rem" }}>
                        {new Date(s.startedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                        {new Date(s.startedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {s.endedAt ? new Date(s.endedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "?"} Uhr
                        {" · "}{formatDuration(s.startedAt, s.endedAt)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "1.2rem", fontWeight: 100, letterSpacing: "-0.02em" }}>{s.totalCalls}</p>
                      <p className="label">Anrufe</p>
                    </div>
                  </div>
                  {Object.keys(outcomes).length > 0 && (
                    <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {Object.entries(outcomes).map(([outcome, count]) => (
                        <span key={outcome} style={{
                          fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.06em",
                          padding: "0.2rem 0.5rem",
                          background: "#f5f5f5", color: "var(--fg-muted)",
                        }}>
                          {outcomeLabel(outcome)}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
