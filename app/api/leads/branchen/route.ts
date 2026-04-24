import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ALLE_BRANCHENGRUPPEN } from "@/lib/branchenzeiten"

// GET /api/leads/branchen — nur vordefinierte Kategorien zurückgeben die Leads haben
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  // Welche vordefinierten Kategorien haben überhaupt Leads?
  const counts = await prisma.lead.groupBy({
    by:     ["branchengruppe"],
    where:  { branchengruppe: { in: ALLE_BRANCHENGRUPPEN } },
    _count: { id: true },
  })

  const mitLeads = new Set(counts.map(c => c.branchengruppe!))

  // Reihenfolge der vordefinierten Kategorien beibehalten, nur mit Leads
  const branchen = ALLE_BRANCHENGRUPPEN.filter(b => mitLeads.has(b))

  return NextResponse.json(branchen)
}
