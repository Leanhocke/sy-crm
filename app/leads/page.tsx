"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import Sidebar from "@/components/Sidebar"
import StatusBadge from "@/components/StatusBadge"
import Link from "next/link"
import { Search, Upload, Phone, SlidersHorizontal, Globe } from "lucide-react"

interface Lead {
  id: string
  name: string
  phone: string
  company: string | null
  industry: string | null
  city: string | null
  website: string | null
  status: string
  followUpAt: string | null
  lastCalledAt: string | null
  callCount: number
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

export default function LeadsPage() {
  const { data: session } = useSession()
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [loading,  setLoading]  = useState(true)
  const [status,   setStatus]   = useState("ALL")
  const [search,   setSearch]   = useState("")
  const [industry, setIndustry] = useState("")

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== "ALL") params.set("status", status)
    if (search)   params.set("search",   search)
    if (industry) params.set("industry", industry)

    const res = await fetch(`/api/leads?${params}`)
    if (res.ok) setLeads(await res.json())
    setLoading(false)
  }, [status, search, industry])

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300)
    return () => clearTimeout(t)
  }, [fetchLeads])

  const activeSession = null // wird über Sidebar verwaltet

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
          <Link href="/leads/import" className="btn btn-primary" style={{ gap: "0.5rem" }}>
            <Upload size={14} />
            Excel importieren
          </Link>
        </div>

        {/* Filter-Leiste */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {/* Suche */}
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

          {/* Status-Filter */}
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

          {/* Branche */}
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

        {/* Tabelle */}
        <div className="table-container" style={{ border: "1px solid var(--border)" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--fg-faint)", fontSize: "0.82rem" }}>
              Lade Leads...
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--fg-muted)", marginBottom: "1rem" }}>
                Keine Leads gefunden.
              </p>
              <Link href="/leads/import" className="btn btn-outline" style={{ fontSize: "0.75rem" }}>
                Leads importieren →
              </Link>
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
