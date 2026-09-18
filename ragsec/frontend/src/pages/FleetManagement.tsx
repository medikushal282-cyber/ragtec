import React, { useEffect, useState } from "react";
import { ragsecApi } from "../services/api";
import { FIMEvent, QuarantinedFile } from "../types";
import { 
  ShieldAlert, 
  FileCheck2, 
  Trash2, 
  RefreshCw, 
  FolderLock, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Lock,
  Unlock,
  Eye
} from "lucide-react";

export const FleetManagement: React.FC = () => {
  const [fimEvents, setFimEvents] = useState<FIMEvent[]>([]);
  const [quarantined, setQuarantined] = useState<QuarantinedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [events, qFiles] = await Promise.all([
        ragsecApi.getFIMEvents(),
        ragsecApi.getQuarantinedFiles()
      ]);
      setFimEvents(events);
      setQuarantined(qFiles);
    } catch (e) {
      console.error("Fleet data error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            File Integrity Monitoring & Endpoint Fleet
          </h3>
          <p className="text-xs text-slate-400">
            Real-time filesystem change detector watching <code className="text-cyan-400 font-mono">monitored_workspace/</code>
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          Refresh FIM Logs
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {actionMessage}
        </div>
      )}

      {/* Monitored Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SOC-NODE-01 (LOCAL)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            192.168.1.104
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Watcher: FIMWatcher (watchdog thread)</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>QUARANTINE VAULT</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">1 FILE HELD</span>
          </div>
          <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-rose-400" />
            .quarantine/
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Quarantine Isolation Enforced</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>HASH ALGORITHM</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">SHA-256</span>
          </div>
          <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Real-time Hashing
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Canonical File Hash Lock</p>
        </div>
      </div>

      {/* Quarantined Files Inspector */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-rose-400" />
            <h4 className="font-bold text-white text-base font-mono">Quarantined Artifact Inspector</h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
            {quarantined.length} CONTAINED
          </span>
        </div>

        {quarantined.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs font-mono">
            No files currently in quarantine vault.
          </div>
        ) : (
          <div className="space-y-3">
            {quarantined.map((q) => (
              <div key={q.id} className="p-4 rounded-xl bg-black/40 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      {q.original_path}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Isolated to: <code className="text-rose-300">{q.quarantine_path}</code>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {(q.size_bytes / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="text-xs text-rose-200/90 font-sans bg-rose-950/30 p-3 rounded-lg border border-rose-500/20">
                  <strong>Quarantine Reason:</strong> {q.reason}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => handleAction(`Restored ${q.original_path} to workspace.`)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-all"
                  >
                    <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                    Restore File
                  </button>
                  <button
                    onClick={() => handleAction(`Permanently erased quarantined artifact ${q.id}.`)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FIM Event Stream Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-cyan-400" />
            <h4 className="font-bold text-white text-base font-mono">Filesystem Event History</h4>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono text-slate-400 uppercase">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Target File Path</th>
                <th className="py-2.5 px-3">File Hash</th>
                <th className="py-2.5 px-3">Threat Score</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono text-slate-300">
              {fimEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-white/5 transition-all">
                  <td className="py-3 px-3 text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      evt.event_type === "modified" ? "bg-amber-500/20 text-amber-400" :
                      evt.event_type === "created" ? "bg-cyan-500/20 text-cyan-400" : "bg-rose-500/20 text-rose-400"
                    }`}>
                      {evt.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-white font-bold">{evt.file_path}</td>
                  <td className="py-3 px-3 text-cyan-400 font-mono">{evt.file_hash?.substring(0, 12)}...</td>
                  <td className="py-3 px-3">
                    <span className={evt.threat_score > 70 ? "text-rose-400 font-bold" : "text-slate-300"}>
                      {evt.threat_score}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {evt.quarantined ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1 text-[10px]">
                        <Lock className="w-3 h-3" /> QUARANTINED
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[10px]">PASSED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FleetManagement;
