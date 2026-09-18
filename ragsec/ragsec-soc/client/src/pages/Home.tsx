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
  Globe,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Layers,
  Laptop,
  Smartphone,
  Tablet,
  CheckSquare,
  Square as UncheckedSquare,
  Bug,
  Code2,
  Download,
  CheckCircle2,
  FolderLock
} from "lucide-react";

type Page = 
  | "dashboard" 
  | "autonomous_tester"
  | "test_reports"
  | "knowledge" 
  | "fleet" 
  | "incident" 
  | "mitigation";

interface BackendStatus {
  status: string;
  version: string;
  docs: string;
}

interface P8AgentStep {
  step: number;
  time: string;
  type: string;
  desc: string;
  target?: string;
  status: "success" | "warning" | "error";
}

interface P8Issue {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "functional" | "accessibility" | "ui_ux" | "responsive";
  url: string;
  selector: string;
  desc: string;
  repro: string[];
  wcag?: string;
}

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [emergencyLock, setEmergencyLock] = useState(false);

  // P8 Tester State
  const [targetUrl, setTargetUrl] = useState("http://localhost:3000");
  const [targetName, setTargetName] = useState("RAGSec Web Portal");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "functional", "ui_ux", "accessibility", "navigation", "form_input", "responsive"
  ]);
  const [browser, setBrowser] = useState("chromium");
  const [instructions, setInstructions] = useState(
    "Explore auth login flow, test invalid credentials, check for unhandled exceptions, and verify WCAG 2.1 AA color contrast compliance."
  );
  const [autoExploration, setAutoExploration] = useState(true);
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxBudget, setMaxBudget] = useState(50);
  const [isRunning, setIsRunning] = useState(false);

  const [agentSteps, setAgentSteps] = useState<P8AgentStep[]>([]);
  const [issues, setIssues] = useState<P8Issue[]>([
    {
      id: "BUG-101",
      title: "Missing ARIA Label on Password Toggle Button",
      severity: "medium",
      category: "accessibility",
      url: "http://localhost:3000/login",
      selector: "button#toggle-password-visibility",
      desc: "Screen reader cannot identify button purpose because aria-label is missing.",
      repro: [
        "Navigate to http://localhost:3000/login",
        "Focus on password input field",
        "Inspect eye toggle icon button with screen reader active"
      ],
      wcag: "button-name (WCAG 2.1 4.1.2 AA)"
    },
    {
      id: "BUG-102",
      title: "Uncaught Unhandled Rejection on Empty Form Submission",
      severity: "high",
      category: "functional",
      url: "http://localhost:3000/checkout",
      selector: "form#checkout-form",
      desc: "Submitting empty checkout form triggers unhandled Javascript Promise rejection.",
      repro: [
        "Open http://localhost:3000/checkout",
        "Leave all required inputs empty",
        "Click 'Submit Order' button"
      ]
    },
    {
      id: "BUG-103",
      title: "Mobile Viewport Text Overflow on Navigation Header",
      severity: "low",
      category: "responsive",
      url: "http://localhost:3000/dashboard",
      selector: "header > nav.mobile-menu",
      desc: "Navigation text overflows container boundaries on viewports narrower than 375px.",
      repro: [
        "Set viewport width to 360px",
        "Navigate to dashboard",
        "Observe text overflow"
      ]
    }
  ]);

  const [selectedIssue, setSelectedIssue] = useState<P8Issue | null>(issues[0] || null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const checkHealth = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (res.ok) setBackendStatus(await res.json());
      else setBackendStatus(null);
    } catch {
      setBackendStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleStartTest = () => {
    setIsRunning(true);
    setAgentSteps([
      { step: 1, time: "12:45:01", type: "navigate", desc: `Navigated to target URL: ${targetUrl}`, status: "success" },
      { step: 2, time: "12:45:04", type: "inspect", desc: "Extracted DOM tree & identified 24 interactive elements", target: "form#login", status: "success" },
      { step: 3, time: "12:45:08", type: "click", desc: "Submitted form with empty inputs", target: "button.submit", status: "error" },
      { step: 4, time: "12:45:12", type: "assert", desc: "Checked WCAG 2.1 color contrast on error alert", target: "div.error-toast", status: "warning" }
    ]);
    setTimeout(() => {
      setIsRunning(false);
      setCurrentPage("test_reports");
    }, 2500);
  };

  const navItems = [
    { id: "dashboard" as Page, label: "SOC Dashboard", icon: LayoutDashboard },
    { id: "autonomous_tester" as Page, label: "Autonomous Tester", icon: Bot, badge: "P8" },
    { id: "test_reports" as Page, label: "Test Reports & Audit", icon: ClipboardCheck, badge: "REPORTS" },
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
            <p className="text-xs text-slate-400">IEEE Threat & P8 Platform</p>
          </div>
        </div>

        <div className="mx-4 my-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 pulse-dot" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
              <span>P8 Engine</span>
              <span className="text-[10px] text-emerald-400">READY</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Agent Ready for Test Run</p>
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
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 text-xs text-slate-400 font-mono space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Backend API:</span>
            <span className="text-emerald-400 font-semibold">127.0.0.1:8000</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
        <header className="h-16 border-b border-white/10 bg-[#080C14]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              RAGSec Autonomous QA & Threat Intelligence Platform
            </h2>
            <p className="text-xs text-slate-400">Autonomous web testing, WCAG accessibility audits, and SOC telemetry</p>
          </div>

          <div className="flex items-center gap-3">
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
            </div>

            <button
              onClick={() => setEmergencyLock(!emergencyLock)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                emergencyLock ? "bg-rose-600/30 text-rose-300 border-rose-500" : "bg-white/5 text-slate-300 border-white/10"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {emergencyLock ? "LOCKDOWN ACTIVE" : "EMERGENCY LOCK"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#060911] text-slate-100">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* DASHBOARD PAGE */}
            {currentPage === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-cyan-500">
                    <div className="text-xs text-slate-400 font-mono">AUTONOMOUS QA STATUS</div>
                    <div className="text-2xl font-extrabold text-white font-mono">P8 ACTIVE</div>
                    <p className="text-[11px] text-slate-400">Ready for autonomous web crawl</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
                    <div className="text-xs text-slate-400 font-mono">PASS RATE SCORE</div>
                    <div className="text-3xl font-extrabold text-white font-mono">88%</div>
                    <p className="text-[11px] text-slate-400">42 test steps executed</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-blue-500">
                    <div className="text-xs text-slate-400 font-mono">WCAG A11Y AUDIT</div>
                    <div className="text-3xl font-extrabold text-white font-mono">94/100</div>
                    <p className="text-[11px] text-slate-400">WCAG 2.1 AA compliant</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-rose-500">
                    <div className="text-xs text-slate-400 font-mono">DETECTED ISSUES</div>
                    <div className="text-3xl font-extrabold text-white font-mono">3 BUGS</div>
                    <p className="text-[11px] text-slate-400">1 high severity defect</p>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-bold text-white text-base font-mono flex items-center gap-2">
                      <Bot className="w-5 h-5 text-cyan-400" /> Quick Launch Autonomous Test
                    </h3>
                    <button
                      onClick={() => setCurrentPage("autonomous_tester")}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-md"
                    >
                      Open P8 Autonomous Tester &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* P8 AUTONOMOUS TESTER PAGE */}
            {currentPage === "autonomous_tester" && (
              <div className="space-y-6">
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                      <Bot className="w-5 h-5 text-cyan-400" /> P8 Autonomous Web Agent Execution Core
                    </h3>
                    <p className="text-xs text-slate-400">Target app URL, test matrix, device viewports, and custom goals</p>
                  </div>
                  <button
                    onClick={handleStartTest}
                    disabled={isRunning}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg"
                  >
                    {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                    {isRunning ? "Running Agent..." : "Start Autonomous Test"}
                  </button>
                </div>

                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2 border-b border-white/10 pb-3">
                    <Globe className="w-4 h-4 text-cyan-400" /> Target Website / App URL & Scope
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-slate-300 mb-1">Target URL</label>
                      <input
                        type="text"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">App Name</label>
                      <input
                        type="text"
                        value={targetName}
                        onChange={(e) => setTargetName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-white font-mono border-b border-white/10 pb-3">
                    Test Type Selection Matrix
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {["functional", "ui_ux", "accessibility", "navigation", "form_input", "responsive"].map((t) => (
                      <div key={t} className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs font-mono font-bold text-white uppercase flex justify-between items-center">
                        <span>{t.replace("_", " ")}</span>
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-white font-mono border-b border-white/10 pb-3">
                    Custom Instructions & Exploration Budget
                  </h4>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* P8 TEST REPORTS PAGE */}
            {currentPage === "test_reports" && (
              <div className="space-y-6">
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-cyan-400" /> P8 Test Results & Issue Inspector
                    </h3>
                    <p className="text-xs text-slate-400">Detailed reproduction steps, WCAG accessibility violations, and report export</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setToastMsg("Exported P8 Audit Report JSON");
                        setTimeout(() => setToastMsg(null), 3000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" /> Export PDF Report
                    </button>
                  </div>
                </div>

                {toastMsg && (
                  <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    {toastMsg}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-2xl space-y-3">
                    <h4 className="font-bold text-white text-sm font-mono border-b border-white/10 pb-2">Detected Issues</h4>
                    {issues.map((iss) => (
                      <button
                        key={iss.id}
                        onClick={() => setSelectedIssue(iss)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-mono ${
                          selectedIssue?.id === iss.id ? "bg-cyan-950/40 border-cyan-500/50 text-white" : "bg-black/40 border-white/5 text-slate-300"
                        }`}
                      >
                        <div className="font-bold text-cyan-400">{iss.id} - {iss.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase">{iss.category} | {iss.severity}</div>
                      </button>
                    ))}
                  </div>

                  {selectedIssue && (
                    <div className="col-span-2 glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-l-cyan-500">
                      <div className="border-b border-white/10 pb-3">
                        <span className="text-xs font-mono text-cyan-400 font-bold">{selectedIssue.id}</span>
                        <h3 className="text-base font-bold text-white font-mono">{selectedIssue.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{selectedIssue.desc}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-mono font-bold text-white uppercase">Reproduction Steps:</h4>
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-mono space-y-1">
                          {selectedIssue.repro.map((step, idx) => (
                            <div key={idx} className="text-slate-300">{idx + 1}. {step}</div>
                          ))}
                        </div>
                      </div>

                      {selectedIssue.wcag && (
                        <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs font-mono text-blue-300">
                          <strong>WCAG Rule:</strong> {selectedIssue.wcag}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* THREAT INTEL KNOWLEDGE BASE PAGE */}
            {currentPage === "knowledge" && (
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-cyan-400" /> Threat Intelligence Core
                </h3>
                <p className="text-xs text-slate-400">RAGSec CTI Knowledge base & document retriever</p>
              </div>
            )}

            {/* FLEET & FIM PAGE */}
            {currentPage === "fleet" && (
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" /> File Integrity Monitor
                </h3>
                <p className="text-xs text-slate-400">Real-time watcher for monitored_workspace/</p>
              </div>
            )}

            {/* INCIDENT TRIAGE PAGE */}
            {currentPage === "incident" && (
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Incident Triage Queue
                </h3>
                <p className="text-xs text-slate-400">Real-time incident response & RCA report generator</p>
              </div>
            )}

            {/* MITIGATION RULES PAGE */}
            {currentPage === "mitigation" && (
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" /> Mitigation Policies
                </h3>
                <p className="text-xs text-slate-400">IP blocking rules and automated FIM quarantine policies</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
