/**
 * Prisma Client Singleton.
 * Verhindert zu viele DB-Verbindungen im Entwicklungsmodus.
 */
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
