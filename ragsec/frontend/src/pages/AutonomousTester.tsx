import React, { useState } from "react";
import { ragsecApi } from "../services/api";
import { P8TestRunConfig, P8TestType, BrowserTarget, P8AgentActivityStep, P8TestReport } from "../types";
import { 
  Bot, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Globe, 
  Sliders, 
  CheckSquare, 
  Square as UncheckedSquare, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  RefreshCw,
  Layers,
  FileCode2,
  Gauge
} from "lucide-react";

interface AutonomousTesterProps {
  onRunCompleted?: (report: P8TestReport) => void;
}

export const AutonomousTester: React.FC<AutonomousTesterProps> = ({ onRunCompleted }) => {
  // Config state
  const [targetUrl, setTargetUrl] = useState("http://localhost:3000");
  const [targetName, setTargetName] = useState("RAGSec Enterprise Web Portal");
  const [scope, setScope] = useState<P8TestRunConfig["scope"]>("domain_only");
  
  const [selectedTypes, setSelectedTypes] = useState<P8TestType[]>([
    "functional",
    "ui_ux",
    "accessibility",
    "navigation",
    "form_input",
    "responsive"
  ]);

  const [browser, setBrowser] = useState<BrowserTarget>("chromium");
  const [customInstructions, setCustomInstructions] = useState(
    "Explore auth login flow, test invalid credentials, check for unhandled exceptions, and verify WCAG 2.1 AA color contrast compliance."
  );
  
  const [autoExploration, setAutoExploration] = useState(true);
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxBudget, setMaxBudget] = useState(50);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [agentSteps, setAgentSteps] = useState<P8AgentActivityStep[]>([]);
  const [latestReport, setLatestReport] = useState<P8TestReport | null>(null);

  const testTypeInfo: Record<P8TestType, { label: string; desc: string; icon: string }> = {
    functional: { label: "Functional Testing", desc: "Validate UI controls, buttons, links, and state transitions", icon: "⚡" },
    ui_ux: { label: "UI/UX Testing", desc: "Check visual alignment, layout consistency, and interactive feedback", icon: "🎨" },
    accessibility: { label: "Accessibility (WCAG)", desc: "Audit WCAG 2.1 AA screen reader labels, aria roles, and color contrast", icon: "♿" },
    navigation: { label: "Navigation & User-Flow", desc: "Explore multi-page router paths, deep links, and redirect boundaries", icon: "🧭" },
    form_input: { label: "Form & Input Testing", desc: "Test boundary inputs, XSS payload injections, and validation errors", icon: "📝" },
    responsive: { label: "Mobile & Responsive", desc: "Simulate mobile and tablet viewports to check overflow & breakpoints", icon: "📱" }
  };

  const deviceOptions: { id: BrowserTarget; label: string; icon: any; viewport: string }[] = [
    { id: "chromium", label: "Chrome Desktop", icon: Laptop, viewport: "1920x1080" },
    { id: "firefox", label: "Firefox Desktop", icon: Laptop, viewport: "1920x1080" },
    { id: "webkit", label: "Safari Desktop", icon: Laptop, viewport: "1440x900" },
    { id: "mobile_ios", label: "iPhone 15 Pro", icon: Smartphone, viewport: "393x852" },
    { id: "mobile_android", label: "Pixel 8 Pro", icon: Smartphone, viewport: "412x915" },
    { id: "tablet", label: "iPad Air", icon: Tablet, viewport: "820x1180" }
  ];

  const toggleTestType = (type: P8TestType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleStartTest = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setAgentSteps([]);
    setLatestReport(null);

    const config: P8TestRunConfig = {
      target_url: targetUrl,
      target_name: targetName,
      scope,
      test_types: selectedTypes,
      browser,
      custom_instructions: customInstructions,
      autonomous_exploration: autoExploration,
      max_crawl_depth: maxDepth,
      max_action_budget: maxBudget
    };

    try {
      const report = await ragsecApi.startP8TestRun(config);
      setLatestReport(report);
      setAgentSteps(report.agent_steps);
      if (onRunCompleted) onRunCompleted(report);
    } catch (err) {
      console.error("Test execution error", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            P8 Autonomous Web Agent & QA Execution Core
          </h3>
          <p className="text-xs text-slate-400">
            Autonomous web app exploration, functional QA, accessibility compliance, and bug detection
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartTest}
            disabled={isRunning}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
              isRunning
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20"
            }`}
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> : <Play className="w-4 h-4 fill-white" />}
            {isRunning ? "Agent Executing Test Run..." : "Start Autonomous Test"}
          </button>

          {isRunning && (
            <>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition-all"
              >
                <Pause className="w-4 h-4" />
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={() => setIsRunning(false)}
                className="px-3.5 py-2.5 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-rose-600/50 transition-all"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}

          {!isRunning && latestReport && (
            <button
              onClick={handleStartTest}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Re-run Test
            </button>
          )}
        </div>
      </div>

      {/* Target & Scope Definition Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2 border-b border-white/10 pb-3">
          <Globe className="w-4 h-4 text-cyan-400" />
          Target Web Application & Scope
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-slate-300 mb-1">Target Application Base URL</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="e.g. http://localhost:3000"
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Application Name</label>
            <input
              type="text"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder="e.g. Enterprise Portal"
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-1">
          <span className="text-xs font-mono text-slate-400">Crawl Scope:</span>
          {(["domain_only", "subdomains", "single_path"] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === s}
                onChange={() => setScope(s)}
                className="accent-cyan-400"
              />
              <span className="capitalize">{s.replace("_", " ")}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Test Configuration Matrix (6 Types) */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Test Type Matrix Selection
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
            {selectedTypes.length} OF 6 ENABLED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(testTypeInfo) as P8TestType[]).map((key) => {
            const info = testTypeInfo[key];
            const isSelected = selectedTypes.includes(key);
            return (
              <div
                key={key}
                onClick={() => toggleTestType(key)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-cyan-950/30 border-cyan-500/50 text-white shadow-md shadow-cyan-500/10"
                    : "bg-white/5 border-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </div>
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <UncheckedSquare className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{info.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device & Custom Instructions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Selection */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2 border-b border-white/10 pb-3">
            <Laptop className="w-4 h-4 text-cyan-400" />
            Browser Engine & Device Viewport Target
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {deviceOptions.map((dev) => {
              const Icon = dev.icon;
              const isSelected = browser === dev.id;
              return (
                <button
                  key={dev.id}
                  onClick={() => setBrowser(dev.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-md"
                      : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-white mb-1">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span>{dev.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Viewport: {dev.viewport}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Goals & Instructions Prompt */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2 border-b border-white/10 pb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Custom Testing Goals & Instructions
          </h4>

          <div>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={4}
              placeholder="Provide specific autonomous agent instructions, target paths, or login credentials..."
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Autonomous Exploration Sliders */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Max Crawl Depth:</span>
                <span className="text-cyan-400 font-bold">{maxDepth} levels</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Action Budget:</span>
                <span className="text-cyan-400 font-bold">{maxBudget} actions</span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Agent Activity Log Console */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h4 className="font-bold text-white text-base font-mono">Autonomous Agent Execution Stream</h4>
          </div>
          {isRunning && (
            <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 pulse-dot" />
              LIVE AGENT ACTIVE
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-slate-300 space-y-2 h-64 overflow-y-auto">
          {agentSteps.length === 0 ? (
            <div className="text-slate-500 italic py-8 text-center">
              Agent execution console standing by. Click <strong>"Start Autonomous Test"</strong> above to launch test run.
            </div>
          ) : (
            agentSteps.map((step) => (
              <div key={step.step_number} className="flex items-start gap-3 py-1 border-b border-white/5">
                <span className="text-cyan-400 font-bold">[{step.step_number}]</span>
                <span className="text-slate-500 text-[10px]">{new Date(step.timestamp).toLocaleTimeString()}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                  step.status === "success" ? "bg-emerald-500/20 text-emerald-400" :
                  step.status === "warning" ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                }`}>
                  {step.action_type}
                </span>
                <span className="text-white flex-1">{step.description}</span>
                {step.target_selector && <code className="text-cyan-400 text-[10px]">{step.target_selector}</code>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AutonomousTester;
