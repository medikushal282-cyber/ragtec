import React, { useState, useEffect } from "react";
import { ragsecApi } from "../services/api";
import { P8TestReport, P8DetectedIssue } from "../types";
import { 
  ClipboardCheck, 
  FileText, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  ShieldAlert, 
  Eye, 
  Bug, 
  Layers, 
  RefreshCw,
  X,
  Code2,
  FileSpreadsheet
} from "lucide-react";

export const TestReports: React.FC = () => {
  const [reports, setReports] = useState<P8TestReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<P8TestReport | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<P8DetectedIssue | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await ragsecApi.getP8Reports();
      setReports(data);
      if (data.length > 0) setSelectedReport(data[0]);
    } catch (e) {
      console.error("Reports fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExport = (format: "json" | "pdf" | "csv") => {
    setDownloadToast(`Exported P8 Audit Report (${format.toUpperCase()}) for ${selectedReport?.target_name}`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  const filteredIssues = selectedReport?.detected_issues.filter((issue) => {
    if (activeCategoryFilter === "all") return true;
    if (activeCategoryFilter === "critical") return issue.severity === "critical" || issue.severity === "high";
    return issue.category === activeCategoryFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-cyan-400" />
            P8 Test Results & Issue Inspection Center
          </h3>
          <p className="text-xs text-slate-400">
            Audit dashboards, detected bug matrix, reproduction steps, and WCAG accessibility violations
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("json")}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF Report
          </button>
        </div>
      </div>

      {downloadToast && (
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {downloadToast}
        </div>
      )}

      {/* Reports Metric Summary Cards */}
      {selectedReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-cyan-500">
            <div className="text-xs text-slate-400 font-mono">TARGET APP</div>
            <div className="text-base font-bold text-white font-mono truncate">{selectedReport.target_name}</div>
            <div className="text-[11px] text-cyan-400 font-mono">{selectedReport.target_url}</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
            <div className="text-xs text-slate-400 font-mono">PASS RATE SCORE</div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white font-mono">{selectedReport.pass_rate}%</span>
              <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">PASSED</span>
            </div>
            <p className="text-[11px] text-slate-400">{selectedReport.steps_executed} steps executed</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-blue-500">
            <div className="text-xs text-slate-400 font-mono">WCAG A11Y AUDIT</div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white font-mono">{selectedReport.accessibility_score}/100</span>
              <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/20">WCAG 2.1 AA</span>
            </div>
            <p className="text-[11px] text-slate-400">Color contrast & ARIA check</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-rose-500">
            <div className="text-xs text-slate-400 font-mono">DETECTED ISSUES</div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white font-mono">{selectedReport.detected_issues.length}</span>
              <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20">ACTION NEEDED</span>
            </div>
            <p className="text-[11px] text-slate-400">Bugs requiring remediation</p>
          </div>
        </div>
      )}

      {/* Main Issue Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Category Filter & Issue List */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="font-bold text-white text-sm font-mono flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-400" />
              Detected Issues Matrix
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
              {filteredIssues.length} ISSUES
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
            {[
              { id: "all", label: "All" },
              { id: "critical", label: "Critical/High" },
              { id: "accessibility", label: "Accessibility" },
              { id: "functional", label: "Functional" },
              { id: "responsive", label: "Responsive" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  activeCategoryFilter === cat.id
                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Issues List */}
          <div className="space-y-2.5 pt-2">
            {filteredIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedIssue?.id === issue.id
                    ? "bg-cyan-950/40 border-cyan-500/50 text-white shadow-lg shadow-cyan-950/20"
                    : "bg-black/40 border-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-cyan-400">{issue.id}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                    issue.severity === "critical" ? "bg-rose-500/30 text-rose-200" :
                    issue.severity === "high" ? "bg-rose-500/20 text-rose-300" :
                    issue.severity === "medium" ? "bg-amber-500/20 text-amber-300" : "bg-cyan-500/20 text-cyan-300"
                  }`}>
                    {issue.severity}
                  </span>
                </div>
                <div className="text-xs font-bold text-white font-sans line-clamp-1">{issue.title}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-2 flex justify-between">
                  <span>Category: {issue.category}</span>
                  <span className="text-cyan-400">Inspect &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Issue Inspector Drawer (2 Columns wide) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIssue ? (
            <div className="glass-panel p-6 rounded-2xl space-y-5 border-l-4 border-l-cyan-500">
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedIssue.id}
                    </span>
                    <h3 className="text-base font-bold text-white font-mono">{selectedIssue.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedIssue.description}</p>
                </div>
                <span className={`text-xs font-mono px-3 py-1 rounded-lg uppercase font-bold ${
                  selectedIssue.severity === "critical" || selectedIssue.severity === "high"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {selectedIssue.severity} SEVERITY
                </span>
              </div>

              {/* Target Details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px]">AFFECTED TARGET URL</span>
                  <div className="text-cyan-400 font-bold truncate">{selectedIssue.affected_url}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px]">TARGET DOM SELECTOR</span>
                  <code className="text-amber-400 font-bold block truncate">{selectedIssue.element_selector}</code>
                </div>
              </div>

              {/* Reproduction Steps */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Step-by-Step Reproduction Guide
                </h4>

                <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs text-slate-300">
                  {selectedIssue.reproduction_steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-cyan-400 font-bold min-w-[20px]">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WCAG Accessibility Violation Details if applicable */}
              {selectedIssue.wcag_rule_id && (
                <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2 text-xs font-mono">
                  <div className="font-bold text-blue-300 flex items-center justify-between">
                    <span>WCAG Violation Rule: {selectedIssue.wcag_rule_id}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Level {selectedIssue.wcag_level}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Compliance rule recommendation: Add explicit <code className="text-cyan-400">aria-label</code> or accessible name property to target DOM element to ensure compatibility with screen readers.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3 border-t border-white/10">
                <button
                  onClick={() => {
                    setDownloadToast(`Retesting defect ${selectedIssue.id} on ${selectedIssue.affected_url}...`);
                    setTimeout(() => setDownloadToast(null), 3000);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-cyan-600/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  Trigger Retest
                </button>
                <button
                  onClick={() => {
                    setDownloadToast(`Marked ${selectedIssue.id} as resolved`);
                    setTimeout(() => setDownloadToast(null), 3000);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 hover:bg-emerald-600/50 text-emerald-200 font-mono text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Mark Resolved
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
              <Bug className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300 font-mono">No Issue Selected</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an issue from the list on the left to inspect reproduction steps, element selectors, and WCAG rules.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestReports;
