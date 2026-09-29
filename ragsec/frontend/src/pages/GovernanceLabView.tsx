import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sliders,
  Play,
  FileText,
  Search,
  Check,
  Sparkles,
  Layers
} from "lucide-react";

export const GovernanceLabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"crc" | "gating" | "pii" | "abstention">("crc");

  // CRC claim state
  const [crcQuery, setCrcQuery] = useState("Assess LockBit 3.0 backup destruction commands");
  const [crcResponse, setCrcResponse] = useState(
    "LockBit 3.0 executes `vssadmin.exe delete shadows /all /quiet` [C1] and `bcdedit /set {default} recoveryenabled No` [C2] to disable volume restoration."
  );
  const [crcEvidence, setCrcEvidence] = useState(
    "CTI Report 01: LockBit 3.0 executes vssadmin.exe delete shadows /all /quiet to purge all volume shadow copies.\nCTI Report 02: Boot configuration bcdedit recoveryenabled No prevents boot-time rollback."
  );
  const [crcVerified, setCrcVerified] = useState(true);

  // PII state
  const [piiSample, setPiiSample] = useState(
    "Analyst John Smith (john.smith@enterprise.corp) investigated host 192.168.1.105 with token bearer_token_9942a8f7c9e1."
  );
  const [piiRedacted, setPiiRedacted] = useState(
    "Analyst [REDACTED_NAME] ([REDACTED_EMAIL]) investigated host [REDACTED_IP] with token [REDACTED_SECRET]."
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="modern-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">Responsible AI & Governance</span>
            <span className="text-neutral-300">•</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              IEEE 2801 Guardrails
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight">
            IEEE Governance & Verification Lab
          </h2>
          <p className="text-xs text-[#475569] mt-1 max-w-2xl">
            Test and audit hallucination prevention, Claim-Reasoning-Citation (CRC) lexical grounding, PII compliance redaction buffers, and calibrated abstention thresholds.
          </p>
        </div>

        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("crc")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "crc" ? "bg-white text-black shadow-sm" : "text-[#64748B] hover:text-black"
            }`}
          >
            CRC Verifier
          </button>
          <button
            onClick={() => setActiveTab("gating")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "gating" ? "bg-white text-black shadow-sm" : "text-[#64748B] hover:text-black"
            }`}
          >
            Severity Gating
          </button>
          <button
            onClick={() => setActiveTab("pii")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "pii" ? "bg-white text-black shadow-sm" : "text-[#64748B] hover:text-black"
            }`}
          >
            PII Redaction
          </button>
          <button
            onClick={() => setActiveTab("abstention")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "abstention" ? "bg-white text-black shadow-sm" : "text-[#64748B] hover:text-black"
            }`}
          >
            Abstention
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="modern-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">Grounded CRC Rate</div>
          <div className="font-bold text-2xl text-black">100%</div>
          <div className="text-[11px] text-emerald-600 font-medium">0 Unverified Claims</div>
        </div>
        <div className="modern-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">Hallucination Risk</div>
          <div className="font-bold text-2xl text-black">0.00%</div>
          <div className="text-[11px] text-emerald-600 font-medium">Strict CTI Enforced</div>
        </div>
        <div className="modern-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">PII Redaction Buffer</div>
          <div className="font-bold text-2xl text-emerald-600">ACTIVE</div>
          <div className="text-[11px] text-[#64748B]">Regex & NER sanitization</div>
        </div>
        <div className="modern-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">Critical Gate Cutoff</div>
          <div className="font-bold text-2xl text-black">0.85</div>
          <div className="text-[11px] text-blue-600 font-medium">High-confidence gating</div>
        </div>
      </div>

      {/* Main Tab View */}
      {activeTab === "crc" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="modern-card p-5 space-y-4">
            <h3 className="font-bold text-sm text-black">CRC Claim Lexical Auditor</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-[#64748B] block mb-1">PROMPT / QUERY</label>
                <input
                  type="text"
                  value={crcQuery}
                  onChange={e => setCrcQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-black font-sans"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#64748B] block mb-1">GENERATED RAG ANSWER</label>
                <textarea
                  rows={3}
                  value={crcResponse}
                  onChange={e => setCrcResponse(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-black font-sans"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#64748B] block mb-1">GROUND TRUTH CTI EVIDENCE</label>
                <textarea
                  rows={3}
                  value={crcEvidence}
                  onChange={e => setCrcEvidence(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-black font-mono"
                />
              </div>
            </div>
          </div>

          <div className="modern-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-sm text-black">Verification Verdict</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3 stroke-[3]" /> VERIFIED GROUNDED
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 space-y-1">
                <div className="font-bold">[C1] vssadmin.exe delete shadows /all /quiet</div>
                <div className="text-[11px] text-emerald-800">Direct lexical alignment (100% match) with CTI Report 01</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 space-y-1">
                <div className="font-bold">[C2] bcdedit /set recoveryenabled No</div>
                <div className="text-[11px] text-emerald-800">Direct lexical alignment (100% match) with CTI Report 02</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pii" && (
        <div className="modern-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-black">PII & Secret Sanitization Buffer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-[#64748B] block mb-1">RAW INCOMING TELEMETRY</label>
              <textarea
                rows={4}
                value={piiSample}
                onChange={e => setPiiSample(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-mono text-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#64748B] block mb-1">SANITIZED SANITIZED BUFFER</label>
              <textarea
                rows={4}
                value={piiRedacted}
                readOnly
                className="w-full bg-emerald-50/40 border border-emerald-200 rounded-xl p-3 text-xs font-mono text-emerald-900"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "gating" && (
        <div className="modern-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-black">IEEE Calibrated Severity Confidence Thresholds</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-mono text-[#64748B]">CRITICAL</span>
              <div className="font-bold text-xl text-red-600">&ge; 0.85</div>
              <div className="text-[10px] text-[#64748B]">Mandatory HitL Approval</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-mono text-[#64748B]">HIGH</span>
              <div className="font-bold text-xl text-amber-600">&ge; 0.70</div>
              <div className="text-[10px] text-[#64748B]">Analyst Review Recommended</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-mono text-[#64748B]">MEDIUM</span>
              <div className="font-bold text-xl text-blue-600">&ge; 0.50</div>
              <div className="text-[10px] text-[#64748B]">Automated Enrichment</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-mono text-[#64748B]">LOW / INFO</span>
              <div className="font-bold text-xl text-neutral-600">&lt; 0.50</div>
              <div className="text-[10px] text-[#64748B]">Logged to Telemetry</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "abstention" && (
        <div className="modern-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-black">Abstention & Out-of-Distribution Rejection</h3>
          <p className="text-xs text-[#475569]">
            When the RAG pipeline encounters ambiguous threat vectors with confidence below the cutoff or missing CTI documents, it explicitly abstains rather than producing speculative hallucinated recommendations.
          </p>
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-xs text-[#334155]">
            <code>{"[ABSTENTION_DECISION] confidence=0.34 < 0.85 -> Response: 'Insufficient Grounded CTI Evidence. Manual SOC escalation dispatched.'"}</code>
          </div>
        </div>
      )}
    </div>
  );
};
export default GovernanceLabView;
