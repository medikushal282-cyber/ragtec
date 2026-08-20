import { useState, useEffect } from "react"
import type { Page } from "../App"

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Global SOC Dashboard",
  fleet: "Fleet Management & File Integrity Monitoring",
  network: "Network Security — IDS/IPS Monitor",
  incident: "Active Incident Investigation — RAGSec Co-Pilot",
  mitigation: "Threat Mitigation & Response Orchestration",
}

export default function TopBar({ page }: { page: Page }) {
  const [time, setTime] = useState(new Date())
  const [search, setSearch] = useState("")
  const [threatLevel] = useState<"green" | "yellow" | "red">("yellow")

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const threatColors = {
    green: { bg: "#10b98122", border: "#10b98144", text: "#10b981", label: "NOMINAL" },
    yellow: { bg: "#f59e0b22", border: "#f59e0b44", text: "#f59e0b", label: "ELEVATED" },
    red: { bg: "#ef444422", border: "#ef444444", text: "#ef4444", label: "CRITICAL" },
  }
  const tc = threatColors[threatLevel]

  return (
    <header style={{
      height: 52,
      background: "#080f1f",
      borderBottom: "1px solid #1a2d4f",
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      gap: 16,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#c8d8ea", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {PAGE_TITLES[page]}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", width: 280 }}>
        <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8d8ea" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search IOC, IP, hash, CVE..."
          style={{
            width: "100%",
            background: "#0d1629",
            border: "1px solid #1a2d4f",
            borderRadius: 6,
            padding: "6px 10px 6px 32px",
            fontSize: 12,
            color: "#c8d8ea",
            fontFamily: "JetBrains Mono, monospace",
            outline: "none",
          }}
          onFocus={e => { e.target.style.borderColor = "#00d4ff66" }}
          onBlur={e => { e.target.style.borderColor = "#1a2d4f" }}
        />
      </div>

      {/* Threat Level */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 12px",
        background: tc.bg,
        border: `1px solid ${tc.border}`,
        borderRadius: 6,
      }}>
        <div className="dot-pulse" style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: tc.text,
        }} />
        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: tc.text, fontWeight: 700, letterSpacing: "0.08em" }}>
          THREAT: {tc.label}
        </span>
      </div>

      {/* Time */}
      <div style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#3d5a7a", letterSpacing: "0.05em" }}>
        {time.toLocaleTimeString("en-US", { hour12: false })}
        <span style={{ marginLeft: 6, color: "#2d4878" }}>UTC</span>
      </div>
    </header>
  )
}
