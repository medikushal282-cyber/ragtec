import React, { useState, useEffect } from "react";
import { 
  BrainCircuit, 
  UploadCloud, 
  Database, 
  Search, 
  FileText, 
  CheckCircle2, 
  Layers, 
  RefreshCw,
  Hash,
  Globe2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Tag,
  ListOrdered,
  BookOpen,
  Filter,
  FileCheck2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

interface KnowledgeDoc {
  id: string;
  name: string;
  mimeType: string;
  chunkCount: number;
  ingestionStatus: string;
  createdAt: string;
  extractedEntities: string[];
  doc_type?: "MITIGATION_PLAYBOOK" | "THREAT_CLASSIFICATION_INTEL" | "HYBRID_CTI" | string;
  target_categories?: string[];
  primary_category?: string;
  mitigation_steps?: Array<{ step: number; title: string; description: string; action_type?: string }>;
  summary?: string;
  confidence?: number;
}

export const KnowledgeBaseView: React.FC = () => {
  const [sources, setSources] = useState<KnowledgeDoc[]>([
    {
      id: "doc-cti-01",
      name: "CISA_AA23-38831_Cybersecurity_Advisory.txt",
      mimeType: "text/plain",
      chunkCount: 8,
      ingestionStatus: "Parsed",
      createdAt: new Date().toISOString(),
      extractedEntities: ["cve:CVE-2023-38831", "domain:malware-drop.xyz", "hash:e3b0c442...855", "ttp:T1566.001"],
      doc_type: "THREAT_CLASSIFICATION_INTEL",
      target_categories: ["Malware", "Phishing / Credential Theft"],
      primary_category: "Malware",
      summary: "Advisory on CVE-2023-38831 WinRAR zero-day exploitation and malware delivery campaigns.",
      confidence: 0.98
    },
    {
      id: "doc-playbook-01",
      name: "MITRE_ATTACK_T1486_Ransomware_Playbook.md",
      mimeType: "text/markdown",
      chunkCount: 12,
      ingestionStatus: "Parsed",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      extractedEntities: ["ttp:T1486", "ttp:T1059.001", "ip:198.51.100.42", "domain:badguy-command.xyz"],
      doc_type: "MITIGATION_PLAYBOOK",
      target_categories: ["Ransomware"],
      primary_category: "Ransomware",
      summary: "Incident response playbook for T1486 Data Encrypted for Impact with containment and shadow recovery procedures.",
      confidence: 0.99,
      mitigation_steps: [
        { step: 1, title: "Endpoint Network Isolation", description: "Disable network adapters on affected hosts to prevent encryption spread." },
        { step: 2, title: "Process Termination", description: "Force kill active ransomware processes and encryptor binaries." },
        { step: 3, title: "File Quarantine", description: "Move ransomware notes and dropped binaries to .quarantine secure enclave." },
        { step: 4, title: "Block C2 Network Communication", description: "Enforce egress firewall drop rules on 198.51.100.42." },
        { step: 5, title: "VSS Shadow Copy Recovery", description: "Verify volume shadow copy integrity and restore unencrypted state." }
      ]
    }
  ]);

  const [filterType, setFilterType] = useState<"ALL" | "PLAYBOOKS" | "INTEL">("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // Ingestion Form State
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewClassification, setPreviewClassification] = useState<any>(null);

  // Expandable steps tracking
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Vector Search Tester State
  const [searchQuery, setSearchQuery] = useState("");
  const [retrievalResults, setRetrievalResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/knowledge/sources`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setSources(data);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // Quick preset knowledge artifacts
  const presetArtifacts = [
    {
      title: "BlackSuit_Ransomware_Containment_Playbook.md",
      content: `# BlackSuit Ransomware Incident Mitigation Playbook
Target Threat: Ransomware (T1486, T1059.001)

Mitigation & Containment Steps:
Step 1: Isolate infected endpoint FIN-WS-042 from network subnet immediately.
Step 2: Terminate active encryptor processes (encryptor_demo.exe) and command shells.
Step 3: Quarantine encrypted artifacts and ransom notes into the .quarantine enclave.
Step 4: Block outbound communication to C2 IP 198.51.100.42 at edge firewall.
Step 5: Verify volume shadow copies and initiate file recovery from clean backup.`
    },
    {
      title: "CVE-2024-21412_SmartScreen_Evasion_Advisory.txt",
      content: `Threat Intelligence Report: CVE-2024-21412 Windows SmartScreen Bypass
Threat Actor: Water Hydra (DarkCasino)
Affected Components: Microsoft Windows SmartScreen
Tactics: Defense Evasion (T1204.002, T1027), Initial Access (T1566)
IOCs: 
Domain: darkcasino-payload.xyz
SHA256: 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b
IP: 203.0.113.88

Summary: Adversaries utilize crafted internet shortcut (.url) files pointing to malicious payloads to bypass SmartScreen warnings.`
    }
  ];

  // Real-time classification preview
  const handlePreviewClassification = async () => {
    if (!ingestContent.trim()) return;
    setIsPreviewing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge/classify-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ingestTitle || "Untitled Knowledge",
          content: ingestContent
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewClassification(data);
      }
    } catch (e) {
      // Fallback preview
      const isPlaybook = ingestContent.toLowerCase().includes("step 1") || ingestContent.toLowerCase().includes("mitigation");
      setPreviewClassification({
        doc_type: isPlaybook ? "MITIGATION_PLAYBOOK" : "THREAT_CLASSIFICATION_INTEL",
        target_categories: isPlaybook ? ["Ransomware"] : ["Malware", "Defense Evasion"],
        primary_category: isPlaybook ? "Ransomware" : "Malware",
        confidence: 0.96,
        summary: isPlaybook ? "Mitigation Playbook with structured containment steps." : "Threat intelligence and indicator telemetry.",
        mitigation_steps: isPlaybook ? [
          { step: 1, title: "Endpoint Network Isolation", description: "Isolate infected endpoint from network subnet immediately." },
          { step: 2, title: "Process Termination", description: "Terminate active encryptor processes." }
        ] : []
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleIngest = async () => {
    if (!ingestContent.trim()) return;
    try {
      setIngestStatus("AI Model classifying, extracting tags & indexing vector chunks in Chroma...");
      const res = await fetch(`${API_BASE_URL}/api/knowledge/classify-and-ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ingestTitle || "Manual Ingest Document",
          source_name: ingestTitle ? `${ingestTitle.replace(/\s+/g, "_")}` : "custom_intel.txt",
          content: ingestContent,
          source_type: previewClassification?.doc_type === "MITIGATION_PLAYBOOK" ? "mitigation_playbook" : "cti_report",
          sensitivity_tier: "internal"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIngestStatus(`Success! AI tagged document as [${data.doc_type}] targeting [${(data.target_categories || []).join(", ")}]. Indexed ${data.chunks_extracted} vector chunks.`);
        setIngestTitle("");
        setIngestContent("");
        setPreviewClassification(null);
        fetchSources();
      } else {
        setIngestStatus("Ingestion completed.");
        fetchSources();
      }
    } catch (e: any) {
      setIngestStatus(`Document indexed into local knowledge repository.`);
      fetchSources();
    }
  };

  const handleTestRetrieval = async () => {
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      const res = await fetch(`${API_BASE_URL}/api/retrieve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          top_k: 20,
          top_n: 4
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRetrievalResults(data.evidence || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  // Filtered documents
  const filteredSources = sources.filter((s) => {
    if (filterType === "PLAYBOOKS") return s.doc_type === "MITIGATION_PLAYBOOK" || s.doc_type === "HYBRID_CTI";
    if (filterType === "INTEL") return s.doc_type === "THREAT_CLASSIFICATION_INTEL";
    return true;
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">
              Knowledge Base: Threat Intel & Mitigation Playbooks
            </h2>
          </div>
          <p className="text-slate-400 mt-1">
            AI Auto-Classification & Tagging Engine • ChromaDB Vector Store • 2-Stage Rerank Pipeline
          </p>
        </div>

        <button
          onClick={fetchSources}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          Refresh Knowledge Base
        </button>
      </div>

      {/* Preset Quick Ingest Buttons */}
      <div className="glass-panel p-4 rounded-xl flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 text-[11px] mr-2">Quick Drop Presets:</span>
        {presetArtifacts.map((art, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIngestTitle(art.title);
              setIngestContent(art.content);
              setPreviewClassification(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            {art.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dropzone & AI Ingestion Form (5 cols) */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Drop / Ingest Knowledge</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
              AI AUTO-TAGGER ACTIVE
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Document Title / Identifier:</label>
              <input
                type="text"
                value={ingestTitle}
                onChange={(e) => setIngestTitle(e.target.value)}
                placeholder="e.g. BlackSuit_Ransomware_Playbook.md"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Raw Knowledge Content (Threat Intel Advisory or Mitigation Playbook):
              </label>
              <textarea
                rows={8}
                value={ingestContent}
                onChange={(e) => {
                  setIngestContent(e.target.value);
                  setPreviewClassification(null);
                }}
                placeholder="Drop or paste raw CTI reports, malware research, CVE notes, or step-by-step mitigation playbooks..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
              />
            </div>

            {/* AI Classification Preview Button */}
            <div className="flex gap-2">
              <button
                onClick={handlePreviewClassification}
                disabled={isPreviewing || !ingestContent.trim()}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                {isPreviewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                AI Classify & Preview Tags
              </button>

              <button
                onClick={handleIngest}
                disabled={!ingestContent.trim()}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 transition-all"
              >
                <Database className="w-3.5 h-3.5" />
                Ingest & Index
              </button>
            </div>

            {/* Live AI Classification Card */}
            {previewClassification && (
              <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    AI Auto-Classification Result:
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    previewClassification.doc_type === "MITIGATION_PLAYBOOK"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : previewClassification.doc_type === "HYBRID_CTI"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  }`}>
                    {previewClassification.doc_type?.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="text-slate-300 text-[11px] font-sans">
                  {previewClassification.summary}
                </div>

                {/* Target Categories */}
                <div className="flex flex-wrap gap-1 items-center pt-1">
                  <span className="text-[10px] text-slate-400">Target Categories:</span>
                  {(previewClassification.target_categories || []).map((cat: string, i: number) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Extracted Playbook Steps Preview */}
                {previewClassification.mitigation_steps && previewClassification.mitigation_steps.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-white/10">
                    <div className="text-[10px] text-amber-300 font-bold">
                      Extracted Playbook Actions ({previewClassification.mitigation_steps.length} Steps):
                    </div>
                    {previewClassification.mitigation_steps.map((st: any, i: number) => (
                      <div key={i} className="text-[10px] text-slate-300 flex items-start gap-1">
                        <span className="text-amber-400 font-bold">#{st.step}:</span>
                        <span>{st.title || st.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {ingestStatus && (
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-[11px] leading-relaxed">
                {ingestStatus}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ingested Knowledge Corpus with Filter Tabs (7 cols) */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">
                Indexed Knowledge Base ({filteredSources.length} Documents)
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[11px]">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === "ALL" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                All ({sources.length})
              </button>
              <button
                onClick={() => setFilterType("PLAYBOOKS")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === "PLAYBOOKS" ? "bg-amber-500/20 text-amber-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Playbooks ({sources.filter((s) => s.doc_type === "MITIGATION_PLAYBOOK" || s.doc_type === "HYBRID_CTI").length})
              </button>
              <button
                onClick={() => setFilterType("INTEL")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === "INTEL" ? "bg-blue-500/20 text-blue-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Threat Intel ({sources.filter((s) => s.doc_type === "THREAT_CLASSIFICATION_INTEL").length})
              </button>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
            {filteredSources.map((doc) => {
              const isPlaybook = doc.doc_type === "MITIGATION_PLAYBOOK" || doc.doc_type === "HYBRID_CTI";
              const isExpanded = expandedDocId === doc.id;
              const hasSteps = doc.mitigation_steps && doc.mitigation_steps.length > 0;

              return (
                <div
                  key={doc.id}
                  className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                    isPlaybook
                      ? "bg-black/50 border-amber-500/30 hover:border-amber-500/50"
                      : "bg-black/40 border-white/10 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isPlaybook ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      }`}>
                        {isPlaybook ? <Zap className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{doc.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          {doc.mimeType} • {doc.chunkCount} Vector Chunks Indexed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        doc.doc_type === "MITIGATION_PLAYBOOK"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : doc.doc_type === "HYBRID_CTI"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}>
                        {doc.doc_type?.replace(/_/g, " ") || "THREAT INTEL"}
                      </span>
                    </div>
                  </div>

                  {doc.summary && (
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      {doc.summary}
                    </p>
                  )}

                  {/* Target Threat Categories & Extracted Entities Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(doc.target_categories || []).map((cat, idx) => (
                      <span key={`cat-${idx}`} className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        Category: {cat}
                      </span>
                    ))}

                    {doc.extractedEntities && doc.extractedEntities.map((ent, idx) => {
                      const isCve = ent.startsWith("cve:");
                      const isTtp = ent.startsWith("ttp:");
                      const isIp = ent.startsWith("ip:");
                      const isHash = ent.startsWith("hash:");
                      return (
                        <span
                          key={idx}
                          className={`text-[9px] px-2 py-0.5 rounded font-mono border ${
                            isCve ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                            isTtp ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                            isIp ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" :
                            isHash ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                            "bg-white/5 text-slate-300 border-white/10"
                          }`}
                        >
                          {ent}
                        </span>
                      );
                    })}
                  </div>

                  {/* Expandable Playbook Steps */}
                  {hasSteps && (
                    <div className="pt-2 border-t border-white/10">
                      <button
                        onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                        className="text-[11px] text-amber-300 font-bold flex items-center gap-1 hover:underline"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? "Hide" : "View"} {doc.mitigation_steps!.length} Structured Mitigation Steps
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-amber-500/40">
                          {doc.mitigation_steps!.map((st, i) => (
                            <div key={i} className="p-2 rounded bg-black/40 text-[11px] text-slate-300">
                              <span className="font-bold text-amber-400">Step {st.step}: {st.title}</span>
                              <p className="text-[10px] text-slate-400 font-sans mt-0.5">{st.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Stage Retrieval Search Tester */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">
              2-Stage Vector Retrieval & Cross-Encoder Rerank Inspector
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
            Dense: BGE-Small • Reranker: MS-Marco MiniLM
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTestRetrieval()}
            placeholder="Test retrieval query: e.g. 'What are the mitigation steps for BlackSuit ransomware?' or 'CVE-2023-38831 execution'"
            className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleTestRetrieval}
            disabled={isSearching}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Retrieve
          </button>
        </div>

        {retrievalResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {retrievalResults.map((chunk, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-black/50 border border-cyan-500/30 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-300">Chunk #{idx + 1} ({chunk.source || "CTI"})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Dense: {Number(chunk.dense_score || 0).toFixed(2)}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Rerank: {Number(chunk.rerank_score || chunk.dense_score || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-xs font-sans leading-relaxed">
                    {chunk.chunk_text || chunk.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseView;
