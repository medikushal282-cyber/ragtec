import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Sparkles, 
  Check, 
  Key, 
  Eye, 
  EyeOff, 
  Activity, 
  ExternalLink, 
  ShieldCheck, 
  X,
  Zap,
  Layers,
  Lock,
  RefreshCw,
  Server,
  Radio,
  Search,
  Globe
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface GroqModelSpec {
  id: string;
  name: string;
  description: string;
  context_window: number;
  recommended: boolean;
  category: string;
  badge: string;
  tier: string;
}

export const TOP_TIER_GROQ_MODELS: GroqModelSpec[] = [
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B Flagship (Groq LPU)",
    description: "Groq Flagship 120B parameter reasoning model with 131k context. Top-tier multi-stage cybersecurity threat correlation, reverse engineering, and mitigation playbooks.",
    context_window: 131072,
    recommended: true,
    category: "Flagship Reasoning",
    badge: "120B Flagship",
    tier: "Tier 1: Comprehensive SOC"
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B High-Speed Reasoning (Groq LPU)",
    description: "High-throughput 20B parameter reasoning model on Groq. Optimal for real-time live CRUD file monitoring, rapid IOC triage, and instant verdicts.",
    context_window: 131072,
    recommended: true,
    category: "High-Speed Reasoning",
    badge: "20B Fast",
    tier: "Tier 2: Real-Time Stream"
  },
  {
    id: "openai/gpt-oss-safeguard-20b",
    name: "GPT-OSS Safeguard 20B (Policy Guard)",
    description: "Dedicated cybersecurity policy, zero-trust safeguard, and safety gating model on Groq. Enforces quarantine decisions and compliance rules.",
    context_window: 131072,
    recommended: true,
    category: "Policy & Safeguard",
    badge: "Safeguard 20B",
    tier: "Tier 2: Policy Enforcement"
  },
  {
    id: "qwen/qwen3.8-27b",
    name: "Qwen 3.8 27B Reasoning (Groq LPU)",
    description: "Advanced reasoning and code analysis model on Groq with 131k context. Superior for SAST code vulnerabilities (SQL Injection CWE-89, Command Injection CWE-78), AST analysis, and deobfuscation.",
    context_window: 131072,
    recommended: true,
    category: "SAST & Code Security",
    badge: "Qwen 27B",
    tier: "Tier 1: Code Forensics"
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile (Meta)",
    description: "Meta open-weight 70B flagship model on Groq for standard catalog deployments.",
    context_window: 128000,
    recommended: false,
    category: "Open Weight Flagship",
    badge: "70B Versatile",
    tier: "Tier 3: Standard Catalog"
  },
  {
    id: "allam-2-7b",
    name: "ALLAM 2 7B (Lightweight)",
    description: "Compact 7B parameter model on Groq for quick alerts and summary notifications.",
    context_window: 4096,
    recommended: false,
    category: "Compact",
    badge: "7B Fast",
    tier: "Tier 3: Lightweight"
  }
];

export type ProviderType = "groq" | "ollama" | "lmstudio" | "openrouter" | "gemini";

