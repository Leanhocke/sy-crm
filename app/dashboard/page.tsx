import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Sidebar from "@/components/Sidebar"
import StatusBadge from "@/components/StatusBadge"
import Link from "next/link"
import { Phone, Users, TrendingUp, Clock } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Anrufe heute
  const callsToday = await prisma.call.count({
    where: { userId: session.user.id, createdAt: { gte: today } },
  })

  // Offene Leads
  const openLeads = await prisma.lead.count({
    where: { status: { in: ["PENDING", "NOT_REACHED"] } },
  })

  // Heutige Rückrufe
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)
  const followUps = await prisma.lead.findMany({
    where:   { status: "FOLLOW_UP", followUpAt: { gte: today, lte: todayEnd } },
    orderBy: { followUpAt: "asc" },
    take:    10,
  })

  // Aktive Session
  const activeSession = await prisma.session.findFirst({
    where:   { userId: session.user.id, endedAt: null },
    orderBy: { startedAt: "desc" },
  })

  // Conversion-Rate (eigene Anrufe)
  const myTotalCalls = await prisma.call.count({ where: { userId: session.user.id } })
  const myClosedCalls = await prisma.call.count({ where: { userId: session.user.id, outcome: "CLOSED" } })
  const convRate = myTotalCalls > 0 ? ((myClosedCalls / myTotalCalls) * 100).toFixed(1) : "0.0"

  // Letzte Aktivitäten
  const recentCalls = await prisma.call.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take:    5,
    include: { lead: { select: { name: true, company: true } } },
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Guten Morgen" : hour < 17 ? "Guten Tag" : "Guten Abend"

  return (
    <div className="app-layout">
      <Sidebar
        userName={session.user.name}
        userRole={session.user.role}
        activeSessionId={activeSession?.id ?? null}
      />

      <main className="app-main">
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 100, letterSpacing: "-0.02em", marginBottom: "0.3rem" }}>
            {greeting}, {session.user.name.split(" ")[0]}.
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)" }}>
            {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stat-Karten */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "2.5rem" }}>
          {[
            { icon: Phone,      label: "Anrufe heute",   value: callsToday,        sub: "von dir" },
            { icon: Users,      label: "Offene Leads",   value: openLeads,         sub: "zum Anrufen" },
            { icon: TrendingUp, label: "Conversion",     value: `${convRate}%`,    sub: "deine Rate" },
            { icon: Clock,      label: "Rückrufe heute", value: followUps.length,  sub: "geplant" },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} style={{ background: "var(--bg)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Icon size={14} strokeWidth={1.5} style={{ color: "var(--fg-faint)" }} />
                <span className="label">{label}</span>
              </div>
              <p style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 100, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {value}
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--fg-faint)", marginTop: "0.3rem" }}>{sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

          {/* Heutige Rückrufe */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <p className="label">Rückrufe heute</p>
              <Link href="/leads?status=FOLLOW_UP" style={{ fontSize: "0.72rem", color: "var(--fg-muted)", textDecoration: "none" }}>
                Alle →
              </Link>
            </div>

            {followUps.length === 0 ? (
              <div style={{ padding: "2rem", border: "1px solid var(--border)", textAlign: "center" }}>
                <p style={{ fontSize: "0.82rem", color: "var(--fg-faint)" }}>Keine Rückrufe für heute.</p>
              </div>
            ) : (
              <div style={{ border: "1px solid var(--border)" }}>
                {followUps.map((lead, i) => (
                  <Link
                    key={lead.id}
                    href={`/call/${lead.id}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.9rem 1rem",
                      borderBottom: i < followUps.length - 1 ? "1px solid var(--border)" : "none",
                      textDecoration: "none", color: "var(--fg)",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 400 }}>{lead.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{lead.company ?? "—"}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {lead.followUpAt && (
                        <p style={{ fontSize: "0.72rem", color: "var(--fg-faint)" }}>
                          {new Date(lead.followUpAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Letzte Anrufe */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <p className="label">Letzte Anrufe</p>
            </div>

            {recentCalls.length === 0 ? (
              <div style={{ padding: "2rem", border: "1px solid var(--border)", textAlign: "center" }}>
                <p style={{ fontSize: "0.82rem", color: "var(--fg-faint)" }}>Noch keine Anrufe.</p>
                <Link href="/sessions" className="btn btn-outline" style={{ display: "inline-flex", marginTop: "1rem", fontSize: "0.72rem" }}>
                  Session starten →
                </Link>
              </div>
            ) : (
              <div style={{ border: "1px solid var(--border)" }}>
                {recentCalls.map((call, i) => (
                  <div key={call.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.9rem 1rem",
                    borderBottom: i < recentCalls.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 400 }}>{call.lead.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{call.lead.company ?? "—"}</p>
                    </div>
                    {call.outcome && <StatusBadge status={call.outcome} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Session-Hinweis wenn keine aktiv */}
        {!activeSession && (
          <div style={{ marginTop: "2rem", padding: "1.25rem 1.5rem", background: "#f5f5f5", borderLeft: "3px solid var(--fg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.2rem" }}>Keine aktive Session</p>
              <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>Starte eine Session um deine Anrufe zu tracken.</p>
            </div>
            <Link href="/sessions" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
              Session starten →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
