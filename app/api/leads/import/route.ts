import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Normalisiert Telefonnummern für Duplikat-Check
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.\/]/g, "").trim()
}

// POST /api/leads/import — Excel-Daten importieren (unterstützt Chunked-Import via batchId)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const body = await req.json()
  const { rows, filename, batchId: existingBatchId, totalRows: batchTotalRows } = body as {
    rows: {
      name?: string
      phone?: string
      company?: string
      industry?: string
      branchengruppe?: string
      city?: string
      website?: string
    }[]
    filename: string
    batchId?: string
    totalRows?: number
  }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Keine Daten" }, { status: 400 })
  }

  let importedCount  = 0
  let duplicateCount = 0
  const errors: string[] = []

  // Erster Chunk → neuen Batch anlegen; Folge-Chunks → bestehenden Batch weiterverwenden
  let batchId: string
  if (existingBatchId) {
    batchId = existingBatchId
  } else {
    const batch = await prisma.importBatch.create({
      data: {
        filename,
        importedBy:    session.user.id,
        totalRows:     batchTotalRows ?? rows.length,
        importedCount: 0,
        duplicateCount: 0,
      },
    })
    batchId = batch.id
  }

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
          name:           String(row.name).trim(),
          phone,
          company:        row.company        ? String(row.company).trim()        : null,
          industry:       row.industry       ? String(row.industry).trim()       : null,
          branchengruppe: row.branchengruppe ? String(row.branchengruppe).trim() : null,
          city:           row.city           ? String(row.city).trim()           : null,
          website,
          importBatchId:  batchId,
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

  // Batch-Statistiken kumulativ aktualisieren
  await prisma.importBatch.update({
    where: { id: batchId },
    data:  {
      importedCount:  { increment: importedCount },
      duplicateCount: { increment: duplicateCount },
    },
  })

  return NextResponse.json({ batchId, importedCount, duplicateCount, errors })
}
