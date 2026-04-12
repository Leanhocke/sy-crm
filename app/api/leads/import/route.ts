import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Normalisiert Telefonnummern für Duplikat-Check
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.\/]/g, "").trim()
}

// POST /api/leads/import — Excel-Daten importieren
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const body = await req.json()
  const { rows, filename } = body as {
    rows: { name?: string; phone?: string; company?: string; industry?: string; city?: string; website?: string }[]
    filename: string
  }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Keine Daten" }, { status: 400 })
  }

  let importedCount  = 0
  let duplicateCount = 0
  const errors: string[] = []

  // Import-Batch anlegen
  const batch = await prisma.importBatch.create({
    data: {
      filename,
      importedBy:    session.user.id,
      totalRows:     rows.length,
      importedCount: 0,
      duplicateCount: 0,
    },
  })

  for (const row of rows) {
    if (!row.phone || !row.name) continue

    const phone = normalizePhone(String(row.phone))
    if (!phone) continue

    try {
      // Website-URL normalisieren (http:// voranstellen falls nötig)
      let website = row.website ? String(row.website).trim() : null
      if (website && !website.startsWith("http")) website = `https://${website}`

      await prisma.lead.create({
        data: {
          name:         String(row.name).trim(),
          phone,
          company:      row.company  ? String(row.company).trim()  : null,
          industry:     row.industry ? String(row.industry).trim() : null,
          city:         row.city     ? String(row.city).trim()     : null,
          website,
          importBatchId: batch.id,
        },
      })
      importedCount++
    } catch (e: unknown) {
      // Unique-Constraint-Fehler = Duplikat
      if (e instanceof Error && e.message.includes("Unique constraint")) {
        duplicateCount++
      } else {
        errors.push(`Fehler bei "${row.name}": ${e instanceof Error ? e.message : "Unbekannt"}`)
      }
    }
  }

  // Batch-Statistiken aktualisieren
  await prisma.importBatch.update({
    where: { id: batch.id },
    data:  { importedCount, duplicateCount },
  })

  return NextResponse.json({ importedCount, duplicateCount, errors })
}
