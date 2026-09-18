import React, { useState } from "react";
import { 
  FileCode2, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Terminal, 
  Cpu, 
  Copy, 
  ExternalLink 
} from "lucide-react";
import { DemoScenarioArtifact, SYNTHETIC_DEMO_ARTIFACTS } from "../services/demoEngine";

interface FileCodeExplorerProps {
  selectedFile?: DemoScenarioArtifact | null;
  onSelectArtifact?: (artifact: DemoScenarioArtifact) => void;
}

export const FileCodeExplorer: React.FC<FileCodeExplorerProps> = ({
  selectedFile,
  onSelectArtifact
}) => {
  const artifactList = Object.values(SYNTHETIC_DEMO_ARTIFACTS);
  const activeFile = selectedFile || artifactList[0];

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (activeFile?.content) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SAFE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "SUSPICIOUS":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "THREAT":
        return "bg-rose-500/20 text-rose-200 border-rose-500/50 font-bold critical-glow";
      default:
        return "bg-white/10 text-slate-300 border-white/20";
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base font-mono">
            AI File Code Explorer & Malware Inspector
          </h3>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
          SANDBOX-SAFE STATIC ANALYSIS
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File Selector List */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Select Monitored Artifact
          </h4>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {artifactList.map((art) => (
              <button
                key={art.id}
                onClick={() => onSelectArtifact && onSelectArtifact(art)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeFile?.id === art.id
                    ? "bg-cyan-950/40 border-cyan-500/50 text-white shadow-md shadow-cyan-950/20"
                    : "bg-black/40 border-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-cyan-400">{art.file_name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border ${getStatusBadge(art.threat_status)}`}>
                    {art.threat_status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{art.file_path}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Code Viewer & AI Analysis Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Metadata Header Bar */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">{activeFile.file_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded font-bold text-xs uppercase border ${getStatusBadge(activeFile.threat_status)}`}>
                  {activeFile.threat_status} — {activeFile.category}
                </span>
                <span className="text-slate-400">({activeFile.confidence}% Conf)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400 border-t border-white/5">
              <div>Path: <code className="text-cyan-400">{activeFile.file_path}</code></div>
              <div>Size: <strong className="text-white">{(activeFile.size_bytes / 1024).toFixed(1)} KB</strong></div>
              <div>SHA256: <code className="text-cyan-400">{activeFile.sha256_hash.substring(0, 12)}...</code></div>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
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

            <div className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-xs text-cyan-300 h-48 overflow-y-auto whitespace-pre-wrap">
              {activeFile.content}
            </div>
          </div>

          {/* AI Defensive Indicators Checklist */}
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
                const isDetected = (activeFile.defensive_indicators as any)[ind.key];
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
        </div>
      </div>
    </div>
  );
};

export default FileCodeExplorer;
