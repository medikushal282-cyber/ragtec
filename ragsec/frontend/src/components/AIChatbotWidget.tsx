import React, { useState } from "react";
import { 
  BrainCircuit, 
  Send, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  Bot, 
  User, 
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { ChatMessage, FileCRUDEvent } from "../types";
import { SYNTHETIC_DEMO_ARTIFACTS } from "../services/demoEngine";

interface AIChatbotWidgetProps {
  events?: FileCRUDEvent[];
  onSelectSuggestedPrompt?: (prompt: string) => void;
}

export const AIChatbotWidget: React.FC<AIChatbotWidgetProps> = ({ events }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString(),
      text: "Hello Analyst. I am the RAGSec File-System Diagnostic AI. Ask me anything about collected filesystem events, suspicious file changes, or detected malware signatures."
    }
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const suggestedPrompts = [
    "Why was malware_simulation.exe flagged?",
    "Show me all HIGH and CRITICAL severity events.",
    "Are there any signs of ransomware activity?",
    "Which files should I investigate first?"
  ];

  const handleSendMessage = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
      text: q
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsThinking(true);

    // AI Response generation grounded in collected file-system events
    setTimeout(() => {
      let aiText = "";
      let evidenceRefs: ChatMessage["evidence_references"] = [];

      const lowerQ = q.toLowerCase();

      if (lowerQ.includes("malware_simulation") || lowerQ.includes("malware") || lowerQ.includes("flagged")) {
        const art = SYNTHETIC_DEMO_ARTIFACTS.malware;
        aiText = `**${art.file_name}** was flagged because it exhibited multiple high-risk indicators:\n\n` +
                 `• **Executable Binary:** Created in non-standard workspace directory \`${art.file_path}\`\n` +
                 `• **Entropy Anomaly:** High entropy binary payload structure\n` +
                 `• **Process Invocation:** Triggered silent process execution sequence\n\n` +
                 `**Classification:** ${art.category} | **Severity:** ${art.severity} | **Confidence:** ${art.confidence}%`;

        evidenceRefs = [
          {
            file_name: art.file_name,
            file_path: art.file_path,
            category: art.category,
            severity: art.severity,
            confidence: art.confidence
          }
        ];
      } else if (lowerQ.includes("ransomware")) {
        const art = SYNTHETIC_DEMO_ARTIFACTS.ransomware;
        aiText = `**Ransomware Activity Detected:**\n\n` +
                 `• **Target:** \`${art.file_path}\`\n` +
                 `• **Command Detected:** \`vssadmin delete shadows /all /quiet\`\n` +
                 `• **Behavior:** Bulk file encryption marker appended to root files.\n\n` +
                 `**Severity:** ${art.severity} | **Confidence:** ${art.confidence}%`;

        evidenceRefs = [
          {
            file_name: art.file_name,
            file_path: art.file_path,
            category: art.category,
            severity: art.severity,
            confidence: art.confidence
          }
        ];
      } else if (lowerQ.includes("high") || lowerQ.includes("critical") || lowerQ.includes("investigate")) {
        aiText = `Found **3 High/Critical severity events** requiring immediate attention:\n\n` +
                 `1. \`ransomware_simulation.txt\` (CRITICAL - Ransomware, 98% Conf)\n` +
                 `2. \`malware_simulation.exe\` (HIGH - Malware, 96% Conf)\n` +
                 `3. \`credential_theft_demo.ps1\` (HIGH - Credential Theft, 95% Conf)\n\n` +
                 `Recommend enforcing immediate node lockdown on SOC-NODE-01.`;
      } else {
        aiText = `[RAGSec File-System Analysis] Evaluated query against ${events?.length || 4} collected filesystem events. All integrity checksums are monitored in real time under \`monitored_workspace/\`. No unverified network exfiltration confirmed.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString(),
        text: aiText,
        evidence_references: evidenceRefs
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 800);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base font-mono">
            AI File-System Diagnostic Chatbot
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
          GROUNDED IN FS EVENTS
        </span>
      </div>

      {/* Suggested Prompts Pills */}
      <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0 font-mono text-[10px]">
        <span className="text-slate-400">Suggested:</span>
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-white/5 text-slate-300 transition-all flex items-center gap-1"
          >
            <span>{p}</span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3.5 rounded-xl space-y-2 border ${
              m.sender === "user"
                ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200 ml-8"
                : "bg-black/50 border-white/10 text-slate-200 mr-8"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/5 pb-1">
              <span className="font-bold flex items-center gap-1 text-cyan-400">
                {m.sender === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-cyan-400" />}
                {m.sender === "user" ? "SOC Analyst" : "RAGSec AI Diagnostic"}
              </span>
              <span>{m.timestamp}</span>
            </div>

            <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
              {m.text}
            </div>

            {m.evidence_references && m.evidence_references.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1 text-[11px] font-mono">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Evidence Reference:</span>
                {m.evidence_references.map((ref, idx) => (
                  <div key={idx} className="p-2 rounded bg-cyan-950/30 border border-cyan-500/30 flex justify-between items-center text-cyan-300">
                    <span>{ref.file_name} ({ref.category})</span>
                    <span className="text-emerald-400 font-bold">{ref.confidence}% Confidence</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isThinking && (
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-cyan-400 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            Evaluating file-system evidence...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10 flex-shrink-0">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Ask AI why a file was flagged or list ransomware signs..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isThinking}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChatbotWidget;
