"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Sidebar from "@/components/Sidebar"
import StatusBadge from "@/components/StatusBadge"
import Link from "next/link"
import { ArrowLeft, Phone, PhoneOff, PhoneCall, Clock, ChevronRight, ExternalLink } from "lucide-react"
import { BRANCHENZEITEN, bewerteBranchen, formatZeit } from "@/lib/branchenzeiten"

interface Call {
  id: string
  outcome: string
  notes: string | null
  createdAt: string
  user: { name: string }
}

interface Lead {
  id: string
  name: string
  phone: string
  company: string | null
  industry: string | null
  branchengruppe: string | null
  city: string | null
  website: string | null
  email: string | null
  status: string
  notes: string | null
  followUpAt: string | null
  callCount: number
  calls: Call[]
}

const OUTCOMES = [
  { key: "NOT_REACHED", label: "Nicht erreicht", cls: "not-reached" },
  { key: "NO_INTEREST",  label: "Kein Interesse", cls: "no-interest" },
  { key: "INTERESTED",   label: "Interessiert",   cls: "interested" },
  { key: "FOLLOW_UP",    label: "Rückruf",         cls: "follow-up" },
  { key: "CLOSED",       label: "Abgeschlossen",  cls: "closed" },
]

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0")
  const s = (sec % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

export default function CallPage() {
  const { id }          = useParams<{ id: string }>()
  const router          = useRouter()
  const { data: session } = useSession()

  const [lead,        setLead]        = useState<Lead | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [calling,     setCalling]     = useState(false)
  const [duration,    setDuration]    = useState(0)
  const [startedAt,   setStartedAt]   = useState<Date | null>(null)
  const [notes,       setNotes]       = useState("")
  const [emailDraft,  setEmailDraft]  = useState("")
  const [outcome,     setOutcome]     = useState("")
  const [followUpAt,  setFollowUpAt]  = useState("")
  const [saving,      setSaving]      = useState(false)
  const [activeSession, setActiveSession] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Lead laden
  const loadLead = useCallback(async () => {
    const res = await fetch(`/api/leads/${id}`)
    if (res.ok) {
      const data = await res.json()
      setLead(data)
      setNotes(data.notes ?? "")
    }
    setLoading(false)
  }, [id])

  // Aktive Session laden
  const loadSession = useCallback(async () => {
    const res = await fetch("/api/sessions")
    if (res.ok) {
      const { activeSession: active } = await res.json()
      setActiveSession(active?.id ?? null)
    }
  }, [])

  useEffect(() => {
    loadLead()
    loadSession()
  }, [loadLead, loadSession])

  // Timer starten
  function startCall() {
    setCalling(true)
    setStartedAt(new Date())
    setDuration(0)
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
  }

  // Timer stoppen
  function stopCall() {
    setCalling(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // Ergebnis speichern
  async function saveOutcome() {
    if (!outcome) return
    setSaving(true)

    if (calling) stopCall()

    const res = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId:     id,
        sessionId:  activeSession,
        startedAt:  startedAt?.toISOString(),
        durationSec: duration,
        outcome,
        notes:      notes || null,
        emailDraft: emailDraft || null,
        followUpAt: followUpAt || null,
      }),
    })

    if (res.ok) {
      const { nextLead } = await res.json()
      if (nextLead) {
        // Automatisch zum nächsten Lead
        router.push(`/call/${nextLead.id}`)
      } else {
        router.push("/leads")
      }
    }
    setSaving(false)
  }

  if (loading || !lead) {
    return (
      <div className="app-layout">
        <Sidebar userName="" userRole="AGENT" activeSessionId={null} />
        <main className="app-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--fg-faint)" }}>Lade Lead...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        userName={session?.user?.name ?? ""}
        userRole={session?.user?.role ?? "AGENT"}
        activeSessionId={activeSession}
      />

      <main className="app-main" style={{ maxWidth: "900px" }}>
        {/* Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <Link href="/leads" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--fg-muted)", textDecoration: "none" }}>
            <ArrowLeft size={13} /> Zurück zur Liste
          </Link>
          {calling && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.9rem", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#166534", display: "inline-block", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#166534", fontFamily: "monospace" }}>
                <Clock size={12} style={{ display: "inline", marginRight: "0.3rem" }} />
                {formatDuration(duration)}
              </span>
            </div>
          )}
        </div>

        {/* Lead-Karte */}
        <div style={{ border: "1px solid var(--border)", padding: "2rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)", fontWeight: 100, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "0.4rem" }}>
                {lead.name}
              </h1>
              {lead.company && (
                <p style={{ fontSize: "1rem", fontWeight: 300, color: "var(--fg-muted)", marginBottom: "0.15rem" }}>
                  {lead.company}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.9rem" }}>
                {lead.city && (
                  <p className="label">{lead.city}</p>
                )}
                {lead.industry && (
                  <p className="label">{lead.industry}</p>
                )}
              </div>

              {/* Website — prominent, vor dem Anruf besuchen */}
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:        "inline-flex",
                    alignItems:     "center",
                    gap:            "0.5rem",
                    padding:        "0.55rem 1rem",
                    marginBottom:   "1rem",
                    background:     "var(--fg)",
                    color:          "var(--bg)",
                    textDecoration: "none",
                    fontSize:       "0.75rem",
                    fontWeight:     500,
                    letterSpacing:  "0.08em",
                    textTransform:  "uppercase",
                  }}
                >
                  <ExternalLink size={12} />
                  Website besuchen — {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}

              {/* Telefon — großer klickbarer Link */}
              <a
                href={`tel:${lead.phone}`}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  gap:            "0.5rem",
                  fontSize:       "1.4rem",
                  fontFamily:     "monospace",
                  fontWeight:     400,
                  color:          "var(--fg)",
                  textDecoration: "none",
                  letterSpacing:  "0.02em",
                }}
              >
                <Phone size={18} strokeWidth={1.5} />
                {lead.phone}
              </a>

              {lead.email && (
                <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "var(--fg-muted)" }}>
                  {lead.email}
                </p>
              )}

              {/* Branchenzeiten-Hinweis */}
              {lead.branchengruppe && BRANCHENZEITEN[lead.branchengruppe] && (() => {
                const bewertungen = bewerteBranchen()
                const b = bewertungen.find(x => x.gruppe === lead.branchengruppe)
                const info = BRANCHENZEITEN[lead.branchengruppe]
                const statusColor =
                  b?.status === "ideal"   ? { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", dot: "#16a34a" } :
                  b?.status === "okay"    ? { bg: "#fffbeb", border: "#fde68a", text: "#92400e", dot: "#d97706" } :
                                           { bg: "#f5f5f5", border: "var(--border)", text: "var(--fg-muted)", dot: "#aaa" }
                return (
                  <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: statusColor.bg, border: `1px solid ${statusColor.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor.dot, display: "inline-block", flexShrink: 0 }} />
                      <p style={{ fontSize: "0.72rem", fontWeight: 500, color: statusColor.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {lead.branchengruppe} ·{" "}
                        {b?.status === "ideal" ? "Jetzt ist ideal zum Anrufen" :
                         b?.status === "okay"  ? "Bald optimales Zeitfenster" :
                                                 "Aktuell ungünstiger Zeitpunkt"}
                      </p>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: statusColor.text, marginLeft: "1.1rem" }}>
                      {info.zeiten.map((z, i) => (
                        <span key={i}>{i > 0 ? " · " : ""}{formatZeit(z.vonH, z.vonM)}–{formatZeit(z.bisH, z.bisM)}</span>
                      ))}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: statusColor.text, marginLeft: "1.1rem", marginTop: "0.2rem", opacity: 0.8 }}>
                      {info.tipp}
                    </p>
                    {b?.status !== "ideal" && b?.naechstesFenster && (
                      <p style={{ fontSize: "0.72rem", color: statusColor.text, marginLeft: "1.1rem", marginTop: "0.2rem" }}>
                        Nächstes Fenster: {formatZeit(b.naechstesFenster.vonH, b.naechstesFenster.vonM)} Uhr
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>

            <div style={{ textAlign: "right" }}>
              <StatusBadge status={lead.status} />
              <p style={{ fontSize: "0.72rem", color: "var(--fg-faint)", marginTop: "0.5rem" }}>
                {lead.callCount}× angerufen
              </p>
              {lead.followUpAt && (
                <p style={{ fontSize: "0.72rem", color: "var(--s-follow-up-fg)", marginTop: "0.25rem" }}>
                  Rückruf: {new Date(lead.followUpAt).toLocaleDateString("de-DE")}
                </p>
              )}
            </div>
          </div>

          <div className="divider" />

          {/* Anruf starten/stoppen */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {!calling ? (
              <button className="btn btn-primary" onClick={startCall} style={{ gap: "0.5rem" }}>
                <PhoneCall size={14} />
                Anruf starten
              </button>
            ) : (
              <button className="btn btn-danger" onClick={stopCall} style={{ gap: "0.5rem" }}>
                <PhoneOff size={14} />
                Anruf beenden
              </button>
            )}
          </div>
        </div>

        {/* Notizen + E-Mail */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)", marginBottom: "1.5rem" }}>
          <div style={{ background: "var(--bg)", padding: "1.5rem" }}>
            <p className="label" style={{ marginBottom: "0.75rem" }}>Notizen zum Gespräch</p>
            <textarea
              className="input"
              style={{ minHeight: "140px", fontSize: "0.85rem" }}
              placeholder="Was wurde besprochen? Einwände, Interessen, nächste Schritte..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div style={{ background: "var(--bg)", padding: "1.5rem" }}>
            <p className="label" style={{ marginBottom: "0.75rem" }}>E-Mail Entwurf</p>
            <textarea
              className="input"
              style={{ minHeight: "140px", fontSize: "0.85rem" }}
              placeholder="Inhalt der E-Mail die du nach dem Gespräch versenden möchtest..."
              value={emailDraft}
              onChange={e => setEmailDraft(e.target.value)}
            />
          </div>
        </div>

        {/* Ergebnis-Buttons */}
        <div style={{ border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p className="label" style={{ marginBottom: "1rem" }}>Ergebnis des Gesprächs</p>
          <div style={{ display: "flex", gap: "1px", background: "var(--border)" }}>
            {OUTCOMES.map(o => (
              <button
                key={o.key}
                className={`outcome-btn ${o.cls} ${outcome === o.key ? "active" : ""}`}
                onClick={() => setOutcome(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Rückruf-Datum */}
          {outcome === "FOLLOW_UP" && (
            <div style={{ marginTop: "1rem" }}>
              <label className="label" style={{ display: "block", marginBottom: "0.4rem" }}>
                Rückruf-Termin
              </label>
              <input
                type="datetime-local"
                className="input"
                style={{ maxWidth: "260px" }}
                value={followUpAt}
                onChange={e => setFollowUpAt(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Speichern */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            className="btn btn-primary"
            onClick={saveOutcome}
            disabled={!outcome || saving}
            style={{ opacity: (!outcome || saving) ? 0.4 : 1, gap: "0.5rem" }}
          >
            {saving ? "Speichern..." : "Speichern & nächster Lead"}
            {!saving && <ChevronRight size={14} />}
          </button>
          {!outcome && (
            <p style={{ fontSize: "0.75rem", color: "var(--fg-faint)" }}>
              Bitte zuerst ein Ergebnis wählen.
            </p>
          )}
        </div>

        {/* Anruf-Verlauf */}
        {lead.calls.length > 0 && (
          <div style={{ marginTop: "2.5rem" }}>
            <p className="label" style={{ marginBottom: "1rem" }}>Bisherige Anrufe</p>
            <div style={{ border: "1px solid var(--border)" }}>
              {lead.calls.map((call, i) => (
                <div key={call.id} style={{
                  padding:     "0.9rem 1rem",
                  borderBottom: i < lead.calls.length - 1 ? "1px solid var(--border)" : "none",
                  display:     "flex",
                  gap:         "1rem",
                  alignItems:  "flex-start",
                }}>
                  <div style={{ flexShrink: 0 }}>
                    {call.outcome && <StatusBadge status={call.outcome} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    {call.notes && (
                      <p style={{ fontSize: "0.82rem", color: "var(--fg)", marginBottom: "0.25rem" }}>{call.notes}</p>
                    )}
                    <p style={{ fontSize: "0.72rem", color: "var(--fg-faint)" }}>
                      {call.user.name} · {new Date(call.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
