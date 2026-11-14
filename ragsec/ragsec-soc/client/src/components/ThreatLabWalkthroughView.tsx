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
  Cpu,
  Activity,
  CheckCircle2,
  Layers,
  ArrowRight,
  ExternalLink,
  FileText,
  Zap,
  Info,
  Clock,
  Terminal,
  ChevronRight,
  XCircle,
  HardDrive,
  Eye,
  Check
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "http://127.0.0.1:8000";

interface ThreatLabSample {
  id: string;
  name: string;
  description: string;
  mitre_technique: string;
  behavior_type: string;
  hard_limits: {
    max_runtime_seconds: number;
    max_files: number;
    max_bytes: number;
  };
}

interface TimelineStep {
  step: number;
  title: string;
  timestamp: string;
  status: string;
  detail: string;
}

interface TestRunState {
  test_id: string;
  sample_id: string;
  sample_name: string;
  description: string;
  mitre_technique: string;
  behavior_type: string;
  hard_limits: {
    max_runtime_seconds: number;
    max_files: number;
    max_bytes: number;
  };
  pid: number | null;
  child_pids: number[];
  status: "RUNNING" | "COMPLETED" | "LIMIT_REACHED" | "STOPPED_BY_USER" | "ERROR";
  start_epoch: number;
  started_at: string;
  ended_at: string | null;
  runtime_seconds: number;
  files_created_count: number;
  bytes_written: number;
  safety_failsafe_triggered: boolean;
  safety_reason: string | null;
  detection_result: {
    threat_name: string;
    category: string;
    severity: string;
    confidence: number;
    rule_fired: string;
    evidence: string[];
  } | null;
  incident_id: string | null;
  verified_stopped: boolean;
  manual_stop_instruction: string | null;
  timeline: TimelineStep[];
  error?: string;
}

interface ThreatLabWalkthroughViewProps {
  onNavigate?: (page: string) => void;
}

