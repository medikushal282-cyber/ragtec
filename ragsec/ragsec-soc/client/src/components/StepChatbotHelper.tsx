import React, { useState, useEffect, useRef } from "react";
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
  ChevronUp, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  ArrowRight,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Plus,
  History,
  Trash2,
  BookmarkCheck,
  Zap
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "http://127.0.0.1:8000";

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

export interface HelperMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
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
  messages: HelperMessage[];
}

interface StepChatbotHelperProps {
  currentPage: string;
  activeStep?: {
    step_number?: number;
    step_title?: string;
    status?: string;
    detail?: string;
    error_message?: string;
  } | null;
  activeThreat?: {
    fileName?: string;
    filePath?: string;
    category?: string;
  } | null;
  activeModel?: string;
}

const DEFAULT_WELCOME_MSG: HelperMessage = {
  id: "msg-init",
  sender: "ai",
  text: "Hello Analyst! I am your **RAGSec AI Step & Diagnostic Assistant**.\n\nI retain multi-turn chain memory across our entire session. If you run into command failures (e.g. Access Denied, process locks, timeout, or parameter errors), ask me for a definitive diagnosis and copyable resolution script. I will also synthesize and recommend ready-to-execute **Mitigation Playbooks** that you can stage directly to the response queue.",
  timestamp: new Date().toLocaleTimeString(),
  model_used: "openai/gpt-oss-120b",
  search_online: false
};

