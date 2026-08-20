import { useState, useEffect, useRef } from "react"

interface Message {
  id: string
  role: "analyst" | "ragsec"
  content: string
  citations?: Citation[]
  ts: string
  confidence?: number
  severity?: "P1" | "P2" | "P3"
}

interface Citation {
  id: string
  uuid: string
  source: string
  type: "SOP" | "ThreatReport" | "Log" | "MITRE"
  excerpt: string
  relevance: number
}

const CITATIONS: Citation[] = [
  {
    id: "c1", uuid: "a3f2-b891-cc12-d456", source: "Threat Intel: APT29 TTPs 2024",
    type: "ThreatReport",
    excerpt: "APT29 has been observed leveraging compromised residential proxy infrastructure, specifically Tor exit nodes in the 185.220.0.0/16 range, to stage initial reconnaissance and subsequent credential harvesting operations against enterprise Active Directory environments.",
    relevance: 0.94,
  },
  {
    id: "c2", uuid: "f7a1-e823-9b34-0c12", source: "SOC SOP: Lateral Movement Response v3.2",
    type: "SOP",
    excerpt: "Upon detection of lateral movement indicators (T1021, T1078), the analyst shall: (1) immediately isolate the source workstation via network quarantine, (2) capture volatile memory before shutdown, (3) notify the incident commander if DC or database servers are targeted.",
    relevance: 0.91,
  },
  {
    id: "c3", uuid: "8c45-d217-ab89-3ef0", source: "IDS Log: WS-042 14:11:30 UTC",
    type: "Log",
    excerpt: "[14:11:30] ALERT ET MALWARE Mimikatz Credential Harvest Activity 10.1.5.42:52341 -> 10.1.1.10:445 TCP ALERT",
    relevance: 0.97,
  },
  {
    id: "c4", uuid: "2d78-f934-bc56-17a2", source: "MITRE ATT&CK T1003.001",
    type: "MITRE",
    excerpt: "OS Credential Dumping: LSASS Memory. Adversaries may attempt to access credential material stored in the process memory of the Local Security Authority Subsystem Service (LSASS). Credential dumping can allow an adversary to access credentials that can be used for lateral movement.",
    relevance: 0.89,
  },
  {
    id: "c5", uuid: "9e23-a456-dc78-b901", source: "CVE-2024-21762 Advisory",
    type: "ThreatReport",
    excerpt: "Fortinet FortiOS SSL-VPN out-of-bounds write vulnerability. CVSS 9.6 (Critical). Active exploitation observed in the wild by ransomware groups targeting enterprise networks. Patch immediately — no workaround available.",
    relevance: 0.76,
  },
]

const CONVERSATION: Omit<Message, "id" | "ts">[] = [
  {
    role: "analyst",
    content: "RAGSec, analyze the current incident INC-2851. WS-042 appears to be attempting lateral movement to DC-01. What's the threat actor profile and recommended containment?",
  },
  {
    role: "ragsec",
    content: "Based on retrieved threat intelligence [cite:a3f2-b891] and correlated IDS logs [cite:8c45-d217-ab89-3ef0], the activity on WS-042 exhibits high-confidence indicators consistent with APT29 tradecraft.\n\n**Threat Assessment:**\nThe source IP 185.220.101.45 is a known Tor exit node associated with APT29 staging infrastructure [cite:a3f2-b891]. The Mimikatz signature detected at 14:11:30 UTC indicates credential harvesting targeting LSASS memory (MITRE T1003.001 [cite:2d78-f934-bc56-17a2]).\n\n**Recommended Containment — per SOP v3.2 [cite:f7a1-e823-9b34-0c12]:**\n1. Network quarantine of WS-042 (autonomous action already executed)\n2. Block 185.220.101.45 at perimeter firewall (executed)\n3. Volatile memory capture from WS-042 before any shutdown\n4. Audit DC-01 authentication logs for T1078 abuse\n\n**Risk:** Active credential access may enable domain-wide compromise if DC-01 lateral movement succeeds. Escalation to P1 incident commander recommended.",
    citations: [CITATIONS[0], CITATIONS[1], CITATIONS[2], CITATIONS[3]],
    confidence: 0.94,
    severity: "P1",
  },
  {
    role: "analyst",
    content: "Is CVE-2024-21762 relevant here? We have unpatched Fortinet devices on the perimeter.",
  },
  {
    role: "ragsec",
    content: "Retrieval confidence for CVE-2024-21762 in relation to this specific incident is moderate (θ_sim: 0.76, below P1 threshold 0.95) [cite:9e23-a456-dc78-b901].\n\n**Evidence Assessment:**\nWhile CVE-2024-21762 is a critical vulnerability [cite:9e23-a456-dc78-b901] and your perimeter Fortinet devices are unpatched (retrieved from asset inventory: FIREWALL-01 v7.2.4), I cannot confirm it was the initial access vector for INC-2851 with sufficient evidence. The retrieved corpus does not contain exploitation artifacts for this CVE in the current incident timeline.\n\n**Governance Response:**\nPer abstention policy (severity P1, θ_conf < 0.95): I am not generating a speculative attribution chain. However, immediate patching of CVE-2024-21762 is recommended as a parallel hardening action regardless of this incident.\n\n⊘ *Abstention notice: Attribution of initial access vector requires additional forensic evidence. Recommend memory forensics on WS-042.*",
    citations: [CITATIONS[4]],
    confidence: 0.76,
    severity: "P2",
  },
]

