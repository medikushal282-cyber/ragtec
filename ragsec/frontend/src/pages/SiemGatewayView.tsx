import React, { useState } from "react";
import {
  Network,
  Send,
  Copy,
  Check,
  Server,
  Download,
  ShieldCheck,
  FileCode2,
  Lock,
  Layers,
  Sparkles
} from "lucide-react";

type SIEMPlatform = "servicenow" | "splunk" | "sentinel" | "qradar";

export const SiemGatewayView: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<SIEMPlatform>("splunk");
  const [copied, setCopied] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [forwardedSuccess, setForwardedSuccess] = useState(false);

  const samplePayload = {
    incident_id: "INC-2026-9042",
    title: "Ransomware Volume Shadow Copy Invalidation Activity",
    severity: "CRITICAL",
    category: "Ransomware",
    affected_endpoints: ["DEV-WS-104 (192.168.1.104)"],
    iocs: [
      { type: "SHA256", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
      { type: "IP", value: "192.168.1.105:4444" },
      { type: "COMMAND", value: "vssadmin.exe delete shadows /all /quiet" }
    ],
    mitre_att_ck: {
      tactics: ["Impact", "Defense Evasion"],
      techniques: ["T1490", "T1562.001"]
    },
    grounding_proof: {
      crc_verified: true,
      evidence_seal_sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleForward = () => {
    setForwarding(true);
    setTimeout(() => {
      setForwarding(false);
      setForwardedSuccess(true);
      setTimeout(() => setForwardedSuccess(false), 3000);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="modern-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">Enterprise SIEM Sync</span>
            <span className="text-neutral-300">•</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Bi-Directional Forwarder
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight">
            SIEM Gateway & Export Connectors
          </h2>
          <p className="text-xs text-[#475569] mt-1 max-w-2xl">
            Stream verified threat intelligence, grounded incident summaries, and cryptographic evidence seals directly into enterprise Splunk, Microsoft Sentinel, ServiceNow SIR, and IBM QRadar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="btn-secondary-white py-2">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Payload"}</span>
          </button>
          <button onClick={handleForward} disabled={forwarding} className="btn-primary-black py-2">
            <Send className="w-3.5 h-3.5" />
            <span>{forwarding ? "Dispatching..." : `Sync to ${selectedPlatform.toUpperCase()}`}</span>
          </button>
        </div>
      </div>

      {forwardedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          <span>Incident payload and cryptographic seal successfully dispatched to {selectedPlatform.toUpperCase()} notable queue!</span>
        </div>
      )}

      {/* Platform Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { id: "splunk", name: "Splunk ES", tag: "HEC Endpoint", port: ":8088/collector" },
          { id: "sentinel", name: "Microsoft Sentinel", tag: "Azure ARM API", port: "Log Analytics" },
          { id: "servicenow", name: "ServiceNow SIR", tag: "Table API", port: "sn_siem_incident" },
          { id: "qradar", name: "IBM QRadar", tag: "Offenses API", port: "/api/siem/offenses" }
        ].map(p => {
          const isSelected = selectedPlatform === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedPlatform(p.id as SIEMPlatform)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-black text-white border-black shadow-md"
                  : "bg-white text-black border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{p.name}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                }`}>
                  {p.tag}
                </span>
              </div>
              <div className={`text-xs font-mono truncate ${isSelected ? "text-neutral-300" : "text-[#64748B]"}`}>
                {p.port}
              </div>
            </div>
          );
        })}
      </div>

      {/* JSON Payload Inspector */}
      <div className="modern-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="font-bold text-sm text-black">Synthesized Enterprise Payload</h3>
          <span className="text-xs font-mono text-[#64748B]">application/json</span>
        </div>

        <pre className="p-4 rounded-xl bg-[#0F172A] text-neutral-200 font-mono text-xs overflow-x-auto leading-relaxed border border-neutral-700 max-h-[380px]">
          {JSON.stringify(samplePayload, null, 2)}
        </pre>
      </div>
    </div>
  );
};
export default SiemGatewayView;
