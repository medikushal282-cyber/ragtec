import { useState } from "react"

interface PendingAction {
  id: string
  incident: string
  severity: "P1" | "P2" | "P3"
  action: string
  target: string
  impact: "critical" | "high" | "medium"
  rationale: string
  sources: number
  confidence: number
  status: "pending" | "approved" | "denied"
}

interface ActiveCountermeasure {
  id: string
  type: string
  target: string
  reason: string
  started: string
  ttl: string
  auto: boolean
  incident: string
}

interface PlaybookStep {
  id: string
  action: string
  mode: "auto" | "manual"
  description: string
  color: string
}

const INITIAL_PENDING: PendingAction[] = [
  {
    id: "pa-001", incident: "INC-2851", severity: "P1",
    action: "Quarantine Server", target: "DB-SRV-01 (10.1.2.10)",
    impact: "critical",
    rationale: "Lateral movement indicators detected from WS-042 targeting DB-SRV-01 port 5432. Risk of ransomware propagation to database assets containing customer PII.",
    sources: 4, confidence: 0.94, status: "pending",
  },
  {
    id: "pa-002", incident: "INC-2851", severity: "P1",
    action: "Block IP Range", target: "185.220.0.0/16 (Tor Exit Nodes)",
    impact: "high",
    rationale: "The /16 subnet 185.220.0.0 is documented as Tor exit node infrastructure. Blocking the range will disrupt C2 channel. May affect ~0.02% legitimate traffic.",
    sources: 3, confidence: 0.91, status: "pending",
  },
  {
    id: "pa-003", incident: "INC-2850", severity: "P2",
    action: "Reset AD Credentials", target: "svc_deploy, svc_backup (service accounts)",
    impact: "high",
    rationale: "Credential harvesting via Mimikatz on WS-042 likely exposed service account hashes. Mandatory rotation per SOP v3.2 §4.2.",
    sources: 2, confidence: 0.87, status: "pending",
  },
  {
    id: "pa-004", incident: "INC-2847", severity: "P3",
    action: "Rate Limit SSH", target: "All edge routers — port 22 (max 3/min/src)",
    impact: "medium",
    rationale: "SSH brute force campaign from 46.161.27.134 with 14,200 attempts in 2h. Rate limiting will neutralize without full block.",
    sources: 2, confidence: 0.82, status: "pending",
  },
]

const ACTIVE_COUNTERMEASURES: ActiveCountermeasure[] = [
  { id: "cm-001", type: "IP BLOCK", target: "185.220.101.45", reason: "Tor exit node / APT29 C2", started: "14:19 UTC", ttl: "24h", auto: true, incident: "INC-2851" },
  { id: "cm-002", type: "QUARANTINE", target: "WS-042 (10.1.5.42)", reason: "Mimikatz detected / lateral movement", started: "14:20 UTC", ttl: "Until cleared", auto: true, incident: "INC-2851" },
  { id: "cm-003", type: "PROCESS KILL", target: "lsass_injector.exe on WS-042", reason: "Credential harvesting process", started: "14:11 UTC", ttl: "Permanent", auto: true, incident: "INC-2851" },
  { id: "cm-004", type: "IP BLOCK", target: "92.53.116.124", reason: "C2 beacon / cobalt strike", started: "13:45 UTC", ttl: "24h", auto: true, incident: "INC-2850" },
  { id: "cm-005", type: "FIREWALL RULE", target: "Port 4444/TCP egress block", reason: "Metasploit callback port", started: "13:42 UTC", ttl: "Permanent", auto: false, incident: "INC-2850" },
]

const PLAYBOOK: PlaybookStep[] = [
  { id: "pb-1", action: "FIM Alert → Edge Judgment", mode: "auto", description: "Evaluate FIM/IDS event against Sigma rules within 50ms. Classify as Benign/Suspicious.", color: "#10b981" },
  { id: "pb-2", action: "Suspicious → RAG Investigation", mode: "auto", description: "Query vector DB for historical context. Cross-encoder reranking. Confidence scoring.", color: "#00d4ff" },
  { id: "pb-3", action: "Block Source IP (P3/P4)", mode: "auto", description: "If confidence ≥ θ_conf and severity ≤ P3: auto-push firewall rule to edge routers.", color: "#10b981" },
  { id: "pb-4", action: "Quarantine Endpoint (P2)", mode: "manual", description: "Isolate network segment. REQUIRES analyst approval. TTL: 1h default.", color: "#f59e0b" },
  { id: "pb-5", action: "Critical Asset Action (P1)", mode: "manual", description: "DC, DB, or core server actions REQUIRE incident commander approval. All steps logged.", color: "#ef4444" },
  { id: "pb-6", action: "Audit & CRC Verification", mode: "auto", description: "All generated responses validated against source UUIDs. Hallucinations automatically redacted.", color: "#8b5cf6" },
]

