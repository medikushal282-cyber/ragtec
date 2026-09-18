import type { Page } from "../App"

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { id: "dashboard" as Page, label: "Dashboard", badge: null }
    ]
  },
  {
    title: "Operations",
    items: [
      { id: "network" as Page, label: "Security Events", badge: 12 },
      { id: "incident" as Page, label: "Incidents", badge: 2 },
      { id: "fleet" as Page, label: "Devices & FIM", badge: 3 },
      { id: "mitigation" as Page, label: "Mitigation", badge: 4 },
      { id: "knowledge" as Page, label: "Knowledge Base", badge: null },
    ]
  }
]

interface Props {
  page: Page
  setPage: (p: Page) => void
}

export default function Sidebar({ page, setPage }: Props) {
  return (
    <aside className="w-64 min-w-[256px] bg-card border-r border-border flex flex-col overflow-hidden h-full">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
          </svg>
        </div>
        <div>
          <div className="text-xl font-bold text-text-main tracking-wide">RAGSec</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-6">
        {NAV_GROUPS.map(group => (
          <div key={group.title}>
            <div className="text-xs font-semibold text-text-muted px-3 mb-2 uppercase tracking-wider">
              {group.title}
            </div>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = item.id === page
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left
                      ${active 
                        ? "bg-primary/10 text-primary" 
                        : "text-text-muted hover:bg-white/5 hover:text-text-main"
                      }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        active ? "bg-primary/20 text-primary" : "bg-white/10 text-text-muted"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Upgrade Prompt (from design inspiration) */}
      <div className="p-4 m-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20 shrink-0">
        <h3 className="text-sm font-semibold text-text-main mb-1">RAGSec Enterprise</h3>
        <p className="text-xs text-text-muted mb-3 leading-relaxed">Upgrade to unlock advanced ML threat detection and automated mitigations.</p>
        <button className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 rounded-lg transition-colors shadow-md shadow-primary/20">
          Upgrade Plan
        </button>
      </div>
    </aside>
  )
}
