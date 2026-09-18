import { useState, useEffect } from "react"
import type { Page } from "../App"

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Overview Dashboard",
  fleet: "Device Management",
  network: "Network Security",
  incident: "Active Incidents",
  mitigation: "Mitigation Operations",
}

interface TopBarProps {
  page: Page;
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
}

export default function TopBar({ page, demoMode, setDemoMode }: TopBarProps) {
  const [time, setTime] = useState(new Date())
  const [search, setSearch] = useState("")

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-6 shrink-0 shadow-sm z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-text-main whitespace-nowrap overflow-hidden text-ellipsis">
          {PAGE_TITLES[page]}
        </h1>
      </div>

      {/* Demo Mode Toggle */}
      <div className="flex items-center bg-base rounded-full p-1 border border-border shadow-inner">
        <button 
          onClick={() => setDemoMode(false)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            !demoMode 
              ? "bg-card text-text-main shadow" 
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Live
        </button>
        <button 
          onClick={() => setDemoMode(true)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            demoMode 
              ? "bg-primary text-white shadow-md shadow-primary/20" 
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Demo Auto-Pilot
        </button>
      </div>

      {/* Global Search */}
      <div className="relative w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search IOC, IP, Hash, CVE..."
          className="w-full bg-base border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      {/* User Profile Outline */}
      <div className="flex items-center gap-3 pl-4 border-l border-border">
        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
          SA
        </div>
      </div>
    </header>
  )
}
