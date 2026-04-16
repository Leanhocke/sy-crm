/**
 * Optimale Anrufzeiten pro Branchengruppe
 *
 * Logik hinter den Zeiten:
 * - Handwerk & Bau:    früh vor Abfahrt zu Baustellen (7:30–9:00) oder Mittagspause (12:00–13:00)
 * - Gastronomie:       Ruhepause zwischen Mittagsservice und Abendservice (14:30–17:00)
 * - Fahrzeuge:         klassische Bürozeiten ohne Stoßzeiten (8:00–10:00 + 14:00–16:00)
 * - Beauty & Wellness: vor dem Rush, zwischen Terminen (9:00–10:30 + 13:00–14:30)
 * - Gesundheit:        vor Sprechstundenbeginn (8:00–9:00) oder Mittagspause (13:00–14:00)
 * - Sport & Freizeit:  Morgenstunden vor dem Betrieb (9:00–11:30)
 * - Dienstleistungen:  Standard-Bürozeit (9:00–11:30 + 14:00–16:30)
 * - Einzelhandel:      kurz nach Ladenöffnung vor Kundenansturm (9:30–11:00 + 14:00–15:30)
 * - Tiere:             zwischen Terminen (9:00–11:00 + 14:00–16:00)
 */

export interface Zeitfenster {
  vonH: number // Stunde (0–23)
  vonM: number // Minute
  bisH: number
  bisM: number
}

export interface BranchenInfo {
  name: string
  zeiten: Zeitfenster[]
  tipp: string  // Kurzer Hinweis warum diese Zeit
}

export const BRANCHENZEITEN: Record<string, BranchenInfo> = {
  "Handwerk & Bau": {
    name: "Handwerk & Bau",
    zeiten: [
      { vonH: 7, vonM: 30, bisH: 9, bisM: 0 },
      { vonH: 12, vonM: 0, bisH: 13, bisM: 0 },
    ],
    tipp: "Vor Abfahrt zur Baustelle (7:30–9:00) oder Mittagspause (12:00–13:00)",
  },
  "Gastronomie": {
    name: "Gastronomie",
    zeiten: [
      { vonH: 14, vonM: 30, bisH: 17, bisM: 0 },
    ],
    tipp: "Ruhepause zwischen Mittag- und Abendservice (14:30–17:00). NIE zur Stoßzeit!",
  },
  "Fahrzeuge": {
    name: "Fahrzeuge",
    zeiten: [
      { vonH: 8, vonM: 0, bisH: 10, bisM: 0 },
      { vonH: 14, vonM: 0, bisH: 16, bisM: 0 },
    ],
    tipp: "Morgens vor dem Werkstattbetrieb (8–10) oder ruhige Nachmittagsstunden (14–16)",
  },
  "Beauty & Wellness": {
    name: "Beauty & Wellness",
    zeiten: [
      { vonH: 9, vonM: 0, bisH: 10, bisM: 30 },
      { vonH: 13, vonM: 0, bisH: 14, bisM: 30 },
    ],
    tipp: "Vor dem Terminbeginn (9–10:30) oder Mittagslücke zwischen Kunden (13–14:30)",
  },
  "Gesundheit": {
    name: "Gesundheit",
    zeiten: [
      { vonH: 8, vonM: 0, bisH: 9, bisM: 0 },
      { vonH: 13, vonM: 0, bisH: 14, bisM: 0 },
    ],
    tipp: "Vor Sprechstundenbeginn (8–9) oder Mittagspause (13–14)",
  },
  "Sport & Freizeit": {
    name: "Sport & Freizeit",
    zeiten: [
      { vonH: 9, vonM: 0, bisH: 11, bisM: 30 },
    ],
    tipp: "Morgenstunden vor dem Kundenbetrieb (9–11:30)",
  },
  "Dienstleistungen": {
    name: "Dienstleistungen",
    zeiten: [
      { vonH: 9, vonM: 0, bisH: 11, bisM: 30 },
      { vonH: 14, vonM: 0, bisH: 16, bisM: 30 },
    ],
    tipp: "Klassische Bürozeit — Vormittag (9–11:30) oder Nachmittag (14–16:30)",
  },
  "Einzelhandel": {
    name: "Einzelhandel",
    zeiten: [
      { vonH: 9, vonM: 30, bisH: 11, bisM: 0 },
      { vonH: 14, vonM: 0, bisH: 15, bisM: 30 },
    ],
    tipp: "Kurz nach Ladenöffnung (9:30–11) oder ruhige Nachmittagsstunden (14–15:30)",
  },
  "Tiere": {
    name: "Tiere",
    zeiten: [
      { vonH: 9, vonM: 0, bisH: 11, bisM: 0 },
      { vonH: 14, vonM: 0, bisH: 16, bisM: 0 },
    ],
    tipp: "Zwischen Terminen (9–11 + 14–16)",
  },
}

