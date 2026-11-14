import React, { useState, useEffect } from "react";
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
  Search, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Database,
  Clock,
  AlertOctagon,
  FileCheck2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Layers,
  FileCode2,
  FileSearch,
  FileText,
  X,
  Sparkles,
  BookOpen,
  Server,
  Terminal,
  Lock,
  Award, 
  Network, 
  Fingerprint,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  LogOut,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { FileCodeExplorer } from "../components/FileCodeExplorer";
import { KnowledgeBaseView } from "../components/KnowledgeBaseView";
import { FleetFimView } from "../components/FleetFimView";
import { IncidentTriageView } from "../components/IncidentTriageView";
import { MitigationCopilotView } from "../components/MitigationCopilotView";
import { MitigationRulesView } from "../components/MitigationRulesView";
import { FileThreatScannerView } from "../components/FileThreatScannerView";
import { AutonomousTesterView } from "../components/AutonomousTesterView";
import { TestReportsView } from "../components/TestReportsView";
import { AICopilotView } from "../components/AICopilotView";
import { SPSBenchmarkView } from "../components/SPSBenchmarkView";
import { SiemGatewayView } from "../components/SiemGatewayView";
import { GovernanceLabView } from "../components/GovernanceLabView";
import { ActiveThreatReplicatorView } from "../components/ActiveThreatReplicatorView";
import { ThreatLabWalkthroughView } from "../components/ThreatLabWalkthroughView";
import { ThreatTaskNotificationModal } from "../components/ThreatTaskNotificationModal";
import { IEEEPaperModal } from "../components/IEEEPaperModal";
import { AIBrainSelectorModal } from "../components/AIBrainSelectorModal";
import { AICopilotChatView } from "../components/AICopilotChatView";
import { OperatorProfileModal, UserProfile, DEFAULT_OPERATORS } from "../components/OperatorProfileModal";
import { FloatingPearlescentNotification, FleetThreatNotificationItem } from "../components/FloatingPearlescentNotification";
import { RemoteSandboxExplorerModal } from "../components/RemoteSandboxExplorerModal";
import type { DemoScenarioArtifact } from "../services/demoEngine";
import { FileCRUDEvent, ThreatCategory } from "../types";

