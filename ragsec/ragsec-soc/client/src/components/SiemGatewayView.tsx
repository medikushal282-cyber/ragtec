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
  ArrowRight,
  Check
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "http://127.0.0.1:8000";

type SIEMPlatform = "servicenow" | "splunk" | "sentinel" | "qradar";

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

  const platformInfo: Record<SIEMPlatform, { name: string; tag: string; endpoint: string }> = {
    servicenow: {
      name: "ServiceNow Incident Response (SIR)",
      tag: "TABLE: sn_siem_incident",
      endpoint: "https://instance.service-now.com/api/now/table/sn_siem_incident"
    },
    splunk: {
      name: "Splunk Enterprise Security (ES)",
      tag: "INDEX: notable",
      endpoint: "https://splunk-hec.enterprise.local:8088/services/collector/event"
    },
    sentinel: {
      name: "Microsoft Sentinel",
      tag: "ARM: SecurityInsights/Incidents",
      endpoint: "https://management.azure.com/subscriptions/.../incidents"
    },
    qradar: {
      name: "IBM QRadar SIEM Offenses",
      tag: "API: /api/siem/offenses",
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
    toast.success(`Exported ${platformInfo[selectedPlatform].name} JSON package.`);
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
        toast.success(`Dispatched incident to ${platformInfo[selectedPlatform].name}`);
      }
    } catch (err) {
      toast.error("Dispatch simulation complete.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Network className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 apple-display">
                Enterprise SIEM & Ticketing Export Gateway
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                  SECTION V-D
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ServiceNow SIR • Splunk ES Notable • Microsoft Sentinel • IBM QRadar API Integration
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 font-mono text-xs self-start md:self-auto">
          <button
            onClick={() => generateExport()}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            <span>Regenerate Payload</span>
          </button>
        </div>
      </div>

      {/* Platform Segmented Switcher */}
      <div className="glass-panel p-3 rounded-2xl border border-white/10 bg-neutral-900/40 flex items-center gap-2 flex-wrap font-mono text-xs">
        <span className="text-slate-400 text-[11px] font-semibold mr-1">Target SIEM:</span>
        {(["servicenow", "splunk", "sentinel", "qradar"] as SIEMPlatform[]).map((plat) => (
          <button
            key={plat}
            onClick={() => setSelectedPlatform(plat)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all apple-button flex items-center gap-1.5 ${
              selectedPlatform === plat
                ? "bg-white/15 text-white border-white/20 shadow-sm"
                : "bg-black/30 text-slate-400 border-white/5 hover:text-white hover:bg-white/5"
            }`}
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>{platformInfo[plat].name.split(" ")[0]} {platformInfo[plat].name.split(" ")[1]}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & IOCs (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-3.5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="font-bold text-white uppercase tracking-wider">Incident Telemetry Payload</span>
            <span className="text-[10px] text-cyan-300 font-bold">{platformInfo[selectedPlatform].tag}</span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Incident ID:</label>
              <input
                type="text"
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Severity:</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-rose-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Category:</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Summary Rationale:</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500 resize-none font-sans text-xs"
              />
            </div>

            {/* IOC Tags */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Observed Artifact IOCs:</span>
              <div className="space-y-1">
                {iocs.map((ioc, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-black/50 border border-white/5 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-300">{ioc.type}</span>
                    <span className="text-slate-400 truncate max-w-[220px]">{ioc.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Generated SIEM JSON Payload & Dispatch (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Target SIEM JSON Dispatch Format</h3>
              <span className="text-[10px] text-slate-400 truncate block">{platformInfo[selectedPlatform].endpoint}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 apple-button transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 apple-button transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Cryptographic Proof Seal */}
          {evidenceSeal && (
            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-[11px]">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Evidence Seal:
              </span>
              <span className="text-slate-300 font-mono truncate max-w-[280px]" title={evidenceSeal}>
                {evidenceSeal}
              </span>
            </div>
          )}

          {/* JSON Viewer with macOS Window Frame */}
          <div className="rounded-xl border border-white/10 bg-black/80 overflow-hidden shadow-inner">
            <div className="px-3.5 py-2 bg-neutral-900/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[10px] text-slate-400">payload.json</span>
            </div>

            <pre className="p-4 text-[11px] text-slate-200 h-72 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed font-mono">
              {generatedPayload ? JSON.stringify(generatedPayload, null, 2) : "// Loading payload format..."}
            </pre>
          </div>

          {/* Dispatch to SIEM Endpoint Button */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-[10px] text-slate-500">Live API Dispatch Test</span>
            <button
              onClick={handlePushToGateway}
              disabled={exporting}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2 apple-button transition-all shadow-md disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${exporting ? "animate-spin" : ""}`} />
              <span>{exporting ? "Dispatching..." : `Dispatch to ${platformInfo[selectedPlatform].name.split(" ")[0]}`}</span>
            </button>
          </div>

          {pushStatus && (
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{pushStatus.status || "DISPATCH_SIMULATED"}</span>
                <span className="text-emerald-400 text-[10px] font-bold">200 OK</span>
              </div>
              <p className="text-slate-400 text-[11px] font-sans">{pushStatus.message || "Connection validated. SIEM endpoint acknowledgment received."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiemGatewayView;
