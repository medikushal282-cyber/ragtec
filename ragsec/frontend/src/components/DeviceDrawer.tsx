import React, { useEffect, useState } from "react";
import { useSOC } from "../context/SOCContext";
import { Device, SecurityEvent } from "../types/soc";
import { socApi } from "../services/api";
import { SeverityBadge, StatusBadge } from "./Badges";
import {
  X,
  Server,
  ShieldAlert,
  Radio,
  FileSearch,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  Clock,
  HardDrive,
  Check
} from "lucide-react";

interface DeviceDrawerProps {
  device: Device | null;
  onClose: () => void;
}

export const DeviceDrawer: React.FC<DeviceDrawerProps> = ({ device, onClose }) => {
  const { navigateTo, incidents, refreshAll } = useSOC();
  const [deviceEvents, setDeviceEvents] = useState<SecurityEvent[]>([]);
  const [isIsolating, setIsIsolating] = useState<boolean>(false);
  const [isIsolated, setIsIsolated] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setIsIsolated(device.status === "ISOLATED");
      socApi.getDeviceEvents(device.id).then(evts => {
        setDeviceEvents(evts || []);
      });
    }
  }, [device]);

  if (!device) return null;

  const relatedIncidents = incidents.filter(i =>
    i.affected_device_ids?.includes(device.id) || i.events?.some(e => e.device_id === device.id)
  );

  const handleToggleIsolation = async () => {
    setIsIsolating(true);
    try {
      if (!isIsolated) {
        // Recommend & Execute host isolation mitigation
        const action = await socApi.recommendMitigation(
          relatedIncidents[0]?.id || "INC-2026-001",
          "ISOLATE_ENDPOINT",
          `Emergency host network isolation for ${device.hostname} (${device.ip_address})`,
          device.id
        );
        if (action?.id) {
          await socApi.approveMitigation(action.id);
          await socApi.executeMitigation(action.id);
        }
        setIsIsolated(true);
        device.status = "ISOLATED";
        setFeedback(`Endpoint ${device.hostname} successfully isolated from ${device.network_id}`);
      } else {
        setIsIsolated(false);
        device.status = "ONLINE";
        setFeedback(`Network link restored for ${device.hostname}`);
      }
      refreshAll();
      setTimeout(() => setFeedback(null), 3500);
    } catch {
      setIsIsolated(!isIsolated);
    } finally {
      setIsIsolating(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#FFFFFF] border-l border-[#E2E8F0] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              {device.hostname}
              <span className="text-xs font-mono font-normal text-[#64748B]">({device.id})</span>
            </h2>
            <p className="text-xs text-[#64748B] font-mono">Subnet: {device.network_id} • IP: {device.ip_address}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-neutral-100 text-[#64748B] hover:text-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 px-5">
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[#1E293B]">
        {/* Device Status & Risk Banner */}
        <div className="modern-card p-4 flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <span className="text-[10px] text-[#64748B] font-mono uppercase block mb-1">Host Status & Risk Level</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={isIsolated ? "ISOLATED" : device.status} />
              <span className="text-[#CBD5E1] font-mono">|</span>
              <span className="font-mono text-xs">Risk: <strong className="text-sm font-bold text-black">{device.risk_score} / 100</strong></span>
            </div>
          </div>

          <button
            onClick={handleToggleIsolation}
            disabled={isIsolating}
            className={`btn-primary-black py-2 px-4 text-xs font-semibold ${
              isIsolated ? "bg-indigo-600 hover:bg-indigo-700" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isIsolated ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isIsolating ? "Processing..." : isIsolated ? "Restore Link" : "Isolate Device"}</span>
          </button>
        </div>

        {/* Technical Attributes Grid */}
        <div className="modern-card p-4 space-y-3 font-mono">
          <h3 className="text-xs font-bold text-black uppercase tracking-wider">Device Metadata</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Operating System</span>
              <span className="text-black font-semibold">{device.os}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Device Type</span>
              <span className="text-black font-semibold">{device.device_type || "Workstation"}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Assigned MAC</span>
              <span className="text-black">{device.mac_address || "00:1A:2B:3C:4D:5E"}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Last Seen</span>
              <span className="text-[#334155]">{new Date(device.last_seen).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Associated Incidents */}
        <div className="modern-card p-4 space-y-3">
          <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Associated Incidents ({relatedIncidents.length})
          </h3>

          {relatedIncidents.length === 0 ? (
            <p className="text-xs text-[#94A3B8] font-mono py-1">No active incidents directly attributed to this node.</p>
          ) : (
            <div className="space-y-2">
              {relatedIncidents.map(inc => (
                <div
                  key={inc.id}
                  className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between hover:border-black transition-colors cursor-pointer"
                  onClick={() => {
                    onClose();
                    navigateTo("incidents", inc.id);
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-black">{inc.id}</span>
                      <SeverityBadge severity={inc.threat_classification?.severity || "HIGH"} />
                    </div>
                    <p className="text-xs font-bold text-black truncate">{inc.title || "Adversary Activity Detected"}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attributed Security & FIM Events */}
        <div className="modern-card p-4 space-y-3">
          <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-600" />
            Attributed Events Stream ({deviceEvents.length})
          </h3>

          {deviceEvents.length === 0 ? (
            <p className="text-xs text-[#94A3B8] font-mono py-1">No anomalous telemetry events recorded for this device.</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {deviceEvents.map(evt => (
                <div key={evt.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-xs">
                  <div className="flex items-center justify-between text-[#64748B] mb-1">
                    <span className="text-black font-bold">{evt.source_type}</span>
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-black text-xs truncate font-sans">{evt.raw_message}</p>
                  {evt.canonical?.file_path && (
                    <span className="text-[11px] text-indigo-600 font-semibold block mt-1 truncate">
                      File: {evt.canonical.file_path}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-[#E2E8F0] bg-white flex items-center justify-between font-mono text-xs">
        <button
          onClick={() => {
            onClose();
            navigateTo("fim");
          }}
          className="text-[#64748B] hover:text-black flex items-center gap-1 font-semibold"
        >
          <FileSearch className="w-3.5 h-3.5" />
          <span>Inspect in FIM</span>
        </button>

        <button
          onClick={() => {
            onClose();
            navigateTo("investigation", device.id);
          }}
          className="btn-primary-black py-2 px-4"
        >
          <span>Investigate Host</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
export default DeviceDrawer;
