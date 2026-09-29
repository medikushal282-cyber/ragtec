import React, { useState } from "react";
import { useSOC } from "../context/SOCContext";
import { SeverityBadge, CategoryTag, StatusBadge } from "../components/Badges";
import {
  Search,
  AlertTriangle,
  Radio,
  Server,
  FileText,
  ArrowRight,
  Database
} from "lucide-react";

export const GlobalSearch: React.FC = () => {
  const { searchQuery, setSearchQuery, incidents, devices, events, navigateTo, setSelectedIncidentId } = useSOC();
  const [localQuery, setLocalQuery] = useState<string>(searchQuery);

  const query = (localQuery || searchQuery).toLowerCase().trim();

  const matchingIncidents = query
    ? incidents.filter(i =>
        i.id.toLowerCase().includes(query) ||
        (i.title || "").toLowerCase().includes(query) ||
        (i.description || "").toLowerCase().includes(query)
      )
    : incidents;

  const matchingDevices = query
    ? devices.filter(d =>
        d.hostname.toLowerCase().includes(query) ||
        d.ip_address.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query) ||
        d.os.toLowerCase().includes(query)
      )
    : devices;

  const matchingEvents = query
    ? events.filter(e =>
        e.raw_message.toLowerCase().includes(query) ||
        e.device_id.toLowerCase().includes(query) ||
        e.source_type.toLowerCase().includes(query) ||
        (e.canonical?.file_path || "").toLowerCase().includes(query)
      )
    : events.slice(0, 8);

  return (
    <div className="space-y-5">
      {/* Search Input Bar */}
      <div className="editorial-card p-6 space-y-3 bg-white">
        <h2 className="font-serif font-bold text-xl text-black">Global Security Omni-Search</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={localQuery}
            onChange={e => {
              setLocalQuery(e.target.value);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search across all incidents, alerts, events, endpoints, IP addresses, hashes, and CTI..."
            className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-full pl-11 pr-5 py-3 text-sm text-black placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-black transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] pt-1">
          <span>Keywords:</span>
          <button onClick={() => { setLocalQuery("malware"); setSearchQuery("malware"); }} className="px-2.5 py-0.5 rounded-md bg-[#F8F9FA] border border-[#E5E7EB] text-black hover:border-black">malware</button>
          <button onClick={() => { setLocalQuery("powershell"); setSearchQuery("powershell"); }} className="px-2.5 py-0.5 rounded-md bg-[#F8F9FA] border border-[#E5E7EB] text-black hover:border-black">powershell</button>
          <button onClick={() => { setLocalQuery("192.168.1.104"); setSearchQuery("192.168.1.104"); }} className="px-2.5 py-0.5 rounded-md bg-[#F8F9FA] border border-[#E5E7EB] text-black hover:border-black">192.168.1.104</button>
          <button onClick={() => { setLocalQuery("ransomware"); setSearchQuery("ransomware"); }} className="px-2.5 py-0.5 rounded-md bg-[#F8F9FA] border border-[#E5E7EB] text-black hover:border-black">ransomware</button>
        </div>
      </div>

      {/* Matching Incidents */}
      {matchingIncidents.length > 0 && (
        <div className="editorial-card p-5 space-y-3 bg-white">
          <h3 className="font-serif font-bold text-base text-black uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-[#E5E7EB]">
            <AlertTriangle className="w-4 h-4 text-black" />
            Matching Incidents ({matchingIncidents.length})
          </h3>
          <div className="space-y-2">
            {matchingIncidents.map(inc => (
              <div
                key={inc.id}
                onClick={() => {
                  setSelectedIncidentId(inc.id);
                  navigateTo("incidents", inc.id);
                }}
                className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between hover:border-black transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs mb-1">
                    <span className="font-bold text-black">{inc.id}</span>
                    <SeverityBadge severity={inc.threat_classification?.severity || "HIGH"} />
                    <CategoryTag category={inc.threat_classification?.category || "Malware"} />
                  </div>
                  <p className="text-xs font-serif font-bold text-black">{inc.title}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#64748B]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching Devices */}
      {matchingDevices.length > 0 && (
        <div className="editorial-card p-5 space-y-3 bg-white">
          <h3 className="font-serif font-bold text-base text-black uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-[#E5E7EB]">
            <Server className="w-4 h-4 text-black" />
            Matching Fleet Endpoints ({matchingDevices.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matchingDevices.map(dev => (
              <div
                key={dev.id}
                onClick={() => navigateTo("fleet", dev.id)}
                className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between hover:border-black transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-serif font-bold text-sm text-black">{dev.hostname}</span>
                    <span className="text-[#64748B]">({dev.ip_address})</span>
                  </div>
                  <span className="text-xs text-[#64748B] font-mono">{dev.os}</span>
                </div>
                <StatusBadge status={dev.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching Telemetry Events */}
      {matchingEvents.length > 0 && (
        <div className="editorial-card p-5 space-y-3 bg-white">
          <h3 className="font-serif font-bold text-base text-black uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-[#E5E7EB]">
            <Radio className="w-4 h-4 text-black" />
            Matching Security Telemetry Events ({matchingEvents.length})
          </h3>
          <div className="space-y-2 font-mono text-xs">
            {matchingEvents.map(evt => (
              <div
                key={evt.id}
                onClick={() => navigateTo("events", evt.id)}
                className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between hover:border-black transition-colors cursor-pointer"
              >
                <div className="truncate max-w-xl font-sans">
                  <span className="font-mono font-bold text-black mr-2">[{evt.source_type}]</span>
                  <span className="text-[#1E293B] truncate">{evt.raw_message}</span>
                </div>
                <span className="text-[#64748B] text-xs whitespace-nowrap font-mono">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default GlobalSearch;
