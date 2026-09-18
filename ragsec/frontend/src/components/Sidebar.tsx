import React from "react";
import { Page } from "../types";
import { 
  LayoutDashboard, 
  BrainCircuit, 
  ShieldAlert, 
  AlertTriangle, 
  Zap, 
  ShieldCheck,
  Terminal,
  Activity
} from "lucide-react";

interface SidebarProps {
  currentPage: Page;
  onSelectPage: (page: Page) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage }) => {
  const navItems = [
    {
      id: "dashboard" as Page,
      label: "SOC Dashboard",
      icon: LayoutDashboard,
      badge: "LIVE"
    },
    {
      id: "knowledge" as Page,
      label: "Threat Intelligence",
      icon: BrainCircuit,
      badge: "RAGSec"
    },
    {
      id: "fleet" as Page,
      label: "Fleet & FIM Monitor",
      icon: ShieldAlert,
      badge: "ACTIVE"
    },
    {
      id: "incident" as Page,
      label: "Incident Triage",
      icon: AlertTriangle,
      badge: "3 ALERT"
    },
    {
      id: "mitigation" as Page,
      label: "Mitigation Rules",
      icon: Zap,
      badge: "AUTO"
    }
  ];

  return (
    <aside className="w-64 h-screen bg-[#070A12] border-r border-white/10 flex flex-col flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold tracking-wider text-white text-lg font-mono">RAGSec</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono">
              v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">IEEE Threat Core</p>
        </div>
      </div>

      {/* Real-time Status Card */}
      <div className="mx-4 my-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-3">
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-cyan-400 pulse-dot" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
            <span>FIM Engine</span>
            <span className="text-[10px] text-emerald-400">NORMAL</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">Workspace Monitored</p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono tracking-wider text-slate-400 uppercase">
          Command Center
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    item.id === "incident"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : isActive
                      ? "bg-cyan-500/30 text-cyan-200"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className="p-4 border-t border-white/10 text-xs text-slate-400 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Backend API:
          </span>
          <span className="text-emerald-400 font-semibold">127.0.0.1:8000</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Vector Engine:
          </span>
          <span className="text-cyan-400 font-semibold">ChromaDB</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
