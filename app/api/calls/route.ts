import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/calls — Anruf abschließen und speichern
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const body = await req.json()
  const { leadId, sessionId, startedAt, durationSec, outcome, notes, emailDraft, followUpAt, needsFollowUpMail } = body

  if (!leadId || !outcome) {
    return NextResponse.json({ error: "leadId und outcome sind erforderlich" }, { status: 400 })
  }

  // Anruf speichern
  const call = await prisma.call.create({
    data: {
      leadId,
      userId:     session.user.id,
      sessionId:  sessionId ?? null,
      startedAt:  startedAt ? new Date(startedAt) : new Date(),
      endedAt:    new Date(),
      durationSec: durationSec ?? null,
      outcome,
      notes:      notes     ?? null,
      emailDraft: emailDraft ?? null,
    },
  })

  // Lead-Status und Metadaten aktualisieren
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status:           outcome,
      lastCalledAt:     new Date(),
      callCount:        { increment: 1 },
      needsFollowUpMail: needsFollowUpMail === true,
      ...(followUpAt && { followUpAt: new Date(followUpAt) }),
    },
  })

  // Session-Counter aktualisieren
  if (sessionId) {
    await prisma.session.update({
      where: { id: sessionId },
      data:  { totalCalls: { increment: 1 } },
    })
  }

  // Branche der aktuellen Session ermitteln (für gefilterten nächsten Lead)
  let sessionBranche: string | null = null
  if (sessionId) {
    const activeSession = await prisma.session.findUnique({
      where:  { id: sessionId },
      select: { branche: true },
    })
    sessionBranche = activeSession?.branche ?? null
  }

  // Nächsten offenen Lead zurückgeben (gefiltert nach Branche wenn gesetzt)
  const nextLead = await prisma.lead.findFirst({
    where: {
      status: { in: ["PENDING", "NOT_REACHED"] },
      id:     { not: leadId },
      ...(sessionBranche && { branchengruppe: sessionBranche }),
    },
    orderBy: [
      { followUpAt: "asc" },
      { createdAt:  "asc" },
    ],
  })

  return NextResponse.json({ call, nextLead })
}
