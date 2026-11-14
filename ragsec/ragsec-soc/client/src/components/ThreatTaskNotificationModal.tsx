import React, { useState } from "react";
import { 
  AlertOctagon, 
  ShieldAlert, 
  Lock, 
  Eye, 
  VolumeX, 
  X, 
  CheckCircle2, 
  Cpu, 
  Clock, 
  HardDrive,
  FileCode2,
  Terminal,
  Zap,
  ArrowRight,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { FileCRUDEvent } from "../types";

const API_BASE_URL = "http://127.0.0.1:8000";

interface ThreatTaskNotificationModalProps {
  threat: FileCRUDEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onQuarantined?: (filePath: string) => void;
  onIgnored?: (filePath: string) => void;
  onInspect?: (threat: FileCRUDEvent) => void;
}

export const ThreatTaskNotificationModal: React.FC<ThreatTaskNotificationModalProps> = ({
  threat,
  isOpen,
  onClose,
  onQuarantined,
  onIgnored,
  onInspect
}) => {
  const [activeTab, setActiveTab] = useState<"QUARANTINE" | "IGNORE" | "INSPECT">("QUARANTINE");
  const [ignoreDuration, setIgnoreDuration] = useState<"permanent" | "temporary">("permanent");
  const [ignoreReason, setIgnoreReason] = useState<string>("Analyst verified testing artifact");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !threat) return null;

  const handleQuarantine = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/quarantine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: threat.file_path,
          filePath: threat.file_path,
          event_id: threat.id,
          eventId: threat.id
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        toast.success(`Threat Quarantined: ${threat.file_name} isolated in secure enclave.`);
        if (onQuarantined) onQuarantined(threat.file_path);
        onClose();
      } else {
        toast.error(`Quarantine failed: ${data.detail || "Server error"}`);
      }
    } catch (err: any) {
      toast.error(`Quarantine error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIgnore = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/ignore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: threat.file_path,
          filePath: threat.file_path,
          event_id: threat.id,
          eventId: threat.id,
          duration: ignoreDuration,
          reason: ignoreReason
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        toast.info(`Threat Ignored: Alert for ${threat.file_name} suppressed (${ignoreDuration}).`);
        if (onIgnored) onIgnored(threat.file_path);
        onClose();
      } else {
        toast.error("Ignore request failed.");
      }
    } catch (err: any) {
      toast.error(`Ignore error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInspect = () => {
    if (onInspect) {
      onInspect(threat);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0E121D] border border-white/15 shadow-2xl p-6 space-y-5 text-white font-mono">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  PRIORITY SECURITY TASK
                </span>
                <span className="text-[10px] text-slate-500">{threat.timestamp}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-1 apple-display tracking-tight">
                {threat.file_name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors apple-button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Threat Summary Metadata Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Category</span>
            <span className="text-rose-300 font-semibold">{threat.category}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Severity</span>
            <span className="text-rose-400 font-bold">{threat.severity || "HIGH"}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Confidence</span>
            <span className="text-white font-bold">{threat.confidence || 95}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Origin Process</span>
            <span className="text-cyan-300 font-mono truncate block">{threat.process_name || "kernel_watcher"}</span>
          </div>
        </div>

        {/* Rationale Notice */}
        {threat.reasons && threat.reasons.length > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Trigger Rationale</span>
            <p className="leading-relaxed font-sans">{threat.reasons[0]}</p>
          </div>
        )}

        {/* Segmented Action Tabs */}
        <div className="space-y-4">
          <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => setActiveTab("QUARANTINE")}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "QUARANTINE"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Quarantine</span>
            </button>
            <button
              onClick={() => setActiveTab("IGNORE")}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "IGNORE"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Ignore</span>
            </button>
            <button
              onClick={() => setActiveTab("INSPECT")}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "INSPECT"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
          </div>

          {/* Tab 1: Quarantine */}
          {activeTab === "QUARANTINE" && (
            <div className="space-y-3.5 animate-fadeIn">
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Immediately strips process execution permissions and isolates the file in the secure 
                <code className="text-cyan-300 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 mx-1 font-mono">
                  monitored_workspace/.quarantine/
                </code> 
                enclave. An immutable cryptographic record is recorded in the SQLite audit chain.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs apple-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuarantine}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2 apple-button transition-all shadow-md disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Quarantining..." : "Confirm Quarantine"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Ignore Threat */}
          {activeTab === "IGNORE" && (
            <div className="space-y-3.5 animate-fadeIn">
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Suppresses alerts for this specific artifact from the live feed and adds an exclusion rule to the local FIM whitelist.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                    Suppression Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIgnoreDuration("permanent")}
                      className={`p-2.5 rounded-xl border text-left transition-all apple-button ${
                        ignoreDuration === "permanent"
                          ? "bg-blue-500/20 border-blue-500/40 text-white font-bold"
                          : "bg-black/30 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="text-xs">Permanent Whitelist</div>
                      <div className="text-[10px] text-slate-400">Do not alert again</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIgnoreDuration("temporary")}
                      className={`p-2.5 rounded-xl border text-left transition-all apple-button ${
                        ignoreDuration === "temporary"
                          ? "bg-blue-500/20 border-blue-500/40 text-white font-bold"
                          : "bg-black/30 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="text-xs">Temporary (1 Hour)</div>
                      <div className="text-[10px] text-slate-400">Auto-expires after 60 min</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Analyst Justification
                  </label>
                  <input
                    type="text"
                    value={ignoreReason}
                    onChange={(e) => setIgnoreReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs font-sans"
                    placeholder="e.g. Authorized developer simulation"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs apple-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIgnore}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 apple-button transition-all shadow-md disabled:opacity-50"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Applying..." : "Suppress Alert"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Inspect */}
          {activeTab === "INSPECT" && (
            <div className="space-y-3.5 animate-fadeIn">
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Inspect full static source code, Shannon byte entropy, and behavioral AST indicators in the Monitored Workspace Explorer.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs apple-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInspect}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 apple-button transition-all shadow-md"
                >
                  <span>Open in Code Explorer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreatTaskNotificationModal;
