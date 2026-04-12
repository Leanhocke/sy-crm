# CRM Setup — Schritt für Schritt

## Einmalige Einrichtung (~30 Minuten)

### Schritt 1 — Neon Datenbank (kostenlos)
1. Gehe zu https://neon.tech → Account erstellen
2. "New Project" → Name: `sy-crm` → Region: `EU Frankfurt`
3. Auf der Projektseite: **Connection string** kopieren
   → Sieht so aus: `postgresql://user:pass@host/dbname?sslmode=require`

### Schritt 2 — GitHub Repository
1. Gehe zu https://github.com → "New repository"
2. Name: `sy-crm` → Private → Create
3. Terminal öffnen, in diesen Ordner navigieren:
   ```bash
   cd /Users/leanhocke/Documents/sy-crm
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/DEIN-NAME/sy-crm.git
   git push -u origin main
   ```

### Schritt 3 — Vercel Deployment (kostenlos)
1. Gehe zu https://vercel.com → Login mit GitHub
2. "Add New Project" → dein `sy-crm` Repo auswählen → Import
3. **Environment Variables** hinzufügen:
   - `DATABASE_URL` → dein Neon Connection String
   - `NEXTAUTH_SECRET` → zufälliger String (https://generate-secret.vercel.app/32)
4. Deploy klicken → warten bis fertig
5. Deine URL: `sy-crm.vercel.app` (oder ähnlich)

### Schritt 4 — Datenbank initialisieren
Im Terminal (einmalig):
```bash
cd /Users/leanhocke/Documents/sy-crm
cp .env.example .env
# .env öffnen und DATABASE_URL + NEXTAUTH_SECRET eintragen

npx prisma db push    # Tabellen erstellen
npm run db:seed       # Admin-Nutzer anlegen
```

### Schritt 5 — Einloggen
- URL: deine Vercel-URL oder http://localhost:3000 (lokal)
- Email: `admin@showyourself.me`
- Passwort: `admin123`
- **Bitte sofort neuen Nutzer mit sicherem Passwort anlegen!**

---

## Mitarbeiter hinzufügen
1. Einloggen als Admin
2. Admin → "Neuen Mitarbeiter anlegen"
3. URL + Zugangsdaten an Mitarbeiter weitergeben
4. Fertig — jeder kann sich sofort einloggen

## Lokale Entwicklung
```bash
cd /Users/leanhocke/Documents/sy-crm
npm run dev
# → http://localhost:3000
```
