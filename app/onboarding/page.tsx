"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Upload, Phone, CheckSquare, BarChart2, ArrowRight } from "lucide-react"

const STEPS = [
  {
    icon:  Upload,
    step:  "01",
    title: "Leads importieren",
    text:  "Lade deine Excel-Datei unter Leads → Import hoch. Das System erkennt automatisch Name, Firma, Telefonnummer und Branche.",
  },
  {
    icon:  Phone,
    step:  "02",
    title: "Session starten",
    text:  "Starte unter Sessions eine neue Arbeitssitzung — so wird deine Leistung pro Tag getrackt und du siehst wie viele Anrufe du gemacht hast.",
  },
  {
    icon:  CheckSquare,
    step:  "03",
    title: "Anrufen & Ergebnis loggen",
    text:  "Klicke auf einen Lead → Anruf-Modus. Dort siehst du alle Infos, kannst Notizen schreiben und das Ergebnis mit einem Klick speichern.",
  },
  {
    icon:  BarChart2,
    step:  "04",
    title: "Fortschritt verfolgen",
    text:  "Im Dashboard siehst du deine Statistiken: Anrufe heute, Conversion-Rate, beste Branchen und mehr.",
  },
]

const STATUS_INFO = [
  { color: "var(--s-pending-bg)",     fg: "var(--s-pending-fg)",     label: "Offen",          desc: "Noch nicht angerufen" },
  { color: "var(--s-not-reached-bg)", fg: "var(--s-not-reached-fg)", label: "Nicht erreicht", desc: "Wird erneut angezeigt" },
  { color: "var(--s-no-interest-bg)", fg: "var(--s-no-interest-fg)", label: "Kein Interesse", desc: "Abgesagt, bleibt archiviert" },
  { color: "var(--s-interested-bg)",  fg: "var(--s-interested-fg)",  label: "Interessiert",   desc: "Zeigt Interesse" },
  { color: "var(--s-follow-up-bg)",   fg: "var(--s-follow-up-fg)",   label: "Rückruf",        desc: "Termin vereinbart" },
  { color: "var(--s-closed-bg)",      fg: "var(--s-closed-fg)",      label: "Abgeschlossen",  desc: "Wurde Kunde" },
]

export default function OnboardingPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    await fetch("/api/onboarding", { method: "POST" })
    router.push("/dashboard")
  }

  return (
    <div style={{
      minHeight:  "100vh",
      background: "var(--bg)",
      padding:    "clamp(3rem, 8vh, 6rem) clamp(1.5rem, 8vw, 8rem)",
    }}>

      {/* Header */}
      <div style={{ maxWidth: "640px", marginBottom: "4rem" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1rem" }}>
          ShowYourself.me CRM
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 100, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "1.25rem" }}>
          Willkommen.<br />Hier ist alles<br />was du brauchst.
        </h1>
        <p style={{ fontSize: "0.95rem", fontWeight: 300, color: "var(--fg-muted)", lineHeight: 1.7 }}>
          Dieses System hilft dir dabei, strukturiert zu telefonieren, Ergebnisse zu tracken und den Überblick zu behalten. Es dauert eine Minute, bis du alles verstanden hast.
        </p>
      </div>

      {/* 4 Schritte */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "4rem" }}>
        {STEPS.map(({ icon: Icon, step, title, text }) => (
          <div key={step} style={{ background: "var(--bg)", padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.15em", color: "var(--fg-faint)" }}>
                {step}
              </span>
              <Icon size={16} strokeWidth={1.5} style={{ color: "var(--fg)" }} />
            </div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "0.6rem" }}>
              {title}
            </h3>
            <p style={{ fontSize: "0.82rem", fontWeight: 300, color: "var(--fg-muted)", lineHeight: 1.7 }}>
              {text}
            </p>
          </div>
        ))}
      </div>

      {/* Status-Übersicht */}
      <div style={{ maxWidth: "700px", marginBottom: "4rem" }}>
        <p className="label" style={{ marginBottom: "1.25rem" }}>Die 6 Status — was bedeuten sie?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {STATUS_INFO.map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{
                display: "inline-block", width: 130,
                padding: "0.2rem 0.6rem",
                fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                background: s.color, color: s.fg,
                flexShrink: 0,
              }}>
                {s.label}
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--fg-muted)" }}>{s.desc}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--fg-faint)" }}>
          Wichtig: Leads mit Status <strong>Nicht erreicht</strong> bleiben in der aktiven Liste — sie müssen nochmal angerufen werden.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={handleStart}
        disabled={loading}
        className="btn btn-primary"
        style={{ fontSize: "0.85rem", padding: "0.85rem 2rem", gap: "0.6rem" }}
      >
        {loading ? "Einen Moment..." : "Verstanden — loslegen"}
        {!loading && <ArrowRight size={15} />}
      </button>
    </div>
  )
}