function CitationCard({ c, active, onClick }: { c: Citation; active: boolean; onClick: () => void }) {
  const typeColors: Record<string, string> = {
    SOP: "#00d4ff",
    ThreatReport: "#f59e0b",
    Log: "#10b981",
    MITRE: "#8b5cf6",
  }
  const color = typeColors[c.type]
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 12px",
        background: active ? color + "11" : "#080f1f",
        border: `1px solid ${active ? color + "55" : "#0f1e35"}`,
        borderRadius: 6,
        cursor: "pointer",
        marginBottom: 6,
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 9, color, background: color + "22", padding: "1px 6px", borderRadius: 3, fontFamily: "JetBrains Mono, monospace" }}>{c.type}</span>
        <span style={{ fontSize: 9, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace" }}>θ={c.relevance.toFixed(2)}</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#c8d8ea", marginBottom: 4, lineHeight: 1.3 }}>{c.source}</div>
      <div style={{ fontSize: 9, color: "#5a7a9a", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {c.excerpt}
      </div>
      <div style={{ fontSize: 8, color: "#2d4878", fontFamily: "JetBrains Mono, monospace", marginTop: 4 }}>[{c.uuid}]</div>
    </div>
  )
}

function renderContent(text: string, masked: boolean, onCiteClick: (id: string) => void) {
  const lines = text.split("\n")
  return lines.map((line, i) => {
    const parts = line.split(/(\[cite:[^\]]+\])/g)
    return (
      <div key={i} style={{ marginBottom: line === "" ? 8 : 2 }}>
        {parts.map((part, j) => {
          const citeMatch = part.match(/\[cite:([^\]]+)\]/)
          if (citeMatch) {
            const uuid = citeMatch[1]
            return (
              <span
                key={j}
                onClick={() => onCiteClick(uuid)}
                style={{
                  color: "#00d4ff",
                  cursor: "pointer",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  background: "#00d4ff11",
                  padding: "1px 4px",
                  borderRadius: 3,
                  border: "1px solid #00d4ff33",
                  textDecoration: "underline",
                }}
              >
                [{uuid.slice(0, 8)}]
              </span>
            )
          }
          const maskedPart = masked
            ? part
                .replace(/WS-\d+/g, "<INTERNAL_HOST_1>")
                .replace(/DC-\d+/g, "<INTERNAL_HOST_2>")
                .replace(/DB-SRV-\d+/g, "<INTERNAL_HOST_3>")
                .replace(/10\.\d+\.\d+\.\d+/g, "<INTERNAL_IP>")
            : part

          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j} style={{ color: "#e2eaf5" }}>{maskedPart.replace(/\*\*/g, "")}</strong>
          }
          if (part.startsWith("⊘")) {
            return <span key={j} style={{ color: "#f59e0b", fontStyle: "italic" }}>{maskedPart}</span>
          }
          return <span key={j} style={{ color: "#c8d8ea" }}>{maskedPart}</span>
        })}
      </div>
    )
  })
}

