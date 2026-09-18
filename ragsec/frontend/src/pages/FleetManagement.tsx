import { useState, useEffect } from "react"

const NODES = [
  { id: "FIREWALL-01", type: "firewall", x: 350, y: 50, status: "healthy", ip: "10.0.0.1" },
  { id: "SERVERS", type: "server", x: 200, y: 250, status: "healthy", ip: "10.1.X.X" },
  { id: "WORKSTATIONS", type: "workstation", x: 500, y: 250, status: "critical", ip: "10.2.X.X" },
]

const EDGES = [
  ["FIREWALL-01", "SERVERS"],
  ["FIREWALL-01", "WORKSTATIONS"],
  ["SERVERS", "WORKSTATIONS"],
]

const STATUS_COLORS: Record<string, string> = {
  healthy: "var(--color-primary)",
  warning: "#f59e0b",
  critical: "#ef4444",
}

const CATEGORIES = [
  "Phishing", "Malware", "Ransomware", "Spyware", "Trojan",
  "Brute-Force", "DoS/DDoS", "Data Exfiltration", "Command and Control", "Insider Threat"
]

interface FIMEvent {
  id: string; ts: string; host: string; path: string
  action: "MODIFIED" | "ADDED" | "DELETED"; hash: string; user: string
  judgment: "Benign" | "Suspicious"
  diff: { removed: string[]; added: string[] } | null
}

export default function FleetManagement({ demoMode }: { demoMode?: boolean }) {
  const [events, setEvents] = useState<FIMEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<FIMEvent | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // Polling for FIM events
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/fim/alerts")
      .then(res => res.json())
      .then(data => {
        const parsed = data.map((d: any) => ({
          id: d.id || Math.random().toString(),
          ts: d.timestamp,
          host: d.device_id || "Unknown",
          path: d.raw_message?.split(" ")[1] || "/unknown",
          action: "MODIFIED",
          hash: d.id,
          user: "root",
          judgment: d.is_suspicious ? "Suspicious" : "Benign",
          diff: d.raw_message?.includes("Payload") ? {
            removed: ["-old_code()"],
            added: ["+new_malicious_code()"]
          } : null,
          raw_message: d.raw_message
        }));
        setEvents(parsed);
      })
      .catch(err => console.error(err));
  }, []);

  const getNode = (id: string) => NODES.find((n) => n.id === id)!

  const analyzeFile = async (e: FIMEvent) => {
    setSelectedEvent(e);
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/analysis/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: e.path,
          content_b64: btoa(e.diff ? e.diff.added.join("\n") : "print('hello')")
        })
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      
      {/* Top Half: Topology & Logs */}
      <div style={{ display: "flex", flex: 1, gap: 16, minHeight: 400 }}>
        {/* Left: Topology (3 Circles) */}
        <div style={{ flex: 1, background: "var(--color-card)", border: "1px solid #27272a", position: "relative" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #27272a" }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-main)", fontFamily: "JetBrains Mono, monospace" }}>NETWORK TOPOLOGY</h3>
          </div>
          <svg width="100%" height="100%" style={{ position: "absolute", top: 40, left: 0 }}>
            {EDGES.map(([u, v]) => {
              const n1 = getNode(u), n2 = getNode(v)
              return (
                <line key={`${u}-${v}`} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="#27272a" strokeWidth={2} strokeDasharray="4,4" />
              )
            })}
            {NODES.map((n) => (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                <circle cx={0} cy={0} r={40} fill="var(--color-card)" stroke={STATUS_COLORS[n.status]} strokeWidth={3} />
                <text x={0} y={5} textAnchor="middle" fill="var(--color-text-main)" fontSize={12} fontFamily="JetBrains Mono, monospace" fontWeight="bold">{n.type.toUpperCase()}</text>
                <text x={0} y={20} textAnchor="middle" fill="var(--color-text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">{n.ip}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Right: Network & FIM Logs */}
        <div style={{ width: 450, background: "var(--color-card)", border: "1px solid #27272a", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #27272a" }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-main)", fontFamily: "JetBrains Mono, monospace" }}>DEVICE LOGS</h3>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {events.length === 0 && <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>No logs detected.</div>}
            {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => analyzeFile(ev)}
                style={{
                  padding: 12, marginBottom: 8, cursor: "pointer",
                  border: `1px solid ${ev.judgment === "Suspicious" ? "#ef4444" : "#27272a"}`,
                  background: ev.judgment === "Suspicious" ? "rgba(239,68,68,0.05)" : "transparent"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: ev.judgment === "Suspicious" ? "#ef4444" : "var(--color-primary)", fontFamily: "JetBrains Mono, monospace" }}>{ev.judgment.toUpperCase()}</span>
                  <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace" }}>{ev.ts}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-main)", fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>{ev.path || (ev as any).raw_message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Half: Alert Analyzer & Classifier */}
      <div style={{ height: 350, background: "var(--color-card)", border: "1px solid #27272a", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-main)", fontFamily: "JetBrains Mono, monospace" }}>LLM ALERT ANALYZER</h3>
        </div>
        
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          
          {/* Left: Diff / Code view */}
          <div style={{ flex: 1, borderRight: "1px solid #27272a", padding: 16, overflowY: "auto" }}>
            {selectedEvent ? (
              <>
                <h4 style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace", marginBottom: 12 }}>{selectedEvent.path}</h4>
                {selectedEvent.diff ? (
                  <pre style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.5, background: "#18181b", padding: 12 }}>
                    {selectedEvent.diff.removed.map((l, i) => <div key={`r-${i}`} style={{ color: "#f87171" }}>{l}</div>)}
                    {selectedEvent.diff.added.map((l, i) => <div key={`a-${i}`} style={{ color: "#4ade80" }}>{l}</div>)}
                  </pre>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>No code diff available.</div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace" }}>Select a log entry to analyze.</div>
            )}
          </div>

          {/* Right: AI Analysis & Classifier */}
          <div style={{ width: 450, padding: 16, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {analyzing ? (
              <div style={{ color: "var(--color-text-main)", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>Initializing LLM analysis...</div>
            ) : analysisResult ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 10, color: "var(--color-text-muted)", marginBottom: 8, fontFamily: "JetBrains Mono, monospace" }}>THREAT CATEGORY CLASSIFIER</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {CATEGORIES.map(cat => (
                      <div key={cat} style={{
                        padding: "4px 8px", fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                        background: analysisResult.threat_category === cat ? "#ef4444" : "#27272a",
                        color: analysisResult.threat_category === cat ? "#fff" : "var(--color-text-muted)",
                        border: `1px solid ${analysisResult.threat_category === cat ? "#ef4444" : "#3f3f46"}`
                      }}>
                        {cat.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 10, color: "var(--color-text-muted)", marginBottom: 8, fontFamily: "JetBrains Mono, monospace" }}>AI REASONING</h4>
                  <div style={{ fontSize: 12, color: "var(--color-text-main)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {analysisResult.ai_analysis || analysisResult.rationale}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