export type BranchenStatus = "ideal" | "okay" | "schlecht"

export interface BranchenBewertung {
  gruppe: string
  status: BranchenStatus
  tipp: string
  naechstesFenster?: { vonH: number; vonM: number }
}

function inFenster(jetzt: { h: number; m: number }, f: Zeitfenster): boolean {
  const jetztMin = jetzt.h * 60 + jetzt.m
  const vonMin   = f.vonH * 60 + f.vonM
  const bisMin   = f.bisH * 60 + f.bisM
  return jetztMin >= vonMin && jetztMin < bisMin
}

function minBisNaechstesFenster(jetzt: { h: number; m: number }, zeiten: Zeitfenster[]): Zeitfenster | null {
  const jetztMin = jetzt.h * 60 + jetzt.m
  let naechstes: Zeitfenster | null = null
  let minAbstand = Infinity
  for (const f of zeiten) {
    const vonMin = f.vonH * 60 + f.vonM
    if (vonMin > jetztMin) {
      const abstand = vonMin - jetztMin
      if (abstand < minAbstand) {
        minAbstand = abstand
        naechstes = f
      }
    }
  }
  return naechstes
}

/**
 * Bewertet alle Branchengruppen für die aktuelle Uhrzeit.
 * Gibt sie sortiert zurück: ideal → okay → schlecht
 */
export function bewerteBranchen(jetzt?: Date): BranchenBewertung[] {
  const d = jetzt ?? new Date()
  const h = d.getHours()
  const m = d.getMinutes()

  const ergebnisse: BranchenBewertung[] = []

  for (const [gruppe, info] of Object.entries(BRANCHENZEITEN)) {
    const istIdeal = info.zeiten.some(f => inFenster({ h, m }, f))

    // "okay": 30 Minuten vor oder nach einem Fenster
    const istOkay = !istIdeal && info.zeiten.some(f => {
      const jetztMin = h * 60 + m
      const vonMin   = f.vonH * 60 + f.vonM
      const bisMin   = f.bisH * 60 + f.bisM
      return (jetztMin >= vonMin - 30 && jetztMin < vonMin) ||
             (jetztMin >= bisMin && jetztMin < bisMin + 30)
    })

    const naechstes = minBisNaechstesFenster({ h, m }, info.zeiten)

    ergebnisse.push({
      gruppe,
      status: istIdeal ? "ideal" : istOkay ? "okay" : "schlecht",
      tipp: info.tipp,
      naechstesFenster: naechstes
        ? { vonH: naechstes.vonH, vonM: naechstes.vonM }
        : undefined,
    })
  }

  // Sortierung: ideal zuerst, dann okay, dann schlecht
  const order: Record<BranchenStatus, number> = { ideal: 0, okay: 1, schlecht: 2 }
  return ergebnisse.sort((a, b) => order[a.status] - order[b.status])
}

export function formatZeit(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} Uhr`
}

export const ALLE_BRANCHENGRUPPEN = Object.keys(BRANCHENZEITEN)
