import React from "react";
import { useSOC, DEMO_SCENARIOS } from "../context/SOCContext";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  Check,
  Play
} from "lucide-react";

export const DemoControlBar: React.FC = () => {
  const {
    demoModeActive,
    setDemoModeActive,
    currentDemoStep,
    nextDemoStep,
    prevDemoStep,
    setDemoStepIndex,
    resetDemo,
    currentDemoInfo
  } = useSOC();

  if (!demoModeActive) {
    return (
      <div className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-6 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-[#64748B]">
          <span className="font-semibold text-black">Live Operational SOC Mode</span>
          <span>•</span>
          <span>Direct real-time endpoint binding active.</span>
        </div>
        <button
          onClick={() => setDemoModeActive(true)}
          className="px-3 py-1 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          Start Guided Scenario
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-6 py-3">
      {/* 7-Phase Workflow Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono py-0.5">
          {DEMO_SCENARIOS.map((step, idx) => {
            const isCurrent = step.stepIndex === currentDemoStep;
            const isCompleted = step.stepIndex < currentDemoStep;

            return (
              <React.Fragment key={step.stepIndex}>
                <button
                  onClick={() => setDemoStepIndex(step.stepIndex)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all text-xs ${
                    isCurrent
                      ? "bg-black text-white font-bold shadow-sm"
                      : isCompleted
                      ? "bg-neutral-100 text-black border border-neutral-300 hover:bg-neutral-200"
                      : "bg-[#F8F9FA] text-[#94A3B8] border border-[#E5E7EB] hover:text-black"
                  }`}
                >
                  {isCompleted ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-black text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                      isCurrent ? "bg-white text-black font-bold" : "bg-neutral-200 text-[#64748B]"
                    }`}>
                      {step.stepIndex}
                    </span>
                  )}
                  <span className="font-sans font-medium">{step.phaseName}</span>
                </button>
                {idx < DEMO_SCENARIOS.length - 1 && (
                  <span className="text-[#CBD5E1] text-[10px]">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={prevDemoStep}
            disabled={currentDemoStep === 1}
            className="p-1.5 rounded-lg bg-[#F8F9FA] hover:bg-neutral-100 text-black disabled:opacity-30 border border-[#E5E7EB]"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-black font-bold px-1 text-xs">
            Step {currentDemoStep} of {DEMO_SCENARIOS.length}
          </span>

          <button
            onClick={nextDemoStep}
            disabled={currentDemoStep === DEMO_SCENARIOS.length}
            className="px-4 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-30"
          >
            <span>Next Phase</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={resetDemo}
            className="p-1.5 rounded-lg bg-[#F8F9FA] hover:bg-neutral-100 text-[#64748B] hover:text-black border border-[#E5E7EB]"
            title="Reset Scenario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDemoModeActive(false)}
            className="text-[11px] text-[#94A3B8] hover:text-black px-1.5"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Active Phase Briefing Box with subtle dot grid background */}
      <div className="flex items-center justify-between bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2.5 rounded-xl text-xs font-mono">
        <div className="flex items-center gap-3 text-black truncate">
          <span className="px-2 py-0.5 rounded bg-black text-white font-bold text-[10px] tracking-wider uppercase">
            {currentDemoInfo.phaseName}
          </span>
          <span className="font-serif font-bold text-sm text-black truncate">{currentDemoInfo.title}:</span>
          <span className="text-[#475569] font-sans truncate hidden md:inline">{currentDemoInfo.summary}</span>
        </div>

        <div className="flex items-center gap-1.5 text-black font-semibold text-xs whitespace-nowrap pl-4">
          <span className="font-serif italic text-[#64748B]">Action:</span>
          <span>{currentDemoInfo.actionRequired}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </div>
  );
};
export default DemoControlBar;
