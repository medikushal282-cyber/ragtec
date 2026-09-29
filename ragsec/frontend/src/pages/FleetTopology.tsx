import React, { useState } from "react";
import { useSOC } from "../context/SOCContext";
import { Device, Network } from "../types/soc";
import { DeviceDrawer } from "../components/DeviceDrawer";
import { StatusBadge } from "../components/Badges";
import {
  Server,
  Network as NetIcon,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Lock,
  Radio
} from "lucide-react";

export const FleetTopology: React.FC = () => {
  const { devices, selectedDeviceId, setSelectedDeviceId, navigateTo } = useSOC();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeZoneFilter, setActiveZoneFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"TOPOLOGY" | "TABLE">("TOPOLOGY");

  const networks: Network[] = [
    { id: "NET-CORP-01", name: "Corporate Workstations Subnet", cidr: "192.168.1.0/24", zone: "CORP", description: "Internal employee endpoint network" },
    { id: "NET-DMZ-01", name: "Public Ingress DMZ Subnet", cidr: "10.0.50.0/24", zone: "DMZ", description: "Reverse proxies and perimeter gateways" },
    { id: "NET-PROD-01", name: "Production Core Enclave", cidr: "10.0.100.0/24", zone: "PROD", description: "Database and Domain Controller servers" }
  ];

  const handleDeviceClick = (dev: Device) => {
    setSelectedDevice(dev);
    setSelectedDeviceId(dev.id);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="editorial-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <NetIcon className="w-4 h-4 text-black" />
          <span className="font-serif font-bold text-sm text-black uppercase tracking-wider">Fleet & Network Topology</span>
          <span className="text-[#64748B]">({devices.length || 5} Connected Nodes)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#64748B]">Zone:</span>
            <select
              value={activeZoneFilter}
              onChange={e => setActiveZoneFilter(e.target.value)}
              className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-md px-3 py-1 text-black text-xs font-mono focus:outline-none focus:border-black"
            >
              <option value="ALL">All Zones</option>
              <option value="CORP">Corporate (CORP)</option>
              <option value="DMZ">Public DMZ</option>
              <option value="PROD">Production Core</option>
            </select>
          </div>

          <div className="flex items-center rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] p-0.5">
            <button
              onClick={() => setViewMode("TOPOLOGY")}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                viewMode === "TOPOLOGY" ? "bg-black text-white font-semibold" : "text-[#64748B] hover:text-black"
              }`}
            >
              Topology
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                viewMode === "TABLE" ? "bg-black text-white font-semibold" : "text-[#64748B] hover:text-black"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Network Topology Visualizer */}
      {viewMode === "TOPOLOGY" ? (
        <div className="space-y-5">
          {networks
            .filter(n => activeZoneFilter === "ALL" || n.zone === activeZoneFilter)
            .map(net => {
              const netDevices = devices.filter(d => d.network_id === net.id);

              return (
                <div key={net.id} className="editorial-card p-5 space-y-4 bg-white">
                  {/* Subnet Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                    <div>
                      <h3 className="font-serif font-bold text-base text-black">{net.name}</h3>
                      <p className="text-xs font-mono text-[#64748B]">CIDR: {net.cidr} • {net.description}</p>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-white uppercase font-bold tracking-wider">
                      ZONE: {net.zone}
                    </span>
                  </div>

                  {/* Device Nodes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {netDevices.map(dev => {
                      const isHighRisk = dev.risk_score > 60;
                      const isSelected = selectedDeviceId === dev.id;

                      return (
                        <div
                          key={dev.id}
                          onClick={() => handleDeviceClick(dev)}
                          className={`editorial-card p-4 space-y-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? "border-black shadow-md bg-neutral-50"
                              : isHighRisk
                              ? "border-black bg-white hover:bg-[#F8F9FA]"
                              : "bg-white hover:border-black"
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-xs">
                            <div className="flex items-center gap-2">
                              <Server className="w-3.5 h-3.5 text-black" />
                              <span className="font-bold text-black text-xs font-serif">{dev.hostname}</span>
                            </div>
                            <StatusBadge status={dev.status} />
                          </div>

                          <div className="text-[11px] font-mono text-[#64748B] space-y-0.5">
                            <div>IP Address: <span className="text-black font-semibold">{dev.ip_address}</span></div>
                            <div className="truncate">OS: <span className="text-[#334155]">{dev.os}</span></div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] font-mono text-[11px]">
                            <span>
                              Risk Score:{" "}
                              <strong className={isHighRisk ? "text-red-600 font-serif text-xs font-bold" : "text-black font-serif text-xs font-bold"}>
                                {dev.risk_score} / 100
                              </strong>
                            </span>
                            <span className="text-black font-semibold hover:underline">Inspect Node →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        /* Asset Table */
        <div className="editorial-card p-4 bg-white">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Hostname</th>
                <th>IP Address</th>
                <th>Subnet</th>
                <th>Operating System</th>
                <th>Status</th>
                <th>Risk Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(dev => (
                <tr key={dev.id} onClick={() => handleDeviceClick(dev)} className="cursor-pointer">
                  <td className="font-mono font-bold text-black">{dev.id}</td>
                  <td className="font-serif font-bold text-black">{dev.hostname}</td>
                  <td className="font-mono text-[#334155]">{dev.ip_address}</td>
                  <td className="font-mono text-[#64748B]">{dev.network_id}</td>
                  <td className="text-[#334155]">{dev.os}</td>
                  <td><StatusBadge status={dev.status} /></td>
                  <td className="font-serif font-bold text-black">{dev.risk_score}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeviceClick(dev);
                      }}
                      className="text-black font-bold font-mono text-xs hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over Device Drawer */}
      <DeviceDrawer device={selectedDevice} onClose={() => setSelectedDevice(null)} />
    </div>
  );
};
export default FleetTopology;
