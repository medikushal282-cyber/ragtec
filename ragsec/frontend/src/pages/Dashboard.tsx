import React, { useEffect, useState } from "react";
import { ragsecApi } from "../services/api";
import { FIMEvent, SOCIncident, SOCAlert } from "../types";
import { 
  ShieldAlert, 
  Activity, 
  Database, 
  Clock, 
  AlertOctagon, 
  FileCheck2, 
  Zap, 
  CheckCircle2, 
  ChevronRight,
  ExternalLink,
  Flame
} from "lucide-react";

interface DashboardProps {
  onNavigatePage?: (page: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigatePage }) => {
  const [fimEvents, setFimEvents] = useState<FIMEvent[]>([]);
  const [incidents, setIncidents] = useState<SOCIncident[]>([]);
  const [alerts, setAlerts] = useState<SOCAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [fimData, incData, altData] = await Promise.all([
          ragsecApi.getFIMEvents(),
          ragsecApi.getIncidents(),
          ragsecApi.getAlerts()
        ]);
        setFimEvents(fimData);
        setIncidents(incData);
        setAlerts(altData);
      } catch (err) {
        console.error("Dashboard error loading data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const criticalCount = incidents.filter(i => i.severity === "critical").length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Critical */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-black border border-rose-500/40 flex items-center justify-between shadow-lg shadow-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-200 font-mono flex items-center gap-2">
                CRITICAL THREAT INCIDENT DETECTED
              </h3>
              <p className="text-xs text-rose-300/80">
                {criticalCount} active critical incident(s) requiring immediate containment action.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigatePage && onNavigatePage("incident")}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            Open Incident Triage <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Threat Score */}
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase">System Threat Index</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">ELEVATED</span>
            <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
              LVL 4/5
            </span>
          </div>
          <p className="text-[11px] text-slate-400">FIM modified monitored_workspace shadow key</p>
        </div>

        {/* Card 2: FIM Integrity Score */}
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase">FIM Integrity Score</span>
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">98.4%</span>
            <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">
              WATCHER ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-400">1 file quarantined in real-time</p>
        </div>

        {/* Card 3: Vector Knowledge Store */}
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase">Vector Chunks Indexed</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">1,420</span>
            <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
              IEEE RAG
            </span>
          </div>
          <p className="text-[11px] text-slate-400">ChromaDB store online</p>
        </div>

        {/* Card 4: Retrieval Latency */}
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase">Avg Query Latency</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">42 ms</span>
            <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30">
              FAST
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Vector similarity reranking latency</p>
        </div>
      </div>

      {/* Main Content Layout: Live FIM Feed & Incidents Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live FIM Integrity Log (2 Columns wide) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base font-mono">Live File Integrity Watcher Feed</h3>
            </div>
            <button 
              onClick={() => onNavigatePage && onNavigatePage("fleet")}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
            >
              View All FIM Logs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {fimEvents.map((evt) => (
              <div 
                key={evt.id} 
                className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                      evt.event_type === "modified" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                      evt.event_type === "created" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                      "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}>
                      {evt.event_type}
                    </span>
                    <span className="text-xs font-mono text-white font-semibold truncate max-w-md">
                      {evt.file_path}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                    <span>User: <strong className="text-slate-300">{evt.user || "SYSTEM"}</strong></span>
                    <span>Process: <strong className="text-slate-300">{evt.process_name || "unknown"}</strong></span>
                    <span>Hash: <code className="text-cyan-400">{evt.file_hash?.substring(0, 10)}...</code></span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  {evt.quarantined ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold">
                      QUARANTINED
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">Score: {evt.threat_score}</span>
                  )}
                  <div className="text-[10px] text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: SOC Alerts & Active Incidents */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base font-mono">SOC Alert Stream</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">
                {alerts.length} ALERTS
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alt) => (
                <div key={alt.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{alt.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                      alt.severity === "critical" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {alt.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">{alt.details}</p>
                  <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Source: {alt.source}</span>
                    <span>{new Date(alt.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Button */}
          <button 
            onClick={() => onNavigatePage && onNavigatePage("knowledge")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20"
          >
            <Zap className="w-4 h-4" />
            Query RAGSec Vector Store
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
