import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET /api/admin/users — alle Nutzer (nur Admin)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(users)
}

// POST /api/admin/users — neuen Nutzer anlegen (nur Admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 })
  }

  const body = await req.json()
  const { name, email, password, role } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, Email und Passwort sind erforderlich" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email bereits vergeben" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role ?? "AGENT" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}

// PATCH /api/admin/users — Nutzer deaktivieren/aktivieren
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 })
  }

  const body = await req.json()
  const { id, isActive } = body

  if (id === session.user.id) {
    return NextResponse.json({ error: "Du kannst dich nicht selbst deaktivieren" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data:  { isActive },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })

  return NextResponse.json(user)
}
