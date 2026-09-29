import React from "react";
import { useSOC } from "../context/SOCContext";
import { NavCategory, NavSubTab } from "../types/soc";
import {
  LayoutDashboard,
  Radio,
  Bell,
  AlertTriangle,
  Server,
  FileSearch,
  Cpu,
  Brain,
  Database,
  Search,
  ShieldCheck,
  BookOpen,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Play,
  Bookmark,
  FileCode2,
  Bot,
  ClipboardCheck,
  Award,
  Network,
  Zap,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface SubItem {
  id: NavSubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  isLive?: boolean;
}

interface NavSection {
  category: NavCategory;
  label: string;
  items: SubItem[];
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    expandedCategories,
    toggleCategory,
    navigateTo,
    incidents,
    devices,
    events,
    auditTrail
  } = useSOC();

  const criticalIncidentCount = incidents.filter(
    i => (typeof i.threat_classification?.severity === "string" ? i.threat_classification.severity : i.threat_classification?.severity?.value || "").toLowerCase() === "critical"
  ).length || 14;

  const suspiciousEventCount = events.filter(e => e.is_suspicious).length || 21;

  const sections: NavSection[] = [
    {
      category: "OVERVIEW",
      label: "OVERVIEW",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "demo", label: "Scenario Controller", icon: Sparkles, badge: "10-Step" }
      ]
    },
    {
      category: "OPERATIONS",
      label: "OPERATIONS",
      items: [
        { id: "events", label: "Security Events", icon: Radio, badge: suspiciousEventCount },
        { id: "alerts", label: "Active Alerts", icon: Bell, badge: 3 },
        { id: "incidents", label: "Active Incidents", icon: AlertTriangle, badge: criticalIncidentCount },
        { id: "fleet", label: "Fleet & Topology", icon: Server },
        { id: "fim", label: "FIM Monitor", icon: FileSearch, isLive: true },
        { id: "analyzer", label: "Alert Analyzer", icon: Cpu },
        { id: "code_explorer", label: "Code & Hex Explorer", icon: FileCode2 }
      ]
    },
    {
      category: "INTELLIGENCE",
      label: "INTELLIGENCE",
      items: [
        { id: "investigation", label: "Threat Investigation", icon: Brain, badge: "RAG" },
        { id: "knowledge", label: "Knowledge Base", icon: Database },
        { id: "autonomous_tester", label: "Autonomous Tester", icon: Bot, badge: "P8" },
        { id: "test_reports", label: "Test Reports & Audits", icon: ClipboardCheck },
        { id: "search", label: "Global Search", icon: Search }
      ]
    },
    {
      category: "RESPONSE",
      label: "RESPONSE",
      items: [
        { id: "mitigation", label: "Mitigation Center", icon: ShieldCheck, badge: "HitL" },
        { id: "mitigation_rules", label: "Mitigation Rules", icon: Zap },
        { id: "playbooks", label: "Playbooks", icon: BookOpen }
      ]
    },
    {
      category: "SYSTEM",
      label: "SYSTEM",
      items: [
        { id: "governance", label: "Governance Lab", icon: ShieldAlert, badge: "IEEE" },
        { id: "sps_benchmark", label: "SPS Benchmark", icon: Award },
        { id: "siem", label: "SIEM Gateway", icon: Network },
        { id: "audit", label: "Audit Logs", icon: History },
        { id: "settings", label: "Settings", icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 h-screen bg-[#F4F6F8] border-r border-[#E5E7EB] flex flex-col flex-shrink-0 select-none text-[#1E293B]">
      {/* Brand Header */}
      <div className="p-6 pb-5">
        <h1 className="font-bold text-2xl text-black tracking-tight leading-none">
          RAGSec
        </h1>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] block mt-1.5">
          Threat Intelligence
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {sections.map(sec => {
          const isExpanded = expandedCategories[sec.category] !== false;

          return (
            <div key={sec.category} className="space-y-1">
              {/* Category Header */}
              {sec.category === "OVERVIEW" ? (
                <div>
                  <button
                    onClick={() => navigateTo("overview")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "overview"
                        ? "bg-[#E2E8F0] text-black font-bold shadow-2xs"
                        : "text-[#475569] hover:text-black hover:bg-neutral-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4 text-[#334155]" />
                      <span>Overview</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
                    {sec.label}
                  </div>

                  <div className="space-y-0.5">
                    {sec.items.map(item => {
                      const isActive = activeTab === item.id;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          onClick={() => navigateTo(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all ${
                            isActive
                              ? "bg-[#E2E8F0] text-black font-bold shadow-2xs"
                              : "text-[#475569] hover:text-black hover:bg-neutral-200/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-black" : "text-[#64748B]"}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.isLive ? (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Live</span>
                            </span>
                          ) : item.badge !== undefined ? (
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-neutral-200/80 text-[#475569] font-semibold">
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom FastAPI Core Box */}
      <div className="p-4">
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-black">FastAPI Core</span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Online</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-[#64748B] flex items-center justify-between">
            <a href="http://127.0.0.1:8000" target="_blank" rel="noreferrer" className="hover:text-black flex items-center gap-1">
              <span>http://127.0.0.1:8000</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="text-[10px] font-mono text-[#94A3B8]">
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="hover:text-black">
              Docs /docs ↗
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
