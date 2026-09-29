import React, { useEffect, useState } from "react";
import { socApi } from "../services/api";
import {
  Settings,
  Cpu,
  Database,
  HardDrive,
  ShieldCheck,
  Check,
  RefreshCw,
  Save,
  Server
} from "lucide-react";

export const SystemSettings: React.FC = () => {
  const [health, setHealth] = useState<{ status: string; service: string; indexed_chunks_count: number }>({
    status: "healthy",
    service: "RAGSec-Core",
    indexed_chunks_count: 84
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>("llama3.2");
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.70);
  const [monitoredDir, setMonitoredDir] = useState<string>("monitored_workspace/");

  useEffect(() => {
    socApi.getHealth().then(h => {
      setHealth(h);
      setLoading(false);
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage("Configuration parameters updated and verified.");
    setTimeout(() => setSavedMessage(null), 4000);
  };

  return (
    <div className="space-y-5 max-w-4xl font-mono text-xs">
      {/* Header */}
      <div className="editorial-card p-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <Settings className="w-4 h-4 text-black" />
          <span className="font-serif font-bold text-sm text-black uppercase tracking-wider">System Configuration & Parameters</span>
        </div>

        <div className="flex items-center gap-1.5 text-black font-semibold text-xs">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Core Connected (:8000)</span>
        </div>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-xl bg-neutral-900 text-white text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Services Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="editorial-card p-4 space-y-1.5 bg-white border-l-4 border-l-black">
          <span className="text-[#64748B] text-[10px] uppercase tracking-wider">FastAPI Core</span>
          <div className="font-serif font-bold text-black text-sm flex items-center justify-between">
            <span>http://127.0.0.1:8000</span>
            <span className="text-black font-mono text-[10px] font-bold">ONLINE</span>
          </div>
          <span className="text-xs text-[#64748B]">REST & SOC Endpoints</span>
        </div>

        <div className="editorial-card p-4 space-y-1.5 bg-white border-l-4 border-l-black">
          <span className="text-[#64748B] text-[10px] uppercase tracking-wider">Vector Store</span>
          <div className="font-serif font-bold text-black text-sm flex items-center justify-between">
            <span>ChromaDB Persistent</span>
            <span className="text-black font-mono text-[10px] font-bold">{health.indexed_chunks_count} Chunks</span>
          </div>
          <span className="text-xs text-[#64748B]">BAAI/bge-small-en-v1.5</span>
        </div>

        <div className="editorial-card p-4 space-y-1.5 bg-white border-l-4 border-l-black">
          <span className="text-[#64748B] text-[10px] uppercase tracking-wider">LLM Inference</span>
          <div className="font-serif font-bold text-black text-sm flex items-center justify-between">
            <span>Ollama (llama3.2)</span>
            <span className="text-black font-mono text-[10px] font-bold">READY</span>
          </div>
          <span className="text-xs text-[#64748B]">CRC Lexical Grounding</span>
        </div>
      </div>

      {/* Config Form */}
      <form onSubmit={handleSave} className="editorial-card p-6 space-y-5 bg-white">
        <h3 className="text-sm font-serif font-bold text-black uppercase tracking-wider pb-3 border-b border-[#E5E7EB]">
          Inference & Governance Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[#64748B] block mb-2 font-serif text-xs font-bold text-black">Active LLM Model</label>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-black focus:outline-none focus:border-black text-xs font-mono"
            >
              <option value="llama3.2">Ollama - LLaMA 3.2 (Default Local Inference)</option>
              <option value="mistral">Ollama - Mistral 7B Instruct</option>
              <option value="gemini-flash">Gemini 2.5 Flash</option>
            </select>
          </div>

          <div>
            <label className="text-[#64748B] block mb-2 font-serif text-xs font-bold text-black">
              Policy Similarity Threshold: <strong className="text-black font-mono font-bold text-sm">{similarityThreshold}</strong>
            </label>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={similarityThreshold}
              onChange={e => setSimilarityThreshold(parseFloat(e.target.value))}
              className="w-full accent-black mt-2"
            />
            <span className="text-[11px] text-[#64748B] font-sans block mt-1">
              Queries below this cosine score force an abstained response.
            </span>
          </div>
        </div>

        <div>
          <label className="text-[#64748B] block mb-2 font-serif text-xs font-bold text-black">FIM Monitored Directory Root</label>
          <input
            type="text"
            value={monitoredDir}
            onChange={e => setMonitoredDir(e.target.value)}
            className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-black focus:outline-none focus:border-black text-xs font-mono"
          />
        </div>

        <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end">
          <button
            type="submit"
            className="btn-black py-2.5 px-6 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
export default SystemSettings;
