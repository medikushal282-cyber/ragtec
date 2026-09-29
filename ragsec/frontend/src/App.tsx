import React from "react";
import { SOCProvider, useSOC } from "./context/SOCContext";
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";
import DemoControlBar from "./components/DemoControlBar";

// 21 Page Views
import Overview from "./pages/Overview";
import DemoControlCenter from "./pages/DemoControlCenter";
import SecurityEvents from "./pages/SecurityEvents";
import ActiveAlerts from "./pages/ActiveAlerts";
import ActiveIncidents from "./pages/ActiveIncidents";
import FleetTopology from "./pages/FleetTopology";
import FIMMonitor from "./pages/FIMMonitor";
import AlertAnalyzer from "./pages/AlertAnalyzer";
import CodeExplorer from "./pages/CodeExplorer";
import ThreatInvestigation from "./pages/ThreatInvestigation";
import KnowledgeBase from "./pages/KnowledgeBase";
import AutonomousTesterView from "./pages/AutonomousTesterView";
import TestReportsView from "./pages/TestReportsView";
import GlobalSearch from "./pages/GlobalSearch";
import MitigationCenter from "./pages/MitigationCenter";
import MitigationRulesView from "./pages/MitigationRulesView";
import Playbooks from "./pages/Playbooks";
import GovernanceLabView from "./pages/GovernanceLabView";
import SPSBenchmarkView from "./pages/SPSBenchmarkView";
import SiemGatewayView from "./pages/SiemGatewayView";
import AuditTrail from "./pages/AuditTrail";
import SystemSettings from "./pages/SystemSettings";

const MainContent: React.FC = () => {
  const { activeTab } = useSOC();

  const renderActiveView = () => {
    switch (activeTab) {
      // OVERVIEW
      case "overview":
        return <Overview />;
      case "demo":
        return <DemoControlCenter />;

      // OPERATIONS
      case "events":
        return <SecurityEvents />;
      case "alerts":
        return <ActiveAlerts />;
      case "incidents":
        return <ActiveIncidents />;
      case "fleet":
        return <FleetTopology />;
      case "fim":
        return <FIMMonitor />;
      case "analyzer":
        return <AlertAnalyzer />;
      case "code_explorer":
        return <CodeExplorer />;

      // INTELLIGENCE
      case "investigation":
        return <ThreatInvestigation />;
      case "knowledge":
        return <KnowledgeBase />;
      case "autonomous_tester":
        return <AutonomousTesterView />;
      case "test_reports":
        return <TestReportsView />;
      case "search":
        return <GlobalSearch />;

      // RESPONSE
      case "mitigation":
        return <MitigationCenter />;
      case "mitigation_rules":
        return <MitigationRulesView />;
      case "playbooks":
        return <Playbooks />;

      // SYSTEM
      case "governance":
        return <GovernanceLabView />;
      case "sps_benchmark":
        return <SPSBenchmarkView />;
      case "siem":
        return <SiemGatewayView />;
      case "audit":
        return <AuditTrail />;
      case "settings":
        return <SystemSettings />;

      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F6F8] text-[#0F172A] font-sans select-none relative">
      {/* Background Dot Matrix Accent & Organic Shape (from Mockup) */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-dot-matrix opacity-25 pointer-events-none z-0" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#1E293B] organic-pebble-top opacity-95 pointer-events-none z-0 shadow-2xl" />

      {/* 5-Category Expandable Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0 bg-[#F4F6F8] relative z-10">
        <TopHeader />
        <DemoControlBar />

        {/* Scrollable Dynamic Feature View */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F4F6F8]/60 backdrop-blur-3xs">
          <div className="max-w-7xl mx-auto pb-10">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <SOCProvider>
      <MainContent />
    </SOCProvider>
  );
}

export default App;
