import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/leads/export-followup — CSV-Export aller Leads mit Follow-up Mail
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const leads = await prisma.lead.findMany({
    where:   { needsFollowUpMail: true },
    orderBy: { updatedAt: "desc" },
    select: {
      name:          true,
      company:       true,
      email:         true,
      phone:         true,
      website:       true,
      industry:      true,
      branchengruppe: true,
      city:          true,
      status:        true,
      notes:         true,
      lastCalledAt:  true,
    },
  })

  const STATUS_LABELS: Record<string, string> = {
    PENDING:     "Offen",
    NOT_REACHED: "Nicht erreicht",
    NO_INTEREST: "Kein Interesse",
    INTERESTED:  "Interessiert",
    FOLLOW_UP:   "Rückruf",
    CLOSED:      "Abgeschlossen",
  }

  const header = ["Name", "Firma", "E-Mail", "Telefon", "Website", "Branche", "Branchengruppe", "Stadt", "Status", "Notizen", "Zuletzt angerufen"]
  const rows = leads.map(l => [
    l.name,
    l.company ?? "",
    l.email ?? "",
    l.phone,
    l.website ?? "",
    l.industry ?? "",
    l.branchengruppe ?? "",
    l.city ?? "",
    STATUS_LABELS[l.status] ?? l.status,
    (l.notes ?? "").replace(/\n/g, " "),
    l.lastCalledAt ? new Date(l.lastCalledAt).toLocaleDateString("de-DE") : "",
  ])

  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="followup-mails-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
