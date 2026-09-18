import { useState, useEffect, useRef } from "react"

type Severity = "benign" | "anomalous" | "critical"

interface LogEntry {
  id: string
  ts: string
  severity: Severity
  src: string
  srcPort: number
  dst: string
  dstPort: number
  proto: string
  sig: string
  sid: string
  action: string
}

const SIGS = {
  benign: [
    { sig: "ET POLICY HTTP Request to CDN", sid: "1:2018752:3" },
    { sig: "ET DNS Query for .com TLD", sid: "1:2027758:1" },
    { sig: "ET INFO Outbound HTTPS to Cloud Provider", sid: "1:2033891:2" },
    { sig: "ET POLICY SMB2 NT Create Request File", sid: "1:2011540:5" },
    { sig: "ET DNS Standard Query Response", sid: "1:2016778:4" },
    { sig: "ET INFO Possible NTP Sync Request", sid: "1:2009700:6" },
  ],
  anomalous: [
    { sig: "ET SCAN Potential SSH Scan Detected", sid: "1:2001219:20" },
    { sig: "ET POLICY Outbound Traffic to Tor Exit Node", sid: "1:2522690:3" },
    { sig: "ET SCAN Rapid Port Sweep Multiple Ports", sid: "1:2011581:12" },
    { sig: "ET DNS Query for Dynamic DNS Provider", sid: "1:2027858:5" },
    { sig: "ET POLICY HTTP Request to .ru Domain", sid: "1:2019401:5" },
  ],
  critical: [
    { sig: "ET MALWARE Trojan Generic Beacon Activity", sid: "1:2010935:3" },
    { sig: "ET EXPLOIT Apache Log4j RCE Attempt CVE-2021-44228", sid: "1:2034764:3" },
    { sig: "ET MALWARE Mimikatz Credential Harvest Activity", sid: "1:2044248:2" },
    { sig: "ET MALWARE Cobalt Strike Beacon Detected", sid: "1:2019839:3" },
    { sig: "ET EXPLOIT EternalBlue SMB RCE MS17-010", sid: "1:2024218:4" },
  ],
}

const INTERNAL_IPS = ["10.1.0.15", "10.1.5.42", "10.1.2.10", "10.1.3.10", "10.1.1.10", "10.2.4.5", "10.1.5.18"]
const EXTERNAL_IPS = ["185.220.101.45", "92.53.116.124", "46.161.27.134", "194.165.16.78", "45.142.212.100", "198.54.117.244", "77.232.40.72"]

function genLog(): LogEntry {
  const rand = Math.random()
  const severity: Severity = rand < 0.6 ? "benign" : rand < 0.85 ? "anomalous" : "critical"
  const sigs = SIGS[severity]
  const { sig, sid } = sigs[Math.floor(Math.random() * sigs.length)]
  const external = severity !== "benign"
  const src = external ? EXTERNAL_IPS[Math.floor(Math.random() * EXTERNAL_IPS.length)] : INTERNAL_IPS[Math.floor(Math.random() * INTERNAL_IPS.length)]
  const dst = external ? INTERNAL_IPS[Math.floor(Math.random() * INTERNAL_IPS.length)] : INTERNAL_IPS[Math.floor(Math.random() * INTERNAL_IPS.length)]
  const commonPorts = [80, 443, 22, 445, 8080, 3389, 53, 25, 8443, 4444, 1337]
  return {
    id: Math.random().toString(36).slice(2),
    ts: new Date().toISOString().replace("T", " ").slice(11, 23),
    severity,
    src,
    srcPort: Math.floor(1024 + Math.random() * 60000),
    dst,
    dstPort: commonPorts[Math.floor(Math.random() * commonPorts.length)],
    proto: severity === "anomalous" && Math.random() < 0.3 ? "UDP" : "TCP",
    sig,
    sid,
    action: severity === "critical" ? "ALERT" : severity === "anomalous" ? "WARN" : "PASS",
  }
}

const SEV_COLOR: Record<Severity, string> = {
  benign: "#3d5a7a",
  anomalous: "#f59e0b",
  critical: "#ef4444",
}

const ACTION_COLOR: Record<string, string> = {
  ALERT: "#ef4444",
  WARN: "#f59e0b",
  PASS: "#3d5a7a",
}

