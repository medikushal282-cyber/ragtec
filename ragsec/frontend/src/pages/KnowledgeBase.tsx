import React, { useState } from "react";
import { ragsecApi } from "../services/api";
import { QueryResponse } from "../types";
import { 
  BrainCircuit, 
  Search, 
  UploadCloud, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  ArrowRight,
  RefreshCw
} from "lucide-react";

export const KnowledgeBase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"search" | "ingest">("search");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);

  // Ingest form state
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestSource, setIngestSource] = useState("");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);

  const presetQueries = [
    "CVE-2024-38077 Windows RDP Remote Code Execution",
    "FIM Integrity Verification and Hash Mismatch Remediation",
    "Mitigating Prompt Injection Attacks in RAG Architectures",
    "APT29 Tactical Signatures and Lateral Movement Indicators"
  ];

  const handleQuery = async (textToQuery?: string) => {
    const q = textToQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await ragsecApi.queryThreatIntel(q);
      setResult(data);
    } catch (err) {
      console.error("Query failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestContent.trim()) return;
    setIngestLoading(true);
    setIngestSuccess(null);
    try {
      const ok = await ragsecApi.ingestDocument(ingestTitle, ingestContent, ingestSource);
      if (ok) {
        setIngestSuccess("Document successfully ingested into ChromaDB vector store!");
        setIngestTitle("");
        setIngestSource("");
        setIngestContent("");
      }
    } catch (err) {
      console.error("Ingest error", err);
    } finally {
      setIngestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === "search"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10"
                : "text-slate-400 hover:text-white bg-white/5 border border-transparent"
            }`}
          >
            <Search className="w-4 h-4 text-cyan-400" />
            Vector Threat Query
          </button>
          <button
            onClick={() => setActiveTab("ingest")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === "ingest"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10"
                : "text-slate-400 hover:text-white bg-white/5 border border-transparent"
            }`}
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            Ingest CTI Report
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>IEEE RAGSec Verification Protocol</span>
        </div>
      </div>

      {activeTab === "search" ? (
        <div className="space-y-6">
          {/* Query Bar */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              Ask RAGSec Threat Intelligence Core
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                  placeholder="Enter CVE ID, threat actor pattern, or remediation question..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-500/50"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <button
                onClick={() => handleQuery()}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Querying Vector Store..." : "Run RAG Query"}
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11px] text-slate-400 font-mono">Preset Queries:</span>
              {presetQueries.map((pq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(pq);
                    handleQuery(pq);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-white/5 text-[11px] text-slate-300 font-mono transition-all flex items-center gap-1"
                >
                  <span>{pq}</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Grounded Generation Answer (2 Cols) */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-l-cyan-500">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-bold text-white text-base font-mono">Grounded Synthesized Answer</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                      Confidence: {(result.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="text-sm text-slate-200 leading-relaxed font-sans bg-black/30 p-4 rounded-xl border border-white/5">
                  {result.answer}
                </div>

                {/* Performance & Security Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      Retrieval Latency
                    </div>
                    <div className="text-sm font-bold text-white font-mono">{result.retrieval_latency_ms} ms</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      Generation Latency
                    </div>
                    <div className="text-sm font-bold text-white font-mono">{result.generation_latency_ms} ms</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Prompt Guard
                    </div>
                    <div className="text-xs font-bold text-emerald-400 font-mono uppercase">
                      {result.security_audit?.sanitized ? "PASSED & SANITIZED" : "PASSED"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Retrieved Sources Drawer */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-bold text-white text-base font-mono">Evidence Sources</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">
                    {result.sources.length} CHUNKS
                  </span>
                </div>

                <div className="space-y-3">
                  {result.sources.map((src, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-cyan-400 font-bold">{src.metadata?.source || src.document_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          Score: {(src.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 italic leading-snug font-sans">
                        "{src.content}"
                      </p>
                      {src.metadata?.cve_id && (
                        <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                          {src.metadata.cve_id}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Ingest CTI Report Tab */
        <div className="glass-panel p-6 rounded-2xl max-w-2xl space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              Ingest CTI Document into Vector Store
            </h3>
            <p className="text-xs text-slate-400">
              Chunk, embed, and index threat intelligence reports into ChromaDB.
            </p>
          </div>

          {ingestSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {ingestSuccess}
            </div>
          )}

          <form onSubmit={handleIngest} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Document Title</label>
              <input
                type="text"
                value={ingestTitle}
                onChange={(e) => setIngestTitle(e.target.value)}
                placeholder="e.g. US-CERT Advisory 2024-09 RDP Vulnerability"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Source Name / Metadata</label>
              <input
                type="text"
                value={ingestSource}
                onChange={(e) => setIngestSource(e.target.value)}
                placeholder="e.g. cti_report_rdp_2024.txt"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Threat Report Text Content</label>
              <textarea
                value={ingestContent}
                onChange={(e) => setIngestContent(e.target.value)}
                rows={6}
                placeholder="Paste threat report details, indicators of compromise (IOCs), or remediation steps..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={ingestLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20"
            >
              {ingestLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {ingestLoading ? "Indexing into Vector Database..." : "Ingest & Index Document"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
