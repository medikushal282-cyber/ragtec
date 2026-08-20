import { useState } from "react"
import Sidebar from "./components/Sidebar"
import TopBar from "./components/TopBar"
import Dashboard from "./pages/Dashboard"
import FleetManagement from "./pages/FleetManagement"
import NetworkSecurity from "./pages/NetworkSecurity"
import ActiveIncident from "./pages/ActiveIncident"
import MitigationCenter from "./pages/MitigationCenter"

export type Page = "dashboard" | "fleet" | "network" | "incident" | "mitigation"

export default function App() {
  const [page, setPage] = useState<Page>("dashboard")

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "#060b18" }}>
      <Sidebar page={page} setPage={setPage} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minWidth: 0 }}>
        <TopBar page={page} />
        <main style={{ flex: 1, overflow: "auto" }}>
          {page === "dashboard" && <Dashboard />}
          {page === "fleet" && <FleetManagement />}
          {page === "network" && <NetworkSecurity />}
          {page === "incident" && <ActiveIncident />}
          {page === "mitigation" && <MitigationCenter />}
        </main>
      </div>
    </div>
  )
}