export default function ActiveIncident() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [masked, setMasked] = useState(true)
  const [activeCite, setActiveCite] = useState<string | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const allCitations = messages.flatMap((m) => m.citations || [])
  const uniqueCites = allCitations.filter((c, i, a) => a.findIndex((x) => x.uuid === c.uuid) === i)
  const activeCiteObj = activeCite ? CITATIONS.find((c) => c.uuid === activeCite || c.uuid.startsWith(activeCite)) : null

  useEffect(() => {
    if (msgIndex >= CONVERSATION.length) return
    const delay = msgIndex === 0 ? 600 : CONVERSATION[msgIndex].role === "ragsec" ? 1400 : 800
    const t = setTimeout(() => {
      if (CONVERSATION[msgIndex].role === "ragsec") {
        setTyping(true)
        setTimeout(() => {
          setTyping(false)
          setMessages((prev) => [...prev, {
            ...CONVERSATION[msgIndex],
            id: Math.random().toString(36).slice(2),
            ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
          }])
          setMsgIndex((i) => i + 1)
        }, 2200)
      } else {
        setMessages((prev) => [...prev, {
          ...CONVERSATION[msgIndex],
          id: Math.random().toString(36).slice(2),
          ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
        }])
        setMsgIndex((i) => i + 1)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [msgIndex])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, {
      id: Math.random().toString(36).slice(2),
      role: "analyst",
      content: input,
      ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
    }])
    setInput("")
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, {
        id: Math.random().toString(36).slice(2),
        role: "ragsec",
        content: "⊘ *Abstention notice:* Insufficient evidence in retrieved corpus to answer this query with confidence above the P1 threshold (θ_sim required: 0.95). Please provide additional context or escalate to human incident commander for manual investigation.\n\nAvailable evidence sources: [cite:a3f2-b891] [cite:f7a1-e823-9b34-0c12]",
        citations: [CITATIONS[0], CITATIONS[1]],
        confidence: 0.61,
        ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
      }])
    }, 2500)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Incident Banner */}
      <div style={{
        background: "#ef444411",
        border: "1px solid #ef444433",
        borderLeft: "3px solid #ef4444",
        margin: "10px 16px",
        borderRadius: 6,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#ef4444", background: "#ef444422", padding: "1px 8px", borderRadius: 4, border: "1px solid #ef444444" }}>P1 — CRITICAL</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", fontFamily: "JetBrains Mono, monospace" }}>INC-2851</span>
            <span style={{ fontSize: 11, color: "#c8d8ea" }}>Active Ransomware / Lateral Movement</span>
          </div>
          <div style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "JetBrains Mono, monospace" }}>
            Trigger: Mimikatz on WS-042 → DC-01 · Source: 185.220.101.45 (Tor) · Detected: 14:11:30 UTC · θ_sim: 0.97 · Sources: 4
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button style={{ padding: "5px 12px", background: "#f59e0b22", border: "1px solid #f59e0b44", borderRadius: 6, color: "#f59e0b", cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
            Escalate → INC CMD
          </button>
          <button style={{ padding: "5px 12px", background: "#ef444422", border: "1px solid #ef444444", borderRadius: 6, color: "#ef4444", cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
            Full Report
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", gap: 0, overflow: "hidden", minHeight: 0 }}>
        {/* Chat */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #1a2d4f" }}>
          {/* Chat toolbar */}
          <div style={{ padding: "8px 16px", borderBottom: "1px solid #0f1e35", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: "#080f1f" }}>
            <div style={{ fontSize: 11, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace" }}>RAGSec Co-Pilot · Federated RAG · CRC Active</div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: masked ? "#f59e0b" : "#10b981", fontFamily: "JetBrains Mono, monospace" }}>
                {masked ? "PII MASKED" : "PII REVEALED"}
              </span>
              <button
                onClick={() => setMasked((m) => !m)}
                style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: masked ? "#f59e0b44" : "#10b98144",
                  border: `1px solid ${masked ? "#f59e0b88" : "#10b98188"}`,
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s",
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: masked ? "#f59e0b" : "#10b981",
                  position: "absolute",
                  top: 2,
                  left: masked ? 2 : 20,
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
            {messages.map((msg) => {
              const isRag = msg.role === "ragsec"
              return (
                <div key={msg.id} className="row-appear" style={{ marginBottom: 16, display: "flex", gap: 10, flexDirection: isRag ? "row" : "row-reverse" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: isRag ? "linear-gradient(135deg, #8b5cf622, #00d4ff22)" : "linear-gradient(135deg, #1e3a5f, #2d5a8e)",
                    border: `1px solid ${isRag ? "#00d4ff44" : "#2d4878"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: isRag ? "#00d4ff" : "#7ab3dd",
                  }}>
                    {isRag ? "AI" : "SA"}
                  </div>
                  <div style={{ maxWidth: "85%" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexDirection: isRag ? "row" : "row-reverse" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: isRag ? "#00d4ff" : "#7ab3dd", fontFamily: "JetBrains Mono, monospace" }}>
                        {isRag ? "RAGSec Agent" : "L2 Analyst"}
                      </span>
                      {msg.confidence !== undefined && (
                        <span style={{ fontSize: 9, color: msg.confidence > 0.85 ? "#10b981" : msg.confidence > 0.7 ? "#f59e0b" : "#ef4444", fontFamily: "JetBrains Mono, monospace", background: "#0d1629", padding: "1px 5px", borderRadius: 3 }}>
                          θ={msg.confidence.toFixed(2)}
                        </span>
                      )}
                      <span style={{ fontSize: 9, color: "#2d4878", fontFamily: "JetBrains Mono, monospace" }}>{msg.ts}</span>
                    </div>
                    <div style={{
                      background: isRag ? "#0d1629" : "#111d35",
                      border: `1px solid ${isRag ? "#1a2d4f" : "#1e3a5f"}`,
                      borderRadius: isRag ? "2px 8px 8px 8px" : "8px 2px 8px 8px",
                      padding: "10px 14px",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}>
                      {renderContent(msg.content, masked, (uuid) => setActiveCite(uuid))}
                    </div>
                  </div>
                </div>
              )
            })}

            {typing && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #8b5cf622, #00d4ff22)",
                  border: "1px solid #00d4ff44",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#00d4ff",
                }}>AI</div>
                <div style={{
                  background: "#0d1629", border: "1px solid #1a2d4f",
                  borderRadius: "2px 8px 8px 8px", padding: "12px 16px",
                  display: "flex", gap: 6, alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%", background: "#00d4ff",
                      animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                  <span style={{ fontSize: 10, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace", marginLeft: 4 }}>RAG retrieval in progress…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 16px", borderTop: "1px solid #0f1e35", flexShrink: 0, display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask RAGSec about this incident…"
              style={{
                flex: 1,
                background: "#0d1629",
                border: "1px solid #1a2d4f",
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 12,
                color: "#c8d8ea",
                fontFamily: "Inter, sans-serif",
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#00d4ff66" }}
              onBlur={(e) => { e.target.style.borderColor = "#1a2d4f" }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
                border: "1px solid #00d4ff44",
                borderRadius: 6,
                color: "#00d4ff",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >SEND</button>
          </div>
        </div>

        {/* Citation Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#080f1f" }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #0f1e35", flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#c8d8ea" }}>Evidence Citations</div>
            <div style={{ fontSize: 9, color: "#3d5a7a", marginTop: 2, fontFamily: "JetBrains Mono, monospace" }}>CRC verified · click to expand</div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
            {activeCiteObj && (
              <div style={{ padding: "10px 12px", background: "#00d4ff0a", border: "1px solid #00d4ff33", borderRadius: 6, marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: "#00d4ff", fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>SOURCE DOCUMENT</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#c8d8ea", marginBottom: 6 }}>{activeCiteObj.source}</div>
                <div style={{ fontSize: 11, color: "#8aa8c8", lineHeight: 1.6 }}>{activeCiteObj.excerpt}</div>
                <div style={{ fontSize: 8, color: "#2d4878", fontFamily: "JetBrains Mono, monospace", marginTop: 6 }}>UUID: {activeCiteObj.uuid}</div>
              </div>
            )}

            {uniqueCites.length === 0 && (
              <div style={{ fontSize: 10, color: "#2d4878", textAlign: "center", marginTop: 40, fontFamily: "JetBrains Mono, monospace" }}>
                Citations will appear<br />as RAGSec responds
              </div>
            )}

            {uniqueCites.map((c) => (
              <CitationCard
                key={c.uuid}
                c={c}
                active={activeCite === c.uuid || (!!activeCite && c.uuid.startsWith(activeCite))}
                onClick={() => setActiveCite(activeCite === c.uuid ? null : c.uuid)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
