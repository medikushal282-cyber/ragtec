import React, { useState } from "react";
import { useSOC } from "../context/SOCContext";
import { Incident } from "../types/soc";
import { SeverityBadge, StatusBadge, CategoryTag } from "../components/Badges";
import {
  AlertTriangle,
  Brain,
  ShieldCheck,
  Server,
  ArrowRight,
  Clock,
  Layers,
  Radio,
  Lock,
  ChevronRight
} from "lucide-react";

export const ActiveIncidents: React.FC = () => {
  const { incidents, selectedIncidentId, setSelectedIncidentId, navigateTo } = useSOC();

  const activeInc = incidents.find(i => i.id === selectedIncidentId) || incidents[0] || {
    id: "INC-2026-001",
    network_id: "NET-CORP-01",
    affected_device_ids: ["WS-ANALYST-104"],
    events: [],
    threat_classification: {
      category: "Malware",
      severity: "CRITICAL",
      confidence: 96,
      indicators: ["High-entropy binary created", "PowerShell Base64 execution", "PE Header anomalies"]
    },
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: "Cobalt Strike Stage 1 Loader & Lateral Movement Precursor",
    description: "Multi-stage adversary attack chain observed on host WS-ANALYST-104. File creation in workspace root coupled with discovery commands."
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="editorial-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-black" />
          <span className="font-serif font-bold text-sm text-black uppercase tracking-wider">Incident Triage & Management</span>
          <span className="text-[#64748B]">({incidents.length || 1} Active Incident)</span>
        </div>

        <div className="text-xs text-[#64748B]">
          Priority SLA: <strong className="text-black font-semibold">&lt; 15 mins (Critical)</strong>
        </div>
      </div>

      {/* Split Incident Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Col: Incident Queue List */}
        <div className="editorial-card p-4 space-y-3 bg-white">
          <span className="text-xs font-serif font-bold uppercase text-black block pb-2 border-b border-[#E5E7EB]">
            Incident Queue
          </span>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {incidents.map(inc => {
              const isSelected = (inc.id === activeInc.id);
              const sev = inc.threat_classification?.severity || "HIGH";
              const cat = inc.threat_classification?.category || "Malware";

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-black text-white border-black shadow-md"
                      : "bg-[#F8F9FA] border-[#E5E7EB] hover:border-black text-[#1E293B]"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className={`font-bold ${isSelected ? "text-white" : "text-black"}`}>{inc.id}</span>
                    <SeverityBadge severity={sev} />
                  </div>

                  <p className={`text-xs font-serif font-bold line-clamp-1 ${isSelected ? "text-white" : "text-black"}`}>
                    {inc.title || `${cat} Escalation`}
                  </p>

                  <div className={`flex items-center justify-between font-mono text-[10px] pt-1 ${isSelected ? "text-neutral-300" : "text-[#64748B]"}`}>
                    <span>Host: {inc.affected_device_ids?.[0] || "WS-ANALYST-104"}</span>
                    <StatusBadge status={inc.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Selected Incident Deep Dive */}
        <div className="lg:col-span-2 editorial-card p-6 space-y-5 bg-white">
          {/* Incident Top Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base font-bold font-mono text-black">{activeInc.id}</span>
                <CategoryTag category={activeInc.threat_classification?.category || "Malware"} />
                <SeverityBadge severity={activeInc.threat_classification?.severity || "CRITICAL"} />
                <StatusBadge status={activeInc.status} />
              </div>
              <h2 className="text-lg font-serif font-bold text-black">{activeInc.title}</h2>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo("mitigation", activeInc.id)}
                className="btn-white text-xs py-2 px-3"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span>Mitigate</span>
              </button>

              <button
                onClick={() => navigateTo("investigation", activeInc.id)}
                className="btn-black text-xs py-2 px-4"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>AI RAG Investigation</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>

          {/* Description & Overview */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#334155] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold block">Incident Overview</span>
            <p className="leading-relaxed font-sans">
              {activeInc.description || "Adversary execution observed in workspace environment. Suspicious artifacts identified and awaiting triage containment."}
            </p>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase">Target Host</span>
              <button
                onClick={() => navigateTo("fleet", activeInc.affected_device_ids?.[0])}
                className="text-black font-bold hover:underline"
              >
                {activeInc.affected_device_ids?.[0] || "WS-ANALYST-104"}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase">Subnet</span>
              <span className="text-black font-semibold">{activeInc.network_id || "NET-CORP-01"}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase">Confidence</span>
              <span className="text-black font-serif font-bold text-sm">
                {activeInc.threat_classification?.confidence || 96}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase">Recorded</span>
              <span className="text-[#334155]">{new Date(activeInc.created_at).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Incident Timeline */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-serif font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-black" />
              Telemetry Event Timeline
            </h3>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-start gap-3">
                <span className="text-black font-bold text-[11px] whitespace-nowrap">00:00:15</span>
                <div className="text-xs font-sans">
                  <strong className="text-black font-mono">FIM_FILE_CREATED: </strong>
                  <span className="text-[#334155]">Binary dropped in workspace root: <code className="text-black font-mono font-semibold">monitored_workspace/malware_simulation.exe</code></span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-start gap-3">
                <span className="text-black font-bold text-[11px] whitespace-nowrap">00:01:20</span>
                <div className="text-xs font-sans">
                  <strong className="text-black font-mono">STATIC_ANALYZER_FLAG: </strong>
                  <span className="text-[#334155]">Shannon entropy 7.84 and PE UPX packer signature identified. Classified as Cobalt Strike loader.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-start gap-3">
                <span className="text-black font-bold text-[11px] whitespace-nowrap">00:02:45</span>
                <div className="text-xs font-sans">
                  <strong className="text-black font-mono">PROCESS_EXECUTION: </strong>
                  <span className="text-[#334155]">PowerShell executed with Base64 payload targeting Win32_UserAccount discovery.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ActiveIncidents;