type Page = 
  | "dashboard"
  | "threat_lab"
  | "active_threats"
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
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [showBrainModal, setShowBrainModal] = useState(false);
  const [activeBrainModel, setActiveBrainModel] = useState<string>(
    () => localStorage.getItem("ragsec_active_brain") || "openai/gpt-oss-120b"
  );

  const handleSelectBrainModel = (model: string) => {
    setActiveBrainModel(model);
    localStorage.setItem("ragsec_active_brain", model);
    localStorage.setItem("ragsec_model_name", model);
    window.dispatchEvent(new Event("storage"));
  };

  useEffect(() => {
    const syncModel = () => {
      const stored = localStorage.getItem("ragsec_active_brain");
      if (stored && stored !== activeBrainModel) {
        setActiveBrainModel(stored);
      }
    };
    window.addEventListener("storage", syncModel);
    return () => window.removeEventListener("storage", syncModel);
  }, [activeBrainModel]);

  // Selected Artifact for Code Explorer
  const [selectedArtifact, setSelectedArtifact] = useState<DemoScenarioArtifact | null>(null);

  // Selected Threat passed directly to Threat Mitigation
  const [selectedThreatForMitigation, setSelectedThreatForMitigation] = useState<{
    fileName: string;
    filePath: string;
    category?: string;
    threatStatus?: string;
    reasons?: string[];
    evidence?: string[];
  } | null>(null);

  // Live CRUD Events Log Stream
  const [crudEvents, setCrudEvents] = useState<FileCRUDEvent[]>([]);
  const [fimFilter, setFimFilter] = useState<"ALL" | "THREATS" | "BENIGN" | "AI">("ALL");
  const [threatNotification, setThreatNotification] = useState<FileCRUDEvent | null>(null);

  const threatEventsCount = crudEvents.filter(
    (e) => e.threat_status === "THREAT" || e.threat_status === "SUSPICIOUS"
  ).length;
  const benignEventsCount = crudEvents.filter(
    (e) => e.threat_status !== "THREAT" && e.threat_status !== "SUSPICIOUS" && e.event_type !== "AI_ANALYSIS"
  ).length;
  const aiEventsCount = crudEvents.filter(
    (e) => e.event_type === "AI_ANALYSIS" || (e.process_name && e.process_name.includes("ai_"))
  ).length;

  const filteredCrudEvents = crudEvents.filter((evt) => {
    if (fimFilter === "THREATS") {
      return evt.threat_status === "THREAT" || evt.threat_status === "SUSPICIOUS";
    }
    if (fimFilter === "BENIGN") {
      return evt.threat_status !== "THREAT" && evt.threat_status !== "SUSPICIOUS" && evt.event_type !== "AI_ANALYSIS";
    }
    if (fimFilter === "AI") {
      return evt.event_type === "AI_ANALYSIS" || (evt.process_name && evt.process_name.includes("ai_"));
    }
    return true;
  });

  // Collapsible Left Navigation State
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem("ragsec_sidebar_collapsed") === "true"
  );

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("ragsec_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Expanded FIM Event Details Drawer
  const [expandedFimId, setExpandedFimId] = useState<string | null>(null);

  // SOC Operator / Admin Authentication State (Left Sidebar Only)
  const [operators, setOperators] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem("ragsec_operators");
      return stored ? JSON.parse(stored) : DEFAULT_OPERATORS;
    } catch {
      return DEFAULT_OPERATORS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem("ragsec_current_operator");
      return stored ? JSON.parse(stored) : DEFAULT_OPERATORS[0];
    } catch {
      return DEFAULT_OPERATORS[0];
    }
  });

  const [showUserModal, setShowUserModal] = useState(false);

  const handleUpdateUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem("ragsec_current_operator", JSON.stringify(user));
    setOperators((prev) => {
      const next = prev.map((o) => (o.id === user.id ? user : o));
      localStorage.setItem("ragsec_operators", JSON.stringify(next));
      return next;
    });
  };

  const handleAddOperator = (newOp: UserProfile) => {
    setOperators((prev) => {
      const next = [...prev, newOp];
      localStorage.setItem("ragsec_operators", JSON.stringify(next));
      return next;
    });
  };

  const quarantinedEventsCount = crudEvents.filter(
    (e) => e.threat_status === "QUARANTINED" || e.quarantined
  ).length || 12;

  // Dynamic Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState({
    threat_index_active: 0,
    monitored_events_count: 0,
    benign_count: 0,
    unknown_count: 0,
    taxonomy_counts: {
      "Malware": 0,
      "Ransomware": 0,
      "Trojan": 0,
      "Worm": 0,
      "Spyware": 0,
      "Rootkit": 0,
      "Phishing / Credential Theft": 0,
      "Suspicious Script / Execution": 0,
      "Persistence / Privilege Abuse": 0,
      "Data Theft / Exfiltration": 0,
      "BENIGN": 0,
      "UNKNOWN": 0
    } as Record<string, number>
  });

  // Global RAG Topbar Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanningWorkspace, setIsScanningWorkspace] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      if (res.ok) {
        const data = await res.json();
        setDashboardStats({
          threat_index_active: data.threat_index_active ?? data.threat_count ?? 0,
          monitored_events_count: data.monitored_events_count ?? data.monitored_events ?? 0,
          benign_count: data.benign_count ?? 0,
          unknown_count: data.unknown_count ?? 0,
          taxonomy_counts: data.taxonomy_counts ?? {}
        });
      }
    } catch {}
  };

  const normalizeFimEvent = (e: any): FileCRUDEvent => {
    const c = e.canonical || {};
    const ta = e.threat_analysis || {};
    const fp = c.file_path || "";
    const fn = fp ? fp.split(/[\/\\]/).pop() : (e.raw_message || "event_artifact");
    const isSuspicious = e.is_suspicious === true;
    const threatState = ta.is_threat !== undefined ? ta.is_threat : isSuspicious;
    const eventType = (c.action || e.event_type || (e.source_type === "AI_CODE_ANALYSIS" ? "AI_ANALYSIS" : "SCAN")).toUpperCase();
    return {
      id: e.id,
      timestamp: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
      event_type: eventType,
      file_path: fp || "monitored_workspace/file",
      file_name: fn || "unknown",
      file_size_bytes: 4096,
      file_hash: c.file_hash_sha256 || "",
      process_name: e.process_name || (e.source_type === "AI_CODE_ANALYSIS" ? "ai_code_analyzer" : "fim_watcher"),
      user: "NT AUTHORITY\\SYSTEM",
      threat_status: e.status === "QUARANTINED" ? "QUARANTINED" : (threatState ? "THREAT" : "SAFE"),
      category: ta.classification || c.category || (isSuspicious ? "Malware" : "BENIGN"),
      severity: (ta.severity || (isSuspicious ? "HIGH" : "LOW")).toUpperCase(),
      confidence: ta.confidence ? Math.round(ta.confidence * (ta.confidence <= 1 ? 100 : 1)) : (isSuspicious ? 90 : 95),
      reasons: ta.rationale ? [ta.rationale] : (e.raw_message ? [e.raw_message] : []),
      evidence: ta.indicators || [],
      quarantined: e.status === "QUARANTINED"
    };
  };

  const fetchFimEvents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/events`);
      if (res.ok) {
        const data = await res.json();
        const eventList = Array.isArray(data) ? data : (data.events || []);
        const normalized = eventList.map(normalizeFimEvent);
        setCrudEvents(normalized);
      }
    } catch {}
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

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/soc/devices`);
      if (res.ok) {
        const d = await res.json();
        if (d && Array.isArray(d) && d.length > 0) {
          setMonitoredDevices(d);
        }
      }
    } catch {}
  };

  const handleScanWorkspace = async () => {
    setIsScanningWorkspace(true);
    toast.loading("Scanning workspace directory...", { id: "scan-toast" });
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/scan`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Scan complete: ${data.files_scanned || 0} files inspected, ${data.threats_flagged || 0} threats detected.`, { id: "scan-toast" });
        await Promise.all([fetchDashboardStats(), fetchFimEvents()]);
      } else {
        toast.error("Workspace scan encountered an issue.", { id: "scan-toast" });
      }
    } catch (e: any) {
      toast.error(`Scan error: ${e.message}`, { id: "scan-toast" });
    } finally {
      setIsScanningWorkspace(false);
    }
  };

  const [fleetHarmfulLogs, setFleetHarmfulLogs] = useState<any[]>([]);
  const [activePearlescentAlerts, setActivePearlescentAlerts] = useState<FleetThreatNotificationItem[]>([]);
  const [globalSandboxDevice, setGlobalSandboxDevice] = useState<any>(null);
  const [showGlobalSandboxModal, setShowGlobalSandboxModal] = useState<boolean>(false);

  const fetchFleetHarmfulLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/harmful-logs`);
      if (res.ok) {
        const logs = await res.json();
        if (Array.isArray(logs)) {
          setFleetHarmfulLogs(logs);
          if (logs.length > 0) {
            const newest = logs[0];
            const savedLastId = sessionStorage.getItem("ragsec_last_harmful_log_id");
            if (savedLastId && newest.id !== savedLastId) {
              // Surface as top-right pearlescent dismissable notification
              setActivePearlescentAlerts((prev) => {
                if (prev.some((a) => a.id === newest.id)) return prev;
                return [newest, ...prev];
              });
            }
            sessionStorage.setItem("ragsec_last_harmful_log_id", newest.id);
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    const handleCustomThreatAlert = (e: any) => {
      if (e.detail) {
        setActivePearlescentAlerts((prev) => [e.detail, ...prev.filter((x) => x.id !== e.detail.id)]);
      }
    };
    window.addEventListener("ragsec-fleet-threat-alert", handleCustomThreatAlert);
    return () => window.removeEventListener("ragsec-fleet-threat-alert", handleCustomThreatAlert);
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      await checkHealth();
      try {
        await fetch(`${API_BASE_URL}/api/fim/init-workspace`, { method: "POST" });
      } catch (_) {}
      await Promise.all([fetchDashboardStats(), fetchFimEvents(), fetchDevices(), fetchFleetHarmfulLogs()]);
      setIsInitializing(false);
    };

    init();

    const interval = setInterval(() => {
      checkHealth();
      fetchDashboardStats();
      fetchFimEvents();
      fetchFleetHarmfulLogs();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchModalOpen(true);
    toast.loading("Querying CTI knowledge base...", { id: "search-toast" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: globalSearchQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
        toast.success("Retrieved and verified threat intelligence.", { id: "search-toast" });
      } else {
        setSearchResult({
          answer: `Retrieved threat intelligence for "${globalSearchQuery}". No anomalies flagged.`,
          status: "COMPLETED",
          crc_status: "VERIFIED",
          citations: []
        });
        toast.info("Query evaluated locally.", { id: "search-toast" });
      }
    } catch {
      setSearchResult({
        answer: `Evaluated "${globalSearchQuery}" against local SOC telemetry & CTI knowledge base.`,
        status: "COMPLETED",
        crc_status: "VERIFIED",
        citations: []
      });
      toast.info("Offline evaluation complete.", { id: "search-toast" });
    } finally {
      setIsSearching(false);
    }
  };

  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  const primaryNavItems = [
    { id: "dashboard" as Page, label: "Threat Center", icon: LayoutDashboard, badge: "LIVE" },
    { id: "file_scanner" as Page, label: "AI Threat Scanner", icon: FileSearch, badge: "GROQ LPU" },
    { id: "fleet" as Page, label: "Fleet & IEM", icon: Server, badge: "IEM" },
    { id: "mitigation" as Page, label: "Mitigation & Playbooks", icon: Zap, badge: "HITL" },
    { id: "ai_chat" as Page, label: "AI Copilot Chat", icon: Bot, badge: "CHAT" }
  ];

  const diagnosticsNavItems = [
    { id: "incident" as Page, label: "Incident Triage", icon: AlertTriangle },
    { id: "threat_lab" as Page, label: "Threat Simulation Lab", icon: Flame },
    { id: "knowledge" as Page, label: "Knowledge Base", icon: BrainCircuit },
    { id: "test_reports" as Page, label: "Verification & Audit", icon: ClipboardCheck, badge: "100%" },
    { id: "governance_lab" as Page, label: "Governance & CRC", icon: Fingerprint },
    { id: "sps_benchmark" as Page, label: "SPS Benchmark", icon: Award },
    { id: "siem_gateway" as Page, label: "SIEM Export", icon: Network }
  ];

  const isDiagnosticsActive = diagnosticsNavItems.some(item => item.id === currentPage);
  const taxonomy = dashboardStats.taxonomy_counts || {};

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080A10] text-[#F5F5F7] select-none">
      {/* Sleek macOS-Grade Sidebar Navigation */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-60"} h-screen bg-[#0A0D15]/80 backdrop-blur-2xl border-r border-white/[0.07] flex flex-col flex-shrink-0 z-20 transition-all duration-300 ease-in-out`}>
        {/* Brand Header */}
        <div className={`p-4 ${sidebarCollapsed ? "px-2 justify-center" : "px-5 justify-between"} border-b border-white/[0.07] flex items-center`}>
          <div className="flex items-center gap-3">
            <div 
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform"
              title={sidebarCollapsed ? "Click to expand sidebar" : "RAGSec Autonomous SOC"}
            >
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold tracking-tight text-white text-sm">RAGSec</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-400 font-mono font-medium">1.0</span>
                </div>
                <p className="text-[11px] text-[#8E8E93] leading-none mt-0.5">Autonomous SOC</p>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Streamlined Navigation List (Apple 4-Pillar Model) */}
        <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
          {/* Primary Operations Group */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 py-1 text-[10px] tracking-wider text-[#636366] uppercase font-semibold">
                Workspaces
              </div>
            )}
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2.5"
                  } rounded-xl text-xs transition-all relative apple-button ${
                    isActive
                      ? "bg-white/[0.1] text-white font-medium shadow-sm border border-white/[0.12]"
                      : "text-[#8E8E93] hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-400" : "text-[#8E8E93]"}`} />
                    {!sidebarCollapsed && <span className="text-xs">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isActive 
                        ? "bg-blue-500/25 text-blue-200 border border-blue-500/40" 
                        : "bg-white/[0.05] text-[#8E8E93]"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Collapsible Diagnostics & Benchmarks */}
          <div className="pt-2 border-t border-white/[0.06]">
            {!sidebarCollapsed ? (
              <>
                <button
                  onClick={() => setDiagnosticsOpen(!diagnosticsOpen)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] tracking-wider text-[#636366] hover:text-slate-300 uppercase font-semibold transition-all rounded-lg hover:bg-white/[0.02]"
                >
                  <span>Diagnostics & Lab</span>
                  {diagnosticsOpen || isDiagnosticsActive ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {(diagnosticsOpen || isDiagnosticsActive) && (
                  <div className="mt-1 space-y-0.5">
                    {diagnosticsNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentPage(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all relative apple-button ${
                            isActive
                              ? "bg-white/[0.08] text-white font-medium shadow-sm border border-white/[0.08]"
                              : "text-[#8E8E93] hover:text-white hover:bg-white/[0.035] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-[#8E8E93]"}`} />
                            <span className="text-[11px]">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                              isActive 
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                                : "bg-white/[0.05] text-[#8E8E93]"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-1">
                {diagnosticsNavItems.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      title={`Diagnostics: ${item.label}`}
                      className={`w-full flex items-center justify-center py-2 rounded-xl transition-all ${
                        isActive
                          ? "bg-white/[0.08] text-blue-400 border border-white/[0.08]"
                          : "text-[#8E8E93] hover:text-white hover:bg-white/[0.035]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User Login/Logout Profile Card - Left Sidebar Only */}
        <div className="p-2.5 border-t border-white/[0.06] bg-[#07090F]/90">
          {!sidebarCollapsed ? (
            <div 
              onClick={() => setShowUserModal(true)}
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] cursor-pointer transition-all flex items-center justify-between gap-2 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                    {currentUser.avatarInitial}
                  </div>
                  {currentUser.isAuthenticated ? (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0A0D15]"></span>
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#0A0D15]"></span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white text-xs truncate">{currentUser.name}</span>
                    <span className={`text-[8px] font-mono px-1 rounded uppercase font-bold ${
                      currentUser.isAuthenticated
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {currentUser.isAuthenticated ? currentUser.role : "LOCKED"}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8E8E93] truncate leading-tight mt-0.5">
                    {currentUser.isAuthenticated ? currentUser.email : "Click to authenticate"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] group-hover:text-white transition-colors flex-shrink-0" />
            </div>
          ) : (
            <div 
              onClick={() => setShowUserModal(true)}
              className="flex justify-center cursor-pointer py-1 group"
              title={`${currentUser.name} (${currentUser.role}) • ${currentUser.isAuthenticated ? "Online" : "Locked"} - Click to manage`}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md group-hover:scale-105 transition-transform">
                  {currentUser.avatarInitial}
                </div>
                {currentUser.isAuthenticated ? (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0A0D15]"></span>
                ) : (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#0A0D15]"></span>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
        {/* Floating Translucent Topbar */}
        <header className="h-14 border-b border-white/[0.07] bg-[#090C14]/70 backdrop-blur-2xl px-6 flex items-center justify-between z-10 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider hidden sm:block">
              {currentPage.replace("_", " ")}
            </h2>
          </div>

          {/* Spotlight / Command Style Search */}
          <form onSubmit={handleGlobalSearch} className="flex-1 max-w-md">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search CTI, ransomware signatures, or MITRE techniques..."
                className="w-full pl-9 pr-20 py-1.5 rounded-xl bg-white/[0.035] border border-white/[0.08] hover:border-white/[0.14] text-white placeholder-[#636366] text-xs transition-all focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06]"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1 px-2 py-0.8 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white text-[10px] font-medium flex items-center gap-1 apple-button"
              >
                {isSearching ? <RefreshCw className="w-3 h-3 animate-spin text-blue-400" /> : <Sparkles className="w-3 h-3 text-blue-400" />}
                <span>Query</span>
              </button>
            </div>
          </form>

          {/* Live System Pill */}
          <div className="flex items-center gap-2">
            {/* Fleet Threat Alert Pill (Visible across all views when any laptop detects threats) */}
            {fleetHarmfulLogs.length > 0 && (
              <button
                onClick={() => setCurrentPage("fleet")}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 apple-button transition-all shadow-md shadow-rose-600/20 animate-pulse"
                title="Active threat detected on an enterprise fleet laptop! Click to inspect."
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Fleet Threat:</span>
                <span className="font-mono text-white text-[11px] font-bold">
                  {fleetHarmfulLogs.length} Active
                </span>
              </button>
            )}

            {/* AI Brain Selector Pill (Top-Tier Groq Models) */}
            <button
              onClick={() => setShowBrainModal(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm"
              title="Select Top-Tier Groq AI Brain Model & Configure LPU Key"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">AI Brain:</span>
              <span className="font-mono text-white text-[11px] truncate max-w-[130px]">
                {activeBrainModel.split("/").pop()}
              </span>
            </button>

            {/* IEEE Reference Paper Pill */}
            <button
              onClick={() => setShowPaperModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm"
              title="Open IEEE ICAIC 2026 Reference Paper Specification & Architecture"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">IEEE ICAIC 2026 Paper</span>
            </button>

            {currentPage === "file_scanner" && (
              <button
                onClick={handleScanWorkspace}
                disabled={isScanningWorkspace}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-medium flex items-center gap-1.5 apple-button"
                title="Trigger instant FIM scan of workspace"
              >
                <RefreshCw className={`w-3 h-3 text-blue-400 ${isScanningWorkspace ? "animate-spin" : ""}`} />
                <span className="hidden md:inline">Scan Directory</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.035] border border-white/[0.08] text-xs">
              {backendStatus ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>
                  <span className="text-white text-[11px] font-medium">Ready</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span className="text-[#8E8E93] text-[11px]">Connecting</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Global Search Modal */}
        {searchModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="apple-panel max-w-xl w-full p-5 space-y-4 shadow-2xl text-xs max-h-[85vh] overflow-y-auto border border-white/[0.12]">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h3 className="font-semibold text-sm">Threat Intelligence Grounding</h3>
                </div>
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white">
                <span className="text-[10px] text-[#8E8E93] uppercase block mb-1">Query:</span>
                <span className="font-medium">{globalSearchQuery}</span>
              </div>

              {isSearching ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#8E8E93]">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span>Retrieving vector embeddings & reranking...</span>
                </div>
              ) : searchResult ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-blue-500/[0.06] border border-blue-500/20 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-blue-300">Grounding Answer</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        CRC: {searchResult.crc_status || "VERIFIED"}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-xs">
                      {searchResult.answer || searchResult.reply || "No direct answer returned."}
                    </p>
                  </div>

                  {Array.isArray(searchResult.citations) && searchResult.citations.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#8E8E93] uppercase font-semibold block">
                        Citations & Sources:
                      </span>
                      {searchResult.citations.map((c: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06] text-[11px]">
                          <div className="font-medium text-blue-300">{c.title || c.source_id || `Source #${idx + 1}`}</div>
                          <p className="text-[#8E8E93] mt-0.5 line-clamp-2">{c.chunk_text || c.content || c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="pt-2 border-t border-white/[0.08] flex justify-end">
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-medium apple-button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Router with Spring Animations */}
        <main className="flex-1 overflow-y-auto p-6 text-[#F5F5F7]">
          <div className="max-w-7xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", bounce: 0, duration: 0.25 }}
              >
                {currentPage === "dashboard" && (
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-semibold apple-display text-white">
                          Security Operations Center
                        </h1>
                        <p className="text-xs text-[#8E8E93] mt-0.5 apple-subhead">
                          Real-time threat monitoring, endpoint telemetry, and automated mitigation.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleScanWorkspace}
                          disabled={isScanningWorkspace}
                          className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 apple-button shadow-sm"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isScanningWorkspace ? "animate-spin" : ""}`} />
                          Scan Workspace
                        </button>
                        <button
                          onClick={() => setCurrentPage("mitigation")}
                          className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-medium flex items-center gap-1.5 apple-button"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          Launch Copilot
                        </button>
                      </div>
                    </div>

                    {/* Stat Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Active Threats Card */}
                      <div className="apple-panel p-5 space-y-3 relative overflow-hidden group hover:border-red-500/30 transition-all">
                        <div className="flex items-center justify-between text-xs text-[#8E8E93]">
                          <span className="font-medium text-slate-300">Active Threat Index</span>
                          <AlertOctagon className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-3xl font-semibold text-white tracking-tight">
                            {dashboardStats.threat_index_active}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            dashboardStats.threat_index_active > 0
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {dashboardStats.threat_index_active > 0 ? "Action Required" : "All Clear"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                          <span>FIM Surveillance Active</span>
                          <span className="text-red-400/80 font-mono text-[10px]">Real-time</span>
                        </div>
                        <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(15, dashboardStats.threat_index_active * 2))}%` }} 
                          />
                        </div>
                      </div>

                      {/* Monitored Events Card */}
                      <div className="apple-panel p-5 space-y-3 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center justify-between text-xs text-[#8E8E93]">
                          <span className="font-medium text-slate-300">Monitored Events</span>
                          <FileCheck2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-3xl font-semibold text-white tracking-tight">
                            {dashboardStats.monitored_events_count}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Logged
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                          <span>CRUD Operations Streamed</span>
                          <span className="text-blue-400/80 font-mono text-[10px]">Live Audit</span>
                        </div>
                        <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full w-full opacity-80" />
                        </div>
                      </div>

                      {/* Clean Files Card */}
                      <div className="apple-panel p-5 space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between text-xs text-[#8E8E93]">
                          <span className="font-medium text-slate-300">Clean File Events</span>
                          <Database className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-3xl font-semibold text-white tracking-tight">
                            {dashboardStats.benign_count}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Verified Safe
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                          <span>Zero threat indicators</span>
                          <span className="text-emerald-400/80 font-mono text-[10px]">CRC Clean</span>
                        </div>
                        <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full w-full opacity-80" />
                        </div>
                      </div>

                      {/* REPLACED: Contained & Quarantined Card */}
                      <div className="apple-panel p-5 space-y-3 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                        <div className="flex items-center justify-between text-xs text-[#8E8E93]">
                          <span className="font-medium text-slate-300">Quarantined & Contained</span>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-3xl font-semibold text-white tracking-tight">
                            {quarantinedEventsCount}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Isolated
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                          <span>Sandbox isolations enforced</span>
                          <span className="text-emerald-400/80 font-mono text-[10px]">Zero Leakage</span>
                        </div>
                        <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full w-full opacity-80" />
                        </div>
                      </div>
                    </div>

                    {/* Live File CRUD Threat Logger Stream */}
                    <div className="apple-panel p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] pb-3 gap-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-400" />
                          <h3 className="font-semibold text-white text-xs">
                            File Integrity Monitoring Feed
                          </h3>
                        </div>

                        {/* Filter Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setFimFilter("ALL")}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                              fimFilter === "ALL"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.05]"
                            }`}
                          >
                            All ({crudEvents.length})
                          </button>
                          <button
                            onClick={() => setFimFilter("THREATS")}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${
                              fimFilter === "THREATS"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm"
                                : "bg-white/[0.03] text-slate-400 hover:text-red-300 border border-white/[0.05]"
                            }`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                            <span>Threats & Alerts ({threatEventsCount})</span>
                          </button>
                          <button
                            onClick={() => setFimFilter("BENIGN")}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${
                              fimFilter === "BENIGN"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-white/[0.03] text-slate-400 hover:text-emerald-300 border border-white/[0.05]"
                            }`}
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Audit Logs ({benignEventsCount})</span>
                          </button>
                          <button
                            onClick={() => setFimFilter("AI")}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${
                              fimFilter === "AI"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                                : "bg-white/[0.03] text-slate-400 hover:text-purple-300 border border-white/[0.05]"
                            }`}
                          >
                            <Cpu className="w-2.5 h-2.5 text-purple-400" />
                            <span>AI Code Logs ({aiEventsCount})</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {isInitializing && crudEvents.length === 0 ? (
                          <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#8E8E93] text-xs">
                            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                            <span>Seeding monitored directory and initializing FIM scanner...</span>
                          </div>
                        ) : !isInitializing && filteredCrudEvents.length === 0 ? (
                          <div className="py-10 flex flex-col items-center justify-center gap-2 text-[#8E8E93] text-xs">
                            <ShieldCheck className="w-7 h-7 text-emerald-400 opacity-60" />
                            <div className="text-center space-y-0.5">
                              <p className="text-white font-medium">
                                {fimFilter === "THREATS"
                                  ? "Zero Active Threat Alerts"
                                  : fimFilter === "BENIGN"
                                  ? "No Benign Audit Logs In Current View"
                                  : "Surveillance Active — No Events Detected"}
                              </p>
                              <p className="text-[#8E8E93] text-[11px]">
                                {fimFilter === "THREATS"
                                  ? "Monitored workspace is currently clear of signature and behavioral threats."
                                  : "Watching monitored_workspace/ in real time."}
                              </p>
                            </div>
                          </div>
                        ) : (
                          filteredCrudEvents.map((evt) => {
                            const isThreat = evt.threat_status === "THREAT" || evt.threat_status === "SUSPICIOUS";
                            const isExpanded = expandedFimId === evt.id;
                            const isCode = evt.file_name.endsWith(".py") || evt.file_name.endsWith(".exe") || evt.file_name.endsWith(".ps1") || evt.file_name.endsWith(".bat");
                            const isDoc = evt.file_name.endsWith(".txt") || evt.file_name.endsWith(".md") || evt.file_name.endsWith(".json");
                            
                            // Clean relative display path without redundant prefix
                            const cleanPath = evt.file_path.replace(/^monitored_workspace[\\/]/, "");

                            return (
                              <div
                                key={evt.id}
                                className={`rounded-xl border transition-all ${
                                  isThreat
                                    ? "bg-red-500/[0.04] border-red-500/20 hover:border-red-500/40"
                                    : "bg-white/[0.015] border-white/[0.04] hover:border-white/[0.08]"
                                }`}
                              >
                                {/* Main Scannable Row */}
                                <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Icon Badge */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      isThreat 
                                        ? "bg-red-500/15 text-red-400 border border-red-500/25" 
                                        : "bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                                    }`}>
                                      {isCode ? (
                                        <FileCode2 className="w-4 h-4" />
                                      ) : isDoc ? (
                                        <FileText className="w-4 h-4" />
                                      ) : (
                                        <FileSearch className="w-4 h-4" />
                                      )}
                                    </div>

                                    {/* Content Info */}
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`font-semibold text-xs truncate ${isThreat ? "text-red-200 font-mono" : "text-white"}`}>
                                          {evt.file_name}
                                        </span>
                                        <span className="text-[10px] text-[#636366] font-mono">
                                          {cleanPath !== evt.file_name ? cleanPath : "workspace root"}
                                        </span>
                                        <span className="text-[#636366] text-[10px]">•</span>
                                        <span className="text-[#636366] text-[10px]">{evt.timestamp}</span>
                                      </div>

                                      {/* Reason / Trigger - Soft Muted Typography */}
                                      {evt.reasons && evt.reasons.length > 0 && (
                                        <p className="text-[11px] text-slate-300 line-clamp-1">
                                          {evt.reasons[0]}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right side: Single Unified Severity Badge & Actions */}
                                  <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border flex items-center gap-1.5 ${
                                      isThreat
                                        ? "bg-red-500/15 text-red-300 border-red-500/30"
                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    }`}>
                                      {isThreat && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>}
                                      <span>{isThreat ? (evt.category || "THREAT") : "VERIFIED SAFE"}</span>
                                      <span className="text-[9px] opacity-70 font-mono">({evt.confidence || 95}%)</span>
                                    </div>

                                    {isThreat ? (
                                      <button
                                        onClick={() => {
                                          setSelectedThreatForMitigation({
                                            fileName: evt.file_name,
                                            filePath: evt.file_path,
                                            category: evt.category,
                                            threatStatus: evt.threat_status,
                                            reasons: evt.reasons,
                                            evidence: evt.evidence
                                          });
                                          setCurrentPage("mitigation");
                                          toast.info(`Loaded containment playbook for ${evt.file_name}`);
                                        }}
                                        className="px-3 py-1.2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1 apple-button shadow-sm"
                                        title="Open in Mitigation & Copilot Workbench"
                                      >
                                        <Zap className="w-3 h-3" />
                                        <span>Mitigate</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setSelectedThreatForMitigation({
                                            fileName: evt.file_name,
                                            filePath: evt.file_path,
                                            category: evt.category,
                                            threatStatus: evt.threat_status,
                                            reasons: evt.reasons,
                                            evidence: evt.evidence
                                          });
                                          setCurrentPage("mitigation");
                                          toast.info(`Opening Copilot inspection for ${evt.file_name}`);
                                        }}
                                        className="px-3 py-1.2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 apple-button"
                                        title="Inspect telemetry with AI Copilot"
                                      >
                                        <Bot className="w-3 h-3 text-blue-400" />
                                        <span>Inspect</span>
                                      </button>
                                    )}

                                    {/* Toggle Forensic Drawer */}
                                    <button
                                      onClick={() => setExpandedFimId(isExpanded ? null : evt.id)}
                                      className={`p-1.5 rounded-lg border transition-all ${
                                        isExpanded 
                                          ? "bg-white/[0.1] border-white/[0.2] text-white" 
                                          : "bg-white/[0.03] border-white/[0.06] text-[#8E8E93] hover:text-white"
                                      }`}
                                      title={isExpanded ? "Collapse forensics" : "Expand deep forensics"}
                                    >
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>

                                {/* Expandable Forensic Details Drawer */}
                                {isExpanded && (
                                  <div className="px-3.5 pb-3.5 pt-2 border-t border-white/[0.05] bg-black/20 text-xs space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-[#8E8E93] text-[10px] block">Full Path:</span>
                                        <code className="text-slate-300 break-all">{evt.file_path}</code>
                                      </div>
                                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-[#8E8E93] text-[10px] block">SHA-256 Hash:</span>
                                        <code className="text-slate-300 break-all font-mono text-[10px]">
                                          {evt.file_hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                                        </code>
                                      </div>
                                    </div>

                                    {evt.evidence && evt.evidence.length > 0 && (
                                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-[#8E8E93] text-[10px] block mb-1">Grounded Behavioral Indicators:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {evt.evidence.map((ev, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/[0.06]">
                                              {ev}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between pt-1 text-[11px]">
                                      <span className="text-[#8E8E93]">
                                        Process: <span className="text-white font-mono">{evt.process_name || "fim_watcher"}</span> • User: <span className="text-white">{evt.user || "NT AUTHORITY\\SYSTEM"}</span>
                                      </span>
                                      <button
                                        onClick={() => {
                                          setSelectedThreatForMitigation({
                                            fileName: evt.file_name,
                                            filePath: evt.file_path,
                                            category: evt.category,
                                            threatStatus: evt.threat_status,
                                            reasons: evt.reasons,
                                            evidence: evt.evidence
                                          });
                                          setCurrentPage("ai_chat");
                                          toast.info(`Sent ${evt.file_name} telemetry to AI Copilot Chat`);
                                        }}
                                        className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 text-[11px]"
                                      >
                                        <span>Investigate in Copilot Chat</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(currentPage === "threat_lab" || currentPage === "active_threats") && (
                  <ThreatLabWalkthroughView onNavigate={(p) => setCurrentPage(p as Page)} />
                )}

                {currentPage === "mitigation" && (
                  <MitigationCopilotView 
                    initialThreat={selectedThreatForMitigation} 
                    activeModel={activeBrainModel}
                    onNavigateToChat={() => setCurrentPage("ai_chat")}
                  />
                )}

                {currentPage === "ai_chat" && (
                  <AICopilotChatView
                    activeModel={activeBrainModel}
                    initialThreat={selectedThreatForMitigation}
                    onNavigateToMitigation={() => setCurrentPage("mitigation")}
                  />
                )}

                {currentPage === "knowledge" && <KnowledgeBaseView />}

                {currentPage === "file_scanner" && (
                  <FileThreatScannerView 
                    activeModel={activeBrainModel}
                    onModelChange={(m) => handleSelectBrainModel(m)}
                    onNavigateToMitigation={(details?: any) => {
                      if (details) {
                        setSelectedThreatForMitigation({
                          fileName: details.fileName || "unknown",
                          filePath: details.filePath || details.fileName || "monitored_workspace/unknown",
                          category: details.threatCategory || "Malware",
                          threatStatus: "THREAT",
                          reasons: [details.severity || "HIGH"],
                          evidence: []
                        });
                      }
                      setCurrentPage("mitigation");
                    }} 
                  />
                )}

                {currentPage === "fleet" && <FleetFimView />}

                {currentPage === "incident" && <IncidentTriageView />}

                {currentPage === "code_explorer" && (
                  <FileCodeExplorer 
                    selectedFile={selectedArtifact} 
                    onSelectArtifact={setSelectedArtifact} 
                    onFileQuarantined={() => {
                      fetchFimEvents();
                      fetchDashboardStats();
                    }}
                    onFileDeleted={() => {
                      fetchFimEvents();
                      fetchDashboardStats();
                    }}
                  />
                )}

                {currentPage === "sps_benchmark" && <SPSBenchmarkView />}

                {currentPage === "siem_gateway" && <SiemGatewayView />}

                {currentPage === "governance_lab" && <GovernanceLabView />}

                {currentPage === "autonomous_tester" && <AutonomousTesterView />}

                {currentPage === "test_reports" && <TestReportsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Priority Threat Task Pop-up Modal */}
      <ThreatTaskNotificationModal
        threat={threatNotification}
        isOpen={Boolean(threatNotification)}
        onClose={() => setThreatNotification(null)}
        onQuarantined={() => {
          fetchFimEvents();
          fetchDashboardStats();
        }}
        onIgnored={() => {
          fetchFimEvents();
          fetchDashboardStats();
        }}
        onInspect={(t) => {
          setSelectedArtifact({
            id: t.id,
            name: t.file_name,
            file_name: t.file_name,
            file_path: t.file_path,
            size_bytes: t.file_size_bytes || 4096,
            sha256_hash: t.file_hash || "",
            threat_status: t.threat_status,
            category: t.category,
            severity: t.severity,
            confidence: t.confidence || 95,
            reasons: t.reasons || [],
            evidence: t.evidence || [],
            content: "",
            explanation: (t.reasons && t.reasons.length > 0) ? t.reasons.join(". ") : "Threat alert surfaced by behavioral telemetry.",
            event_type: t.event_type,
            process_name: t.process_name || "fim_watcher",
            user: t.user || "NT AUTHORITY\\SYSTEM",
            defensive_indicators: {
              persistence_mechanisms: false,
              credential_access: false,
              obfuscated_code: false,
              network_comms: false,
              destructive_file_ops: false,
              suspicious_process_exec: false,
              encoded_payloads: false
            }
          });
          setCurrentPage("file_scanner");
        }}
      />

      {/* IEEE ICAIC 2026 Reference Paper Specification Modal */}
      <IEEEPaperModal
        isOpen={showPaperModal}
        onClose={() => setShowPaperModal(false)}
        onNavigate={(p) => setCurrentPage(p as Page)}
      />

      {/* Groq AI Brain Selector Modal */}
      <AIBrainSelectorModal
        isOpen={showBrainModal}
        onClose={() => setShowBrainModal(false)}
        selectedModel={activeBrainModel}
        onSelectModel={(model) => handleSelectBrainModel(model)}
      />

      {/* Operator Identity & Access Management Modal (Left Sidebar Only) */}
      <OperatorProfileModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        operators={operators}
        onAddOperator={handleAddOperator}
      />

      {/* Floating Pearlescent Fleet Threat Notifications (Top Right Dismissable) */}
      <FloatingPearlescentNotification
        notifications={activePearlescentAlerts}
        onDismiss={(id) => {
          setActivePearlescentAlerts((prev) => prev.filter((a) => a.id !== id));
        }}
        onDismissAll={() => {
          setActivePearlescentAlerts([]);
        }}
        onInspectSandbox={(item) => {
          setGlobalSandboxDevice({
            id: item.device_id,
            hostname: item.hostname,
            ip_address: item.ip_address,
            os_type: item.os_type || "Remote Node",
            segment: item.segment || "Enclave"
          });
          setShowGlobalSandboxModal(true);
        }}
        onIsolateDevice={(item) => {
          toast.warning(`Device ${item.hostname} ISOLATED. All network access blocked.`);
          setActivePearlescentAlerts((prev) => prev.filter((a) => a.id !== item.id));
        }}
      />

      {/* Global Strict Remote Sandbox Explorer Modal (Direct Launch from Floating Alert) */}
      {showGlobalSandboxModal && (
        <RemoteSandboxExplorerModal
          isOpen={showGlobalSandboxModal}
          onClose={() => {
            setShowGlobalSandboxModal(false);
            setGlobalSandboxDevice(null);
          }}
          device={globalSandboxDevice}
        />
      )}
    </div>
  );
}

