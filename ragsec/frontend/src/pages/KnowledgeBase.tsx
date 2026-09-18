import { useState, useEffect } from "react"

const DOCS = [
  { id: "doc-1", name: "threat_intel_report_q3.pdf", size: "2.4 MB", uploaded: "2023-09-14", chunks: 14, status: "INDEXED" },
  { id: "doc-2", name: "incident_response_playbook_v4.md", size: "142 KB", uploaded: "2023-09-15", chunks: 8, status: "INDEXED" },
  { id: "doc-3", name: "firewall_rules_export.csv", size: "12 KB", uploaded: "2023-09-16", chunks: 2, status: "INDEXED" },
  { id: "doc-4", name: "apt29_ttp_matrix.json", size: "45 KB", uploaded: "2023-09-17", chunks: 4, status: "INDEXED" }
]

export default function KnowledgeBase({ demoMode }: { demoMode?: boolean }) {
  const [docs, setDocs] = useState<any[]>(DOCS)

  return (
    <div className="flex flex-col gap-6 min-h-full">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: "1px solid #27272a", paddingBottom: 16 }}>
        <h2 style={{ color: "var(--color-text-main)", fontSize: 16, fontWeight: 600, letterSpacing: "0.05em", fontFamily: "JetBrains Mono, monospace" }}>RAG KNOWLEDGE BASE</h2>
        <div style={{
            background: "#14532d",
            color: "var(--color-primary)",
            border: "1px solid #166534",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: "600",
            fontFamily: "JetBrains Mono, monospace"
          }}>
            VECTOR STORE: ONLINE
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={{ background: "var(--color-card)", border: "1px solid #27272a", padding: "12px 16px" }}>
          <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>TOTAL DOCUMENTS</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)", fontFamily: "JetBrains Mono, monospace" }}>4</div>
        </div>
        <div style={{ background: "var(--color-card)", border: "1px solid #27272a", padding: "12px 16px" }}>
          <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>INDEXED CHUNKS</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#38bdf8", fontFamily: "JetBrains Mono, monospace" }}>28</div>
        </div>
        <div style={{ background: "var(--color-card)", border: "1px solid #27272a", padding: "12px 16px" }}>
          <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>RETRIEVAL LATENCY</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#4ade80", fontFamily: "JetBrains Mono, monospace" }}>24ms</div>
        </div>
      </div>

      <div style={{ background: "var(--color-card)", border: "1px solid #27272a", flex: 1 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-main)", fontFamily: "JetBrains Mono, monospace" }}>INGESTED INTELLIGENCE SOURCES</div>
          <button style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "4px 12px", fontSize: 10, fontWeight: 600, fontFamily: "JetBrains Mono, monospace", cursor: "pointer" }}>+ UPLOAD DOCUMENT</button>
        </div>
        
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #27272a" }}>
              {["DOCUMENT NAME", "SIZE", "UPLOAD DATE", "CHUNKS", "STATUS", "ACTION"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 600, fontSize: 9, letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map(doc => (
              <tr key={doc.id} style={{ borderBottom: "1px solid #27272a" }}>
                <td style={{ padding: "10px 16px", color: "var(--color-text-main)" }}>{doc.name}</td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-muted)" }}>{doc.size}</td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-muted)" }}>{doc.uploaded}</td>
                <td style={{ padding: "10px 16px", color: "var(--color-primary)" }}>{doc.chunks}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ color: "var(--color-primary)", border: "1px solid var(--color-primary)", padding: "2px 6px", fontSize: 9 }}>{doc.status}</span>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <button style={{ background: "transparent", color: "#f87171", border: "1px solid #f87171", padding: "2px 6px", fontSize: 9, cursor: "pointer" }}>DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
