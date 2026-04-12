"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  Phone,
  Clock,
  BarChart2,
  Settings,
  LogOut,
  PhoneCall,
} from "lucide-react"

interface SidebarProps {
  userName: string
  userRole: string
  activeSessionId?: string | null
}

const NAV = [
  { href: "/dashboard",       label: "Dashboard",  icon: LayoutDashboard },
  { href: "/leads",           label: "Leads",      icon: Users },
  { href: "/sessions",        label: "Sessions",   icon: Clock },
  { href: "/analytics",       label: "Statistiken",icon: BarChart2 },
]

export default function Sidebar({ userName, userRole, activeSessionId }: SidebarProps) {
  const path = usePathname()

  return (
    <aside style={{
      position:   "fixed",
      top:        0,
      left:       0,
      bottom:     0,
      width:      "var(--sidebar-w)",
      borderRight:"1px solid var(--border)",
      display:    "flex",
      flexDirection: "column",
      background: "var(--bg)",
      zIndex:     100,
    }}>

      {/* Logo */}
      <div style={{
        padding:      "1.75rem 1.5rem 1.25rem",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          ShowYourself.me
        </span>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-faint)", marginTop: "0.2rem" }}>
          CRM
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display:     "flex",
                alignItems:  "center",
                gap:         "0.75rem",
                padding:     "0.65rem 1.5rem",
                fontSize:    "0.8rem",
                fontWeight:  active ? 500 : 300,
                color:       active ? "var(--fg)" : "var(--fg-muted)",
                textDecoration: "none",
                background:  active ? "#f5f5f5" : "transparent",
                borderLeft:  active ? "2px solid var(--fg)" : "2px solid transparent",
                transition:  "all 0.15s ease",
              }}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          )
        })}

        {userRole === "ADMIN" && (
          <Link
            href="/admin"
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "0.75rem",
              padding:    "0.65rem 1.5rem",
              fontSize:   "0.8rem",
              fontWeight: path.startsWith("/admin") ? 500 : 300,
              color:      path.startsWith("/admin") ? "var(--fg)" : "var(--fg-muted)",
              textDecoration: "none",
              background: path.startsWith("/admin") ? "#f5f5f5" : "transparent",
              borderLeft: path.startsWith("/admin") ? "2px solid var(--fg)" : "2px solid transparent",
            }}
          >
            <Settings size={15} strokeWidth={1.5} />
            Admin
          </Link>
        )}

        {/* Session-Status */}
        <div style={{ margin: "1rem 1.5rem 0", padding: "1rem", background: "#f5f5f5", borderLeft: "2px solid var(--border)" }}>
          <p className="label" style={{ marginBottom: "0.5rem" }}>Session</p>
          {activeSessionId ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#166534", display: "inline-block" }} />
              <span style={{ fontSize: "0.75rem", color: "#166534" }}>Aktiv</span>
            </div>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "var(--fg-faint)" }}>Keine Session</span>
          )}
          <Link
            href="/sessions"
            style={{
              display:    "block",
              marginTop:  "0.5rem",
              fontSize:   "0.7rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color:      "var(--fg)",
              textDecoration: "none",
            }}
          >
            {activeSessionId ? "Session verwalten →" : "Session starten →"}
          </Link>
        </div>

        {/* Schnellzugriff: nächster Lead */}
        {activeSessionId && (
          <Link
            href="/leads"
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "0.75rem",
              margin:     "0.75rem 1.5rem 0",
              padding:    "0.75rem 1rem",
              background: "var(--fg)",
              color:      "var(--bg)",
              textDecoration: "none",
              fontSize:   "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <PhoneCall size={14} />
            Anrufen
          </Link>
        )}
      </nav>

      {/* Nutzer + Logout */}
      <div style={{
        padding:    "1rem 1.5rem",
        borderTop:  "1px solid var(--border)",
      }}>
        <p style={{ fontSize: "0.8rem", fontWeight: 400, marginBottom: "0.2rem" }}>{userName}</p>
        <p className="label" style={{ marginBottom: "0.75rem" }}>{userRole === "ADMIN" ? "Admin" : "Agent"}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        "0.4rem",
            background: "none",
            border:     "none",
            cursor:     "pointer",
            fontSize:   "0.75rem",
            color:      "var(--fg-faint)",
            padding:    0,
          }}
        >
          <LogOut size={13} />
          Abmelden
        </button>
      </div>
    </aside>
  )
}
