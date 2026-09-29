import React, { useEffect, useState } from "react";
import { useSOC } from "../context/SOCContext";
import { socApi } from "../services/api";
import { SeverityBadge, StatusBadge } from "../components/Badges";
import {
  FileSearch,
  FolderLock,
  RefreshCw,
  Trash2,
  Check,
  Lock,
  Unlock,
  ShieldAlert,
  ArrowRight,
  HardDrive,
  Clock,
  Eye,
  Cpu
} from "lucide-react";

export const FIMMonitor: React.FC = () => {
  const { navigateTo, setTargetAnalysisPath } = useSOC();
  const [fimEvents, setFimEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadFIMData = async () => {
    setLoading(true);
    try {
      const [events, alerts] = await Promise.all([
        socApi.getFIMEvents(),
        socApi.getFIMAlerts()
      ]);
      setFimEvents(events || []);
    } catch (e) {
      console.error("Error loading FIM:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFIMData();
  }, []);

  const handleQuarantine = async (filePath: string, eventId?: string) => {
    try {
      await socApi.quarantineFile(filePath, eventId);
      setActionSuccessMessage(`Successfully quarantined "${filePath}" into .quarantine/ enclave.`);
      loadFIMData();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (e) {
      console.error("Quarantine error:", e);
    }
  };

  const handleRestore = async (quarantinePath: string, originalPath?: string) => {
    try {
      await socApi.restoreFile(quarantinePath, originalPath);
      setActionSuccessMessage(`Successfully restored file from quarantine enclave.`);
      loadFIMData();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (e) {
      console.error("Restore error:", e);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="editorial-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <FileSearch className="w-4 h-4 text-black" />
          <span className="font-serif font-bold text-sm text-black uppercase tracking-wider">File Integrity Monitoring (FIM)</span>
          <span className="text-[#64748B]">• Watching <code className="text-black font-bold">monitored_workspace/</code></span>
        </div>

        <button
          onClick={loadFIMData}
          disabled={loading}
          className="btn-white py-1 px-3 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Watcher</span>
        </button>
      </div>

      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-neutral-900 text-white text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Surveillance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="editorial-card p-4 space-y-1.5 bg-white border-l-4 border-l-black">
          <span className="text-[#64748B] text-[10px] uppercase tracking-wider">Monitored Root</span>
          <div className="font-serif font-bold text-black text-base truncate">./monitored_workspace</div>
          <span className="text-black font-semibold text-[11px]">Watcher active (watchdog thread)</span>
        </div>

        <div className="editorial-card p-4 space-y-1.5 bg-white border-l-4 border-l-black">
          <span className="text-[#64748B] text-[10px] uppercase tracking-wider">Detected CRUD Events</span>
          <div className="font-serif font-bold text-black text-base">{fimEvents.length} Recorded</div>
          <span className="text-[#64748B] text-[11px]">Real-time SHA256 hashes generated</span>
        </div>

        <div className="editorial-card p-4 space-y-1.5 bg-white border-l-4 border-l-black">
          <span className="text-[#64748B] text-[10px] uppercase tracking-wider">Quarantine Enclave</span>
          <div className="font-serif font-bold text-black text-base">Isolated Vault (.quarantine/)</div>
          <span className="text-[#64748B] text-[11px]">Privilege stripped & tombstoned</span>
        </div>
      </div>

      {/* FIM Events Stream Table */}
      <div className="editorial-card p-5 space-y-3 bg-white">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] font-mono text-xs">
          <h3 className="font-serif font-bold text-base text-black uppercase tracking-wide flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-black" />
            Filesystem CRUD Activity Stream
          </h3>
          <span className="text-[#64748B]">Total: {fimEvents.length} Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operation</th>
                <th>File Path</th>
                <th>Process / User</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fimEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#94A3B8] font-mono">
                    No anomalous FIM events in stream. Watching for modifications...
                  </td>
                </tr>
              ) : (
                fimEvents.map((evt, idx) => {
                  const c = evt.canonical || {};
                  const fp = c.file_path || evt.raw_message || "unknown_path";
                  const action = c.action || "CREATED";
                  const isQuarantined = evt.status === "QUARANTINED" || c.is_quarantined;
                  const riskScore = c.risk_score || (evt.is_suspicious ? 90 : 20);

                  return (
                    <tr key={evt.id || idx}>
                      <td className="font-mono text-[#64748B] whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="font-mono font-bold text-black">{action}</td>
                      <td className="font-mono text-[#1E293B] truncate max-w-xs">{fp}</td>
                      <td className="font-mono text-[#64748B] text-xs truncate">
                        {c.process_name || "cmd.exe"} ({c.user || "SYSTEM"})
                      </td>
                      <td className="font-mono">
                        <span className="font-serif font-bold text-black text-xs">
                          {riskScore} / 100
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={isQuarantined ? "QUARANTINED" : "ACTIVE"} />
                      </td>
                      <td>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <button
                            onClick={() => {
                              setTargetAnalysisPath(fp);
                              navigateTo("analyzer", fp);
                            }}
                            className="btn-white text-[11px] py-1 px-2.5"
                            title="Run Static Analysis"
                          >
                            <Cpu className="w-3 h-3" />
                            <span>Analyze</span>
                          </button>

                          {!isQuarantined ? (
                            <button
                              onClick={() => handleQuarantine(fp, evt.id)}
                              className="btn-black text-[11px] py-1 px-2.5"
                              title="Isolate File to Quarantine"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Quarantine</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(c.quarantine_path || fp, fp)}
                              className="btn-white text-[11px] py-1 px-2.5"
                              title="Restore from Quarantine"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default FIMMonitor;
