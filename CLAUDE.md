# CLAUDE.md — sy-crm

Dieses Dokument gibt Claude Code den nötigen Kontext für die Arbeit am sy-crm Projekt.
Sprache: immer Deutsch, außer explizit anders gewünscht.

---

## Das Unternehmen: ShowYourself.me

Creative Studio aus Nürnberg (Einzelunternehmen, Kleinunternehmerregelung).

**Leistungen:** Visuelle Identitäten, Webdesign, Fotografie, Videografie, Print.

**Team:**
- Léan Hocke — Gründerin, Kundenkontakt, Finanzen, Fotografie, Print, Website-Entwicklung
- Niklas Bendel — Social Media Videos, Werbefilme, Website-Design
- Quentin — Trainee
- Cold-Calling-Team (projektbasiert)

**Wichtig:** Keine MwSt. auf Rechnungen (Kleinunternehmerregelung).

---

## Dieses Projekt: sy-crm

Internes Cold-Calling CRM für das Vertriebsteam. Ziel: Website-Verkauf per Telefonakquise, Terminvereinbarung als Hauptziel.

- GitHub: `github.com/Leanhocke/sy-crm`
- Live: `https://sy-crm-mq3k.vercel.app`
- Kosten: kostenlos (Vercel + Neon + GitHub)

---

## Tech Stack

| Bereich | Tech |
|---|---|
| Framework | Next.js 16 + TypeScript |
| ORM / DB | Prisma 5 + PostgreSQL (Neon) |
| Auth | NextAuth v4 (Email/Passwort) |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Excel-Import | xlsx |
| Icons | Lucide React |

**Middleware:** `proxy.ts` (Next.js 16 Convention — nicht `middleware.ts`)

---

## Datenbankschema

**Lead:** `name`, `phone` (unique), `company`, `industry`, `city`, `website`, `email`, `status`, `notes`, `followUpAt`, `lastCalledAt`, `callCount`

**Status-Werte:** `PENDING` / `NOT_REACHED` / `NO_INTEREST` / `INTERESTED` / `FOLLOW_UP` / `CLOSED`

**Call:** `leadId`, `userId`, `sessionId`, `startedAt`, `endedAt`, `durationSec`, `outcome`, `notes`, `emailDraft`

**Session:** `userId`, `startedAt`, `endedAt`, `totalCalls`

**User:** `name`, `email`, `password` (bcrypt), `role` (ADMIN/AGENT), `hasSeenOnboarding`

---

## Seiten-Übersicht

| Route | Beschreibung |
|---|---|
| `/login` | Login |
| `/onboarding` | Einführung beim ersten Login (4 Schritte) |
| `/dashboard` | Übersicht — Anrufe heute, Rückrufe, letzte Aktivität |
| `/leads` | Lead-Liste mit Filtern + Website-Button pro Lead |
| `/leads/import` | Excel-Upload mit Auto-Erkennung |
| `/call/[id]` | **Call-Modus** — Kernseite des CRM |
| `/sessions` | Session starten/stoppen, Verlauf |
| `/analytics` | Charts: Anrufe/Tag, Lead-Status, Branchen, Team-Leistung |
| `/admin` | Mitarbeiter anlegen, aktivieren/deaktivieren |

**Call-Modus Details (`/call/[id]`):**
1. Website-Button (schwarz, prominent) → öffnet in neuem Tab
2. Name groß, Firma, Stadt + Branche als Labels
3. Telefonnummer als klickbarer `tel:`-Link
4. Timer (startet bei "Anruf starten")
5. Notizen + E-Mail-Entwurf nebeneinander
6. 5 Ergebnis-Buttons: Nicht erreicht / Kein Interesse / Interessiert / Rückruf / Abgeschlossen
7. Rückruf: zeigt Datetime-Picker
8. Speichern → Auto-Weiterleitung zum nächsten offenen Lead

---

## Branding Guidelines

Design: Minimalismus, keine bunten Farben, keine Verläufe.

**Farben:**
```
Schwarz:    #000000
Weiß:       #FFFFFF
Hellgrau:   #F5F5F5
Grau:       #EEEEEE
```

**Typografie:** Ausschließlich Helvetica Neue.

| Element | Größe | Weight | Letter-Spacing | Transform |
|---|---|---|---|---|
| H1 | 3rem | 100 | 8px | uppercase |
| Body | 1rem | 300 | — | — |

**Layout:** 8px Grid, keine runden Ecken, Status-Farben gedämpft (amber, red, green, blue, black).

**Bilder:** `grayscale(100%) opacity 0.95`

---

## Infrastruktur

| Bereich | Tool |
|---|---|
| Hosting (App) | Vercel (automatisches Deployment via GitHub Push) |
| Datenbank | Neon PostgreSQL (`ep-holy-recipe-alvandjl.c-3.eu-central-1.aws.neon.tech`) |
| Hosting (Domain) | STRATO |
| Buchhaltung | Sevdesk |
| Projektmanagement | Notion |

---

## Wichtige Regeln

1. Sprache: immer Deutsch, außer explizit anders gewünscht
2. `proxy.ts` ist die Middleware-Datei (Next.js 16 Convention)
3. `export const dynamic = "force-dynamic"` auf Seiten die `useSession` nutzen
4. Vor jedem Deployment: `prisma generate` sicherstellen
5. Keine MwSt. auf Rechnungen (Kleinunternehmerregelung)
