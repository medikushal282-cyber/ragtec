import React, { useState } from "react";
import { Page } from "./types";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import KnowledgeBase from "./pages/KnowledgeBase";
import FleetManagement from "./pages/FleetManagement";
import ActiveIncident from "./pages/ActiveIncident";
import MitigationCenter from "./pages/MitigationCenter";

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060911] text-slate-100 font-sans select-none">
      {/* Sidebar Navigation */}
      <Sidebar currentPage={currentPage} onSelectPage={(page) => setCurrentPage(page)} />

      {/* Main Workspace Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
        <TopBar 
          currentPage={currentPage} 
          onSearchClick={() => setCurrentPage("knowledge")} 
        />

        <main className="flex-1 overflow-y-auto p-6 bg-[#060911] text-slate-100">
          <div className="max-w-7xl mx-auto">
            {currentPage === "dashboard" && (
              <Dashboard onNavigatePage={(page) => setCurrentPage(page)} />
            )}
            {currentPage === "knowledge" && <KnowledgeBase />}
            {currentPage === "fleet" && <FleetManagement />}
            {currentPage === "incident" && <ActiveIncident />}
            {currentPage === "mitigation" && <MitigationCenter />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