export default function MitigationCenter() {
  const [pending, setPending] = useState<PendingAction[]>(INITIAL_PENDING)
  const [countermeasures, setCountermeasures] = useState<ActiveCountermeasure[]>(ACTIVE_COUNTERMEASURES)
  const [expanded, setExpanded] = useState<string | null>(null)

  const approve = (id: string) => {
    setPending((prev) => prev.map((p) => p.id === id ? { ...p, status: "approved" } : p))
  }
  const deny = (id: string) => {
    setPending((prev) => prev.map((p) => p.id === id ? { ...p, status: "denied" } : p))
  }
  const revoke = (id: string) => {
    setCountermeasures((prev) => prev.filter((c) => c.id !== id))
  }

  const impactColor = (i: string) => i === "critical" ? "#ef4444" : i === "high" ? "#f59e0b" : "#8b5cf6"
  const sevColor = (s: string) => s === "P1" ? "#ef4444" : s === "P2" ? "#f59e0b" : "#8b5cf6"

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, height: "100%", overflow: "auto" }}>
      {/* Pending Approvals */}
      <div style={{ background: "#0d1629", border: "1px solid #1a2d4f", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #0f1e35", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea" }}>Pending Approvals Queue</div>
            <div style={{ fontSize: 10, color: "#3d5a7a", marginTop: 2 }}>High-impact actions awaiting analyst authorization</div>
          </div>
          <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#f59e0b", background: "#f59e0b22", padding: "3px 10px", borderRadius: 4, border: "1px solid #f59e0b44" }}>
            {pending.filter((p) => p.status === "pending").length} PENDING
          </span>
        </div>

        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map((item) => {
            const statusColors: Record<string, string> = { pending: "#f59e0b", approved: "#10b981", denied: "#3d5a7a" }
            const sc = statusColors[item.status]
            const open = expanded === item.id
            return (
              <div
                key={item.id}
                style={{
                  background: "#080f1f",
                  border: `1px solid ${item.status === "pending" ? "#1a2d4f" : sc + "44"}`,
                  borderLeft: `3px solid ${item.status === "pending" ? impactColor(item.impact) : sc}`,
                  borderRadius: 6,
                  overflow: "hidden",
                  opacity: item.status !== "pending" ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{ padding: "10px 14px", cursor: "pointer", display: "grid", gridTemplateColumns: "auto auto 1fr auto auto auto", gap: 10, alignItems: "center" }}
                  onClick={() => setExpanded(open ? null : item.id)}
                >
                  <span style={{ fontSize: 9, color: sevColor(item.severity), background: sevColor(item.severity) + "22", padding: "1px 6px", borderRadius: 3, fontFamily: "JetBrains Mono, monospace", border: `1px solid ${sevColor(item.severity)}44` }}>{item.severity}</span>
                  <span style={{ fontSize: 9, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace" }}>{item.incident}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea" }}>{item.action}</div>
                    <div style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "JetBrains Mono, monospace" }}>{item.target}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace" }}>θ_conf</div>
                    <div style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: item.confidence > 0.9 ? "#10b981" : "#f59e0b" }}>{item.confidence.toFixed(2)}</div>
                  </div>
                  <span style={{ fontSize: 9, color: impactColor(item.impact), background: impactColor(item.impact) + "22", padding: "2px 8px", borderRadius: 4, fontFamily: "JetBrains Mono, monospace", border: `1px solid ${impactColor(item.impact)}44`, textTransform: "uppercase" }}>{item.impact}</span>
                  {item.status === "pending" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); approve(item.id) }}
                        style={{ padding: "4px 12px", background: "#10b98122", border: "1px solid #10b98144", borderRadius: 4, color: "#10b981", cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                      >✓ Approve</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deny(item.id) }}
                        style={{ padding: "4px 12px", background: "#ef444422", border: "1px solid #ef444444", borderRadius: 4, color: "#ef4444", cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                      >✕ Deny</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 10, color: sc, fontFamily: "JetBrains Mono, monospace", background: sc + "22", padding: "4px 12px", borderRadius: 4, border: `1px solid ${sc}44`, textTransform: "uppercase" }}>{item.status}</span>
                  )}
                </div>
                {open && (
                  <div style={{ padding: "0 14px 12px", borderTop: "1px solid #0f1e35" }}>
                    <div style={{ fontSize: 10, color: "#5a7a9a", lineHeight: 1.6, marginTop: 8 }}>
                      <strong style={{ color: "#8aa8c8" }}>AI Rationale:</strong> {item.rationale}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#3d5a7a" }}>
                      <span>Evidence sources: <strong style={{ color: "#00d4ff" }}>{item.sources}</strong></span>
                      <span>Confidence: <strong style={{ color: "#00d4ff" }}>{item.confidence.toFixed(2)}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Countermeasures */}
      <div style={{ background: "#0d1629", border: "1px solid #1a2d4f", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #0f1e35", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea" }}>Active Countermeasures</div>
            <div style={{ fontSize: 10, color: "#3d5a7a", marginTop: 2 }}>Currently enforced mitigations · click Revoke to restore</div>
          </div>
          <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#ef4444", background: "#ef444422", padding: "3px 10px", borderRadius: 4, border: "1px solid #ef444444" }}>
            {countermeasures.length} ACTIVE
          </span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #0f1e35" }}>
              {["Type", "Target", "Reason", "Incident", "Started", "TTL", "Mode", "Action"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#3d5a7a", fontSize: 9, fontWeight: 500, letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countermeasures.map((cm) => (
              <tr key={cm.id} style={{ borderBottom: "1px solid #0a1222" }}>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{ color: "#ef4444", background: "#ef444411", border: "1px solid #ef444433", padding: "2px 6px", borderRadius: 3, fontSize: 9, whiteSpace: "nowrap" }}>{cm.type}</span>
                </td>
                <td style={{ padding: "8px 12px", color: "#c8d8ea", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cm.target}</td>
                <td style={{ padding: "8px 12px", color: "#5a7a9a", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cm.reason}</td>
                <td style={{ padding: "8px 12px", color: "#f59e0b" }}>{cm.incident}</td>
                <td style={{ padding: "8px 12px", color: "#3d5a7a" }}>{cm.started}</td>
                <td style={{ padding: "8px 12px", color: "#5a7a9a" }}>{cm.ttl}</td>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{ color: cm.auto ? "#10b981" : "#f59e0b", fontSize: 9 }}>{cm.auto ? "AUTO" : "MANUAL"}</span>
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <button
                    onClick={() => revoke(cm.id)}
                    style={{ padding: "3px 10px", background: "#f59e0b11", border: "1px solid #f59e0b33", borderRadius: 4, color: "#f59e0b", cursor: "pointer", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
                  >Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Playbook Editor */}
      <div style={{ background: "#0d1629", border: "1px solid #1a2d4f", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #0f1e35" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea" }}>Response Playbook</div>
          <div style={{ fontSize: 10, color: "#3d5a7a", marginTop: 2 }}>Define autonomous vs manual approval gates · drag to reorder</div>
        </div>
        <div style={{ padding: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PLAYBOOK.map((step, i) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "stretch",
                flex: "1 1 300px",
                minWidth: 280,
              }}
            >
              {i > 0 && (
                <div style={{ display: "flex", alignItems: "center", paddingRight: 8, color: "#2d4878", fontSize: 14 }}>→</div>
              )}
              <div style={{
                flex: 1,
                background: "#080f1f",
                border: `1px solid ${step.color}33`,
                borderTop: `2px solid ${step.color}`,
                borderRadius: 6,
                padding: "10px 12px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace" }}>STEP {i + 1}</span>
                  <span style={{
                    fontSize: 9,
                    fontFamily: "JetBrains Mono, monospace",
                    color: step.mode === "auto" ? "#10b981" : "#f59e0b",
                    background: step.mode === "auto" ? "#10b98122" : "#f59e0b22",
                    padding: "1px 6px",
                    borderRadius: 3,
                    border: `1px solid ${step.mode === "auto" ? "#10b98144" : "#f59e0b44"}`,
                  }}>
                    {step.mode === "auto" ? "AUTO" : "⚠ MANUAL APPROVAL"}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: step.color, marginBottom: 4 }}>{step.action}</div>
                <div style={{ fontSize: 10, color: "#5a7a9a", lineHeight: 1.4 }}>{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      <div style={{ background: "#0d1629", border: "1px solid #1a2d4f", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #0f1e35" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#c8d8ea" }}>Immutable Audit Log</div>
        </div>
        <div style={{ padding: "8px 0", maxHeight: 160, overflow: "auto" }}>
          {[
            { ts: "14:23:07", actor: "RAGSec-Agent", action: "FIREWALL_BLOCK", target: "185.220.101.45", approved: "AUTO", hash: "a3f2b891" },
            { ts: "14:20:14", actor: "RAGSec-Agent", action: "QUARANTINE", target: "WS-042", approved: "AUTO", hash: "f7a1e823" },
            { ts: "14:11:30", actor: "RAGSec-Agent", action: "PROCESS_KILL", target: "lsass_injector.exe", approved: "AUTO", hash: "8c45d217" },
            { ts: "13:58:22", actor: "jmartinez@corp", action: "ESCALATE", target: "INC-2847", approved: "MANUAL", hash: "2d78f934" },
            { ts: "13:45:09", actor: "RAGSec-Agent", action: "FIREWALL_BLOCK", target: "92.53.116.124", approved: "AUTO", hash: "9e23a456" },
          ].map((entry, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 150px 160px 200px 80px 80px", padding: "5px 16px", fontSize: 10, fontFamily: "JetBrains Mono, monospace", borderBottom: "1px solid #0a1222" }}>
              <span style={{ color: "#2d4878" }}>{entry.ts}</span>
              <span style={{ color: "#5a7a9a" }}>{entry.actor}</span>
              <span style={{ color: "#00d4ff" }}>{entry.action}</span>
              <span style={{ color: "#8aa8c8" }}>{entry.target}</span>
              <span style={{ color: entry.approved === "MANUAL" ? "#f59e0b" : "#10b981" }}>{entry.approved}</span>
              <span style={{ color: "#1a2d4f" }}>{entry.hash}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
