import React, { useMemo } from "react";
import { 
  ShieldCheck, 
  Terminal, 
  Lock, 
  EyeOff, 
  Radio, 
  Flame, 
  AlertTriangle,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export interface MitreKillchainRibbonProps {
  threatCategory?: string;
  verdict?: "UNSAFE" | "VULNERABLE" | "SAFE" | "PENDING" | string;
  fileName?: string;
  reasons?: string[];
  cwe?: string;
  className?: string;
  compact?: boolean;
}

interface KillchainStage {
  id: string;
  name: string;
  shortName: string;
  tacticId: string;
  icon: React.ElementType;
  technique: string;
  techniqueId: string;
  description: string;
}

const KILLCHAIN_STAGES: KillchainStage[] = [
  {
    id: "initial_access",
    name: "Initial Access",
    shortName: "Access",
    tacticId: "TA0001",
    icon: ExternalLink,
    technique: "Exploit Public-Facing App / Phishing",
    techniqueId: "T1190",
    description: "Attacker vectors into the environment via web flaws or ingress services."
  },
  {
    id: "execution",
    name: "Execution",
    shortName: "Execute",
    tacticId: "TA0002",
    icon: Terminal,
    technique: "Command & Scripting Interpreter",
    techniqueId: "T1059",
    description: "Malicious adversary commands or shell payloads executed on host."
  },
  {
    id: "persistence",
    name: "Persistence",
    shortName: "Persist",
    tacticId: "TA0003",
    icon: Lock,
    technique: "Scheduled Task / Registry Autorun",
    techniqueId: "T1053",
    description: "Maintains foothold across system reboots and credential cycles."
  },
  {
    id: "defense_evasion",
    name: "Defense Evasion",
    shortName: "Evade",
    tacticId: "TA0005",
    icon: EyeOff,
    technique: "Inhibit System Recovery / Obfuscation",
    techniqueId: "T1490",
    description: "Deletes shadow copies, hides binaries, or encodes PowerShell payloads."
  },
  {
    id: "c2",
    name: "Command & Control",
    shortName: "C2",
    tacticId: "TA0011",
    icon: Radio,
    technique: "Application Layer Protocol / Egress",
    techniqueId: "T1071",
    description: "Beaconing communication with adversary external controller."
  },
  {
    id: "impact",
    name: "Impact",
    shortName: "Impact",
    tacticId: "TA0040",
    icon: Flame,
    technique: "Data Encrypted for Impact / Defacement",
    techniqueId: "T1486",
    description: "Ransomware encryption, disruption, or destruction of target data."
  }
];

export const MitreKillchainRibbon: React.FC<MitreKillchainRibbonProps> = ({
  threatCategory = "",
  verdict = "SAFE",
  fileName = "",
  reasons = [],
  cwe = "",
  className = "",
  compact = false
}) => {
  // Determine which killchain stages are triggered by the current artifact
  const activeStageIds = useMemo(() => {
    const active = new Set<string>();
    const textCorpus = [threatCategory, fileName, cwe, ...(reasons || [])].join(" ").toLowerCase();

    if (verdict === "SAFE") {
      return active; // None active for clean files
    }

    // Heuristics for killchain mapping
    if (textCorpus.includes("php") || textCorpus.includes("backdoor") || textCorpus.includes("webshell") || textCorpus.includes("sql") || textCorpus.includes("injection") || textCorpus.includes("rce") || textCorpus.includes("cwe-89") || textCorpus.includes("cwe-78")) {
      active.add("initial_access");
      active.add("execution");
    }

    if (textCorpus.includes("ps1") || textCorpus.includes("powershell") || textCorpus.includes("script") || textCorpus.includes("cmd") || textCorpus.includes("bash") || textCorpus.includes("exec") || textCorpus.includes("subprocess")) {
      active.add("execution");
    }

    if (textCorpus.includes("persist") || textCorpus.includes("registry") || textCorpus.includes("run") || textCorpus.includes("schtasks") || textCorpus.includes("autorun") || textCorpus.includes("startup")) {
      active.add("persistence");
    }

    if (textCorpus.includes("ransomware") || textCorpus.includes("vssadmin") || textCorpus.includes("shadow") || textCorpus.includes("delete") || textCorpus.includes("base64") || textCorpus.includes("encoded") || textCorpus.includes("obfuscated") || textCorpus.includes("trojan")) {
      active.add("defense_evasion");
    }

    if (textCorpus.includes("c2") || textCorpus.includes("beacon") || textCorpus.includes("reverse") || textCorpus.includes("socket") || textCorpus.includes("connect") || textCorpus.includes("backdoor") || textCorpus.includes("ip") || textCorpus.includes("http")) {
      active.add("c2");
    }

    if (textCorpus.includes("ransom") || textCorpus.includes("encrypt") || textCorpus.includes("lockbit") || textCorpus.includes("wipe") || textCorpus.includes("destroy") || textCorpus.includes("exfil")) {
      active.add("impact");
    }

    // Default fallback for any UNSAFE file if no specific stage caught
    if (active.size === 0 && (verdict === "UNSAFE" || verdict === "THREAT")) {
      active.add("execution");
      active.add("defense_evasion");
    }

    return active;
  }, [threatCategory, verdict, fileName, reasons, cwe]);

  const isThreat = verdict === "UNSAFE" || verdict === "THREAT" || verdict === "VULNERABLE";

  return (
    <div className={`p-3.5 rounded-2xl bg-[#090C14]/90 border border-white/[0.08] shadow-lg backdrop-blur-xl space-y-2.5 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-semibold text-white tracking-tight text-[11px] uppercase font-mono">
            MITRE ATT&CK Killchain Matrix
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#8E8E93] font-mono border border-white/[0.08]">
            v14.1
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          {isThreat ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              <span>{activeStageIds.size} Stage{activeStageIds.size === 1 ? "" : "s"} Flagged</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Baseline Clear</span>
            </span>
          )}
        </div>
      </div>

      {/* Killchain Ribbon Stages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-0.5">
        {KILLCHAIN_STAGES.map((stage, idx) => {
          const isActive = activeStageIds.has(stage.id);
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                isActive
                  ? "bg-gradient-to-b from-rose-500/20 to-red-950/30 border-rose-500/50 shadow-md shadow-rose-950/50 ring-1 ring-rose-500/30"
                  : "bg-white/[0.02] border-white/[0.05] opacity-60 hover:opacity-90"
              }`}
              title={`${stage.name} (${stage.tacticId}) - ${stage.technique} (${stage.techniqueId}): ${stage.description}`}
            >
              {/* Top Row: Icon + Stage Number */}
              <div className="flex items-center justify-between mb-1">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-rose-500 text-white shadow-sm" : "bg-white/[0.05] text-[#8E8E93]"
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono text-[#8E8E93]">
                  0{idx + 1}
                </span>
              </div>

              {/* Middle: Stage Name */}
              <div className="my-1">
                <div className={`font-semibold text-xs truncate ${isActive ? "text-white" : "text-slate-300"}`}>
                  {compact ? stage.shortName : stage.name}
                </div>
                <div className="text-[9px] font-mono text-[#8E8E93] truncate">
                  {stage.tacticId}
                </div>
              </div>

              {/* Bottom: Mapped Technique Badge */}
              <div className="pt-1 border-t border-white/[0.06]">
                {isActive ? (
                  <div className="text-[9px] font-mono font-semibold text-rose-300 truncate">
                    {stage.techniqueId}
                  </div>
                ) : (
                  <div className="text-[9px] font-mono text-[#636366] truncate">
                    Clear
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
