"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import Sidebar from "@/components/Sidebar"
import StatusBadge from "@/components/StatusBadge"
import Link from "next/link"
import { Search, Upload, Phone, SlidersHorizontal, Globe, Download } from "lucide-react"

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  company: string | null
  industry: string | null
  city: string | null
  website: string | null
  status: string
  followUpAt: string | null
  lastCalledAt: string | null
  callCount: number
  needsFollowUpMail: boolean
  _count: { calls: number }
}

const STATUS_OPTIONS = [
  { value: "ALL",         label: "Alle" },
  { value: "PENDING",     label: "Offen" },
  { value: "NOT_REACHED", label: "Nicht erreicht" },
  { value: "NO_INTEREST", label: "Kein Interesse" },
  { value: "INTERESTED",  label: "Interessiert" },
  { value: "FOLLOW_UP",   label: "Rückruf" },
  { value: "CLOSED",      label: "Abgeschlossen" },
]

type Tab = "offen" | "gecalled" | "followup"

export default function LeadsPage() {
  const { data: session } = useSession()
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<Tab>("offen")
  const [status,   setStatus]   = useState("ALL")
  const [search,   setSearch]   = useState("")
  const [industry, setIndustry] = useState("")

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()

    if (tab === "offen") {
      // Nur noch nicht angerufene
      params.set("called", "false")
      if (status !== "ALL") params.set("status", status)
    } else if (tab === "gecalled") {
      params.set("called", "true")
      if (status !== "ALL") params.set("status", status)
    } else if (tab === "followup") {
      params.set("followUpMail", "true")
    }

    if (search)   params.set("search",   search)
    if (industry) params.set("industry", industry)

    const res = await fetch(`/api/leads?${params}`)
    if (res.ok) setLeads(await res.json())
    setLoading(false)
  }, [tab, status, search, industry])

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300)
    return () => clearTimeout(t)
  }, [fetchLeads])

  // Bei Tab-Wechsel Status-Filter zurücksetzen
  function switchTab(next: Tab) {
    setTab(next)
    setStatus("ALL")
  }

  function downloadCSV() {
    window.open("/api/leads/export-followup", "_blank")
  }

  const activeSession = null

  const tabStyle = (active: boolean) => ({
    padding:       "0.5rem 1rem",
    fontSize:      "0.75rem",
    fontWeight:    active ? 600 : 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    background:    active ? "var(--fg)" : "transparent",
    color:         active ? "var(--bg)" : "var(--fg-muted)",
    border:        "1px solid var(--border)",
    borderRight:   "none",
    cursor:        "pointer",
  })

  return (
    <div className="app-layout">
      <Sidebar
        userName={session?.user?.name ?? ""}
        userRole={session?.user?.role ?? "AGENT"}
        activeSessionId={activeSession}
      />

      <main className="app-main">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 className="heading" style={{ marginBottom: "0.3rem" }}>Leads</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)" }}>{leads.length} angezeigt</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {tab === "followup" && (
              <button onClick={downloadCSV} className="btn btn-outline" style={{ gap: "0.5rem" }}>
                <Download size={14} />
                CSV herunterladen
              </button>
            )}
            <Link href="/leads/import" className="btn btn-primary" style={{ gap: "0.5rem" }}>
              <Upload size={14} />
              Excel importieren
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: "1.5rem" }}>
          <button style={{ ...tabStyle(tab === "offen"), borderRadius: 0 }} onClick={() => switchTab("offen")}>
            Offen
          </button>
          <button style={{ ...tabStyle(tab === "gecalled"), borderRadius: 0 }} onClick={() => switchTab("gecalled")}>
            Gecalled
          </button>
          <button style={{ ...tabStyle(tab === "followup"), borderRadius: 0, borderRight: "1px solid var(--border)" }} onClick={() => switchTab("followup")}>
            Follow-up Mails
          </button>
        </div>

        {/* Filter-Leiste (nur für offen/gecalled) */}
        {tab !== "followup" && (
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 220px" }}>
              <Search size={13} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-faint)" }} />
              <input
                className="input"
                style={{ paddingLeft: "2.2rem" }}
                placeholder="Name, Firma, Telefon..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="input"
              style={{ flex: "0 0 180px" }}
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div style={{ position: "relative", flex: "0 0 180px" }}>
              <SlidersHorizontal size={13} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-faint)" }} />
              <input
                className="input"
                style={{ paddingLeft: "2.2rem" }}
                placeholder="Branche..."
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Follow-up Suchleiste */}
        {tab === "followup" && (
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ position: "relative", flex: "1 1 220px" }}>
              <Search size={13} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-faint)" }} />
              <input
                className="input"
                style={{ paddingLeft: "2.2rem" }}
                placeholder="Name, Firma, Telefon..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tabelle */}
        <div className="table-container" style={{ border: "1px solid var(--border)" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--fg-faint)", fontSize: "0.82rem" }}>
              Lade Leads...
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--fg-muted)", marginBottom: "1rem" }}>
                {tab === "offen"    && "Keine offenen Leads."}
                {tab === "gecalled" && "Noch keine gecallten Leads."}
                {tab === "followup" && "Keine Leads mit Follow-up Mail."}
              </p>
              {tab === "offen" && (
                <Link href="/leads/import" className="btn btn-outline" style={{ fontSize: "0.75rem" }}>
                  Leads importieren →
                </Link>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Firma</th>
                  <th>Stadt</th>
                  <th>Telefon</th>
                  <th>Branche</th>
                  <th>Status</th>
                  <th>Anrufe</th>
                  {tab === "followup" && <th>E-Mail</th>}
                  <th>Website</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 400 }}>{lead.name}</td>
                    <td style={{ color: "var(--fg-muted)" }}>{lead.company ?? "—"}</td>
                    <td style={{ color: "var(--fg-muted)", fontSize: "0.82rem" }}>{lead.city ?? "—"}</td>
                    <td>
                      <a
                        href={`tel:${lead.phone}`}
                        style={{ color: "var(--fg)", textDecoration: "none", fontFamily: "monospace", fontSize: "0.82rem" }}
                      >
                        {lead.phone}
                      </a>
                    </td>
                    <td style={{ color: "var(--fg-muted)", fontSize: "0.82rem" }}>{lead.industry ?? "—"}</td>
                    <td><StatusBadge status={lead.status} /></td>
                    <td style={{ color: "var(--fg-faint)", fontSize: "0.82rem" }}>{lead._count.calls}×</td>
                    {tab === "followup" && (
                      <td style={{ fontSize: "0.82rem", color: lead.status === "INTERESTED" ? "var(--fg)" : "var(--fg-muted)" }}>
                        {lead.email ?? "—"}
                      </td>
                    )}
                    <td>
                      {lead.website ? (
                        <a
                          href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={lead.website}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                            padding: "0.3rem 0.8rem",
                            fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.06em",
                            textTransform: "uppercase", textDecoration: "none",
                            color: "var(--fg)", border: "1px solid var(--border)",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "var(--fg)"; e.currentTarget.style.color = "var(--bg)" }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg)" }}
                        >
                          <Globe size={11} />
                          Website
                        </a>
                      ) : (
                        <span style={{ color: "var(--fg-faint)", fontSize: "0.82rem" }}>—</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/call/${lead.id}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.3rem 0.8rem",
                          fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.06em",
                          textTransform: "uppercase", textDecoration: "none",
                          color: "var(--fg)", border: "1px solid var(--border)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--fg)"; e.currentTarget.style.color = "var(--bg)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg)" }}
                      >
                        <Phone size={11} />
                        Anrufen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
