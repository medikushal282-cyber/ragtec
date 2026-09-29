import React from "react";
import { useSOC, DEMO_SCENARIOS } from "../context/SOCContext";
import { DemoStep } from "../types/soc";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Server,
  FileSearch,
  Radio,
  History,
  Lock,
  Zap,
  Sparkles
} from "lucide-react";

export const DemoControlCenter: React.FC = () => {
  const {
    demoModeActive,
    setDemoModeActive,
    currentDemoStep,
    setDemoStepIndex,
    nextDemoStep,
    prevDemoStep,
    resetDemo,
    navigateTo,
    incidents,
    events
  } = useSOC();

  const currentStep = DEMO_SCENARIOS[currentDemoStep - 1] || DEMO_SCENARIOS[0];

  const phaseColors: Record<string, string> = {
    TELEMETRY: "bg-blue-50 text-blue-700 border-blue-200",
    DETECTION: "bg-amber-50 text-amber-700 border-amber-200",
    ALERT: "bg-orange-50 text-orange-700 border-orange-200",
    INCIDENT: "bg-red-50 text-red-700 border-red-200",
    INVESTIGATION: "bg-purple-50 text-purple-700 border-purple-200",
    MITIGATION: "bg-emerald-50 text-emerald-700 border-emerald-200",
    AUDIT: "bg-slate-50 text-slate-700 border-slate-200"
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="modern-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">Scenario Controller</span>
            <span className="text-neutral-300">•</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Interactive 7-Step Lifecycle
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight">
            Adversary Campaign & Response Simulation
          </h2>
          <p className="text-xs text-[#475569] mt-1 max-w-2xl">
            Step through an authentic end-to-end incident lifecycle: from raw file creation telemetry, autonomous behavioral detection, alert correlation, grounded AI copilot triage, HITL containment, to immutable audit verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDemoModeActive(!demoModeActive)}
            className={`btn-primary-black ${demoModeActive ? "bg-black" : "bg-neutral-800"}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{demoModeActive ? "Exit Guided Demo" : "Start Guided Demo"}</span>
          </button>
        </div>
      </div>

      {/* Main Stepper Progress View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Step Details & Execution Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="modern-card p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-mono font-bold text-xs">
                  {currentDemoStep}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${phaseColors[currentStep?.phaseName] || "bg-neutral-50 text-black border-neutral-200"}`}>
                      Phase: {currentStep?.phaseName}
                    </span>
                    <span className="text-xs text-[#94A3B8]">Step {currentDemoStep} of {DEMO_SCENARIOS.length}</span>
                  </div>
                  <h3 className="text-lg font-bold text-black mt-0.5">{currentStep?.title}</h3>
                </div>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevDemoStep}
                  disabled={currentDemoStep <= 1}
                  className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-black text-xs font-semibold"
                >
                  Previous
                </button>
                <button
                  onClick={nextDemoStep}
                  disabled={currentDemoStep >= DEMO_SCENARIOS.length}
                  className="btn-primary-black py-2 px-4"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Description & Action Guide */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <h4 className="text-xs font-bold text-black uppercase tracking-wider mb-1 font-mono">
                  Scenario Context
                </h4>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {currentStep?.summary}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 mb-0.5 font-sans">
                    Recommended Analyst Action
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-sans">
                    {currentStep?.actionRequired}
                  </p>
                </div>
              </div>

              {/* Jump to Interactive Page Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => navigateTo(currentStep?.highlightTab, currentStep?.activeEntityId)}
                  className="btn-primary-black"
                >
                  <span>Open {currentStep?.highlightTab.toUpperCase()} Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={resetDemo}
                  className="text-xs font-mono text-[#64748B] hover:text-black flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Step 1</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="modern-card p-4 space-y-1">
              <span className="text-[10px] font-mono text-[#64748B] uppercase">Current State</span>
              <div className="font-bold text-sm text-black">{currentStep?.phaseName}</div>
              <div className="text-[11px] text-emerald-600 font-medium">Ready for analyst review</div>
            </div>
            <div className="modern-card p-4 space-y-1">
              <span className="text-[10px] font-mono text-[#64748B] uppercase">Active Target</span>
              <div className="font-bold text-sm font-mono text-black">WS-ANALYST-104</div>
              <div className="text-[11px] text-rose-600 font-medium">Monitored Endpoint</div>
            </div>
            <div className="modern-card p-4 space-y-1">
              <span className="text-[10px] font-mono text-[#64748B] uppercase">AI Copilot Guard</span>
              <div className="font-bold text-sm text-black">IEEE Gated (100%)</div>
              <div className="text-[11px] text-blue-600 font-medium">Zero Hallucination</div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Complete Timeline */}
        <div className="modern-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-bold text-sm text-black">Campaign Timeline</h3>
            <span className="text-xs font-mono text-[#64748B]">{currentDemoStep}/{DEMO_SCENARIOS.length}</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {DEMO_SCENARIOS.map((step: DemoStep, idx: number) => {
              const isCurrent = step.stepIndex === currentDemoStep;
              const isPast = step.stepIndex < currentDemoStep;

              return (
                <div
                  key={step.stepIndex}
                  onClick={() => setDemoStepIndex(step.stepIndex)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-black text-white border-black shadow-sm"
                      : isPast
                      ? "bg-neutral-50 text-[#475569] border-neutral-200 hover:bg-neutral-100"
                      : "bg-white text-[#94A3B8] border-neutral-100 hover:border-neutral-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold">
                      0{step.stepIndex}. {step.phaseName}
                    </span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                  </div>
                  <div className={`text-xs font-semibold truncate ${isCurrent ? "text-white" : "text-black"}`}>
                    {step.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DemoControlCenter;
