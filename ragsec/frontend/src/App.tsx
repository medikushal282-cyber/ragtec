import { useState, useEffect } from "react"
import Sidebar from "./components/Sidebar"
import TopBar from "./components/TopBar"
import Dashboard from "./pages/Dashboard"
import FleetManagement from "./pages/FleetManagement"
import NetworkSecurity from "./pages/NetworkSecurity"
import ActiveIncident from "./pages/ActiveIncident"
import MitigationCenter from "./pages/MitigationCenter"
import KnowledgeBase from "./pages/KnowledgeBase"

export type Page = "dashboard" | "fleet" | "network" | "incident" | "mitigation" | "knowledge"

export default function App() {
  const [page, setPage] = useState<Page>("dashboard")
  const [demoMode, setDemoMode] = useState(false)

  // Demo Mode Orchestrator
  useEffect(() => {
    if (!demoMode) return
    
    let step = 0;
    const pages: Page[] = ["dashboard", "network", "incident", "mitigation", "fleet"]
    
    // Cycle through pages every 4 seconds in demo mode
    const interval = setInterval(() => {
      step = (step + 1) % pages.length;
      setPage(pages[step]);
    }, 4000)
    
    return () => clearInterval(interval)
  }, [demoMode])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base text-text-main font-sans">
      <Sidebar page={page} setPage={setPage} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar page={page} demoMode={demoMode} setDemoMode={setDemoMode} />
        <main className="flex-1 overflow-auto bg-base p-6">
          {page === "dashboard" && <Dashboard demoMode={demoMode} />}
          {page === "fleet" && <FleetManagement demoMode={demoMode} />}
          {page === "network" && <NetworkSecurity demoMode={demoMode} />}
          {page === "incident" && <ActiveIncident demoMode={demoMode} />}
          {page === "mitigation" && <MitigationCenter demoMode={demoMode} />}
          {page === "knowledge" && <KnowledgeBase demoMode={demoMode} />}
        </main>
      </div>
    </div>
  )
}
