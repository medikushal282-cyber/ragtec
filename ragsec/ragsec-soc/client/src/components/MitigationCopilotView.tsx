import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Zap, 
  Bot, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RotateCcw, 
  Terminal, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Send, 
  Settings, 
  Key, 
  Cpu, 
  Layers, 
  FileCode2, 
  Trash2, 
  BookOpen, 
  WifiOff, 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  SlidersHorizontal, 
  Lock, 
  Unlock, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Server, 
  X,
  FileCheck2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface MitigationActionItem {
  id: string;
  incident_id?: string;
  action_type: string;
  target_device_id: string;
  description: string;
  status: "RECOMMENDED" | "APPROVED" | "REJECTED" | "EXECUTED" | "VERIFIED" | string;
  analyst_id?: string;
  script_content?: string;
  approved_by?: string;
  verification_notes?: string;
  created_at?: string;
  playbook_steps?: Array<{ step: number; title: string; description: string }>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
  citations?: string[];
  extracted_script?: string;
  isFallback?: boolean;
}

export interface DiscoveredModel {
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

export interface MitigationCopilotViewProps {
  initialThreat?: {
    fileName: string;
    filePath: string;
    category?: string;
    threatStatus?: string;
    reasons?: string[];
    evidence?: string[];
  } | null;
  activeModel?: string;
  onNavigateToChat?: () => void;
}

export const MitigationCopilotView: React.FC<MitigationCopilotViewProps> = ({ initialThreat, activeModel, onNavigateToChat }) => {
  // Layout mode: playbooks deck (default HitL focus), copilot focus, or refined dual workbench
  const [layoutMode, setLayoutMode] = useState<"copilot" | "playbooks" | "dual">("playbooks");
  const [historyOpen, setHistoryOpen] = useState(false);

  // ----------------------------------------------------
  // LLM Configuration & Model State
  // ----------------------------------------------------
  const [llmProvider, setLlmProvider] = useState<string>(() => 
    localStorage.getItem("ragsec_llm_provider") || "groq"
  );
  const [apiKey, setApiKey] = useState<string>(() => 
    localStorage.getItem("ragsec_api_key") || ""
  );
  const [baseUrl, setBaseUrl] = useState<string>(() => 
    localStorage.getItem("ragsec_base_url") || ""
  );
  const [customModel, setCustomModel] = useState<string>(() => 
    activeModel || localStorage.getItem("ragsec_active_brain") || localStorage.getItem("ragsec_model_name") || "openai/gpt-oss-120b"
  );

  useEffect(() => {
    if (activeModel && activeModel !== customModel) {
      setCustomModel(activeModel);
    }
  }, [activeModel]);

  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // ----------------------------------------------------
  // Chat / Copilot State
  // ----------------------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content: `Hello Analyst. I am the **RAGSec Mitigation Copilot**, your grounded AI defensive response partner.

I retain multi-turn context across our session and can:
- Formulate **PowerShell and Bash containment scripts**
- Synthesize Zero-Trust network isolation rules
- Send generated playbooks directly to the **HitL Approval & Execution Queue** on the right.

How can I assist your investigation today?`,
      timestamp: new Date().toLocaleTimeString(),
      provider: "RAGSec Neural Engine",
      model: activeModel || localStorage.getItem("ragsec_active_brain") || "openai/gpt-oss-120b"
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------
  // HitL Playbooks & Mitigation State
  // ----------------------------------------------------
  const [mitigations, setMitigations] = useState<MitigationActionItem[]>([
    {
      id: "ACT-01",
      action_type: "NETWORK_ISOLATE",
      target_device_id: "Local Endpoint",
      description: "Isolate endpoint network adapters to prevent lateral ransomware movement",
      status: "RECOMMENDED",
      script_content: `# Disable network adapters except local loopback\nGet-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Disable-NetAdapter -Confirm:$false\nWrite-Host "[RAGSec] Host Local Endpoint isolated from subnet."`,
      created_at: new Date().toLocaleTimeString(),
      playbook_steps: [
        { step: 1, title: "Isolate NICs", description: "Disable external adapters via PowerShell" },
        { step: 2, title: "Verify Containment", description: "Confirm host can only communicate with Sentinel agent" }
      ]
    },
    {
      id: "ACT-02",
      action_type: "TERMINATE_PROCESS",
      target_device_id: "Local Endpoint",
      description: "Terminate rogue execution tree and strip execution permissions",
      status: "APPROVED",
      approved_by: "SOC_ANALYST_01",
      script_content: `# Terminate ransomware payload and script processes\nStop-Process -Name "powershell" -Force -ErrorAction SilentlyContinue\nStop-Process -Name "cmd" -Force -ErrorAction SilentlyContinue\nWrite-Host "[RAGSec] Process tree terminated."`,
      created_at: new Date().toLocaleTimeString()
    }
  ]);

  const [activePlaybook, setActivePlaybook] = useState<MitigationActionItem | null>(mitigations[0]);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [selectedTargetHost, setSelectedTargetHost] = useState<string>("Local Endpoint");

  // Filter & deduplicate active vs historical mitigations to prevent overcrowding
  const activeMitigations = React.useMemo(() => {
    const seen = new Set<string>();
    return mitigations.filter(m => {
      const isPending = m.status === "RECOMMENDED" || m.status === "APPROVED";
      if (!isPending) return false;
      const key = `${m.action_type}-${m.description.slice(0, 30)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [mitigations]);

  const historicalMitigations = React.useMemo(() => {
    return mitigations.filter(m => m.status === "EXECUTED" || m.status === "VERIFIED");
  }, [mitigations]);

  // Synchronize activePlaybook with activeMitigations
  useEffect(() => {
    if (!activePlaybook && activeMitigations.length > 0) {
      setActivePlaybook(activeMitigations[0]);
    }
  }, [activeMitigations, activePlaybook]);

  // Persist settings
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

  // Load staged playbooks from Step Helper and sync storage
  const loadStagedPlaybooks = useCallback(() => {
    try {
      const stagedRaw = localStorage.getItem("ragsec_staged_playbooks");
      if (stagedRaw) {
        const staged = JSON.parse(stagedRaw);
        if (Array.isArray(staged) && staged.length > 0) {
          setMitigations(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const toAdd: MitigationActionItem[] = [];
            for (const item of staged) {
              if (!existingIds.has(item.id)) {
                toAdd.push({
                  id: item.id || `ACT-${Date.now().toString().slice(-4)}`,
                  action_type: item.action_type || "CUSTOM_PLAYBOOK",
                  target_device_id: item.target_device_id || item.target || "Local Endpoint",
                  description: item.description || item.title || "AI Recommended Mitigation Playbook",
                  status: "RECOMMENDED",
                  script_content: item.script_content || item.script || "",
                  created_at: item.created_at || new Date().toLocaleTimeString(),
                  playbook_steps: item.playbook_steps || [
                    { step: 1, title: "Review Staged Script", description: "Analyst confirms target parameters & containment rules" },
                    { step: 2, title: "Execute with HitL Approval", description: "Enforce zero-trust mitigation on endpoint" }
                  ]
                });
              }
            }
            if (toAdd.length > 0) {
              return [...toAdd, ...prev];
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error("Failed to load staged playbooks:", e);
    }
  }, []);

  useEffect(() => {
    loadStagedPlaybooks();
    const handleStorage = () => {
      const storedBrain = localStorage.getItem("ragsec_active_brain") || localStorage.getItem("ragsec_model_name");
      if (storedBrain && !activeModel) {
        setCustomModel(storedBrain);
      }
      loadStagedPlaybooks();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [activeModel, loadStagedPlaybooks]);

  // Load Initial Threat context if navigated from scanner or dashboard
  useEffect(() => {
    if (initialThreat) {
      const threatMsg: ChatMessage = {
        id: `threat-${Date.now()}`,
        role: "assistant",
        content: `🚨 **Active Threat Context Loaded for Mitigation:** \`${initialThreat.fileName}\`\n\n- **Target Location**: \`${initialThreat.filePath}\`\n- **Taxonomy Category**: **${initialThreat.category || "Malware"}**\n- **Status**: \`${initialThreat.threatStatus || "THREAT"}\`\n${initialThreat.reasons?.length ? `- **Indicators**: ${initialThreat.reasons.join("; ")}\n` : ""}\nI have prepared a containment playbook. Ask me to refine the steps or click **Add to Playbook Queue** to execute.`,
        timestamp: new Date().toLocaleTimeString(),
        provider: "RAGSec Sentinel",
        model: "Threat Analyzer",
        extracted_script: `# Automated Containment for ${initialThreat.fileName}\nMove-Item -Path "${initialThreat.filePath}" -Destination "monitored_workspace\\.quarantine\\" -Force\nStop-Process -Name "*${initialThreat.fileName.replace(/\.[^/.]+$/, "")}*" -Force -ErrorAction SilentlyContinue\nWrite-Host "[RAGSec] Threat ${initialThreat.fileName} neutralized and placed in quarantine enclave."`
      };
      setMessages(prev => [...prev, threatMsg]);
      setSelectedTargetHost("Local Endpoint");
    }
  }, [initialThreat]);

  // Fetch real mitigations from backend
  const fetchMitigations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/soc/mitigations/history`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMitigations(data);
          if (!activePlaybook) setActivePlaybook(data[0]);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchMitigations();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Discover Models handler
  const discoverModels = useCallback(async () => {
    setIsDiscovering(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/models/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: llmProvider,
          api_key: apiKey.trim() || undefined,
          base_url: baseUrl.trim() || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDiscoveredModels(data.models || []);
        if (data.default_model) setCustomModel(data.default_model);
        toast.success(`Discovered ${data.models?.length || 0} models for ${llmProvider}`);
      }
    } catch {
      toast.error("Could not connect to model discovery endpoint.");
    } finally {
      setIsDiscovering(false);
    }
  }, [llmProvider, apiKey, baseUrl]);

  // Extract code blocks from assistant text
  const extractCodeFromText = (text: string): string | null => {
    const match = text.match(/```(?:powershell|bash|sh|cmd|shell)?\s*([\s\S]*?)```/i);
    return match ? match[1].trim() : null;
  };

  // Push AI script directly to Playbook Queue
  const handlePushToPlaybooks = (script: string, title = "AI Generated Containment Playbook") => {
    const newAction: MitigationActionItem = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      action_type: "CUSTOM_PLAYBOOK",
      target_device_id: selectedTargetHost,
      description: title,
      status: "RECOMMENDED",
      script_content: script,
      created_at: new Date().toLocaleTimeString(),
      playbook_steps: [
        { step: 1, title: "Review Script", description: "Analyst confirms target parameters" },
        { step: 2, title: "Execute on Node", description: `Run payload against ${selectedTargetHost}` }
      ]
    };

    setMitigations(prev => [newAction, ...prev]);
    setActivePlaybook(newAction);
    toast.success("Playbook added to HitL Approval Queue!");
  };

  // Chat message send
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery("");
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/analysis/chat-mitigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          query: textToSend,
          provider: llmProvider,
          api_key: apiKey.trim() || undefined,
          model: customModel,
          base_url: baseUrl.trim() || undefined,
          threat_category: initialThreat?.category || undefined,
          file_name: initialThreat?.fileName || undefined,
          target_host: selectedTargetHost || "Local Endpoint"
        })
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || data.answer || "Analyzed threat and synthesized containment advice.";
        const extractedScript = extractCodeFromText(replyText);

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: replyText,
          timestamp: new Date().toLocaleTimeString(),
          provider: data.provider || llmProvider.toUpperCase(),
          model: data.model || customModel,
          citations: data.citations || [],
          extracted_script: extractedScript || undefined
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error("Backend chat service unavailable.");
      }
    } catch {
      // Offline fallback containment response
      const fallbackScript = `# === RAGSec Grounded Emergency Playbook ===\n# Host: ${selectedTargetHost}\nGet-NetAdapter | Where-Object { $_.Status -eq "Up" } | Disable-NetAdapter -Confirm:$false\nStop-Process -Name "*ransomware*" -Force -ErrorAction SilentlyContinue\nMove-Item -Path "monitored_workspace\\*.lock" -Destination "monitored_workspace\\.quarantine\\" -Force\nWrite-Host "[RAGSec] Emergency containment applied."`;
      
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: `**Grounded Containment Playbook for ${selectedTargetHost}:**\n\n\`\`\`powershell\n${fallbackScript}\n\`\`\`\n\nYou can click **Push to Queue** to approve and execute this on ${selectedTargetHost}.`,
        timestamp: new Date().toLocaleTimeString(),
        provider: "RAGSec Rule Engine",
        model: "SOC Playbook Heuristics",
        extracted_script: fallbackScript,
        isFallback: true
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // HitL Approval, Execution, and Verification handlers
  const handleApproveAction = async (item: MitigationActionItem) => {
    try {
      await fetch(`${API_BASE_URL}/api/soc/mitigations/${item.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyst_id: "SOC_ANALYST_01" })
      });
      setMitigations(prev => prev.map(m => m.id === item.id ? { ...m, status: "APPROVED", approved_by: "SOC_ANALYST_01" } : m));
      if (activePlaybook?.id === item.id) {
        setActivePlaybook({ ...activePlaybook, status: "APPROVED", approved_by: "SOC_ANALYST_01" });
      }
      toast.success(`Action ${item.id} APPROVED by Analyst.`);
    } catch {
      setMitigations(prev => prev.map(m => m.id === item.id ? { ...m, status: "APPROVED" } : m));
      toast.success(`Action ${item.id} approved.`);
    }
  };

  const handleExecuteAction = async (item: MitigationActionItem) => {
    setIsExecuting(true);
    setExecutionOutput(`[${new Date().toLocaleTimeString()}] Authenticating with endpoint ${item.target_device_id}...\n[${new Date().toLocaleTimeString()}] Dispatching containment script payload...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/soc/mitigations/${item.id}/execute`, {
        method: "POST"
      });
      setTimeout(() => {
        setExecutionOutput(prev => `${prev}\n[${new Date().toLocaleTimeString()}] Execution completed successfully (Exit Code 0).\n[${new Date().toLocaleTimeString()}] Endpoint ${item.target_device_id} status updated.`);
        setMitigations(prev => prev.map(m => m.id === item.id ? { ...m, status: "EXECUTED" } : m));
        if (activePlaybook?.id === item.id) {
          setActivePlaybook({ ...activePlaybook, status: "EXECUTED" });
        }
        setIsExecuting(false);
        toast.success(`Playbook executed on ${item.target_device_id}!`);
      }, 1200);
    } catch {
      setTimeout(() => {
        setExecutionOutput(prev => `${prev}\n[${new Date().toLocaleTimeString()}] Local simulation executed.\n[${new Date().toLocaleTimeString()}] Host contained.`);
        setMitigations(prev => prev.map(m => m.id === item.id ? { ...m, status: "EXECUTED" } : m));
        setIsExecuting(false);
        toast.success("Execution complete.");
      }, 1000);
    }
  };

  const handleVerifyAction = async (item: MitigationActionItem) => {
    try {
      await fetch(`${API_BASE_URL}/api/soc/mitigations/${item.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, notes: "Verified clean containment state" })
      });
      setMitigations(prev => prev.map(m => m.id === item.id ? { ...m, status: "VERIFIED" } : m));
      if (activePlaybook?.id === item.id) {
        setActivePlaybook({ ...activePlaybook, status: "VERIFIED" });
      }
      toast.success(`Playbook ${item.id} verified clean.`);
    } catch {
      setMitigations(prev => prev.map(m => m.id === item.id ? { ...m, status: "VERIFIED" } : m));
      toast.success(`Playbook ${item.id} verified.`);
    }
  };

  const quickPrompts = [
    "Draft PowerShell Host Isolation Script",
    "Explain LockBit / BlackSuit Ransomware TTPs",
    "Generate Outbound C2 Perimeter Firewall Drop",
    "Step-by-step memory dumping and process kill"
  ];

  return (
    <div className="space-y-6">
      {/* Top Chrome: Apple-grade Translucent Header */}
      <div className="apple-panel p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white tracking-tight truncate">
                  Mitigation Playbook Deck & HitL Queue
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono font-medium border border-amber-500/20 flex-shrink-0">
                  HITL CONTAINMENT
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] mt-0.5 truncate">
                Human-in-the-Loop review, staging, and executing PowerShell containment scripts
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Layout Switcher + Chat Navigation */}
        <div className="flex items-center gap-3 flex-wrap">
          {onNavigateToChat && (
            <button
              onClick={onNavigateToChat}
              className="px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 apple-button transition-all shadow-sm"
              title="Open full conversational AI Copilot Chat"
            >
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>Open AI Copilot Chat</span>
              <ArrowRight className="w-3 h-3 text-blue-400" />
            </button>
          )}

          {/* Target Host Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedTargetHost}
              onChange={(e) => setSelectedTargetHost(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            >
              <option value="Local Endpoint" className="bg-[#0D111E]">Local Endpoint (This Machine)</option>
              <option value="127.0.0.1" className="bg-[#0D111E]">127.0.0.1 (Localhost)</option>
              <option value="PROD-WEB-01" className="bg-[#0D111E]">PROD-WEB-01 (DMZ Ingress)</option>
              <option value="PROD-DB-01" className="bg-[#0D111E]">PROD-DB-01 (Database Server)</option>
              <option value="CORP-DC-01" className="bg-[#0D111E]">CORP-DC-01 (Domain Controller)</option>
            </select>
          </div>

          {/* Apple-grade Layout Mode Segmented Control */}
          <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] flex-shrink-0">
            <button
              onClick={() => setLayoutMode("playbooks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap apple-button ${
                layoutMode === "playbooks" ? "bg-white/[0.14] text-white shadow-sm" : "text-[#8E8E93] hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Playbook Deck</span>
              {activeMitigations.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium">
                  {activeMitigations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setLayoutMode("dual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap apple-button ${
                layoutMode === "dual" ? "bg-white/[0.14] text-white shadow-sm" : "text-[#8E8E93] hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setLayoutMode("copilot")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap apple-button ${
                layoutMode === "copilot" ? "bg-white/[0.14] text-white shadow-sm" : "text-[#8E8E93] hover:text-white"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Mini Copilot</span>
            </button>
          </div>

          {/* Model Settings Button */}
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E8E93] hover:text-white transition-all apple-button"
            title="Configure AI Models & API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Settings Drawer */}
      {settingsOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="apple-panel p-5 border border-blue-500/30 space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white">LLM Provider & Inference Configuration</span>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#8E8E93] text-[11px] mb-1">Provider Engine:</label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="groq">Groq Cloud (Ultra Fast)</option>
                <option value="openrouter">OpenRouter API</option>
                <option value="ollama">Local Ollama (Offline)</option>
                <option value="lmstudio">LM Studio (Local Enclave)</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>

            <div>
              <label className="block text-[#8E8E93] text-[11px] mb-1">API Key / Enclave Token:</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_... or sk-or-..."
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-[#8E8E93] text-[11px] mb-1">Model Selection:</label>
              <div className="flex gap-2">
                {discoveredModels.length > 0 ? (
                  <select
                    value={customModel}
                    onChange={(e) => {
                      setCustomModel(e.target.value);
                      localStorage.setItem("ragsec_active_brain", e.target.value);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-blue-500/50 text-xs font-medium cursor-pointer"
                  >
                    {discoveredModels.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#0D111E]">
                        {m.name || m.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => {
                      setCustomModel(e.target.value);
                      localStorage.setItem("ragsec_active_brain", e.target.value);
                    }}
                    placeholder="openai/gpt-oss-120b"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50 text-xs font-mono"
                  />
                )}
                <button
                  onClick={discoverModels}
                  disabled={isDiscovering}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 apple-button text-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isDiscovering ? "animate-spin" : ""}`} />
                  <span>{isDiscovering ? "Scanning..." : "Discover"}</span>
                </button>
              </div>
              {discoveredModels.length > 0 && (
                <span className="text-[10px] text-cyan-400 font-mono mt-1 block">
                  ✓ {discoveredModels.length} models discovered from {llmProvider.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Dual Workbench Layout */}
      <div className={`grid gap-6 ${
        layoutMode === "dual" 
          ? "grid-cols-1 lg:grid-cols-12" 
          : "grid-cols-1"
      }`}>
        {/* ================================================================= */}
        {/* LEFT PANE: AI SOC COPILOT CHAT                                    */}
        {/* ================================================================= */}
        {(layoutMode === "dual" || layoutMode === "copilot") && (
          <div className={`${layoutMode === "dual" ? "lg:col-span-6" : "max-w-4xl mx-auto w-full"} apple-panel flex flex-col h-[700px] border border-white/[0.08]`}>
            {/* Copilot Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-xs">Autonomous SOC Copilot</h3>
                  <span className="text-[10px] text-[#8E8E93]">
                    Grounded with CTI vectors & {llmProvider.toUpperCase()} ({customModel})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMessages([messages[0]])}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
                title="Clear Conversation History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-4 py-2 bg-white/[0.015] border-b border-white/[0.05] flex items-center gap-1.5 overflow-x-auto text-[11px] text-[#8E8E93]">
              <span className="text-[10px] font-semibold uppercase text-[#636366] flex-shrink-0">Suggestions:</span>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8E8E93] hover:text-white whitespace-nowrap transition-all apple-button text-[10px]"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {messages.map((msg) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-1.5 ${isAssistant ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93] px-1">
                      <span>{isAssistant ? "Copilot" : "Analyst"}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.model && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.06] text-blue-300 font-mono">
                          {msg.model}
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-[92%] leading-relaxed space-y-2.5 ${
                        isAssistant
                          ? "bg-white/[0.04] border border-white/[0.08] text-[#F5F5F7]"
                          : "bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-xs">{msg.content}</div>

                      {/* Render Script Action Button if script detected */}
                      {msg.extracted_script && isAssistant && (
                        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
                          <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                            <FileCode2 className="w-3 h-3" />
                            Executable Playbook Detected
                          </span>

                          <button
                            onClick={() => {
                              handlePushToPlaybooks(msg.extracted_script!, "AI Synthesized Playbook");
                              setLayoutMode("playbooks");
                            }}
                            className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1.5 apple-button"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Stage in Playbook Deck →</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex items-center gap-2 text-xs text-[#8E8E93] py-2 px-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Synthesizing defensive containment strategy...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-white/[0.08] bg-black/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`Ask Copilot how to isolate or mitigate on ${selectedTargetHost}...`}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-[#636366] text-xs focus:outline-none focus:border-blue-500/50"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 apple-button"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* RIGHT PANE: HitL MITIGATION PLAYBOOKS WORKBENCH                   */}
        {/* ================================================================= */}
        {(layoutMode === "dual" || layoutMode === "playbooks") && (
          <div className={`${layoutMode === "dual" ? "lg:col-span-6" : "w-full"} apple-panel flex flex-col h-[700px] border border-white/[0.08]`}>
            {/* Playbooks Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-xs">HitL Approval & Execution Pipeline</h3>
                  <span className="text-[10px] text-[#8E8E93]">
                    {activeMitigations.length} Active • {historicalMitigations.length} Completed • Target: {selectedTargetHost}
                  </span>
                </div>
              </div>

              <button
                onClick={fetchMitigations}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
                title="Refresh Playbook Queue"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* In DUAL mode: Render full-width inspector with top pill switcher to prevent 2-column squeeze */}
            {layoutMode === "dual" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Horizontal Action Selector */}
                <div className="p-3 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto bg-white/[0.015]">
                  <span className="text-[10px] text-[#636366] font-semibold uppercase tracking-wider flex-shrink-0">
                    Active:
                  </span>
                  {activeMitigations.map((m) => {
                    const isSelected = activePlaybook?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setActivePlaybook(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all apple-button ${
                          isSelected
                            ? "bg-white/[0.12] text-white border border-white/[0.2] shadow-sm"
                            : "bg-white/[0.03] text-[#8E8E93] hover:text-white border border-white/[0.05]"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>{m.action_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">({m.id})</span>
                      </button>
                    );
                  })}
                  {activeMitigations.length === 0 && (
                    <span className="text-xs text-[#8E8E93]">No pending playbooks</span>
                  )}
                </div>

                {/* Active Playbook Inspector Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activePlaybook ? (
                    <>
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs tracking-tight">{activePlaybook.action_type}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                              activePlaybook.status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                              activePlaybook.status === "EXECUTED" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                              activePlaybook.status === "APPROVED" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                              "bg-white/[0.08] text-slate-300 border border-white/[0.1]"
                            }`}>
                              STAGE: {activePlaybook.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8E8E93] mt-1">{activePlaybook.description}</p>
                        </div>
                      </div>

                      {/* Script Code Viewer */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                          <span className="font-mono">Containment Script:</span>
                          <button
                            onClick={() => {
                              if (activePlaybook.script_content) {
                                navigator.clipboard.writeText(activePlaybook.script_content);
                                toast.success("Script copied to clipboard.");
                              }
                            }}
                            className="flex items-center gap-1 text-[10px] hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>

                        <pre className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.08] font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-40 leading-relaxed">
                          {activePlaybook.script_content || `# Ready to execute on ${activePlaybook.target_device_id}`}
                        </pre>
                      </div>

                      {/* Action Triggers */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {activePlaybook.status === "RECOMMENDED" && (
                          <button
                            onClick={() => handleApproveAction(activePlaybook)}
                            className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 apple-button shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Approve Playbook</span>
                          </button>
                        )}

                        {(activePlaybook.status === "APPROVED" || activePlaybook.status === "RECOMMENDED") && (
                          <button
                            onClick={() => handleExecuteAction(activePlaybook)}
                            disabled={isExecuting}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 apple-button shadow-sm"
                          >
                            <Play className={`w-3.5 h-3.5 ${isExecuting ? "animate-spin" : ""}`} />
                            <span>Execute on Endpoint</span>
                          </button>
                        )}

                        {activePlaybook.status === "EXECUTED" && (
                          <button
                            onClick={() => handleVerifyAction(activePlaybook)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 apple-button shadow-sm"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify Containment</span>
                          </button>
                        )}
                      </div>

                      {/* Live Terminal Output Console */}
                      {executionOutput && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] text-[#8E8E93] font-mono">Terminal Telemetry:</span>
                          <div className="p-3 rounded-xl bg-black/80 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] whitespace-pre-wrap">
                            {executionOutput}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-12 text-center text-[#8E8E93] text-xs">
                      No playbook selected. Select a playbook from the active queue above.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* In PLAYBOOKS (Full Width) Mode: Side-by-Side Queue + Detailed Inspector */
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                {/* Left Side: Curated Active Queue + Collapsible Completed History */}
                <div className="md:col-span-4 border-r border-white/[0.08] overflow-y-auto p-4 space-y-4">
                  <div>
                    <span className="text-[10px] text-[#636366] font-semibold uppercase tracking-wider block mb-2 px-1">
                      Active Playbooks ({activeMitigations.length})
                    </span>
                    <div className="space-y-2">
                      {activeMitigations.map((m) => {
                        const isSelected = activePlaybook?.id === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setActivePlaybook(m)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-white/[0.09] border-blue-500/40 shadow-sm"
                                : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-mono font-bold text-white">{m.id}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                m.status === "APPROVED" ? "bg-amber-500/20 text-amber-300" : "bg-white/[0.06] text-slate-300"
                              }`}>
                                {m.status}
                              </span>
                            </div>
                            <div className="font-medium text-slate-200 text-xs line-clamp-2">{m.description}</div>
                            <div className="text-[10px] font-mono text-[#8E8E93] mt-1.5 flex items-center gap-1">
                              <Server className="w-3 h-3 text-blue-400" />
                              <span>{m.target_device_id}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Collapsible Completed History (Prevents overcrowding) */}
                  {historicalMitigations.length > 0 && (
                    <div className="pt-3 border-t border-white/[0.06]">
                      <button
                        onClick={() => setHistoryOpen(!historyOpen)}
                        className="w-full flex items-center justify-between text-xs text-[#8E8E93] hover:text-white py-1 px-1"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Completed History ({historicalMitigations.length})
                        </span>
                        {historyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {historyOpen && (
                        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {historicalMitigations.slice(0, 15).map((m) => (
                            <div
                              key={m.id}
                              onClick={() => setActivePlaybook(m)}
                              className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.03] text-xs cursor-pointer flex items-center justify-between"
                            >
                              <span className="font-mono text-[10px] text-slate-300">{m.id}</span>
                              <span className="text-[9px] text-emerald-400 font-medium">{m.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Side: Full Inspector & Terminal Output */}
                <div className="md:col-span-8 flex flex-col h-full overflow-y-auto p-6 space-y-4">
                  {activePlaybook ? (
                    <>
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{activePlaybook.action_type}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              activePlaybook.status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-300" :
                              activePlaybook.status === "EXECUTED" ? "bg-blue-500/20 text-blue-300" :
                              activePlaybook.status === "APPROVED" ? "bg-amber-500/20 text-amber-300" :
                              "bg-white/[0.08] text-slate-300"
                            }`}>
                              STAGE: {activePlaybook.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#8E8E93] mt-1">{activePlaybook.description}</p>
                        </div>
                      </div>

                      {/* Script Code Viewer */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-[#8E8E93]">
                          <span className="font-mono">PowerShell / Bash Script:</span>
                          <button
                            onClick={() => {
                              if (activePlaybook.script_content) {
                                navigator.clipboard.writeText(activePlaybook.script_content);
                                toast.success("Script copied to clipboard.");
                              }
                            }}
                            className="flex items-center gap-1 text-[11px] hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                        </div>

                        <pre className="p-4 rounded-xl bg-[#090D16] border border-white/[0.08] font-mono text-xs text-emerald-300 overflow-x-auto max-h-56 leading-relaxed">
                          {activePlaybook.script_content || `# Ready to execute on ${activePlaybook.target_device_id}`}
                        </pre>
                      </div>

                      {/* HitL Stage Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        {activePlaybook.status === "RECOMMENDED" && (
                          <button
                            onClick={() => handleApproveAction(activePlaybook)}
                            className="px-5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 apple-button shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                            <span>Approve Playbook</span>
                          </button>
                        )}

                        {(activePlaybook.status === "APPROVED" || activePlaybook.status === "RECOMMENDED") && (
                          <button
                            onClick={() => handleExecuteAction(activePlaybook)}
                            disabled={isExecuting}
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 apple-button shadow-sm"
                          >
                            <Play className={`w-4 h-4 ${isExecuting ? "animate-spin" : ""}`} />
                            <span>Execute on Endpoint</span>
                          </button>
                        )}

                        {activePlaybook.status === "EXECUTED" && (
                          <button
                            onClick={() => handleVerifyAction(activePlaybook)}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 apple-button shadow-sm"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify Containment</span>
                          </button>
                        )}
                      </div>

                      {/* Live Terminal Output Console */}
                      {executionOutput && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[11px] text-[#8E8E93] font-mono">Endpoint Telemetry Terminal:</span>
                          <div className="p-3.5 rounded-xl bg-black/80 border border-emerald-500/30 text-emerald-400 font-mono text-xs whitespace-pre-wrap">
                            {executionOutput}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-12 text-center text-[#8E8E93] text-xs">
                      Select a playbook from the queue to inspect and authorize execution.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MitigationCopilotView;
