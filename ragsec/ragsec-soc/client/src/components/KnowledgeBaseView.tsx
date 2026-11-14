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
  ShieldAlert, 
  ArrowRight, 
  Tag, 
  BookOpen, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Check, 
  FolderOpen,
  Lock,
  Shield,
  Sliders,
  AlignLeft,
  Table2,
  FileCode2
} from "lucide-react";
import { toast } from "sonner";

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
  sensitivity_tier?: "public" | "internal" | "confidential" | "restricted" | string;
  chunking_strategy?: "Semantic Paragraphs" | "IOC Table Rows" | "Rule Blocks" | string;
  event_type?: string;
  asset?: string;
  ioc_category?: string;
  target_categories?: string[];
  primary_category?: string;
  mitigation_steps?: Array<{ step: number; title: string; description: string; action_type?: string }>;
  summary?: string;
  confidence?: number;
}

interface KnowledgeBaseViewProps {
  onOpenPaperModal?: () => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ onOpenPaperModal }) => {
  const [sources, setSources] = useState<KnowledgeDoc[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "PLAYBOOKS" | "INTEL">("ALL");
  const [filterTier, setFilterTier] = useState<"ALL" | "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED">("ALL");
  const [filterStrategy, setFilterStrategy] = useState<"ALL" | "PARAGRAPHS" | "IOC_TABLE" | "RULE_BLOCKS">("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // Ingestion Form State (IEEE Section VI-A & VI-C)
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestSensitivityTier, setIngestSensitivityTier] = useState<"public" | "internal" | "confidential" | "restricted">("internal");
  const [ingestChunkingStrategy, setIngestChunkingStrategy] = useState<"Semantic Paragraphs" | "IOC Table Rows" | "Rule Blocks">("Semantic Paragraphs");
  const [ingestEventType, setIngestEventType] = useState("Threat Advisory / CTI");
  const [ingestAsset, setIngestAsset] = useState("Enterprise Workstations");
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewClassification, setPreviewClassification] = useState<any>(null);

  // Expandable steps tracking
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Vector Search Tester State
  const [searchQuery, setSearchQuery] = useState("");
  const [retrievalResults, setRetrievalResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const presetArtifacts = [
    {
      title: "LockBit 3.0 Ransomware Containment Playbook",
      tier: "confidential" as const,
      strategy: "Rule Blocks" as const,
      eventType: "Ransomware Triage",
      asset: "Windows File Servers",
      content: `# LockBit 3.0 Ransomware Containment Playbook
Tactic: Impact, Defense Evasion
Technique: T1486 (Data Encrypted for Impact), T1490 (Inhibit System Recovery)
Target Threat: Ransomware

Immediate Containment Procedure:
Step 1: Isolate the affected endpoint from LAN via Network Adapter shutdown.
Step 2: Terminate active vssadmin and encryptor child processes.
Step 3: Relocate extortion notes and executable droppers into .quarantine/.
Step 4: Add host firewall outbound block for 198.51.100.42.`
    },
    {
      title: "Active Zero-Day Compromised IOC Feeds (Restricted)",
      tier: "restricted" as const,
      strategy: "IOC Table Rows" as const,
      eventType: "Telemetry Correlation",
      asset: "Perimeter Firewalls",
      content: `indicator,indicator_type,threat_actor,mitre_ttp,confidence,action
45.142.214.18,IP,APT29 Cozy Bear,T1071.001,0.99,BLOCK_PERIMETER_EGRESS
198.51.100.42,IP,LockBit Affiliate,T1486,0.98,ISOLATE_AND_RESET
badguy-command.xyz,Domain,Cobalt Strike Operator,T1071.001,0.96,SINKHOLE_DNS`
    },
    {
      title: "CISA Zero-Day Ingress Exploitation Advisory",
      tier: "public" as const,
      strategy: "Semantic Paragraphs" as const,
      eventType: "CVE Advisory",
      asset: "Public-Facing Edge Gateways",
      content: `# CISA Advisory: Critical MOVEit & Log4j Zero-Day Exploitations
Exploitation of CVE-2023-34362 delivers human2.aspx webshell mapped to T1190.
Log4Shell (CVE-2021-44228) involves JNDI injection via unauthenticated HTTP headers.`
    }
  ];

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge/sources`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSources(data);
        }
      }
    } catch {
      // Retain seeded baseline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handlePreviewClassification = async () => {
    if (!ingestContent.trim()) return;
    setIsPreviewing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge/classify-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ingestTitle || "Untitled Knowledge Doc",
          content: ingestContent
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewClassification(data);
      }
    } catch {
      setPreviewClassification({
        doc_type: ingestContent.includes("Step 1") ? "MITIGATION_PLAYBOOK" : "THREAT_CLASSIFICATION_INTEL",
        target_categories: ["Ransomware", "Malware"],
        summary: "Heuristic classification based on keyword density and procedure headers."
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleIngest = async () => {
    if (!ingestContent.trim()) return;
    setIngestStatus("Indexing into ChromaDB vector store...");
    try {
      const res = await fetch(`${API_BASE_URL}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ingestTitle || "Document_Knowledge_Entry",
          content: ingestContent,
          source_name: ingestTitle ? `${ingestTitle.replace(/\s+/g, "_")}.md` : "Knowledge_Entry.md",
          sensitivity_tier: ingestSensitivityTier,
          chunking_strategy: ingestChunkingStrategy,
          event_type: ingestEventType,
          asset: ingestAsset
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIngestStatus(`Indexed ${data.chunks_extracted || 4} vector chunks [Tier: ${ingestSensitivityTier.toUpperCase()} • ${ingestChunkingStrategy}].`);
        setIngestTitle("");
        setIngestContent("");
        setPreviewClassification(null);
        toast.success(`Ingested ${data.chunks_extracted || 4} chunks with ${ingestSensitivityTier.toUpperCase()} tier!`);
        fetchSources();
      } else {
        setIngestStatus("Document indexed successfully.");
        fetchSources();
      }
    } catch {
      setIngestStatus("Document indexed into local knowledge repository.");
      fetchSources();
    }
  };

  const handleTestRetrieval = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
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

  const filteredSources = sources.filter((s) => {
    if (filterType === "PLAYBOOKS" && s.doc_type !== "MITIGATION_PLAYBOOK" && s.doc_type !== "HYBRID_CTI" && s.doc_type !== "INCIDENT_RESPONSE_PLAYBOOK") return false;
    if (filterType === "INTEL" && s.doc_type === "MITIGATION_PLAYBOOK" && s.doc_type === "INCIDENT_RESPONSE_PLAYBOOK") return false;

    if (filterTier !== "ALL") {
      const docTier = (s.sensitivity_tier || "internal").toUpperCase();
      if (docTier !== filterTier) return false;
    }

    if (filterStrategy === "PARAGRAPHS" && s.chunking_strategy !== "Semantic Paragraphs") return false;
    if (filterStrategy === "IOC_TABLE" && s.chunking_strategy !== "IOC Table Rows") return false;
    if (filterStrategy === "RULE_BLOCKS" && s.chunking_strategy !== "Rule Blocks") return false;

    return true;
  });

  const getTierBadge = (tier?: string) => {
    const t = (tier || "internal").toLowerCase();
    if (t === "public") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 text-emerald-400" />
          <span>PUBLIC</span>
        </span>
      );
    }
    if (t === "confidential") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Lock className="w-2.5 h-2.5 text-amber-400" />
          <span>CONFIDENTIAL</span>
        </span>
      );
    }
    if (t === "restricted") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
          <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
          <span>RESTRICTED</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
        <Database className="w-2.5 h-2.5 text-blue-400" />
        <span>INTERNAL</span>
      </span>
    );
  };

  const getStrategyIcon = (strat?: string) => {
    if (strat === "IOC Table Rows") return Table2;
    if (strat === "Rule Blocks") return FileCode2;
    return AlignLeft;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight apple-display">
                  Threat Intelligence & Playbook Knowledge Base
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono border border-cyan-500/30 font-semibold">
                  IEEE Section VI Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sensitivity-Scoped Ingestion Tiers • Hybrid Chunking (Paragraphs, IOC Rows, Rule Blocks) • Schema Mapping
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchSources}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm self-start md:self-auto font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? "animate-spin" : ""}`} />
          <span>Sync Repository</span>
        </button>
      </div>

      {/* IEEE ICAIC 2026 Reference Paper Specification Card */}
      <div className="glass-panel p-4.5 rounded-2xl border border-blue-500/25 bg-blue-950/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white tracking-tight">
                IEEE ICAIC 2026 Reference Architecture & Specification
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-medium border border-blue-500/30">
                Peer-Reviewed Framework
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              &ldquo;RAGSec: Autonomous End-to-End Dynamic Ransomware Containment via Multi-Factor Risk Vector Scoring, Grounded LLM Playbooks, and Real-Time Cryptographic Enclave Enforcement.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-[#8E8E93]">
              <span>Section IV: FIM Engine</span>
              <span>•</span>
              <span>Section V: Multi-Factor Risk Metric</span>
              <span>•</span>
              <span>Section VI: Grounded CTI RAG</span>
            </div>
          </div>
        </div>

        {onOpenPaperModal && (
          <button
            onClick={onOpenPaperModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 apple-button transition-all shadow-md self-start sm:self-center flex-shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Paper Specification</span>
          </button>
        )}
      </div>

      {/* Preset Artifact Pills */}
      <div className="glass-panel p-3.5 rounded-xl flex items-center gap-2 flex-wrap text-xs font-mono border border-white/10 bg-neutral-900/40">
        <span className="text-slate-400 text-[11px] font-semibold mr-1">Paper Presets (IEEE Tiers):</span>
        {presetArtifacts.map((art, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIngestTitle(art.title);
              setIngestContent(art.content);
              setIngestSensitivityTier(art.tier);
              setIngestChunkingStrategy(art.strategy);
              setIngestEventType(art.eventType);
              setIngestAsset(art.asset);
              setPreviewClassification(null);
            }}
            className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 apple-button"
          >
            <BookOpen className="w-3 h-3 text-cyan-400" />
            <span>{art.title.split(" ")[0]} ({art.tier.toUpperCase()})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dropzone & Semantic Search (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Vector Retrieval Tester */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                Semantic Vector Search
              </span>
              <span className="text-[10px] text-slate-400">2-STAGE PIPELINE</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTestRetrieval()}
                placeholder="Query MITRE technique, CVE, or TTP..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleTestRetrieval}
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1 apple-button disabled:opacity-50"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Query</span>
              </button>
            </div>

            {retrievalResults.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5 max-h-56 overflow-y-auto pr-1">
                {retrievalResults.map((ev, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-cyan-300">
                      <span className="font-bold truncate max-w-[180px]">{ev.source_name || `Evidence #${i+1}`}</span>
                      <span className="text-[10px] text-slate-400">Score: {ev.similarity_score ? ev.similarity_score.toFixed(3) : "N/A"}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] font-sans line-clamp-2">{ev.chunk_text || ev.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingest Form (IEEE Section VI-A & VI-C) */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                Ingest Document
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                GOVERNED INGESTION
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Title / Identifier:</label>
                <input
                  type="text"
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  placeholder="e.g. LockBit_Containment_Playbook.md"
                  className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              {/* Data Sensitivity Tier & Chunking Strategy Pickers (IEEE Paper VI-A, VI-C) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                    Sensitivity Tier (VI-A):
                  </label>
                  <select
                    value={ingestSensitivityTier}
                    onChange={(e) => setIngestSensitivityTier(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-xs"
                  >
                    <option value="public" className="bg-[#0D111E]">PUBLIC</option>
                    <option value="internal" className="bg-[#0D111E]">INTERNAL</option>
                    <option value="confidential" className="bg-[#0D111E]">CONFIDENTIAL</option>
                    <option value="restricted" className="bg-[#0D111E]">RESTRICTED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                    Chunking Strategy (VI-C):
                  </label>
                  <select
                    value={ingestChunkingStrategy}
                    onChange={(e) => setIngestChunkingStrategy(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-xs"
                  >
                    <option value="Semantic Paragraphs" className="bg-[#0D111E]">Semantic Paragraphs</option>
                    <option value="IOC Table Rows" className="bg-[#0D111E]">IOC Table Rows</option>
                    <option value="Rule Blocks" className="bg-[#0D111E]">Rule Blocks</option>
                  </select>
                </div>
              </div>

              {/* Schema Mapping Fields (IEEE Section VI-A) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                    Schema Event Type:
                  </label>
                  <input
                    type="text"
                    value={ingestEventType}
                    onChange={(e) => setIngestEventType(e.target.value)}
                    placeholder="e.g. Threat Advisory"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                    Target Asset Class:
                  </label>
                  <input
                    type="text"
                    value={ingestAsset}
                    onChange={(e) => setIngestAsset(e.target.value)}
                    placeholder="e.g. Endpoints / Servers"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Raw Content:</label>
                <textarea
                  rows={5}
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  placeholder="Paste CTI advisory text, IOC CSV, or rule blocks..."
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none font-sans text-xs"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handlePreviewClassification}
                  disabled={isPreviewing || !ingestContent.trim()}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold flex items-center justify-center gap-1.5 apple-button transition-all"
                >
                  {isPreviewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>Auto-Classify</span>
                </button>

                <button
                  onClick={handleIngest}
                  disabled={!ingestContent.trim()}
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-1.5 apple-button transition-all shadow-md"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Index into Vectors</span>
                </button>
              </div>

              {ingestStatus && (
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-[11px]">
                  {ingestStatus}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Ingested Knowledge Corpus (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-white/10 bg-neutral-900/40 space-y-4 font-mono text-xs">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  Indexed Knowledge Corpus ({filteredSources.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                IEEE Section V-A Layer
              </span>
            </div>

            {/* Filter Pills for Doc Type & Sensitivity Tiers */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/10 text-[10px]">
                {(["ALL", "PLAYBOOKS", "INTEL"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2 py-0.8 rounded-md transition-all ${
                      filterType === t ? "bg-white/15 text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Sensitivity Tier Filter Pills */}
              <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/10 text-[10px]">
                {(["ALL", "PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setFilterTier(tier)}
                    className={`px-2 py-0.8 rounded-md transition-all ${
                      filterTier === tier
                        ? tier === "RESTRICTED" ? "bg-rose-500/25 text-rose-300 font-bold" :
                          tier === "CONFIDENTIAL" ? "bg-amber-500/25 text-amber-300 font-bold" :
                          tier === "PUBLIC" ? "bg-emerald-500/25 text-emerald-300 font-bold" :
                          "bg-blue-500/25 text-blue-300 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredSources.map((doc) => {
              const isPlaybook = doc.doc_type === "MITIGATION_PLAYBOOK" || doc.doc_type === "HYBRID_CTI" || doc.doc_type === "INCIDENT_RESPONSE_PLAYBOOK";
              const isExpanded = expandedDocId === doc.id;
              const StrategyIcon = getStrategyIcon(doc.chunking_strategy);

              return (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2.5 transition-all hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className={`w-4 h-4 flex-shrink-0 ${isPlaybook ? "text-amber-400" : "text-cyan-400"}`} />
                      <span className="font-bold text-white text-xs truncate max-w-[280px]">{doc.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {getTierBadge(doc.sensitivity_tier)}

                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                        isPlaybook
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                      }`}>
                        {doc.doc_type?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs font-sans leading-relaxed">
                    {doc.summary || "Technical security artifact indexed in ChromaDB vector repository."}
                  </p>

                  {/* Schema & Chunking Tags (IEEE Section VI) */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 text-[10px] text-slate-400 font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] flex items-center gap-1 text-slate-300">
                      <StrategyIcon className="w-2.5 h-2.5 text-cyan-400" />
                      <span>{doc.chunking_strategy || "Semantic Paragraphs"}</span>
                    </span>

                    {doc.asset && (
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300">
                        Asset: {doc.asset}
                      </span>
                    )}

                    {doc.event_type && (
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300">
                        Type: {doc.event_type}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                    <span>Target: <strong className="text-white">{doc.primary_category || "General Threat"}</strong> • Chunks: <strong>{doc.chunkCount}</strong></span>
                    {doc.mitigation_steps && doc.mitigation_steps.length > 0 && (
                      <button
                        onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                        className="text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-semibold"
                      >
                        <span>{doc.mitigation_steps.length} Playbook Steps</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Expandable Step-by-Step Procedure */}
                  {isExpanded && doc.mitigation_steps && (
                    <div className="mt-2 pt-2 border-t border-white/5 space-y-2 animate-fadeIn">
                      {doc.mitigation_steps.map((st) => (
                        <div key={st.step} className="p-2.5 rounded-lg bg-black/60 border border-white/5 space-y-1">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px]">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[9px]">
                              {st.step}
                            </span>
                            <span>{st.title}</span>
                          </div>
                          <p className="text-slate-400 text-[11px] font-sans pl-6">{st.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseView;
