import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/leads/[id] — einzelnen Lead mit Call-History
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      calls: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true } } },
      },
    },
  })

  if (!lead) return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 })
  return NextResponse.json(lead)
}

// PATCH /api/leads/[id] — Lead aktualisieren (Status, Notizen, Follow-up)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status, notes, followUpAt } = body

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(status    !== undefined && { status }),
      ...(notes     !== undefined && { notes }),
      ...(followUpAt !== undefined && { followUpAt: followUpAt ? new Date(followUpAt) : null }),
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(lead)
}
