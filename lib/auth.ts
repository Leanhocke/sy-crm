import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.isActive) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        // Gibt das User-Objekt zurück — wird in JWT gespeichert
        return {
          id:                 user.id,
          name:               user.name,
          email:              user.email,
          role:               user.role,
          hasSeenOnboarding:  user.hasSeenOnboarding,
        }
      },
    }),
  ],
  callbacks: {
    // JWT: beim Login alles in den Token schreiben
    async jwt({ token, user }) {
      if (user) {
        token.id                = user.id
        token.role              = (user as unknown as { role: string }).role
        token.hasSeenOnboarding = (user as unknown as { hasSeenOnboarding: boolean }).hasSeenOnboarding
      }
      return token
    },
    // Session: aus dem Token in die Session übertragen
    async session({ session, token }) {
      if (session.user) {
        session.user.id                = token.id as string
        session.user.role              = token.role as string
        session.user.hasSeenOnboarding = token.hasSeenOnboarding as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
