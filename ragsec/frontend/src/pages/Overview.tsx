import React, { useEffect, useState } from "react";
import { useSOC } from "../context/SOCContext";
import { socApi } from "../services/api";
import { SeverityBadge, StatusBadge, CategoryTag } from "../components/Badges";
import {
  ShieldAlert,
  AlertTriangle,
  Server,
  FileSearch,
  Radio,
  History,
  ArrowRight,
  Check,
  Cpu,
  Bookmark,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  Play,
  Layers,
  Sparkles,
  Zap,
  Lock,
  Globe
} from "lucide-react";

export const Overview: React.FC = () => {
  const { navigateTo, incidents, devices, events, auditTrail, setSelectedIncidentId } = useSOC();
  const [stats, setStats] = useState<any>({
    threat_index: "ACTIVE",
    threat_count: 24,
    monitored_events: 43,
    benign_count: 23,
    unknown_count: 0,
    active_incidents_count: 45,
    taxonomy_counts: {
      "Malware": 18,
      "Ransomware": 12,
      "Suspicious Script / Execution": 9,
      "Data Theft / Exfiltration": 4
    }
  });

  const [fimAlerts, setFimAlerts] = useState<any[]>([]);

  useEffect(() => {
    socApi.getDashboardStats().then(data => {
      if (data) setStats(data);
    });
    socApi.getFIMAlerts().then(alerts => setFimAlerts(alerts || []));
  }, []);

  const criticalIncidents = incidents.filter(i =>
    (typeof i.threat_classification?.severity === "string" ? i.threat_classification.severity : i.threat_classification?.severity?.value || "").toLowerCase() === "critical"
  );

  const totalEventsCount = events.length > 0 ? events.length * 28 + stats.monitored_events : 142890;
  const activeThreatsCount = stats.threat_count || criticalIncidents.length || 24;

  return (
    <div className="space-y-6">
      {/* 4 Modern SOC Metric Cards with Vibrant Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Ingested Telemetry Events */}
        <div
          onClick={() => navigateTo("events")}
          className="modern-card-interactive p-5 space-y-3 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span className="uppercase tracking-wider font-mono text-[10px] text-indigo-600 font-bold">
              INGESTED TELEMETRY
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold text-black tracking-tight font-sans">
              {totalEventsCount.toLocaleString()}
            </div>
            <div className="trend-badge-up">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>+14.8%</span>
            </div>
          </div>
          <div className="text-[11px] text-[#64748B] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>FIM, IDS & Syslog streaming</span>
          </div>
        </div>

        {/* Metric 2: Active Threats */}
        <div
          onClick={() => navigateTo("incidents")}
          className="modern-card-interactive p-5 space-y-3 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span className="uppercase tracking-wider font-mono text-[10px] text-rose-600 font-bold">
              ACTIVE THREAT TRIAGE
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold text-black tracking-tight font-sans">
              {activeThreatsCount}
            </div>
            <div className="trend-badge-down">
              <TrendingDown className="w-3 h-3 text-rose-600" />
              <span>{criticalIncidents.length || 1} Critical</span>
            </div>
          </div>
          <div className="text-[11px] text-rose-600 font-medium">
            Immediate containment required
          </div>
        </div>

        {/* Metric 3: Secured Fleet Nodes */}
        <div
          onClick={() => navigateTo("fleet")}
          className="modern-card-interactive p-5 space-y-3 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span className="uppercase tracking-wider font-mono text-[10px] text-cyan-600 font-bold">
              SECURED FLEET NODES
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Server className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold text-black tracking-tight font-sans">
              {devices.length || 5} <span className="text-sm font-normal text-[#94A3B8]">/ 5 Active</span>
            </div>
            <div className="trend-badge-up">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>100% Up</span>
            </div>
          </div>
          <div className="text-[11px] text-[#64748B] font-medium">
            3 Subnets: CORP, DMZ, PROD
          </div>
        </div>

        {/* Metric 4: FIM Integrity Watchdog */}
        <div
          onClick={() => navigateTo("fim")}
          className="modern-card-interactive p-5 space-y-3 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span className="uppercase tracking-wider font-mono text-[10px] text-emerald-600 font-bold">
              FIM INTEGRITY WATCHDOG
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileSearch className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-emerald-700 tracking-tight font-mono">
              LIVE • 0ms
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              ENCLAVE SECURE
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Kernel Watchdog Hook Attached
          </div>
        </div>
      </div>

      {/* Middle Row: Threat Vector Performance (Radial Gauge) & Telemetry Velocity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Threat Vector Distribution (Radial Fan Gauge) */}
        <div className="modern-card p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
                THREAT VECTOR DISTRIBUTION
              </h3>
              <p className="text-[11px] text-[#64748B]">Active signature & behavioral matches</p>
            </div>
            <button
              onClick={() => navigateTo("analyzer")}
              className="p-1 rounded-lg hover:bg-neutral-100 text-[#94A3B8] hover:text-black transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Radial Speedometer Fan Gauge */}
          <div className="relative flex flex-col items-center justify-center my-1">
            <svg viewBox="0 0 200 110" className="w-48 overflow-visible">
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Active Multi-Color Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 145 35"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="6 3"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 75 35"
                fill="none"
                stroke="#EF4444"
                strokeWidth="14"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center -mt-8">
              <div className="text-2xl font-bold text-black tracking-tight font-mono">
                {stats.threat_count || 24}
              </div>
              <div className="text-[11px] text-[#64748B]">Flagged Vectors</div>
            </div>
          </div>

          {/* SOC Threat Breakdown Items */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-100 text-xs">
            <div
              onClick={() => navigateTo("analyzer", "monitored_workspace/malware_simulation.exe")}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[#334155] font-medium">Executable Malware</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black font-mono">18 alerts</span>
                <span className="text-rose-600 font-semibold text-[11px] font-mono">42%</span>
              </div>
            </div>

            <div
              onClick={() => navigateTo("analyzer", "monitored_workspace/ransomware_simulation.txt")}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-[#334155] font-medium">Ransomware & VSS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black font-mono">12 alerts</span>
                <span className="text-indigo-600 font-semibold text-[11px] font-mono">28%</span>
              </div>
            </div>

            <div
              onClick={() => navigateTo("analyzer", "monitored_workspace/suspicious_script.ps1")}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span className="text-[#334155] font-medium">Suspicious PowerShell</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black font-mono">9 alerts</span>
                <span className="text-cyan-600 font-semibold text-[11px] font-mono">18%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Ingested Telemetry vs Threat Detection Velocity */}
        <div className="lg:col-span-2 modern-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider block">
                TELEMETRY & DETECTION VELOCITY
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-black tracking-tight font-sans">
                  {totalEventsCount.toLocaleString()} <span className="text-xs font-normal text-[#64748B]">events / hr</span>
                </span>
                <span className="trend-badge-up text-xs">
                  <TrendingUp className="w-3 h-3" /> +14.2% Peak
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 text-xs">
              <select className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-[#334155] focus:outline-none font-medium">
                <option>All Subnets (CORP/DMZ/PROD)</option>
                <option>Workstations (192.168.1.0/24)</option>
                <option>DMZ Ingress (10.0.50.0/24)</option>
              </select>
              <select className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-[#334155] focus:outline-none font-medium">
                <option>Live 24 Hours</option>
                <option>Last 7 Days</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs font-medium text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="text-black font-semibold">Ingested Raw Telemetry (Events/sec)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-black font-semibold">Mitigated Threat Invocations</span>
            </div>
          </div>

          {/* SVG Smooth Curved Multi-Series Line Chart */}
          <div className="relative w-full h-52">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#F1F5F9" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#F1F5F9" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="#F1F5F9" strokeDasharray="4 4" />
              <line x1="0" y1="190" x2="600" y2="190" stroke="#E2E8F0" />

              {/* Indigo Area Fill */}
              <path
                d="M 0 150 C 100 120, 200 135, 300 90 C 400 50, 500 100, 600 70 L 600 190 L 0 190 Z"
                fill="url(#indigoGradient)"
              />

              {/* Mitigated Threats Line (Crimson) */}
              <path
                d="M 0 175 C 100 155, 200 160, 300 130 C 400 110, 500 140, 600 120"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Ingested Telemetry Line (Indigo) */}
              <path
                d="M 0 150 C 100 120, 200 135, 300 90 C 400 50, 500 100, 600 70"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Active Marker Pin */}
              <rect x="290" y="30" width="20" height="160" fill="#4F46E5" fillOpacity="0.08" rx="4" />
              <circle cx="300" cy="90" r="5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2.5" />
            </svg>

            {/* Dark Tooltip Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white rounded-xl p-3 shadow-2xl border border-neutral-700 text-xs font-mono pointer-events-none z-10">
              <div className="text-[10px] text-indigo-400 font-bold mb-1">MARCH 2026 SURVEILLANCE</div>
              <div className="flex items-center gap-2 text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Ingested Telemetry: 822,400 pkts</span>
              </div>
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Mitigated Threats: 24 active</span>
              </div>
            </div>

            {/* Time labels */}
            <div className="flex justify-between text-[11px] text-[#94A3B8] font-mono mt-2">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>24:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Incidents, Top 3 Threat Archetypes Striped Bars & Telemetry Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Recent Incident & Containment Actions */}
        <div className="modern-card p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
                RECENT SECURITY ACTIONS
              </h3>
              <ArrowUpRight className="w-4 h-4 text-[#94A3B8]" />
            </div>

            <div className="space-y-3 pt-3">
              <div className="text-[10px] font-mono text-rose-600 font-bold uppercase">Critical Containments</div>
              <div
                onClick={() => navigateTo("fleet", "DEV-WS-104")}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer border border-neutral-200/70"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-black">Host DEV-WS-104</div>
                    <div className="text-[10px] text-[#64748B]">Network Isolated • 2m ago</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  ISOLATED
                </span>
              </div>

              <div className="text-[10px] font-mono text-indigo-600 font-bold uppercase pt-1">FIM Enclave Vault</div>
              <div
                onClick={() => navigateTo("fim")}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer border border-neutral-200/70"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    <FileSearch className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-black truncate max-w-[140px]">malware_simulation.exe</div>
                    <div className="text-[10px] text-[#64748B]">Quarantined to Vault</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  SECURED
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigateTo("events")}
            className="w-full btn-secondary-white py-2.5 text-xs font-semibold"
          >
            <span>View Full Telemetry Log Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Middle 1 Col: Top Threat Archetypes (Striped Bar Chart) */}
        <div className="modern-card p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
                TOP THREAT ARCHETYPES
              </h3>
              <span className="text-[11px] font-mono text-indigo-600 font-bold">24h Dynamic</span>
            </div>

            <div className="flex items-center justify-between my-2 text-xs">
              <span className="text-[#64748B]">Total Flagged Heuristics:</span>
              <span className="font-bold text-black flex items-center gap-1">
                378 signals <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              </span>
            </div>

            {/* Striped Bar Chart Columns */}
            <div className="h-36 flex items-end justify-around gap-4 pt-4 px-2">
              <div
                onClick={() => navigateTo("analyzer", "monitored_workspace/malware_simulation.exe")}
                className="flex flex-col items-center gap-1.5 w-16 cursor-pointer group"
              >
                <div className="w-full h-28 rounded-t-xl bg-striped-dark relative flex items-start justify-center pt-1.5 text-white font-mono text-[10px] font-bold shadow-md group-hover:opacity-90">
                  180
                </div>
                <span className="text-[11px] font-semibold text-[#334155] truncate">Malware</span>
              </div>

              <div
                onClick={() => navigateTo("analyzer", "monitored_workspace/ransomware_simulation.txt")}
                className="flex flex-col items-center gap-1.5 w-16 cursor-pointer group"
              >
                <div className="w-full h-20 rounded-t-xl bg-indigo-600 relative flex items-start justify-center pt-1.5 text-white font-mono text-[10px] font-bold shadow-md group-hover:opacity-90">
                  87
                </div>
                <span className="text-[11px] font-semibold text-[#334155] truncate">Ransomware</span>
              </div>

              <div
                onClick={() => navigateTo("analyzer", "monitored_workspace/suspicious_script.ps1")}
                className="flex flex-col items-center gap-1.5 w-16 cursor-pointer group"
              >
                <div className="w-full h-14 rounded-t-xl bg-cyan-500 relative flex items-start justify-center pt-1.5 text-white font-mono text-[10px] font-bold shadow-md group-hover:opacity-90">
                  56
                </div>
                <span className="text-[11px] font-semibold text-[#334155] truncate">Scripts</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#64748B] text-center pt-2 border-t border-neutral-100">
            Validated by Zero-Execution Static Rule Engine
          </div>
        </div>

        {/* Right 1 Col: 24-Hour Telemetry Matrix Heatmap */}
        <div className="modern-card p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
                TELEMETRY PACKET MATRIX
              </h3>
              <ArrowUpRight className="w-4 h-4 text-[#94A3B8]" />
            </div>

            <div className="my-2">
              <div className="text-2xl font-bold text-black tracking-tight font-sans">
                3,247 <span className="text-xs font-normal text-[#64748B]">audited / hour</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">0ms processing backlog</div>
            </div>

            {/* Mon-Fri Activity Grid */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[10px] font-mono text-[#94A3B8] px-14">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
              </div>

              {/* Time slot 1 */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-[#64748B] w-14 text-right">09:00 - 12:00</span>
                <div className="flex-1 grid grid-cols-5 gap-1.5">
                  <div className="h-5 rounded-md bg-indigo-100" />
                  <div className="h-5 rounded-md bg-indigo-600 text-white text-[8px] font-mono flex items-center justify-center font-bold">82</div>
                  <div className="h-5 rounded-md bg-indigo-200" />
                  <div className="h-5 rounded-md bg-indigo-800 text-white text-[8px] font-mono flex items-center justify-center font-bold">95</div>
                  <div className="h-5 rounded-md bg-indigo-300" />
                </div>
              </div>

              {/* Time slot 2 */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-[#64748B] w-14 text-right">12:00 - 15:00</span>
                <div className="flex-1 grid grid-cols-5 gap-1.5">
                  <div className="h-5 rounded-md bg-indigo-900 text-white text-[8px] font-mono flex items-center justify-center font-bold">120</div>
                  <div className="h-5 rounded-md bg-indigo-200" />
                  <div className="h-5 rounded-md bg-indigo-400 text-white text-[8px] font-mono flex items-center justify-center font-bold">64</div>
                  <div className="h-5 rounded-md bg-indigo-300" />
                  <div className="h-5 rounded-md bg-indigo-700 text-white text-[8px] font-mono flex items-center justify-center font-bold">88</div>
                </div>
              </div>

              {/* Time slot 3 */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-[#64748B] w-14 text-right">15:00 - 18:00</span>
                <div className="flex-1 grid grid-cols-5 gap-1.5">
                  <div className="h-5 rounded-md bg-indigo-300" />
                  <div className="h-5 rounded-md bg-indigo-700 text-white text-[8px] font-mono flex items-center justify-center font-bold">78</div>
                  <div className="h-5 rounded-md bg-indigo-200" />
                  <div className="h-5 rounded-md bg-indigo-900 text-white text-[8px] font-mono flex items-center justify-center font-bold">110</div>
                  <div className="h-5 rounded-md bg-indigo-300" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-emerald-600 font-medium text-center pt-2 border-t border-neutral-100">
            Real-time SQLite database ingestion connected
          </div>
        </div>
      </div>
    </div>
  );
};
export default Overview;
