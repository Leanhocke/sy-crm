import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/leads/branchen — alle vorhandenen Branchen zurückgeben
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const rows = await prisma.lead.findMany({
    where:  { branchengruppe: { not: null } },
    select: { branchengruppe: true },
    distinct: ["branchengruppe"],
    orderBy: { branchengruppe: "asc" },
  })

  const branchen = rows.map(r => r.branchengruppe!).filter(Boolean)
  return NextResponse.json(branchen)
}
