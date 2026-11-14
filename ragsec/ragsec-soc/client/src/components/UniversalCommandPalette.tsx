import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Sparkles, 
  X, 
  ArrowRight, 
  ShieldAlert, 
  FileSearch, 
  Bot, 
  Zap, 
  BookOpen, 
  Cpu, 
  Server, 
  LayoutDashboard, 
  Lock, 
  Download, 
  User, 
  Terminal,
  Activity,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Flame,
  ShieldAlert,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UniversalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onScanWorkspace: () => void;
  onExportAudit: () => void;
  onOpenBrainModal: () => void;
  onOpenUserModal: () => void;
  activeModel: string;
  onSearchCTI: (query: string) => void;
  onTriggerScenario?: (scenarioKey: string) => void;
  onOpenExecutiveBrief?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Navigation" | "SOC Actions" | "Security Enclave" | "Threat Intelligence" | "Demo Scenarios";
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  shortcut?: string;
  action: () => void;
}

export const UniversalCommandPalette: React.FC<UniversalCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onScanWorkspace,
  onExportAudit,
  onOpenBrainModal,
  onOpenUserModal,
  activeModel,
  onSearchCTI
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent
          const event = new CustomEvent("open-command-palette");
          window.dispatchEvent(event);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Command items definitions
  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Dashboard & SOC Overview",
      subtitle: "Real-time FIM telemetry, Active Threat Index, and CRUD event stream",
      category: "Navigation",
      icon: LayoutDashboard,
      shortcut: "G D",
      action: () => {
        onNavigate("dashboard");
        onClose();
      }
    },
    {
      id: "nav-fleet",
      title: "Fleet SIEM & Remote Laptops",
      subtitle: "Inspect enterprise mesh, isolated endpoints, and connected laptops",
      category: "Navigation",
      icon: Server,
      badge: "Fleet Mesh",
      shortcut: "G F",
      action: () => {
        onNavigate("fleet");
        onClose();
      }
    },
    {
      id: "nav-scanner",
      title: "AI Threat Scanner & File Explorer",
      subtitle: "Multi-factor entropy analysis, SAST AST matching, and sandbox quarantine",
      category: "Navigation",
      icon: FileSearch,
      shortcut: "G S",
      action: () => {
        onNavigate("file_scanner");
        onClose();
      }
    },
    {
      id: "nav-copilot",
      title: "AI Copilot Chat Workbench",
      subtitle: "Multi-turn incident investigation, LPU triage, and query grounding",
      category: "Navigation",
      icon: Bot,
      badge: activeModel.split("/").pop(),
      shortcut: "G C",
      action: () => {
        onNavigate("ai_chat");
        onClose();
      }
    },
    {
      id: "nav-mitigation",
      title: "Automated Mitigation Engine",
      subtitle: "Generate dynamic containment scripts, isolation playbooks, and patches",
      category: "Navigation",
      icon: Zap,
      shortcut: "G M",
      action: () => {
        onNavigate("mitigation");
        onClose();
      }
    },
    {
      id: "nav-knowledge",
      title: "Threat Intelligence & Knowledge Base",
      subtitle: "Semantic CTI retrieval, MITRE ATT&CK techniques, and playbooks",
      category: "Navigation",
      icon: BookOpen,
      action: () => {
        onNavigate("knowledge");
        onClose();
      }
    },

    // Actions
    {
      id: "act-scan",
      title: "Scan Workspace Directory",
      subtitle: "Trigger real-time FIM filesystem crawler with dynamic ETA progress",
      category: "SOC Actions",
      icon: RefreshCw,
      badge: "Real-time",
      action: () => {
        onScanWorkspace();
        onClose();
      }
    },
    {
      id: "act-export",
      title: "Export SOC Executive Audit Report",
      subtitle: "Download signed Markdown audit report with threat indices & vault inventory",
      category: "SOC Actions",
      icon: Download,
      badge: "Report",
      action: () => {
        onExportAudit();
        onClose();
      }
    },
    {
      id: "act-brain",
      title: "Configure AI Brain & Groq LPU Key",
      subtitle: `Current active: ${activeModel.split("/").pop()} • Switch to 120B/20B/Qwen models`,
      category: "SOC Actions",
      icon: Cpu,
      badge: "Groq LPU",
      action: () => {
        onOpenBrainModal();
        onClose();
      }
    },
    {
      id: "act-user",
      title: "Operator Identity & Access Profile",
      subtitle: "Switch between SecOps Admin, Tier-2 Analyst, or Auditor profiles",
      category: "SOC Actions",
      icon: User,
      action: () => {
        onOpenUserModal();
        onClose();
      }
    },
    {
      id: "act-quarantine",
      title: "View Isolated Quarantine Vault",
      subtitle: "Inspect cryptographically contained binaries in the .quarantine enclave",
      category: "Security Enclave",
      icon: Lock,
      badge: "Isolated",
      action: () => {
        onNavigate("file_scanner");
        onClose();
      }
    },
    {
      id: "act-exec-brief",
      title: "Generate Executive Incident Debrief",
      subtitle: "Compile active incidents, quarantined artifacts & audit status into a briefing report",
      category: "SOC Actions",
      icon: FileText,
      badge: "Briefing",
      shortcut: "G B",
      action: () => {
        onOpenExecutiveBrief?.();
        onClose();
      }
    },

    // Demo & Presentation Presets
    {
      id: "demo-lockbit",
      title: "Demo Scenario: LockBit 3.0 Ransomware Attack",
      subtitle: "Simulate shadow copy deletion (T1490), vssadmin tampering & critical alert",
      category: "Demo Scenarios",
      icon: Flame,
      badge: "CRITICAL",
      action: () => {
        onTriggerScenario?.("ransomware");
        onClose();
      }
    },
    {
      id: "demo-backdoor",
      title: "Demo Scenario: Web Backdoor & Reverse Shell",
      subtitle: "Inject web backdoor payload and trigger CTI file & process RAG comparison",
      category: "Demo Scenarios",
      icon: ShieldAlert,
      badge: "HIGH",
      action: () => {
        onTriggerScenario?.("backdoor");
        onClose();
      }
    },
    {
      id: "demo-mimikatz",
      title: "Demo Scenario: Mimikatz Credential Dumping",
      subtitle: "Simulate encoded PowerShell credential extraction on fleet endpoint",
      category: "Demo Scenarios",
      icon: Terminal,
      badge: "HIGH",
      action: () => {
        onTriggerScenario?.("credential");
        onClose();
      }
    },
    {
      id: "demo-baseline",
      title: "Demo Scenario: Reset to Clean Baseline",
      subtitle: "Purge temporary test files and restore monitored workspace to nominal state",
      category: "Demo Scenarios",
      icon: ShieldCheck,
      badge: "CLEAN",
      action: () => {
        onTriggerScenario?.("baseline");
        onClose();
      }
    }
  ];

  // Filter commands by search query
  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.badge && cmd.badge.toLowerCase().includes(q))
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      } else if (query.trim()) {
        // Fallback: Trigger CTI Search
        onSearchCTI(query.trim());
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/65 backdrop-blur-md transition-all">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-2xl rounded-2xl bg-[#0B0E17]/95 border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] backdrop-blur-2xl"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, jump to a view, or query CTI..."
            className="w-full bg-transparent text-white placeholder-[#636366] text-sm focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#8E8E93] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
              <span>ESC to exit</span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1 no-scrollbar">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-blue-600/20 text-white border border-blue-500/30 shadow-sm"
                      : "text-[#8E8E93] hover:text-white hover:bg-white/[0.035] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? "bg-blue-500/25 text-blue-300" : "bg-white/[0.05] text-[#8E8E93]"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate ${isSelected ? "text-white" : "text-slate-200"}`}>
                          {cmd.title}
                        </span>
                        {cmd.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                            isSelected
                              ? "bg-blue-500/30 text-blue-200 border border-blue-400/30"
                              : "bg-white/[0.05] text-[#8E8E93]"
                          }`}>
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cmd.shortcut && (
                      <span className="text-[10px] font-mono text-[#636366] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                        {cmd.shortcut}
                      </span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-blue-400 translate-x-0.5" : "text-[#636366]"}`} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 px-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 mx-auto flex items-center justify-center text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white text-xs font-medium">No direct command match for &ldquo;{query}&rdquo;</p>
                <p className="text-[#8E8E93] text-[11px] mt-0.5">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-[10px] text-white">Enter</kbd> to execute deep Threat Intelligence Grounding (CTI RAG) on this query.
                </p>
              </div>
              <button
                onClick={() => {
                  onSearchCTI(query.trim());
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md transition-all apple-button"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Search CTI Grounding for &ldquo;{query}&rdquo;</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.015] flex items-center justify-between text-[11px] text-[#8E8E93]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] font-mono text-[9px] text-slate-300">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono text-[9px] text-slate-300">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] font-mono text-[9px] text-slate-300">ESC</kbd> Close
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-slate-400">RAGSec Core Online</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
