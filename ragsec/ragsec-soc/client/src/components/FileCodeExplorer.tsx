import React, { useState, useEffect } from "react";
import { 
  FileCode2, 
  FileText, 
  Copy, 
  Cpu,
  RefreshCw,
  AlertOctagon,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  HardDrive
} from "lucide-react";
import { DemoScenarioArtifact, SYNTHETIC_DEMO_ARTIFACTS } from "../services/demoEngine";

const API_BASE_URL = "http://127.0.0.1:8000";

interface FileCodeExplorerProps {
  selectedFile?: DemoScenarioArtifact | null;
  onSelectArtifact?: (artifact: DemoScenarioArtifact) => void;
}

export const FileCodeExplorer: React.FC<FileCodeExplorerProps> = ({
  selectedFile,
  onSelectArtifact
}) => {
  const [workspaceFiles, setWorkspaceFiles] = useState<DemoScenarioArtifact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFile, setActiveFile] = useState<DemoScenarioArtifact | null>(selectedFile || null);
  const [copied, setCopied] = useState(false);

  const fetchWorkspaceFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/workspace-files`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.files) && data.files.length > 0) {
          setWorkspaceFiles(data.files);
          if (!selectedFile) {
            setActiveFile(data.files[0]);
          }
          return;
        }
      }
      // Fallback if API returns empty
      const fallbackList = Object.values(SYNTHETIC_DEMO_ARTIFACTS);
      setWorkspaceFiles(fallbackList);
      if (!selectedFile) setActiveFile(fallbackList[0]);
    } catch (err) {
      console.warn("Failed to fetch live workspace files, using baseline:", err);
      const fallbackList = Object.values(SYNTHETIC_DEMO_ARTIFACTS);
      setWorkspaceFiles(fallbackList);
      if (!selectedFile) setActiveFile(fallbackList[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceFiles();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      setActiveFile(selectedFile);
    }
  }, [selectedFile]);

  const displayedList = workspaceFiles.length > 0 ? workspaceFiles : Object.values(SYNTHETIC_DEMO_ARTIFACTS);
  const currentActive = activeFile || displayedList[0];

  const handleCopy = () => {
    if (currentActive?.content) {
      navigator.clipboard.writeText(currentActive.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelect = (art: DemoScenarioArtifact) => {
    setActiveFile(art);
    if (onSelectArtifact) {
      onSelectArtifact(art);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SAFE":
      case "BENIGN":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "SUSPICIOUS":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "THREAT":
        return "bg-rose-500/20 text-rose-200 border-rose-500/50 font-bold critical-glow";
      default:
        return "bg-white/10 text-slate-300 border-white/20";
    }
  };

  const defensiveIndicators = currentActive?.defensive_indicators || {
    persistence_mechanisms: false,
    credential_access: false,
    obfuscated_code: false,
    network_comms: false,
    destructive_file_ops: false,
    suspicious_process_exec: false
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base font-mono">
            AI File Code Explorer & Workspace Inspector
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchWorkspaceFiles}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Scan monitored_workspace/ directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Scanning..." : "Rescan Workspace"}</span>
          </button>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
            LIVE DISK INSPECTION
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              Monitored Workspace Files ({displayedList.length})
            </h4>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {displayedList.map((art) => {
              const isSelected = (currentActive?.id === art.id) || (currentActive?.file_name === art.file_name);
              return (
                <button
                  key={art.id || art.file_name}
                  onClick={() => handleSelect(art)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-500/50 text-white shadow-md shadow-cyan-950/20"
                      : "bg-black/40 border-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="font-bold text-cyan-400 truncate max-w-[170px]">{art.file_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border ${getStatusBadge(art.threat_status)}`}>
                      {art.threat_status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{art.file_path}</div>
                  {art.risk_score !== undefined && (
                    <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-between">
                      <span>Risk: <strong className={art.risk_score > 60 ? "text-rose-400" : "text-emerald-400"}>{art.risk_score}/100</strong></span>
                      <span>{(art.size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code & Analysis Details */}
        <div className="lg:col-span-2 space-y-5">
          {currentActive && (
            <>
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white">{currentActive.file_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded font-bold text-xs uppercase border ${getStatusBadge(currentActive.threat_status)}`}>
                      {currentActive.threat_status} — {currentActive.category}
                    </span>
                    <span className="text-slate-400">({currentActive.confidence || 95}% Conf)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400 border-t border-white/5">
                  <div className="truncate">Path: <code className="text-cyan-400" title={currentActive.file_path}>{currentActive.file_path}</code></div>
                  <div>Size: <strong className="text-white">{(currentActive.size_bytes / 1024).toFixed(1)} KB</strong></div>
                  <div className="truncate">SHA256: <code className="text-cyan-400" title={currentActive.sha256_hash}>{currentActive.sha256_hash ? currentActive.sha256_hash.substring(0, 16) + "..." : "N/A"}</code></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                    Static Content Inspection (Read-Only)
                  </span>
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3 text-cyan-400" />
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-xs text-cyan-300 h-48 overflow-y-auto whitespace-pre-wrap select-text">
                  {currentActive.content || "// [Binary or empty file content]"}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  AI Defensive Indicator Scan
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    { label: "Persistence Mechanisms", key: "persistence_mechanisms" },
                    { label: "Credential Access Patterns", key: "credential_access" },
                    { label: "Obfuscated / Suspicious Code", key: "obfuscated_code" },
                    { label: "Network Communication", key: "network_comms" },
                    { label: "Destructive File Operations", key: "destructive_file_ops" },
                    { label: "Suspicious Process Exec", key: "suspicious_process_exec" }
                  ].map((ind) => {
                    const isDetected = Boolean((defensiveIndicators as any)[ind.key]);
                    return (
                      <div
                        key={ind.key}
                        className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          isDetected
                            ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                            : "bg-white/5 border-white/5 text-slate-400"
                        }`}
                      >
                        <span>{ind.label}</span>
                        {isDetected ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 font-bold">DETECTED</span>
                        ) : (
                          <span className="text-[10px] text-slate-500">CLEAR</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCodeExplorer;
