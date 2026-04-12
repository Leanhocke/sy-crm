import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/sessions/[id] — Session beenden
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id } = await params
  const updated = await prisma.session.update({
    where: { id, userId: session.user.id },
    data:  { endedAt: new Date() },
  })

  return NextResponse.json(updated)
}
