import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CRM — ShowYourself.me",
  description: "Internes CRM für Cold Calling",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
