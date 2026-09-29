import React, { useEffect, useState } from "react";
import { useSOC } from "../context/SOCContext";
import { socApi } from "../services/api";
import { StaticAnalysisResult } from "../types/soc";
import {
  Cpu,
  FileText,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  Check,
  Lock,
  ArrowRight,
  RefreshCw,
  Clock,
  Copy,
  ChevronRight,
  Sparkles,
  BookOpen,
  AlertOctagon,
  AlertTriangle,
  Info,
  Layers,
  Biohazard
} from "lucide-react";

export const AlertAnalyzer: React.FC = () => {
  const { targetAnalysisPath, setTargetAnalysisPath, navigateTo } = useSOC();
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [filePath, setFilePath] = useState<string>(targetAnalysisPath || "monitored_workspace/malware_simulation.exe");
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const [analysisResult, setAnalysisResult] = useState<StaticAnalysisResult>({
    filename: "malware_simulation.exe",
    file_path: "monitored_workspace/malware_simulation.exe",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    size_bytes: 524288,
    entropy: 7.84,
    file_type: "PE32 Executable (x86-64)",
    is_pe: true,
    is_script: false,
    threat_state: "THREAT",
    classification: "Malware",
    risk_score: 96,
    confidence: 0.98,
    detected_indicators: [
      "High Shannon Entropy (7.84 > 7.0 threshold: Packed/Encrypted)",
      "Anomalous PE Section Header names (.vmp0 / UPX)",
      "Suspicious API imports: VirtualAllocEx, WriteProcessMemory, CreateRemoteThread",
      "Hardcoded C2 IP pattern detected in binary strings"
    ],
    behavioral_summary: "The binary exhibits characteristics of a compiled stage-1 beacon loader with packed shellcode payloads. Observed imports point towards memory injection and process hollowing techniques.",
    recommended_action: "Immediately isolate host WS-ANALYST-104 and move binary into quarantine/enclave.",
    syntax_preview: `00000000   4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00   MZ..............
00000010   B8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00   ........@.......
00000020   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00   ................
00000030   00 00 00 00 00 00 00 00 00 00 00 00 F0 00 00 00   ................
00000040   0E 1F BA 0E 00 B4 09 CD 21 B8 01 4C CD 21 54 68   ........!..L.!Th`
  });

  const runAnalysisOnPath = async (target: string) => {
    setAnalyzing(true);
    try {
      const res = await socApi.scanFilePath(target);
      if (res) {
        setAnalysisResult(res);
      }
    } catch {
      // Keep rich baseline
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(analysisResult.sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header Title */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2 font-medium">
          <span>Operations</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-black font-semibold">Alert Analyzer</span>
        </div>

        <div className="flex items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Static Threat Analyzer
          </h2>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-200/70 text-[#475569]">
            ZERO EXECUTION
          </span>
        </div>

        <p className="text-xs text-[#64748B] mt-1.5">
          Analyze files and code for malicious behavior without execution. Uses static analysis and AI-powered reasoning.
        </p>
      </div>

      {/* 7-Step Lifecycle Horizontal Bar */}
      <div className="flex items-center justify-between py-2 px-1 text-xs select-none overflow-x-auto">
        {[
          { num: 1, label: "Telemetry", active: true },
          { num: 2, label: "Detection", active: true },
          { num: 3, label: "Alert", active: false },
          { num: 4, label: "Incident", active: false },
          { num: 5, label: "Investigation", active: false },
          { num: 6, label: "Mitigation", active: false },
          { num: 7, label: "Audit", active: false }
        ].map((step, idx, arr) => (
          <React.Fragment key={step.num}>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  step.active
                    ? "bg-black text-white"
                    : "bg-neutral-200 text-[#64748B]"
                }`}
              >
                {step.num}
              </span>
              <span className={`font-medium ${step.active ? "text-black font-semibold" : "text-[#94A3B8]"}`}>
                {step.label}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <div className="flex-1 min-w-[20px] max-w-[50px] h-[1px] bg-neutral-200 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* File to Analyze Input Bar */}
      <div className="modern-card p-4 space-y-3">
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2 pl-4">
          <FileText className="w-4 h-4 text-[#64748B] flex-shrink-0" />
          <span className="text-xs font-semibold text-[#475569] whitespace-nowrap">File to Analyze</span>
          <input
            type="text"
            value={filePath}
            onChange={e => setFilePath(e.target.value)}
            className="flex-1 bg-transparent text-xs font-mono text-black focus:outline-none placeholder:text-[#94A3B8]"
            placeholder="monitored_workspace/malware_simulation.exe"
          />
          <button
            onClick={() => runAnalysisOnPath(filePath)}
            disabled={analyzing}
            className="btn-primary-black py-2.5 px-5 rounded-xl font-semibold text-xs flex items-center gap-2"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{analyzing ? "Analyzing..." : "Analyze File"}</span>
          </button>
        </div>

        {/* Quick Sample Files Pills */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] pl-1">
          <span>Sample Files:</span>
          {[
            "malware_simulation.exe",
            "suspicious_script.ps1",
            "ransomware_simulation.txt"
          ].map(sample => (
            <button
              key={sample}
              onClick={() => {
                const target = `monitored_workspace/${sample}`;
                setFilePath(target);
                runAnalysisOnPath(target);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                filePath.includes(sample)
                  ? "bg-white border-black text-black font-bold shadow-2xs"
                  : "bg-neutral-50 border-neutral-200 text-[#475569] hover:bg-white hover:border-neutral-300"
              }`}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Main Analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Analysis Result Card */}
        <div className="modern-card p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-black">Analysis Result</h3>
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <Clock className="w-3.5 h-3.5" />
                <span>Analyzed 2 minutes ago</span>
              </div>
            </div>

            {/* Pastel Red Threat Hero Banner */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Biohazard className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                    CLASSIFICATION
                  </span>
                  <div className="text-2xl font-black text-black tracking-tight">
                    {analysisResult.threat_state}
                  </div>
                </div>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-100 text-rose-700">
                {analysisResult.classification}
              </span>
            </div>

            {/* Metrics: Confidence Risk & Shannon Entropy */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs text-[#64748B]">Confidence Risk</span>
                <div className="text-2xl font-bold text-black">
                  {analysisResult.risk_score} <span className="text-sm font-normal text-[#94A3B8]">/ 100</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: `${analysisResult.risk_score}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-[#64748B]">Shannon Entropy</span>
                <div className="text-2xl font-bold text-black">
                  {analysisResult.entropy.toFixed(2)} <span className="text-sm font-normal text-[#94A3B8]">/ 8.00</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: `${(analysisResult.entropy / 8) * 100}%` }} />
                </div>
                <span className="text-[10px] font-medium text-[#64748B] block">Packed / Encrypted</span>
              </div>
            </div>

            {/* File Details */}
            <div className="space-y-3 pt-2 border-t border-neutral-100 text-xs">
              <div className="flex items-center gap-3 text-[#334155]">
                <FileCode className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#94A3B8] block">File Format</span>
                  <span className="font-medium text-black">{analysisResult.file_type}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-[#334155]">
                <div className="flex items-center gap-3 min-w-0">
                  <Lock className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#94A3B8] block">SHA-256 Hash</span>
                    <span className="font-mono text-[11px] text-black truncate block max-w-xs">
                      {analysisResult.sha256}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCopyHash}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-[#64748B] hover:text-black transition-colors"
                  title="Copy Hash"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Recommended Mitigation Alert Banner */}
            <div
              onClick={() => navigateTo("mitigation")}
              className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/70 flex items-start gap-3 cursor-pointer hover:bg-rose-100/60 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                !
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-rose-900 mb-0.5">Recommended Mitigation</h4>
                <p className="text-xs text-rose-800 leading-relaxed font-sans">
                  {analysisResult.recommended_action}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-700 flex-shrink-0 self-center" />
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-100">
            <button
              onClick={() => navigateTo("mitigation")}
              className="btn-primary-black py-2.5 rounded-xl text-xs font-semibold"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Apply Mitigation Actions</span>
            </button>

            <button
              onClick={() => navigateTo("playbooks")}
              className="btn-secondary-white py-2.5 rounded-xl text-xs font-semibold"
            >
              <BookOpen className="w-4 h-4 text-[#64748B]" />
              <span>View Playbooks</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Threat Assessment & Hex Stream Preview */}
        <div className="modern-card p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            {/* AI Assessment Header & Text */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-black font-bold text-base">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>AI Threat Assessment & Behavioral Analysis</span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                {analysisResult.behavioral_summary}
              </p>
            </div>

            {/* Observed Static Indicators (4) */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-black">
                Observed Static Indicators ({analysisResult.detected_indicators?.length || 4})
              </h4>

              <div className="space-y-2">
                {/* Indicator 1: Red */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs hover:bg-neutral-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0" />
                    <span className="text-[#1E293B] font-medium truncate">
                      High Shannon Entropy (7.84 &gt; 7.0 threshold: Packed/Encrypted)
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>

                {/* Indicator 2: Red */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs hover:bg-neutral-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0" />
                    <span className="text-[#1E293B] font-medium truncate">
                      Anomalous PE Section Header names (.vmp0 / UPX)
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>

                {/* Indicator 3: Amber */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs hover:bg-neutral-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-[#1E293B] font-medium truncate">
                      Suspicious API imports: VirtualAllocEx, WriteProcessMemory, CreateRemoteThread
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>

                {/* Indicator 4: Blue */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs hover:bg-neutral-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-[#1E293B] font-medium truncate">
                      Hardcoded C2 IP pattern detected in binary strings
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
              </div>
            </div>

            {/* Static Code / Hex Stream Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-black">
                  <span className="font-mono text-xs">{"{ }"}</span>
                  <span>Static Code / Hex Stream Preview</span>
                </div>
                <button
                  onClick={() => navigateTo("code_explorer")}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>View Full File</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F172A] text-neutral-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-neutral-800 shadow-inner">
                <pre>{analysisResult.syntax_preview}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AlertAnalyzer;
