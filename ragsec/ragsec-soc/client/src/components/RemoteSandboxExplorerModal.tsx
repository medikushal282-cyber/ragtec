import React, { useState, useEffect } from "react";
import { 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  FileCode2, 
  FileText, 
  FileSearch, 
  Folder, 
  ChevronRight, 
  X, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink,
  Laptop,
  Terminal,
  Database,
  ArrowLeft,
  File
} from "lucide-react";
import { toast } from "sonner";
import { DeviceItem } from "./FleetFimView";

const API_BASE_URL = "http://127.0.0.1:8000";

interface SandboxFileItem {
  name: string;
  rel_path: string;
  size_bytes: number;
  modified_at: string;
  threat_status: "THREAT" | "SAFE" | "SUSPICIOUS";
  category?: string;
  risk_score?: number;
  sha256?: string;
  extension?: string;
}

interface SandboxDirectoryItem {
  name: string;
  rel_path: string;
  item_count: number;
  is_quarantine?: boolean;
}

interface RemoteSandboxExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceItem | null;
  initialSubpath?: string;
}

export function RemoteSandboxExplorerModal({
  isOpen,
  onClose,
  device,
  initialSubpath = ""
}: RemoteSandboxExplorerModalProps) {
  const [currentSubpath, setCurrentSubpath] = useState<string>(initialSubpath);
  const [directories, setDirectories] = useState<SandboxDirectoryItem[]>([]);
  const [files, setFiles] = useState<SandboxFileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; subpath: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parentPath, setParentPath] = useState<string | null>(null);

  // File Preview Modal State
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<any | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (isOpen && device) {
      fetchSandboxFiles(currentSubpath);
    }
  }, [isOpen, device, currentSubpath]);

  const fetchSandboxFiles = async (subpath: string) => {
    if (!device) return;
    setIsLoading(true);
    try {
      const url = `${API_BASE_URL}/api/fleet/endpoints/${encodeURIComponent(device.id)}/sandbox-files?subpath=${encodeURIComponent(subpath)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDirectories(data.directories || []);
        setFiles(data.files || []);
        setBreadcrumbs(data.breadcrumbs || []);
        setParentPath(data.parent_path);
      } else {
        const err = await res.json();
        toast.error(`Sandbox boundary error: ${err.detail || "Unable to read remote sandbox folder"}`);
      }
    } catch (e: any) {
      toast.error(`Connection error to endpoint sandbox: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFilePreview = async (file: SandboxFileItem) => {
    if (!device) return;
    setIsLoadingPreview(true);
    setSelectedFileForPreview(file);
    setPreviewContent("");
    try {
      const url = `${API_BASE_URL}/api/fleet/endpoints/${encodeURIComponent(device.id)}/sandbox-file-content?file_path=${encodeURIComponent(file.rel_path)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPreviewContent(data.content || "");
      } else {
        const err = await res.json();
        toast.error(`Security check blocked file access: ${err.detail || "Unauthorized"}`);
        setSelectedFileForPreview(null);
      }
    } catch (e: any) {
      toast.error(`Failed to load file content: ${e.message}`);
      setSelectedFileForPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.success("SHA-256 hash copied to clipboard.");
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (!isOpen || !device) return null;

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["py", "exe", "ps1", "sh", "bat", "dll"].includes(ext || "")) return FileCode2;
    if (["txt", "md", "json", "docx", "pdf", "xlsx"].includes(ext || "")) return FileText;
    return FileSearch;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="apple-panel max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-white/[0.12] text-xs max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">{device.hostname}</h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {device.ip_address}
                </span>
                <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  {device.os_type}
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-0.5 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Strictly Sandboxed to Project Root • All OS files outside sandbox are protected & inaccessible.</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSandboxFiles(currentSubpath)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E8E93] hover:text-white transition-all apple-button"
              title="Refresh remote sandbox directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/[0.08] text-[#8E8E93] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Boundary Alert Pill */}
        <div className="p-2.5 rounded-xl bg-blue-500/[0.06] border border-blue-500/20 flex items-center justify-between text-[11px] text-blue-300 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Zero-Trust Sandboxing Active:</strong> Viewing files strictly in <code>monitored_workspace/</code> of <strong>{device.hostname}</strong>.
            </span>
          </div>
          <span className="text-[10px] font-mono bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
            ENCLAVE ISOLATED
          </span>
        </div>

        {/* Breadcrumb Navigation Bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.05] text-[11px] flex-shrink-0">
          {parentPath !== null && (
            <button
              onClick={() => setCurrentSubpath(parentPath)}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-white flex items-center gap-1"
              title="Go up one folder"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[#636366]">/</span>}
                <button
                  onClick={() => setCurrentSubpath(b.subpath)}
                  className={`hover:text-blue-400 transition-colors font-mono ${
                    idx === breadcrumbs.length - 1 ? "text-white font-semibold" : "text-[#8E8E93]"
                  }`}
                >
                  {b.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Explorer Content Area: Directories + Files */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-[#8E8E93] text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <span>Contacting remote laptop agent and listing sandboxed files...</span>
            </div>
          ) : directories.length === 0 && files.length === 0 ? (
            <div className="py-16 text-center text-[#8E8E93] space-y-2">
              <Folder className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-white font-medium">Empty Sandbox Directory</p>
              <p className="text-[11px]">No files or directories present in this remote sandbox folder.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Folders Section */}
              {directories.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
                    Directories ({directories.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {directories.map((dir) => (
                      <div
                        key={dir.name}
                        onClick={() => setCurrentSubpath(dir.rel_path)}
                        className="p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.05] hover:border-blue-500/30 cursor-pointer transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Folder className={`w-4 h-4 flex-shrink-0 ${dir.is_quarantine ? "text-amber-400" : "text-blue-400"}`} />
                          <span className="font-semibold text-white text-xs truncate group-hover:text-blue-300 transition-colors">
                            {dir.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8E8E93] font-mono flex-shrink-0">
                          {dir.item_count} items
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Section */}
              {files.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
                    Files ({files.length})
                  </span>
                  <div className="space-y-1.5">
                    {files.map((file) => {
                      const Icon = getFileIcon(file.name);
                      const isThreat = file.threat_status === "THREAT";

                      return (
                        <div
                          key={file.name}
                          onClick={() => handleOpenFilePreview(file)}
                          className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                            isThreat
                              ? "bg-red-500/[0.05] border-red-500/25 hover:border-red-500/40"
                              : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isThreat
                                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                : "bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-xs truncate ${isThreat ? "text-red-200 font-mono" : "text-white"}`}>
                                  {file.name}
                                </span>
                                {isThreat && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                    THREAT
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#8E8E93] font-mono truncate">
                                {(file.size_bytes / 1024).toFixed(1)} KB • Modified: {file.modified_at}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handleOpenFilePreview(file)}
                              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white text-[11px] font-medium flex items-center gap-1.5 apple-button"
                            >
                              <FileSearch className="w-3.5 h-3.5 text-blue-400" />
                              <span>View Content</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#8E8E93] flex-shrink-0">
          <span>
            Connected to <strong>{device.hostname}</strong> ({device.ip_address}:{device.port || 8000})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium apple-button"
          >
            Close
          </button>
        </div>
      </div>

      {/* READ-ONLY FILE CONTENT VIEWER MODAL */}
      {selectedFileForPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-60 flex items-center justify-center p-4">
          <div className="apple-panel max-w-2xl w-full p-5 space-y-4 shadow-2xl border border-white/[0.14] text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <FileCode2 className="w-4 h-4 text-blue-400" />
                <div>
                  <h4 className="font-semibold text-white text-xs">{selectedFileForPreview.name}</h4>
                  <p className="text-[10px] text-[#8E8E93] font-mono">
                    {device.hostname} • {selectedFileForPreview.rel_path}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFileForPreview(null)}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Read-Only Content Box */}
            <div className="flex-1 overflow-y-auto rounded-xl bg-[#07090F] border border-white/[0.06] p-3 font-mono text-[11px] text-slate-200">
              {isLoadingPreview ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#8E8E93]">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span>Loading remote file bytes securely...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-all leading-relaxed">
                  {previewContent || "[Empty file]"}
                </pre>
              )}
            </div>

            {/* SHA-256 Hash and Safe Sandbox Disclaimer */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] flex-shrink-0">
              <div className="flex items-center gap-2 truncate max-w-md">
                <span className="text-[#8E8E93]">SHA-256:</span>
                <code className="text-slate-300 font-mono text-[10px] truncate">
                  {selectedFileForPreview.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                </code>
                {selectedFileForPreview.sha256 && (
                  <button
                    onClick={() => handleCopyHash(selectedFileForPreview.sha256)}
                    className="p-1 hover:text-white text-[#8E8E93]"
                    title="Copy SHA-256"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedFileForPreview(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
