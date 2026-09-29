import React, { useState } from "react";
import { useSOC } from "../context/SOCContext";
import { SecurityEvent } from "../types/soc";
import { SeverityBadge, CategoryTag } from "../components/Badges";
import {
  Radio,
  Filter,
  Search,
  ArrowRight,
  Cpu,
  FileSearch,
  Check,
  AlertTriangle
} from "lucide-react";

export const SecurityEvents: React.FC = () => {
  const { events, navigateTo, setSelectedEventId, setTargetAnalysisPath } = useSOC();
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const filteredEvents = events.filter(e => {
    if (filterSource !== "ALL" && e.source_type !== filterSource) return false;
    if (filterSeverity !== "ALL") {
      const sev = (typeof e.severity === "string" ? e.severity : (e.severity as any)?.value || "").toUpperCase();
      if (sev !== filterSeverity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <div className="editorial-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-black" />
          <span className="font-serif font-bold text-sm text-black uppercase tracking-wider">Security Telemetry Ingestion</span>
          <span className="text-[#64748B]">({filteredEvents.length} Events)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#64748B]">Source:</span>
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-md px-3 py-1 text-black text-xs font-mono focus:outline-none focus:border-black"
            >
              <option value="ALL">All Sources</option>
              <option value="FIM">FIM (File Integrity)</option>
              <option value="IDS">IDS (Network)</option>
              <option value="Syslog">Syslog / Host</option>
              <option value="DEMO">Demo Ingest</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#64748B]">Severity:</span>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-md px-3 py-1 text-black text-xs font-mono focus:outline-none focus:border-black"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Split View: Events Table + Event Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table (2 Cols) */}
        <div className="lg:col-span-2 editorial-card p-4 space-y-3 bg-white">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Device</th>
                  <th>Raw Message</th>
                  <th>Severity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(evt => {
                  const isSelected = selectedEvent?.id === evt.id;

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-neutral-100 font-medium" : ""
                      }`}
                    >
                      <td className="font-mono text-[#64748B] whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="font-mono font-bold text-black">{evt.source_type}</td>
                      <td className="font-mono text-[#334155] whitespace-nowrap">{evt.device_id}</td>
                      <td className="max-w-xs truncate text-[#1E293B]">{evt.raw_message}</td>
                      <td><SeverityBadge severity={evt.severity} /></td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="font-mono text-xs text-black font-semibold hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Event Detail Inspector (1 Col) */}
        <div className="editorial-card p-5 space-y-4 bg-white font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <h3 className="font-serif font-bold text-base text-black uppercase tracking-wide">Event Inspector</h3>
            {selectedEvent && (
              <span className="text-[11px] text-[#64748B] font-bold">{selectedEvent.id}</span>
            )}
          </div>

          {!selectedEvent ? (
            <div className="p-8 text-center text-[#94A3B8] font-sans text-xs">
              Select any telemetry event from the table to view raw payloads, canonical entities, and triggered indicators.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase tracking-wider mb-1">Raw Telemetry Payload</span>
                <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-black text-xs font-mono break-all leading-relaxed">
                  {selectedEvent.raw_message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase">Engine</span>
                  <span className="text-black font-bold">{selectedEvent.source_type}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase">Subnet</span>
                  <span className="text-black">{selectedEvent.network_id}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase">Target Host</span>
                  <button
                    onClick={() => navigateTo("fleet", selectedEvent.device_id)}
                    className="text-black font-bold underline"
                  >
                    {selectedEvent.device_id}
                  </button>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase">Timestamp</span>
                  <span className="text-[#334155]">{new Date(selectedEvent.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {selectedEvent.canonical && (
                <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-1.5 text-xs">
                  <span className="text-black font-serif font-bold block mb-1">Canonical FIM Attributes</span>
                  {selectedEvent.canonical.file_path && (
                    <div className="truncate text-[#334155]">
                      <span className="text-[#64748B]">Path: </span>
                      {selectedEvent.canonical.file_path}
                    </div>
                  )}
                  {selectedEvent.canonical.process_name && (
                    <div className="text-[#334155]">
                      <span className="text-[#64748B]">Process: </span>
                      {selectedEvent.canonical.process_name}
                    </div>
                  )}
                  {selectedEvent.canonical.user && (
                    <div className="text-[#334155]">
                      <span className="text-[#64748B]">User: </span>
                      {selectedEvent.canonical.user}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 space-y-2">
                {selectedEvent.canonical?.file_path && (
                  <button
                    onClick={() => {
                      setTargetAnalysisPath(selectedEvent.canonical?.file_path || null);
                      navigateTo("analyzer", selectedEvent.canonical?.file_path);
                    }}
                    className="w-full btn-black py-2"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Run Static Threat Analysis</span>
                  </button>
                )}

                <button
                  onClick={() => navigateTo("incidents")}
                  className="w-full btn-white py-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>View Correlated Incidents</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SecurityEvents;
