"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import Sidebar from "@/components/Sidebar"
import Link from "next/link"
import * as XLSX from "xlsx"
import { Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"

interface PreviewRow {
  name: string
  phone: string
  company: string
  industry: string
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

export default function ImportPage() {
  const { data: session } = useSession()
  const [step,      setStep]      = useState<"upload" | "preview" | "done">("upload")
  const [rows,      setRows]      = useState<PreviewRow[]>([])
  const [filename,  setFilename]  = useState("")
  const [importing, setImporting] = useState(false)
  const [result,    setResult]    = useState<{ importedCount: number; duplicateCount: number } | null>(null)
  const [dragOver,  setDragOver]  = useState(false)
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
      const nameCol     = detectColumn(headers, ["name", "vorname", "nachname", "kontakt", "ansprechpartner"])
      const phoneCol    = detectColumn(headers, ["telefon", "tel", "handy", "mobile", "phone", "nummer", "mobil"])
      const companyCol  = detectColumn(headers, ["firma", "unternehmen", "company", "organisation"])
      const industryCol = detectColumn(headers, ["branche", "industrie", "industry", "bereich", "sektor"])
      const cityCol     = detectColumn(headers, ["stadt", "city", "ort", "standort", "location"])
      const websiteCol  = detectColumn(headers, ["website", "webseite", "url", "homepage", "web", "link", "internetseite"])

      const parsed: PreviewRow[] = json
        .map(row => ({
          name:     String(row[nameCol]     ?? "").trim(),
          phone:    String(row[phoneCol]    ?? "").trim(),
          company:  String(row[companyCol]  ?? "").trim(),
          industry: String(row[industryCol] ?? "").trim(),
          city:     String(row[cityCol]     ?? "").trim(),
          website:  String(row[websiteCol]  ?? "").trim(),
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

  async function handleImport() {
    setImporting(true)
    const res = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, filename }),
    })
    const data = await res.json()
    setResult(data)
    setStep("done")
    setImporting(false)
  }

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
                Das System erkennt automatisch: <strong>Name, Telefon, Firma, Stadt, Branche, Website</strong>.<br />
                Spaltenbezeichnungen können auf Deutsch oder Englisch sein (z.B. "Stadt" oder "City", "Website" oder "URL").
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

            {/* Vorschau der ersten 8 Zeilen */}
            <div className="table-container" style={{ border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Telefon</th>
                    <th>Firma</th>
                    <th>Stadt</th>
                    <th>Branche</th>
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
                      <td style={{ color: "var(--fg-muted)" }}>{row.industry || "—"}</td>
                      <td style={{ color: "var(--fg-muted)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.75rem" }}>
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
                disabled={importing}
                style={{ opacity: importing ? 0.6 : 1 }}
              >
                {importing ? "Importiere..." : `${rows.length} Leads importieren →`}
              </button>
              <button className="btn btn-ghost" onClick={() => setStep("upload")}>
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Schritt 3: Ergebnis */}
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
