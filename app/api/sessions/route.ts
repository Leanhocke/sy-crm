import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/sessions — Session-Liste des Nutzers
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const sessions = await prisma.session.findMany({
    where:   { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take:    20,
    include: {
      _count: { select: { calls: true } },
      calls: {
        select: { outcome: true },
      },
    },
  })

  // Aktive Session (noch nicht beendet)
  const active = sessions.find(s => !s.endedAt) ?? null

  return NextResponse.json({ sessions, activeSession: active })
}

// POST /api/sessions — neue Session starten
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const branche: string | null = body.branche ?? null

  // Laufende Session zuerst beenden
  await prisma.session.updateMany({
    where: { userId: session.user.id, endedAt: null },
    data:  { endedAt: new Date() },
  })

  const newSession = await prisma.session.create({
    data: { userId: session.user.id, branche },
  })

  return NextResponse.json(newSession, { status: 201 })
}

// GET /api/sessions/branchen — verfügbare Branchen aus Leads
export async function HEAD(_req: NextRequest) {
  return NextResponse.json({}, { status: 200 })
}
