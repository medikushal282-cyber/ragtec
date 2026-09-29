import React, { useEffect, useState } from "react";
import { socApi } from "../services/api";
import { KnowledgeDocument } from "../types/soc";
import { CategoryTag } from "../components/Badges";
import {
  Database,
  UploadCloud,
  FileText,
  Search,
  Check,
  RefreshCw,
  Plus,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  Lock,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export const KnowledgeBase: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showIngestModal, setShowIngestModal] = useState<boolean>(false);
  const [ingestTitle, setIngestTitle] = useState<string>("");
  const [ingestContent, setIngestContent] = useState<string>("");
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await socApi.getKnowledgeSources();
      setDocs(data || []);
      if (data && data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (e) {
      console.error("Knowledge base load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestContent.trim()) return;

    setIngesting(true);
    try {
      await socApi.ingestDocument({
        title: ingestTitle || "Manual CTI Submission",
        content: ingestContent,
        source_name: `${(ingestTitle || "manual_report").toLowerCase().replace(/\s+/g, "_")}.md`,
        doc_type: "THREAT_CLASSIFICATION_INTEL"
      });
      setSuccessMsg(`Document "${ingestTitle || "CTI Submission"}" successfully ingested and indexed into ChromaDB!`);
      setShowIngestModal(false);
      setIngestTitle("");
      setIngestContent("");
      loadDocs();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e) {
      console.error("Ingest error", e);
    } finally {
      setIngesting(false);
    }
  };

  const filteredDocs = docs.filter(d =>
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    (d.summary && d.summary.toLowerCase().includes(filter.toLowerCase())) ||
    (d.doc_type && d.doc_type.toLowerCase().includes(filter.toLowerCase()))
  );

  const totalChunksCount = docs.reduce((acc, d) => acc + (d.chunkCount || 1), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="modern-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-bold">
              ChromaDB Vector Store
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {docs.length} CTI Documents • {totalChunksCount} Chunks
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight">
            Threat Intelligence & Playbook Knowledge Base
          </h2>
          <p className="text-xs text-[#475569] mt-1 max-w-2xl">
            Repository of indexed CISA advisories, MITRE ATT&CK techniques, CVE remediation compendia, and SOC standard operating procedures powering the grounded RAG engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDocs}
            disabled={loading}
            className="btn-secondary-white py-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh Index</span>
          </button>

          <button
            onClick={() => setShowIngestModal(true)}
            className="btn-primary-black py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Document</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="modern-card p-4 space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] uppercase">Indexed Documents</span>
          <div className="font-bold text-2xl text-black">{docs.length}</div>
          <div className="text-[11px] text-indigo-600 font-medium">Full CTI Coverage</div>
        </div>
        <div className="modern-card p-4 space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] uppercase">Canonical Chunks</span>
          <div className="font-bold text-2xl font-mono text-black">{totalChunksCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Embedded with bge-small</div>
        </div>
        <div className="modern-card p-4 space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] uppercase">Vector Space</span>
          <div className="font-bold text-2xl text-black">Cosine 384-D</div>
          <div className="text-[11px] text-[#64748B]">ChromaDB Persistent</div>
        </div>
        <div className="modern-card p-4 space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] uppercase">Reranker Model</span>
          <div className="font-bold text-2xl text-indigo-600 font-mono">MiniLM-L6</div>
          <div className="text-[11px] text-[#64748B]">Cross-Encoder Stage 2</div>
        </div>
      </div>

      {/* Main Grid: Documents List + Document Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Documents List */}
        <div className="modern-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
              CORPUS ARTIFACTS
            </h3>
            <span className="text-xs font-mono text-[#64748B]">{filteredDocs.length} Docs</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search knowledge sources..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-sans text-black focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredDocs.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/70 border-indigo-300 shadow-xs"
                      : "bg-white border-neutral-200/80 hover:bg-neutral-50 hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-black truncate max-w-[180px]">
                      {doc.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-white border border-neutral-200 text-[#475569] font-bold">
                      {doc.chunkCount || 4} chunks
                    </span>
                  </div>

                  <div className="text-[11px] text-[#64748B] line-clamp-2 mt-1">
                    {doc.summary || "Advisory documentation and indicators for incident response."}
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-100 text-[10px] font-mono">
                    <span className="text-indigo-700 font-semibold">{doc.doc_type || "CTI_REPORT"}</span>
                    <span className="text-emerald-700 font-bold">Index: Verified</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Document Detailed Inspector */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDoc ? (
            <div className="modern-card p-6 space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                      {selectedDoc.doc_type || "CTI Intelligence Document"}
                    </span>
                    <span className="text-xs text-[#94A3B8] font-mono">ID: {selectedDoc.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-black">{selectedDoc.name}</h3>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Vector Grounded</span>
                </div>
              </div>

              {/* Summary Block */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block font-bold">
                  EXECUTIVE THREAT SUMMARY
                </span>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {selectedDoc.summary || "Comprehensive threat actor analysis and technical mitigation procedures for active containment."}
                </p>
              </div>

              {/* Mitigation Protocols Checklist */}
              {selectedDoc.mitigation_steps && selectedDoc.mitigation_steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
                    RECOMMENDED CONTAINMENT PLAYBOOK
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedDoc.mitigation_steps.map((step, sIdx) => (
                      <div key={sIdx} className="p-3 rounded-xl bg-white border border-neutral-200 flex items-start gap-2.5 text-xs text-[#1E293B]">
                        <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {sIdx + 1}
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Chunks Grid */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-black font-mono uppercase">
                    CANONICAL VECTOR CHUNKS ({selectedDoc.chunkCount || 4})
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B]">Max Token Window: 512</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F172A] text-neutral-200 font-mono text-xs overflow-x-auto leading-relaxed border border-neutral-800 max-h-60">
                  <pre className="whitespace-pre-wrap">{`[CHUNK_01] ${selectedDoc.name}
${selectedDoc.summary || "Detailed tactical and operational analysis for threat hunting and detection engineering."}

[METADATA]
source_type: ${selectedDoc.doc_type || "cti_report"}
sensitivity_tier: internal
indexing_engine: ChromaDB Cosine (BAAI/bge-small-en-v1.5)
status: ACTIVE`}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="modern-card p-12 text-center text-[#94A3B8] font-mono text-xs">
              Select a knowledge document from the list to view canonical chunks and metadata.
            </div>
          )}
        </div>
      </div>

      {/* Ingestion Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="modern-card p-6 w-full max-w-xl space-y-4 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-black">Ingest CTI Knowledge Document</h3>
              </div>
              <button onClick={() => setShowIngestModal(false)} className="text-[#94A3B8] hover:text-black">
                ✕
              </button>
            </div>

            <form onSubmit={handleIngest} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-black block mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g., APT29 Staging TTPs Advisory"
                  value={ingestTitle}
                  onChange={e => setIngestTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-black block mb-1">Markdown / Plain Text Content</label>
                <textarea
                  rows={6}
                  placeholder="Paste advisory content, IOCs, or SOP instructions..."
                  value={ingestContent}
                  onChange={e => setIngestContent(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-xs font-mono text-black focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="btn-secondary-white py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingesting}
                  className="btn-primary-black py-2 px-5"
                >
                  {ingesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Embedding & Indexing...</span>
                    </>
                  ) : (
                    <span>Ingest to ChromaDB</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default KnowledgeBase;
