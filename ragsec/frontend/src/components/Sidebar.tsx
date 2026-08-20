import type { Page } from "../App"

const NAV = [
  {
    id: "dashboard" as Page,
    label: "SOC Dashboard",
    badge: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "fleet" as Page,
    label: "Fleet / FIM",
    badge: 3,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
        <line x1="12" y1="7" x2="5" y2="17" /><line x1="12" y1="7" x2="19" y2="17" />
      </svg>
    ),
  },
  {
    id: "network" as Page,
    label: "IDS/IPS Monitor",
    badge: 12,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: "incident" as Page,
    label: "Active Incidents",
    badge: 2,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "mitigation" as Page,
    label: "Mitigation Center",
    badge: 4,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
]

interface Props {
  page: Page
  setPage: (p: Page) => void
}

export default function Sidebar({ page, setPage }: Props) {
  return (
    <aside style={{
      width: 224,
      minWidth: 224,
      background: "#080f1f",
      borderRight: "1px solid #1a2d4f",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #0f1e35" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, #00d4ff22, #00d4ff44)",
            border: "1px solid #00d4ff66",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#00d4ff">
              <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2eaf5", letterSpacing: "0.04em" }}>RAGSec</div>
            <div style={{ fontSize: 10, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace", marginTop: 1 }}>v2.4.1 · PROD</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 9, color: "#2d4878", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", padding: "6px 10px 8px", textTransform: "uppercase" }}>Navigation</div>
        {NAV.map((item) => {
          const active = item.id === page
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 6,
                border: active ? "1px solid #00d4ff22" : "1px solid transparent",
                background: active ? "linear-gradient(90deg, #00d4ff0d, #00d4ff06)" : "transparent",
                color: active ? "#00d4ff" : "#5a7a9a",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              {active && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 2,
                  height: "60%",
                  background: "#00d4ff",
                  borderRadius: "0 2px 2px 0",
                }} />
              )}
              <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== null && (
                <span style={{
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  background: active ? "#00d4ff22" : "#ef444422",
                  color: active ? "#00d4ff" : "#ef4444",
                  border: `1px solid ${active ? "#00d4ff44" : "#ef444444"}`,
                  padding: "1px 6px",
                  borderRadius: 10,
                  lineHeight: "16px",
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #0f1e35" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #1e3a5f, #2d5a8e)",
            border: "1px solid #2d4878",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#7ab3dd",
          }}>SA</div>
          <div>
            <div style={{ fontSize: 12, color: "#c8d8ea", fontWeight: 500 }}>S. Analyst</div>
            <div style={{ fontSize: 10, color: "#3d5a7a", fontFamily: "JetBrains Mono, monospace" }}>ROLE: L2_SOC</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
