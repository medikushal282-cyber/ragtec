import React from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Square, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert,
  Flame,
  Zap,
  Sliders
} from "lucide-react";

interface DemoControlPanelProps {
  demoActive: boolean;
  onToggleDemoMode: () => void;
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  onRunFullDemo: () => void;
  onPauseDemo: () => void;
  onRestartDemo: () => void;
  onNextStep: () => void;
  onStopDemo: () => void;
  onTriggerScenario: (scenarioKey: string) => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({
  demoActive,
  onToggleDemoMode,
  isRunning,
  isPaused,
  currentStep,
  onRunFullDemo,
  onPauseDemo,
  onRestartDemo,
  onNextStep,
  onStopDemo,
  onTriggerScenario
}) => {
  const scenarios = [
    { key: "benign", label: "Normal File", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    { key: "malware", label: "Malware", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    { key: "ransomware", label: "Ransomware", color: "bg-rose-600/30 text-rose-200 border-rose-500/50 font-bold" },
    { key: "trojan", label: "Trojan", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    { key: "script", label: "Suspicious Script", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    { key: "credential", label: "Credential Theft", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    { key: "persistence", label: "Persistence", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    { key: "unknown", label: "Unknown Result", color: "bg-white/10 text-slate-300 border-white/10" }
  ];

  return (
    <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-cyan-500 space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm font-mono tracking-wide">P8 SCRIPTED DEMO MODE ENGINE</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
            HACKATHON / PRESENTATION READY
          </span>
        </div>

        {/* Master Demo Mode Toggle */}
        <button
          onClick={onToggleDemoMode}
          className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            demoActive
              ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-md shadow-cyan-500/20"
              : "bg-white/5 text-slate-400 border border-white/10 hover:text-white"
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${demoActive ? "bg-cyan-400 pulse-dot" : "bg-slate-500"}`} />
          {demoActive ? "DEMO MODE: ACTIVE" : "ENABLE DEMO MODE"}
        </button>
      </div>

      {demoActive && (
        <div className="space-y-3 pt-1 border-t border-white/10">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onRunFullDemo}
                disabled={isRunning && !isPaused}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md ${
                  isRunning && !isPaused
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                {isRunning ? "Running Scripted Demo..." : "Run Full 10-Step Demo"}
              </button>

              <button
                onClick={onPauseDemo}
                disabled={!isRunning}
                className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition-all disabled:opacity-40"
              >
                <Pause className="w-3.5 h-3.5" />
                {isPaused ? "Resume" : "Pause"}
              </button>

              <button
                onClick={onNextStep}
                disabled={!isRunning}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-white/20 transition-all disabled:opacity-40"
              >
                <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
                Next Step
              </button>

              <button
                onClick={onRestartDemo}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-mono flex items-center gap-1.5 hover:border-cyan-500/30 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                Restart
              </button>

              <button
                onClick={onStopDemo}
                disabled={!isRunning}
                className="px-3 py-2 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-center gap-1.5 hover:bg-rose-600/50 transition-all disabled:opacity-40"
              >
                <Square className="w-3.5 h-3.5" />
                Stop
              </button>
            </div>

            {/* Step Indicator */}
            {isRunning && (
              <div className="text-xs font-mono text-cyan-300 flex items-center gap-2">
                <span className="text-slate-400">Step {currentStep}/10:</span>
                <span className="font-bold text-white px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">
                  {currentStep === 1 ? "Creating malware_simulation.exe" :
                   currentStep === 2 ? "FIM Watcher CRUD Detection" :
                   currentStep === 3 ? "Running AI Static Analysis" :
                   currentStep === 4 ? "Threat Classification Matrix" :
                   currentStep === 5 ? "Evidence Extraction" :
                   currentStep === 6 ? "Auto-Opening Code Explorer" :
                   currentStep === 7 ? "Chatbot Suggestion Prompt" :
                   currentStep === 8 ? "Chatbot Evidence Investigation" :
                   currentStep === 9 ? "Triggering Ransomware Event" :
                   "Taxonomy Dashboard Update Complete"}
                </span>
              </div>
            )}
          </div>

          {/* Quick Scenario Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
            <span className="text-[11px] text-slate-400">Trigger Scenario:</span>
            {scenarios.map((sc) => (
              <button
                key={sc.key}
                onClick={() => onTriggerScenario(sc.key)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all hover:scale-105 ${sc.color}`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoControlPanel;
