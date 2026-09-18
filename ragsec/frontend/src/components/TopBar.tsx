import React, { useState, useEffect } from "react";
import { Page, BackendStatus } from "../types";
import { ragsecApi } from "../services/api";
import { 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Bell, 
  Search, 
  Lock,
  RefreshCw
} from "lucide-react";

interface TopBarProps {
  currentPage: Page;
  onSearchClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ currentPage, onSearchClick }) => {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [emergencyLock, setEmergencyLock] = useState(false);

  const pageTitles: Record<Page, { title: string; subtitle: string }> = {
    dashboard: {
      title: "SOC Command Center Overview",
      subtitle: "Real-time threat matrix, FIM activity, and core health metrics"
    },
    knowledge: {
      title: "RAGSec Threat Intelligence Hub",
      subtitle: "IEEE vector retrieval, CTI document ingestion, and semantic analysis"
    },
    fleet: {
      title: "Fleet & File Integrity Monitor",
      subtitle: "Real-time filesystem watcher, quarantined artifacts, and process audit"
    },
    incident: {
      title: "Incident Triage & Response",
      subtitle: "Active threats, prompt injection guards, and containment timeline"
    },
    mitigation: {
      title: "Mitigation & Governance Rules",
      subtitle: "Automated IP blocking, quarantine policies, and containment triggers"
    }
  };

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await ragsecApi.getHealth();
      setStatus(res);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentMeta = pageTitles[currentPage];

  return (
    <header className="h-16 border-b border-white/10 bg-[#080C14]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
      {/* Page Info */}
      <div>
        <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
          {currentMeta.title}
        </h2>
        <p className="text-xs text-slate-400">{currentMeta.subtitle}</p>
      </div>

      {/* Actions & Status Pills */}
      <div className="flex items-center gap-3">
        {/* Search trigger */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/40 text-xs text-slate-300 transition-all font-mono"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span>Search Threat Intel...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400">⌘K</kbd>
        </button>

        {/* Backend Connection Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono">
          {status ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">CONNECTED</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400">STANDBY / RECONNECTING</span>
            </>
          )}
          <button 
            onClick={checkHealth}
            disabled={loading}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all"
            title="Refresh Status"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>

        {/* Emergency Lock Toggle */}
        <button
          onClick={() => setEmergencyLock(!emergencyLock)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md ${
            emergencyLock
              ? "bg-rose-600/30 text-rose-300 border-rose-500 critical-glow"
              : "bg-white/5 text-slate-300 border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          {emergencyLock ? "LOCKDOWN ACTIVE" : "EMERGENCY LOCK"}
        </button>

        {/* Alert Bell */}
        <div className="relative">
          <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-400 transition-all">
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-black" />
        </div>

        {/* SOC Analyst Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold font-mono text-xs text-white border border-blue-400/40">
            SOC
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
