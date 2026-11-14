import React, { useState, useEffect } from "react";
import { 
  FileCode2, 
  FileText, 
  Copy, 
  Cpu,
  RefreshCw,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Trash2,
  Lock,
  Clock,
  History,
  Check,
  Search,
  Eye,
  Sliders,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { DemoScenarioArtifact, SYNTHETIC_DEMO_ARTIFACTS } from "../services/demoEngine";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface WorkspaceFileItem extends DemoScenarioArtifact {
  created_at?: string;
  modified_at?: string;
  is_safe?: boolean;
  can_quarantine?: boolean;
  can_delete?: boolean;
  risk_score?: number;
  crud_operations?: Array<{
    event_id?: string;
    action: string;
    timestamp: string;
    process?: string;
    threat_status?: string;
  }>;
}

interface FileCodeExplorerProps {
  selectedFile?: DemoScenarioArtifact | null;
  onSelectArtifact?: (artifact: DemoScenarioArtifact) => void;
  onFileQuarantined?: (filePath: string) => void;
  onFileDeleted?: (filePath: string) => void;
}

export const FileCodeExplorer: React.FC<FileCodeExplorerProps> = ({
  selectedFile,
  onSelectArtifact,
  onFileQuarantined,
  onFileDeleted
}) => {
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFile, setActiveFile] = useState<WorkspaceFileItem | null>(
    (selectedFile as WorkspaceFileItem) || null
  );
  const [copied, setCopied] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);
  const [fileFilter, setFileFilter] = useState<"ALL" | "SAFE" | "THREATS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const fetchWorkspaceFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/workspace-files`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.files) && data.files.length > 0) {
          setWorkspaceFiles(data.files);
          if (!activeFile) {
            setActiveFile(data.files[0]);
          } else {
            const updatedActive = data.files.find((f: any) => f.file_name === activeFile.file_name);
            if (updatedActive) {
              setActiveFile(updatedActive);
            }
          }
          return;
        }
      }
      const fallbackList = Object.values(SYNTHETIC_DEMO_ARTIFACTS) as WorkspaceFileItem[];
      setWorkspaceFiles(fallbackList);
      if (!activeFile) setActiveFile(fallbackList[0]);
    } catch (err) {
      console.warn("Failed to fetch live workspace files, using baseline:", err);
      const fallbackList = Object.values(SYNTHETIC_DEMO_ARTIFACTS) as WorkspaceFileItem[];
      setWorkspaceFiles(fallbackList);
      if (!activeFile) setActiveFile(fallbackList[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceFiles();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      setActiveFile(selectedFile as WorkspaceFileItem);
      setConfirmDelete(false);
    }
  }, [selectedFile]);

  const displayedList = workspaceFiles
    .filter((f) => {
      const matchesSearch = 
        f.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.category && f.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.file_path && f.file_path.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      if (fileFilter === "SAFE") return f.is_safe === true || f.threat_status === "SAFE" || (f.threat_status as string) === "BENIGN";
      if (fileFilter === "THREATS") return f.is_safe === false || f.threat_status === "THREAT" || f.threat_status === "SUSPICIOUS";
      return true;
    });

  const currentActive = activeFile || displayedList[0] || (workspaceFiles[0] as WorkspaceFileItem);

  const handleCopy = () => {
    if (currentActive?.content) {
      navigator.clipboard.writeText(currentActive.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopySha = () => {
    if (currentActive?.sha256_hash) {
      navigator.clipboard.writeText(currentActive.sha256_hash);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }
  };

  const handleSelect = (art: WorkspaceFileItem) => {
    setActiveFile(art);
    setConfirmDelete(false);
    if (onSelectArtifact) {
      onSelectArtifact(art);
    }
  };

  const handleQuarantine = async () => {
    if (!currentActive) return;
    const targetPath = currentActive.file_path;
    setActionLoading("quarantine");
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/quarantine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: targetPath, filePath: targetPath })
      });
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        toast.success(`Quarantined: ${currentActive.file_name} isolated in secure enclave.`);
        if (onFileQuarantined) onFileQuarantined(targetPath);
        await fetchWorkspaceFiles();
      } else {
        toast.error(`Quarantine failed: ${data.detail || "Unknown error"}`);
      }
    } catch (err: any) {
      toast.error(`Quarantine error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!currentActive) return;
    const targetPath = currentActive.file_path;
    setActionLoading("delete");
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: targetPath, filePath: targetPath, file_name: currentActive.file_name })
      });
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        toast.success(`Removed: ${currentActive.file_name} permanently deleted.`);
        setConfirmDelete(false);
        if (onFileDeleted) onFileDeleted(targetPath);
        await fetchWorkspaceFiles();
        setActiveFile(null);
      } else {
        toast.error(`Delete failed: ${data.detail || "Unknown error"}`);
      }
    } catch (err: any) {
      toast.error(`Delete error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunScan = async () => {
    if (!currentActive) return;
    setActionLoading("scan");
    try {
      const res = await fetch(`${API_BASE_URL}/api/analysis/scan-file-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: currentActive.file_path })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Scan Complete: ${data.classification} (${data.severity?.toUpperCase()})`);
        await fetchWorkspaceFiles();
      } else {
        toast.error("Deep scan failed.");
      }
    } catch (e: any) {
      toast.error(`Scan error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const isCurrentThreat = currentActive?.threat_status === "THREAT" || currentActive?.is_safe === false;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 apple-display">
                Monitored Workspace Inventory
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                  REAL-TIME FIM
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Directory: <code className="text-cyan-300 font-mono">monitored_workspace/</code> • Live CRUD operations, byte integrity & safe preview
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
          <button
            onClick={fetchWorkspaceFiles}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Scanning..." : "Sync Workspace"}</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Workspace Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Master File List (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-4 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-3">
          {/* Filter Pills & Search */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Files ({displayedList.length})
              </span>

              {/* Segmented Filter Pills */}
              <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/10 text-[11px] font-mono">
                <button
                  onClick={() => setFileFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    fileFilter === "ALL" ? "bg-white/15 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFileFilter("SAFE")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    fileFilter === "SAFE" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Safe
                </button>
                <button
                  onClick={() => setFileFilter("THREATS")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    fileFilter === "THREATS" ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Threats
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files by name or type..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* File Items Scroll Area */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {displayedList.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-slate-500">
                <FolderOpen className="w-8 h-8 mx-auto opacity-30 text-cyan-400 mb-2" />
                No files found matching filter.
              </div>
            ) : (
              displayedList.map((art) => {
                const isSelected = (currentActive?.id === art.id) || (currentActive?.file_name === art.file_name);
                const isThreat = art.threat_status === "THREAT" || art.is_safe === false;

                return (
                  <button
                    key={art.id || art.file_name}
                    onClick={() => handleSelect(art)}
                    className={`w-full text-left p-3 rounded-xl border transition-all apple-button ${
                      isSelected
                        ? "bg-white/[0.08] border-white/20 text-white shadow-lg ring-1 ring-white/10"
                        : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <div className="flex items-center gap-2 truncate">
                        <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isThreat ? "text-rose-400" : "text-cyan-400"}`} />
                        <span className="font-semibold text-white truncate max-w-[170px]">{art.file_name}</span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold tracking-wider border ${
                        isThreat
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}>
                        {isThreat ? "UNSAFE" : "SAFE"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-white/5">
                      <span className="truncate max-w-[180px] text-slate-400">{art.category || (isThreat ? "Threat" : "Benign")}</span>
                      <span className="text-slate-400 shrink-0">{(art.size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: File Inspector, Code Preview & Remediation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {currentActive ? (
            <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-4">
              {/* Verdict Header Card */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isCurrentThreat
                  ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                  : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isCurrentThreat ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  }`}>
                    {isCurrentThreat ? <AlertOctagon className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base tracking-tight">{currentActive.file_name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold tracking-wider border ${
                        isCurrentThreat ? "bg-rose-600 text-white border-rose-400" : "bg-emerald-600 text-white border-emerald-400"
                      }`}>
                        {isCurrentThreat ? "UNSAFE THREAT" : "SAFE / BENIGN"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Category: <strong className="text-slate-200">{currentActive.category}</strong> • Risk: <strong className={isCurrentThreat ? "text-rose-400" : "text-emerald-400"}>{currentActive.risk_score ?? 0}/100</strong> • Severity: <strong className="text-slate-200">{currentActive.severity}</strong>
                    </p>
                  </div>
                </div>

                {/* Remediation Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
                  {/* Quarantine */}
                  <button
                    onClick={handleQuarantine}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm disabled:opacity-50"
                    title="Isolate file into .quarantine/ enclave"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{actionLoading === "quarantine" ? "Quarantining..." : "Quarantine"}</span>
                  </button>

                  {/* Delete */}
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      disabled={actionLoading !== null}
                      className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm disabled:opacity-50 ${
                        isCurrentThreat
                          ? "bg-rose-600 hover:bg-rose-500 text-white"
                          : "bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10"
                      }`}
                      title="Permanently remove file from workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isCurrentThreat ? "Remove Unsafe" : "Delete"}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-rose-500/40">
                      <span className="text-[10px] text-rose-300 font-bold px-1">Confirm?</span>
                      <button
                        onClick={handleDelete}
                        disabled={actionLoading !== null}
                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                      >
                        {actionLoading === "delete" ? "..." : "YES"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Re-scan */}
                  <button
                    onClick={handleRunScan}
                    disabled={actionLoading !== null}
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 apple-button disabled:opacity-50"
                    title="Run on-demand static inspection"
                  >
                    <Cpu className={`w-3.5 h-3.5 ${actionLoading === "scan" ? "animate-spin" : ""}`} />
                    <span>Scan</span>
                  </button>
                </div>
              </div>

              {/* Metadata telemetry strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-slate-400">
                <div className="truncate">
                  Path: <span className="text-cyan-300">{currentActive.file_path}</span>
                </div>
                <div>
                  Size: <strong className="text-white">{(currentActive.size_bytes / 1024).toFixed(1)} KB</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate">SHA: {currentActive.sha256_hash ? `${currentActive.sha256_hash.substring(0, 14)}...` : "N/A"}</span>
                  {currentActive.sha256_hash && (
                    <button onClick={handleCopySha} className="text-slate-400 hover:text-white" title="Copy SHA-256">
                      {copiedSha ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* macOS Style Code Inspection Viewer */}
              <div className="rounded-2xl border border-white/10 bg-black/70 overflow-hidden shadow-xl">
                {/* Window Chrome Header */}
                <div className="px-4 py-2.5 bg-neutral-900/80 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-mono text-slate-400 ml-2">
                      {currentActive.file_name} (Read-Only Buffer)
                    </span>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono flex items-center gap-1 apple-button transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    <span>{copied ? "Copied" : "Copy Buffer"}</span>
                  </button>
                </div>

                {/* Code Contents Area */}
                <pre className="p-4 font-mono text-xs text-slate-200 h-52 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
                  {currentActive.content || "// [Binary or empty file content]"}
                </pre>
              </div>

              {/* CRUD Activity History */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    CRUD Activity & FIM Operations
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Created: {currentActive.created_at ? new Date(currentActive.created_at).toLocaleString() : "Baseline"}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 font-mono">
                  {currentActive.crud_operations && currentActive.crud_operations.length > 0 ? (
                    currentActive.crud_operations.map((op, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            op.action === "CREATED" ? "bg-blue-500/20 text-blue-300" :
                            op.action === "MODIFIED" ? "bg-amber-500/20 text-amber-300" :
                            op.action === "DELETED" ? "bg-rose-500/20 text-rose-300" :
                            op.action === "QUARANTINED" ? "bg-purple-500/20 text-purple-300" :
                            "bg-cyan-500/20 text-cyan-300"
                          }`}>
                            {op.action}
                          </span>
                          <span className="text-slate-300">by {op.process || "fim_watcher"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                          <span>{op.timestamp ? new Date(op.timestamp).toLocaleTimeString() : "Recent"}</span>
                          <span className={op.threat_status === "THREAT" ? "text-rose-400 font-bold" : "text-emerald-400"}>
                            {op.threat_status || "SAFE"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500 italic py-1">
                      Zero malicious mutations recorded. Kernel watcher confirms clean integrity.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-xs font-mono text-slate-500 glass-panel rounded-2xl border border-dashed border-white/10">
              Select a file from the inventory to inspect its byte content, safety verdict, and CRUD telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCodeExplorer;
