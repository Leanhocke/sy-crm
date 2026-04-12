/**
 * Schützt alle Seiten außer /login.
 * Nicht eingeloggte Nutzer werden automatisch weitergeleitet.
 */
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: { signIn: "/login" },
})

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
}
