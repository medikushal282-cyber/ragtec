import React, { useState, useEffect } from "react";
import { 
  FileSearch, 
  Upload, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  FileCode2, 
  Zap, 
  Layers, 
  CheckCircle2, 
  AlertOctagon,
  ArrowRight,
  RefreshCw,
  Eye,
  Key,
  Cpu,
  Lock,
  Unlock,
  Wrench,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Sliders,
  FolderOpen
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

interface FileThreatScannerProps {
  onNavigateToMitigation?: (threatDetails?: any) => void;
}

export const FileThreatScannerView: React.FC<FileThreatScannerProps> = ({ onNavigateToMitigation }) => {
  const [activeTab, setActiveTab] = useState<"workspace_scan" | "single_file">("workspace_scan");

  // Groq API Key & Model Configuration
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("ragsec_groq_api_key") || "");
  const [selectedModel, setSelectedModel] = useState<string>("llama-3.3-70b-versatile");
  const [availableModels, setAvailableModels] = useState<string[]>([
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "deepseek-r1-distill-llama-70b",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
  ]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryMsg, setDiscoveryMsg] = useState<string | null>(null);
  const [useTools, setUseTools] = useState<boolean>(true);

  // Workspace Scan State
  const [isScanningWorkspace, setIsScanningWorkspace] = useState(false);
  const [workspaceScanResult, setWorkspaceScanResult] = useState<any>(null);
  const [selectedFileReport, setSelectedFileReport] = useState<any>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Single File State
  const [fileName, setFileName] = useState("ransomware_simulation.txt");
  const [fileContent, setFileContent] = useState(
    `WARNING: All your enterprise files have been encrypted using AES-256 and RSA-4096.
Command executed: vssadmin delete shadows /all /quiet
wmic shadowcopy delete
Do not restart your computer or attempt recovery.
Contact key recovery: blacksuit_decryptor@onion.mail`
  );
  const [isScanningSingle, setIsScanningSingle] = useState(false);
  const [singleScanResult, setSingleScanResult] = useState<any>(null);
  const [singleErrorMsg, setSingleErrorMsg] = useState<string | null>(null);

  const sampleFiles = [
    {
      name: "ransomware_simulation.txt",
      content: `WARNING: All your enterprise files have been encrypted using AES-256 and RSA-4096.\nCommand executed: vssadmin delete shadows /all /quiet\nwmic shadowcopy delete\nContact key recovery: blacksuit_decryptor@onion.mail`,
      label: "Ransomware Extortion Note"
    },
    {
      name: "malware_simulation.exe",
      content: `MZ... This program cannot be run in DOS mode.\nVirtualAlloc CreateRemoteThread WriteProcessMemory cmd.exe /c powershell -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=`,
      label: "Process Injection Binary"
    },
    {
      name: "web_backdoor.php",
      content: `<?php\n// Obfuscated Web Shell\nif(isset($_POST['cmd'])){\n  $cmd = $_POST['cmd'];\n  eval(base64_decode($cmd));\n  system($cmd);\n  passthru($cmd);\n}\n?>`,
      label: "PHP Web Backdoor"
    },
    {
      name: "suspicious_script.ps1",
      content: `# Advanced reconnaissance and privilege escalation script\n$bytes = [System.Convert]::FromBase64String('R2V0LVdtaU9iamVjdCBXaW4zMl9Vc2VyQWNjb3VudA==')\n$cmd = [System.Text.Encoding]::Unicode.GetString($bytes)\nInvoke-Expression $cmd\nInvoke-Mimikatz -DumpCreds`,
      label: "Obfuscated Mimikatz Dropper"
    },
    {
      name: "normal_document.txt",
      content: `Q3 Financial Strategy Report\n\nAll quarterly projections are aligned with executive targets.\nStandard operational review scheduled for Monday at 10:00 AM.\nDocument signed and verified by Finance Lead.`,
      label: "Benign Corporate Document"
    }
  ];

  // Save API key to localStorage
  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem("ragsec_groq_api_key", val);
  };

  // Discover Models via Groq API
  const handleDiscoverModels = async () => {
    setIsDiscovering(true);
    setDiscoveryMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/models/discover?provider=groq&api_key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          const modelIds = data.models.map((m: any) => (typeof m === "string" ? m : m.id));
          setAvailableModels(modelIds);
          if (data.default_model) setSelectedModel(data.default_model);
          setDiscoveryMsg(`Successfully discovered ${modelIds.length} active Groq models!`);
        } else {
          setDiscoveryMsg(data.message || "Loaded curated models catalog.");
        }
      } else {
        setDiscoveryMsg("Model discovery request failed. Check API key.");
      }
    } catch (e: any) {
      setDiscoveryMsg(`Discovery error: ${e.message}`);
    } finally {
      setIsDiscovering(false);
      setTimeout(() => setDiscoveryMsg(null), 5000);
    }
  };

  // Run Batch Workspace Scan with Groq Agent + Tools
  const handleRunWorkspaceScan = async () => {
    setIsScanningWorkspace(true);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analysis/scan-workspace-groq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey || undefined,
          model: selectedModel,
          use_tools: useTools
        })
      });

      if (res.ok) {
        const data = await res.json();
        setWorkspaceScanResult(data);
        setActionSuccessMsg(`Batch scan completed: ${data.threats_detected} threats flagged as UNSAFE out of ${data.total_files} files.`);
      } else {
        setActionSuccessMsg("Scan failed. Backend returned error status.");
      }
    } catch (e: any) {
      setActionSuccessMsg(`Scan failed: ${e.message}`);
    } finally {
      setIsScanningWorkspace(false);
      setTimeout(() => setActionSuccessMsg(null), 6000);
    }
  };

  // Auto-scan on first mount
  useEffect(() => {
    handleRunWorkspaceScan();
  }, []);

  // Quarantine Action
  const handleQuarantineFile = async (filePath: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/quarantine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: filePath })
      });
      if (res.ok) {
        setActionSuccessMsg(`Successfully quarantined "${filePath}" to .quarantine/ enclave.`);
        handleRunWorkspaceScan();
      }
    } catch (e: any) {
      console.error("Quarantine error:", e);
    }
  };

  // Single File Scan
  const handleRunSingleScan = async () => {
    if (!fileContent.trim()) return;
    setIsScanningSingle(true);
    setSingleErrorMsg(null);

    try {
      const b64 = btoa(unescape(encodeURIComponent(fileContent)));
      const res = await fetch(`${API_BASE_URL}/api/analysis/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: fileName || "unknown_file.txt",
          content_b64: b64,
          data_source: "live"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSingleScanResult(data);
      } else {
        setSingleErrorMsg("Scan failed. Backend returned error.");
      }
    } catch (e: any) {
      setSingleErrorMsg(`Error: ${e.message}`);
    } finally {
      setIsScanningSingle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <h2 className="text-xl font-bold text-white font-mono">
              Groq AI Workspace Threat Detection & Tool-Calling Agent
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Autonomous Space-Wide File Inspection • Live Groq Model Execution • Real-Time Tool Calling • Deterministic Heuristics
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab("workspace_scan")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "workspace_scan"
                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Workspace Batch Scanner
          </button>
          <button
            onClick={() => setActiveTab("single_file")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "single_file"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Single File Inspector
          </button>
        </div>
      </div>

      {/* Groq API Key & Model Configuration Panel */}
      <div className="glass-panel p-5 rounded-2xl space-y-4 font-mono text-xs border-l-4 border-l-amber-500">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-sm">Groq AI Engine Configuration</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Tool Calling Enabled
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {apiKey ? "API Key Configured • Ready for High-Speed Inference" : "Enter key to use live Groq LLaMA-3.3 / DeepSeek models"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key Input */}
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Groq API Key (starts with gsk_):</label>
            <div className="flex gap-1.5">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="gsk_..."
                className="flex-1 bg-black/60 border border-white/15 px-3 py-2 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleDiscoverModels}
                disabled={isDiscovering}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 shrink-0"
                title="Validate key and query live Groq models catalog"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? "animate-spin" : ""}`} />
                <span>Discover</span>
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Select Groq Model:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-black/60 border border-white/15 px-3 py-2 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
            >
              {availableModels.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Tool Calling Toggle & Trigger */}
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-black/40 border border-white/10 px-3 py-2 rounded-xl h-[38px] flex-1 select-none">
              <input
                type="checkbox"
                checked={useTools}
                onChange={(e) => setUseTools(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-200">Agent Tools (Entropy, CTI, Decoder)</span>
            </label>

            <button
              onClick={handleRunWorkspaceScan}
              disabled={isScanningWorkspace}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 h-[38px] shadow-lg shadow-rose-950/40 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningWorkspace ? "animate-spin" : ""}`} />
              <span>{isScanningWorkspace ? "Scanning Space..." : "Scan Workspace"}</span>
            </button>
          </div>
        </div>

        {discoveryMsg && (
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{discoveryMsg}</span>
          </div>
        )}
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-mono flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: WORKSPACE BATCH SCANNER */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "workspace_scan" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="glass-panel p-4 space-y-1 rounded-xl border-l-4 border-l-cyan-500">
              <span className="text-slate-400 text-[10px] uppercase">Monitored Space</span>
              <div className="text-sm font-bold text-white truncate">monitored_workspace/</div>
              <span className="text-[11px] text-cyan-400">Total: {workspaceScanResult?.total_files || 0} Files</span>
            </div>

            <div className="glass-panel p-4 space-y-1 rounded-xl border-l-4 border-l-rose-500">
              <span className="text-slate-400 text-[10px] uppercase">Threats Detected</span>
              <div className="text-2xl font-bold text-rose-400">{workspaceScanResult?.threats_detected || 0}</div>
              <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">UNSAFE • ACTION REQUIRED</span>
            </div>

            <div className="glass-panel p-4 space-y-1 rounded-xl border-l-4 border-l-emerald-500">
              <span className="text-slate-400 text-[10px] uppercase">Clean Files</span>
              <div className="text-2xl font-bold text-emerald-400">{workspaceScanResult?.clean_files || 0}</div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">VERIFIED SAFE</span>
            </div>

            <div className="glass-panel p-4 space-y-1 rounded-xl border-l-4 border-l-amber-500">
              <span className="text-slate-400 text-[10px] uppercase">Threat Posture Index</span>
              <div className="text-xl font-bold text-amber-400">{workspaceScanResult?.threat_index || "ANALYZING"}</div>
              <span className="text-[10px] text-slate-400">Model: {workspaceScanResult?.model_used || selectedModel}</span>
            </div>
          </div>

          {/* Results Table */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Space Files Threat Analysis Results</h3>
              </div>
              <span className="text-slate-400 text-[11px]">
                Analyzed with: <strong className="text-amber-300">{workspaceScanResult?.provider || "Groq Agent"}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="px-3">Verdict</th>
                    <th className="px-3">Threat Category</th>
                    <th className="px-3">Severity & Risk</th>
                    <th className="px-3">Entropy</th>
                    <th className="px-3">Detected Indicators</th>
                    <th className="px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(!workspaceScanResult || !workspaceScanResult.files || workspaceScanResult.files.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        {isScanningWorkspace ? "Groq AI Threat Agent is inspecting all files in workspace..." : "No files scanned yet. Click 'Scan Workspace'."}
                      </td>
                    </tr>
                  ) : (
                    workspaceScanResult.files.map((f: any, idx: number) => {
                      const isUnsafe = f.verdict === "UNSAFE" || f.is_threat;

                      return (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-200">{f.filename}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{f.sha256?.substring(0, 18)}...</div>
                          </td>

                          <td className="px-3">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider border flex items-center gap-1 w-fit ${
                              isUnsafe
                                ? "bg-rose-600 text-white border-rose-400 shadow-sm shadow-rose-950/50"
                                : "bg-emerald-600 text-white border-emerald-400"
                            }`}>
                              {isUnsafe ? <AlertOctagon className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                              {isUnsafe ? "UNSAFE" : "SAFE"}
                            </span>
                          </td>

                          <td className="px-3">
                            <span className={`font-semibold ${isUnsafe ? "text-rose-300" : "text-emerald-400"}`}>
                              {f.threat_category || (isUnsafe ? "Threat" : "Benign")}
                            </span>
                          </td>

                          <td className="px-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                                f.severity === "CRITICAL" ? "bg-rose-950 text-rose-300 border border-rose-500/50" :
                                f.severity === "HIGH" ? "bg-amber-950 text-amber-300 border border-amber-500/50" :
                                "bg-slate-900 text-slate-400 border border-slate-700"
                              }`}>
                                {f.severity}
                              </span>
                              <span className="text-[11px] text-slate-300 font-bold">{f.risk_score}/100</span>
                            </div>
                          </td>

                          <td className="px-3 text-slate-400 text-xs">
                            {f.entropy ? f.entropy.toFixed(2) : "N/A"}
                          </td>

                          <td className="px-3">
                            {f.flagged_indicators && f.flagged_indicators.length > 0 ? (
                              <div className="space-y-0.5 max-w-xs">
                                <div className="text-rose-400 text-[11px] truncate font-medium">
                                  {f.flagged_indicators[0]}
                                </div>
                                {f.flagged_indicators.length > 1 && (
                                  <div className="text-[10px] text-slate-500">
                                    +{f.flagged_indicators.length - 1} more indicators
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">—</span>
                            )}
                          </td>

                          <td className="px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedFileReport(f)}
                                className="px-2.5 py-1 rounded bg-black/40 hover:bg-black/60 border border-white/10 text-cyan-300 text-[11px] flex items-center gap-1 transition-all"
                                title="View full AI rationale and forensic evidence"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Report</span>
                              </button>

                              {isUnsafe && (
                                <button
                                  onClick={() => handleQuarantineFile(f.filepath || f.filename)}
                                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                                  title="Quarantine file into secure enclave"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Quarantine</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: SINGLE FILE INSPECTOR */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "single_file" && (
        <div className="space-y-6">
          {/* Preset Quick Test Scenarios */}
          <div className="glass-panel p-4 rounded-xl flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-slate-400 text-[11px] mr-2">Quick Test Artifacts:</span>
            {sampleFiles.map((sf, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setFileName(sf.name);
                  setFileContent(sf.content);
                  setSingleScanResult(null);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  fileName === sf.name
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-slate-200"
                }`}
              >
                {sf.name} ({sf.label})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
            {/* Left Column: Input */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Static File Content Buffer</h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  File: <strong className="text-cyan-300">{fileName}</strong>
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Target Filename:</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">File Code / Text Contents:</label>
                  <textarea
                    rows={10}
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleRunSingleScan}
                  disabled={isScanningSingle}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-mono text-xs shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 transition-all"
                >
                  {isScanningSingle ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Run Safe Static Threat Inspection
                </button>
              </div>
            </div>

            {/* Right Column: Scan Result Card */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Static Threat Analysis & Flagging Report</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  NON-EXECUTING
                </span>
              </div>

              {!singleScanResult && !isScanningSingle && (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <FileSearch className="w-10 h-10 mx-auto opacity-40 text-cyan-400" />
                  <p>No file scanned yet.</p>
                  <p className="text-[11px]">Click "Run Safe Static Threat Inspection" or select a quick test artifact above.</p>
                </div>
              )}

              {isScanningSingle && (
                <div className="py-16 text-center text-cyan-400 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
                  <p className="font-bold">Analyzing file byte patterns, regex rules, and entropy...</p>
                </div>
              )}

              {singleScanResult && !isScanningSingle && (() => {
                const isThreat = 
                  singleScanResult.threat_state === "THREAT" || 
                  singleScanResult.classification === "THREAT" || 
                  (singleScanResult.threat_category && !["benign", "safe", "n/a", "unknown"].includes(singleScanResult.threat_category.toLowerCase())) ||
                  (singleScanResult.severity && ["critical", "high", "medium"].includes(singleScanResult.severity.toLowerCase())) ||
                  (singleScanResult.risk_score && singleScanResult.risk_score >= 50) ||
                  (singleScanResult.deterministic_signals && singleScanResult.deterministic_signals.length > 0);

                const isUnknown = !isThreat && (singleScanResult.threat_state === "UNKNOWN" || singleScanResult.classification === "UNKNOWN");

                return (
                  <div className="space-y-4">
                    {/* Classification Banner */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      isThreat
                        ? "bg-rose-950/60 border-rose-500/70 text-rose-200 shadow-lg shadow-rose-950/50"
                        : isUnknown
                        ? "bg-amber-950/60 border-amber-500/70 text-amber-200"
                        : "bg-emerald-950/60 border-emerald-500/70 text-emerald-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        {isThreat ? (
                          <AlertOctagon className="w-7 h-7 text-rose-400 shrink-0" />
                        ) : isUnknown ? (
                          <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-sm flex items-center gap-2">
                            <span className={isThreat ? "text-rose-300" : isUnknown ? "text-amber-300" : "text-emerald-300"}>
                              STATUS: {isThreat ? "UNSAFE • THREAT DETECTED" : isUnknown ? "UNKNOWN" : "VERIFIED SAFE"}
                            </span>
                            {singleScanResult.threat_category && singleScanResult.threat_category !== "N/A" && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-black/50 border border-white/20 text-white font-mono">
                                {singleScanResult.threat_category}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            Severity: <span className={`uppercase font-bold ${isThreat ? "text-rose-400" : ""}`}>{singleScanResult.severity}</span> • Risk Score: <span className="font-bold">{singleScanResult.risk_score || (isThreat ? 95 : 10)}/100</span> • SHA-256: {singleScanResult.sha256?.substring(0, 16)}...
                          </div>
                        </div>
                      </div>

                      <span className={`text-xs px-3 py-1.5 rounded font-mono font-bold tracking-wider border ${
                        isThreat
                          ? "bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30"
                          : isUnknown
                          ? "bg-amber-600 text-white border-amber-400"
                          : "bg-emerald-600 text-white border-emerald-400"
                      }`}>
                        {isThreat ? "UNSAFE" : isUnknown ? "UNKNOWN" : "VERIFIED SAFE"}
                      </span>
                    </div>

                    {/* Detection Rationale */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1 text-slate-300 text-xs">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Detection Rationale:</div>
                      <p className="font-sans leading-relaxed">{singleScanResult.rationale}</p>
                    </div>

                    {/* Flagged Signals */}
                    {singleScanResult.deterministic_signals && singleScanResult.deterministic_signals.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-slate-400 text-[11px] font-bold uppercase flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          Flagged Behavioral Code Signals ({singleScanResult.deterministic_signals.length}):
                        </div>
                        <div className="space-y-1.5">
                          {singleScanResult.deterministic_signals.map((sig: any, sIdx: number) => (
                            <div key={sIdx} className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-200 flex items-start justify-between gap-2 text-[11px]">
                              <div>
                                <span className="font-bold text-rose-300">Line {sig.line_no}:</span> {sig.label}
                                {sig.line_content && (
                                  <code className="block mt-1 text-[10px] text-slate-400 bg-black/40 p-1 rounded">
                                    {sig.line_content}
                                  </code>
                                )}
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold">
                                Weight: {sig.severity_weight}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* FULL FORENSIC REPORT MODAL */}
      {/* ------------------------------------------------------------------- */}
      {selectedFileReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 font-mono text-xs border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">
                  Forensic Threat Report: {selectedFileReport.filename}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFileReport(null)}
                className="px-2.5 py-1 rounded bg-black/40 hover:bg-black/60 text-slate-400 hover:text-white border border-white/10"
              >
                ✕ Close
              </button>
            </div>

            {/* Verdict Badge Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              selectedFileReport.is_threat
                ? "bg-rose-950/60 border-rose-500 text-rose-200"
                : "bg-emerald-950/60 border-emerald-500 text-emerald-200"
            }`}>
              <div>
                <div className="font-bold text-sm">
                  VERDICT: {selectedFileReport.verdict} ({selectedFileReport.threat_category})
                </div>
                <div className="text-[11px] opacity-80">
                  Severity: {selectedFileReport.severity} • Confidence: {(selectedFileReport.confidence * 100).toFixed(1)}% • Analyzed By: {selectedFileReport.analyzed_by}
                </div>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-bold ${
                selectedFileReport.is_threat ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
              }`}>
                {selectedFileReport.verdict}
              </span>
            </div>

            {/* Summary */}
            <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10">
              <span className="text-slate-400 font-bold uppercase text-[10px]">AI Technical Summary & Rationale:</span>
              <p className="text-slate-200 leading-relaxed font-sans">{selectedFileReport.summary}</p>
            </div>

            {/* Flagged Indicators */}
            {selectedFileReport.flagged_indicators && selectedFileReport.flagged_indicators.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Flagged Indicators:</span>
                <div className="space-y-1">
                  {selectedFileReport.flagged_indicators.map((ind: string, iIdx: number) => (
                    <div key={iIdx} className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px]">
                      • {ind}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Mitigation */}
            <div className="space-y-1 bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl text-amber-200">
              <span className="text-amber-400 font-bold uppercase text-[10px]">Recommended Mitigation:</span>
              <p className="font-sans leading-relaxed">{selectedFileReport.mitigation_action}</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              {selectedFileReport.is_threat && (
                <button
                  onClick={() => {
                    handleQuarantineFile(selectedFileReport.filepath || selectedFileReport.filename);
                    setSelectedFileReport(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Quarantine This File</span>
                </button>
              )}
              <button
                onClick={() => setSelectedFileReport(null)}
                className="px-4 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-white"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileThreatScannerView;
