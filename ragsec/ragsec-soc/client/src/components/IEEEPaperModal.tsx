import React from "react";
import { 
  BookOpen, 
  X, 
  ExternalLink, 
  Award, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Cpu, 
  Server, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  TrendingUp,
  Fingerprint,
  Network
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IEEEPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export const IEEEPaperModal: React.FC<IEEEPaperModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="apple-panel max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-white/[0.12] text-xs max-h-[90vh] overflow-y-auto my-auto"
        >
          {/* Header Bar */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-semibold border border-blue-500/30">
                  2026 IEEE 5th ICAIC Conference
                </span>
                <span className="text-[#8E8E93] text-[10px] font-mono">
                  DOI: 10.1109/ICAIC67076.2026.11395762
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-[10px]">
                  Peer-Reviewed Research
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
                RAGSec: Retrieval-Augmented Generation for Cybersecurity Threat Intelligence in Enterprise Networks
              </h2>
              <p className="text-slate-400 text-xs">
                <strong>Authors:</strong> Shravya Bussari, Prateek Punj, Gayathri Balakumar (Independent Researchers)
              </p>
            </div>
            <button
              onClick={onClose}
              title="Close IEEE Paper"
              className="p-1.5 rounded-xl hover:bg-white/[0.08] text-[#8E8E93] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Research Impact Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-500/[0.06] border border-blue-500/25 space-y-1">
              <div className="flex items-center justify-between text-[#8E8E93] text-[10px] uppercase font-semibold">
                <span>Factual Alignment</span>
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-blue-300">+32%</div>
              <p className="text-[10px] text-slate-400">vs. LLM-only baselines</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25 space-y-1">
              <div className="flex items-center justify-between text-[#8E8E93] text-[10px] uppercase font-semibold">
                <span>Hallucination Drop</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-300">-41%</div>
              <p className="text-[10px] text-slate-400">Unsupported statements</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/25 space-y-1">
              <div className="flex items-center justify-between text-[#8E8E93] text-[10px] uppercase font-semibold">
                <span>Triage Speedup</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-300">27% Faster</div>
              <p className="text-[10px] text-slate-400">Mean time-to-insight</p>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-500/[0.06] border border-purple-500/25 space-y-1">
              <div className="flex items-center justify-between text-[#8E8E93] text-[10px] uppercase font-semibold">
                <span>SPS Metric</span>
                <Award className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-purple-300">2.68 / 3.0</div>
              <p className="text-[10px] text-slate-400">SOC Productivity Score</p>
            </div>
          </div>

          {/* Abstract */}
          <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-2">
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
              Paper Abstract & Operational Context
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Security operations centers (SOCs) are inundated with high-volume, high-velocity threat intelligence. While Large Language Models (LLMs) offer promising summarization and reasoning capabilities, direct prompting introduces severe enterprise risks: hallucinated indicators, lack of local grounding, unverifiable claims, and data leakage. 
              <strong> RAGSec</strong> operationalizes retrieval-augmented generation specifically for enterprise networks by integrating (i) sensitivity-scoped ingestion pipelines, (ii) retrieval-confidence thresholds tied to incident severity, (iii) policy-governed abstention and mandatory evidence-citation templates, and (iv) an SOC Productivity Score (SPS) metric for measuring analyst impact.
            </p>
          </div>

          {/* System Architecture (Fig. 1 in Paper) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Fig. 1: Layered RAGSec System Architecture (Implemented Live)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">IEEE Paper Section V</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Layer 1: Ingestion */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                  <Server className="w-3.5 h-3.5" />
                  <span>1. Ingestion Layer</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Connectors for SIEM alert exports, IDS/IPS alerts, STIX/TAXII threat feeds, CVE databases, and internal SOP playbooks.
                </p>
                <div className="pt-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono">
                    4 Sensitivity Tiers
                  </span>
                </div>
              </div>

              {/* Layer 2: Processing & Indexing */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>2. Processing & Indexing</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Normalization, MITRE ATT&CK enrichment, hybrid chunking (Semantic Paragraphs, IOC Table Rows, Rule Blocks) & ChromaDB dense vectors.
                </p>
                <div className="pt-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-mono">
                    bge-small-en-v1.5
                  </span>
                </div>
              </div>

              {/* Layer 3: Retrieval & Core */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>3. Reasoning & Gating</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Severity-aware gating (θ_sim & θ_conf), source diversity (k≥2), cross-encoder reranking, and policy-governed abstention.
                </p>
                <div className="pt-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono">
                    P1-P4 Adaptive Gating
                  </span>
                </div>
              </div>

              {/* Layer 4: Presentation & SIEM */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                  <Network className="w-3.5 h-3.5" />
                  <span>4. Presentation & SIEM</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  SOC analyst console with HitL mitigation, plus REST/gRPC connectors for ServiceNow, Splunk ES, Microsoft Sentinel & QRadar.
                </p>
                <div className="pt-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono">
                    SHA-256 Sealed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Formulations from Paper */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-purple-500/[0.05] border border-purple-500/25 space-y-2">
              <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                SOC Productivity Score (SPS) Formula (Section VIII-B)
              </span>
              <code className="block p-2 rounded-lg bg-black/40 text-purple-200 font-mono text-[11px]">
                SPS = α(FA + RS + CI) - β(USR) + γ(TE)
              </code>
              <ul className="text-[10px] text-slate-300 space-y-1 list-disc pl-4">
                <li><strong>FA (Factual Alignment):</strong> Ratio of evidence-backed claims to total claims.</li>
                <li><strong>RS (Relevance Score):</strong> Contextual appropriateness of response.</li>
                <li><strong>CI (Completeness Index):</strong> Coverage of critical incident entities and TTPs.</li>
                <li><strong>USR (Unsupported Statement Rate):</strong> Frequency of hallucinated content.</li>
                <li><strong>TE (Triage Efficiency):</strong> Proportion of time-to-insight saved.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/[0.05] border border-blue-500/25 space-y-2">
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                Deployment Readiness Criteria (Section V-C)
              </span>
              <ul className="text-[10px] text-slate-300 space-y-1">
                <li className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span>Private-cloud / Air-gapped on-premise deployment</span>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span>Data governance tiers (Public, Internal, Confidential, Restricted)</span>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span>Auditable retrieval paths with SHA-256 evidence seals</span>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span>Abstention-by-policy and forbidden inference constraints</span>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span>Evidence-bound output with mandatory citation templates</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Interactive Quick-Jump Navigation to Live Features */}
          <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <span className="text-[#8E8E93] text-[11px]">
              Explore Implemented Features in the Platform:
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  onClose();
                  onNavigate("sps_benchmark");
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1.5 transition-all apple-button"
              >
                <Award className="w-3 h-3" />
                <span>SPS Benchmark Matrix</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigate("governance_lab");
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold flex items-center gap-1.5 transition-all apple-button"
              >
                <Fingerprint className="w-3 h-3" />
                <span>Governance & CRC Lab</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigate("knowledge");
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1.5 transition-all apple-button"
              >
                <Layers className="w-3 h-3" />
                <span>Sensitivity Ingestion Tiers</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigate("siem_gateway");
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5 transition-all apple-button"
              >
                <Network className="w-3 h-3" />
                <span>SIEM Connectors</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
