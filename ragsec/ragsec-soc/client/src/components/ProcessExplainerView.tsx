import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Terminal, 
  HardDrive, 
  Layers, 
  Flame, 
  Bot, 
  Check, 
  SlidersHorizontal,
  XCircle,
  ExternalLink,
  Zap,
  Info
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://127.0.0.1:8000";

export interface HostProcessItem {
  pid: number;
  name: string;
  status: string;
  cpu_percent: number;
  memory_mb: number;
  cmdline: string;
  create_time?: string;
  category?: string;
  functional_role?: string;
  is_suspicious?: boolean;
  suspicious_reasons?: string[];
  can_terminate?: boolean;
}

export interface DeepAnalysisData {
  pid: number;
  name: string;
  exe_path?: string;
  parent?: string;
  cmdline?: string;
  status?: string;
  cpu_percent?: number;
  memory_mb?: number;
  num_threads?: number;
  listening_ports?: string[];
  category?: string;
  functional_role?: string;
  verdict?: string;
  verdict_text?: string;
  is_suspicious?: boolean;
  reasons?: string[];
  is_platform?: boolean;
  can_terminate?: boolean;
  remediation_options?: Array<{
    option: string;
    title: string;
    action: string;
    command?: string;
    description: string;
    is_destructive?: boolean;
    disabled?: boolean;
  }>;
}

interface ProcessExplainerProps {
  onAskCopilot?: (query: string) => void;
  notify?: (msg: string) => void;
}

