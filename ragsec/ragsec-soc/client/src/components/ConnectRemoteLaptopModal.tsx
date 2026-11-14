import React, { useState } from "react";
import { Laptop, Wifi, ShieldCheck, X, Plus, Radio, Server, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DeviceItem } from "./FleetFimView";

const API_BASE_URL = "http://127.0.0.1:8000";

interface ConnectRemoteLaptopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (newDevice: DeviceItem) => void;
}

export function ConnectRemoteLaptopModal({
  isOpen,
  onClose,
  onConnected
}: ConnectRemoteLaptopModalProps) {
  const [hostname, setHostname] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState(8000);
  const [osType, setOsType] = useState("Windows 11 Enterprise (23H2)");
  const [deviceType, setDeviceType] = useState("Remote Laptop");
  const [segment, setSegment] = useState("Corporate Finance Enclave");
  const [agentToken, setAgentToken] = useState("ragsec-fleet-secret");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostname.trim() || !ipAddress.trim()) {
      toast.error("Please provide both a hostname and IP address.");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Handshaking with remote laptop sentinel agent...", { id: "connect-toast" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostname: hostname.trim(),
          ip_address: ipAddress.trim(),
          port: Number(port) || 8000,
          os_type: osType,
          device_type: deviceType,
          segment: segment,
          agent_token: agentToken
        })
      });

      if (res.ok) {
        const newDevice: DeviceItem = await res.json();
        toast.success(`Endpoint ${newDevice.hostname} connected to Enterprise SIEM Fleet!`, { id: "connect-toast" });
        onConnected(newDevice);
        onClose();
        // Reset form
        setHostname("");
        setIpAddress("");
      } else {
        const err = await res.json();
        toast.error(`Connection failed: ${err.detail || "Unable to reach endpoint"}`, { id: "connect-toast" });
      }
    } catch (err: any) {
      toast.error(`Network error: ${err.message}`, { id: "connect-toast" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="apple-panel max-w-lg w-full p-6 space-y-5 shadow-2xl border border-white/[0.12] text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Laptop className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Connect Remote Laptop to Fleet</h3>
              <p className="text-[11px] text-[#8E8E93]">Enroll another computer running RAGSec into the Enterprise SIEM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[#8E8E93] block mb-1">Laptop / Endpoint Hostname</label>
              <input
                type="text"
                required
                placeholder="e.g. FINANCE-LAPTOP-02 or DEV-MACBOOK-01"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] text-[#8E8E93] block mb-1">Remote IP Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.45"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500/60 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500/60 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Operating System</label>
                <select
                  value={osType}
                  onChange={(e) => setOsType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0e121d] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-blue-500/60"
                >
                  <option value="Windows 11 Enterprise (23H2)">Windows 11 Enterprise</option>
                  <option value="Windows 10 Pro LTSC">Windows 10 Pro</option>
                  <option value="macOS Sonoma 14.5 (Apple M3)">macOS Sonoma (M-Series)</option>
                  <option value="Ubuntu 22.04 LTS (Kernel 6.5)">Ubuntu Linux 22.04</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Device Role / Segment</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0e121d] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-blue-500/60"
                >
                  <option value="Corporate Finance Enclave">Finance Enclave</option>
                  <option value="Core Engineering Subnet">Engineering Subnet</option>
                  <option value="Executive Confidential Enclave">Executive Enclave</option>
                  <option value="Perimeter DMZ Workstations">Perimeter / DMZ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#8E8E93] block mb-1">Sentinel Agent Auth Secret</label>
              <input
                type="password"
                value={agentToken}
                onChange={(e) => setAgentToken(e.target.value)}
                placeholder="ragsec-fleet-secret"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500/60 font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/20 text-[11px] text-blue-300">
            <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Automatic Sandbox Enclosure</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              When connected, RAGSec isolates and views <strong>only the project sandbox directory</strong> (<code>monitored_workspace/</code>) on that laptop. The remote OS file system outside the sandbox is strictly protected.
            </p>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.04] text-[#8E8E93] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Connecting..." : "Enroll Laptop to Fleet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
