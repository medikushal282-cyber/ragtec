import React, { useState, useEffect } from "react";
import { ragsecApi } from "../services/api";
import { SOCIncident } from "../types";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Terminal, 
  Clock, 
  Server, 
  Flame, 
  Lock, 
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";

export const ActiveIncident: React.FC = () => {
  const [incidents, setIncidents] = useState<SOCIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SOCIncident | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [rcaGenerated, setRcaGenerated] = useState(false);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const data = await ragsecApi.getIncidents();
        setIncidents(data);
        if (data.length > 0) setSelectedIncident(data[0]);
      } catch (e) {
        console.error("Incident load error", e);
      }
    }
    fetchIncidents();
  }, []);

  const triggerContainment = (actionName: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog((prev) => [`[${timestamp}] Executed: ${actionName}`, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Active Security Incident Triage & RCA
          </h3>
          <p className="text-xs text-slate-400">
            Real-time containment workflow for adversarial breaches and FIM compromises
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold">
          HIGH-SEVERITY RESPONSE MODE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Selector List */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="font-bold text-white text-sm font-mono flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              Active Incident Queue
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
              {incidents.length} TOTAL
            </span>
          </div>

          <div className="space-y-2.5">
            {incidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedIncident?.id === inc.id
                    ? "bg-rose-950/40 border-rose-500/50 text-white shadow-lg shadow-rose-950/20"
                    : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-rose-400">{inc.id}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                    inc.severity === "critical" ? "bg-rose-500/30 text-rose-200" : "bg-amber-500/30 text-amber-200"
                  }`}>
                    {inc.severity}
                  </span>
                </div>
                <div className="text-xs font-bold font-sans text-white truncate">{inc.title}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-2 flex justify-between">
                  <span>Asset: {inc.affected_assets[0]}</span>
                  <span>{new Date(inc.timestamp).toLocaleTimeString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Incident Details & Containment (2 Columns) */}
        {selectedIncident && (
          <div className="lg:col-span-2 space-y-6">
            {/* Main Incident Card */}
            <div className="glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {selectedIncident.id}
                    </span>
                    <h3 className="text-base font-bold text-white font-mono">{selectedIncident.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedIncident.description}</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 font-bold">
                  {selectedIncident.status.toUpperCase()}
                </span>
              </div>

              {/* Asset & Mitigation pills */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px]">AFFECTED TARGET ASSETS</span>
                  <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    {selectedIncident.affected_assets.join(", ")}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px]">CONTAINMENT STATUS</span>
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {selectedIncident.mitigation_status}
                  </div>
                </div>
              </div>

              {/* Attack Chronological Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Chronological Attack Vector Progression
                </h4>

                <div className="space-y-2 border-l-2 border-cyan-500/30 pl-4 text-xs font-mono text-slate-300">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 absolute -left-[21px] top-1" />
                    <span className="text-slate-400">12:08:42</span> — FIM Watcher triggered modification alert on <code className="text-cyan-400">monitored_workspace/etc/shadow_backup.key</code>.
                  </div>
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-amber-400 absolute -left-[21px] top-1" />
                    <span className="text-slate-400">12:08:45</span> — High entropy file payload quarantined automatically by FIM engine.
                  </div>
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 absolute -left-[21px] top-1" />
                    <span className="text-slate-400">12:09:01</span> — Endpoint network interface isolated; security audit trail committed.
                  </div>
                </div>
              </div>

              {/* Containment Control Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap gap-3">
                <button
                  onClick={() => triggerContainment("Enforced FIM Lockdown on SOC-NODE-01")}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-rose-600/20"
                >
                  <Lock className="w-4 h-4" />
                  Enforce Node Lockdown
                </button>
                <button
                  onClick={() => triggerContainment("Purged Adversarial Vector Cache")}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Purge Vector Cache
                </button>
                <button
                  onClick={() => {
                    triggerContainment("Generated Root Cause Analysis (RCA) Document");
                    setRcaGenerated(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Generate RCA Report
                </button>
              </div>
            </div>

            {/* Action Log / RCA Report Container */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Incident Containment Audit Console
                </h4>
              </div>

              {rcaGenerated && (
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs font-mono space-y-2 text-cyan-200">
                  <div className="font-bold text-cyan-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    RAGSec Root Cause Analysis (RCA) Executive Summary
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    Initial attack vector: Local file modification on monitored workspace key file.
                    Mitigation: IEEE FIMWatcher successfully contained file alteration via sha256 checksum mismatch, moving file to isolation vault. No unauthorized outbound data exfiltration confirmed.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-slate-300 space-y-1.5 h-36 overflow-y-auto">
                <div className="text-slate-500">// SOC Interactive Containment Terminal</div>
                {actionLog.length === 0 ? (
                  <div className="text-slate-500 italic">No containment commands executed yet. Select an action above.</div>
                ) : (
                  actionLog.map((log, i) => (
                    <div key={i} className="text-cyan-300">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveIncident;
