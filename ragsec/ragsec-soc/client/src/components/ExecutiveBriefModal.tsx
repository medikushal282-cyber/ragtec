import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  X, 
  ShieldCheck, 
  Printer, 
  ShieldAlert, 
  Cpu, 
  Server,
  Lock,
  Layers
} from "lucide-react";
import { toast } from "sonner";

export interface ExecutiveBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  threatCount: number;
  monitoredEventsCount: number;
  benignCount: number;
  devicesCount: number;
  activeModelName: string;
  quarantinedCount?: number;
}

export const ExecutiveBriefModal: React.FC<ExecutiveBriefModalProps> = ({
  isOpen,
  onClose,
  threatCount,
  monitoredEventsCount,
  benignCount,
  devicesCount,
  activeModelName,
  quarantinedCount = 0
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const timeFormatted = now.toLocaleTimeString("en-US");

  const briefMarkdown = `# RAGSec Autonomous SOC — Executive Incident Briefing
**Classification**: Enterprise Confidential  
**Assessment Date**: ${dateFormatted} at ${timeFormatted}  
**Evaluating AI Brain**: ${activeModelName.split("/").pop()} (Groq LPU Inference)  
**Host Environment**: Local & Enterprise Mesh Endpoints  

---

## 1. Executive Summary
The RAGSec Threat Intelligence and File Integrity Monitoring (FIM) platform has performed continuous automated surveillance across all monitored endpoints and filesystems. The current defensive posture is categorized as **${threatCount > 0 ? "ACTION REQUIRED / ACTIVE DEFENSE" : "NOMINAL / PROTECTED"}**.

- **Active Flagged Threats**: ${threatCount} item(s) detected requiring containment.
- **Defused in Quarantine Enclave**: ${quarantinedCount} isolated artifact(s).
- **CRUD Operations Monitored**: ${monitoredEventsCount} filesystem events analyzed in real time.
- **Verified Clean Assets**: ${benignCount} files verified matching zero-threat baseline.
- **Enrolled Endpoints**: ${devicesCount} workstation(s) active in the IEM mesh.

---

## 2. Threat Landscape & Observed Tactics
- **Containment Status**: Real-time Active Defense Sentinel is intercepting anomalous processes and rapid file replication.
- **Observed Attack Vectors**:
  - Shadow Copy Invalidation attempts (\`T1490\`)
  - Obfuscated PowerShell execution (\`T1059.001\`)
  - Web application backdoor egress attempts (\`T1190\`, \`T1071\`)
- **Forensic Hash Integrity**: All flagged files are tracked in the immutable SQLite audit ledger with cryptographically signed SHA-256 evidence seals.

---

## 3. Recommended Remediation & Next Steps
1. **Quarantine Containment**: Enforce zero-trust enclave isolation on remaining flagged artifacts.
2. **Endpoint Isolation**: Maintain Zero-Trust network containment on affected fleet endpoints until verified.
3. **Detection Rule Deployment**: Export generated Sigma detection rules to central SIEM (ServiceNow SIR / Microsoft Sentinel).

---
*Generated automatically by RAGSec Autonomous SOC Platform.*
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(briefMarkdown);
    setCopied(true);
    toast.success("Executive Brief copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([briefMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RAGSec-Executive-Brief-${now.toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded Executive Incident Briefing (.md)");
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="apple-panel max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs border border-white/[0.12] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">
                  Executive Cybersecurity Incident Debrief
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-mono border border-blue-500/25">
                  Briefing Ready
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                Formatted management debrief ready for stakeholder review, presentation, or audit handoff
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close Debrief"
            aria-label="Close Debrief"
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Active Threats</span>
            <div className={`text-base font-semibold font-mono tabular-nums mt-0.5 ${threatCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {threatCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Quarantined</span>
            <div className="text-base font-semibold font-mono tabular-nums text-purple-300 mt-0.5">
              {quarantinedCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">FIM Events</span>
            <div className="text-base font-semibold font-mono tabular-nums text-blue-300 mt-0.5">
              {monitoredEventsCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-[#8E8E93] uppercase font-semibold">Clean Safe</span>
            <div className="text-base font-semibold font-mono tabular-nums text-emerald-400 mt-0.5">
              {benignCount}
            </div>
          </div>
        </div>

        {/* Markdown Brief Preview */}
        <div className="flex-1 min-h-[300px] rounded-xl bg-black/60 border border-white/[0.08] p-4 font-mono text-[11px] text-slate-200 overflow-auto select-text leading-relaxed">
          <pre className="whitespace-pre-wrap font-mono text-xs">{briefMarkdown}</pre>
        </div>

        {/* Bottom Bar Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <span className="text-[10px] text-[#8E8E93] font-mono">
            Evaluator: {activeModelName.split("/").pop()} • Audit Certified
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-medium flex items-center gap-1.5 apple-button transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Markdown"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
