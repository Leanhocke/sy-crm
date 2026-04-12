/**
 * Seed-Script: Erstellt den ersten Admin-Nutzer.
 * Ausführen mit: npm run db:seed
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@showyourself.me" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@showyourself.me",
      password,
      role: "ADMIN",
      hasSeenOnboarding: true,
    },
  })

  console.log("✓ Admin erstellt:", admin.email)
  console.log("  Passwort: admin123")
  console.log("  → Bitte nach dem ersten Login das Passwort ändern!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
