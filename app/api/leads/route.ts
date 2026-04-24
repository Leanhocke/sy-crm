import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/leads — alle Leads abrufen (mit Filtern)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status      = searchParams.get("status")
  const industry    = searchParams.get("industry")
  const search      = searchParams.get("search")
  const called      = searchParams.get("called")      // "true" | "false"
  const followUpMail = searchParams.get("followUpMail") // "true"

  const where: Record<string, unknown> = {}

  if (followUpMail === "true") {
    where.needsFollowUpMail = true
  } else if (called === "false") {
    where.callCount = 0
  } else if (called === "true") {
    where.callCount = { gt: 0 }
  }

  if (status && status !== "ALL") {
    where.status = status
  }
  if (industry) {
    where.industry = { contains: industry, mode: "insensitive" }
  }
  if (search) {
    where.OR = [
      { name:    { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { phone:   { contains: search, mode: "insensitive" } },
    ]
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      _count: { select: { calls: true } },
    },
    take: 200,
  })

  return NextResponse.json(leads)
}
