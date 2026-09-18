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
  if (incidents > 10) return `rgba(248,113,113,${0.5 + incidents / 60})` // red-400
  if (incidents > 0) return `rgba(251,191,36,${0.4 + norm * 0.4})` // amber-400
  const r = 39, g = 39, b = 42 // zinc-800
  return `rgba(${r},${g},${b},${0.15 + norm * 0.65})`
}

const severityColor = (s: string) =>
  s === "critical" ? "#f87171" : s === "high" ? "#fbbf24" : s === "medium" ? "#9ca3af" : "var(--color-primary)"


export default function Dashboard({ demoMode }: { demoMode?: boolean }) {
  const [metricsData, setMetricsData] = useState<any[]>([])
  const [apiStatus, setApiStatus] = useState("CONNECTING...")
  const [incidents, setIncidents] = useState<any[]>([])
  const [fimEvents, setFimEvents] = useState<any[]>([])

  useEffect(() => {
    if (demoMode) {
      setApiStatus("API DEMO MODE");
      return;
    }
    fetch("http://127.0.0.1:8000/api/soc/dashboard")
      .then(res => res.json())
      .then(data => {
        setApiStatus("API ONLINE");
        if (data.metrics) {
          setMetricsData([
            { label: "Active Incidents", value: String(data.metrics.total_incidents || 0), sub: `Critical: ${data.metrics.critical_incidents || 0}`, color: "var(--color-primary)" },
            { label: "Total Events", value: String(data.metrics.total_events || 0), sub: `FIM: ${data.metrics.fim_events || 0}`, color: "#38bdf8" },
            { label: "Indexed Docs", value: "24", sub: "Corpus Active", color: "#9ca3af" },
            { label: "Device Count", value: String(data.metrics.device_count || 0), sub: "Monitored Hosts", color: "var(--color-primary)" },
          ])
        }
        if (data.incidents) {
          setIncidents(data.incidents);
        }
        if (data.fim) {
          setFimEvents(data.fim);
        }
      })
      .catch(() => setApiStatus("API OFFLINE"));
  }, [demoMode]);

  return (
    <div className="flex flex-col gap-6 min-h-full">
      {/* Header with API Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: "1px solid #27272a", paddingBottom: 16 }}>
        <h2 style={{ color: "var(--color-text-main)", fontSize: 16, fontWeight: 600, letterSpacing: "0.05em", fontFamily: "JetBrains Mono, monospace" }}>OVERVIEW</h2>
        <div style={{
            background: apiStatus === "API ONLINE" ? "#14532d" : "#7f1d1d",
            color: apiStatus === "API ONLINE" ? "var(--color-primary)" : "#f87171",
            border: `1px solid ${apiStatus === "API ONLINE" ? "#166534" : "#991b1b"}`,
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: "600",
            fontFamily: "JetBrains Mono, monospace"
          }}>
            {apiStatus}
        </div>
      </div>
      
      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {metricsData.map((m) => (
          <div key={m.label} style={{
            background: "var(--color-card)",
            border: "1px solid #27272a",
            padding: "12px 16px",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, bottom: 0, width: 2,
              background: m.color,
            }} />
            <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em", marginBottom: 8 }}>
              {m.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 6, fontFamily: "JetBrains Mono, monospace" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
        {/* Threat Heatmap */}
        <div style={{ background: "var(--color-card)", border: "1px solid #27272a", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-main)", fontFamily: "JetBrains Mono, monospace" }}>THREAT HEATMAP (7 DAYS)</div>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
              <span style={{ color: "var(--color-text-muted)" }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#3f3f46", marginRight: 4, verticalAlign: "middle" }} />VOLUME</span>
              <span style={{ color: "#fbbf24" }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#fbbf24", marginRight: 4, verticalAlign: "middle" }} />ANOMALOUS</span>
              <span style={{ color: "#f87171" }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#f87171", marginRight: 4, verticalAlign: "middle" }} />INCIDENTS</span>
            </div>
          </div>

          <div style={{ display: "flex", marginLeft: 28, marginBottom: 4 }}>
            {HOURS.filter((h) => h % 4 === 0).map((h) => (
              <div key={h} style={{ flex: 4, fontSize: 9, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace", textAlign: "left" }}>{h.toString().padStart(2, "0")}h</div>
            ))}
          </div>

          {HEATMAP.map((row, d) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
              <div style={{ width: 26, fontSize: 9, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>{DAYS[d]}</div>
              {row.map((cell, h) => (
                <div
                  key={h}
                  title={`${DAYS[d]} ${h}:00 — ${cell.logs} logs · ${cell.incidents} incidents`}
                  style={{
                    flex: 1,
                    height: 24,
                    background: heatColor(cell.logs, cell.incidents),
                    cursor: "default",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Suspicious Logs & Alerts */}
        <div style={{ background: "var(--color-card)", border: "1px solid #27272a", padding: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-main)", marginBottom: 16, fontFamily: "JetBrains Mono, monospace" }}>ACTIVE FIM ALERTS</div>
          <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {fimEvents.length === 0 ? (
                <div style={{color: "var(--color-text-muted)", fontSize: 12}}>No suspicious logs found.</div>
            ) : fimEvents.map((a, i) => {
              const sev = a.is_suspicious ? "critical" : "medium";
              return (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    background: `${severityColor(sev)}11`,
                    borderLeft: `2px solid ${severityColor(sev)}`,
                    transition: "all 0.1s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace", color: severityColor(sev), textTransform: "uppercase", letterSpacing: "0.06em" }}>{a.source_type}</span>
                    <span style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace", color: "var(--color-text-muted)" }}>{a.timestamp}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-text-muted)", lineHeight: 1.4, fontFamily: "JetBrains Mono, monospace" }}>{a.raw_message}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Incidents Table */}
      <div style={{ background: "var(--color-card)", border: "1px solid #27272a" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-main)", fontFamily: "JetBrains Mono, monospace" }}>ACTIVE INCIDENTS</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #27272a" }}>
              {["INCIDENT ID", "SEV", "TYPE", "STATUS"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 600, fontSize: 9, letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
                <tr><td colSpan={4} style={{padding: "16px", textAlign: "center", color: "var(--color-text-muted)"}}>No active incidents.</td></tr>
            ) : incidents.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #27272a" }}>
                <td style={{ padding: "10px 16px", color: "var(--color-text-main)" }}>{row.id}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ color: severityColor(row.threat_classification?.severity || "low"), border: `1px solid ${severityColor(row.threat_classification?.severity || "low")}`, padding: "2px 6px", fontSize: 9 }}>
                    {(row.threat_classification?.severity || "low").toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-main)" }}>{row.threat_classification?.category || "Unknown"}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{
                    color: row.status === "OPEN" ? "#fbbf24" : "var(--color-primary)",
                    border: `1px solid ${row.status === "OPEN" ? "#fbbf24" : "var(--color-primary)"}`,
                    padding: "2px 6px", fontSize: 9,
                  }}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
