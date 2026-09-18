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
  Bug,
  Download,
  CheckCircle2,
  FileCode2,
  FileText,
  Copy,
  Cpu,
  Send,
  User,
  ArrowRight,
  SkipForward
} from "lucide-react";

type Page = 
  | "dashboard" 
  | "autonomous_tester"
  | "test_reports"
  | "knowledge" 
  | "fleet" 
  | "incident" 
  | "mitigation";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [backendStatus, setBackendStatus] = useState<any>(null);

  // Demo Mode State
  const [demoActive, setDemoActive] = useState(true);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoPaused, setDemoPaused] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Live CRUD Events
  const [crudEvents, setCrudEvents] = useState([
    {
      id: "evt-01",
      timestamp: new Date().toLocaleTimeString(),
      event_type: "CREATED",
      file_path: "monitored_workspace/bin/malware_simulation.exe",
      file_name: "malware_simulation.exe",
      process_name: "cmd.exe",
      user: "NT AUTHORITY\\SYSTEM",
      threat_status: "THREAT",
      category: "Malware",
      severity: "HIGH",
      confidence: 96,
      reasons: ["Executable binary created in non-standard workspace directory", "High entropy binary payload"]
    },
    {
      id: "evt-02",
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      event_type: "MODIFIED",
      file_path: "monitored_workspace/docs/ransomware_simulation.txt",
      file_name: "ransomware_simulation.txt",
      process_name: "encryptor_demo.exe",
      user: "SYSTEM",
      threat_status: "THREAT",
      category: "Ransomware",
      severity: "CRITICAL",
      confidence: 98,
      reasons: ["Rapid bulk document modification", "VSS shadow copy deletion command"]
    },
    {
      id: "evt-03",
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      event_type: "CREATED",
      file_path: "monitored_workspace/scripts/suspicious_script.ps1",
      file_name: "suspicious_script.ps1",
      process_name: "powershell.exe",
      user: "admin",
      threat_status: "SUSPICIOUS",
      category: "Suspicious Script / Execution",
      severity: "MEDIUM",
      confidence: 88,
      reasons: ["Base64 encoded string payload detected"]
    },
    {
      id: "evt-04",
      timestamp: new Date(Date.now() - 600000).toLocaleTimeString(),
      event_type: "CREATED",
      file_path: "monitored_workspace/docs/normal_document.txt",
      file_name: "normal_document.txt",
      process_name: "notepad.exe",
      user: "operator",
      threat_status: "SAFE",
      category: "BENIGN",
      severity: "LOW",
      confidence: 99,
      reasons: ["Standard plain text document"]
    }
  ]);

  // Code explorer active artifact state
  const [activeCodeFile, setActiveCodeFile] = useState({
    file_name: "malware_simulation.exe",
    file_path: "monitored_workspace/bin/malware_simulation.exe",
    threat_status: "THREAT",
    category: "Malware",
    confidence: 96,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    content: "// SAFE SYNTHETIC DEMO ARTIFACT - NO MALICIOUS CODE\n[HEADER]\nmagic=0x5A4D (MZ)\npe_offset=0x00000080\nsections=.text, .data, .rsrc_fake\n\n[BEHAVIOR]\naction=spawn_process\ntarget=cmd.exe /c start /min powershell.exe",
    indicators: {
      persistence: true,
      credential_access: false,
      obfuscation: true,
      network: true,
      destructive: false,
      process_exec: true
    }
  });

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      time: new Date().toLocaleTimeString(),
      text: "Hello Analyst. I am the RAGSec File-System Diagnostic AI. Ask me anything about collected filesystem events or detected malware signatures."
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (res.ok) setBackendStatus(await res.json());
    } catch {}
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSendChat = (overrideText?: string) => {
    const q = overrideText || chatInput;
    if (!q.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      { sender: "user", time: new Date().toLocaleTimeString(), text: q }
    ]);
    if (!overrideText) setChatInput("");

    setTimeout(() => {
      let ans = `[RAGSec AI Analysis] Evaluated query "${q}" against 4 collected filesystem events. All file integrity checks are active in monitored_workspace/.`;
      if (q.toLowerCase().includes("malware") || q.toLowerCase().includes("flagged")) {
        ans = `**malware_simulation.exe** was flagged because it exhibited executable binary creation in an unverified directory, high entropy PE sections, and automated process spawn attempts.\n\nConfidence: 96% | Category: Malware | Severity: High`;
      } else if (q.toLowerCase().includes("ransomware")) {
        ans = `**Ransomware Activity Detected:**\n\nTarget: \`monitored_workspace/docs/ransomware_simulation.txt\`\nCommand Detected: \`vssadmin delete shadows /all /quiet\`\nSeverity: CRITICAL | Confidence: 98%`;
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", time: new Date().toLocaleTimeString(), text: ans }
      ]);
    }, 600);
  };

  const handleTriggerScenario = (sc: string) => {
    if (sc === "ransomware") {
      setActiveCodeFile({
        file_name: "ransomware_simulation.txt",
        file_path: "monitored_workspace/docs/ransomware_simulation.txt",
        threat_status: "THREAT",
        category: "Ransomware",
        confidence: 98,
        sha256: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
        content: "# DEMO RANSOMWARE NOTIFICATION - SYNTHETIC ONLY\nYOUR FILES HAVE BEEN ENCRYPTED (SIMULATED DEMO MODE)\nAll documents and backup files locked.\nAES-256-CBC (Simulated)",
        indicators: {
          persistence: false,
          credential_access: false,
          obfuscation: true,
          network: false,
          destructive: true,
          process_exec: true
        }
      });
    }
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
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
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
      </aside>

      {/* Main Container */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
        <header className="h-16 border-b border-white/10 bg-[#080C14]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-white font-mono">RAGSec Threat & File Analysis Core</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDemoActive(!demoActive)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-2 ${
                demoActive ? "bg-cyan-500/30 text-cyan-200 border border-cyan-500/40" : "bg-white/5 text-slate-400"
              }`}
            >
              {demoActive ? "DEMO MODE: ACTIVE" : "ENABLE DEMO MODE"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#060911] text-slate-100">
          <div className="max-w-7xl mx-auto space-y-6">

            {currentPage === "dashboard" && (
              <div className="space-y-6">
                {/* Demo Controls */}
                <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-cyan-500 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" /> P8 SCRIPTED DEMO MODE CONTROLS
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setDemoRunning(true);
                          handleTriggerScenario("malware");
                          setTimeout(() => handleTriggerScenario("ransomware"), 1800);
                          setTimeout(() => setDemoRunning(false), 3600);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        {demoRunning ? "Running Scripted Demo..." : "Run Full 10-Step Demo"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                    <span className="text-slate-400 text-[11px]">Trigger Preset:</span>
                    {["malware", "ransomware", "trojan", "script", "credential", "persistence"].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleTriggerScenario(key)}
                        className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300 hover:border-cyan-500/40 text-[11px]"
                      >
                        {key.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 10-Category Threat Taxonomy */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <h3 className="font-bold text-white text-base font-mono flex items-center gap-2">
                      <Layers className="w-5 h-5 text-cyan-400" /> 10-Category Enterprise Threat Taxonomy
                    </h3>
                    <span className="text-xs font-mono text-cyan-400 font-bold">LIVE STATE</span>
                  </div>

                  <div className="grid grid-cols-6 gap-3 font-mono text-xs">
                    {["Malware", "Ransomware", "Trojan", "Worm", "Spyware", "Rootkit", "Credential Theft", "Suspicious Script", "Persistence", "Exfiltration", "BENIGN", "UNKNOWN"].map((c) => (
                      <div key={c} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <div className="text-[10px] text-slate-400 truncate">{c}</div>
                        <div className="text-xl font-bold text-white">
                          {c === "Malware" ? 1 : c === "Ransomware" ? 1 : c === "Suspicious Script" ? 1 : c === "BENIGN" ? 1 : 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live CRUD Logger */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-white text-base font-mono flex items-center gap-2 border-b border-white/10 pb-3">
                    <Activity className="w-5 h-5 text-cyan-400" /> Live File CRUD Threat Logger Stream
                  </h3>
                  <div className="space-y-3">
                    {crudEvents.map((e) => (
                      <div key={e.id} className="p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center text-xs font-mono">
                        <div>
                          <div className="font-bold text-white">{e.file_name} <span className="text-cyan-400">[{e.event_type}]</span></div>
                          <div className="text-slate-400">{e.file_path}</div>
                        </div>
                        <span className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 font-bold">{e.threat_status} — {e.category}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Explorer */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-white text-base font-mono flex items-center gap-2 border-b border-white/10 pb-3">
                    <FileCode2 className="w-5 h-5 text-cyan-400" /> Static File Code Explorer
                  </h3>
                  <div className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-xs text-cyan-300 whitespace-pre-wrap h-40 overflow-y-auto">
                    {activeCodeFile.content}
                  </div>
                </div>

                {/* Diagnostic Chatbot */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-white text-base font-mono flex items-center gap-2 border-b border-white/10 pb-3">
                    <BrainCircuit className="w-5 h-5 text-cyan-400" /> AI File-System Diagnostic Chatbot
                  </h3>
                  <div className="flex gap-2">
                    {["Why was malware_simulation.exe flagged?", "Are there signs of ransomware?"].map((p, i) => (
                      <button key={i} onClick={() => handleSendChat(p)} className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 h-40 overflow-y-auto font-mono text-xs">
                    {chatMessages.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5">
                        <strong className="text-cyan-400">{m.sender === "user" ? "You" : "RAGSec AI"}:</strong> {m.text}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {currentPage === "autonomous_tester" && (
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-white font-mono">P8 Autonomous Tester</h3>
              </div>
            )}

            {currentPage === "test_reports" && (
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-white font-mono">P8 Test Reports</h3>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
