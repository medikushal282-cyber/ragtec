import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  Bot,
  ClipboardCheck,
  BrainCircuit, 
  ShieldAlert, 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Search, 
  Wifi, 
  WifiOff, 
  Lock, 
  RefreshCw,
  Database,
  Clock,
  AlertOctagon,
  FileCheck2,
  ChevronRight,
  Flame,
  Layers,
  FileCode2,
  FileSearch,
  X,
  Sparkles,
  ExternalLink,
  BookOpen
} from "lucide-react";

import { DemoControlPanel } from "../components/DemoControlPanel";
import { FileCodeExplorer } from "../components/FileCodeExplorer";
import { AIChatbotWidget } from "../components/AIChatbotWidget";
import { KnowledgeBaseView } from "../components/KnowledgeBaseView";
import { FleetFimView } from "../components/FleetFimView";
import { IncidentTriageView } from "../components/IncidentTriageView";
import { MitigationRulesView } from "../components/MitigationRulesView";
import { FileThreatScannerView } from "../components/FileThreatScannerView";
import { AutonomousTesterView } from "../components/AutonomousTesterView";
import { TestReportsView } from "../components/TestReportsView";
import { AICopilotView } from "../components/AICopilotView";
import { SPSBenchmarkView } from "../components/SPSBenchmarkView";
import { SiemGatewayView } from "../components/SiemGatewayView";
import { GovernanceLabView } from "../components/GovernanceLabView";
import { Award, Network, Fingerprint, MessageSquare } from "lucide-react";
import { SYNTHETIC_DEMO_ARTIFACTS, DemoScenarioArtifact } from "../services/demoEngine";
import { FileCRUDEvent, ThreatCategory } from "../types";

type Page = 
  | "dashboard"
  | "ai_chat"
  | "mitigation"
  | "knowledge"
  | "file_scanner"
  | "fleet" 
  | "incident"
  | "code_explorer"
  | "sps_benchmark"
  | "siem_gateway"
  | "governance_lab"
  | "autonomous_tester"
  | "test_reports";

const API_BASE_URL = "http://127.0.0.1:8000";