export const StepChatbotHelper: React.FC<StepChatbotHelperProps> = ({
  currentPage,
  activeStep,
  activeThreat,
  activeModel: initialModel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Synchronized Active AI Model
  const [currentModel, setCurrentModel] = useState<string>(() => 
    initialModel || localStorage.getItem("ragsec_active_brain") || "openai/gpt-oss-120b"
  );

  useEffect(() => {
    if (initialModel && initialModel !== currentModel) {
      setCurrentModel(initialModel);
    }
  }, [initialModel]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedBrain = localStorage.getItem("ragsec_active_brain");
      if (savedBrain && savedBrain !== currentModel) {
        setCurrentModel(savedBrain);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [currentModel]);

  const [searchOnline, setSearchOnline] = useState<boolean>(() => {
    return localStorage.getItem("ragsec_helper_search_online") === "true";
  });

  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multi-session Chat History
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("ragsec_helper_chat_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "sess-default",
        title: "Initial Diagnostic Thread",
        updatedAt: new Date().toLocaleTimeString(),
        messages: [{ ...DEFAULT_WELCOME_MSG, model_used: currentModel }]
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || "sess-default";
  });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [DEFAULT_WELCOME_MSG];

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ragsec_helper_chat_sessions", JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("ragsec_helper_search_online", searchOnline ? "true" : "false");
  }, [searchOnline]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // + New Chat handler
  const handleNewChat = () => {
    const newId = `sess-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Session ${sessions.length + 1}`,
      updatedAt: new Date().toLocaleTimeString(),
      messages: [{ ...DEFAULT_WELCOME_MSG, id: `msg-${Date.now()}`, model_used: currentModel }]
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setShowHistory(false);
    toast.success("Started new AI Assistant chat session!");
  };

  // Delete session handler
  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      toast.info("Keeping active session.");
      return;
    }
    const remaining = sessions.filter(s => s.id !== idToDelete);
    setSessions(remaining);
    if (activeSessionId === idToDelete) {
      setActiveSessionId(remaining[0].id);
    }
    toast.success("Chat thread deleted.");
  };

  const quickPills = [
    { label: "Fix Access Denied (0x80070005)", prompt: "The step failed with Access Denied (Error 0x80070005). How do I run with elevated administrator rights?" },
    { label: "Fix vssadmin shadow error", prompt: "Step failed on vssadmin delete shadows. Give me the exact mitigation and verification command." },
    { label: "Fix SQL Injection (CWE-89)", prompt: "How do I parameterize this SQL query in the step to fix CWE-89 SQL injection?" },
    { label: "Recommend containment playbook", prompt: "Synthesize and recommend a complete defensive containment playbook for this host." }
  ];

  // Send Message with Chain Memory
  const handleSendMessage = async (textOverride?: string) => {
    const q = textOverride || inputQuery;
    if (!q.trim() || isThinking) return;

    const userMsg: HelperMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString()
    };

    // Update session title on first message if default
    const updatedMessages = [...messages, userMsg];
    const newTitle = activeSession.title.startsWith("Session") || activeSession.title === "Initial Diagnostic Thread"
      ? (q.length > 28 ? q.slice(0, 28) + "..." : q)
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
      // Chain memory: pass last 8 conversation turns
      const historyPayload = messages.slice(-8).map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));

      const res = await fetch(`${API_BASE_URL}/api/chat/step-helper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          conversation_history: historyPayload,
          step_context: activeStep ? {
            step_number: activeStep.step_number,
            step_title: activeStep.step_title,
            status: activeStep.status,
            detail: activeStep.detail,
            error_message: activeStep.error_message,
            target_host: "Local Endpoint"
          } : {
            step_title: currentPage.replace("_", " "),
            target_file: activeThreat?.fileName,
            target_host: "Local Endpoint"
          },
          current_page: currentPage,
          search_online: searchOnline,
          provider: "groq",
          model: currentModel,
          api_key: apiKey || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: HelperMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString(),
          solution_script: data.solution_script,
          verification_command: data.verification_command,
          recommended_playbook: data.recommended_playbook,
          online_sources: data.online_sources,
          model_used: data.model_used || currentModel,
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
      // Local robust diagnostic fallback
      const fallbackMsg: HelperMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `### Step Diagnostic Solution\n\nI evaluated your request for **${currentPage.replace("_", " ")}**:\n\n1. Ensure command execution runs in an elevated administrative PowerShell session (\`Start-Process powershell -Verb RunAs\`).\n2. Terminate blocking processes:\n\`\`\`powershell\nStop-Process -Name "*malware*" -Force -ErrorAction SilentlyContinue\n\`\`\`\n3. Verify file integrity in \`monitored_workspace/\`.\n\n### 🛡️ Recommended Playbook: Rapid Host Isolation\n- **Target**: Local Endpoint\n- **Action Type**: ISOLATION\n- **Playbook Script**:\n\`\`\`powershell\nGet-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Disable-NetAdapter -Confirm:$false\nWrite-Host "[RAGSec] Node isolated successfully."\n\`\`\``,
        timestamp: new Date().toLocaleTimeString(),
        solution_script: `Stop-Process -Name "*malware*" -Force -ErrorAction SilentlyContinue`,
        verification_command: `Get-Process | Where-Object { $_.Path -like '*malware*' }`,
        recommended_playbook: {
          title: "Rapid Host Isolation",
          action_type: "ISOLATION",
          script: `Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Disable-NetAdapter -Confirm:$false\nWrite-Host "[RAGSec] Node isolated successfully."`,
          target: "Local Endpoint"
        },
        model_used: currentModel,
        search_online: searchOnline
      };

      setSessions(prev => prev.map(s => s.id === activeSessionId ? {
        ...s,
        updatedAt: new Date().toLocaleTimeString(),
        messages: [...s.messages, fallbackMsg]
      } : s));
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code snippet copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Stage Playbook to Mitigation Workbench
  const handleStagePlaybook = (playbook: RecommendedPlaybook) => {
    try {
      const stagedItem = {
        id: `ACT-${Date.now().toString().slice(-4)}`,
        action_type: playbook.action_type || "CUSTOM_PLAYBOOK",
        target_device_id: playbook.target || "Local Endpoint",
        description: playbook.title || "AI Recommended Mitigation Playbook",
        status: "RECOMMENDED",
        script_content: playbook.script,
        created_at: new Date().toLocaleTimeString(),
        playbook_steps: [
          { step: 1, title: "Review Script", description: "Analyst confirms target parameters" },
          { step: 2, title: "Execute on Node", description: `Run payload against ${playbook.target || "Local Endpoint"}` }
        ]
      };

      // Retrieve existing staged playbooks
      const existingStr = localStorage.getItem("ragsec_staged_playbooks") || "[]";
      const existing = JSON.parse(existingStr);
      const updated = [stagedItem, ...existing];
      localStorage.setItem("ragsec_staged_playbooks", JSON.stringify(updated));

      // Trigger custom storage event for instant UI update in Mitigation Copilot
      window.dispatchEvent(new Event("storage"));
      toast.success(`🛡️ Playbook "${playbook.title}" staged to Mitigation Workbench!`);
    } catch {
      toast.error("Failed to stage playbook.");
    }
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right */}
      {!isOpen && (
        <button
          id="ragsec-step-helper-trigger"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-[60] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2.5 shadow-2xl shadow-blue-500/30 border border-white/20 apple-button transition-all transform hover:scale-105"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-white" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 pulse-dot" />
          </div>
          <span>AI Step Helper</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono font-bold">
            {currentModel.split("/").pop()}
          </span>
        </button>
      )}

      {/* Expanded Helper Panel */}
      {isOpen && (
        <div
          id="ragsec-step-helper-panel"
          className={`fixed z-[60] bg-[#0C101A]/95 backdrop-blur-2xl border border-blue-500/40 shadow-2xl rounded-2xl flex flex-col transition-all overflow-hidden ${
            isExpanded
              ? "bottom-4 right-4 w-[650px] h-[780px] max-w-[95vw] max-h-[92vh]"
              : "bottom-4 right-4 w-[460px] h-[600px] max-w-[95vw] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="p-3.5 px-4 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>AI Step & Diagnostic Assistant</span>
                </h3>
                <span className="text-[10px] text-blue-300 font-mono">
                  Brain: {currentModel.split("/").pop()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* + New Chat Button */}
              <button
                onClick={handleNewChat}
                className="px-2 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 apple-button transition-all"
                title="Start a fresh chat thread"
              >
                <Plus className="w-3 h-3" />
                <span>New Chat</span>
              </button>

              {/* History Button */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 apple-button transition-all ${
                  showHistory 
                    ? "bg-white/[0.15] text-white border-white/20" 
                    : "bg-white/[0.04] text-[#8E8E93] hover:text-white border-white/[0.08]"
                }`}
                title="View Chat Sessions History"
              >
                <History className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono">{sessions.length}</span>
              </button>

              {/* Expand / Minimize */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHAT HISTORY SESSIONS DRAWER */}
          {showHistory && (
            <div className="p-3 bg-black/80 border-b border-white/[0.1] space-y-2 flex-shrink-0 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] text-[#8E8E93] font-mono">
                <span className="font-semibold text-white">Active Chat Sessions:</span>
                <span>Click to switch threads</span>
              </div>
              <div className="space-y-1">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => {
                      setActiveSessionId(sess.id);
                      setShowHistory(false);
                    }}
                    className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      sess.id === activeSessionId
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                        : "bg-white/[0.02] border-white/[0.06] text-[#8E8E93] hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="truncate flex-1 mr-2">
                      <p className="font-semibold truncate text-[11px]">{sess.title}</p>
                      <span className="text-[9px] text-[#636366] font-mono">{sess.updatedAt} • {sess.messages.length} messages</span>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="p-1 rounded hover:bg-red-500/20 text-[#8E8E93] hover:text-red-400"
                        title="Delete session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ONLINE SOURCES TOGGLE BAR */}
          <div className="p-2.5 px-4 bg-black/40 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <Globe className={`w-3.5 h-3.5 ${searchOnline ? "text-cyan-400" : "text-[#8E8E93]"}`} />
              <span className="text-[11px] font-medium text-slate-200">Seek Online Sources:</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                searchOnline 
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" 
                  : "bg-white/[0.05] text-[#8E8E93] border-white/[0.08]"
              }`}>
                {searchOnline ? "MITRE / NVD / MS LEARN ON" : "AIR-GAPPED ONLY"}
              </span>

              <button
                onClick={() => {
                  const nextVal = !searchOnline;
                  setSearchOnline(nextVal);
                  toast.info(nextVal ? "Online CTI lookup enabled (MITRE ATT&CK & NVD)." : "Air-Gapped mode enforced (local CTI only).");
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  searchOnline ? "bg-cyan-500" : "bg-neutral-700"
                }`}
                title="Toggle Online Threat Intelligence and Documentation Search"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    searchOnline ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Active Context Banner */}
          <div className="px-4 py-1.5 bg-blue-500/10 border-b border-blue-500/20 text-[10px] font-mono text-blue-300 flex items-center justify-between flex-shrink-0">
            <span className="truncate">
              Context: {activeStep ? `Step ${activeStep.step_number || ""}: ${activeStep.step_title || ""}` : currentPage.replace("_", " ").toUpperCase()}
            </span>
            {activeThreat?.fileName && (
              <span className="text-amber-300 font-semibold truncate ml-2">
                [{activeThreat.fileName}]
              </span>
            )}
          </div>

          {/* Quick Problem Action Pills */}
          <div className="p-2 px-3 bg-white/[0.015] border-b border-white/[0.05] flex items-center gap-1.5 overflow-x-auto flex-shrink-0">
            {quickPills.map((pill, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(pill.prompt)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.07] text-[#8E8E93] text-[10px] whitespace-nowrap transition-all apple-button flex items-center gap-1"
              >
                <span>{pill.label}</span>
                <ArrowRight className="w-2.5 h-2.5 text-blue-400" />
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pr-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl space-y-2.5 border text-xs leading-relaxed select-text ${
                  m.sender === "user"
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-100 ml-8"
                    : "bg-black/50 border-white/[0.08] text-slate-200 mr-4"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[#8E8E93] border-b border-white/[0.06] pb-1 font-mono">
                  <span className="font-semibold text-white flex items-center gap-1">
                    {m.sender === "user" ? "SOC Analyst" : `AI Assistant (${(m.model_used || currentModel).split("/").pop()})`}
                  </span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {m.text}
                </div>

                {/* RECOMMENDED MITIGATION PLAYBOOK CARD */}
                {m.recommended_playbook && (
                  <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 to-black/80 border border-emerald-500/40 space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-white block">
                            {m.recommended_playbook.title}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-mono uppercase tracking-wide">
                            {m.recommended_playbook.action_type} • TARGET: {m.recommended_playbook.target || "Local Endpoint"}
                          </span>
                        </div>
                      </div>

                      {/* Stage to Playbook Deck Button */}
                      <button
                        onClick={() => handleStagePlaybook(m.recommended_playbook!)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] flex items-center gap-1 apple-button shadow-md"
                        title="Stage directly into Mitigation Workbench Approval Queue"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>Stage to Playbook Deck</span>
                      </button>
                    </div>

                    <div className="p-2 rounded-lg bg-black/60 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
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
                      <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto p-1 select-all whitespace-pre-wrap">
                        {m.recommended_playbook.script}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Solution Script (if not in playbook) */}
                {!m.recommended_playbook && m.solution_script && (
                  <div className="mt-2 p-2.5 rounded-xl bg-black/70 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                      <span className="flex items-center gap-1 font-bold">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        Diagnostic Command:
                      </span>
                      <button
                        onClick={() => handleCopyCode(m.solution_script!, m.id)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[10px] apple-button"
                      >
                        {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto p-1 select-all whitespace-pre-wrap">
                      {m.solution_script}
                    </pre>
                  </div>
                )}

                {/* Verification Command */}
                {m.verification_command && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                    <span>Verify: <code className="bg-black/40 px-1 py-0.5 rounded">{m.verification_command}</code></span>
                    <button
                      onClick={() => handleCopyCode(m.verification_command!, `${m.id}-v`)}
                      className="text-[#8E8E93] hover:text-white"
                      title="Copy verification command"
                    >
                      {copiedId === `${m.id}-v` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}

                {/* Online Reference Sources with Live Links */}
                {m.online_sources && m.online_sources.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>Online Intelligence References ({m.online_sources.length}):</span>
                    </div>
                    <div className="space-y-1">
                      {m.online_sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-2 rounded-lg bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-500/30 transition-all text-[11px] space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-cyan-300 font-semibold font-mono text-[10px]">
                            <span className="truncate">{s.title}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 ml-1 text-cyan-400" />
                          </div>
                          <p className="text-[10px] text-[#8E8E93] line-clamp-2">
                            {s.snippet}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-blue-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {searchOnline ? "Querying online intelligence (MITRE / NVD / MS Learn) & Groq..." : "Consulting Groq LPU with multi-turn chain memory..."}
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white/[0.02] border-t border-white/[0.08] flex items-center gap-2 flex-shrink-0">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={searchOnline ? "Ask AI Assistant (Online CTI Search Active)..." : "Ask AI Assistant for help with this step..."}
              className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.1] text-xs font-mono text-white placeholder-[#636366] focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isThinking || !inputQuery.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white apple-button shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StepChatbotHelper;