export const ThreatLabWalkthroughView: React.FC<ThreatLabWalkthroughViewProps> = ({ onNavigate }) => {
  const [catalog, setCatalog] = useState<ThreatLabSample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("replication_sim");
  const [activeTest, setActiveTest] = useState<TestRunState | null>(null);
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  // Fetch catalog on mount
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/threat-lab/catalog`);
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
        if (data.length > 0 && !selectedSampleId) {
          setSelectedSampleId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load Threat Lab catalog", err);
    }
  };

  // Poll status while test is RUNNING
  useEffect(() => {
    if (!activeTest || activeTest.status !== "RUNNING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/threat-lab/status/${activeTest.test_id}`);
        if (res.ok) {
          const updated = await res.json();
          setActiveTest(updated);
          if (updated.status !== "RUNNING") {
            clearInterval(interval);
            if (updated.status === "COMPLETED") {
              toast.success(`Simulation ${updated.test_id} concluded and verified safely.`);
            } else if (updated.status === "LIMIT_REACHED") {
              toast.warning(`Safety limit reached for ${updated.test_id}. Supervisor contained test.`);
            } else if (updated.status === "STOPPED_BY_USER") {
              toast.info(`Process tree halted manually for ${updated.test_id}.`);
            }
          }
        }
      } catch (err) {
        console.error("Status poll error", err);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [activeTest?.test_id, activeTest?.status]);

  // Launch Sample
  const handleLaunchSample = async (sampleId: string) => {
    if (activeTest && activeTest.status === "RUNNING") {
      toast.error("Another simulation is actively running. Wait or stop it first to maintain test isolation.");
      return;
    }

    setIsLaunching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/threat-lab/run/${sampleId}`, {
        method: "POST"
      });
      if (res.ok) {
        const initialRun: TestRunState = await res.json();
        setActiveTest(initialRun);
        toast.info(`Launched ${initialRun.sample_name} (PID: ${initialRun.pid || "Spawning..."})`);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to launch simulation.");
      }
    } catch (err: any) {
      toast.error(`Launch failed: ${err.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  // Stop Test Manually
  const handleStopTest = async () => {
    if (!activeTest) return;

    setIsStopping(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/threat-lab/stop/${activeTest.test_id}`, {
        method: "POST"
      });
      if (res.ok) {
        const stopRes = await res.json();
        toast.success(`Stopped test ${stopRes.test_id}. Verified process death: ${stopRes.verified_stopped}`);
        // Fetch latest status
        const stRes = await fetch(`${API_BASE_URL}/api/threat-lab/status/${activeTest.test_id}`);
        if (stRes.ok) {
          setActiveTest(await stRes.json());
        }
      } else {
        toast.error("Failed to stop test.");
      }
    } catch (err: any) {
      toast.error(`Stop failed: ${err.message}`);
    } finally {
      setIsStopping(false);
    }
  };

  // Clean Workspace
  const handleCleanWorkspace = async () => {
    setIsCleaning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/threat-lab/clean`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Threat Lab workspace cleaned successfully.");
      }
    } catch (err: any) {
      toast.error(`Clean failed: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const selectedSample = catalog.find((s) => s.id === selectedSampleId);

  const getStatusColor = (st: string) => {
    switch (st) {
      case "RUNNING":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "LIMIT_REACHED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "STOPPED_BY_USER":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "ERROR":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getStepBadgeColor = (stepStatus: string) => {
    switch (stepStatus) {
      case "ACTIVE":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "COMPLETED":
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
      case "DETECTED":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "CLASSIFIED":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      case "INCIDENT_CREATED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "VERIFIED_CONTAINED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "PASSED_WITH_EVIDENCE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "SAFETY_LIMIT_REACHED":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "STOPPED_MANUALLY":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      default:
        return "bg-white/10 text-white border-white/20";
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="apple-panel p-6 relative overflow-hidden bg-gradient-to-r from-blue-950/20 via-indigo-950/10 to-slate-950/20 border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
              <Flame className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">
                  Controlled Threat Simulation & Detection Lab
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-medium border border-blue-500/20">
                  SANDBOX ENCLAVE
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Execute bounded, individually runnable threat behaviors inside <code>monitored_workspace/threat_lab/</code> with independent kernel failsafes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCleanWorkspace}
              disabled={isCleaning || (activeTest?.status === "RUNNING")}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white flex items-center gap-1.5 apple-button transition-all"
              title="Clean lab workspace temporary files"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Clean Workspace</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Independent Supervisor Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sample Catalog & Test Walkthrough */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sample Selector Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="apple-panel p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Test Sample Catalog ({catalog.length})
              </span>
              <span className="text-[10px] text-[#8E8E93] font-mono">1 AT A TIME</span>
            </div>

            <div className="space-y-2">
              {catalog.map((sample, idx) => {
                const isSelected = selectedSampleId === sample.id;
                const isRunningThis = activeTest?.sample_id === sample.id && activeTest.status === "RUNNING";

                return (
                  <div
                    key={sample.id}
                    onClick={() => setSelectedSampleId(sample.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group apple-button ${
                      isSelected
                        ? "bg-white/[0.08] border-blue-500/50 shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-white/[0.06] text-white flex items-center justify-center text-[10px] font-mono">
                          {idx + 1}
                        </span>
                        <h3 className="text-xs font-medium text-white group-hover:text-blue-300 transition-colors">
                          {sample.name}
                        </h3>
                      </div>
                      {isRunningThis && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#8E8E93] mt-1.5 leading-relaxed">
                      {sample.description}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04] text-[10px] font-mono text-slate-400">
                      <span className="text-blue-400">{sample.mitre_technique}</span>
                      <span>Cap: {sample.hard_limits.max_runtime_seconds}s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Details & Safety Guardrails Card */}
          {selectedSample && (
            <div className="apple-panel p-4 space-y-3.5 border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Deterministic Safety Envelope</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-[#8E8E93] block">Max Runtime</span>
                  <span className="text-xs font-mono font-medium text-white">
                    {selectedSample.hard_limits.max_runtime_seconds}s
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-[#8E8E93] block">Max Files</span>
                  <span className="text-xs font-mono font-medium text-white">
                    {selectedSample.hard_limits.max_files} files
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-[#8E8E93] block">Max Bytes</span>
                  <span className="text-xs font-mono font-medium text-white">
                    {selectedSample.hard_limits.max_bytes / 1024} KB
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleLaunchSample(selectedSample.id)}
                  disabled={isLaunching || (activeTest?.status === "RUNNING")}
                  className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 apple-button transition-all shadow-md ${
                    activeTest?.status === "RUNNING"
                      ? "bg-white/[0.04] text-slate-500 cursor-not-allowed border border-white/[0.06]"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {activeTest?.status === "RUNNING"
                      ? "Simulation in Progress..."
                      : `Run ${selectedSample.name}`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Simulation & 7-Step Chronological Walkthrough (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeTest ? (
            <>
              {/* Telemetry & Process Controller Header */}
              <div className="apple-panel p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-white tracking-tight">
                        {activeTest.sample_name}
                      </h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border ${getStatusColor(activeTest.status)}`}>
                        {activeTest.status}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#8E8E93]">
                      Test ID: {activeTest.test_id} • Technique: {activeTest.mitre_technique}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTest.status === "RUNNING" && (
                      <button
                        onClick={handleStopTest}
                        disabled={isStopping}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-medium flex items-center gap-1.5 apple-button transition-all"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>{isStopping ? "Halting Process..." : "Stop Process Tree"}</span>
                      </button>
                    )}

                    {activeTest.incident_id && (
                      <button
                        onClick={() => setSelectedEvidenceModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-white flex items-center gap-1.5 apple-button"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Inspect Evidence</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Process & Enclave Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                      <Cpu className="w-3 h-3 text-blue-400" />
                      <span>Monitored PID</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-white mt-1 block">
                      {activeTest.pid || "Spawning..."}
                    </span>
                    {activeTest.child_pids && activeTest.child_pids.length > 0 && (
                      <span className="text-[9px] font-mono text-slate-400 truncate block mt-0.5">
                        Children: {activeTest.child_pids.join(", ")}
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>Runtime</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-white mt-1 block">
                      {activeTest.runtime_seconds}s
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                      Max: {activeTest.hard_limits.max_runtime_seconds}s
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                      <FileText className="w-3 h-3 text-amber-400" />
                      <span>Files Created</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-white mt-1 block">
                      {activeTest.files_created_count} / {activeTest.hard_limits.max_files}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                      Enclave bounded
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Verified Stopped</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-white mt-1 block">
                      {activeTest.verified_stopped ? "Yes (Dead)" : (activeTest.status === "RUNNING" ? "Active" : "Verifying")}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                      OS process table checked
                    </span>
                  </div>
                </div>

                {/* Manual Fallback Instruction Notice */}
                {activeTest.manual_stop_instruction && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs text-[#8E8E93]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      <span>Emergency Manual OS Stop Fallback:</span>
                      <code className="text-[11px] font-mono text-blue-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                        {activeTest.manual_stop_instruction}
                      </code>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Containment Validated</span>
                  </div>
                )}
              </div>

              {/* Chronological 7-Step Timeline Card */}
              <div className="apple-panel p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Chronological 7-Step Walkthrough Timeline
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#8E8E93]">
                    Steps Completed: {activeTest.timeline.length} / 7
                  </span>
                </div>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-white/[0.06] before:z-0">
                  {activeTest.timeline.map((step) => (
                    <div
                      key={step.step}
                      className="relative z-10 flex items-start gap-3.5 pl-1 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#0D111A] border border-white/[0.12] flex items-center justify-center text-[10px] font-mono font-medium text-white shadow-sm flex-shrink-0 mt-0.5">
                        {step.step}
                      </div>

                      <div className="flex-1 p-3.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] transition-all space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-medium text-white">
                            {step.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.2 rounded-full font-mono font-medium border ${getStepBadgeColor(step.status)}`}>
                              {step.status}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {step.timestamp.split("T")[1]?.slice(0, 8)}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[#8E8E93] leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  ))}

                  {activeTest.status === "RUNNING" && (
                    <div className="relative z-10 flex items-center gap-3.5 pl-1 animate-pulse">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[10px] text-blue-400 font-mono">
                        ...
                      </div>
                      <div className="flex-1 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300">
                        Awaiting next observable event and telemetry correlation...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="apple-panel p-12 text-center space-y-3.5 border-dashed border-white/[0.08]">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
                <Play className="w-5 h-5 ml-0.5 fill-current opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">No Simulation Active</h3>
                <p className="text-xs text-[#8E8E93] max-w-md mx-auto leading-relaxed">
                  Select any harmless test sample from the catalog on the left and click <strong>Run</strong> to initiate the 7-step telemetry and verification walkthrough.
                </p>
              </div>
              <button
                onClick={() => selectedSample && handleLaunchSample(selectedSample.id)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium apple-button shadow-md shadow-blue-500/20"
              >
                Launch {selectedSample?.name || "Sample"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Inspection Modal */}
      {selectedEvidenceModal && activeTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="apple-panel max-w-xl w-full p-6 space-y-4 bg-[#0B0E17] border-white/[0.12] shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Evidence & Incident Dossier
                  </h3>
                  <span className="text-[10px] font-mono text-[#8E8E93]">
                    {activeTest.incident_id} • {activeTest.sample_name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvidenceModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {activeTest.detection_result && (
                <div className="space-y-2 p-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Classification Verdict:</span>
                    <span className="font-semibold text-white">
                      {activeTest.detection_result.threat_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Category / Severity:</span>
                    <span className="text-rose-400 font-mono font-medium">
                      {activeTest.detection_result.category} ({activeTest.detection_result.severity.toUpperCase()})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Rule Fired:</span>
                    <span className="text-blue-400 font-mono">
                      {activeTest.detection_result.rule_fired}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Deterministic Confidence:</span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      {(activeTest.detection_result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-white uppercase tracking-wider block">
                  Observed Artifacts & Evidence Items ({activeTest.detection_result?.evidence.length || 0})
                </span>
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-[11px] text-slate-300 space-y-1 max-h-36 overflow-y-auto">
                  {activeTest.detection_result?.evidence.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-blue-400">›</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>SQLite & Cryptographic Audit Verification</span>
                </div>
                <p className="text-emerald-400/80">
                  Incident <code>{activeTest.incident_id}</code> is committed to the SOC SQLite database and secured with SHA-256 cryptographic chaining in the immutable audit ledger.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
              {onNavigate && (
                <button
                  onClick={() => {
                    setSelectedEvidenceModal(false);
                    onNavigate("incident");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-medium apple-button"
                >
                  View in Incident Triage
                </button>
              )}
              <button
                onClick={() => setSelectedEvidenceModal(false)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium apple-button"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
