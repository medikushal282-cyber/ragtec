import { useState, useEffect } from "react"

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function generateHeatmap() {
  return DAYS.map((_, d) =>
    HOURS.map((h) => {
      const base = d < 5 ? (h >= 8 && h <= 18 ? 60 + Math.random() * 120 : 10 + Math.random() * 30) : 5 + Math.random() * 40
      const incidents = Math.random() < 0.15 ? Math.floor(base * 0.3 + Math.random() * 20) : 0
      return { logs: Math.floor(base), incidents }
    })
  )
}

const HEATMAP = generateHeatmap()

function heatColor(logs: number, incidents: number) {
  const norm = Math.min(logs / 180, 1)
  if (incidents > 10) return `rgba(239,68,68,${0.5 + incidents / 60})`
  if (incidents > 0) return `rgba(245,158,11,${0.4 + norm * 0.4})`
  const r = Math.floor(0 + 0 * norm)
  const g = Math.floor(60 + 80 * norm)
  const b = Math.floor(80 + 175 * norm)
  return `rgba(${r},${g},${b},${0.15 + norm * 0.65})`
}

const ACTIONS = [
  { time: "14:23:07", action: "Blocked IP 185.220.101.45", type: "block", severity: "critical" },
  { time: "14:19:42", action: "Quarantined WS-042 — lateral movement detected", type: "quarantine", severity: "critical" },
  { time: "14:11:30", action: "Killed process lsass_injector.exe on WS-042", type: "kill", severity: "high" },
  { time: "13:58:15", action: "Escalated INC-2847 to analyst jmartinez@corp", type: "escalate", severity: "high" },
  { time: "13:45:09", action: "Blocked IP 92.53.116.124 — C2 beacon detected", type: "block", severity: "critical" },
  { time: "13:38:22", action: "CRC redacted hallucinated hash from response", type: "redact", severity: "medium" },
  { time: "13:29:51", action: "Abstained — insufficient evidence for CVE-2024-21762", type: "abstain", severity: "medium" },
  { time: "13:15:04", action: "Indexed 2,341 new threat intelligence documents", type: "index", severity: "low" },
  { time: "12:58:33", action: "Blocked IP 46.161.27.134 — SSH brute force", type: "block", severity: "high" },
  { time: "12:41:17", action: "Auto-revoked firewall rule after 2h TTL expiry", type: "revoke", severity: "low" },
]

const METRICS = [
  { label: "Active Incidents", value: "2", sub: "P1: 1 · P2: 1", color: "#ef4444", icon: "⚠" },
  { label: "Blocked IPs", value: "47", sub: "+3 today", color: "#f59e0b", icon: "🛡" },
  { label: "Indexed Docs", value: "284,721", sub: "↑ 2,341 new", color: "#00d4ff", icon: "📚" },
  { label: "MTTD Reduction", value: "27%", sub: "vs. baseline", color: "#10b981", icon: "⚡" },
  { label: "Abstentions (24h)", value: "8", sub: "threshold enforced", color: "#8b5cf6", icon: "⊘" },
  { label: "SPS Score", value: "2.711", sub: "↑ baseline 1.275", color: "#00d4ff", icon: "★" },
]

