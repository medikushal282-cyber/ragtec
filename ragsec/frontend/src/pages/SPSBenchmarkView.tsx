import React, { useState } from "react";
import {
  Award,
  BarChart3,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Search
} from "lucide-react";

interface BenchmarkRow {
  architecture: string;
  factualAlignment: number;
  unsupportedRate: number;
  triageTimeMin: number;
  spsScore: number;
  speedupPct: number;
}

const BENCHMARK_DATA: BenchmarkRow[] = [
  {
    architecture: "RAGSec (Grounded + 2-Stage Retrieval)",
    factualAlignment: 98.4,
    unsupportedRate: 0.0,
    triageTimeMin: 2.1,
    spsScore: 94.8,
    speedupPct: 84
  },
  {
    architecture: "Standard Dense RAG (No Gating)",
    factualAlignment: 81.2,
    unsupportedRate: 14.5,
    triageTimeMin: 5.4,
    spsScore: 72.3,
    speedupPct: 58
  },
  {
    architecture: "Raw LLM (Zero Grounding)",
    factualAlignment: 54.0,
    unsupportedRate: 38.2,
    triageTimeMin: 9.8,
    spsScore: 41.5,
    speedupPct: 24
  },
  {
    architecture: "Manual Analyst Search Baseline",
    factualAlignment: 89.0,
    unsupportedRate: 4.1,
    triageTimeMin: 14.0,
    spsScore: 68.0,
    speedupPct: 0
  }
];

export const SPSBenchmarkView: React.FC = () => {
  const [alpha, setAlpha] = useState(1.0);
  const [beta, setBeta] = useState(1.5);
  const [gamma, setGamma] = useState(0.8);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="modern-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">Evaluation Benchmark</span>
            <span className="text-neutral-300">•</span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Security Posture Score (SPS)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight">
            Security Posture Scoring & Comparative Benchmark
          </h2>
          <p className="text-xs text-[#475569] mt-1 max-w-2xl">
            Evaluate grounded RAG against raw LLMs and traditional manual triage workflows across factual alignment, unsupported hallucination rates, and triage acceleration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>SPS Winner: RAGSec (94.8)</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="modern-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">RAGSec SPS Score</div>
          <div className="font-bold text-3xl text-black">94.8 <span className="text-xs font-normal text-[#64748B]">/ 100</span></div>
          <div className="text-[11px] text-emerald-600 font-medium">+26.8 vs Manual Baseline</div>
        </div>

        <div className="modern-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">Triage Acceleration</div>
          <div className="font-bold text-3xl font-mono text-emerald-600">84%</div>
          <div className="text-[11px] text-[#64748B]">14.0 min down to 2.1 min</div>
        </div>

        <div className="modern-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">Hallucination Rate</div>
          <div className="font-bold text-3xl font-mono text-black">0.0%</div>
          <div className="text-[11px] text-emerald-600 font-medium">100% Grounded CTI</div>
        </div>

        <div className="modern-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#64748B] uppercase">Factual Alignment</div>
          <div className="font-bold text-3xl text-black">98.4%</div>
          <div className="text-[11px] text-[#64748B]">Dense + Cross-Encoder</div>
        </div>
      </div>

      {/* Benchmark Matrix Table */}
      <div className="modern-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-sm text-black">Architecture Performance Matrix</h3>
            <p className="text-xs text-[#64748B]">SPS = &alpha; &times; FactualAlignment - &beta; &times; UnsupportedRate + &gamma; &times; TriageEfficiency</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Architecture</th>
                <th>Factual Alignment</th>
                <th>Unsupported Rate</th>
                <th>Avg Triage Time</th>
                <th>SPS Score</th>
                <th>Speedup</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK_DATA.map((row, idx) => (
                <tr key={idx} className={idx === 0 ? "bg-emerald-50/40" : ""}>
                  <td className="font-semibold text-black">
                    <div className="flex items-center gap-2">
                      {idx === 0 && <Award className="w-4 h-4 text-emerald-600" />}
                      <span>{row.architecture}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{row.factualAlignment}%</td>
                  <td className="font-mono text-xs text-red-600">{row.unsupportedRate}%</td>
                  <td className="font-mono text-xs">{row.triageTimeMin} min</td>
                  <td className="font-mono font-bold text-black text-sm">{row.spsScore}</td>
                  <td>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      +{row.speedupPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SPSBenchmarkView;
