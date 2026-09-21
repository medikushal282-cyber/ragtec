import React, { useState, useEffect } from "react";
import { 
  Server, 
  ShieldAlert, 
  Lock, 
  RotateCcw, 
  RefreshCw, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  HardDrive, 
  Activity,
  Plus,
  Trash2
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

interface DeviceItem {
  id: string;
  network_id: string;
  hostname: string;
  ip_address: string;
  os_type: string;
  criticality: string;
  status: string;
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

export const FleetFimView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"fleet" | "quarantine" | "whitelist">("fleet");
  
  const [devices, setDevices] = useState<DeviceItem[]>([
    { id: "dev-01", network_id: "net_finance", hostname: "FINANCE-PC-014", ip_address: "10.24.8.42", os_type: "Windows 11 Enterprise", criticality: "HIGH", status: "Active" },
    { id: "dev-02", network_id: "net_dmz", hostname: "DMZ-WEB-03", ip_address: "192.168.1.10", os_type: "Debian 12 / Nginx", criticality: "CRITICAL", status: "Active" },
    { id: "dev-03", network_id: "net_engineering", hostname: "ENG-LT-019", ip_address: "10.24.1.19", os_type: "macOS Sonoma 14.5", criticality: "MEDIUM", status: "Active" },
    { id: "dev-04", network_id: "net_core", hostname: "CORP-DC-01", ip_address: "10.0.0.2", os_type: "Windows Server 2022", criticality: "CRITICAL", status: "Active" }
  ]);

  const [quarantinedFiles, setQuarantinedFiles] = useState<QuarantinedItem[]>([]);
  const [whitelistRules, setWhitelistRules] = useState<WhitelistItem[]>([]);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Whitelist Modal State
  const [showAddWhitelist, setShowAddWhitelist] = useState(false);
  const [newRulePath, setNewRulePath] = useState("");
  const [newRuleDuration, setNewRuleDuration] = useState<"temporary" | "permanent">("temporary");
  const [newRuleReason, setNewRuleReason] = useState("");

  const fetchData = async () => {
    try {
      // Fetch devices
      const devRes = await fetch(`${API_BASE_URL}/api/soc/devices`);
      if (devRes.ok) {
        const d = await devRes.json();
        if (d && d.length > 0) setDevices(d);
      }

      // Fetch quarantined files
      const qRes = await fetch(`${API_BASE_URL}/api/fim/quarantined`);
      if (qRes.ok) {
        setQuarantinedFiles(await qRes.json());
      }

      // Fetch whitelist rules
      const wRes = await fetch(`${API_BASE_URL}/api/fim/whitelist`);
      if (wRes.ok) {
        setWhitelistRules(await wRes.json());
      }
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScanWorkspace = async () => {
    try {
      setScanStatus("Scanning workspace...");
      const res = await fetch(`${API_BASE_URL}/api/fim/scan`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setScanStatus(`Scan complete: ${data.files_scanned || 0} files scanned, ${data.threats_flagged || 0} threats flagged.`);
        fetchData();
      }
    } catch (e: any) {
      setScanStatus(`Scan error: ${e.message}`);
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
        setActionNotice(`Restored ${item.filename} back to workspace.`);
        fetchData();
      }
    } catch (e: any) {
      setActionNotice(`Restore error: ${e.message}`);
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
        setActionNotice(`Added whitelist rule for ${newRulePath}`);
        setNewRulePath("");
        setNewRuleReason("");
        setShowAddWhitelist(false);
        fetchData();
      }
    } catch (e: any) {
      setActionNotice(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation Sub-tabs */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-mono">
              Fleet Inventory & FIM Security Enclave
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Endpoint Telemetry • Monitored Workspace: <code>monitored_workspace/</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleScanWorkspace}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Scan Workspace
          </button>
        </div>
      </div>

      {/* Notifications */}
      {scanStatus && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          {scanStatus}
        </div>
      )}

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {actionNotice}
        </div>
      )}

      {/* Sub-Tabs Nav */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 font-mono text-xs">
        <button
          onClick={() => setActiveTab("fleet")}
          className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
            activeTab === "fleet"
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
              : "text-slate-400 border-transparent hover:bg-white/5"
          }`}
        >
          <Server className="w-4 h-4" />
          Endpoint Fleet ({devices.length})
        </button>

        <button
          onClick={() => setActiveTab("quarantine")}
          className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
            activeTab === "quarantine"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
              : "text-slate-400 border-transparent hover:bg-white/5"
          }`}
        >
          <Lock className="w-4 h-4" />
          Quarantined Enclave ({quarantinedFiles.length})
        </button>

        <button
          onClick={() => setActiveTab("whitelist")}
          className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
            activeTab === "whitelist"
              ? "bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold"
              : "text-slate-400 border-transparent hover:bg-white/5"
          }`}
        >
          <EyeOff className="w-4 h-4" />
          Whitelist & Ignored Rules ({whitelistRules.length})
        </button>
      </div>

      {/* TAB 1: FLEET INVENTORY */}
      {activeTab === "fleet" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {devices.map((d) => (
            <div
              key={d.id}
              className="glass-panel p-5 rounded-2xl space-y-3 border border-white/10 hover:border-cyan-500/30 transition-all font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                  {d.network_id}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  d.criticality === "CRITICAL" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                  d.criticality === "HIGH" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                  "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                }`}>
                  {d.criticality}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">{d.hostname}</h4>
                <p className="text-cyan-400 text-xs mt-0.5">{d.ip_address}</p>
              </div>

              <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>OS:</span>
                  <span className="text-slate-200">{d.os_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {d.status || "Active"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: QUARANTINED ENCLAVE */}
      {activeTab === "quarantine" && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm font-mono">
                Isolated Threat Payloads in Enclave
              </h3>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
              EXECUTION PERMISSIONS STRIPPED
            </span>
          </div>

          {quarantinedFiles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              Secure enclave is clean. No active quarantined files.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {quarantinedFiles.map((qf, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-black/40 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{qf.filename}</span>
                      <span className="text-[10px] text-slate-500">({(qf.size_bytes / 1024).toFixed(1)} KB)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Destination: <code className="text-cyan-400">{qf.original_path}</code>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Quarantined At: {new Date(qf.quarantined_at).toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnquarantine(qf)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono flex items-center gap-1.5 transition-all self-start md:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Unquarantine / Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WHITELIST & IGNORED RULES */}
      {activeTab === "whitelist" && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-sm font-mono">
                Active Suppression & Whitelist Rules
              </h3>
            </div>
            <button
              onClick={() => setShowAddWhitelist(!showAddWhitelist)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Whitelist Rule
            </button>
          </div>

          {/* Add Whitelist Form */}
          {showAddWhitelist && (
            <div className="p-4 rounded-xl bg-black/60 border border-blue-500/40 space-y-3 font-mono text-xs">
              <div className="font-bold text-white text-xs">Create New Suppression Rule</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">File Path or Name:</label>
                  <input
                    type="text"
                    value={newRulePath}
                    onChange={(e) => setNewRulePath(e.target.value)}
                    placeholder="e.g. backup_task.bat or C:\Projects\..."
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Duration Type:</label>
                  <select
                    value={newRuleDuration}
                    onChange={(e: any) => setNewRuleDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="temporary">Temporary (1 Hour Session)</option>
                    <option value="permanent">Permanent (Add to Whitelist)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Justification Reason:</label>
                <input
                  type="text"
                  value={newRuleReason}
                  onChange={(e) => setNewRuleReason(e.target.value)}
                  placeholder="e.g. Approved sysadmin deployment tool"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowAddWhitelist(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWhitelist}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Save Rule
                </button>
              </div>
            </div>
          )}

          {whitelistRules.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono text-xs">
              No active whitelist rules. All risky files will generate alerts.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {whitelistRules.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{w.file_name || w.file_path}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {w.duration === "permanent" ? "PERMANENT" : "1 HOUR"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">Path: <code>{w.file_path}</code></div>
                    <div className="text-[10px] text-slate-500">Reason: {w.reason}</div>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Expires: {w.expires_at ? new Date(w.expires_at).toLocaleTimeString() : "Never"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FleetFimView;