function SPSGauge() {
  const value = 2.711
  const max = 4
  const baseline = 1.275
  const frac = value / max
  const bFrac = baseline / max

  const cx = 110, cy = 110, r = 80
  const startAngle = Math.PI
  const endAngle = 2 * Math.PI

  function arc(frac: number) {
    const angle = startAngle + frac * Math.PI
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    const large = frac > 0.5 ? 1 : 0
    const sx = cx + r * Math.cos(startAngle)
    const sy = cy + r * Math.sin(startAngle)
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${x} ${y}`
  }

  function needle(frac: number, len: number) {
    const angle = startAngle + frac * Math.PI
    return {
      x: cx + len * Math.cos(angle),
      y: cy + len * Math.sin(angle),
    }
  }

  const tip = needle(frac, 68)
  const bTip = needle(bFrac, 60)

  const segments = [
    { start: 0, end: 0.25, color: "#10b981" },
    { start: 0.25, end: 0.5, color: "#00d4ff" },
    { start: 0.5, end: 0.75, color: "#f59e0b" },
    { start: 0.75, end: 1, color: "#ef4444" },
  ]

  function arcSeg(s: number, e: number) {
    const a1 = startAngle + s * Math.PI
    const a2 = startAngle + e * Math.PI
    const x1 = cx + (r + 10) * Math.cos(a1), y1 = cy + (r + 10) * Math.sin(a1)
    const x2 = cx + (r + 10) * Math.cos(a2), y2 = cy + (r + 10) * Math.sin(a2)
    return `M ${x1} ${y1} A ${r + 10} ${r + 10} 0 0 1 ${x2} ${y2}`
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={220} height={140} viewBox="0 0 220 140">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path d={arc(1)} fill="none" stroke="#1a2d4f" strokeWidth={12} strokeLinecap="round" />
        {/* Filled arc to value */}
        <path d={arc(frac)} fill="none" stroke="url(#gaugeGrad)" strokeWidth={12} strokeLinecap="round" />

        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const angle = startAngle + t * Math.PI
          const x1 = cx + (r - 16) * Math.cos(angle)
          const y1 = cy + (r - 16) * Math.sin(angle)
          const x2 = cx + (r - 6) * Math.cos(angle)
          const y2 = cy + (r - 6) * Math.sin(angle)
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2d4878" strokeWidth={1.5} />
        })}

        {/* Baseline marker */}
        <line x1={cx} y1={cy} x2={bTip.x} y2={bTip.y} stroke="#f59e0b66" strokeWidth={1.5} strokeDasharray="3,3" />
        <circle cx={bTip.x} cy={bTip.y} r={3} fill="#f59e0b" opacity={0.6} />

        {/* Main needle */}
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#00d4ff" strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="#00d4ff" />
        <circle cx={cx} cy={cy} r={3} fill="#060b18" />

        {/* Value label */}
        <text x={cx} y={cy - 20} textAnchor="middle" fill="#00d4ff" fontSize={22} fontWeight={700} fontFamily="JetBrains Mono, monospace">{value}</text>
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#5a7a9a" fontSize={9} fontFamily="JetBrains Mono, monospace">SPS SCORE</text>

        {/* Scale labels */}
        <text x={cx - r - 6} y={cy + 12} textAnchor="middle" fill="#3d5a7a" fontSize={9} fontFamily="JetBrains Mono, monospace">0</text>
        <text x={cx + r + 6} y={cy + 12} textAnchor="middle" fill="#3d5a7a" fontSize={9} fontFamily="JetBrains Mono, monospace">4</text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="#3d5a7a" fontSize={8} fontFamily="JetBrains Mono, monospace">Baseline: 1.275</text>
      </svg>

      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        {[
          { label: "FA", value: "0.91" },
          { label: "RS", value: "0.87" },
          { label: "CI", value: "0.83" },
          { label: "USR", value: "0.09" },
          { label: "TE", value: "0.78" },
        ].map((m) => (
          <div key={m.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#00d4ff", fontFamily: "JetBrains Mono, monospace" }}>{m.value}</div>
            <div style={{ fontSize: 9, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [actionIdx, setActionIdx] = useState(0)
  const [apiStatus, setApiStatus] = useState<string>("CONNECTING...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/health")
      .then(res => res.json())
      .then(data => {
        if (data.status === "healthy") {
          setApiStatus("API ONLINE");
        } else {
          setApiStatus("API ERROR");
        }
      })
      .catch(() => setApiStatus("API OFFLINE"));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActionIdx((i) => (i + 1) % ACTIONS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const severityColor = (s: string) =>
    s === "critical" ? "#ef4444" : s === "high" ? "#f59e0b" : s === "medium" ? "#8b5cf6" : "#10b981"

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, minHeight: "100%" }}>
      {/* Header with API Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 600 }}>Overview</h2>
        <div style={{
            background: apiStatus === "API ONLINE" ? "rgba(46, 160, 67, 0.15)" : "rgba(248, 81, 73, 0.15)",
            color: apiStatus === "API ONLINE" ? "#3fb950" : "#f85149",
            border: `1px solid ${apiStatus === "API ONLINE" ? "rgba(46, 160, 67, 0.4)" : "rgba(248, 81, 73, 0.4)"}`,
            padding: "4px 12px",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "600"
          }}>
            {apiStatus}
        </div>
      </div>
      
      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        {METRICS.map((m) => (
          <div key={m.label} style={{
            background: "#0d1629",
            border: "1px solid #1a2d4f",
            borderRadius: 8,
            padding: "14px 16px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: m.color, opacity: 0.7,
            }} />
            <div style={{ fontSize: 11, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em", marginBottom: 6 }}>
              {m.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 10, color: "#3d5a7a", marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px 280px", gap: 16, flex: 1 }}>
        {/* Threat Heatmap */}
        <div style={{ background: "#0d1629", border: "1px solid #1a2d4f", borderRadius: 8, padding: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea" }}>Threat Heatmap</div>
              <div style={{ fontSize: 10, color: "#3d5a7a", marginTop: 2 }}>Log volume vs. incidents flagged · last 7 days</div>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
              <span style={{ color: "#5a7a9a" }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#00d4ff66", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />Volume</span>
              <span style={{ color: "#f59e0b" }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#f59e0b", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />Anomalous</span>
              <span style={{ color: "#ef4444" }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#ef4444", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />Incidents</span>
            </div>
          </div>

          {/* Hour labels */}
          <div style={{ display: "flex", marginLeft: 28, marginBottom: 4 }}>
            {HOURS.filter((h) => h % 4 === 0).map((h) => (
              <div key={h} style={{ flex: 4, fontSize: 9, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace", textAlign: "left" }}>{h.toString().padStart(2, "0")}h</div>
            ))}
          </div>

          {/* Grid */}
          {HEATMAP.map((row, d) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
              <div style={{ width: 26, fontSize: 9, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>{DAYS[d]}</div>
              {row.map((cell, h) => (
                <div
                  key={h}
                  title={`${DAYS[d]} ${h}:00 — ${cell.logs} logs · ${cell.incidents} incidents`}
                  style={{
                    flex: 1,
                    height: 18,
                    borderRadius: 2,
                    background: heatColor(cell.logs, cell.incidents),
                    cursor: "default",
                    transition: "transform 0.1s",
                  }}
                />
              ))}
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "8px 0 0", borderTop: "1px solid #0f1e35" }}>
            {[
              { label: "Total Logs (7d)", value: "1,284,721" },
              { label: "Incidents", value: "47" },
              { label: "Auto-resolved", value: "39" },
              { label: "Escalated", value: "8" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#c8d8ea", fontFamily: "JetBrains Mono, monospace" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "#3d5a7a" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SPS Gauge */}
        <div style={{ background: "#0d1629", border: "1px solid #1a2d4f", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea", marginBottom: 8, alignSelf: "flex-start" }}>SOC Productivity Score</div>
          <SPSGauge />
          <div style={{ marginTop: 12, width: "100%", background: "#0a1222", borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace", marginBottom: 6 }}>SPS = α(FA+RS+CI) − β(USR) + γ(TE)</div>
            <div style={{ fontSize: 11, color: "#00d4ff", fontFamily: "JetBrains Mono, monospace" }}>RAGSec: 2.711 <span style={{ color: "#10b981", fontSize: 10 }}>▲ +112.6%</span></div>
            <div style={{ fontSize: 11, color: "#f59e0b", fontFamily: "JetBrains Mono, monospace" }}>LLM-only: 1.275</div>
          </div>
        </div>

        {/* Autonomous Actions */}
        <div style={{ background: "#0d1629", border: "1px solid #1a2d4f", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea", marginBottom: 12 }}>Autonomous Actions</div>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 6 }}>
            {ACTIONS.map((a, i) => {
              const active = i === actionIdx
              return (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: active ? `${severityColor(a.severity)}11` : "transparent",
                    border: `1px solid ${active ? severityColor(a.severity) + "33" : "#0f1e35"}`,
                    transition: "all 0.4s",
                    opacity: active ? 1 : i === (actionIdx + 1) % ACTIONS.length || i === (actionIdx - 1 + ACTIONS.length) % ACTIONS.length ? 0.7 : 0.35,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace", color: severityColor(a.severity), textTransform: "uppercase", letterSpacing: "0.06em" }}>{a.type}</span>
                    <span style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace", color: "#2d4878" }}>{a.time}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#8aa8c8", lineHeight: 1.4 }}>{a.action}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Incidents Table */}
      <div style={{ background: "#0d1629", border: "1px solid #1a2d4f", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #0f1e35", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea" }}>Recent Incidents</div>
          <div style={{ fontSize: 10, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace" }}>INC = Incident · AUTO = Auto-mitigated · ESC = Escalated</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #0f1e35" }}>
              {["Incident ID", "Severity", "Type", "Source", "Target", "Detected", "Status", "SPS θ"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#3d5a7a", fontWeight: 500, fontSize: 10, letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { id: "INC-2851", sev: "P1", sevC: "#ef4444", type: "Ransomware Encryption", src: "185.220.101.45", tgt: "WS-042, DB-SRV-01", time: "14:19 UTC", status: "ESC", θ: "0.97" },
              { id: "INC-2850", sev: "P2", sevC: "#f59e0b", type: "Lateral Movement", src: "WS-042", tgt: "DC-01, DB-SRV-01", time: "13:55 UTC", status: "AUTO", θ: "0.89" },
              { id: "INC-2847", sev: "P3", sevC: "#8b5cf6", type: "SSH Brute Force", src: "46.161.27.134", tgt: "10.1.0.0/24", time: "12:41 UTC", status: "AUTO", θ: "0.76" },
              { id: "INC-2844", sev: "P4", sevC: "#10b981", type: "Phishing Email", src: "mail.ru-proxy.net", tgt: "jmartinez@corp", time: "11:22 UTC", status: "AUTO", θ: "0.65" },
            ].map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #0a1222" }}>
                <td style={{ padding: "9px 12px", color: "#00d4ff" }}>{row.id}</td>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{ color: row.sevC, background: row.sevC + "22", border: `1px solid ${row.sevC}44`, borderRadius: 4, padding: "2px 6px", fontSize: 10 }}>{row.sev}</span>
                </td>
                <td style={{ padding: "9px 12px", color: "#c8d8ea" }}>{row.type}</td>
                <td style={{ padding: "9px 12px", color: "#ef444499" }}>{row.src}</td>
                <td style={{ padding: "9px 12px", color: "#8aa8c8" }}>{row.tgt}</td>
                <td style={{ padding: "9px 12px", color: "#3d5a7a" }}>{row.time}</td>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{
                    color: row.status === "ESC" ? "#f59e0b" : "#10b981",
                    background: row.status === "ESC" ? "#f59e0b22" : "#10b98122",
                    border: `1px solid ${row.status === "ESC" ? "#f59e0b44" : "#10b98144"}`,
                    borderRadius: 4, padding: "2px 6px", fontSize: 10,
                  }}>{row.status}</span>
                </td>
                <td style={{ padding: "9px 12px", color: "#8b5cf6" }}>{row.θ}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