export default function NetworkSecurity({ demoMode }: { demoMode?: boolean }) {
  const [logs, setLogs] = useState<LogEntry[]>(() => Array.from({ length: 25 }, genLog))
  const [filter, setFilter] = useState<"all" | Severity>("all")
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set(["185.220.101.45", "92.53.116.124"]))
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => {
      setLogs((prev) => {
        const newLog = genLog()
        return [newLog, ...prev].slice(0, 200)
      })
    }, 600)
    return () => clearInterval(t)
  }, [paused])

  const filtered = filter === "all" ? logs : logs.filter((l) => l.severity === filter)

  const counts = {
    all: logs.length,
    benign: logs.filter((l) => l.severity === "benign").length,
    anomalous: logs.filter((l) => l.severity === "anomalous").length,
    critical: logs.filter((l) => l.severity === "critical").length,
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Controls */}
      <div style={{
        padding: "10px 16px",
        background: "#080f1f",
        borderBottom: "1px solid #1a2d4f",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace" }}>FILTER:</div>
        {(["all", "benign", "anomalous", "critical"] as const).map((f) => {
          const active = filter === f
          const color = f === "all" ? "#00d4ff" : f === "benign" ? "#3d5a7a" : f === "anomalous" ? "#f59e0b" : "#ef4444"
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                border: `1px solid ${active ? color : color + "44"}`,
                background: active ? color + "22" : "transparent",
                color: active ? color : color + "99",
                cursor: "pointer",
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.06em",
              }}
            >
              {f.toUpperCase()} ({counts[f]})
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#3d5a7a" }}>
          Blocked IPs: <span style={{ color: "#ef4444" }}>{blockedIPs.size}</span>
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          style={{
            padding: "4px 14px",
            borderRadius: 4,
            border: `1px solid ${paused ? "#10b98144" : "#f59e0b44"}`,
            background: paused ? "#10b98111" : "#f59e0b11",
            color: paused ? "var(--color-primary)" : "#f59e0b",
            cursor: "pointer",
            fontSize: 10,
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {paused ? "▶ RESUME" : "⏸ PAUSE"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
          <div className="dot-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: paused ? "#f59e0b" : "var(--color-primary)" }} />
          <span style={{ color: paused ? "#f59e0b" : "var(--color-primary)" }}>{paused ? "PAUSED" : "LIVE"}</span>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: "auto",
          background: "#060b18",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
          padding: "8px 0",
        }}
      >
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "80px 50px 130px 55px 130px 55px 50px 1fr 55px",
          padding: "4px 12px 4px",
          borderBottom: "1px solid #0f1e35",
          color: "#2d4878",
          fontSize: 9,
          letterSpacing: "0.08em",
          position: "sticky",
          top: 0,
          background: "#060b18",
          zIndex: 1,
        }}>
          <span>TIME</span><span>ACTION</span><span>SRC IP</span><span>S.PORT</span>
          <span>DST IP</span><span>D.PORT</span><span>PROTO</span><span>SIGNATURE</span><span>SID</span>
        </div>

        {filtered.map((log, i) => {
          const color = SEV_COLOR[log.severity]
          const blocked = blockedIPs.has(log.src)
          const hovered = hoveredId === log.id

          return (
            <div
              key={log.id}
              onMouseEnter={() => setHoveredId(log.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={i === 0 && !paused ? "row-appear" : ""}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 50px 130px 55px 130px 55px 50px 1fr 55px",
                padding: "3px 12px",
                background: hovered ? color + "0d" : blocked && log.severity !== "benign" ? "#ef444408" : "transparent",
                borderLeft: hovered ? `2px solid ${color}` : "2px solid transparent",
                transition: "all 0.1s",
                position: "relative",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#2d4878" }}>{log.ts}</span>
              <span style={{
                color: ACTION_COLOR[log.action],
                background: ACTION_COLOR[log.action] + "22",
                padding: "1px 4px",
                borderRadius: 2,
                fontSize: 9,
                display: "inline-block",
              }}>{log.action}</span>
              <span style={{ color: log.severity === "benign" ? "#3d5a7a" : log.severity === "anomalous" ? "#f59e0b" : "#ef4444" }}>
                {blocked ? "⊘ " : ""}{log.src}
              </span>
              <span style={{ color: "#2d4878" }}>{log.srcPort}</span>
              <span style={{ color: "#5a7a9a" }}>{log.dst}</span>
              <span style={{ color: "#2d4878" }}>{log.dstPort}</span>
              <span style={{ color: "#3d5a7a" }}>{log.proto}</span>
              <span style={{ color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.sig}</span>
              <span style={{ color: "#2d4878", fontSize: 9 }}>{log.sid}</span>

              {/* Hover action buttons for anomalous/critical */}
              {hovered && log.severity !== "benign" && (
                <div style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  gap: 6,
                  zIndex: 10,
                }}>
                  <button
                    onClick={() => alert(`Launching RAGSec investigation for ${log.src}\nSignature: ${log.sig}`)}
                    style={{
                      padding: "3px 10px",
                      background: "#8b5cf622",
                      border: "1px solid #8b5cf666",
                      borderRadius: 4,
                      color: "#8b5cf6",
                      cursor: "pointer",
                      fontSize: 9,
                      fontFamily: "JetBrains Mono, monospace",
                      whiteSpace: "nowrap",
                    }}
                  >Investigate AI</button>
                  <button
                    onClick={() => setBlockedIPs((s) => new Set([...s, log.src]))}
                    style={{
                      padding: "3px 10px",
                      background: "#ef444422",
                      border: "1px solid #ef444466",
                      borderRadius: 4,
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 9,
                      fontFamily: "JetBrains Mono, monospace",
                      whiteSpace: "nowrap",
                    }}
                  >Block IP</button>
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Stats bar */}
      <div style={{
        padding: "8px 16px",
        background: "#080f1f",
        borderTop: "1px solid #0f1e35",
        display: "flex",
        gap: 24,
        fontSize: 10,
        fontFamily: "JetBrains Mono, monospace",
        flexShrink: 0,
      }}>
        <span style={{ color: "#3d5a7a" }}>SHOWING {filtered.length.toLocaleString()} EVENTS</span>
        <span style={{ color: "var(--color-primary)" }}>BENIGN: {counts.benign}</span>
        <span style={{ color: "#f59e0b" }}>ANOMALOUS: {counts.anomalous}</span>
        <span style={{ color: "#ef4444" }}>CRITICAL: {counts.critical}</span>
        <span style={{ color: "#3d5a7a", marginLeft: "auto" }}>Snort 3.1.74.0 · Suricata 7.0.3 · ECS 8.11</span>
      </div>
    </div>
  )
}