interface AIBrainSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const AIBrainSelectorModal: React.FC<AIBrainSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel
}) => {
  const [provider, setProvider] = useState<ProviderType>("groq");
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("ragsec_groq_api_key") || "");
  const [localUrl, setLocalUrl] = useState<string>("http://localhost:11434");
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const [testResult, setTestResult] = useState<{
    valid: boolean;
    message?: string;
    latency_ms?: number;
    error?: string;
  } | null>(null);

  const [models, setModels] = useState<GroqModelSpec[]>(TOP_TIER_GROQ_MODELS);

  const handleSaveKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem("ragsec_groq_api_key", newKey);
    setTestResult(null);
  };

  // Auto-Discover Models from Backend Provider Endpoint
  const handleDiscoverModels = async (prov: ProviderType = provider) => {
    setIsDiscovering(true);
    setDiscoveryStatus(null);
    setTestResult(null);

    const targetUrl = prov === "ollama" 
      ? localUrl || "http://localhost:11434"
      : (prov === "lmstudio" ? "http://localhost:1234/v1" : undefined);

    try {
      const res = await fetch(`${API_BASE_URL}/api/models/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: prov,
          api_key: apiKey.trim() || undefined,
          base_url: targetUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          const formatted: GroqModelSpec[] = data.models.map((m: any) => {
            const known = TOP_TIER_GROQ_MODELS.find(k => k.id === m.id);
            return {
              id: m.id,
              name: m.name || m.id,
              description: m.description || known?.description || `Live model from ${prov.toUpperCase()} (${m.context_window ? `${(m.context_window/1000).toFixed(0)}k ctx` : "Active"}).`,
              context_window: m.context_window || known?.context_window || 128000,
              recommended: m.recommended ?? known?.recommended ?? true,
              category: known?.category || (m.is_free ? "Free Tier" : "Discovered"),
              badge: known?.badge || (m.size_formatted || (m.active ? "Live" : "Active")),
              tier: known?.tier || `Discovered: ${prov.toUpperCase()}`
            };
          });

          setModels(formatted);
          const msg = data.message || `Successfully discovered ${formatted.length} active models from ${prov.toUpperCase()}!`;
          setDiscoveryStatus(msg);
          toast.success(`Discovered ${formatted.length} models from ${prov.toUpperCase()}`);
        } else {
          setDiscoveryStatus(data.error || data.message || `No active models found on ${prov.toUpperCase()}.`);
          toast.info(data.message || "Model discovery completed.");
        }
      } else {
        throw new Error("Model discovery endpoint returned error");
      }
    } catch (err: any) {
      toast.error(`Discovery error: ${err.message}`);
      setDiscoveryStatus(`Could not reach ${prov.toUpperCase()} service. Please check your network or key.`);
    } finally {
      setIsDiscovering(false);
    }
  };

  useEffect(() => {
    // Initial fetch of verified catalog
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/models/groq-top-tier`);
        if (res.ok) {
          const data = await res.json();
          if (data.models && Array.isArray(data.models) && data.models.length > 0) {
            setModels(data.models);
          }
        }
      } catch {}
    };
    fetchCatalog();
  }, []);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a Groq API Key (starts with gsk_) first.");
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/models/test-groq-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey.trim(), model: selectedModel })
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
        if (data.valid) {
          toast.success(`Connected! Latency: ${data.latency_ms} ms`);
          // Trigger live discovery with the validated key
          handleDiscoverModels(provider);
        } else {
          toast.error(data.error || "Groq connection failed.");
        }
      } else {
        throw new Error("HTTP connection test failed");
      }
    } catch (err: any) {
      setTestResult({ valid: false, error: err.message });
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSelect = async (modelId: string) => {
    onSelectModel(modelId);
    localStorage.setItem("ragsec_active_brain", modelId);
    toast.success(`Active AI Brain switched to ${modelId.split("/").pop()}`);

    try {
      await fetch(`${API_BASE_URL}/api/models/active-brain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId, provider: provider, api_key: apiKey || undefined })
      });
    } catch {}
  };

  if (!isOpen) return null;

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const currentSpec = models.find(m => m.id === selectedModel) || models[0] || TOP_TIER_GROQ_MODELS[0];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="apple-panel max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-blue-500/30 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  AI Brain Selector & Model Discovery Engine
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  AUTO-DISCOVERY ENABLED
                </span>
              </div>
              <p className="text-xs text-[#8E8E93]">
                Discover real models directly from Groq LPUs or local engines, view verified specs, and activate your reasoning brain.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-[#8E8E93] hover:text-white transition-all apple-button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PROVIDER SELECTION TABS */}
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2 flex-shrink-0 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#8E8E93] font-medium mr-1 text-[11px]">Provider:</span>
            {[
              { id: "groq" as ProviderType, label: "Groq Cloud LPU", badge: "Production" },
              { id: "ollama" as ProviderType, label: "Local Ollama", badge: ":11434" },
              { id: "lmstudio" as ProviderType, label: "LM Studio / LocalAI", badge: ":1234" },
              { id: "openrouter" as ProviderType, label: "OpenRouter Gateway", badge: "400+ Models" },
              { id: "gemini" as ProviderType, label: "Google Gemini", badge: "2.0 Flash" }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProvider(p.id);
                  handleDiscoverModels(p.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all apple-button ${
                  provider === p.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white/[0.04] text-[#8E8E93] hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                  provider === p.id ? "bg-white/20 text-white" : "bg-white/[0.05] text-[#8E8E93]"
                }`}>
                  {p.badge}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => handleDiscoverModels(provider)}
            disabled={isDiscovering}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 apple-button transition-all disabled:opacity-50 flex-shrink-0"
            title="Scan and auto-discover all real active models from provider"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? "animate-spin text-cyan-400" : "text-cyan-400"}`} />
            <span>{isDiscovering ? "Discovering..." : "Auto-Discover Models"}</span>
          </button>
        </div>

        {/* API KEY & ENGINE CONFIGURATION BAR */}
        <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.07] space-y-2 flex-shrink-0">
          {provider === "groq" && (
            <>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  <span>Groq Cloud API Key:</span>
                </div>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => handleSaveKey(e.target.value)}
                    placeholder="gsk_... (Enter Groq API Key to validate and discover your live account models)"
                    className="w-full px-3 py-1.5 pr-8 rounded-xl bg-black/40 border border-white/[0.1] text-xs font-mono text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  onClick={handleTestConnection}
                  disabled={isTestingKey}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 font-medium text-xs flex items-center gap-1.5 apple-button transition-all disabled:opacity-50"
                >
                  <Activity className={`w-3 h-3 ${isTestingKey ? "animate-spin" : ""}`} />
                  <span>{isTestingKey ? "Testing..." : "Test Connection"}</span>
                </button>
              </div>
            </>
          )}

          {provider === "ollama" && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300 font-medium">Local Ollama URL:</span>
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  className="flex-1 px-3 py-1 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-white"
                />
              </div>
              <button
                onClick={() => handleDiscoverModels("ollama")}
                className="px-3 py-1 rounded-lg bg-blue-600 text-white font-medium text-xs apple-button"
              >
                Scan Port 11434
              </button>
            </div>
          )}

          {provider === "lmstudio" && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300 font-medium">LM Studio OpenAI Endpoint:</span>
                <span className="font-mono text-blue-300">http://localhost:1234/v1</span>
              </div>
              <button
                onClick={() => handleDiscoverModels("lmstudio")}
                className="px-3 py-1 rounded-lg bg-blue-600 text-white font-medium text-xs apple-button"
              >
                Scan Port 1234
              </button>
            </div>
          )}

          {discoveryStatus && (
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[11px] font-mono text-cyan-300 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>{discoveryStatus}</span>
            </div>
          )}

          {testResult && (
            <div className={`p-2 rounded-lg text-[11px] font-mono flex items-center justify-between border ${
              testResult.valid
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
            }`}>
              <span>{testResult.message || testResult.error}</span>
              {testResult.latency_ms !== undefined && (
                <span className="font-bold">{testResult.latency_ms} ms</span>
              )}
            </div>
          )}
        </div>

        {/* SEARCH FILTER & MODEL COUNT HEADER */}
        <div className="flex items-center justify-between gap-3 flex-shrink-0 px-1 text-xs">
          <div className="flex items-center gap-2 text-[#8E8E93]">
            <span>Discovered Real Models ({filteredModels.length}):</span>
            <span className="font-mono text-[11px] text-blue-400 font-semibold">
              Active: {currentSpec?.name || selectedModel}
            </span>
          </div>

          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter discovered models..."
              className="w-full pl-8 pr-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* MODEL CARDS GRID */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredModels.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative space-y-2.5 ${
                    isSelected
                      ? "bg-blue-600/15 border-blue-500/60 shadow-lg shadow-blue-500/15"
                      : "bg-white/[0.025] hover:bg-white/[0.05] border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-blue-500/20 text-blue-400" : "bg-white/[0.05] text-[#8E8E93]"
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-white leading-tight">
                          {m.name}
                        </h4>
                        <span className="text-[10px] text-cyan-400 font-mono font-medium">
                          {m.badge}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          ACTIVE BRAIN
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(m.id);
                          }}
                          className="px-2.5 py-0.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#8E8E93] hover:text-white transition-all"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {m.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] text-[10px] font-mono text-[#8E8E93]">
                    <span>Context: {(m.context_window / 1000).toFixed(0)}k tokens</span>
                    <span className="text-slate-400 font-medium">{m.tier}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 flex-shrink-0 text-xs">
          <div className="flex items-center gap-2 text-[#8E8E93]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pure static inspection • Real production models verified on Groq LPUs</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold apple-button shadow-sm transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIBrainSelectorModal;
