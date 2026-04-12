import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import { CallsBarChart, IndustryBarChart } from "@/components/Charts"
import { prisma } from "@/lib/prisma"

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  // Statistiken direkt laden
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/analytics`, {
    headers: { cookie: "" }, // wird über prisma direkt geladen
    cache: "no-store",
  })

  // Fallback: direkt aus DB laden
  const allCalls = await prisma.call.findMany({ select: { outcome: true, createdAt: true, userId: true } })

  const totalLeads  = await prisma.lead.count()
  const closedCount = allCalls.filter(c => c.outcome === "CLOSED").length
  const convRate    = allCalls.length > 0 ? ((closedCount / allCalls.length) * 100).toFixed(1) : "0.0"

  // Lead-Status
  const leadStats = await prisma.lead.groupBy({ by: ["status"], _count: { id: true } })

  // Branchen
  const leads = await prisma.lead.findMany({ select: { industry: true, status: true } })
  const industryMap: Record<string, { interested: number; closed: number }> = {}
  for (const l of leads) {
    const key = l.industry ?? "Unbekannt"
    if (!industryMap[key]) industryMap[key] = { interested: 0, closed: 0 }
    if (l.status === "INTERESTED") industryMap[key].interested++
    if (l.status === "CLOSED")     industryMap[key].closed++
  }
  const industryStats = Object.entries(industryMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.closed - a.closed)
    .slice(0, 8)

  // Anrufe letzte 7 Tage
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentCalls = allCalls.filter(c => new Date(c.createdAt) >= sevenDaysAgo)
  const callsPerDay: Record<string, number> = {}
  for (const c of recentCalls) {
    const day = new Date(c.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
    callsPerDay[day] = (callsPerDay[day] ?? 0) + 1
  }
  const callsChartData = Object.entries(callsPerDay).map(([date, count]) => ({ name: date, count }))

  // Mitarbeiter
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const agentMap: Record<string, { name: string; calls: number; closed: number }> = {}
  for (const u of users) agentMap[u.id] = { name: u.name, calls: 0, closed: 0 }
  for (const c of allCalls) {
    if (agentMap[c.userId]) {
      agentMap[c.userId].calls++
      if (c.outcome === "CLOSED") agentMap[c.userId].closed++
    }
  }
  const agentStats = Object.values(agentMap).sort((a, b) => b.calls - a.calls)

  const activeSession = await prisma.session.findFirst({
    where: { userId: session.user.id, endedAt: null },
  })

  const STATUS_LABELS: Record<string, string> = {
    PENDING:     "Offen",
    NOT_REACHED: "Nicht erreicht",
    NO_INTEREST: "Kein Interesse",
    INTERESTED:  "Interessiert",
    FOLLOW_UP:   "Rückruf",
    CLOSED:      "Abgeschlossen",
  }

  return (
    <div className="app-layout">
      <Sidebar
        userName={session.user.name}
        userRole={session.user.role}
        activeSessionId={activeSession?.id ?? null}
      />

      <main className="app-main">
        <h1 className="heading" style={{ marginBottom: "0.3rem" }}>Statistiken</h1>
        <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)", marginBottom: "2.5rem" }}>
          Gesamtübersicht aller Aktivitäten
        </p>

        {/* Top-Zahlen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "2.5rem" }}>
          {[
            { label: "Gesamte Anrufe",  value: allCalls.length },
            { label: "Leads total",     value: totalLeads },
            { label: "Abschlüsse",      value: closedCount },
            { label: "Conversion-Rate", value: `${convRate}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--bg)", padding: "1.5rem" }}>
              <p className="label" style={{ marginBottom: "0.5rem" }}>{label}</p>
              <p style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 100, letterSpacing: "-0.03em" }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>

          {/* Anrufe letzte 7 Tage */}
          <div style={{ border: "1px solid var(--border)", padding: "1.5rem" }}>
            <p className="label" style={{ marginBottom: "1.25rem" }}>Anrufe — letzte 7 Tage</p>
            {callsChartData.length > 0
              ? <CallsBarChart data={callsChartData} />
              : <p style={{ fontSize: "0.82rem", color: "var(--fg-faint)", textAlign: "center", padding: "2rem 0" }}>Noch keine Daten</p>
            }
          </div>

          {/* Lead-Status Übersicht */}
          <div style={{ border: "1px solid var(--border)", padding: "1.5rem" }}>
            <p className="label" style={{ marginBottom: "1.25rem" }}>Lead-Status</p>
            {leadStats.map(s => {
              const pct = totalLeads > 0 ? (s._count.id / totalLeads) * 100 : 0
              return (
                <div key={s.status} style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{STATUS_LABELS[s.status] ?? s.status}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>{s._count.id}</span>
                  </div>
                  <div style={{ height: 4, background: "#f0f0f0" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--fg)", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

          {/* Top-Branchen */}
          <div style={{ border: "1px solid var(--border)", padding: "1.5rem" }}>
            <p className="label" style={{ marginBottom: "1.25rem" }}>Top-Branchen</p>
            {industryStats.length > 0
              ? <IndustryBarChart data={industryStats} />
              : <p style={{ fontSize: "0.82rem", color: "var(--fg-faint)", textAlign: "center", padding: "2rem 0" }}>Noch keine Daten</p>
            }
          </div>

          {/* Mitarbeiter-Leistung */}
          <div style={{ border: "1px solid var(--border)", padding: "1.5rem" }}>
            <p className="label" style={{ marginBottom: "1.25rem" }}>Team-Leistung</p>
            {agentStats.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "var(--fg-faint)" }}>Noch keine Daten</p>
            ) : (
              <div>
                {agentStats.map((agent, i) => (
                  <div key={agent.name} style={{
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "space-between",
                    padding:      "0.75rem 0",
                    borderBottom: i < agentStats.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{
                        width: 22, height: 22, fontSize: "0.65rem", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: i === 0 ? "var(--fg)" : "#f0f0f0",
                        color:      i === 0 ? "var(--bg)" : "var(--fg-muted)",
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: "0.85rem" }}>{agent.name}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: 400 }}>{agent.calls} Anrufe</p>
                      <p style={{ fontSize: "0.72rem", color: "var(--fg-faint)" }}>
                        {agent.closed} Abschlüsse · {agent.calls > 0 ? ((agent.closed / agent.calls) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
