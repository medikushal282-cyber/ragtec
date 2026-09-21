import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Download, 
  Key, 
  Settings2, 
  ShieldCheck, 
  FileCode2, 
  Terminal, 
  Copy, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Server, 
  Database,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface ChatTurn {
  id: string;
  sender: "user" | "assistant";
  timestamp: string;
  text: string;
  provider?: string;
  model?: string;
  citations?: string[];
  evidence?: any[];
}

export const AICopilotView: React.FC = () => {
  // Contiguous Multi-turn Messages State
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: "turn-0",
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString(),
      text: "Hello Analyst. I am the **RAGSec SOC Copilot**, your contiguous AI threat response assistant grounded in live CTI knowledge and endpoint telemetry.\n\nI retain full conversational context memory across our investigation. You can ask for threat analysis, step-by-step containment playbooks, or ready-to-execute PowerShell/Bash mitigation scripts.",
      provider: "RAGSec Neural Core",
      model: "bge-small + CrossEncoder"
    }
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Model & Provider Configuration State
  const [provider, setProvider] = useState<string>("groq"); // groq | openrouter | ollama | lmstudio | gemini
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("llama-3.3-70b-versatile");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [discoveringModels, setDiscoveringModels] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Active Incident Context Injection
  const [selectedIncident, setSelectedIncident] = useState<string>("INC-2026-9042 (Ransomware Shadow Copy)");
  const [groundingActive, setGroundingActive] = useState<boolean>(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const defaultModels: Record<string, string[]> = {
    groq: [
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "mixtral-8x7b-32768",
      "llama3-70b-8192",
      "gemma2-9b-it"
    ],
    openrouter: [
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-r1",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "mistralai/mistral-large-2407"
    ],
    ollama: [
      "llama3.1",
      "mistral",
      "deepseek-r1",
      "qwen2.5-coder",
      "phi3"
    ],
    lmstudio: [
      "local-model",
      "mistral-7b-instruct",
      "llama-3-8b-instruct"
    ],
    gemini: [
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash"
    ]
  };

  useEffect(() => {
    setAvailableModels(defaultModels[provider] || ["default"]);
    if (defaultModels[provider] && defaultModels[provider].length > 0) {
      setSelectedModel(defaultModels[provider][0]);
    }
  }, [provider]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleDiscoverModels = async () => {
    setDiscoveringModels(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/models/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          api_key: apiKey || undefined,
          base_url: baseUrl || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models) && data.models.length > 0) {
          setAvailableModels(data.models);
          setSelectedModel(data.models[0]);
        }
      }
    } catch (err) {
      console.warn("Model discovery error:", err);
    } finally {
      setDiscoveringModels(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isThinking) return;

    const userTurn: ChatTurn = {
      id: `turn-user-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
      text: query
    };

    // Update contiguous messages
    const updatedMessages = [...messages, userTurn];
    setMessages(updatedMessages);
    if (!textToSend) setInputQuery("");
    setIsThinking(true);

    // Build contiguous history format for backend
    const historyPayload = updatedMessages.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/analysis/chat-mitigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          conversation_history: historyPayload,
          threat_category: selectedIncident.includes("Ransomware") ? "Ransomware" : "General Threat",
          file_name: "vssadmin.exe",
          target_host: "FIN-WS-042",
          incident_id: selectedIncident.split(" ")[0],
          provider,
          api_key: apiKey || undefined,
          base_url: baseUrl || undefined,
          model: selectedModel
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiTurn: ChatTurn = {
          id: `turn-ai-${Date.now()}`,
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString(),
          text: data.reply || "Analysis complete.",
          provider: data.provider || provider,
          model: data.model || selectedModel,
          citations: data.evidence_citations || [],
          evidence: data.evidence || []
        };
        setMessages((prev) => [...prev, aiTurn]);
      } else {
        const errTurn: ChatTurn = {
          id: `turn-err-${Date.now()}`,
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString(),
          text: "I encountered a communication issue with the selected AI model provider. Evaluating locally with deterministic SOC playbooks.",
          provider: "Local Offline Engine",
          model: "deterministic-rules"
        };
        setMessages((prev) => [...prev, errTurn]);
      }
    } catch (err) {
      const fallbackTurn: ChatTurn = {
        id: `turn-err-${Date.now()}`,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString(),
        text: `### Grounded Incident Mitigation Playbook for "${query}"\n\n**Actionable Response Plan:**\n1. **Endpoint Isolation:** Immediately disconnect the target device from local subnet.\n2. **Process Termination:** Terminate parent command handles: \`Stop-Process -Name powershell -Force\`\n3. **Artifact Quarantine:** Relocate suspicious files to \`.quarantine/\` enclave.\n4. **Defense Evasion Block:** Apply host firewall rule to block remote C2 egress.`,
        provider: "Local SOC Rules Engine",
        model: "Deterministic Safe Fallback"
      };
      setMessages((prev) => [...prev, fallbackTurn]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearMemory = () => {
    setMessages([
      {
        id: "turn-reset",
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString(),
        text: "Conversation memory cleared. Starting a fresh contiguous SOC investigation session.",
        provider: "RAGSec Neural Core",
        model: "Ready"
      }
    ]);
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .map((m) => `### [${m.timestamp}] ${m.sender.toUpperCase()} (${m.provider || "User"})\n${m.text}\n`)
      .join("\n---\n\n");
    const blob = new Blob([transcript], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ragsec_investigation_transcript_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickPrompts = [
    "How do I contain the active LockBit 3.0 ransomware incident?",
    "Generate a PowerShell script to isolate the host and kill the malicious process.",
    "What MITRE ATT&CK technique disables volume shadow copies?",
    "Show me the recommended Sigma / YARA rule to detect in-memory AMSI bypasses."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-7xl mx-auto space-y-4 font-mono select-text">
      {/* Top Header Bar with Model Selector & Memory Telemetry */}
      <div className="p-4 rounded-2xl bg-[#080C14] border border-white/10 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">AI SOC Copilot & Investigation Engine</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                CONTIGUOUS MEMORY
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multi-turn conversational reasoning grounded in ChromaDB CTI vectors & endpoint telemetry.
            </p>
          </div>
        </div>

        {/* Action Controls & Memory Status */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Memory: <strong className="text-cyan-300">{messages.length} Turns</strong></span>
          </div>

          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              settingsOpen
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Model Config</span>
            {settingsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleExportTranscript}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download full conversation transcript"
          >
            <Download className="w-3.5 h-3.5" />
            Transcript
          </button>

          <button
            onClick={handleClearMemory}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Clear all context memory and start over"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Chat
          </button>
        </div>
      </div>

      {/* Model Configuration Dropdown Drawer */}
      {settingsOpen && (
        <div className="p-4 rounded-2xl bg-[#090D18] border border-cyan-500/40 space-y-4 text-xs flex-shrink-0 shadow-2xl animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-white uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              LLM Provider & Inference Pipeline Setup
            </span>
            <span className="text-[10px] text-slate-400">
              Select local or cloud model to power multi-turn SOC reasoning
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Provider:</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="groq">Groq Cloud (Ultra Fast Llama-3.3)</option>
                <option value="openrouter">OpenRouter (Claude, DeepSeek, GPT-4o)</option>
                <option value="ollama">Local Ollama (Offline Local Models)</option>
                <option value="lmstudio">LM Studio / Local OpenAI Compatible</option>
                <option value="gemini">Google Gemini API</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Model Selection:</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-cyan-300 focus:outline-none focus:border-cyan-500"
                >
                  {availableModels.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  onClick={handleDiscoverModels}
                  disabled={discoveringModels}
                  className="p-2.5 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-white flex-shrink-0 cursor-pointer"
                  title="Auto-discover models from provider"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${discoveringModels ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">API Key (if required):</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_... / sk-or-... / AIza..."
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Active Incident Link:</label>
              <select
                value={selectedIncident}
                onChange={(e) => setSelectedIncident(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="INC-2026-9042 (Ransomware Shadow Copy)">INC-2026-9042: Ransomware Shadow Copy</option>
                <option value="INC-2026-8812 (Cobalt Strike Egress)">INC-2026-8812: Cobalt Strike Egress</option>
                <option value="INC-2026-7491 (PowerShell AMSI Bypass)">INC-2026-7491: PowerShell AMSI Bypass</option>
                <option value="INC-GENERAL (General Workspace Telemetry)">INC-GENERAL: General Workspace Telemetry</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Contiguous Chat History Scroll Area */}
      <div className="flex-1 p-5 rounded-2xl bg-[#080C14] border border-white/10 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((turn) => {
          const isUser = turn.sender === "user";
          return (
            <div
              key={turn.id}
              className={`flex gap-3.5 max-w-4xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  isUser
                    ? "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white"
                    : "bg-cyan-950/60 border border-cyan-500/40 text-cyan-400"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 space-y-2 text-xs leading-relaxed max-w-2xl ${
                  isUser
                    ? "bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-white border border-cyan-500/40"
                    : "bg-black/50 text-slate-200 border border-white/10"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/10 pb-1.5">
                  <span className="font-bold flex items-center gap-1.5">
                    {isUser ? "SOC Analyst (You)" : "RAGSec Copilot"}
                    {turn.provider && (
                      <span className="text-cyan-400 font-normal">[{turn.provider}]</span>
                    )}
                  </span>
                  <span>{turn.timestamp}</span>
                </div>

                {/* Formatted Content */}
                <div className="font-sans text-xs whitespace-pre-wrap select-text leading-relaxed">
                  {turn.text}
                </div>

                {/* Citations & Evidence Attachments */}
                {Array.isArray(turn.citations) && turn.citations.length > 0 && (
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-cyan-400" />
                      Grounded Citations:
                    </span>
                    {turn.citations.map((c, ci) => (
                      <span key={ci} className="px-1.5 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/30">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex gap-3.5 max-w-xl mr-auto">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl p-4 bg-black/50 border border-cyan-500/30 flex items-center gap-2.5 text-xs text-cyan-300">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Retrieving CTI playbooks & formulating multi-turn response...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2 flex-shrink-0 text-xs">
        <span className="text-slate-400 text-[11px] font-bold uppercase flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Investigate:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            disabled={isThinking}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-950/40 hover:text-cyan-300 border border-white/10 text-slate-300 text-[11px] transition-all cursor-pointer truncate max-w-xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 rounded-2xl bg-[#080C14] border border-white/10 flex items-center gap-3 flex-shrink-0 shadow-xl"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask anything regarding ${selectedIncident.split(" ")[0]} or general threat mitigation...`}
          disabled={isThinking}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
        />

        <button
          type="submit"
          disabled={isThinking || !inputQuery.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-cyan-500/20"
        >
          {isThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </form>
    </div>
  );
};
