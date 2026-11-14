import React, { useState, useEffect, useRef } from "react";
import { Clock, Activity, Sparkles, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProgressStage {
  label: string;
  targetPercent: number;
}

export interface RealtimeETAProgressBarProps {
  /** Title of the running operation */
  title: string;
  /** Optional subtitle or active item (e.g., filename or IP address) */
  subtitle?: string;
  /** Whether the operation is currently running */
  isActive: boolean;
  /** Deterministic progress percent (0 - 100). If omitted, auto-estimates based on estimatedDurationMs */
  progressPercent?: number;
  /** Total estimated duration in milliseconds if progressPercent is not fully deterministic */
  estimatedDurationMs?: number;
  /** Current item index for batch workloads (e.g., file 7 of 30) */
  currentStep?: number;
  /** Total items count for batch workloads */
  totalSteps?: number;
  /** Optional stages to step through (e.g., Handshake -> Tunnel -> Sync) */
  stages?: ProgressStage[];
  /** Optional callback to abort / cancel */
  onCancel?: () => void;
  /** Visual variant: inline panel, floating top toast, or minimal */
  variant?: "panel" | "floating" | "minimal" | "card";
  /** Optional custom accent color ('blue' | 'amber' | 'emerald' | 'purple') */
  accentColor?: "blue" | "amber" | "emerald" | "purple";
  /** Optional callback when 100% is reached */
  onComplete?: () => void;
}

export const RealtimeETAProgressBar: React.FC<RealtimeETAProgressBarProps> = ({
  title,
  subtitle,
  isActive,
  progressPercent: externalPercent,
  estimatedDurationMs = 4000,
  currentStep,
  totalSteps,
  stages = [],
  onCancel,
  variant = "panel",
  accentColor = "blue",
  onComplete
}) => {
  const [internalPercent, setInternalPercent] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [currentStageLabel, setCurrentStageLabel] = useState<string>("");
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  // Reset when operation starts
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      setInternalPercent(externalPercent !== undefined ? externalPercent : 0);
      setElapsedSeconds(0);
      const initialEta = Math.max(0.5, estimatedDurationMs / 1000);
      setEtaSeconds(initialEta);
    } else {
      setInternalPercent(0);
      setElapsedSeconds(0);
      setEtaSeconds(null);
    }
  }, [isActive]);

  // High-frequency clock to compute real-time ETA, elapsed time, and stages
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = 80; // 80ms resolution for ultra-smooth real-time updates
    timerRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSec = elapsedMs / 1000;
      setElapsedSeconds(elapsedSec);

      let effectivePercent = 0;

      if (externalPercent !== undefined) {
        // Deterministic progress passed from parent
        effectivePercent = Math.min(100, Math.max(0, externalPercent));
        setInternalPercent(effectivePercent);

        if (totalSteps && currentStep !== undefined && currentStep > 0) {
          const rate = currentStep / Math.max(0.2, elapsedSec); // items per second
          const remainingItems = totalSteps - currentStep;
          const calculatedEta = remainingItems > 0 ? remainingItems / rate : 0;
          setEtaSeconds(Math.max(0, parseFloat(calculatedEta.toFixed(1))));
        } else if (effectivePercent > 0 && effectivePercent < 100) {
          const totalEstimatedSec = elapsedSec / (effectivePercent / 100);
          const remainingSec = Math.max(0, totalEstimatedSec - elapsedSec);
          setEtaSeconds(parseFloat(remainingSec.toFixed(1)));
        } else if (effectivePercent >= 100) {
          setEtaSeconds(0);
        }
      } else {
        // Auto-interpolating progress using asymptotic easing towards 96%
        const estSec = estimatedDurationMs / 1000;
        const ratio = elapsedMs / estimatedDurationMs;
        if (ratio < 1) {
          // Smooth ease-out cubic
          const eased = 1 - Math.pow(1 - ratio, 2.5);
          effectivePercent = Math.min(94, Math.round(eased * 94));
        } else {
          // Asymptote slowly towards 98% while waiting for async resolution
          const overRatio = (elapsedMs - estimatedDurationMs) / 3000;
          effectivePercent = Math.min(98, Math.round(94 + Math.min(4, overRatio * 4)));
        }
        setInternalPercent(effectivePercent);

        const remainingSec = Math.max(0.1, estSec - elapsedSec);
        setEtaSeconds(parseFloat(remainingSec.toFixed(1)));
      }

      // Determine active stage from stages array
      if (stages.length > 0) {
        let matching = stages[0].label;
        for (const st of stages) {
          if (effectivePercent >= st.targetPercent) {
            matching = st.label;
          }
        }
        setCurrentStageLabel(matching);
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, externalPercent, estimatedDurationMs, currentStep, totalSteps, stages]);

  if (!isActive) return null;

  // Format ETA string
  const formatETA = () => {
    if (internalPercent >= 100) return "Complete!";
    if (etaSeconds === null || isNaN(etaSeconds)) return "Calculating ETA...";
    if (etaSeconds <= 0.3) return "Finalizing payload...";
    if (etaSeconds < 60) return `~${etaSeconds.toFixed(1)}s remaining`;
    const mins = Math.floor(etaSeconds / 60);
    const secs = Math.round(etaSeconds % 60);
    return `~${mins}m ${secs}s remaining`;
  };

  // Accent styling mappings
  const colorMap = {
    blue: {
      bar: "from-blue-500 via-indigo-500 to-cyan-400",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
      badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      text: "text-blue-400"
    },
    amber: {
      bar: "from-amber-500 via-orange-500 to-yellow-400",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      text: "text-amber-400"
    },
    emerald: {
      bar: "from-emerald-500 via-teal-500 to-cyan-400",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      text: "text-emerald-400"
    },
    purple: {
      bar: "from-purple-500 via-violet-500 to-fuchsia-400",
      glow: "shadow-[0_0_15px_rgba(168,85,247,0.5)]",
      badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      text: "text-purple-400"
    }
  };

  const styling = colorMap[accentColor] || colorMap.blue;

  // Render minimal bar
  if (variant === "minimal") {
    return (
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Activity className={`w-3 h-3 ${styling.text} animate-pulse`} />
            <span className="truncate max-w-[200px]">{currentStageLabel || title}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-slate-400">{formatETA()}</span>
            <span className={`${styling.text} font-bold`}>{Math.round(internalPercent)}%</span>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden relative">
          <div
            className={`h-full bg-gradient-to-r ${styling.bar} transition-all duration-100 ease-out`}
            style={{ width: `${internalPercent}%` }}
          />
        </div>
      </div>
    );
  }

  // Render floating top toast/banner
  if (variant === "floating") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92vw] p-4 rounded-2xl bg-[#0D111E]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-2.5 text-xs select-none"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Activity className={`w-4 h-4 ${styling.text} animate-pulse`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-xs truncate">{title}</span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] border ${styling.badge}`}>
                  ETA {formatETA()}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                {currentStageLabel || subtitle || `Elapsed: ${elapsedSeconds.toFixed(1)}s`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-white">
              {Math.round(internalPercent)}%
            </span>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                title="Cancel operation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden relative">
          <div
            className={`h-full bg-gradient-to-r ${styling.bar} ${styling.glow} transition-all duration-100 ease-out relative`}
            style={{ width: `${internalPercent}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Render full panel variant (e.g. inside AI Threat Scanner or Fleet View)
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="apple-panel p-4 border border-white/[0.1] bg-white/[0.02] space-y-2.5 rounded-2xl relative overflow-hidden"
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <Activity className={`w-3.5 h-3.5 ${styling.text} animate-pulse`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-xs truncate">{title}</span>
              {currentStep !== undefined && totalSteps !== undefined && (
                <span className="text-[10px] text-slate-400 font-mono">
                  ({currentStep}/{totalSteps})
                </span>
              )}
            </div>
            {subtitle && (
              <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5 max-w-md">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* ETA & Elapsed Telemetry Badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-300">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">ETA:</span>
            <span className="text-white font-semibold">{formatETA()}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-white/[0.02] border border-white/[0.05] text-slate-400">
            <span>Elapsed:</span>
            <span className="text-slate-200">{elapsedSeconds.toFixed(1)}s</span>
          </div>

          <span className="text-xs font-bold font-mono text-white px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.08]">
            {Math.round(internalPercent)}%
          </span>

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] font-medium transition-all"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Real-time Stage Ticker */}
      {currentStageLabel && (
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-300">{currentStageLabel}</span>
          </div>
          {stages.length > 0 && (
            <div className="hidden md:flex items-center gap-1 text-[9px] font-mono text-slate-500">
              {stages.map((st, idx) => {
                const isPassed = internalPercent >= st.targetPercent;
                return (
                  <span
                    key={st.label}
                    className={`px-1.5 py-0.2 rounded ${
                      isPassed ? "text-slate-200 bg-white/[0.08]" : "text-slate-600"
                    }`}
                  >
                    {idx + 1}. {st.label.split(":")[0]}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Glowing Pearlescent Loading Bar */}
      <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden relative p-[1px]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${styling.bar} ${styling.glow} transition-all duration-100 ease-out relative`}
          style={{ width: `${internalPercent}%` }}
        >
          {/* Animated shine overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.35)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    </motion.div>
  );
};

export default RealtimeETAProgressBar;
