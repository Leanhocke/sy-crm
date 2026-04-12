const STATUS_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING:     { label: "Offen",           bg: "var(--s-pending-bg)",     fg: "var(--s-pending-fg)" },
  NOT_REACHED: { label: "Nicht erreicht",  bg: "var(--s-not-reached-bg)", fg: "var(--s-not-reached-fg)" },
  NO_INTEREST: { label: "Kein Interesse",  bg: "var(--s-no-interest-bg)", fg: "var(--s-no-interest-fg)" },
  INTERESTED:  { label: "Interessiert",    bg: "var(--s-interested-bg)",  fg: "var(--s-interested-fg)" },
  FOLLOW_UP:   { label: "Rückruf",         bg: "var(--s-follow-up-bg)",   fg: "var(--s-follow-up-fg)" },
  CLOSED:      { label: "Abgeschlossen",   bg: "var(--s-closed-bg)",      fg: "var(--s-closed-fg)" },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.PENDING
  return (
    <span style={{
      display:        "inline-block",
      padding:        "0.2rem 0.6rem",
      fontSize:       "0.65rem",
      fontWeight:     500,
      letterSpacing:  "0.1em",
      textTransform:  "uppercase",
      background:     s.bg,
      color:          s.fg,
      whiteSpace:     "nowrap",
    }}>
      {s.label}
    </span>
  )
}