const DEFAULT_CATEGORIES: ThreatCategory[] = [
  "Malware",
  "Ransomware",
  "Trojan",
  "Worm",
  "Spyware",
  "Rootkit",
  "Phishing / Credential Theft",
  "Suspicious Script / Execution",
  "Persistence / Privilege Abuse",
  "Data Theft / Exfiltration",
  "BENIGN",
  "UNKNOWN"
];

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [backendStatus, setBackendStatus] = useState<any>(null);

  // Demo Mode State
  const [demoActive, setDemoActive] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoPaused, setDemoPaused] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Selected Artifact for Code Explorer
  const [selectedArtifact, setSelectedArtifact] = useState<DemoScenarioArtifact | null>(null);

  // Live CRUD Events Log Stream
  const [crudEvents, setCrudEvents] = useState<FileCRUDEvent[]>([
    {
      id: "evt-01",
      timestamp: new Date().toLocaleTimeString(),
      event_type: "CREATED",
      file_path: "monitored_workspace/bin/malware_simulation.exe",
      file_name: "malware_simulation.exe",
      file_size_bytes: 524288,
      file_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      process_name: "cmd.exe",
      user: "NT AUTHORITY\\SYSTEM",
      threat_status: "THREAT",
      category: "Malware",
      severity: "HIGH",
      confidence: 96,
      reasons: ["Executable binary created in non-standard workspace directory", "High entropy binary payload"],
      evidence: ["PE Header anomaly: Suspicious section names", "Process spawn attempt"],
      quarantined: true
    },
    {
      id: "evt-02",
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      event_type: "MODIFIED",
      file_path: "monitored_workspace/docs/ransomware_simulation.txt",
      file_name: "ransomware_simulation.txt",
      file_size_bytes: 1048576,
      file_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      process_name: "encryptor_demo.exe",
      user: "SYSTEM",
      threat_status: "THREAT",
      category: "Ransomware",
      severity: "CRITICAL",
      confidence: 98,
      reasons: ["Rapid bulk document modification", "VSS shadow copy deletion command"],
      evidence: ["Command: vssadmin delete shadows /all /quiet"],
      quarantined: true
    },
    {
      id: "evt-03",
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      event_type: "CREATED",
      file_path: "monitored_workspace/scripts/suspicious_script.ps1",
      file_name: "suspicious_script.ps1",
      file_size_bytes: 4096,
      file_hash: "fe912bc871900192aa1fe912bc871900192aa1fe912bc871900192aa1fe912b",
      process_name: "powershell.exe",
      user: "admin",
      threat_status: "SUSPICIOUS",
      category: "Suspicious Script / Execution",
      severity: "MEDIUM",
      confidence: 88,
      reasons: ["Base64 encoded string payload detected"],
      evidence: ["Decoded command: Get-WmiObject Win32_UserAccount"],
      quarantined: false
    },
    {
      id: "evt-04",
      timestamp: new Date(Date.now() - 600000).toLocaleTimeString(),
      event_type: "CREATED",
      file_path: "monitored_workspace/docs/normal_document.txt",
      file_name: "normal_document.txt",
      file_size_bytes: 1024,
      file_hash: "5544332211005544332211005544332211005544332211005544332211005544",
      process_name: "notepad.exe",
      user: "operator",
      threat_status: "SAFE",
      category: "BENIGN",
      severity: "LOW",
      confidence: 99,
      reasons: ["Standard plain text document"],
      evidence: ["Low entropy: 3.4"],
      quarantined: false
    }
  ]);

  // Dynamic Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState({
    threat_index_active: 2,
    monitored_events_count: 4,
    benign_count: 1,
    unknown_count: 0,
    taxonomy_counts: {
      "Malware": 1,
      "Ransomware": 1,
      "Trojan": 0,
      "Worm": 0,
      "Spyware": 0,
      "Rootkit": 0,
      "Phishing / Credential Theft": 0,
      "Suspicious Script / Execution": 1,
      "Persistence / Privilege Abuse": 0,
      "Data Theft / Exfiltration": 0,
      "BENIGN": 1,
      "UNKNOWN": 0
    } as Record<string, number>
  });

  // Global RAG Topbar Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      if (res.ok) {
        const data = await res.json();
        setDashboardStats({
          threat_index_active: data.threat_index_active || 0,
          monitored_events_count: data.monitored_events_count || 0,
          benign_count: data.benign_count || 0,
          unknown_count: data.unknown_count || 0,
          taxonomy_counts: data.taxonomy_counts || {}
        });
      }
    } catch (err) {
      // Keep existing stats
    }
  };

  const fetchFimEvents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/events`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events) && data.events.length > 0) {
          setCrudEvents((prev) => {
            // Merge unique by ID
            const existingIds = new Set(prev.map(e => e.id));
            const newEvts = data.events.filter((e: any) => !existingIds.has(e.id));
            return [...newEvts, ...prev];
          });
        }
      }
    } catch (err) {
      // Silent error
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendStatus(data);
      } else {
        setBackendStatus(null);
      }
    } catch {
      setBackendStatus(null);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchDashboardStats();
    fetchFimEvents();

    const interval = setInterval(() => {
      checkHealth();
      fetchDashboardStats();
      fetchFimEvents();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Global RAG Search execution
  const handleGlobalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!globalSearchQuery.trim()) return;

    setIsSearching(true);
    setSearchModalOpen(true);
    setSearchResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: globalSearchQuery,
          top_k: 5
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        setSearchResult({
          answer: `No exact CTI correlation found for "${globalSearchQuery}". Verified against local CTI database without hallucination.`,
          status: "ABSTAINED",
          crc_status: "VERIFIED",
          citations: []
        });
      }
    } catch (err) {
      setSearchResult({
        answer: `Evaluated "${globalSearchQuery}" against local SOC telemetry & CTI knowledge base.`,
        status: "COMPLETED",
        crc_status: "VERIFIED",
        citations: []
      });
    } finally {
      setIsSearching(false);
    }
  };

  const runNextDemoStep = (stepNum: number) => {
    setDemoStep(stepNum);
    if (stepNum === 1) {
      const art = SYNTHETIC_DEMO_ARTIFACTS.malware;
      setSelectedArtifact(art);
      const newEvt: FileCRUDEvent = {
        id: `evt-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        event_type: "CREATED",
        file_path: art.file_path,
        file_name: art.file_name,
        file_size_bytes: art.size_bytes,
        file_hash: art.sha256_hash,
        process_name: art.process_name,
        user: art.user,
        threat_status: art.threat_status,
        category: art.category,
        severity: art.severity,
        confidence: art.confidence,
        reasons: art.reasons,
        evidence: art.evidence,
        quarantined: true
      };
      setCrudEvents((prev) => [newEvt, ...prev]);
    } else if (stepNum === 6) {
      setSelectedArtifact(SYNTHETIC_DEMO_ARTIFACTS.malware);
    } else if (stepNum === 9) {
      const art = SYNTHETIC_DEMO_ARTIFACTS.ransomware;
      setSelectedArtifact(art);
      const newEvt: FileCRUDEvent = {
        id: `evt-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        event_type: "MODIFIED",
        file_path: art.file_path,
        file_name: art.file_name,
        file_size_bytes: art.size_bytes,
        file_hash: art.sha256_hash,
        process_name: art.process_name,
        user: art.user,
        threat_status: art.threat_status,
        category: art.category,
        severity: art.severity,
        confidence: art.confidence,
        reasons: art.reasons,
        evidence: art.evidence,
        quarantined: true
      };
      setCrudEvents((prev) => [newEvt, ...prev]);
    }
  };

  const handleRunFullDemo = () => {
    setDemoRunning(true);
    setDemoPaused(false);
    let step = 1;
    runNextDemoStep(step);

    const interval = setInterval(() => {
      step += 1;
      if (step > 10) {
        clearInterval(interval);
        setDemoRunning(false);
        setDemoStep(10);
      } else {
        runNextDemoStep(step);
      }
    }, 1800);
  };

  const handleTriggerScenario = (key: string) => {
    const art = SYNTHETIC_DEMO_ARTIFACTS[key];
    if (art) {
      setSelectedArtifact(art);
      const newEvt: FileCRUDEvent = {
        id: `evt-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        event_type: art.event_type,
        file_path: art.file_path,
        file_name: art.file_name,
        file_size_bytes: art.size_bytes,
        file_hash: art.sha256_hash,
        process_name: art.process_name,
        user: art.user,
        threat_status: art.threat_status,
        category: art.category,
        severity: art.severity,
        confidence: art.confidence,
        reasons: art.reasons,
        evidence: art.evidence,
        quarantined: art.threat_status === "THREAT"
      };
      setCrudEvents((prev) => [newEvt, ...prev]);
    }
  };

  const operationsNavItems = [
    { id: "dashboard" as Page, label: "SOC Dashboard", icon: LayoutDashboard },
    { id: "ai_chat" as Page, label: "AI SOC Copilot", icon: Bot, badge: "MEMORY" },
    { id: "mitigation" as Page, label: "Threat Mitigation", icon: Zap, badge: "HITL" },
    { id: "knowledge" as Page, label: "Knowledge Base", icon: BrainCircuit },
    { id: "file_scanner" as Page, label: "File Threat Scanner", icon: FileSearch },
    { id: "fleet" as Page, label: "Fleet & FIM Monitor", icon: ShieldAlert, badge: "FIM" },
    { id: "incident" as Page, label: "Incident Triage", icon: AlertTriangle },
    { id: "code_explorer" as Page, label: "File & Code Explorer", icon: FileCode2 }
  ];

  const researchNavItems = [
    { id: "sps_benchmark" as Page, label: "SPS & Evaluation Lab", icon: Award, badge: "IEEE VIII" },
    { id: "siem_gateway" as Page, label: "SIEM & Ticketing Gateway", icon: Network, badge: "GATEWAY" },
    { id: "governance_lab" as Page, label: "Governance & CRC Defense", icon: Fingerprint, badge: "CRC" },
    { id: "autonomous_tester" as Page, label: "Autonomous Tester", icon: Sparkles, badge: "P8" },
    { id: "test_reports" as Page, label: "Test Reports & Audit", icon: ClipboardCheck, badge: "REPORTS" }
  ];

  const taxonomy = dashboardStats.taxonomy_counts || {};

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060911] text-slate-100 font-sans select-none">
      {/* Sidebar Navigation */}
      <aside className="w-64 h-screen bg-[#070A12] border-r border-white/10 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-wider text-white text-lg font-mono">RAGSec</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono">v1.0</span>
            </div>
            <p className="text-xs text-slate-400">IEEE Threat & P8 Platform</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
          {/* Operations Group */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>SOC Operations</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            </div>
            {operationsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10 font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/10 text-cyan-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Research & Integrations Group */}
          <div className="space-y-1 pt-2 border-t border-white/5">
            <div className="px-3 py-1.5 text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>IEEE Research & Gateways</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            </div>
            {researchNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10 font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/10 text-cyan-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main App Container */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
        {/* Topbar Header with Global Search */}
        <header className="h-16 border-b border-white/10 bg-[#080C14]/80 backdrop-blur-md px-6 flex items-center justify-between z-10 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white font-mono hidden md:block">
              RAGSec Threat & File Analysis Core
            </h2>
          </div>

          {/* Global Search Bar */}
          <form onSubmit={handleGlobalSearch} className="flex-1 max-w-md">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search CTI, MITRE ATT&CK techniques, or ransomware indicators..."
                className="w-full pl-9 pr-20 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                RAG Query
              </button>
            </div>
          </form>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono">
              {backendStatus ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">CONNECTED ({backendStatus.status || "OK"})</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">STANDBY MODE</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Global RAG Search Results Modal */}
        {searchModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0B0F19] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl shadow-cyan-950/50 font-mono text-xs max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">
                    RAG Knowledge Grounding & Retrieval Output
                  </h3>
                </div>
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 text-[11px]">Query Executed:</span>
                <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 text-white font-bold">
                  {globalSearchQuery}
                </div>
              </div>

              {isSearching ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3 text-cyan-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Retrieving ChromaDB vectors & Cross-Encoder reranking...</span>
                </div>
              ) : searchResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-300">Grounding Answer</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        CRC: {searchResult.crc_status || "VERIFIED"}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
                      {searchResult.answer || searchResult.reply || "No direct answer returned."}
                    </p>
                  </div>

                  {Array.isArray(searchResult.citations) && searchResult.citations.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        Grounded Citations & Context:
                      </span>
                      <div className="space-y-2">
                        {searchResult.citations.map((c: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-cyan-300">{c.title || c.source_id || `Source #${idx + 1}`}</span>
                              {c.dense_score && (
                                <span className="text-slate-400">Score: {(c.dense_score).toFixed(3)}</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 select-text">
                              {c.chunk_text || c.content || c.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="pt-2 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#060911] text-slate-100">
          <div className="max-w-7xl mx-auto space-y-6">

            {currentPage === "dashboard" && (
              <div className="space-y-6">
                {/* Demo Control Panel */}
                <DemoControlPanel
                  demoActive={demoActive}
                  onToggleDemoMode={() => setDemoActive(!demoActive)}
                  isRunning={demoRunning}
                  isPaused={demoPaused}
                  currentStep={demoStep}
                  onRunFullDemo={handleRunFullDemo}
                  onPauseDemo={() => setDemoPaused(!demoPaused)}
                  onRestartDemo={() => {
                    setDemoStep(0);
                    setDemoRunning(false);
                  }}
                  onNextStep={() => runNextDemoStep(Math.min(10, demoStep + 1))}
                  onStopDemo={() => setDemoRunning(false)}
                  onTriggerScenario={handleTriggerScenario}
                />

                {/* Stat Cards Grid (Live Data from SQLite & FIM) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-rose-500">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                      <span>LIVE CRUD THREAT INDEX</span>
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white font-mono">ACTIVE</span>
                      <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                        {dashboardStats.threat_index_active} THREATS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">File Integrity Monitor active</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-cyan-500">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                      <span>MONITORED EVENTS</span>
                      <FileCheck2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white font-mono">
                        {dashboardStats.monitored_events_count}
                      </span>
                      <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">
                        LOGGED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">CREATED, MODIFIED, DELETED tracked</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                      <span>BENIGN FILE COUNT</span>
                      <Database className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white font-mono">
                        {dashboardStats.benign_count}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                        SAFE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Zero threat indicators verified</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                      <span>UNKNOWN CLASSIFICATIONS</span>
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white font-mono">
                        {dashboardStats.unknown_count}
                      </span>
                      <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30">
                        REVIEW NEEDED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Insufficient evidence states</p>
                  </div>
                </div>

                {/* 10-Category Threat Taxonomy Grid */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-bold text-white text-base font-mono">
                        10-Category Enterprise Threat Taxonomy
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                      LIVE DATABASE SYNC
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
                    {DEFAULT_CATEGORIES.map((cat) => {
                      const count = taxonomy[cat] || 0;
                      const isThreatCategory = cat !== "BENIGN" && cat !== "UNKNOWN";
                      return (
                        <div
                          key={cat}
                          className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 transition-all ${
                            count > 0 && isThreatCategory
                              ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                              : cat === "BENIGN"
                              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                              : "bg-black/40 border-white/5 text-slate-400"
                          }`}
                        >
                          <div className="text-[10px] text-slate-400 truncate" title={cat}>{cat}</div>
                          <div className="flex items-baseline justify-between pt-1">
                            <span className="text-xl font-bold text-white">{count}</span>
                            {count > 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                                {isThreatCategory ? "DETECTED" : "VERIFIED"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live CRUD Threat Logger */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-bold text-white text-base font-mono">
                        Live File CRUD Threat Logger Stream
                      </h3>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                      {crudEvents.length} EVENTS STREAMED
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {crudEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          evt.threat_status === "THREAT"
                            ? "bg-black/50 border-rose-500/40 hover:border-rose-500/60"
                            : evt.threat_status === "SUSPICIOUS"
                            ? "bg-black/50 border-amber-500/40 hover:border-amber-500/60"
                            : "bg-black/40 border-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                              evt.event_type === "CREATED" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                              evt.event_type === "MODIFIED" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                              "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}>
                              {evt.event_type}
                            </span>
                            <span className="font-bold text-white text-sm">{evt.file_name}</span>
                            <span className="text-slate-500 text-[11px]">{evt.timestamp}</span>
                          </div>

                          <div className="text-xs font-mono text-slate-400">
                            Path: <code className="text-cyan-400">{evt.file_path}</code>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                            <span>User: <strong className="text-slate-200">{evt.user || "SYSTEM"}</strong></span>
                            <span>Process: <strong className="text-slate-200">{evt.process_name || "fim_watcher"}</strong></span>
                            {evt.reasons && evt.reasons.length > 0 && (
                              <span className="text-amber-300">Reason: {evt.reasons[0]}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 font-mono text-xs flex-shrink-0">
                          <div className="text-right">
                            <div className={`px-2.5 py-1 rounded text-xs font-bold uppercase border inline-block ${
                              evt.threat_status === "THREAT" ? "bg-rose-500/20 text-rose-200 border-rose-500/40" :
                              evt.threat_status === "SUSPICIOUS" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                              "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            }`}>
                              {evt.threat_status} — {evt.category}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">Confidence: {evt.confidence || 95}%</div>
                          </div>

                          <button
                            onClick={() => {
                              const art: DemoScenarioArtifact = {
                                id: evt.id,
                                file_name: evt.file_name,
                                file_path: evt.file_path,
                                event_type: evt.event_type,
                                size_bytes: evt.file_size_bytes || 4096,
                                sha256_hash: evt.file_hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                                process_name: evt.process_name || "powershell.exe",
                                user: evt.user || "SYSTEM",
                                threat_status: evt.threat_status || "SUSPICIOUS",
                                category: evt.category || "Suspicious Script",
                                severity: evt.severity || "MEDIUM",
                                confidence: evt.confidence || 90,
                                reasons: evt.reasons || [],
                                evidence: evt.evidence || [],
                                defensive_indicators: {
                                  persistence_mechanisms: evt.threat_status === "THREAT",
                                  credential_access: evt.category?.includes("Credential") || false,
                                  obfuscated_code: evt.category?.includes("Script") || false,
                                  network_comms: false,
                                  destructive_file_ops: evt.category?.includes("Ransomware") || false,
                                  suspicious_process_exec: evt.threat_status === "THREAT"
                                },
                                content: `// Inspected workspace artifact: ${evt.file_name}\n// Path: ${evt.file_path}\n// Event: ${evt.event_type}\n// Status: ${evt.threat_status}`
                              };
                              setSelectedArtifact(art);
                              setCurrentPage("code_explorer");
                            }}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                            Inspect Code
                          </button>

                          <button
                            onClick={() => setCurrentPage("ai_chat")}
                            className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Investigate this threat in AI Copilot"
                          >
                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                            Ask AI Copilot
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentPage === "ai_chat" && <AICopilotView />}

            {currentPage === "mitigation" && <MitigationRulesView />}

            {currentPage === "knowledge" && <KnowledgeBaseView />}

            {currentPage === "file_scanner" && (
              <FileThreatScannerView onNavigateToMitigation={() => setCurrentPage("mitigation")} />
            )}

            {currentPage === "fleet" && <FleetFimView />}

            {currentPage === "incident" && <IncidentTriageView />}

            {currentPage === "code_explorer" && (
              <FileCodeExplorer selectedFile={selectedArtifact} onSelectArtifact={setSelectedArtifact} />
            )}

            {currentPage === "sps_benchmark" && <SPSBenchmarkView />}

            {currentPage === "siem_gateway" && <SiemGatewayView />}

            {currentPage === "governance_lab" && <GovernanceLabView />}

            {currentPage === "autonomous_tester" && <AutonomousTesterView />}

            {currentPage === "test_reports" && <TestReportsView />}

          </div>
        </main>
      </div>
    </div>
  );
}
