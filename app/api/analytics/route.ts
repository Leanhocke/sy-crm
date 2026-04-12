import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/analytics — Dashboard-Statistiken
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  // Alle Anrufe
  const allCalls = await prisma.call.findMany({
    select: { outcome: true, createdAt: true, userId: true },
  })

  // Lead-Status-Übersicht
  const leadStats = await prisma.lead.groupBy({
    by:   ["status"],
    _count: { id: true },
  })

  // Top-Branchen nach Abschlüssen
  const closedLeads = await prisma.lead.findMany({
    where:   { status: { in: ["INTERESTED", "CLOSED"] } },
    select:  { industry: true, status: true },
  })

  const industryMap: Record<string, { interested: number; closed: number; total: number }> = {}
  for (const l of closedLeads) {
    const key = l.industry ?? "Unbekannt"
    if (!industryMap[key]) industryMap[key] = { interested: 0, closed: 0, total: 0 }
    if (l.status === "INTERESTED") industryMap[key].interested++
    if (l.status === "CLOSED")     industryMap[key].closed++
    industryMap[key].total++
  }

  // Anrufe der letzten 7 Tage
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentCalls = allCalls.filter(c => new Date(c.createdAt) >= sevenDaysAgo)

  // Anrufe pro Tag gruppieren
  const callsPerDay: Record<string, number> = {}
  for (const c of recentCalls) {
    const day = new Date(c.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
    callsPerDay[day] = (callsPerDay[day] ?? 0) + 1
  }

  // Mitarbeiter-Performance
  const agentMap: Record<string, { name: string; calls: number; closed: number }> = {}
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  for (const u of users) agentMap[u.id] = { name: u.name, calls: 0, closed: 0 }
  for (const c of allCalls) {
    if (agentMap[c.userId]) {
      agentMap[c.userId].calls++
      if (c.outcome === "CLOSED") agentMap[c.userId].closed++
    }
  }

  const totalLeads = await prisma.lead.count()
  const closedCount = allCalls.filter(c => c.outcome === "CLOSED").length

  return NextResponse.json({
    totalCalls:    allCalls.length,
    totalLeads,
    closedCount,
    conversionRate: allCalls.length > 0 ? ((closedCount / allCalls.length) * 100).toFixed(1) : "0.0",
    leadStats,
    industryStats:  Object.entries(industryMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.closed - a.closed)
      .slice(0, 8),
    callsPerDay: Object.entries(callsPerDay).map(([date, count]) => ({ date, count })),
    agentStats:  Object.values(agentMap).sort((a, b) => b.calls - a.calls),
  })
}
