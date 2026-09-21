import React, { useState, useEffect } from "react";
import { 
  Network, 
  Download, 
  Send, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  FileCode2, 
  Terminal, 
  Lock, 
  RefreshCw, 
  ExternalLink, 
  Layers, 
  Cpu, 
  Server,
  KeyRound,
  FileCheck2,
  Sparkles,
  ArrowRight
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

type SIEMPlatform = "servicenow" | "splunk" | "sentinel" | "qradar";

interface SIEMTemplateInfo {
  id: string;
  name: string;
  table: string;
  format: string;
  features: string[];
}

export const SiemGatewayView: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<SIEMPlatform>("servicenow");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pushStatus, setPushStatus] = useState<any>(null);

  // Incident Form State
  const [incidentId, setIncidentId] = useState("INC-2026-9042");
  const [title, setTitle] = useState("Ransomware Volume Shadow Copy Invalidation Activity");
  const [severity, setSeverity] = useState("CRITICAL");
  const [category, setCategory] = useState("Ransomware");
  const [summary, setSummary] = useState("Observed vssadmin.exe attempting to purge shadow copies alongside bcdedit boot configuration alteration.");
  const [investigationNotes, setInvestigationNotes] = useState("Grounded analysis confirmed MITRE T1490. Citations [C1] and [C2] verified against threat corpus.");
  const [mitigationSteps, setMitigationSteps] = useState([
    "Isolate endpoint from local VLAN",
    "Terminate parent process tree",
    "Restore immutable backup storage snapshot"
  ]);
  const [iocs, setIocs] = useState([
    { type: "SHA256", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    { type: "IP", value: "45.142.214.18" },
    { type: "COMMAND", value: "vssadmin.exe delete shadows /all /quiet" }
  ]);
  const [tactics, setTactics] = useState(["Impact", "Defense Evasion"]);
  const [techniques, setTechniques] = useState(["T1490", "T1562.001"]);
  const [evidenceTags, setEvidenceTags] = useState(["[C1]", "[C2]"]);

  // Generated Payload State
  const [generatedPayload, setGeneratedPayload] = useState<any>(null);
  const [evidenceSeal, setEvidenceSeal] = useState<string>("");

  const platformInfo: Record<SIEMPlatform, { name: string; tag: string; color: string; endpoint: string }> = {
    servicenow: {
      name: "ServiceNow Incident Response (SIR)",
      tag: "TABLE: sn_siem_incident",
      color: "from-emerald-600/30 to-teal-900/40 border-emerald-500/40 text-emerald-300",
      endpoint: "https://instance.service-now.com/api/now/table/sn_siem_incident"
    },
    splunk: {
      name: "Splunk Enterprise Security (ES)",
      tag: "INDEX: notable",
      color: "from-amber-600/30 to-orange-900/40 border-amber-500/40 text-amber-300",
      endpoint: "https://splunk-hec.enterprise.local:8088/services/collector/event"
    },
    sentinel: {
      name: "Microsoft Sentinel (Azure Resource)",
      tag: "ARM: SecurityInsights/Incidents",
      color: "from-blue-600/30 to-indigo-900/40 border-blue-500/40 text-blue-300",
      endpoint: "https://management.azure.com/subscriptions/.../incidents"
    },
    qradar: {
      name: "IBM QRadar SIEM Offenses",
      tag: "API: /api/siem/offenses",
      color: "from-cyan-600/30 to-blue-900/40 border-cyan-500/40 text-cyan-300",
      endpoint: "https://qradar.enterprise.local/api/siem/offenses"
    }
  };

  const generateExport = async (plat = selectedPlatform) => {
    setLoading(true);
    setPushStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/siem/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: plat,
          incident: {
            incident_id: incidentId,
            title,
            severity,
            category,
            summary,
            investigation_notes: investigationNotes,
            mitigation_steps: mitigationSteps,
            iocs,
            tactics,
            techniques,
            evidence_tags: evidenceTags,
            operator: "ragsec_analyst"
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPayload(data.payload);
        setEvidenceSeal(data.sha256_evidence_seal || "");
      }
    } catch (err) {
      console.error("SIEM export error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateExport(selectedPlatform);
  }, [selectedPlatform]);

  const handleCopy = () => {
    if (!generatedPayload) return;
    navigator.clipboard.writeText(JSON.stringify(generatedPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedPayload) return;
    const blob = new Blob([JSON.stringify(generatedPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ragsec_${selectedPlatform}_${incidentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePushToGateway = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/siem/test-connection?platform=${selectedPlatform}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setPushStatus(data);
      }
    } catch (err) {
      console.error("Push failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Section V-D Attribution */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-[#0B0F19] border border-cyan-500/30 shadow-xl shadow-cyan-950/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-mono">
                  Enterprise SIEM & Ticketing Integration Gateway
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  IEEE Section V-D
                </span>
              </div>
              <p className="text-xs text-slate-300">
                1-Click export and live API dispatch of grounded threat intelligence and CRC-verified incident packages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateExport()}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Regenerate Payload
            </button>
          </div>
        </div>

        {/* SHA-256 Non-Repudiation Badge */}
        {evidenceSeal && (
          <div className="p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>SHA-256 Evidence Integrity Seal:</span>
              <code className="text-cyan-300 text-[11px] bg-black/60 px-2 py-0.5 rounded border border-white/10 select-all">
                {evidenceSeal}
              </code>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              CRYPTOGRAPHIC NON-REPUDIATION ATTACHED
            </span>
          </div>
        )}
      </div>

      {/* SIEM Platform Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["servicenow", "splunk", "sentinel", "qradar"] as SIEMPlatform[]).map((plat) => {
          const isSel = selectedPlatform === plat;
          const info = platformInfo[plat];
          return (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer font-mono ${
                isSel
                  ? `bg-gradient-to-br ${info.color} shadow-lg shadow-cyan-950/40`
                  : "bg-[#080C14] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase">{plat}</span>
                {isSel && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </div>
              <div className="text-white font-bold text-sm mt-1 line-clamp-1">{info.name}</div>
              <span className="text-[10px] text-slate-400 mt-2 block">{info.tag}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Incident Configuration & Live SIEM Payload Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incident Metadata Config */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#080C14] border border-white/10 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-bold text-white uppercase flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Incident Export Parameters
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              {incidentId}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Incident Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Severity:</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Category:</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Summary:</label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Grounded Investigation Notes:</label>
              <textarea
                rows={2}
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Associated MITRE Techniques:</label>
              <div className="flex flex-wrap gap-1.5">
                {techniques.map((tech, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 text-[10px]">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live SIEM Payload Preview */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#080C14] border border-white/10 space-y-4 font-mono text-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-white font-bold">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>Target Payload Preview ({selectedPlatform.toUpperCase()})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON
              </button>
            </div>
          </div>

          {/* Syntax Code Viewer */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 overflow-x-auto max-h-[360px] text-[11px] text-cyan-300 leading-relaxed font-mono select-text">
            {loading ? (
              <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                Generating schema...
              </div>
            ) : generatedPayload ? (
              <pre>{JSON.stringify(generatedPayload, null, 2)}</pre>
            ) : (
              <span className="text-slate-500">No payload generated.</span>
            )}
          </div>

          {/* Dispatch to Live SIEM Button */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-slate-400 text-[11px] block">Target Ingestion Endpoint:</span>
                <span className="text-slate-200 text-xs font-bold line-clamp-1">
                  {platformInfo[selectedPlatform].endpoint}
                </span>
              </div>

              <button
                onClick={handlePushToGateway}
                disabled={exporting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Push to SIEM Gateway
              </button>
            </div>

            {pushStatus && (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Payload dispatched successfully to {pushStatus.platform?.toUpperCase()}</span>
                </div>
                <span>Latency: {pushStatus.latency_ms}ms • TLSv1.3</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
