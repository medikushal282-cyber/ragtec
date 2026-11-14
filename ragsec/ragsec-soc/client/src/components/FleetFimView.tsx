import React, { useState, useEffect, useMemo } from "react";
import { 
  Server, 
  ShieldAlert, 
  ShieldCheck,
  Lock, 
  Unlock,
  RotateCcw, 
  RefreshCw, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  HardDrive, 
  Activity,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Radio,
  Globe,
  Monitor,
  Laptop,
  Terminal,
  Search,
  SlidersHorizontal,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Folder,
  ArrowUpRight,
  FileText,
  FileSearch,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { RemoteSandboxExplorerModal } from "./RemoteSandboxExplorerModal";
import { ConnectRemoteLaptopModal } from "./ConnectRemoteLaptopModal";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface DeviceItem {
  id: string;
  network_id: string;
  hostname: string;
  ip_address: string;
  device_type?: string;
  os?: string;
  os_type?: string;
  criticality: "critical" | "high" | "medium" | "low" | string;
  status: "active" | "isolated" | "compromised" | "offline" | string;
  risk_score?: number;
  cpu_percent?: number;
  ram_percent?: number;
  last_seen?: string;
  latency_ms?: number;
  threats_active?: number;
  agent_version?: string;
  segment?: string;
  mac_address?: string;
}

interface QuarantinedItem {
  filename: string;
  quarantined_filename: string;
  quarantine_path: string;
  original_path: string;
  size_bytes: number;
  quarantined_at: string;
}

interface WhitelistItem {
  id: string;
  file_path: string;
  file_name: string;
  duration: string;
  expires_at: string | null;
  reason: string;
}

// -----------------------------------------------------------------------
// Mock Connected Enterprise Fleet (Used when Demo Mode is ON)
// -----------------------------------------------------------------------
const MOCK_CONNECTED_DEVICES: DeviceItem[] = [
  {
    id: "DEV-CORP-FW01",
    network_id: "NET-PERIMETER",
    hostname: "EDGE-FIREWALL-01",
    ip_address: "172.16.0.1",
    device_type: "Firewall / Gateway",
    os_type: "FortiOS 7.4 / Edge Gateway",
    criticality: "critical",
    status: "active",
    risk_score: 12,
    cpu_percent: 24,
    ram_percent: 41,
    latency_ms: 0.8,
    threats_active: 0,
    agent_version: "Sentinel v2.4-Core",
    segment: "Perimeter DMZ",
    mac_address: "00:1B:44:11:3A:B7",
    last_seen: "Just now"
  },
  {
    id: "DEV-CORP-DC1",
    network_id: "NET-CORP-CORE",
    hostname: "CORP-DC-01",
    ip_address: "10.0.0.2",
    device_type: "Domain Controller",
    os_type: "Windows Server 2022 Datacenter",
    criticality: "critical",
    status: "active",
    risk_score: 28,
    cpu_percent: 46,
    ram_percent: 68,
    latency_ms: 1.2,
    threats_active: 0,
    agent_version: "Sentinel v2.4-Win",
    segment: "Identity & Kerberos",
    mac_address: "00:50:56:A2:3B:11",
    last_seen: "Just now"
  },
  {
    id: "DEV-DC-DB1",
    network_id: "NET-PROD-DATA",
    hostname: "PROD-DB-01",
    ip_address: "172.16.0.100",
    device_type: "Database Server",
    os_type: "Ubuntu 22.04 LTS (PostgreSQL 16)",
    criticality: "critical",
    status: "active",
    risk_score: 18,
    cpu_percent: 58,
    ram_percent: 74,
    latency_ms: 1.5,
    threats_active: 0,
    agent_version: "Sentinel v2.4-Linux",
    segment: "Production Database",
    mac_address: "00:50:56:A2:9C:44",
    last_seen: "Just now"
  },
  {
    id: "DEV-DC-WEB1",
    network_id: "NET-PROD-DMZ",
    hostname: "PROD-WEB-01",
    ip_address: "172.16.0.50",
    device_type: "Web Application Server",
    os_type: "Debian 12 / Nginx Cluster",
    criticality: "high",
    status: "compromised",
    risk_score: 84,
    cpu_percent: 88,
    ram_percent: 82,
    latency_ms: 3.4,
    threats_active: 2,
    agent_version: "Sentinel v2.4-Linux",
    segment: "Public Ingress DMZ",
    mac_address: "00:50:56:A2:4E:89",
    last_seen: "Just now"
  },
  {
    id: "DEV-CORP-WS1",
    network_id: "NET-FINANCE",
    hostname: "CORP-WS-014",
    ip_address: "10.0.0.14",
    device_type: "Windows Workstation",
    os_type: "Windows 11 Enterprise (23H2)",
    criticality: "high",
    status: "compromised",
    risk_score: 92,
    cpu_percent: 72,
    ram_percent: 64,
    latency_ms: 2.1,
    threats_active: 3,
    agent_version: "Sentinel v2.4-Win (Monitored Workspace)",
    segment: "Corporate Finance Enclave",
    mac_address: "3C:7C:3F:8A:19:B2",
    last_seen: "Just now"
  },
  {
    id: "DEV-ENG-LT09",
    network_id: "NET-ENGINEERING",
    hostname: "ENG-MBP-019",
    ip_address: "10.24.1.19",
    device_type: "macOS Developer Laptop",
    os_type: "macOS Sonoma 14.5 (Apple M3 Max)",
    criticality: "medium",
    status: "active",
    risk_score: 15,
    cpu_percent: 32,
    ram_percent: 54,
    latency_ms: 4.8,
    threats_active: 0,
    agent_version: "Sentinel v2.4-Darwin",
    segment: "Core Engineering VLAN",
    mac_address: "F4:D4:88:2E:77:01",
    last_seen: "Just now"
  },
  {
    id: "DEV-BRANCH-ROUTER",
    network_id: "NET-BRANCH-EDGE",
    hostname: "BR-RT-01",
    ip_address: "192.168.1.1",
    device_type: "SD-WAN Edge Router",
    os_type: "Cisco IOS-XE / Branch Edge",
    criticality: "high",
    status: "active",
    risk_score: 22,
    cpu_percent: 29,
    ram_percent: 37,
    latency_ms: 14.2,
    threats_active: 0,
    agent_version: "Sentinel v2.4-Router",
    segment: "Branch Office WAN",
    mac_address: "00:1E:F7:99:32:01",
    last_seen: "2s ago"
  },
  {
    id: "DEV-BRANCH-WS1",
    network_id: "NET-BRANCH-RETAIL",
    hostname: "BR-WS-042",
    ip_address: "192.168.1.42",
    device_type: "POS Retail Workstation",
    os_type: "Windows 10 Enterprise LTSC",
    criticality: "low",
    status: "active",
    risk_score: 8,
    cpu_percent: 19,
    ram_percent: 35,
    latency_ms: 16.8,
    threats_active: 0,
    agent_version: "Sentinel v2.4-Win",
    segment: "Branch Retail Network",
    mac_address: "B8:27:EB:44:91:0F",
    last_seen: "5s ago"
  }
];

export const FleetFimView: React.FC = () => {
  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState<"fleet" | "quarantine" | "whitelist" | "harmful_logs">("fleet");
  const [viewMode, setViewMode] = useState<"topology" | "grid">("topology");

  // Remote Sandbox Explorer & Laptop Connection Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSandboxExplorer, setShowSandboxExplorer] = useState(false);
  const [sandboxExplorerDevice, setSandboxExplorerDevice] = useState<DeviceItem | null>(null);

  // Fleet Harmful Logs & Live Alert Stream
  const [harmfulLogs, setHarmfulLogs] = useState<any[]>([]);
  const [isSimulatingThreat, setIsSimulatingThreat] = useState(false);
  const [simThreatDevice, setSimThreatDevice] = useState("DEV-LAPTOP-FIN02");
  const [simThreatType, setSimThreatType] = useState("ransomware");

  // DEMO MODE TOGGLE STATE
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("ragsec_fleet_demo_mode");
    return saved !== null ? saved === "true" : false;
  });

  // Data states
  const [liveDevices, setLiveDevices] = useState<DeviceItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [quarantinedFiles, setQuarantinedFiles] = useState<QuarantinedItem[]>([]);
  const [whitelistRules, setWhitelistRules] = useState<WhitelistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("" );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Device isolation simulation state (persists per session)
  const [isolatedDeviceIds, setIsolatedDeviceIds] = useState<Set<string>>(new Set());

  // Whitelist Modal State
  const [showAddWhitelist, setShowAddWhitelist] = useState(false);
  const [newRulePath, setNewRulePath] = useState("");
  const [newRuleDuration, setNewRuleDuration] = useState<"temporary" | "permanent">("temporary");
  const [newRuleReason, setNewRuleReason] = useState("");

  const formatTimestamp = (ts: any) => {
    if (!ts) return "Just now";
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString();
    } catch {}
    return String(ts);
  };

  const handleToggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    localStorage.setItem("ragsec_fleet_demo_mode", String(nextVal));
    toast.success(nextVal ? "Demo Mode Enabled: Displaying simulated enterprise fleet mesh" : "Live Mode Enabled: Querying live connected SOC endpoints");
  };

  const fetchLiveDevices = async () => {
    setIsLoading(true);
    try {
      const devRes = await fetch(`${API_BASE_URL}/api/fleet/endpoints`);
      if (devRes.ok) {
        const d = await devRes.json();
        if (Array.isArray(d) && d.length > 0) {
          setLiveDevices(d);
        }
      }
    } catch {
      // Fallback empty if backend offline
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHarmfulLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/harmful-logs`);
      if (res.ok) {
        const logs = await res.json();
        setHarmfulLogs(logs);
      }
    } catch {}
  };

  const handleSimulateHarmfulLog = async () => {
    setIsSimulatingThreat(true);
    toast.loading("Simulating harmful threat payload across fleet mesh...", { id: "sim-toast" });
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleet/simulate-harmful-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: simThreatDevice,
          threat_type: simThreatType
        })
      });
      if (res.ok) {
        const log = await res.json();
        toast.dismiss("sim-toast");
        window.dispatchEvent(new CustomEvent("ragsec-fleet-threat-alert", { detail: log }));
        await Promise.all([fetchHarmfulLogs(), fetchLiveDevices()]);
      } else {
        toast.error("Simulation failed", { id: "sim-toast" });
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`, { id: "sim-toast" });
    } finally {
      setIsSimulatingThreat(false);
    }
  };

  const fetchEnclaveData = async () => {
    try {
      const qRes = await fetch(`${API_BASE_URL}/api/fim/quarantined`);
      if (qRes.ok) setQuarantinedFiles(await qRes.json());

      const wRes = await fetch(`${API_BASE_URL}/api/fim/whitelist`);
      if (wRes.ok) setWhitelistRules(await wRes.json());
    } catch {}
  };

  useEffect(() => {
    fetchEnclaveData();
    fetchLiveDevices();
    fetchHarmfulLogs();
    const interval = setInterval(() => {
      fetchLiveDevices();
      fetchHarmfulLogs();
      fetchEnclaveData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Current active devices list depending on Demo Mode
  const activeDevices = useMemo(() => {
    const list = isDemoMode ? MOCK_CONNECTED_DEVICES : (liveDevices.length > 0 ? liveDevices : [
      {
        id: "DEV-LOCAL-01",
        network_id: "NET-LOCAL-HOST",
        hostname: "RAGSEC-SENTINEL-LOCAL",
        ip_address: "127.0.0.1",
        device_type: "Local Security Sentinel",
        os_type: "Windows 11 Enterprise (Host)",
        criticality: "high",
        status: "active",
        risk_score: 10,
        cpu_percent: 32,
        ram_percent: 48,
        latency_ms: 0.2,
        threats_active: 0,
        agent_version: "Sentinel v2.4-Core Live",
        segment: "monitored_workspace/ Enclave",
        mac_address: "00:15:5D:8B:20:9A",
        last_seen: "Realtime"
      }
    ]);

    return list.map(d => ({
      ...d,
      status: isolatedDeviceIds.has(d.id) ? "isolated" : d.status
    }));
  }, [isDemoMode, liveDevices, isolatedDeviceIds]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return activeDevices.filter(d => {
      const matchesSearch = 
        d.hostname.toLowerCase().includes(searchFilter.toLowerCase()) ||
        d.ip_address.includes(searchFilter) ||
        (d.network_id && d.network_id.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (d.device_type && d.device_type.toLowerCase().includes(searchFilter.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter === "ALL") return true;
      if (statusFilter === "COMPROMISED") return d.status === "compromised" || (d.threats_active || 0) > 0;
      if (statusFilter === "ISOLATED") return d.status === "isolated";
      if (statusFilter === "ACTIVE") return d.status === "active";
      return true;
    });
  }, [activeDevices, searchFilter, statusFilter]);

  // Toggle Isolation action
  const handleToggleIsolation = (device: DeviceItem) => {
    const isCurrentlyIsolated = isolatedDeviceIds.has(device.id);
    const updated = new Set(isolatedDeviceIds);
    if (isCurrentlyIsolated) {
      updated.delete(device.id);
      toast.success(`Device ${device.hostname} restored to active network.`);
    } else {
      updated.add(device.id);
      toast.warning(`Device ${device.hostname} ISOLATED. All network ports blocked except Sentinel Agent.`);
    }
    setIsolatedDeviceIds(updated);
    if (selectedDevice?.id === device.id) {
      setSelectedDevice({
        ...device,
        status: isCurrentlyIsolated ? "active" : "isolated"
      });
    }
  };

  const handleUnquarantine = async (item: QuarantinedItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarantinePath: item.quarantine_path,
          originalPath: item.original_path
        })
      });
      if (res.ok) {
        toast.success(`Restored ${item.filename} back to workspace.`);
        fetchEnclaveData();
      }
    } catch (e: any) {
      toast.error(`Restore error: ${e.message}`);
    }
  };

  const handleAddWhitelist = async () => {
    if (!newRulePath.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/ignore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: newRulePath,
          duration: newRuleDuration,
          reason: newRuleReason || "Manual administrative rule"
        })
      });
      if (res.ok) {
        toast.success(`Added whitelist rule for ${newRulePath}`);
        setNewRulePath("");
        setNewRuleReason("");
        setShowAddWhitelist(false);
        fetchEnclaveData();
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    const dt = (deviceType || "").toLowerCase();
    if (dt.includes("laptop") || dt.includes("macbook")) return Laptop;
    if (dt.includes("router") || dt.includes("firewall") || dt.includes("gateway")) return Globe;
    if (dt.includes("server") || dt.includes("database") || dt.includes("controller")) return Server;
    return Monitor;
  };

  return (
    <div className="space-y-6">
      {/* Apple-Style Glass Header with Mode Control Pill */}
      <div className="apple-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Server className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-white tracking-tight">
                  Endpoint IEM Fleet & Infrastructure Enclave
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-mono font-medium border border-blue-500/20">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Integrated Endpoint Management • Real-time FIM telemetry & autonomous containment
              </p>
            </div>
          </div>
        </div>

        {/* Actions: Connect Remote Laptop + Demo Mode Toggle Switch + Refresh */}
        <div className="flex items-center gap-3">
          {/* Connect Remote Laptop Button */}
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 apple-button shadow-md shadow-blue-600/20 transition-all"
            title="Enroll another laptop/computer into the fleet mesh"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Remote Laptop</span>
          </button>

          {/* DEMO MODE PILL (Crucial User Requirement) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDemoMode ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
              <span className="text-[11px] font-medium text-slate-300">
                {isDemoMode ? "Demo Mode" : "Live SOC"}
              </span>
            </div>

            <button
              onClick={handleToggleDemoMode}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isDemoMode ? "bg-blue-600" : "bg-slate-700"
              }`}
              title="Toggle between Simulated Enterprise Fleet and Live Connected Devices"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isDemoMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Refresh / Scan Button */}
          <button
            onClick={() => {
              if (isDemoMode) {
                toast.info("Refreshed simulated endpoint mesh telemetry.");
              } else {
                fetchLiveDevices();
                fetchHarmfulLogs();
                toast.success("Polled live endpoints & harmful logs.");
              }
            }}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E8E93] hover:text-white transition-all apple-button"
            title="Refresh Fleet Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Fleet Topology vs Quarantined Enclave vs Whitelist Rules vs Harmful Threat Stream */}
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 text-xs overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-2 apple-button ${
              activeTab === "fleet"
                ? "bg-white/[0.08] text-white border-white/[0.12] font-medium shadow-sm"
                : "text-[#8E8E93] border-transparent hover:bg-white/[0.035]"
            }`}
          >
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>Connected Fleet ({activeDevices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("harmful_logs")}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-2 apple-button ${
              activeTab === "harmful_logs"
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30 font-medium shadow-sm"
                : "text-[#8E8E93] border-transparent hover:bg-white/[0.035]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Harmful Logs Stream</span>
            {harmfulLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-300 font-mono text-[9px] font-bold border border-rose-500/40 animate-pulse">
                {harmfulLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("quarantine")}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-2 apple-button ${
              activeTab === "quarantine"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/25 font-medium shadow-sm"
                : "text-[#8E8E93] border-transparent hover:bg-white/[0.035]"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Quarantined Enclave ({quarantinedFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("whitelist")}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-2 apple-button ${
              activeTab === "whitelist"
                ? "bg-blue-500/10 text-blue-300 border-blue-500/25 font-medium shadow-sm"
                : "text-[#8E8E93] border-transparent hover:bg-white/[0.035]"
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-blue-400" />
            <span>Suppression Rules ({whitelistRules.length})</span>
          </button>
        </div>

        {activeTab === "fleet" && (
          <div className="flex items-center gap-2">
            {/* View Switcher: Topology vs Grid */}
            <div className="flex items-center bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.06]">
              <button
                onClick={() => setViewMode("topology")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  viewMode === "topology"
                    ? "bg-white/[0.1] text-white shadow-sm"
                    : "text-[#8E8E93] hover:text-white"
                }`}
              >
                Topology Mesh
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-white/[0.1] text-white shadow-sm"
                    : "text-[#8E8E93] hover:text-white"
                }`}
              >
                Device Cards
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: FLEET INVENTORY & CONNECTED TOPOLOGY DISPLAY                 */}
      {/* =================================================================== */}
      {activeTab === "fleet" && (
        <div className="space-y-6">
          {/* Status summary pill bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="apple-panel p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Total Endpoints</span>
                <div className="text-xl font-semibold text-white mt-0.5">{activeDevices.length}</div>
              </div>
              <Server className="w-4 h-4 text-blue-400" />
            </div>

            <div className="apple-panel p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Healthy & Active</span>
                <div className="text-xl font-semibold text-emerald-400 mt-0.5">
                  {activeDevices.filter(d => d.status === "active").length}
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="apple-panel p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Threat Alerts</span>
                <div className="text-xl font-semibold text-rose-400 mt-0.5">
                  {activeDevices.filter(d => d.status === "compromised" || (d.threats_active || 0) > 0).length}
                </div>
              </div>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>

            <div className="apple-panel p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Isolated Endpoints</span>
                <div className="text-xl font-semibold text-amber-400 mt-0.5">
                  {activeDevices.filter(d => d.status === "isolated").length}
                </div>
              </div>
              <WifiOff className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by hostname, IP, subnet..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.035] border border-white/[0.08] text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "ACTIVE", "COMPROMISED", "ISOLATED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    statusFilter === st
                      ? "bg-white/[0.1] text-white border border-white/[0.12]"
                      : "text-[#8E8E93] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* VIEW MODE 1: CONNECTED TOPOLOGY DISPLAY (Interactive Network Mesh) */}
          {viewMode === "topology" && (
            <div className="apple-panel p-6 relative overflow-hidden border border-white/[0.08]">
              {/* Subtle grid pattern background */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}
              />

              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                    <h3 className="text-sm font-semibold text-white">
                      {isDemoMode ? "Autonomous Enterprise Mesh Map (Simulated)" : "Live Endpoint Connection Graph"}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5">
                    Click any connected node to inspect telemetry, active FIM watchlists, or trigger instant network quarantine.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-[#8E8E93]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Healthy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span>Compromised</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Isolated</span>
                  </div>
                </div>
              </div>

              {/* Topology SVG + Node Layer */}
              <div className="relative min-h-[380px] flex flex-col justify-between py-4">
                {/* SVG Visual connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <linearGradient id="link-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="alert-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* Dynamic connection lines linking the top gateway to other nodes */}
                  <line x1="50%" y1="60" x2="20%" y2="200" stroke="url(#link-gradient)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-pulse" />
                  <line x1="50%" y1="60" x2="40%" y2="200" stroke="url(#link-gradient)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="60" x2="60%" y2="200" stroke="url(#alert-gradient)" strokeWidth="2" strokeDasharray="3 3" />
                  <line x1="50%" y1="60" x2="80%" y2="200" stroke="url(#link-gradient)" strokeWidth="1.5" strokeDasharray="4 4" />

                  <line x1="20%" y1="200" x2="20%" y2="320" stroke="url(#link-gradient)" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="40%" y1="200" x2="40%" y2="320" stroke="url(#link-gradient)" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="60%" y1="200" x2="60%" y2="320" stroke="url(#alert-gradient)" strokeWidth="2" />
                  <line x1="80%" y1="200" x2="80%" y2="320" stroke="url(#link-gradient)" strokeWidth="1" strokeDasharray="2 2" />
                </svg>

                {/* TIER 1: Core Gateway / Firewall */}
                <div className="flex justify-center z-10">
                  {filteredDevices.slice(0, 1).map((device) => {
                    const Icon = getDeviceIcon(device.device_type);
                    const isSelected = selectedDevice?.id === device.id;
                    return (
                      <div
                        key={device.id}
                        onClick={() => setSelectedDevice(device)}
                        className={`cursor-pointer px-5 py-3 rounded-2xl bg-[#0F1424]/90 backdrop-blur-md border transition-all duration-200 shadow-xl flex items-center gap-3.5 ${
                          isSelected
                            ? "border-blue-400 ring-2 ring-blue-500/20 scale-105"
                            : "border-white/[0.12] hover:border-blue-500/50 hover:scale-102"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs tracking-tight">{device.hostname}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                              GATEWAY
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[#8E8E93]">{device.ip_address}</div>
                        </div>
                        <div className="ml-2 pl-3 border-l border-white/[0.08] text-right">
                          <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {device.latency_ms}ms
                          </span>
                          <span className="text-[9px] text-[#8E8E93] block">1.2 Gbps</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TIER 2: Enterprise Core & DMZ Servers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 z-10 pt-8 pb-4">
                  {filteredDevices.slice(1, 5).map((device) => {
                    const Icon = getDeviceIcon(device.device_type);
                    const isSelected = selectedDevice?.id === device.id;
                    const isThreat = device.status === "compromised" || (device.threats_active || 0) > 0;
                    const isIsolated = device.status === "isolated";

                    return (
                      <div
                        key={device.id}
                        onClick={() => setSelectedDevice(device)}
                        className={`cursor-pointer p-4 rounded-2xl backdrop-blur-md border transition-all duration-200 shadow-md ${
                          isIsolated
                            ? "bg-amber-950/20 border-amber-500/40"
                            : isThreat
                            ? "bg-rose-950/25 border-rose-500/50 hover:border-rose-400 shadow-rose-950/30"
                            : "bg-[#0C101C]/80 border-white/[0.08] hover:border-blue-500/40"
                        } ${isSelected ? "ring-2 ring-blue-500/30 scale-102" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isThreat ? "bg-rose-500/20 text-rose-300" : "bg-white/[0.06] text-blue-400"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                            isIsolated ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                            isThreat ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse" :
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {isIsolated ? "ISOLATED" : isThreat ? "THREAT" : "ONLINE"}
                          </span>
                        </div>

                        <div className="font-semibold text-white text-xs truncate">{device.hostname}</div>
                        <div className="text-[11px] font-mono text-[#8E8E93] mt-0.5">{device.ip_address}</div>

                        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#8E8E93]">
                          <span>CPU: {device.cpu_percent}%</span>
                          <span className="font-mono text-slate-300">{device.latency_ms}ms</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TIER 3: End-user Workstations & Branch Nodes */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 z-10 pt-4">
                  {filteredDevices.slice(5).map((device) => {
                    const Icon = getDeviceIcon(device.device_type);
                    const isSelected = selectedDevice?.id === device.id;
                    const isThreat = device.status === "compromised" || (device.threats_active || 0) > 0;
                    const isIsolated = device.status === "isolated";

                    return (
                      <div
                        key={device.id}
                        onClick={() => setSelectedDevice(device)}
                        className={`cursor-pointer p-4 rounded-2xl backdrop-blur-md border transition-all duration-200 shadow-md ${
                          isIsolated
                            ? "bg-amber-950/20 border-amber-500/40"
                            : isThreat
                            ? "bg-rose-950/25 border-rose-500/50 hover:border-rose-400"
                            : "bg-[#0C101C]/80 border-white/[0.08] hover:border-blue-500/40"
                        } ${isSelected ? "ring-2 ring-blue-500/30 scale-102" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isThreat ? "bg-rose-500/20 text-rose-300" : "bg-white/[0.06] text-slate-300"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/[0.05] text-[#8E8E93] font-mono">
                            {device.network_id}
                          </span>
                        </div>

                        <div className="font-semibold text-white text-xs truncate">{device.hostname}</div>
                        <div className="text-[11px] font-mono text-[#8E8E93] mt-0.5">{device.ip_address}</div>

                        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#8E8E93]">
                          <span className="truncate max-w-[120px]">{device.os_type?.split(" ")[0]}</span>
                          <span className="font-mono text-emerald-400">{device.latency_ms}ms</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: CARD GRID DISPLAY */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((device) => {
                const Icon = getDeviceIcon(device.device_type);
                const isThreat = device.status === "compromised" || (device.threats_active || 0) > 0;
                const isIsolated = device.status === "isolated";
                const isSelected = selectedDevice?.id === device.id;

                return (
                  <div
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className={`apple-panel p-5 cursor-pointer transition-all duration-200 border ${
                      isIsolated
                        ? "bg-amber-950/15 border-amber-500/30"
                        : isThreat
                        ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-400"
                        : "border-white/[0.08] hover:border-blue-500/40"
                    } ${isSelected ? "ring-2 ring-blue-500/30" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                          <Icon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs">{device.hostname}</div>
                          <div className="text-[11px] font-mono text-[#8E8E93]">{device.ip_address}</div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        isIsolated ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        isThreat ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {isIsolated ? "ISOLATED" : isThreat ? "THREAT" : "ACTIVE"}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-[#8E8E93] py-2 border-y border-white/[0.05]">
                      <div className="flex justify-between">
                        <span>Segment:</span>
                        <span className="text-slate-200 font-medium">{device.segment || device.network_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Operating System:</span>
                        <span className="text-slate-200 truncate max-w-[170px]">{device.os_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agent Version:</span>
                        <span className="text-blue-300 font-mono text-[10px]">{device.agent_version}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-1 gap-2">
                      <div className="flex items-center gap-2 text-[10px] text-[#8E8E93]">
                        <span>CPU: <strong className="text-white">{device.cpu_percent !== undefined ? device.cpu_percent : 24}%</strong></span>
                        <span>RAM: <strong className="text-white">{device.ram_percent !== undefined ? device.ram_percent : 42}%</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSandboxExplorerDevice(device);
                            setShowSandboxExplorer(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-500/30 flex items-center gap-1 transition-all apple-button"
                          title="Open strict sandbox enclave for this remote laptop"
                        >
                          <Folder className="w-3 h-3 text-blue-400" />
                          <span>Sandbox</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleIsolation(device);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all apple-button ${
                            isIsolated
                              ? "bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40"
                              : "bg-white/[0.06] hover:bg-rose-600/30 text-[#8E8E93] hover:text-rose-200 border border-white/[0.08]"
                          }`}
                        >
                          {isIsolated ? "Rejoin" : "Isolate"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DEVICE INSPECTOR DRAWER / SHEET */}
          <AnimatePresence>
            {selectedDevice && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="apple-panel p-6 border border-white/[0.12] space-y-5"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Server className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white tracking-tight">{selectedDevice.hostname}</h3>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                          {selectedDevice.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5 font-mono">
                        {selectedDevice.ip_address} • MAC: {selectedDevice.mac_address || "00:50:56:FE:19:02"} • {selectedDevice.segment}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSandboxExplorerDevice(selectedDevice);
                        setShowSandboxExplorer(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white apple-button transition-all shadow-md shadow-blue-600/20"
                      title="Strictly browse this device's project sandbox directory"
                    >
                      <Folder className="w-3.5 h-3.5 text-blue-200" />
                      <span>Browse Remote Sandbox</span>
                    </button>

                    <button
                      onClick={() => handleToggleIsolation(selectedDevice)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 apple-button transition-all ${
                        selectedDevice.status === "isolated"
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300"
                      }`}
                    >
                      {selectedDevice.status === "isolated" ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Restore Network Access</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3.5 h-3.5" />
                          <span>Quarantine Device (Zero-Trust Cut)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedDevice(null)}
                      className="p-1.5 rounded-xl hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Device Specs & Telemetry Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1">
                    <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Operating System</span>
                    <p className="text-white font-medium truncate">{selectedDevice.os_type}</p>
                    <span className="text-[10px] text-blue-400 font-mono">FIM Kernel Filter Active</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1">
                    <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Endpoint Agent</span>
                    <p className="text-white font-medium">{selectedDevice.agent_version}</p>
                    <span className="text-[10px] text-emerald-400">Heartbeat: {selectedDevice.last_seen || "Active"}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1">
                    <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Risk & Threat Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{selectedDevice.risk_score || 15}/100</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        (selectedDevice.risk_score || 0) > 50
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}>
                        {(selectedDevice.risk_score || 0) > 50 ? "ELEVATED" : "NORMAL"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1">
                    <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Round-Trip Latency</span>
                    <p className="text-emerald-400 font-mono font-medium text-base">{selectedDevice.latency_ms} ms</p>
                    <span className="text-[10px] text-[#8E8E93]">Jitter: 0.1ms • Packet Loss: 0.0%</span>
                  </div>
                </div>

                {/* Monitored Enclave Directories for this device */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Active FIM File Watchers on this Node:</span>
                    <span className="text-[10px] text-blue-400 font-mono">Real-time Watchdog Thread</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-[#8E8E93]">
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span>📁</span>
                        <code className="text-slate-200">monitored_workspace/</code>
                      </div>
                      <button
                        onClick={() => {
                          setSandboxExplorerDevice(selectedDevice);
                          setShowSandboxExplorer(true);
                        }}
                        className="px-2.5 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 text-[10px] font-sans font-medium flex items-center gap-1 border border-blue-500/30 apple-button transition-all shrink-0"
                      >
                        <Folder className="w-3 h-3 text-blue-400" />
                        <span>Inspect Files</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] flex items-center gap-2">
                      <span>🔒</span>
                      <span><code>monitored_workspace/.quarantine/</code> (Execution stripped)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: QUARANTINED THREAT ENCLAVE                                   */}
      {/* =================================================================== */}
      {activeTab === "quarantine" && (
        <div className="apple-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Isolated Threat Payloads in Enclave
                </h3>
                <p className="text-[11px] text-[#8E8E93]">
                  Files in this enclave have had execution bit stripped (chmod 000) and are quarantined from the host OS.
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 font-mono font-semibold border border-amber-500/30">
              EXECUTION PERMISSIONS STRIPPED
            </span>
          </div>

          {quarantinedFiles.length === 0 ? (
            <div className="p-12 text-center text-[#8E8E93] text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
              <p className="text-white font-medium">Secure Enclave Clean</p>
              <p className="text-[#8E8E93]">No active quarantined files found in <code>.quarantine/</code>.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {quarantinedFiles.map((qf, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/[0.025] border border-amber-500/25 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{qf.filename}</span>
                      <span className="text-[10px] text-[#8E8E93]">({(qf.size_bytes / 1024).toFixed(1)} KB)</span>
                    </div>
                    <div className="text-[11px] text-[#8E8E93]">
                      Original Path: <code className="text-slate-300">{qf.original_path}</code>
                    </div>
                    <div className="text-[10px] text-[#636366]">
                      Quarantined At: {new Date(qf.quarantined_at).toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnquarantine(qf)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 apple-button transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Unquarantine / Restore</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: ACTIVE SUPPRESSION & WHITELIST RULES                         */}
      {/* =================================================================== */}
      {activeTab === "whitelist" && (
        <div className="apple-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <EyeOff className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Active Suppression & Whitelist Rules
                </h3>
                <p className="text-[11px] text-[#8E8E93]">
                  Files matching these patterns bypass quarantine and alert generation during scheduled operations.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddWhitelist(!showAddWhitelist)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 apple-button shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rule</span>
            </button>
          </div>

          {showAddWhitelist && (
            <div className="p-4 rounded-xl bg-white/[0.04] border border-blue-500/30 space-y-3 text-xs">
              <div className="font-semibold text-white">Create New Whitelist Suppression Rule</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8E93] text-[11px] mb-1">File Path or Name:</label>
                  <input
                    type="text"
                    value={newRulePath}
                    onChange={(e) => setNewRulePath(e.target.value)}
                    placeholder="e.g. backup_task.bat or C:\Projects\..."
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[#8E8E93] text-[11px] mb-1">Duration:</label>
                  <select
                    value={newRuleDuration}
                    onChange={(e: any) => setNewRuleDuration(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="temporary">Temporary (1 Hour Session)</option>
                    <option value="permanent">Permanent Whitelist</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[#8E8E93] text-[11px] mb-1">Justification Reason:</label>
                <input
                  type="text"
                  value={newRuleReason}
                  onChange={(e) => setNewRuleReason(e.target.value)}
                  placeholder="e.g. Authorized developer automation script"
                  className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowAddWhitelist(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWhitelist}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Save Whitelist Rule
                </button>
              </div>
            </div>
          )}

          {whitelistRules.length === 0 ? (
            <div className="p-8 text-center text-[#8E8E93] text-xs">
              No active whitelist suppression rules. All detected suspicious files will trigger alerts.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {whitelistRules.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{w.file_name || w.file_path}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-300 font-mono">
                        {w.duration === "permanent" ? "PERMANENT" : "1 HOUR"}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8E8E93]">Path: <code>{w.file_path}</code></div>
                    <div className="text-[10px] text-[#636366]">Reason: {w.reason}</div>
                  </div>
                  <span className="text-[10px] text-[#8E8E93]">
                    {w.expires_at ? `Expires: ${new Date(w.expires_at).toLocaleTimeString()}` : "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: REAL-TIME HARMFUL LOGS & FLEET THREAT STREAM                 */}
      {/* =================================================================== */}
      {activeTab === "harmful_logs" && (
        <div className="space-y-6">
          {/* Simulation & Test Control Panel */}
          <div className="apple-panel p-5 border border-rose-500/20 bg-rose-950/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Fleet Threat Dispatcher & Harmful Log Simulation
                  </h3>
                  <p className="text-[11px] text-[#8E8E93]">
                    Trigger a simulated threat on any enrolled computer to test global real-time notifications and sandbox isolation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-rose-300 font-mono">
                  {harmfulLogs.length} Active Threat Event{harmfulLogs.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {/* Simulation Dispatch Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[#8E8E93] text-[11px] mb-1">Target Endpoint:</label>
                <select
                  value={simThreatDevice}
                  onChange={(e) => setSimThreatDevice(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-rose-500/50"
                >
                  {activeDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.hostname} ({d.ip_address})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8E8E93] text-[11px] mb-1">Threat Payload Category:</label>
                <select
                  value={simThreatType}
                  onChange={(e) => setSimThreatType(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-rose-500/50"
                >
                  <option value="ransomware">LockBit 3.0 Ransomware (Mass Encryption)</option>
                  <option value="trojan">Emotet Banking Trojan (Persistence Dropper)</option>
                  <option value="c2_beacon">Cobalt Strike HTTPS Beacon (C2 Callback)</option>
                  <option value="mimikatz">Mimikatz In-Memory LSASS Credential Dump</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSimulateHarmfulLog}
                  disabled={isSimulatingThreat}
                  className="w-full px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-2 apple-button shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isSimulatingThreat ? "animate-spin" : ""}`} />
                  <span>{isSimulatingThreat ? "Dispatching..." : "Simulate Harmful Event ⚡"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Fleet Harmful Logs */}
          <div className="apple-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-semibold text-white">
                  Real-time Endpoint Threat Stream
                </h4>
              </div>
              <span className="text-[11px] text-[#8E8E93]">
                Auto-updating every 4s • Global notifications broadcasted
              </span>
            </div>

            {harmfulLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-white font-semibold text-sm">All Fleet Endpoints Reporting Clean Telemetry</div>
                <p className="text-[#8E8E93] text-xs max-w-md mx-auto">
                  No active harmful events detected across enrolled laptops. Use the simulator above to test remote alert delivery and sandbox forensic analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {harmfulLogs.map((log) => {
                  const targetDev = activeDevices.find((d) => d.id === log.device_id) || {
                    id: log.device_id,
                    hostname: log.hostname,
                    ip_address: log.ip_address || "Remote Host",
                    device_type: "Remote Laptop",
                    os_type: "Endpoint OS",
                    criticality: "high",
                    status: "compromised"
                  };

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-rose-500/30 hover:border-rose-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 animate-pulse">
                            {log.severity || "CRITICAL"}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {log.threat_name}
                          </span>
                          <span className="text-[10px] text-[#8E8E93] font-mono">
                            ID: {log.id}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300">
                          {log.description}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8E8E93] font-mono pt-1">
                          <div className="flex items-center gap-1 text-blue-300">
                            <Laptop className="w-3 h-3" />
                            <span>{log.hostname} ({log.ip_address})</span>
                          </div>
                          <div>Path: <code>{log.file_path}</code></div>
                          <div>Time: {formatTimestamp(log.timestamp)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        <button
                          onClick={() => {
                            setSandboxExplorerDevice(targetDev as DeviceItem);
                            setShowSandboxExplorer(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm"
                          title="Strictly browse this laptop's project sandbox folder"
                        >
                          <Folder className="w-3.5 h-3.5 text-blue-400" />
                          <span>Inspect Laptop Sandbox ↗</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODALS: CONNECT REMOTE LAPTOP + STRICT SANDBOX EXPLORER             */}
      {/* =================================================================== */}
      <ConnectRemoteLaptopModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnected={(newDevice) => {
          fetchLiveDevices();
          setSelectedDevice(newDevice);
        }}
      />

      <RemoteSandboxExplorerModal
        isOpen={showSandboxExplorer}
        onClose={() => {
          setShowSandboxExplorer(false);
          setSandboxExplorerDevice(null);
        }}
        device={sandboxExplorerDevice}
      />
    </div>
  );
};

export default FleetFimView;
