"use client"

export const dynamic = "force-dynamic"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import Sidebar from "@/components/Sidebar"
import Link from "next/link"
import * as XLSX from "xlsx"
import { Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { ALLE_BRANCHENGRUPPEN } from "@/lib/branchenzeiten"

interface PreviewRow {
  name: string
  phone: string
  company: string
  industry: string
  branchengruppe: string
  city: string
  website: string
}

// Erkennt automatisch die richtige Spalte
function detectColumn(headers: string[], keywords: string[]): string {
  const h = headers.map(h => h?.toString().toLowerCase() ?? "")
  for (const key of keywords) {
    const idx = h.findIndex(col => col.includes(key))
    if (idx !== -1) return headers[idx]
  }
  return headers[0] ?? ""
}

// Normalisiert Telefonnummern (gleiche Logik wie im API)
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.\/]/g, "").trim()
}

const CHUNK_SIZE = 30

export default function ImportPage() {
  const { data: session } = useSession()
  const [step,      setStep]      = useState<"upload" | "preview" | "importing" | "done">("upload")
  const [rows,      setRows]      = useState<PreviewRow[]>([])
  const [filename,  setFilename]  = useState("")
  const [result,    setResult]    = useState<{ importedCount: number; duplicateCount: number } | null>(null)
  const [dragOver,  setDragOver]  = useState(false)

  // Fortschritt
  const [progress,       setProgress]       = useState(0)
  const [processedRows,  setProcessedRows]  = useState(0)
  const [runImported,    setRunImported]    = useState(0)
  const [runDuplicates,  setRunDuplicates]  = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  function parseFile(file: File) {
    setFilename(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data     = new Uint8Array(e.target!.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheet    = workbook.Sheets[workbook.SheetNames[0]]
      const json     = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, string>[]

      if (!json.length) return

      const headers = Object.keys(json[0])

      // Automatische Spaltenerkennung
      const nameCol           = detectColumn(headers, ["name", "vorname", "nachname", "kontakt", "ansprechpartner", "firmenname"])
      const phoneCol          = detectColumn(headers, ["telefon", "tel", "handy", "mobile", "phone", "nummer", "mobil"])
      const companyCol        = detectColumn(headers, ["firma", "unternehmen", "company", "organisation", "firmenname"])
      const industryCol       = detectColumn(headers, ["kategorie", "branche", "industrie", "industry", "bereich", "sektor"])
      const branchengruppeCol = detectColumn(headers, ["branchengruppe", "branchengrupe", "gruppe", "branchenbereich"])
      const cityCol           = detectColumn(headers, ["ort", "stadt", "city", "standort", "location"])
      const websiteCol        = detectColumn(headers, ["website-status", "website", "webseite", "url", "homepage", "web", "link", "internetseite"])

      const parsed: PreviewRow[] = json
        .map(row => ({
          name:           String(row[nameCol]           ?? "").trim(),
          phone:          String(row[phoneCol]          ?? "").trim(),
          company:        String(row[companyCol]        ?? "").trim(),
          industry:       String(row[industryCol]       ?? "").trim(),
          branchengruppe: String(row[branchengruppeCol] ?? "").trim(),
          city:           String(row[cityCol]           ?? "").trim(),
          website:        String(row[websiteCol]        ?? "").trim(),
        }))
        .filter(r => r.name && r.phone)

      setRows(parsed)
      setStep("preview")
    }
    reader.readAsArrayBuffer(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  // Duplikat-Vorprüfung: zählt doppelte Nummern innerhalb der Excel-Datei selbst
  function countInternalDuplicates(): number {
    const seen = new Set<string>()
    let dupes = 0
    for (const row of rows) {
      const norm = normalizePhone(row.phone)
      if (seen.has(norm)) dupes++
      else seen.add(norm)
    }
    return dupes
  }

  // Branchengruppen-Übersicht
  function getBranchenStats(): { gruppe: string; count: number }[] {
    const map: Record<string, number> = {}
    for (const row of rows) {
      const g = row.branchengruppe || "Ohne Branchengruppe"
      map[g] = (map[g] ?? 0) + 1
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([gruppe, count]) => ({ gruppe, count }))
  }

  async function handleImport() {
    setStep("importing")
    setProgress(0)
    setProcessedRows(0)
    setRunImported(0)
    setRunDuplicates(0)

    const total     = rows.length
    let batchId: string | undefined
    let totalImported  = 0
    let totalDuplicates = 0

    // Dedupliziere zuerst innerhalb der Excel-Datei (gleiche Telefonnummer mehrfach)
    const seen = new Set<string>()
    const uniqueRows = rows.filter(row => {
      const norm = normalizePhone(row.phone)
      if (seen.has(norm)) return false
      seen.add(norm)
      return true
    })

    const chunks: PreviewRow[][] = []
    for (let i = 0; i < uniqueRows.length; i += CHUNK_SIZE) {
      chunks.push(uniqueRows.slice(i, i + CHUNK_SIZE))
    }

    let processed = 0
    for (const chunk of chunks) {
      const res = await fetch("/api/leads/import", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          rows:      chunk,
          filename,
          batchId,
          totalRows: uniqueRows.length,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        batchId         = data.batchId
        totalImported   += data.importedCount
        totalDuplicates += data.duplicateCount
        processed       += chunk.length

        setProcessedRows(processed)
        setRunImported(totalImported)
        setRunDuplicates(totalDuplicates)
        setProgress(Math.round((processed / uniqueRows.length) * 100))
      } else {
        // Chunk fehlgeschlagen — trotzdem weitermachen
        processed += chunk.length
        setProcessedRows(processed)
        setProgress(Math.round((processed / uniqueRows.length) * 100))
      }
    }

    // Interne Duplikate (innerhalb der Excel-Datei) zum Gesamtergebnis addieren
    const internalDupes = total - uniqueRows.length
    setResult({ importedCount: totalImported, duplicateCount: totalDuplicates + internalDupes })
    setStep("done")
  }

  const internalDupes = step === "preview" ? countInternalDuplicates() : 0
  const branchenStats = step === "preview" ? getBranchenStats() : []

  return (
    <div className="app-layout">
      <Sidebar
        userName={session?.user?.name ?? ""}
        userRole={session?.user?.role ?? "AGENT"}
        activeSessionId={null}
      />

      <main className="app-main" style={{ maxWidth: "760px" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/leads" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--fg-muted)", textDecoration: "none", marginBottom: "1.25rem" }}>
            <ArrowLeft size={13} /> Zurück zu Leads
          </Link>
          <h1 className="heading">Excel importieren</h1>
        </div>

        {/* Schritt 1: Upload */}
        {step === "upload" && (
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border:        `1px dashed ${dragOver ? "var(--fg)" : "var(--border)"}`,
                padding:       "4rem 2rem",
                textAlign:     "center",
                cursor:        "pointer",
                background:    dragOver ? "#fafafa" : "var(--bg)",
                transition:    "all 0.15s ease",
              }}
            >
              <Upload size={24} strokeWidth={1} style={{ margin: "0 auto 1rem", color: "var(--fg-faint)" }} />
              <p style={{ fontSize: "0.9rem", fontWeight: 400, marginBottom: "0.5rem" }}>
                Excel-Datei hier ablegen
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--fg-faint)" }}>
                oder klicken zum Auswählen · .xlsx / .xls / .csv
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "#f5f5f5" }}>
              <p className="label" style={{ marginBottom: "0.5rem" }}>Unterstützte Spalten</p>
              <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", lineHeight: 1.8 }}>
                Das System erkennt automatisch: <strong>Name, Telefon, Firmenname, Ort, Branchengruppe, Kategorie, Website-Status</strong>.<br />
                Kompatibel mit dem Lead-Generator-Export (leads_nuernberg.xlsx).
              </p>
            </div>
          </div>
        )}

        {/* Schritt 2: Vorschau */}
        {step === "preview" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 400 }}>{filename}</p>
                <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>{rows.length} gültige Einträge erkannt</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setStep("upload")} style={{ fontSize: "0.72rem" }}>
                Andere Datei
              </button>
            </div>

            {/* Duplikat-Warnung (innerhalb der Datei) */}
            {internalDupes > 0 && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.9rem 1.25rem", background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "1rem" }}>
                <AlertCircle size={15} style={{ color: "#92400e", flexShrink: 0, marginTop: "0.1rem" }} />
                <p style={{ fontSize: "0.8rem", color: "#92400e" }}>
                  <strong>{internalDupes} doppelte Telefonnummern</strong> innerhalb der Datei gefunden — werden automatisch übersprungen.
                </p>
              </div>
            )}

            {/* Branchengruppen-Übersicht */}
            {branchenStats.length > 0 && (
              <div style={{ border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
                  <p className="label">Branchengruppen</p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0", padding: "0.75rem 1rem" }}>
                  {branchenStats.map(({ gruppe, count }) => {
                    const isKnown = ALLE_BRANCHENGRUPPEN.includes(gruppe)
                    return (
                      <div
                        key={gruppe}
                        style={{
                          display:      "flex",
                          alignItems:   "center",
                          gap:          "0.5rem",
                          padding:      "0.3rem 0.75rem",
                          marginRight:  "0.5rem",
                          marginBottom: "0.5rem",
                          background:   isKnown ? "#f5f5f5" : "#fffbeb",
                          border:       `1px solid ${isKnown ? "var(--border)" : "#fde68a"}`,
                          fontSize:     "0.75rem",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{gruppe}</span>
                        <span style={{ color: "var(--fg-muted)" }}>{count}</span>
                        {!isKnown && (
                          <span style={{ fontSize: "0.68rem", color: "#92400e" }}>· keine Zeitempfehlung</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Vorschau der ersten 8 Zeilen */}
            <div className="table-container" style={{ border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Telefon</th>
                    <th>Firma</th>
                    <th>Stadt</th>
                    <th>Branchengruppe</th>
                    <th>Kategorie</th>
                    <th>Website</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((row, i) => (
                    <tr key={i}>
                      <td>{row.name}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{row.phone}</td>
                      <td style={{ color: "var(--fg-muted)" }}>{row.company || "—"}</td>
                      <td style={{ color: "var(--fg-muted)" }}>{row.city || "—"}</td>
                      <td style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>{row.branchengruppe || "—"}</td>
                      <td style={{ color: "var(--fg-muted)" }}>{row.industry || "—"}</td>
                      <td style={{ color: "var(--fg-muted)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                        {row.website || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 8 && (
                <p style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--fg-faint)", borderTop: "1px solid var(--border)" }}>
                  + {rows.length - 8} weitere Einträge
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className="btn btn-primary"
                onClick={handleImport}
              >
                {rows.length} Leads importieren →
              </button>
              <button className="btn btn-ghost" onClick={() => setStep("upload")}>
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Schritt 3: Importiert wird gerade — Fortschrittsbalken */}
        {step === "importing" && (
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 400, marginBottom: "0.5rem" }}>{filename}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", marginBottom: "1.75rem" }}>
              Import läuft — bitte nicht schließen.
            </p>

            {/* Fortschrittsbalken */}
            <div style={{ border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
                <p className="label">Fortschritt</p>
                <p style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "var(--fg-muted)" }}>
                  {processedRows} / {rows.length}
                </p>
              </div>

              {/* Balken */}
              <div style={{ height: "6px", background: "var(--border)", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    height:     "100%",
                    width:      `${progress}%`,
                    background: "var(--fg)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {/* Laufende Statistiken */}
              <div style={{ display: "flex", gap: "2rem" }}>
                <div>
                  <p style={{ fontSize: "1.4rem", fontWeight: 100, letterSpacing: "-0.02em", lineHeight: 1 }}>{runImported}</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--fg-muted)", marginTop: "0.25rem" }}>Importiert</p>
                </div>
                <div>
                  <p style={{ fontSize: "1.4rem", fontWeight: 100, letterSpacing: "-0.02em", lineHeight: 1 }}>{runDuplicates}</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--fg-muted)", marginTop: "0.25rem" }}>Duplikate</p>
                </div>
                <div>
                  <p style={{ fontSize: "1.4rem", fontWeight: 100, letterSpacing: "-0.02em", lineHeight: 1 }}>{progress}%</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--fg-muted)", marginTop: "0.25rem" }}>Abgeschlossen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schritt 4: Ergebnis */}
        {step === "done" && result && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "1.5rem" }}>
              <CheckCircle size={20} style={{ color: "#166534", flexShrink: 0, marginTop: "0.1rem" }} />
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#166534", marginBottom: "0.3rem" }}>
                  Import abgeschlossen
                </p>
                <p style={{ fontSize: "0.82rem", color: "#166534" }}>
                  {result.importedCount} Leads erfolgreich importiert.
                </p>
              </div>
            </div>

            {result.duplicateCount > 0 && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem 1.25rem", background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "1.5rem" }}>
                <AlertCircle size={16} style={{ color: "#92400e", flexShrink: 0, marginTop: "0.1rem" }} />
                <p style={{ fontSize: "0.82rem", color: "#92400e" }}>
                  {result.duplicateCount} Duplikate übersprungen (Telefonnummern bereits vorhanden).
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link href="/leads" className="btn btn-primary">
                Zu den Leads →
              </Link>
              <button className="btn btn-ghost" onClick={() => { setStep("upload"); setRows([]); setResult(null) }}>
                Weitere importieren
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
