import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Globe, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  X, 
  ChevronDown, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  ArrowRight,
  ShieldAlert,
  Shield,
  Lock,
  Plus,
  Trash2,
  Zap,
  Search,
  Edit2,
  Download,
  Share2,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Layers,
  FileCode,
  RotateCcw,
  CheckCircle2,
  Activity,
  Square,
  RotateCw,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { RealtimeETAProgressBar } from "./RealtimeETAProgressBar";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface HostProcess {
  pid: number;
  name: string;
  status: string;
  cpu_percent: number;
  memory_mb: number;
  cmdline: string;
  create_time?: string;
  category?: string;
  functional_role?: string;
  is_suspicious: boolean;
  suspicious_reasons: string[];
  can_terminate: boolean;
}

interface OnlineSource {
  title: string;
  url: string;
  source: string;
  snippet: string;
}

export interface RecommendedPlaybook {
  title: string;
  action_type: string;
  script: string;
  description?: string;
  target?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  solution_script?: string;
  verification_command?: string;
  recommended_playbook?: RecommendedPlaybook;
  online_sources?: OnlineSource[];
  model_used?: string;
  search_online?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface AICopilotChatViewProps {
  activeModel?: string;
  initialThreat?: {
    fileName?: string;
    filePath?: string;
    category?: string;
  } | null;
  onNavigateToMitigation?: () => void;
  onOpenBrainModal?: () => void;
}

const DEFAULT_MODELS = [
  { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B Flagship", badge: "GROQ LPU", desc: "Top-tier cybersecurity reasoning & full playbook synthesis" },
  { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B Fast", badge: "LOW LATENCY", desc: "High-speed tactical triage & command troubleshooting" },
  { id: "openai/gpt-oss-safeguard-20b", name: "GPT-OSS Safeguard 20B", badge: "GUARDRAIL", desc: "Strict policy compliance & zero-trust isolation validation" },
  { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B High-Context", badge: "CONTEXT 128K", desc: "Deep log correlation & multi-artifact forensic analysis" }
];

const STARTER_PROMPTS = [
  {
    title: "Inspect Host Processes",
    desc: "Evaluate running executables, command lines, CPU%, and memory",
    prompt: "Examine all active running processes on target host. Identify any processes running encoded PowerShell, uncontrolled replication loops, or dual-use tools.",
    icon: Activity
  },
  {
    title: "Stop Rogue Process",
    desc: "Synthesize elevated process termination with PID verification",
    prompt: "I need to terminate a rogue background process consuming abnormal CPU on this system. What is the safest elevated PowerShell command and verification step?",
    icon: Square
  },
  {
    title: "Host Network Isolation",
    desc: "Draft zero-trust PowerShell NIC disable script for endpoint",
    prompt: "Generate a production-grade PowerShell script to isolate the target host from the corporate subnet while keeping loopback intact. Recommend a mitigation playbook.",
    icon: ShieldAlert
  },
  {
    title: "Fix Access Denied (0x80070005)",
    desc: "Diagnose permission locks when terminating rogue malware processes",
    prompt: "I am encountering 'Access is denied (0x80070005)' when attempting to disable the network adapter and stop suspicious processes on this host. How do I bypass this privilege lock and enforce containment?",
    icon: AlertTriangle
  }
];

export const AICopilotChatView: React.FC<AICopilotChatViewProps> = ({
  activeModel: propActiveModel,
  initialThreat,
  onNavigateToMitigation,
  onOpenBrainModal
}) => {
  // Model state synced with localStorage and props
  const [selectedModel, setSelectedModel] = useState<string>(() => 
    propActiveModel || localStorage.getItem("ragsec_active_brain") || "openai/gpt-oss-120b"
  );

  useEffect(() => {
    if (propActiveModel && propActiveModel !== selectedModel) {
      setSelectedModel(propActiveModel);
    }
  }, [propActiveModel]);

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem("ragsec_active_brain");
      if (stored && stored !== selectedModel) {
        setSelectedModel(stored);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [selectedModel]);

  const handleSelectModel = (m: string) => {
    setSelectedModel(m);
    localStorage.setItem("ragsec_active_brain", m);
    localStorage.setItem("ragsec_model_name", m);
    window.dispatchEvent(new Event("storage"));
    toast.success(`Active AI Brain switched to ${m.split("/").pop()}`);
  };

  // Online search toggle
  const [searchOnline, setSearchOnline] = useState<boolean>(() => {
    return localStorage.getItem("ragsec_chat_search_online") === "true";
  });

  const toggleSearchOnline = () => {
    setSearchOnline(prev => {
      const next = !prev;
      localStorage.setItem("ragsec_chat_search_online", String(next));
      toast.info(next ? "Online Intelligence enabled (MITRE ATT&CK, NVD & MS Learn)" : "Air-Gapped Local CTI mode active");
      return next;
    });
  };

  // Target host context & custom targets
  const [customTargets, setCustomTargets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ragsec_custom_targets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(t => typeof t === "string" && !t.includes("FINANCE-PC"));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    return ["Local Endpoint", "127.0.0.1 (Localhost)"];
  });

  const [targetHost, setTargetHost] = useState<string>(() => {
    const saved = localStorage.getItem("ragsec_current_target_host");
    if (!saved || saved.includes("FINANCE-PC")) {
      localStorage.setItem("ragsec_current_target_host", "Local Endpoint");
      return "Local Endpoint";
    }
    return saved;
  });
  const [selectedProcess, setSelectedProcess] = useState<HostProcess | null>(null);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState("");

  const handleSetCustomTarget = (newTarget: string) => {
    const trimmed = newTarget.trim();
    if (!trimmed) return;
    setSelectedProcess(null);
    setTargetHost(trimmed);
    localStorage.setItem("ragsec_current_target_host", trimmed);
    if (!customTargets.includes(trimmed)) {
      const updated = [trimmed, ...customTargets];
      setCustomTargets(updated);
      localStorage.setItem("ragsec_custom_targets", JSON.stringify(updated));
    }
    setTargetDropdownOpen(false);
    setCustomTargetInput("");
    toast.success(`Active target endpoint switched to: ${trimmed}`);
  };

  const handleSelectProcessTarget = (p: HostProcess) => {
    setSelectedProcess(p);
    const procTarget = `PID ${p.pid} (${p.name})`;
    setTargetHost(procTarget);
    localStorage.setItem("ragsec_current_target_host", procTarget);
    setTargetDropdownOpen(false);
    toast.success(`Target locked onto Process: PID ${p.pid} (${p.name})`);
  };

  const handleResetTargetToLocal = () => {
    setSelectedProcess(null);
    setTargetHost("Local Endpoint");
    localStorage.setItem("ragsec_current_target_host", "Local Endpoint");
    setTargetDropdownOpen(false);
    toast.info("Target reset to Local Endpoint");
  };

  // Live Host Processes state & actions
  const [processes, setProcesses] = useState<HostProcess[]>([]);
  const [processesLoading, setProcessesLoading] = useState(false);
  const [processesModalOpen, setProcessesModalOpen] = useState(false);
  const [processFilter, setProcessFilter] = useState<"all" | "suspicious" | "high_cpu">("all");
  const [processSearch, setProcessSearch] = useState("");
  const [suspiciousProcessCount, setSuspiciousProcessCount] = useState(0);
  const [terminatingPid, setTerminatingPid] = useState<number | null>(null);

  const fetchProcesses = async () => {
    setProcessesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/processes?limit=100&target_host=${encodeURIComponent(targetHost)}`);
      if (res.ok) {
        const data = await res.json();
        setProcesses(data.processes || []);
        setSuspiciousProcessCount(data.suspicious_count || 0);
      }
    } catch (e) {
      console.error("Failed to load processes:", e);
    } finally {
      setProcessesLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 20000);
    return () => clearInterval(interval);
  }, [targetHost]);

  const handleTerminateProcess = async (pid: number, name: string) => {
    setTerminatingPid(pid);
    try {
      const res = await fetch(`${API_BASE_URL}/api/processes/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid, reason: `Manual termination via AI Copilot console on ${targetHost}` })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Terminated process ${name} (PID: ${pid})`);
        fetchProcesses();
      } else {
        toast.error(data.detail || `Failed to terminate PID ${pid}`);
      }
    } catch {
      toast.error(`Connection error when terminating PID ${pid}`);
    } finally {
      setTerminatingPid(null);
    }
  };

  const handleAskAboutProcess = (p: HostProcess) => {
    setProcessesModalOpen(false);
    setSelectedProcess(p);
    const procTarget = `PID ${p.pid} (${p.name})`;
    setTargetHost(procTarget);
    localStorage.setItem("ragsec_current_target_host", procTarget);
    const roleInfo = p.functional_role ? `Role: "${p.functional_role}". ` : "";
    const prompt = `Investigate running process PID ${p.pid} (${p.name}): ${roleInfo}Command line: "${p.cmdline}". Resource usage: ${p.cpu_percent}% CPU, ${p.memory_mb}MB RAM. Analyze its true functional purpose, evaluate whether it is legitimate software, developer workload, or harmful, and provide proportional remediation and management options rather than just asking to terminate it.`;
    handleSendMessage(prompt, procTarget);
  };

  const filteredProcesses = useMemo(() => {
    let list = processes;
    if (processFilter === "suspicious") {
      list = list.filter(p => p.is_suspicious);
    } else if (processFilter === "high_cpu") {
      list = list.filter(p => p.cpu_percent >= 10.0);
    }
    if (processSearch.trim()) {
      const q = processSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        String(p.pid).includes(q) || 
        p.cmdline.toLowerCase().includes(q)
      );
    }
    return list;
  }, [processes, processFilter, processSearch]);

  // Attached threat context from Threat Scanner or Dashboard
  const [attachedThreat, setAttachedThreat] = useState<{
    fileName?: string;
    filePath?: string;
    category?: string;
  } | null>(initialThreat || null);

  useEffect(() => {
    if (initialThreat) {
      setAttachedThreat(initialThreat);
    }
  }, [initialThreat]);

  // Sidebar open/collapse state (ChatGPT style)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionSearch, setSessionSearch] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Multi-session chat history state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("ragsec_copilot_chat_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "sess-default",
        title: "Active Incident Investigation",
        updatedAt: new Date().toLocaleTimeString(),
        messages: []
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || "sess-default");

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ragsec_copilot_chat_sessions", JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save chat sessions:", e);
    }
  }, [sessions]);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0];
  }, [sessions, activeSessionId]);

  const messages = activeSession?.messages || [];

  // Filtered sessions for sidebar search
  const filteredSessions = useMemo(() => {
    if (!sessionSearch.trim()) return sessions;
    const q = sessionSearch.toLowerCase();
    return sessions.filter(s => s.title.toLowerCase().includes(q));
  }, [sessions, sessionSearch]);

  // Input & sending state
  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputQuery]);

  // New Chat Action
  const handleNewChat = () => {
    const newId = `sess-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Investigation Thread",
      updatedAt: new Date().toLocaleTimeString(),
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInputQuery("");
    toast.success("New investigation chat thread created");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // Delete Session Action
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // Clear current session messages instead of deleting sole session
      setSessions([
        {
          id: `sess-${Date.now()}`,
          title: "New Investigation Thread",
          updatedAt: new Date().toLocaleTimeString(),
          messages: []
        }
      ]);
      return;
    }
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      if (remaining.length > 0) setActiveSessionId(remaining[0].id);
    }
    toast.info("Chat thread deleted");
  };

  // Inline rename session
  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editingTitle.trim() } : s));
    }
    setEditingSessionId(null);
  };

  // Clear current chat messages
  const handleClearCurrentChat = () => {
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [] } : s));
    toast.info("Conversation cleared");
  };

  // Export Chat to Markdown
  const handleExportChat = () => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }
    let md = `# RAGSec AI Copilot Investigation Transcript\n`;
    md += `**Date**: ${new Date().toLocaleString()}\n`;
    md += `**Active Brain**: ${selectedModel}\n`;
    md += `**Target Host**: ${targetHost}\n`;
    if (attachedThreat) {
      md += `**Attached Threat**: ${attachedThreat.fileName} (${attachedThreat.category || "Threat"})\n`;
    }
    md += `\n---\n\n`;

    for (const m of messages) {
      md += `### ${m.role === "user" ? "SOC Analyst" : `AI Assistant (${m.model_used || selectedModel})`} - ${m.timestamp}\n\n`;
      md += `${m.content}\n\n`;
      if (m.recommended_playbook) {
        md += `#### Recommended Playbook: ${m.recommended_playbook.title} (${m.recommended_playbook.action_type})\n`;
        md += `\`\`\`powershell\n${m.recommended_playbook.script}\n\`\`\`\n\n`;
      }
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ragsec-chat-${activeSession.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript exported to Markdown file!");
  };

  // Copy code helper
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Stage Playbook directly to HitL deck
  const handleStagePlaybook = (playbook: RecommendedPlaybook) => {
    try {
      const stagedItem = {
        id: `ACT-${Date.now().toString().slice(-4)}`,
        action_type: playbook.action_type || "CUSTOM_PLAYBOOK",
        target_device_id: playbook.target || targetHost,
        description: playbook.title || "AI Recommended Mitigation Playbook",
        status: "RECOMMENDED",
        script_content: playbook.script,
        created_at: new Date().toLocaleTimeString(),
        playbook_steps: [
          { step: 1, title: "Review Staged Script", description: "Analyst confirms target parameters & containment rules" },
          { step: 2, title: "Execute with HitL Approval", description: `Enforce containment on ${playbook.target || targetHost}` }
        ]
      };

      const existingRaw = localStorage.getItem("ragsec_staged_playbooks");
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(stagedItem);
      localStorage.setItem("ragsec_staged_playbooks", JSON.stringify(existing));
      window.dispatchEvent(new Event("storage"));
      toast.success(`Staged "${playbook.title}" to Mitigation Playbook Deck!`);
    } catch {
      toast.error("Failed to stage playbook.");
    }
  };

  // Send message
  const handleSendMessage = async (textOverride?: string, targetOverride?: string) => {
    const textToSend = (textOverride || inputQuery).trim();
    if (!textToSend || isThinking) return;

    const activeTarget = targetOverride || targetHost;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedMessages = [...messages, userMsg];

    // Auto-update session title if it's the initial default
    const newTitle = activeSession.title === "New Investigation Thread" || activeSession.title === "Active Incident Investigation"
      ? (textToSend.length > 32 ? textToSend.slice(0, 32) + "..." : textToSend)
      : activeSession.title;

    setSessions(prev => prev.map(s => s.id === activeSessionId ? {
      ...s,
      title: newTitle,
      updatedAt: new Date().toLocaleTimeString(),
      messages: updatedMessages
    } : s));

    if (!textOverride) setInputQuery("");
    setIsThinking(true);

    const apiKey = localStorage.getItem("ragsec_groq_api_key") || "";

    try {
      // Chain memory: pass last 8 turns
      const historyPayload = messages.slice(-8).map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      }));

      const res = await fetch(`${API_BASE_URL}/api/chat/step-helper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          conversation_history: historyPayload,
          step_context: {
            step_title: "Mitigation Copilot Full Chat",
            target_file: attachedThreat?.fileName,
            target_host: activeTarget
          },
          current_page: "mitigation",
          search_online: searchOnline,
          provider: "groq",
          model: selectedModel,
          api_key: apiKey || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString(),
          solution_script: data.solution_script,
          verification_command: data.verification_command,
          recommended_playbook: data.recommended_playbook,
          online_sources: data.online_sources,
          model_used: data.model_used || selectedModel,
          search_online: data.search_online
        };

        setSessions(prev => prev.map(s => s.id === activeSessionId ? {
          ...s,
          updatedAt: new Date().toLocaleTimeString(),
          messages: [...s.messages, aiMsg]
        } : s));
      } else {
        throw new Error("Backend service returned error");
      }
    } catch {
      // Smart contextual fallback without unsolicited bloat
      const lower = textToSend.toLowerCase().trim();
      let fallbackContent = "";
      let fallbackPlaybook: RecommendedPlaybook | undefined = undefined;

      if (["hi", "hello", "hey", "help", "who are you"].includes(lower)) {
        fallbackContent = `Hello! I am your RAGSec AI Copilot for target \`${targetHost}\`. I have direct visibility into running processes, file integrity alerts, and mitigation playbooks.\n\nWhat would you like to investigate on \`${targetHost}\`?`;
      } else if (lower.includes("process") || lower.includes("running") || lower.includes("cpu")) {
        fallbackContent = `### Running Processes Snapshot on \`${targetHost}\`\n\nThere are currently **${processes.length} active processes** being monitored. Top active processes are tracked in telemetry.\n\nWould you like me to analyze a specific PID or terminate an anomalous process? Click **Processes** in the top bar to inspect them live.`;
      } else if (lower.includes("stop") || lower.includes("kill") || lower.includes("terminate")) {
        const pidMatch = textToSend.match(/\b(?:pid|id)?\s*(\d{2,6})\b/i);
        const targetPid = pidMatch ? pidMatch[1] : "PID";
        fallbackContent = `### Process Termination Plan for \`${targetHost}\`\n\nTo terminate process **${targetPid}**, run in an elevated PowerShell session:\n\`\`\`powershell\nStop-Process -Id ${targetPid} -Force -ErrorAction SilentlyContinue\nWrite-Host "[RAGSec] Terminated PID ${targetPid}."\n\`\`\``;
        fallbackPlaybook = {
          title: `Terminate Process ${targetPid}`,
          action_type: "PROCESS_TERMINATION",
          script: `Stop-Process -Id ${targetPid} -Force -ErrorAction SilentlyContinue`,
          target: `${targetHost} (PID ${targetPid})`
        };
      } else {
        fallbackContent = `### Contextual Guidance for \`${targetHost}\`\n\nI reviewed your request regarding: **${textToSend.slice(0, 50)}**.\n\n- Endpoint \`${targetHost}\` telemetry is online.\n- No critical attack chain was detected without specific target parameters.\n\nCould you specify the exact process PID, file name, or alert you want to investigate?`;
      }

      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: fallbackContent,
        timestamp: new Date().toLocaleTimeString(),
        solution_script: fallbackPlaybook?.script,
        verification_command: fallbackPlaybook ? `Get-Process | Where-Object { $_.Id -eq ${targetHost} }` : undefined,
        recommended_playbook: fallbackPlaybook,
        model_used: selectedModel,
        search_online: searchOnline
      };

      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...s,
        updatedAt: new Date().toLocaleTimeString(),
        messages: [...s.messages, fallbackMsg]
      } : s));
    } finally {
      setIsThinking(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // Regenerate latest response
  const handleRegenerate = () => {
    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIndex === -1) return;
    const actualIndex = messages.length - 1 - lastUserIndex;
    const lastPrompt = messages[actualIndex].content;
    handleSendMessage(lastPrompt);
  };

  // Formatter for markdown code blocks
  const renderMessageContent = (msg: ChatMessage) => {
    const text = msg.content;
    // Split into code blocks and normal text
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 leading-relaxed text-sm">
        {parts.map((part, index) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const lines = part.slice(3, -3).trim().split("\n");
            const firstLine = lines[0].trim();
            const language = firstLine && !firstLine.includes(" ") ? firstLine : "powershell";
            const code = (firstLine && !firstLine.includes(" ") ? lines.slice(1) : lines).join("\n");
            const blockId = `${msg.id}-code-${index}`;

            return (
              <div key={index} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#090C14] shadow-md">
                <div className="px-4 py-1.5 bg-white/[0.04] border-b border-white/[0.07] flex items-center justify-between text-xs font-mono text-[#8E8E93]">
                  <span className="uppercase text-[10px] tracking-wider text-cyan-400 font-bold">{language}</span>
                  <button
                    onClick={() => handleCopyCode(code, blockId)}
                    className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
                  >
                    {copiedId === blockId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === blockId ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap selection:bg-emerald-900/60">
                  {code}
                </pre>
              </div>
            );
          }

          // Plain text with line breaks
          return (
            <div key={index} className="whitespace-pre-wrap">
              {part}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] w-full overflow-hidden rounded-2xl bg-[#080A11] border border-white/[0.08] shadow-2xl">
      {/* ---------------------------------------------------- */}
      {/* LEFT CHATGPT SIDEBAR: Sessions History & Management  */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full bg-[#0B0F19] border-r border-white/[0.08] flex flex-col flex-shrink-0 overflow-hidden z-10"
          >
            {/* New Chat Button */}
            <div className="p-3.5 border-b border-white/[0.08] space-y-2.5">
              <button
                onClick={handleNewChat}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 apple-button transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Investigation</span>
              </button>

              {/* Search Past Chats */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  placeholder="Search past threads..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Session History List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase text-[#8E8E93] tracking-wider">
                Recent Chats ({filteredSessions.length})
              </div>

              {filteredSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isEditing = editingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`group relative p-2.5 px-3 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between gap-2 select-none ${
                      isActive 
                        ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-sm" 
                        : "text-[#8E8E93] hover:text-white hover:bg-white/[0.035]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-blue-400 animate-pulse" : "bg-white/20"}`} />
                      
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(session.id);
                            if (e.key === "Escape") setEditingSessionId(null);
                          }}
                          onBlur={() => handleSaveRename(session.id)}
                          autoFocus
                          className="w-full px-1.5 py-0.5 rounded bg-black/60 border border-blue-400 text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <span className="truncate font-medium block">
                          {session.title}
                        </span>
                      )}
                    </div>

                    {/* Actions on hover */}
                    {!isEditing && (
                      <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => handleStartRename(session, e)}
                          className="p-1 rounded hover:bg-white/10 text-[#8E8E93] hover:text-white"
                          title="Rename thread"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 rounded hover:bg-rose-500/20 text-[#8E8E93] hover:text-rose-400"
                          title="Delete thread"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar Bottom Footer: Engine Status */}
            <div className="p-3 bg-white/[0.02] border-t border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono text-white text-[10px]">{selectedModel.split("/").pop()}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                  GROQ LPU
                </span>
              </div>

              {onNavigateToMitigation && (
                <button
                  onClick={onNavigateToMitigation}
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 apple-button transition-all"
                >
                  <Zap className="w-3 h-3" />
                  <span>Go to Mitigation Workbench</span>
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MAIN CHAT WORKSPACE (ChatGPT Core)                  */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080A11] relative">
        {/* Top Header Bar */}
        <header className="min-h-[3.75rem] px-4 py-2 border-b border-white/[0.08] bg-[#0A0D17]/95 backdrop-blur-xl flex items-center justify-between gap-3 flex-shrink-0 z-20 overflow-x-auto no-scrollbar">
          {/* Left Cluster: Controls & Target Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-shrink-0">
            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E8E93] hover:text-white apple-button transition-all flex-shrink-0"
              title={sidebarOpen ? "Hide History Sidebar" : "Show History Sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {/* Model Selector Dropdown */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="relative group">
                <select
                  value={selectedModel}
                  onChange={(e) => handleSelectModel(e.target.value)}
                  className="appearance-none pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-blue-500/50 cursor-pointer font-mono max-w-[145px] sm:max-w-[175px] lg:max-w-[220px] truncate"
                >
                  {DEFAULT_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0C101A] text-white">
                      {m.name} ({m.badge})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93] absolute right-2 sm:right-2.5 top-2.5 pointer-events-none" />
              </div>

              {onOpenBrainModal && (
                <button
                  onClick={onOpenBrainModal}
                  className="p-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-white transition-all apple-button"
                  title="Configure Groq AI Brain Models, API Key & LPU Tiers"
                >
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                </button>
              )}
            </div>

            {/* Interactive Target Host / Process Switcher (Preset + Process Targets) */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => {
                  setTargetDropdownOpen(!targetDropdownOpen);
                  if (!targetDropdownOpen && processes.length === 0) {
                    fetchProcesses();
                  }
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-mono transition-all whitespace-nowrap ${
                  targetHost.startsWith("PID")
                    ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300"
                    : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white"
                }`}
                title="Click to switch target endpoint or process"
              >
                {targetHost.startsWith("PID") ? (
                  <Activity className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 animate-pulse" />
                ) : (
                  <Server className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                )}
                <span className="text-[#8E8E93] hidden md:inline">Target:</span>
                <span className={`font-semibold max-w-[110px] sm:max-w-[150px] lg:max-w-[190px] truncate ${
                  targetHost.startsWith("PID") ? "text-rose-300" : "text-emerald-300"
                }`}>
                  {targetHost}
                </span>
                <ChevronDown className="w-3 h-3 text-[#8E8E93] flex-shrink-0" />
              </button>

              {/* Target Dropdown Popover */}
              <AnimatePresence>
                {targetDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-[#0D1220] border border-white/10 shadow-2xl p-3 z-50 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-white border-b border-white/[0.08] pb-2">
                      <span className="flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                        Target Endpoint & Process
                      </span>
                      <div className="flex items-center gap-1">
                        {targetHost !== "Local Endpoint" && (
                          <button
                            onClick={handleResetTargetToLocal}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20"
                            title="Reset active target back to Local Endpoint"
                          >
                            Reset to Local
                          </button>
                        )}
                        <button
                          onClick={() => setTargetDropdownOpen(false)}
                          className="text-[#8E8E93] hover:text-white p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Section: Live Host Processes */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          Target a Running Process
                        </span>
                        {processes.length > 0 && (
                          <button
                            onClick={() => {
                              setTargetDropdownOpen(false);
                              setProcessesModalOpen(true);
                            }}
                            className="text-cyan-400 hover:underline text-[10px]"
                          >
                            All ({processes.length})
                          </button>
                        )}
                      </div>
                      {processes.length > 0 ? (
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {processes.slice(0, 5).map((p) => {
                            const isSelected = targetHost.includes(String(p.pid));
                            return (
                              <button
                                key={p.pid}
                                onClick={() => handleSelectProcessTarget(p)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold"
                                    : "hover:bg-white/[0.05] text-slate-300 hover:text-white"
                                }`}
                              >
                                <span className="truncate flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${p.is_suspicious ? "bg-rose-400 animate-pulse" : "bg-emerald-400"}`} />
                                  <span className="font-semibold text-white">{p.name}</span>
                                  <span className="text-[#8E8E93] text-[10px]">PID {p.pid}</span>
                                </span>
                                <span className="text-[10px] text-[#8E8E93] font-mono flex-shrink-0">
                                  {p.cpu_percent}% CPU
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-2 text-center text-[11px] text-[#8E8E93] font-mono flex items-center justify-center gap-1.5">
                          <RotateCw className="w-3 h-3 animate-spin text-blue-400" />
                          <span>Loading active processes...</span>
                        </div>
                      )}
                    </div>

                    {/* Presets and saved targets */}
                    <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider block">
                        Saved Target Presets
                      </label>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {customTargets.map((t) => (
                          <button
                            key={t}
                            onClick={() => handleSetCustomTarget(t)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                              targetHost === t 
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold" 
                                : "hover:bg-white/[0.05] text-[#8E8E93] hover:text-white"
                            }`}
                          >
                            <span className="truncate">{t}</span>
                            {targetHost === t && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Enter Custom Target */}
                    <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider block">
                        Add Custom Host / IP / PID
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={customTargetInput}
                          onChange={(e) => setCustomTargetInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSetCustomTarget(customTargetInput);
                          }}
                          placeholder="e.g. 192.168.1.50 or PID 11832"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          onClick={() => handleSetCustomTarget(customTargetInput)}
                          disabled={!customTargetInput.trim()}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold apple-button transition-all flex items-center gap-1 flex-shrink-0"
                          title="Apply custom target"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Set</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Attached Threat Badge (if any) */}
            {attachedThreat && (
              <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px] font-mono flex-shrink-0">
                <ShieldAlert className="w-3 h-3 text-rose-400 flex-shrink-0" />
                <span className="truncate max-w-[120px]">{attachedThreat.fileName}</span>
                <button
                  onClick={() => setAttachedThreat(null)}
                  className="hover:text-white ml-0.5"
                  title="Remove threat context"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right Cluster: Actions & Live Processes Trigger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live Processes Inspector Trigger */}
            <button
              onClick={() => {
                fetchProcesses();
                setProcessesModalOpen(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 apple-button transition-all whitespace-nowrap flex-shrink-0"
              title="Open Live Host Processes Inspector"
            >
              <Activity className={`w-3.5 h-3.5 flex-shrink-0 ${suspiciousProcessCount > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />
              <span className="hidden sm:inline">Processes</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold flex-shrink-0 ${
                suspiciousProcessCount > 0 
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" 
                  : "bg-white/10 text-slate-300"
              }`}>
                {processes.length > 0 ? processes.length : "..."}
              </span>
            </button>

            {/* Online Intelligence Toggle */}
            <button
              onClick={toggleSearchOnline}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 apple-button transition-all whitespace-nowrap flex-shrink-0 ${
                searchOnline 
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-950/50" 
                  : "bg-white/[0.04] border-white/[0.08] text-[#8E8E93] hover:text-white"
              }`}
              title="Toggle Live Online MITRE / NVD Intelligence Retrieval"
            >
              <Globe className={`w-3.5 h-3.5 flex-shrink-0 ${searchOnline ? "text-cyan-400 animate-spin" : ""}`} />
              <span className="hidden sm:inline whitespace-nowrap">Online Intel</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold flex-shrink-0 ${searchOnline ? "bg-cyan-400/20 text-cyan-200" : "bg-white/10 text-slate-400"}`}>
                {searchOnline ? "ON" : "OFF"}
              </span>
            </button>

            {/* Export Chat */}
            <button
              onClick={handleExportChat}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E8E93] hover:text-white transition-all apple-button flex-shrink-0"
              title="Export conversation to Markdown transcript"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear Chat */}
            <button
              onClick={handleClearCurrentChat}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.08] text-[#8E8E93] hover:text-rose-300 transition-all apple-button flex-shrink-0"
              title="Clear messages in this chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ---------------------------------------------------- */}
        {/* MESSAGE STREAM AREA                                  */}
        {/* ---------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {/* EMPTY STATE: Hero & Starter Cards */}
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto py-12 text-center space-y-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-400 absolute -top-1 -right-1 ring-4 ring-[#080A11] pulse-dot" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  How can I assist your security investigation today?
                </h2>
                <p className="text-xs md:text-sm text-[#8E8E93] max-w-lg mx-auto leading-relaxed">
                  Grounded with real-time FIM telemetry, CTI vector embeddings, and Groq LPU reasoning (<span className="text-blue-400 font-mono font-medium">{selectedModel.split("/").pop()}</span>).
                </p>
              </div>

              {/* 4 Interactive Starter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {STARTER_PROMPTS.map((starter, idx) => {
                  const Icon = starter.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(starter.prompt)}
                      className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-blue-500/30 text-left transition-all apple-button group space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                          <Icon className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {starter.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] line-clamp-2 leading-relaxed">
                        {starter.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((m) => {
                const isUser = m.role === "user";

                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 md:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20 mt-1">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Message Bubble Container */}
                    <div className={`space-y-3 max-w-[85%] md:max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
                      {/* Author Header */}
                      <div className={`flex items-center gap-2 text-[11px] text-[#8E8E93] font-mono ${isUser ? "justify-end" : "justify-start"}`}>
                        <span className="font-semibold text-white">
                          {isUser ? "SOC Analyst" : `RAGSec Brain (${(m.model_used || selectedModel).split("/").pop()})`}
                        </span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </div>

                      {/* Content Card */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        isUser 
                          ? "bg-blue-600/20 border-blue-500/30 text-white shadow-md shadow-blue-950/30 rounded-tr-sm" 
                          : "bg-white/[0.035] border-white/[0.08] text-slate-200 shadow-md rounded-tl-sm"
                      }`}>
                        {renderMessageContent(m)}

                        {/* RECOMMENDED MITIGATION PLAYBOOK CARD (HitL Integration) */}
                        {m.recommended_playbook && (
                          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-black/80 to-slate-950/80 border border-emerald-500/40 space-y-3 shadow-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    {m.recommended_playbook.title}
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase tracking-wider">
                                    {m.recommended_playbook.action_type} • TARGET: {
                                      (m.recommended_playbook.target && !m.recommended_playbook.target.includes("FINANCE-PC")) 
                                        ? m.recommended_playbook.target 
                                        : (targetHost.includes("FINANCE-PC") ? "Local Endpoint" : targetHost)
                                    }
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons: Multi-Tiered Remediation & HitL Stage */}
                              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                {(() => {
                                  const match = m.recommended_playbook!.script.match(/Stop-Process\s+-Id\s+(\d+)/i) || 
                                                m.recommended_playbook!.target?.match(/PID\s*(\d+)/i);
                                  const pidToKill = match ? parseInt(match[1]) : null;
                                  const matchedProc = pidToKill ? processes.find(p => p.pid === pidToKill) : null;
                                  const isProtected = matchedProc ? !matchedProc.can_terminate : false;

                                  if (isProtected) {
                                    return (
                                      <span 
                                        className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-medium text-xs flex items-center gap-1.5"
                                        title="This is a core RAGSec platform or operating system process and is protected from termination."
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Protected Core Service</span>
                                      </span>
                                    );
                                  }

                                  return (
                                    <>
                                      {pidToKill && (
                                        <button
                                          onClick={() => {
                                            const throttleScript = `(Get-Process -Id ${pidToKill}).PriorityClass = 'BelowNormal'`;
                                            navigator.clipboard.writeText(throttleScript);
                                            toast.success(`Copied CPU throttling script for PID ${pidToKill} to clipboard!`);
                                          }}
                                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 apple-button"
                                          title="Lower process CPU scheduling priority to BelowNormal"
                                        >
                                          <Cpu className="w-3.5 h-3.5" />
                                          <span>Throttle CPU</span>
                                        </button>
                                      )}

                                      {(m.recommended_playbook!.action_type.includes("PROCESS") || m.recommended_playbook!.script.includes("Stop-Process")) && (
                                        <button
                                          onClick={() => {
                                            if (pidToKill) {
                                              handleTerminateProcess(pidToKill, `PID ${pidToKill}`);
                                            } else {
                                              toast.info("Process termination command ready in script");
                                            }
                                          }}
                                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 apple-button shadow-md shadow-rose-950/50"
                                          title="Forcibly terminate targeted process immediately"
                                        >
                                          <Square className="w-3.5 h-3.5 fill-current" />
                                          <span>Stop Process</span>
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}

                                <button
                                  onClick={() => handleStagePlaybook(m.recommended_playbook!)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 apple-button shadow-md shadow-emerald-950/50"
                                  title="Stage directly to Human-in-the-Loop Mitigation Deck"
                                >
                                  <Zap className="w-3.5 h-3.5 fill-current" />
                                  <span>Stage to Playbook Deck</span>
                                </button>
                              </div>
                            </div>

                            {/* Containment Script Box */}
                            <div className="rounded-lg bg-black/60 border border-white/10 overflow-hidden">
                              <div className="px-3 py-1.5 bg-white/[0.04] border-b border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-cyan-300">
                                <span className="flex items-center gap-1">
                                  <Terminal className="w-3 h-3 text-cyan-400" />
                                  Containment Script
                                </span>
                                <button
                                  onClick={() => handleCopyCode(m.recommended_playbook!.script, `${m.id}-pb`)}
                                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[10px] apple-button"
                                >
                                  {copiedId === `${m.id}-pb` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedId === `${m.id}-pb` ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                              <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap selection:bg-emerald-900/60">
                                {m.recommended_playbook.script}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Online Reference Intelligence Links */}
                        {m.online_sources && m.online_sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2">
                            <div className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              <span>Online Intelligence Citations ({m.online_sources.length}):</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {m.online_sources.map((s, idx) => (
                                <a
                                  key={idx}
                                  href={s.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-500/30 transition-all text-xs space-y-1 group"
                                >
                                  <div className="flex items-center justify-between text-cyan-300 font-semibold font-mono text-[11px]">
                                    <span className="truncate">{s.title}</span>
                                    <ExternalLink className="w-3 h-3 flex-shrink-0 ml-1 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                  <p className="text-[10px] text-[#8E8E93] line-clamp-2 leading-relaxed">
                                    {s.snippet}
                                  </p>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Assistant Message Actions Toolbar */}
                      {!isUser && (
                        <div className="flex items-center gap-2 pt-1 text-xs text-[#8E8E93]">
                          <button
                            onClick={() => handleCopyCode(m.content, `${m.id}-copy`)}
                            className="px-2 py-1 rounded-lg hover:bg-white/[0.05] hover:text-white flex items-center gap-1 transition-colors"
                            title="Copy full response"
                          >
                            {copiedId === `${m.id}-copy` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy</span>
                          </button>

                          <button
                            onClick={handleRegenerate}
                            disabled={isThinking}
                            className="px-2 py-1 rounded-lg hover:bg-white/[0.05] hover:text-white flex items-center gap-1 transition-colors"
                            title="Regenerate this response"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Regenerate</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Thinking / Streaming Indicator with Real-Time ETA Progress */}
              {isThinking && (
                <div className="space-y-2 max-w-xl">
                  <RealtimeETAProgressBar
                    title="Groq LPU Reasoning & Deep Investigation"
                    subtitle={searchOnline 
                      ? `Querying live MITRE CTI & telemetry for ${targetHost} with ${selectedModel.split("/").pop()}...` 
                      : `Correlating multi-turn endpoint telemetry for ${targetHost} with ${selectedModel.split("/").pop()}...`}
                    isActive={isThinking}
                    estimatedDurationMs={4200}
                    accentColor="purple"
                    stages={[
                      { label: "Stage 1/4: Ingesting Process Telemetry & CTI Embeddings", targetPercent: 0 },
                      { label: "Stage 2/4: Grounding Incident History & Baseline Evaluation", targetPercent: 28 },
                      { label: "Stage 3/4: Groq LPU Token Stream & Playbook Synthesis", targetPercent: 62 },
                      { label: "Stage 4/4: Formatting Proportional Remediation Options", targetPercent: 88 }
                    ]}
                  />
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* CHATGPT BOTTOM INPUT CONSOLE                         */}
        {/* ---------------------------------------------------- */}
        <div className="p-4 pt-2 bg-gradient-to-t from-[#080A11] via-[#080A11] to-transparent z-20">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Quick Context & Process Action Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
              <button
                onClick={() => {
                  fetchProcesses();
                  setProcessesModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-all flex-shrink-0"
              >
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Inspect Running Processes</span>
                <span className="text-[10px] font-mono text-emerald-300">({processes.length})</span>
              </button>

              <button
                onClick={() => handleSendMessage(`Analyze the current running processes on endpoint ${targetHost}. Are any executing suspicious command lines, excessive CPU, or potential malware activity?`)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-all flex-shrink-0"
              >
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Scan for Rogue Processes</span>
              </button>

              <button
                onClick={() => handleSendMessage(`List the top CPU-intensive and memory-intensive processes on ${targetHost} and explain what their binaries are doing.`)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-all flex-shrink-0"
              >
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>What is Running on Host?</span>
              </button>
            </div>

            {/* Input Card */}
            <div className="relative rounded-2xl bg-[#0E121F]/90 backdrop-blur-2xl border border-white/[0.12] focus-within:border-blue-500/60 shadow-2xl transition-all overflow-hidden">
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  searchOnline 
                    ? `Ask RAGSec Copilot regarding ${targetHost} (Online CTI enabled)...` 
                    : `Message RAGSec AI Copilot regarding ${targetHost} (Enter to send, Shift+Enter for newline)...`
                }
                className="w-full px-4 pt-3.5 pb-12 bg-transparent text-sm text-white placeholder-[#636366] focus:outline-none resize-none min-h-[52px] max-h-[200px] leading-relaxed"
              />

              {/* Bottom bar inside textarea */}
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                  {/* Online Search Toggle Pill */}
                  <button
                    onClick={toggleSearchOnline}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold flex items-center gap-1 transition-all apple-button ${
                      searchOnline 
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" 
                        : "bg-white/[0.04] text-[#8E8E93] hover:text-white border border-white/[0.06]"
                    }`}
                    title="Toggle Live Online MITRE / NVD Search"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Online CTI</span>
                  </button>

                  {/* Target Host Pill */}
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono">
                    <button
                      onClick={() => setTargetDropdownOpen(true)}
                      className="flex items-center gap-1 text-[#8E8E93] hover:text-white transition-colors"
                      title="Click to switch target"
                    >
                      {targetHost.startsWith("PID") ? (
                        <Activity className="w-3 h-3 text-rose-400 animate-pulse" />
                      ) : (
                        <Server className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className={targetHost.startsWith("PID") ? "text-rose-300 font-semibold max-w-[120px] sm:max-w-[180px] truncate" : "text-emerald-300"}>
                        {targetHost}
                      </span>
                    </button>
                    {targetHost !== "Local Endpoint" && (
                      <button
                        onClick={handleResetTargetToLocal}
                        className="text-[#8E8E93] hover:text-white ml-0.5"
                        title="Reset target to Local Endpoint"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isThinking || !inputQuery.trim()}
                  className="pointer-events-auto p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white shadow-lg shadow-blue-500/30 apple-button transition-all"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Disclaimer */}
            <p className="text-center text-[10px] text-[#636366] font-mono">
              RAGSec Neural Engine outputs grounded security intelligence. Verify generated containment scripts prior to HitL execution.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LIVE HOST PROCESSES INSPECTOR MODAL                  */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {processesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-5xl max-h-[85vh] rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Live Host Processes & Activity Telemetry
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono border border-emerald-500/30">
                        {targetHost}
                      </span>
                    </h3>
                    <p className="text-xs text-[#8E8E93]">
                      Real-time process tree inspection, resource consumption, and behavioral threat detection.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchProcesses}
                    disabled={processesLoading}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white apple-button transition-all"
                    title="Refresh running processes"
                  >
                    <RotateCw className={`w-4 h-4 ${processesLoading ? "animate-spin text-blue-400" : ""}`} />
                  </button>
                  <button
                    onClick={() => setProcessesModalOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.08] text-[#8E8E93] hover:text-white apple-button transition-all"
                    title="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter & Search Toolbar */}
              <div className="px-6 py-3 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 bg-black/20 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setProcessFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      processFilter === "all"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-white/[0.04] text-[#8E8E93] hover:text-white"
                    }`}
                  >
                    All ({processes.length})
                  </button>
                  <button
                    onClick={() => setProcessFilter("suspicious")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      processFilter === "suspicious"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                        : "bg-white/[0.04] text-[#8E8E93] hover:text-rose-300"
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Suspicious ({suspiciousProcessCount})</span>
                  </button>
                  <button
                    onClick={() => setProcessFilter("high_cpu")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      processFilter === "high_cpu"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "bg-white/[0.04] text-[#8E8E93] hover:text-amber-300"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>High CPU (&gt;10%)</span>
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={processSearch}
                    onChange={(e) => setProcessSearch(e.target.value)}
                    placeholder="Filter by name, PID, or cmdline..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Processes Table List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {processesLoading && processes.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <RotateCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                    <p className="text-sm text-[#8E8E93]">Inspecting live processes on {targetHost}...</p>
                  </div>
                ) : filteredProcesses.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-semibold text-white">No processes matched filter</p>
                    <p className="text-xs text-[#8E8E93]">Try clearing your search query or filter selection.</p>
                  </div>
                ) : (
                  filteredProcesses.map((p) => {
                    const isTerminating = terminatingPid === p.pid;
                    return (
                      <div
                        key={p.pid}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          p.is_suspicious 
                            ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50" 
                            : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                        }`}
                      >
                        {/* Process Info */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08]">
                              PID {p.pid}
                            </span>
                            <span className="text-sm font-bold text-white">{p.name}</span>

                            {/* Category Badge */}
                            {p.category === "RAGSEC_PLATFORM" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 shadow-sm">
                                <Shield className="w-3 h-3 text-purple-400" />
                                RAGSec Platform Core
                              </span>
                            )}
                            {p.category === "SYSTEM_INFRASTRUCTURE" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                <Shield className="w-3 h-3 text-blue-400" />
                                Windows OS Core
                              </span>
                            )}
                            {p.category === "DEV_ENVIRONMENT" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-emerald-400" />
                                Dev Environment
                              </span>
                            )}
                            {p.category === "PRODUCTIVITY_APP" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                                Application
                              </span>
                            )}

                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase ${
                              p.status === "running" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-400"
                            }`}>
                              {p.status}
                            </span>
                            {p.create_time && (
                              <span className="text-[10px] font-mono text-[#8E8E93]">
                                Started: {p.create_time}
                              </span>
                            )}
                          </div>

                          {/* Functional Role Description */}
                          {p.functional_role && (
                            <p className="text-xs text-white/90 font-medium flex items-center gap-1.5">
                              <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-wide">Role:</span>
                              <span>{p.functional_role}</span>
                            </p>
                          )}

                          {/* Command Line / Activity Preview */}
                          <p className="text-xs font-mono text-cyan-300/70 truncate max-w-3xl" title={p.cmdline}>
                            {p.cmdline || `[${p.name}] system execution`}
                          </p>

                          {/* Suspicious Reasons Badges */}
                          {p.suspicious_reasons && p.suspicious_reasons.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {p.suspicious_reasons.map((r, idx) => (
                                <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                                  <span>{r}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Resource Metrics & Action Buttons */}
                        <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-white/[0.06]">
                          {/* CPU & RAM stats */}
                          <div className="flex items-center gap-3 font-mono text-xs text-right">
                            <div className="text-center px-2 py-1 rounded-lg bg-white/[0.03]">
                              <span className="text-[10px] text-[#8E8E93] block">CPU</span>
                              <span className={`font-bold ${p.cpu_percent > 40 ? "text-amber-400" : p.cpu_percent > 10 ? "text-cyan-400" : "text-emerald-400"}`}>
                                {p.cpu_percent}%
                              </span>
                            </div>
                            <div className="text-center px-2 py-1 rounded-lg bg-white/[0.03]">
                              <span className="text-[10px] text-[#8E8E93] block">RAM</span>
                              <span className="font-bold text-white">{p.memory_mb} MB</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            {/* Investigate with AI */}
                            <button
                              onClick={() => handleAskAboutProcess(p)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 apple-button transition-all"
                              title="Deep Technical Investigation & Multi-Option Remediation"
                            >
                              <Bot className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Investigate</span>
                            </button>

                            {/* Terminate Process */}
                            <button
                              onClick={() => handleTerminateProcess(p.pid, p.name)}
                              disabled={!p.can_terminate || isTerminating}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 apple-button transition-all ${
                                !p.can_terminate 
                                  ? "opacity-40 cursor-not-allowed bg-white/[0.02] border-white/[0.06] text-[#8E8E93]" 
                                  : "bg-rose-600/20 hover:bg-rose-600 border-rose-500/40 text-rose-300 hover:text-white"
                              }`}
                              title={p.can_terminate ? "Forcibly terminate process" : "Protected platform or operating system process"}
                            >
                              {isTerminating ? (
                                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                              ) : !p.can_terminate ? (
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                              <span>{isTerminating ? "Stopping..." : !p.can_terminate ? "Protected" : "Stop"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AICopilotChatView;
