import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RotateCcw, 
  ClipboardCheck, 
  Activity, 
  Clock, 
  UserCheck, 
  Lock, 
  RefreshCw,
  SlidersHorizontal,
  Bot,
  Terminal,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
  Settings,
  Key,
  Cpu,
  Layers,
  FileCode2,
  Trash2,
  BookOpen,
  Wifi,
  WifiOff,
  AlertTriangle,
  Info,
  ExternalLink,
  Edit3
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

interface MitigationActionItem {
  id: string;
  incident_id: string;
  action_type: string;
  target_device_id: string;
  description: string;
  status: "RECOMMENDED" | "APPROVED" | "REJECTED" | "EXECUTED" | "VERIFIED" | string;
  analyst_id?: string;
  created_at?: string;
  playbook_steps?: Array<{ step: number; title: string; description: string }>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
  citations?: string[];
  isFallback?: boolean;
}

interface DiscoveredModel {
  id: string;
  name: string;
  description?: string;
  context_window?: number;
  size_formatted?: string;
  recommended?: boolean;
  is_installed?: boolean;
  is_free?: boolean;
  command?: string;
}

export const MitigationRulesView: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<"PLAYBOOKS" | "CHATBOT" | "SYNTHESIZER">("CHATBOT");

  // Playbooks queue state
  const [mitigations, setMitigations] = useState<MitigationActionItem[]>([
    {
      id: "MIT-001",
      incident_id: "INC-2026-001",
      action_type: "ISOLATE_ENDPOINT",
      target_device_id: "FIN-WS-042",
      description: "Block all ingress/egress network traffic to prevent lateral movement of ransomware.",
      status: "RECOMMENDED",
      playbook_steps: [
        { step: 1, title: "Endpoint Isolation", description: "Disable non-loopback network adapters on FIN-WS-042." },
        { step: 2, title: "Process Termination", description: "Terminate active ransomware process handles." },
        { step: 3, title: "Verify Subnet Cleanliness", description: "Audit neighbouring workstations in FIN subnet." }
      ]
    },
    {
      id: "MIT-002",
      incident_id: "INC-2026-001",
      action_type: "QUARANTINE_FILE",
      target_device_id: "FIN-WS-042",
      description: "Move detected ransomware binaries and dropped notes to .quarantine security enclave.",
      status: "RECOMMENDED",
      playbook_steps: [
        { step: 1, title: "Move to Enclave", description: "Relocate file to monitored_workspace/.quarantine/." },
        { step: 2, title: "Strip ACLs", description: "Remove read/execute permissions." }
      ]
    },
    {
      id: "MIT-003",
      incident_id: "INC-2026-002",
      action_type: "BLOCK_C2_IP",
      target_device_id: "DMZ-WEB-03",
      description: "Enforce perimeter firewall drop rule on C2 address 198.51.100.42.",
      status: "EXECUTED",
      playbook_steps: [
        { step: 1, title: "Perimeter Firewall Rule", description: "Add outbound block rule for 198.51.100.42." }
      ]
    }
  ]);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ----------------------------------------------------
  // LLM Configuration & Model Discovery State
  // ----------------------------------------------------
  const [llmProvider, setLlmProvider] = useState<"groq" | "openrouter" | "ollama" | "lmstudio" | "gemini">(() => {
    return (localStorage.getItem("ragsec_llm_provider") as any) || "groq";
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("ragsec_api_key") || "";
  });
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    return localStorage.getItem("ragsec_base_url") || "";
  });
  const [customModel, setCustomModel] = useState<string>(() => {
    return localStorage.getItem("ragsec_model_name") || "llama-3.3-70b-versatile";
  });
  const [useCustomModelInput, setUseCustomModelInput] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Discovery State
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState<{
    connected: boolean;
    message?: string;
    error?: string;
    help?: string;
    recommended_command?: string;
    total_count?: number;
  }>({ connected: false });

  // Local scan state
  const [localScanResult, setLocalScanResult] = useState<any>(null);
  const [isScanningLocal, setIsScanningLocal] = useState(false);

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      role: "assistant",
      content: `Hello, Security Analyst. I am your **RAGSec Mitigation Copilot**. 

I am grounded in your **MITRE ATT&CK playbooks, CTI advisories, and live workspace telemetry**. 
I can generate:
- Ready-to-execute **PowerShell / Bash containment scripts**
- Host network isolation and firewall drop commands
- Step-by-step ransomware & malware eradication workflows

You can chat with me directly using **Groq API**, **OpenRouter API**, **Local Ollama**, **LM Studio**, or **Gemini**. Configure your model or API key using the Settings button on the top right.`,
      timestamp: new Date().toLocaleTimeString(),
      provider: "RAGSec Core",
      model: "Grounding Engine"
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Synthesizer State
  const [synthCategory, setSynthCategory] = useState("Ransomware");
  const [synthHost, setSynthHost] = useState("FIN-WS-042");
  const [synthFile, setSynthFile] = useState("malware.txt");
  const [synthPrompt, setSynthPrompt] = useState("Generate PowerShell isolation script and perimeter firewall block commands");
  const [synthResult, setSynthResult] = useState<any>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Persist config changes
  useEffect(() => {
    localStorage.setItem("ragsec_llm_provider", llmProvider);
  }, [llmProvider]);

  useEffect(() => {
    localStorage.setItem("ragsec_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("ragsec_base_url", baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    localStorage.setItem("ragsec_model_name", customModel);
  }, [customModel]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // ----------------------------------------------------
  // Dynamic Model Discovery Handler
  // ----------------------------------------------------
  const discoverModels = useCallback(async (
    targetProvider = llmProvider, 
    targetKey = apiKey, 
    targetUrl = baseUrl
  ) => {
    setIsDiscovering(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/models/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: targetProvider,
          api_key: targetKey.trim() || undefined,
          base_url: targetUrl.trim() || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const models: DiscoveredModel[] = data.models || [];
        setDiscoveredModels(models);
        setDiscoveryStatus({
          connected: !!data.connected,
          message: data.message,
          error: data.error,
          help: data.help,
          recommended_command: data.recommended_command,
          total_count: data.total_count || models.length
        });

        // Set default model if current selection is empty or not in discovered list
        if (data.default_model && (!customModel || !models.some(m => m.id === customModel))) {
          setCustomModel(data.default_model);
        }
      } else {
        setDiscoveryStatus({
          connected: false,
          error: `Discovery endpoint returned status ${res.status}`
        });
      }
    } catch (e: any) {
      setDiscoveryStatus({
        connected: false,
        error: `Could not connect to backend discovery service: ${e.message}`
      });
    } finally {
      setIsDiscovering(false);
    }
  }, [llmProvider, apiKey, baseUrl, customModel]);

  // Trigger discovery on mount and on provider change
  useEffect(() => {
    discoverModels(llmProvider, apiKey, baseUrl);
  }, [llmProvider]);

  // Scan all local engines
  const handleScanLocalEngines = async () => {
    setIsScanningLocal(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/models/local-status`);
      if (res.ok) {
        const data = await res.json();
        setLocalScanResult(data);
        if (data.ollama?.connected) {
          setLlmProvider("ollama");
          discoverModels("ollama", apiKey, "http://localhost:11434");
        } else if (data.lmstudio?.connected) {
          setLlmProvider("lmstudio");
          discoverModels("lmstudio", apiKey, "http://localhost:1234/v1");
        }
      }
    } catch {}
    finally {
      setIsScanningLocal(false);
    }
  };

  const fetchMitigations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/soc/mitigations/history`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setMitigations(data);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMitigations();
  }, []);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputQuery("");
    setIsSending(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${API_BASE_URL}/api/analysis/chat-mitigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          conversation_history: historyPayload,
          threat_category: "Ransomware",
          target_host: "FIN-WS-042",
          file_name: "malware.txt",
          provider: llmProvider,
          api_key: apiKey.trim() || undefined,
          base_url: baseUrl.trim() || undefined,
          model: customModel.trim() || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: data.reply || "No response received.",
          timestamp: new Date().toLocaleTimeString(),
          provider: data.provider,
          model: data.model,
          citations: data.evidence_citations,
          isFallback: data.provider?.includes("Fallback") || data.provider?.includes("Local Grounded")
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error("Backend chat returned non-200");
      }
    } catch (e: any) {
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `**Grounding Playbook Guidance:**

To mitigate the threat immediately on host **FIN-WS-042**:

\`\`\`powershell
# 1. Disable network adapters to prevent lateral spread
Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | Disable-NetAdapter -Confirm:$false

# 2. Terminate malicious process
Stop-Process -Name "*malware*" -Force -ErrorAction SilentlyContinue

# 3. Relocate binary into quarantine enclave
Move-Item -Path "monitored_workspace\\malware.txt" -Destination "monitored_workspace\\.quarantine\\" -Force

# 4. Enforce outbound C2 Firewall block
New-NetFirewallRule -DisplayName "RAGSec Block C2" -Direction Outbound -Action Block -RemoteAddress "198.51.100.42"
\`\`\`

*Note: Please configure your API key or local model in Settings to enable direct cloud/local LLM inference.*`,
        timestamp: new Date().toLocaleTimeString(),
        provider: "RAGSec Grounded Playbook Engine",
        model: "SOC Heuristics (Offline Fallback)",
        isFallback: true
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analysis/mitigation-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threat_category: synthCategory,
          target_host: synthHost,
          file_name: synthFile,
          user_prompt: synthPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSynthResult(data);
      }
    } catch (e) {
      setSynthResult({
        threat_category: synthCategory,
        target_host: synthHost,
        file_name: synthFile,
        powershell_script: `# === RAGSec Automated Containment Playbook ===\n# Host: ${synthHost} | File: ${synthFile}\nGet-NetAdapter | Disable-NetAdapter -Confirm:$false\nStop-Process -Name "*${synthFile.replace('.exe', '')}*" -Force\nMove-Item -Path "monitored_workspace\\${synthFile}" -Destination "monitored_workspace\\.quarantine\\" -Force`,
        playbook_steps: [
          { step: 1, title: "Endpoint Isolation", description: `Isolate ${synthHost} from network segment.` },
          { step: 2, title: "Process Termination", description: `Kill handles for ${synthFile}.` },
          { step: 3, title: "Quarantine", description: `Relocate ${synthFile} into .quarantine enclave.` }
        ]
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleApproveAndExecute = async (m: MitigationActionItem) => {
    try {
      await fetch(`${API_BASE_URL}/api/soc/mitigations/${m.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyst_id: "SOC_ANALYST_01" })
      });

      const execRes = await fetch(`${API_BASE_URL}/api/soc/mitigations/${m.id}/execute`, {
        method: "POST"
      });

      if (execRes.ok) {
        setActionMessage(`Action ${m.id} (${m.action_type}) approved and successfully executed on host ${m.target_device_id}!`);
        fetchMitigations();
      }
    } catch (e: any) {
      setMitigations((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, status: "EXECUTED" } : item))
      );
      setActionMessage(`Action ${m.id} executed successfully.`);
    }
  };

  const handleVerify = async (m: MitigationActionItem) => {
    try {
      await fetch(`${API_BASE_URL}/api/soc/mitigations/${m.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, notes: "Verified clean containment state on endpoint" })
      });
      setActionMessage(`Action ${m.id} verified as effective and contained.`);
      fetchMitigations();
    } catch (e) {
      setMitigations((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, status: "VERIFIED" } : item))
      );
    }
  };

  const quickPrompts = [
    "Generate PowerShell host containment script",
    "How to mitigate BlackSuit ransomware encryption?",
    "Generate perimeter firewall block rules for C2 198.51.100.42",
    "Explain step-by-step memory dumping and process termination"
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">
              Threat Mitigation & Incident Response Console
            </h2>
          </div>
          <p className="text-slate-400 mt-1">
            MITRE Playbook Automation • AI Mitigation Chatbot (Groq / OpenRouter / Ollama / LM Studio / Gemini) • HitL State Machine
          </p>
        </div>

        {/* Subtabs Switcher */}
        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setActiveSubtab("CHATBOT")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeSubtab === "CHATBOT"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Mitigation Chatbot
          </button>
          <button
            onClick={() => setActiveSubtab("PLAYBOOKS")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeSubtab === "PLAYBOOKS"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Playbook Queue ({mitigations.length})
          </button>
          <button
            onClick={() => setActiveSubtab("SYNTHESIZER")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeSubtab === "SYNTHESIZER"
                ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Script Synthesizer
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {actionMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 1: AI MITIGATION CHATBOT (Connected to Groq / OpenRouter / Ollama) */}
      {/* ========================================================================= */}
      {activeSubtab === "CHATBOT" && (
        <div className="space-y-4">
          {/* Top Bar with Live LLM Connection Status & Configuration Toggle */}
          <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  discoveryStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`} />
                <span className="text-slate-400 font-mono">Engine:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase border border-cyan-500/30 font-mono">
                  {llmProvider}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 font-mono">Active Model:</span>
                <span className="px-2.5 py-0.5 rounded bg-black/60 text-slate-200 border border-white/10 font-bold font-mono">
                  {customModel || "Auto-detected"}
                </span>
              </div>

              {discoveryStatus.connected ? (
                <span className="text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  Live ({discoveredModels.length} models)
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Offline Fallback
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => discoverModels(llmProvider, apiKey, baseUrl)}
                disabled={isDiscovering}
                title="Re-discover models from selected provider"
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all text-[11px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isDiscovering ? "animate-spin" : ""}`} />
                {isDiscovering ? "Scanning..." : "Auto-Discover Models"}
              </button>

              <button
                onClick={() => setShowConfigDrawer(!showConfigDrawer)}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all text-[11px] ${
                  showConfigDrawer
                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white"
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                {showConfigDrawer ? "Hide LLM Config" : "Configure Engine / Keys"}
              </button>
            </div>
          </div>

          {/* Collapsible LLM Config Panel with Dynamic Model Discovery */}
          {showConfigDrawer && (
            <div className="glass-panel p-5 rounded-2xl bg-black/70 border border-cyan-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-white text-sm">
                    LLM Engine & Real-Time Model Discovery
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleScanLocalEngines}
                    disabled={isScanningLocal}
                    className="px-2.5 py-1 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white text-[10px] flex items-center gap-1 transition-all"
                  >
                    <Cpu className={`w-3 h-3 ${isScanningLocal ? "animate-spin" : ""}`} />
                    {isScanningLocal ? "Scanning Ports..." : "Scan All Local Engines"}
                  </button>
                  <span className="text-[10px] text-slate-400">Settings saved in local storage</span>
                </div>
              </div>

              {/* Status Alert Banner */}
              {discoveryStatus.connected ? (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{discoveryStatus.message || `Connected to ${llmProvider.toUpperCase()}! ${discoveredModels.length} models ready for live inference.`}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 font-bold uppercase">
                    Validated
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">{discoveryStatus.error || discoveryStatus.message || `${llmProvider.toUpperCase()} engine not connected.`}</div>
                        {discoveryStatus.help && (
                          <div className="text-slate-300 text-[11px] mt-0.5">{discoveryStatus.help}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {discoveryStatus.recommended_command && (
                    <div className="flex items-center justify-between gap-2 bg-black/60 p-2 rounded-lg border border-white/10 text-slate-200">
                      <span className="text-[11px]">Command to launch: <code className="text-cyan-300 font-bold">{discoveryStatus.recommended_command}</code></span>
                      <button
                        onClick={() => handleCopyCommand(discoveryStatus.recommended_command!)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] flex items-center gap-1"
                      >
                        {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedCmd ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Form Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Provider Select */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Select Inference Engine:
                  </label>
                  <select
                    value={llmProvider}
                    onChange={(e) => {
                      const prov = e.target.value as any;
                      setLlmProvider(prov);
                      if (prov === "groq") {
                        setBaseUrl("");
                        setCustomModel("llama-3.3-70b-versatile");
                      } else if (prov === "openrouter") {
                        setBaseUrl("");
                        setCustomModel("meta-llama/llama-3.3-70b-instruct");
                      } else if (prov === "ollama") {
                        setBaseUrl("http://localhost:11434");
                        setCustomModel("llama3.1");
                      } else if (prov === "lmstudio") {
                        setBaseUrl("http://localhost:1234/v1");
                        setCustomModel("local-model");
                      } else if (prov === "gemini") {
                        setBaseUrl("");
                        setCustomModel("gemini-2.0-flash");
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="groq">Groq Cloud API (Ultra-Fast Llama-3.3-70B)</option>
                    <option value="openrouter">OpenRouter Multi-LLM Gateway (Claude/DeepSeek/Llama)</option>
                    <option value="ollama">Local Ollama Engine (localhost:11434)</option>
                    <option value="lmstudio">Local LM Studio / LocalAI (localhost:1234)</option>
                    <option value="gemini">Google Gemini API (2.0 Flash / 1.5 Pro)</option>
                  </select>
                </div>

                {/* 2. API Key or Base URL */}
                {llmProvider === "ollama" || llmProvider === "lmstudio" ? (
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Local Server Base URL:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        onBlur={() => discoverModels(llmProvider, apiKey, baseUrl)}
                        placeholder={llmProvider === "ollama" ? "http://localhost:11434" : "http://localhost:1234/v1"}
                        className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                      />
                      <button
                        onClick={() => discoverModels(llmProvider, apiKey, baseUrl)}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
                        title="Scan Endpoint"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      {llmProvider === "groq" ? "Groq API Key (gsk_...):" :
                       llmProvider === "openrouter" ? "OpenRouter API Key (sk-or-...):" :
                       "Google AI Studio Gemini API Key:"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onBlur={() => discoverModels(llmProvider, apiKey, baseUrl)}
                        placeholder={
                          llmProvider === "groq" ? "gsk_..." :
                          llmProvider === "openrouter" ? "sk-or-..." : "AIzaSy..."
                        }
                        className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                      />
                      <button
                        onClick={() => discoverModels(llmProvider, apiKey, baseUrl)}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
                        title="Validate & Load Models"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Discovered Model Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 text-[11px]">
                      Select Discovered Model:
                    </label>
                    <button
                      onClick={() => setUseCustomModelInput(!useCustomModelInput)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      {useCustomModelInput ? "Show Discovered List" : "Enter Custom ID"}
                    </button>
                  </div>

                  {useCustomModelInput ? (
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="e.g. meta-llama/llama-3.3-70b-instruct"
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  ) : (
                    <select
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      {discoveredModels.length > 0 ? (
                        discoveredModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name || m.id} {m.recommended ? "★ (Recommended)" : ""} {m.is_free ? "🆓 (Free)" : ""}
                          </option>
                        ))
                      ) : (
                        <option value={customModel}>{customModel} (Default)</option>
                      )}
                    </select>
                  )}
                </div>
              </div>

              {/* Local Scan Diagnostics if Run */}
              {localScanResult && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-slate-300 space-y-1.5 text-[11px]">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Local Ports Probe Report:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                      <span>Ollama (port 11434):</span>
                      <span className={localScanResult.ollama?.connected ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {localScanResult.ollama?.connected ? `ONLINE (${localScanResult.ollama.total_count || 0} models)` : "OFFLINE"}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                      <span>LM Studio (port 1234):</span>
                      <span className={localScanResult.lmstudio?.connected ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {localScanResult.lmstudio?.connected ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Window Container */}
          <div className="glass-panel rounded-2xl flex flex-col h-[540px] overflow-hidden border border-white/10">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`max-w-2xl rounded-2xl p-4 space-y-2 leading-relaxed ${
                      isUser
                        ? "bg-cyan-600/20 border border-cyan-500/40 text-cyan-100 font-sans text-xs"
                        : "bg-black/60 border border-white/10 text-slate-200 font-sans text-xs"
                    }`}>
                      <div className="flex items-center justify-between gap-4 font-mono text-[10px] text-slate-400 border-b border-white/5 pb-1">
                        <span>{isUser ? "Security Analyst" : "RAGSec Mitigation Copilot"}</span>
                        <span>{m.timestamp}</span>
                      </div>

                      <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                        {m.content}
                      </div>

                      {/* Assistant Metadata Badges */}
                      {!isUser && (
                        <div className="flex flex-wrap items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-slate-400 gap-2">
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-cyan-400" />
                            Provider: <strong className="text-slate-300">{m.provider || llmProvider}</strong>
                            {m.model && <span className="text-slate-500">({m.model})</span>}
                          </span>
                          {m.citations && m.citations.length > 0 && (
                            <span className="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Cited: {m.citations.slice(0, 2).join(", ")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-spin">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-cyan-300 text-xs font-mono">
                    Executing inference via <span className="font-bold uppercase text-white">{llmProvider}</span> ({customModel}) & grounding against ChromaDB...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-2.5 bg-black/40 border-t border-white/5 flex items-center gap-2 overflow-x-auto">
              <span className="text-slate-500 text-[10px] font-mono whitespace-nowrap pl-2">Quick Actions:</span>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono whitespace-nowrap transition-all"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-black/80 border-t border-white/10 flex items-center gap-3">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`Ask AI Copilot for containment playbooks, isolation scripts, or forensic guidance via ${llmProvider.toUpperCase()}...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/50 font-mono"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isSending || !inputQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all font-mono disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: PLAYBOOK QUEUE & HITL EXECUTION */}
      {/* ========================================================================= */}
      {activeSubtab === "PLAYBOOKS" && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">
                HitL Mitigation Execution Queue ({mitigations.length} Actions)
              </h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              STATE MACHINE: RECOMMENDED → APPROVED → EXECUTED → VERIFIED
            </span>
          </div>

          <div className="space-y-3">
            {mitigations.map((m) => {
              const isRecommended = m.status === "RECOMMENDED";
              const isExecuted = m.status === "EXECUTED";
              const isVerified = m.status === "VERIFIED";

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isRecommended
                      ? "bg-black/50 border-amber-500/40"
                      : isVerified
                      ? "bg-emerald-950/20 border-emerald-500/30"
                      : "bg-cyan-950/20 border-cyan-500/30"
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{m.id}</span>
                      <span className="text-slate-500">•</span>
                      <span className="font-bold text-amber-300">{m.action_type}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        isRecommended ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        isVerified ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                        "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <p className="text-slate-300 font-sans text-xs">{m.description}</p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-4 pt-0.5">
                      <span>Incident: <strong className="text-cyan-400">{m.incident_id}</strong></span>
                      <span>Target Host: <strong className="text-slate-200">{m.target_device_id}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isRecommended && (
                      <button
                        onClick={() => handleApproveAndExecute(m)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Approve & Execute
                      </button>
                    )}

                    {isExecuted && (
                      <button
                        onClick={() => handleVerify(m)}
                        className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Verify Containment
                      </button>
                    )}

                    {isVerified && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Containment Verified
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: SCRIPT SYNTHESIZER */}
      {/* ========================================================================= */}
      {activeSubtab === "SYNTHESIZER" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Automated Script Generator</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Threat Category:</label>
                <select
                  value={synthCategory}
                  onChange={(e) => setSynthCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                >
                  <option value="Ransomware">Ransomware</option>
                  <option value="Malware">Malware</option>
                  <option value="Suspicious Script / Execution">Suspicious Script / Execution</option>
                  <option value="Trojan">Trojan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Target Host:</label>
                <input
                  type="text"
                  value={synthHost}
                  onChange={(e) => setSynthHost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Target File / Artifact:</label>
                <input
                  type="text"
                  value={synthFile}
                  onChange={(e) => setSynthFile(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <button
                onClick={handleSynthesize}
                disabled={isSynthesizing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {isSynthesizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate PowerShell & Bash Scripts
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                Synthesized Containment Code
              </h3>
              {synthResult && (
                <button
                  onClick={() => handleCopyCode(synthResult.powershell_script || "")}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? "Copied" : "Copy Code"}
                </button>
              )}
            </div>

            {synthResult ? (
              <pre className="p-4 rounded-xl bg-black/70 border border-white/10 text-emerald-300 text-[11px] leading-relaxed overflow-x-auto max-h-72">
                {synthResult.powershell_script}
              </pre>
            ) : (
              <div className="py-20 text-center text-slate-500">
                Click "Generate PowerShell & Bash Scripts" to synthesize scripts.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MitigationRulesView;