export function ProcessExplainerView({ onAskCopilot, notify }: ProcessExplainerProps) {
  const [processes, setProcesses] = useState<HostProcessItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [deepData, setDeepData] = useState<DeepAnalysisData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "suspicious" | "high_cpu" | "platform">("all");
  const [terminating, setTerminating] = useState(false);

  const fetchProcesses = async (silence = false) => {
    if (!silence) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/processes`);
      if (res.ok) {
        const data = await res.json();
        const list: HostProcessItem[] = data.processes || [];
        setProcesses(list);
        if (!selectedPid && list.length > 0) {
          // Default select the first suspicious or first process
          const firstSuspicious = list.find((p) => p.is_suspicious);
          const pick = firstSuspicious || list[0];
          setSelectedPid(pick.pid);
          loadDeepAnalysis(pick.pid);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch host processes:", err);
    } finally {
      if (!silence) setLoading(false);
    }
  };

  const loadDeepAnalysis = async (pid: number) => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/api/processes/${pid}/deep-analysis`);
      if (res.ok) {
        const data: DeepAnalysisData = await res.json();
        setDeepData(data);
      } else {
        // Fallback local heuristic analysis
        const proc = processes.find((p) => p.pid === pid);
        if (proc) {
          setDeepData({
            pid: proc.pid,
            name: proc.name,
            cmdline: proc.cmdline,
            cpu_percent: proc.cpu_percent,
            memory_mb: proc.memory_mb,
            category: proc.category || "UNKNOWN",
            functional_role: proc.functional_role || "Host Process",
            verdict: proc.is_suspicious ? "SUSPICIOUS_ANOMALY" : "BENIGN_WORKLOAD",
            verdict_text: proc.is_suspicious 
              ? "Process exhibits behavioral deviations requiring validation."
              : "Standard application process operating within normal parameters.",
            is_suspicious: proc.is_suspicious,
            reasons: proc.suspicious_reasons || [],
            can_terminate: proc.can_terminate !== false
          });
        }
      }
    } catch {
      // Fallback
      const proc = processes.find((p) => p.pid === pid);
      if (proc) {
        setDeepData({
          pid: proc.pid,
          name: proc.name,
          cmdline: proc.cmdline,
          cpu_percent: proc.cpu_percent,
          memory_mb: proc.memory_mb,
          category: proc.category || "UNKNOWN",
          functional_role: proc.functional_role || "Host Process",
          verdict: proc.is_suspicious ? "SUSPICIOUS_ANOMALY" : "BENIGN_WORKLOAD",
          verdict_text: proc.is_suspicious 
            ? "Process exhibits behavioral deviations requiring validation."
            : "Standard application process operating within normal parameters.",
          is_suspicious: proc.is_suspicious,
          reasons: proc.suspicious_reasons || [],
          can_terminate: proc.can_terminate !== false
        });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(() => fetchProcesses(true), 12000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectProcess = (proc: HostProcessItem) => {
    setSelectedPid(proc.pid);
    loadDeepAnalysis(proc.pid);
  };

  const handleTerminate = async (pid: number, name: string) => {
    if (deepData?.is_platform) {
      toast.error(`Cannot terminate RAGSec Platform Core (${name}). Service is protected.`);
      return;
    }
    setTerminating(true);
    try {
      const res = await fetch(`${API_BASE}/api/processes/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid, reason: `Manual termination via Process Explainer console: ${name}` })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Process terminated: ${name} (PID ${pid})`);
        if (notify) notify(`Process ${pid} (${name}) terminated`);
        fetchProcesses();
      } else {
        toast.error(data.detail || `Failed to terminate PID ${pid}`);
      }
    } catch {
      toast.error(`Connection error when terminating PID ${pid}`);
    } finally {
      setTerminating(false);
    }
  };

  const handleAskCopilotAboutProcess = () => {
    if (!deepData) return;
    const prompt = `Investigate running process PID ${deepData.pid} (${deepData.name}): Role: "${deepData.functional_role || "Unknown"}". Command line: "${deepData.cmdline || deepData.name}". Resource usage: ${deepData.cpu_percent}% CPU, ${deepData.memory_mb}MB RAM. Analyze its true functional purpose, evaluate whether it is legitimate software, developer workload, or harmful, and provide proportional remediation and management options.`;
    if (onAskCopilot) {
      onAskCopilot(prompt);
      toast.info(`Sent PID ${deepData.pid} telemetry to AI Copilot Chat`);
    } else {
      navigator.clipboard?.writeText(prompt);
      toast.success("Investigation query copied to clipboard");
    }
  };

  const filteredProcesses = useMemo(() => {
    let list = processes;
    if (filter === "suspicious") list = list.filter((p) => p.is_suspicious);
    else if (filter === "high_cpu") list = list.filter((p) => p.cpu_percent >= 10.0);
    else if (filter === "platform") list = list.filter((p) => p.category === "RAGSEC_PLATFORM");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => 
        p.name.toLowerCase().includes(q) || 
        String(p.pid).includes(q) || 
        (p.cmdline && p.cmdline.toLowerCase().includes(q)) ||
        (p.functional_role && p.functional_role.toLowerCase().includes(q))
      );
    }
    return list;
  }, [processes, filter, search]);

  const suspiciousCount = processes.filter((p) => p.is_suspicious).length;
  const platformCount = processes.filter((p) => p.category === "RAGSEC_PLATFORM").length;
  const highCpuCount = processes.filter((p) => p.cpu_percent >= 10.0).length;

  return (
    <div className="space-y-6">
      {/* HUD Metrics Header */}
      <div className="metrics-row">
        <button className="metric" onClick={() => setFilter("all")}>
          <div className="metric-head">
            <span>ACTIVE PROCESSES</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <strong>{processes.length}</strong>
          <small>Live host processes</small>
        </button>

        <button className="metric" onClick={() => setFilter("suspicious")}>
          <div className="metric-head">
            <span>FLAGGED ANOMALIES</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <strong className={suspiciousCount > 0 ? "text-rose-400" : ""}>{suspiciousCount}</strong>
          <small>{suspiciousCount > 0 ? "Rogue indicators active" : "Zero host anomalies"}</small>
        </button>

        <button className="metric" onClick={() => setFilter("platform")}>
          <div className="metric-head">
            <span>PLATFORM CORE</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <strong>{platformCount}</strong>
          <small>Protected infrastructure</small>
        </button>

        <button className="metric" onClick={() => setFilter("high_cpu")}>
          <div className="metric-head">
            <span>HIGH CPU LOAD</span>
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <strong>{highCpuCount}</strong>
          <small>&gt;10% CPU consumption</small>
        </button>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Process Selector Table (7 cols) */}
        <section className="lg:col-span-7 panel p-0 overflow-hidden">
          <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black/20">
            <div>
              <span className="eyebrow">LIVE HOST TELEMETRY</span>
              <h3 className="text-base font-semibold text-white">Process Selector & Activity Stream</h3>
            </div>
            <button
              onClick={() => fetchProcesses()}
              disabled={loading}
              className="btn btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 self-end sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Polling..." : "Refresh"}</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-3 border-b border-white/[0.08] flex flex-wrap items-center gap-2 bg-black/10">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search PID, executable name, commandline argument..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filter === "all" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                All ({processes.length})
              </button>
              <button
                onClick={() => setFilter("suspicious")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filter === "suspicious" ? "bg-rose-500/20 text-rose-300 font-medium" : "text-slate-400 hover:text-rose-300"
                }`}
              >
                Anomalies ({suspiciousCount})
              </button>
              <button
                onClick={() => setFilter("high_cpu")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filter === "high_cpu" ? "bg-amber-500/20 text-amber-300 font-medium" : "text-slate-400 hover:text-amber-300"
                }`}
              >
                High CPU ({highCpuCount})
              </button>
              <button
                onClick={() => setFilter("platform")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filter === "platform" ? "bg-cyan-500/20 text-cyan-300 font-medium" : "text-slate-400 hover:text-cyan-300"
                }`}
              >
                Platform ({platformCount})
              </button>
            </div>
          </div>

          {/* Process Scroll Table */}
          <div className="max-h-[560px] overflow-y-auto divide-y divide-white/[0.05]">
            {filteredProcesses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No matching processes found matching "{search}".
              </div>
            ) : (
              filteredProcesses.map((proc) => {
                const isSelected = selectedPid === proc.pid;
                return (
                  <div
                    key={proc.pid}
                    onClick={() => handleSelectProcess(proc)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-cyan-500/10 border-l-4 border-cyan-400"
                        : "hover:bg-white/[0.03] border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="font-mono text-xs text-slate-400 w-14 shrink-0">
                        #{proc.pid}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white truncate">{proc.name}</span>
                          {proc.is_suspicious && (
                            <span className="badge threat text-[10px] py-0 px-1.5 shrink-0">ANOMALY</span>
                          )}
                          {proc.category === "RAGSEC_PLATFORM" && (
                            <span className="badge safe text-[10px] py-0 px-1.5 shrink-0">PLATFORM</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[320px]">
                          {proc.functional_role || proc.cmdline || "Operating System Host Process"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div className="text-[11px] font-mono">
                        <span className={proc.cpu_percent >= 10.0 ? "text-amber-400 font-bold" : "text-slate-300"}>
                          {proc.cpu_percent}% CPU
                        </span>
                        <span className="text-slate-500 ml-1.5">{proc.memory_mb} MB</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProcess(proc);
                        }}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${
                          isSelected 
                            ? "bg-cyan-500 text-black font-semibold"
                            : "bg-white/5 hover:bg-white/10 text-slate-300"
                        }`}
                      >
                        Explain
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: AI Forensic Process Explainer (5 cols) */}
        <section className="lg:col-span-5 panel p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <span className="eyebrow">AI DEEP FORENSIC INVESTIGATION</span>
              <h3 className="text-base font-semibold text-white">Process Explainer & Safety Verdict</h3>
            </div>
            {analyzing && (
              <span className="text-xs text-cyan-400 flex items-center gap-1 font-mono">
                <RefreshCw className="w-3 h-3 animate-spin" /> Evaluating...
              </span>
            )}
          </div>

          {!deepData ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Select a process from the live list to inspect its functional role and harmfulness.
            </div>
          ) : (
            <>
              {/* Verdict Banner: Is this process harmful or not? */}
              <div
                className={`p-4 rounded-xl border backdrop-blur-sm ${
                  deepData.is_suspicious
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-200"
                    : deepData.is_platform
                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-200"
                    : deepData.category === "SYSTEM_INFRASTRUCTURE"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                    : "bg-blue-500/15 border-blue-500/30 text-blue-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {deepData.is_suspicious ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] tracking-wider uppercase font-mono font-bold opacity-80">
                      SAFETY EVALUATION VERDICT
                    </span>
                    <h4 className="text-sm font-bold tracking-tight">
                      {deepData.is_suspicious
                        ? "🚨 HARMFUL THREAT / SUSPICIOUS ANOMALY"
                        : deepData.is_platform
                        ? "🛡️ VERIFIED RAGSEC PLATFORM CORE SERVICE"
                        : deepData.category === "SYSTEM_INFRASTRUCTURE"
                        ? "⚡ VERIFIED WINDOWS OS SUBSYSTEM"
                        : "⚙️ BENIGN APPLICATION / DEVELOPER WORKLOAD"}
                    </h4>
                  </div>
                </div>
                <p className="text-xs mt-2.5 leading-relaxed opacity-90">
                  {deepData.verdict_text ||
                    (deepData.is_suspicious
                      ? "Process exhibits unauthorized command execution or threat patterns that match known attack vectors."
                      : "Process operates within legitimate parameters with verified signature and nominal system resource usage.")}
                </p>
              </div>

              {/* Functional Purpose & AI Explanation */}
              <div className="space-y-2">
                <span className="eyebrow">VERIFIED FUNCTIONAL PURPOSE</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/[0.06]">
                  {deepData.functional_role || "Generic host operating system process."}
                </p>
              </div>

              {/* Suspicious Reasons / Red Flags if any */}
              {deepData.reasons && deepData.reasons.length > 0 && (
                <div className="space-y-2">
                  <span className="eyebrow text-rose-400">ANOMALY INDICATORS &amp; RED FLAGS</span>
                  <div className="space-y-1.5">
                    {deepData.reasons.map((r, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forensic Telemetry Matrix */}
              <div className="space-y-2">
                <span className="eyebrow">PROCESS IDENTITY &amp; TELEMETRY</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-black/30 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block font-sans">PID / NAME</span>
                    <span className="text-white font-bold">{deepData.pid}</span> ({deepData.name})
                  </div>
                  <div className="p-2 rounded bg-black/30 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block font-sans">PARENT PROCESS</span>
                    <span className="text-slate-300 truncate block">{deepData.parent || "None"}</span>
                  </div>
                  <div className="p-2 rounded bg-black/30 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block font-sans">CPU LOAD</span>
                    <span className="text-slate-200">{deepData.cpu_percent || 0}%</span>
                  </div>
                  <div className="p-2 rounded bg-black/30 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block font-sans">MEMORY RSS</span>
                    <span className="text-slate-200">{deepData.memory_mb || 0} MB</span>
                  </div>
                </div>
              </div>

              {/* Full Commandline Box */}
              {deepData.cmdline && (
                <div className="space-y-1.5">
                  <span className="eyebrow">COMMAND LINE ARGUMENTS</span>
                  <div className="p-2.5 rounded bg-black/40 border border-white/[0.08] font-mono text-[11px] text-slate-300 break-all max-h-24 overflow-y-auto">
                    {deepData.cmdline}
                  </div>
                </div>
              )}

              {/* Listening Ports if any */}
              {deepData.listening_ports && deepData.listening_ports.length > 0 && (
                <div className="space-y-1.5">
                  <span className="eyebrow">BOUND SOCKETS &amp; LISTENING PORTS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {deepData.listening_ports.map((port, idx) => (
                      <span key={idx} className="badge info text-[10px] font-mono">{port}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Proportional Remediation Actions */}
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <span className="eyebrow">PROPORTIONAL REMEDIATION OPTIONS</span>
                <div className="space-y-1.5">
                  <button
                    onClick={handleAskCopilotAboutProcess}
                    className="w-full btn btn-primary py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask AI Copilot to Deeply Explain Process</span>
                  </button>

                  <button
                    onClick={() => handleTerminate(deepData.pid, deepData.name)}
                    disabled={deepData.is_platform || terminating}
                    className={`w-full btn py-2 text-xs flex items-center justify-center gap-2 ${
                      deepData.is_platform
                        ? "btn-ghost opacity-40 cursor-not-allowed"
                        : "btn-danger"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>
                      {deepData.is_platform 
                        ? "Protected Platform Service (Do Not Terminate)" 
                        : terminating 
                        ? "Terminating Process..." 
                        : `Terminate Process (PID ${deepData.pid})`}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
