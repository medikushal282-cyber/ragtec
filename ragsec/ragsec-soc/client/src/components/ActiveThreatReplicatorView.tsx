import React, { useState, useEffect, useRef } from "react";
import { 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  ExternalLink, 
  FileText, 
  Zap, 
  Radio, 
  SlidersHorizontal 
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

interface ActiveThreatReplicatorViewProps {
  onNavigate?: (page: string) => void;
}

export const ActiveThreatReplicatorView: React.FC<ActiveThreatReplicatorViewProps> = ({ onNavigate }) => {
  // Replicator parameters
  const [maxReplicas, setMaxReplicas] = useState(4);
  const [intervalSeconds, setIntervalSeconds] = useState(1.5);

  // Status & Telemetry
  const [status, setStatus] = useState<any>({
    is_running: false,
    thread_status: "IDLE",
    thread_id: null,
    process_name: null,
    current_generation: 0,
    max_replicas: 4,
    created_files: [],
    sandbox_files: [],
    sandbox_file_count: 0,
    sandbox_dir: "",
    banned_threat_count: 0,
    banned_threads: [],
    banned_signatures: [],
    sentinel_enabled: true,
    quarantined_replica_count: 0,
    quarantined_replicas: [],
    last_mitigation_verdict: null
  });

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeBanner, setActiveBanner] = useState<any | null>(null);

  // Poll status every 1 second
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/active-threats/replicator/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.last_mitigation_verdict && data.last_mitigation_verdict.detected) {
          setActiveBanner(data.last_mitigation_verdict);
        }
      }
    } catch (err) {
      // Backend polling error
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchStatus();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Actions
  const handleLaunchReplicator = async () => {
    try {
      setLoadingAction("launching");
      setActiveBanner(null);
      const res = await fetch(`${API_BASE_URL}/api/active-threats/replicator/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_replicas: maxReplicas,
          interval_seconds: intervalSeconds
        })
      });
      if (res.ok) {
        await fetchStatus();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStopReplicator = async () => {
    try {
      setLoadingAction("stopping");
      await fetch(`${API_BASE_URL}/api/active-threats/replicator/stop`, { method: "POST" });
      await fetchStatus();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleScanAndMitigate = async () => {
    try {
      setLoadingAction("mitigating");
      const res = await fetch(`${API_BASE_URL}/api/active-threats/scan-and-mitigate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.detected) {
          setActiveBanner(data);
        }
        await fetchStatus();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRestoreReplicas = async () => {
    try {
      setLoadingAction("restoring");
      await fetch(`${API_BASE_URL}/api/active-threats/restore-replicas`, { method: "POST" });
      await fetchStatus();
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePurgeReplicas = async () => {
    try {
      setLoadingAction("purging");
      await fetch(`${API_BASE_URL}/api/active-threats/purge-replicas`, { method: "POST" });
      setActiveBanner(null);
      await fetchStatus();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleSentinel = async (enabled: boolean) => {
    try {
      await fetch(`${API_BASE_URL}/api/active-threats/sentinel/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      await fetchStatus();
    } catch {}
  };

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      {/* Top Banner / Title */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900 to-cyan-950/40 border border-red-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-red-950/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/40 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 animate-pulse text-red-400" />
              Active Threat & Replicator Sentinel
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40 text-[10px]">
              MITRE ATT&CK T1080 / T1105
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 text-[10px]">
              FastAPI Core Online
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white font-sans tracking-tight">
            Autonomous Replication Interception & Quarantine Defense
          </h2>
          <p className="text-slate-400 text-xs">
            Spawns strictly bounded, harmless synthetic worker threads in a controlled sandbox to test autonomous thread interception, signature blacklisting, and quarantine containment.
          </p>
        </div>

        {/* Sentinel Mode Switch */}
        <div className="flex items-center gap-3 bg-black/60 p-3 rounded-xl border border-white/10">
          <div className="space-y-0.5 text-right">
            <div className="text-[11px] font-bold text-white flex items-center gap-1 justify-end">
              <Radio className={`w-3.5 h-3.5 ${status.sentinel_enabled ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
              Real-Time Sentinel
            </div>
            <div className="text-[10px] text-slate-400">
              {status.sentinel_enabled ? "Auto-Interception ON" : "Manual Mode Only"}
            </div>
          </div>
          <button
            onClick={() => handleToggleSentinel(!status.sentinel_enabled)}
            className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
              status.sentinel_enabled 
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30" 
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            {status.sentinel_enabled ? "ENABLED" : "DISABLED"}
          </button>
        </div>
      </div>

      {/* Critical Detection Verdict Alert Banner */}
      {activeBanner && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950 via-red-900/60 to-black border-2 border-red-500 shadow-2xl shadow-red-950/80 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-600/50">
                <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-500 text-white font-black text-[10px] tracking-wider uppercase">
                    DEFENSE VERDICT ISSUED
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {activeBanner.timestamp || new Date().toISOString()}
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-sans tracking-wide">
                  "{activeBanner.verdict || "This is a replicating attack and I have banned it and I have put it in this specific space."}"
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeBanner.incident_id && onNavigate && (
                <button
                  onClick={() => onNavigate("incident")}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/30 hover:bg-red-500/50 border border-red-400/50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Incident #{activeBanner.incident_id}
                </button>
              )}
            </div>
          </div>

          {/* Forensic Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/60 p-3.5 rounded-xl border border-red-500/30 text-[11px]">
            <div>
              <span className="text-slate-400 text-[10px] block">TERMINATED TARGET:</span>
              <span className="text-rose-300 font-bold">{activeBanner.terminated_thread || "Worker Thread"}</span>
              <span className="text-slate-500 block text-[9px]">Status: FORCIBLY STOPPED</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">BANNED SIGNATURE:</span>
              <span className="text-amber-300 font-bold">{activeBanner.banned_signature || "RAGSEC-REPLICATING-PROBE-SIG-B74A"}</span>
              <span className="text-slate-500 block text-[9px]">Blacklisted in EDR Memory</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">RELOCATION SPACE:</span>
              <span className="text-emerald-300 font-bold">.quarantine Enclave</span>
              <span className="text-slate-500 block text-[9px]">{activeBanner.quarantined_count || 0} Artifacts Isolated</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">MITIGATION STATUS:</span>
              <span className="text-cyan-300 font-bold">CONTAINED & AUDITED</span>
              <span className="text-slate-500 block text-[9px]">Logged to SHA-256 Ledger</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Controls & Live Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Replicator Control Console (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-[#090D18] border border-white/10 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Controlled Replicator Parameters</h3>
              </div>
              <span className="text-[10px] text-slate-400">Strict Safety Limits</span>
            </div>

            {/* Slider 1: Max Replicas */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Replication Hard Cap Limit:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  {maxReplicas} Replicas Max
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={maxReplicas}
                onChange={(e) => setMaxReplicas(parseInt(e.target.value, 10))}
                disabled={status.is_running}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Thread automatically stops after reaching this limit without harming system memory.
              </p>
            </div>

            {/* Slider 2: Interval */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Spawning Delay (Interval):</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  {intervalSeconds}s / step
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.2"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(parseFloat(e.target.value))}
                disabled={status.is_running}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Paces file generation so real-time detection can be observed.
              </p>
            </div>

            {/* Action Buttons Deck */}
            <div className="pt-2 flex flex-col gap-2.5">
              {!status.is_running ? (
                <button
                  onClick={handleLaunchReplicator}
                  disabled={loadingAction === "launching"}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer transition-all text-xs"
                >
                  {loadingAction === "launching" ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                  Launch Controlled Replicator (Harmless Thread)
                </button>
              ) : (
                <button
                  onClick={handleStopReplicator}
                  disabled={loadingAction === "stopping"}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 border border-white/20 cursor-pointer transition-all text-xs"
                >
                  <Square className="w-4 h-4 fill-white" />
                  Stop Replicator Thread Manually
                </button>
              )}

              <button
                onClick={handleScanAndMitigate}
                disabled={loadingAction === "mitigating"}
                className="w-full py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all text-xs"
              >
                {loadingAction === "mitigating" ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Zap className="w-4 h-4 text-cyan-400" />
                )}
                Scan & Mitigate Active Threats (Manual Trigger)
              </button>
            </div>

            {/* Thread State Indicators */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Thread Status:</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  status.thread_status === "RUNNING" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse" :
                  status.thread_status === "STOPPED_BY_DEFENSE" ? "bg-red-500/20 text-red-300 border border-red-500/40" :
                  "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {status.thread_status}
                </span>
              </div>
              {status.thread_id && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Thread ID:</span>
                  <span className="text-cyan-300 font-mono">{status.thread_id}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Replication Progress:</span>
                <span className="text-white font-bold">{status.current_generation} / {status.max_replicas || maxReplicas}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, ((status.current_generation || 0) / (status.max_replicas || maxReplicas || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Banned Attacks Blacklist Card */}
          <div className="p-5 rounded-2xl bg-[#090D18] border border-white/10 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                <h3 className="font-bold text-white text-sm">Banned Threat Blacklist</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30 text-[10px]">
                {status.banned_threat_count} BANNED
              </span>
            </div>

            {status.banned_threads && status.banned_threads.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {status.banned_threads.map((b: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-red-500/20 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-300">{b.thread_id}</span>
                      <span className="text-[10px] text-slate-500">{new Date(b.banned_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Reason: <strong className="text-slate-200">{b.reason}</strong>
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">
                      Sig: {b.signature}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-[11px]">
                No active threats have been banned yet. Launch a replicator to test active banning.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Controlled Sandbox & Quarantine Table (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Controlled Sandbox State */}
          <div className="p-5 rounded-2xl bg-[#090D18] border border-white/10 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Controlled Space (`replication_sandbox`)</h3>
              </div>
              <span className="text-slate-400 text-[11px]">
                {status.sandbox_file_count || 0} active files in sandbox
              </span>
            </div>

            <div className="space-y-2">
              {status.sandbox_files && status.sandbox_files.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {status.sandbox_files.map((file: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-amber-500/30 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                            REPLICA NODE
                          </span>
                          <span className="font-bold text-white">{file.filename}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Size: {file.size_bytes} bytes | Modified: {new Date(file.modified_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold px-2 py-1 rounded bg-amber-950/40 border border-amber-500/20">
                        MONITORED
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-black/30 border border-dashed border-white/10 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="text-slate-300 text-xs font-bold">Controlled Sandbox is Clean</p>
                  <p className="text-slate-500 text-[11px]">
                    No unauthorized replica files present. Launch the test to generate replicas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Specific Quarantine Enclave (.quarantine) */}
          <div className="p-5 rounded-2xl bg-[#090D18] border border-white/10 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Specific Quarantine Space (`.quarantine`)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[10px]">
                  {status.quarantined_replica_count || 0} QUARANTINED
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              When RAGSec detects the replicating attack, it moves the replica files into this isolated enclave and revokes permissions.
            </p>

            {status.quarantined_replicas && status.quarantined_replicas.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {status.quarantined_replicas.map((q: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                          ISOLATED TOMBSTONE
                        </span>
                        <span className="font-bold text-white text-[11px] truncate max-w-xs">{q.filename}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {q.filepath}
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-bold px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/20 flex-shrink-0">
                      CONTAINED
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-black/30 border border-dashed border-white/10 text-center space-y-2">
                <Lock className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-slate-400 text-xs">Quarantine Enclave Empty for Replicas</p>
                <p className="text-slate-500 text-[11px]">
                  Run a replication test and trigger mitigation to watch files move here.
                </p>
              </div>
            )}

            {/* Recovery & Purge Controls */}
            {status.quarantined_replica_count > 0 && (
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  onClick={handleRestoreReplicas}
                  disabled={loadingAction === "restoring"}
                  className="px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Recovers the test incident replica files from quarantine"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Recover / Restore Test Files
                </button>

                <button
                  onClick={handlePurgeReplicas}
                  disabled={loadingAction === "purging"}
                  className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Permanently removes test replicas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Purge Quarantined Files
                </button>
              </div>
            )}
          </div>

          {/* Interconnected SOC Workflow Hub */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Interconnected SOC Workflow Navigation
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => onNavigate && onNavigate("incident")}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left space-y-1 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Incident Triage
                </div>
                <div className="text-[9px] text-slate-500">Inspect full incident & playbooks</div>
              </button>

              <button
                onClick={() => onNavigate && onNavigate("mitigation")}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left space-y-1 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <Zap className="w-3.5 h-3.5" />
                  Threat Mitigation
                </div>
                <div className="text-[9px] text-slate-500">Review executed countermeasures</div>
              </button>

              <button
                onClick={() => onNavigate && onNavigate("fleet")}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left space-y-1 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Fleet & FIM
                </div>
                <div className="text-[9px] text-slate-500">Live file integrity telemetry</div>
              </button>

              <button
                onClick={() => onNavigate && onNavigate("test_reports")}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left space-y-1 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Audit Ledger
                </div>
                <div className="text-[9px] text-slate-500">Cryptographic SHA-256 chain</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
