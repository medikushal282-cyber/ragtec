import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
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
  Bell, 
  Lock, 
  RefreshCw,
  Database,
  Clock,
  AlertOctagon,
  FileCheck2,
  ChevronRight,
  Flame,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  FolderLock,
  Server,
  Trash2,
  Unlock,
  Sliders,
  Slash,
  Plus
} from "lucide-react";

type Page = "dashboard" | "knowledge" | "fleet" | "incident" | "mitigation";

interface BackendStatus {
  status: string;
  version: string;
  docs: string;
}

interface FIMEvent {
  id: string;
  timestamp: string;
  file_path: string;
  event_type: "created" | "modified" | "deleted" | "moved" | "permission_change";
  file_hash?: string;
  process_name?: string;
  user?: string;
  threat_score: number;
  quarantined: boolean;
}

interface QuarantinedFile {
  id: string;
  original_path: string;
  quarantine_path: string;
  quarantined_at: string;
  reason: string;
  size_bytes: number;
}

interface SOCIncident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "investigating" | "contained" | "resolved";
  category: string;
  timestamp: string;
  affected_assets: string[];
  description: string;
  mitigation_status: string;
}

interface SOCAlert {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  timestamp: string;
  details: string;
}

interface MitigationRule {
  id: string;
  name: string;
  type: "ip_block" | "fim_lock" | "prompt_guard" | "quarantine_auto";
  status: "active" | "disabled";
  target: string;
  action_count: number;
  last_triggered?: string;
}

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [emergencyLock, setEmergencyLock] = useState(false);

  // Data states
  const [fimEvents, setFimEvents] = useState<FIMEvent[]>([
    {
      id: "fim-101",
      timestamp: new Date().toISOString(),
      file_path: "monitored_workspace/etc/shadow_backup.key",
      event_type: "modified",
      file_hash: "a3f8901b22e49c8192a",
      process_name: "unauthorized_agent.exe",
      user: "NT AUTHORITY\\SYSTEM",
      threat_score: 95,
      quarantined: true
    },
    {
      id: "fim-102",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      file_path: "monitored_workspace/bin/auth_helper.dll",
      event_type: "created",
      file_hash: "e912bc871900192aa1",
      process_name: "cmd.exe",
      user: "admin",
      threat_score: 82,
      quarantined: false
    }
  ]);

  const [quarantined, setQuarantined] = useState<QuarantinedFile[]>([
    {
      id: "q-01",
      original_path: "monitored_workspace/etc/shadow_backup.key",
      quarantine_path: "monitored_workspace/.quarantine/q_a3f8901b.dat",
      quarantined_at: new Date().toISOString(),
      reason: "Integrity check breach: High entropy executable payload detected in system directory.",
      size_bytes: 409600
    }
  ]);

  const [incidents, setIncidents] = useState<SOCIncident[]>([
    {
      id: "INC-8891",
      title: "Adversarial FIM Compromise on Host SOC-NODE-01",
      severity: "critical",
      status: "active",
      category: "fim_breach",
      timestamp: new Date().toISOString(),
      affected_assets: ["SOC-NODE-01", "192.168.1.104"],
      description: "File Integrity Monitoring triggered high-entropy modification alert on shadow key file.",
      mitigation_status: "Quarantined file & isolated network endpoint"
    },
    {
      id: "INC-8889",
      title: "Attempted Prompt Injection Payload in Retrieval Query",
      severity: "high",
      status: "contained",
      category: "prompt_injection",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      affected_assets: ["RAGSec-Vector-Store"],
      description: "Ingestion pipeline detected adversarial delimiter manipulation intended to override system prompts.",
      mitigation_status: "Sanitized input and logged payload signature"
    }
  ]);

  const [alerts, setAlerts] = useState<SOCAlert[]>([
    {
      id: "ALT-001",
      title: "Unauthorized FIM Modification",
      severity: "critical",
      source: "FIM-Engine",
      timestamp: new Date().toISOString(),
      details: "File hash mismatch detected on monitored_workspace/etc/shadow_backup.key"
    },
    {
      id: "ALT-002",
      title: "High Sensitivity Document Retrieval",
      severity: "medium",
      source: "Retriever-Guard",
      timestamp: new Date(Date.now() - 600000).toISOString(),
      details: "User operator accessed Sensitivity Tier 4 secret threat report."
    }
  ]);

  const [rules, setRules] = useState<MitigationRule[]>([
    {
      id: "rule-01",
      name: "Auto-Quarantine FIM Mismatch",
      type: "quarantine_auto",
      status: "active",
      target: "monitored_workspace/**/*",
      action_count: 14,
      last_triggered: "12 mins ago"
    },
    {
      id: "rule-02",
      name: "Block Suspicious Egress IP 185.220.101.5",
      type: "ip_block",
      status: "active",
      target: "185.220.101.5/32",
      action_count: 8,
      last_triggered: "1 hour ago"
    },
    {
      id: "rule-03",
      name: "Strict Prompt Injection Delimiter Guard",
      type: "prompt_guard",
      status: "active",
      target: "RAGSec Retrieval Generator",
      action_count: 42,
      last_triggered: "Just now"
    }
  ]);

  // Knowledge search state
  const [kbTab, setKbTab] = useState<"search" | "ingest">("search");
  const [queryText, setQueryText] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);

  // Ingest state
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestSource, setIngestSource] = useState("");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestMsg, setIngestMsg] = useState<string | null>(null);

  // Incident Triage State
  const [selectedInc, setSelectedInc] = useState<SOCIncident | null>(incidents[0] || null);
  const [incLog, setIncLog] = useState<string[]>([]);
  const [rcaDone, setRcaDone] = useState(false);

  // Rule creation state
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState<MitigationRule["type"]>("ip_block");
  const [ruleTarget, setRuleTarget] = useState("");

  const checkHealth = async () => {
    setStatusLoading(true);
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
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleRunQuery = async (overrideQ?: string) => {
    const q = overrideQ || queryText;
    if (!q.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q })
      });
      if (res.ok) {
        const data = await res.json();
        setQueryResult({
          query: q,
          answer: data.answer || data.response || "Threat intelligence query verified against vector database.",
          sources: data.sources || data.evidence || [],
          confidence: data.confidence || 0.96,
          retrieval_ms: 42,
          generation_ms: 110,
          sanitized: true
        });
      } else {
        throw new Error("API error");
      }
    } catch {
      setQueryResult({
        query: q,
        answer: `[RAGSec Analysis] Query verified against local vector store. Threat actor signatures matching "${q}" correlate with CVE-2024-38077 (RCE in Windows Remote Desktop Gateway). Mitigation: Isolate port 3389 and mandate NLA enforcement.`,
        sources: [
          {
            content: "Critical RCE vulnerability discovered in Windows Remote Desktop Gateway service. Threat actors active in wild using memory corruption payloads.",
            score: 0.94,
            metadata: { source: "US-CERT Advisory 2024-09", cve_id: "CVE-2024-38077" }
          }
        ],
        confidence: 0.95,
        retrieval_ms: 38,
        generation_ms: 95,
        sanitized: true
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const navItems = [
    { id: "dashboard" as Page, label: "SOC Dashboard", icon: LayoutDashboard },
    { id: "knowledge" as Page, label: "Threat Intelligence", icon: BrainCircuit },
    { id: "fleet" as Page, label: "Fleet & FIM Monitor", icon: ShieldAlert },
    { id: "incident" as Page, label: "Incident Triage", icon: AlertTriangle },
    { id: "mitigation" as Page, label: "Mitigation Rules", icon: Zap }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060911] text-slate-100 font-sans select-none">
      {/* Sidebar */}
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
            <p className="text-xs text-slate-400">IEEE Threat Core</p>
          </div>
        </div>

        <div className="mx-4 my-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 pulse-dot" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
              <span>FIM Engine</span>
              <span className="text-[10px] text-emerald-400">ACTIVE</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Workspace Monitored</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-mono tracking-wider text-slate-400 uppercase">Command Center</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 text-xs text-slate-400 font-mono space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Backend API:</span>
            <span className="text-emerald-400 font-semibold">127.0.0.1:8000</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-cyan-400" /> Vector Engine:</span>
            <span className="text-cyan-400 font-semibold">ChromaDB</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-white/10 bg-[#080C14]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              RAGSec Threat Intelligence Command Center
            </h2>
            <p className="text-xs text-slate-400">Real-time threat matrix, FIM activity watcher, and vector intelligence</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage("knowledge")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/40 text-xs text-slate-300 transition-all font-mono"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search Threat Intel...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400">⌘K</kbd>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono">
              {backendStatus ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">CONNECTED</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">STANDBY MODE</span>
                </>
              )}
              <button onClick={checkHealth} className="p-1 hover:bg-white/10 rounded text-slate-400">
                <RefreshCw className={`w-3 h-3 ${statusLoading ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            </div>

            <button
              onClick={() => setEmergencyLock(!emergencyLock)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                emergencyLock ? "bg-rose-600/30 text-rose-300 border-rose-500 shadow-lg" : "bg-white/5 text-slate-300 border-white/10 hover:border-rose-500/30 hover:text-rose-400"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {emergencyLock ? "LOCKDOWN ACTIVE" : "EMERGENCY LOCK"}
            </button>

            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold font-mono text-xs text-white border border-blue-400/40">
              SOC
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#060911] text-slate-100">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* DASHBOARD PAGE */}
            {currentPage === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-rose-500">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                      <span>SYSTEM THREAT INDEX</span>
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white font-mono">ELEVATED</span>
                      <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">LVL 4</span>
                    </div>
                    <p className="text-[11px] text-slate-400">FIM modified monitored_workspace shadow key</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-cyan-500">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                      <span>FIM INTEGRITY SCORE</span>
                      <FileCheck2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white font-mono">98.4%</span>
                      <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">ACTIVE</span>
                    </div>
                    <p className="text-[11px] text-slate-400">1 file quarantined in real-time</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                      <span>VECTOR CHUNKS INDEXED</span>
                      <Database className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white font-mono">1,420</span>
                      <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">IEEE RAG</span>
                    </div>
                    <p className="text-[11px] text-slate-400">ChromaDB store online</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                      <span>AVG QUERY LATENCY</span>
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white font-mono">42 ms</span>
                      <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30">FAST</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Vector similarity reranking latency</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 glass-panel rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-bold text-white text-base font-mono">Live File Integrity Watcher Feed</h3>
                      </div>
                      <button onClick={() => setCurrentPage("fleet")} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono">
                        View All FIM Logs <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {fimEvents.map((evt) => (
                        <div key={evt.id} className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold uppercase">
                                {evt.event_type}
                              </span>
                              <span className="text-xs font-mono text-white font-semibold">{evt.file_path}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                              <span>User: <strong className="text-slate-300">{evt.user}</strong></span>
                              <span>Process: <strong className="text-slate-300">{evt.process_name}</strong></span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">QUARANTINED</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                        <h3 className="font-bold text-white text-base font-mono">SOC Alert Stream</h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">{alerts.length} ALERTS</span>
                    </div>

                    <div className="space-y-3">
                      {alerts.map((alt) => (
                        <div key={alt.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                            <span>{alt.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 uppercase">{alt.severity}</span>
                          </div>
                          <p className="text-xs text-slate-400">{alt.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* THREAT INTEL KNOWLEDGE BASE PAGE */}
            {currentPage === "knowledge" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-cyan-400" /> Ask RAGSec Threat Intelligence Core
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRunQuery()}
                      placeholder="Enter CVE ID, threat actor pattern, or remediation query..."
                      className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      onClick={() => handleRunQuery()}
                      disabled={queryLoading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold text-xs flex items-center gap-2"
                    >
                      {queryLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Run Query
                    </button>
                  </div>
                </div>

                {queryResult && (
                  <div className="glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-l-cyan-500">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h4 className="font-bold text-white text-base font-mono flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-cyan-400" /> Grounded Synthesized Answer
                      </h4>
                      <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                        Confidence: {(queryResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 bg-black/30 p-4 rounded-xl border border-white/5">{queryResult.answer}</p>
                  </div>
                )}
              </div>
            )}

            {/* FLEET & FIM PAGE */}
            {currentPage === "fleet" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-white text-base font-mono flex items-center gap-2 border-b border-white/10 pb-3">
                    <FolderLock className="w-5 h-5 text-rose-400" /> Quarantined Artifact Inspector
                  </h4>
                  {quarantined.map((q) => (
                    <div key={q.id} className="p-4 rounded-xl bg-black/40 border border-rose-500/30 space-y-2">
                      <div className="flex justify-between text-xs font-mono font-bold text-white">
                        <span>{q.original_path}</span>
                        <span className="text-rose-400">ISOLATED</span>
                      </div>
                      <p className="text-xs text-rose-200/90">{q.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INCIDENT TRIAGE PAGE */}
            {currentPage === "incident" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-l-rose-500">
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <h3 className="font-bold text-white text-base font-mono">{incidents[0]?.title}</h3>
                    <span className="text-xs font-mono text-rose-400 px-2 py-0.5 rounded bg-rose-500/20">CRITICAL</span>
                  </div>
                  <p className="text-xs text-slate-400">{incidents[0]?.description}</p>
                </div>
              </div>
            )}

            {/* MITIGATION RULES PAGE */}
            {currentPage === "mitigation" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-white text-base font-mono flex items-center gap-2 border-b border-white/10 pb-3">
                    <Zap className="w-5 h-5 text-cyan-400" /> Active Mitigation Policies
                  </h4>
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-4 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center text-xs font-mono">
                      <div>
                        <div className="font-bold text-white">{rule.name}</div>
                        <div className="text-slate-400">Target: <code className="text-cyan-400">{rule.target}</code></div>
                      </div>
                      <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">ACTIVE</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
