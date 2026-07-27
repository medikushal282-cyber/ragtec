import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postRetrieve, RetrieveResult } from '../lib/api';

export default function RetrievalDemo() {
  const [tradResults, setTradResults] = useState<RetrieveResult[]>([]);
  const [ragsecResults, setRagsecResults] = useState<RetrieveResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Weight Sliders State
  const [weights, setWeights] = useState({
    sim: 0.45,
    recency: 0.30,
    severity: 0.15,
    trust: 0.10,
  });

  const runSimulation = async () => {
    setLoading(true);
    try {
      const [trad, ragsec] = await Promise.all([
        postRetrieve('ransomware', false),
        postRetrieve('ransomware', true, weights),
      ]);
      setTradResults(trad.slice(0, 5));
      setRagsecResults(ragsec.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [weights]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500 w-full min-w-0 pb-12">
      <header className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold uppercase tracking-widest text-on-surface">Time-Aware Reranking Simulation</h1>
        <p className="text-outline max-w-2xl mx-auto text-sm">
          Adjust the hybrid ranking formula weights to observe how RAGSec prevents zero-day misses compared to traditional vector similarity.
        </p>
      </header>

      {/* Interactive Weight Sliders Control Panel */}
      <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-2 mb-8 text-primary-fixed font-bold text-sm uppercase tracking-wider border-b border-dashed border-white/10 pb-4">
          <span className="material-symbols-outlined text-[18px]">tune</span> Multi-Variable Reranking Formula Weights
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs font-mono relative z-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded border border-dashed border-white/10">
              <span className="text-outline uppercase tracking-wider text-[10px]">Similarity ($w_1$)</span>
              <span className="text-secondary-fixed font-bold px-1.5 py-0.5 bg-secondary-fixed/20 rounded">{(weights.sim * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.sim}
              onChange={(e) => setWeights((w) => ({ ...w, sim: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-secondary-fixed"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded border border-dashed border-white/10">
              <span className="text-outline uppercase tracking-wider text-[10px]">Recency ($w_2$)</span>
              <span className="text-primary-fixed font-bold px-1.5 py-0.5 bg-primary-fixed/20 rounded">{(weights.recency * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.recency}
              onChange={(e) => setWeights((w) => ({ ...w, recency: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-primary-fixed"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded border border-dashed border-white/10">
              <span className="text-outline uppercase tracking-wider text-[10px]">Severity ($w_3$)</span>
              <span className="text-secondary-container font-bold px-1.5 py-0.5 bg-secondary-container/20 rounded">{(weights.severity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.severity}
              onChange={(e) => setWeights((w) => ({ ...w, severity: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-secondary-container"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded border border-dashed border-white/10">
              <span className="text-outline uppercase tracking-wider text-[10px]">Trust ($w_4$)</span>
              <span className="text-primary-container font-bold px-1.5 py-0.5 bg-primary-container/20 rounded">{(weights.trust * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.trust}
              onChange={(e) => setWeights((w) => ({ ...w, trust: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-primary-container"
            />
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-dashed border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-outline">
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-dashed border-white/10">
            <span className="material-symbols-outlined text-[14px]">function</span>
            <span>
              Result = <span className="text-on-surface">{weights.sim.toFixed(2)}(Sim) + {weights.recency.toFixed(2)}(Time) + {weights.severity.toFixed(2)}(Risk) + {weights.trust.toFixed(2)}(Trust)</span>
            </span>
          </div>
          <button onClick={runSimulation} disabled={loading} className="kinetic-btn px-6 py-2 flex items-center justify-center rounded uppercase font-bold text-[10px] cursor-none disabled:opacity-50 magnetic-target">
             <span className={`material-symbols-outlined text-[16px] mr-2 text-black ${loading ? 'animate-spin' : ''}`}>
                 {loading ? 'refresh' : 'play_arrow'}
             </span>
             Re-evaluate Index
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Columns */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Traditional AI */}
        <div className="flex flex-col">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed/10 border border-secondary-fixed/30 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-secondary-fixed text-[24px]">database</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface uppercase tracking-widest">Traditional Cosine RAG</h3>
            <p className="text-center text-xs text-outline mt-1">Ranks exclusively by vector similarity score.</p>
          </div>

          <div className="glass-panel p-4 rounded-xl space-y-4 flex-1">
            <AnimatePresence mode="popLayout">
              {tradResults.map((item, i) => (
                <motion.div
                  key={`trad-${item.id}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-black/30 border border-dashed border-white/15 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="mono text-[11px] font-bold text-on-surface flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-secondary-fixed/20 text-secondary-fixed rounded text-[9px]">#{i + 1}</span> 
                        {item.id}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase ${
                      item.severity?.toLowerCase() === 'critical' ? 'bg-secondary-container/20 text-secondary-container border border-secondary-container/30' : 'bg-white/10 text-outline border border-white/10'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                  <div className="p-3 bg-black/50 border border-dashed border-white/10 rounded flex justify-between items-center text-[10px] font-mono text-outline">
                    <span>Similarity Score:</span> 
                    <span className="text-secondary-fixed font-bold text-xs">{item.scores?.similarity}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* RAGSec+ Reranked */}
        <div className="flex flex-col">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary-fixed/10 border border-primary-fixed/30 flex items-center justify-center mb-3 relative">
              <div className="absolute inset-0 rounded-full border border-primary-fixed/50 animate-ping"></div>
              <span className="material-symbols-outlined text-primary-fixed text-[24px]">bolt</span>
            </div>
            <h3 className="text-lg font-bold text-primary-fixed uppercase tracking-widest">RAGSec Time-Aware Engine</h3>
            <p className="text-center text-xs text-outline mt-1">Multi-variable deterministic hybrid scoring.</p>
          </div>

          <div className="glass-panel p-4 rounded-xl space-y-4 flex-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary-fixed/5 pointer-events-none"></div>
            
            <AnimatePresence mode="popLayout">
              {ragsecResults.map((item, i) => (
                <motion.div
                  key={`ragsec-${item.id}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border border-dashed relative z-10 ${
                    i === 0 ? 'bg-primary-fixed/15 border-primary-fixed/50 shadow-[0_0_20px_rgba(0,219,233,0.15)]' : 'bg-black/30 border-white/15'
                  } space-y-4`}
                >
                  <div className="flex justify-between items-center">
                    <span className="mono text-[11px] font-bold text-on-surface flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${i === 0 ? 'bg-primary-fixed text-black' : 'bg-primary-fixed/20 text-primary-fixed'}`}>#{i + 1}</span> 
                        {item.id}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase ${
                      item.severity?.toLowerCase() === 'critical' ? 'bg-secondary-container/20 text-secondary-container border border-secondary-container/30' : 'bg-white/10 text-outline border border-white/10'
                    }`}>
                      {item.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono">
                    <div className="p-2 rounded bg-black/50 border border-dashed border-white/5 flex flex-col items-center justify-center gap-1">
                      <span className="text-outline/70">Sim</span>
                      <span className="text-secondary-fixed">{item.scores?.similarity}</span>
                    </div>
                    <div className="p-2 rounded bg-black/50 border border-dashed border-white/5 flex flex-col items-center justify-center gap-1">
                      <span className="text-outline/70">Time</span>
                      <span className="text-primary-fixed">{item.scores?.recency}</span>
                    </div>
                    <div className="p-2 rounded bg-black/50 border border-dashed border-white/5 flex flex-col items-center justify-center gap-1">
                      <span className="text-outline/70">Risk</span>
                      <span className="text-secondary-container">{item.scores?.severity}</span>
                    </div>
                    <div className="p-2 rounded bg-black/50 border border-dashed border-white/5 flex flex-col items-center justify-center gap-1">
                      <span className="text-outline/70">Trust</span>
                      <span className="text-primary-container">{item.scores?.trust}</span>
                    </div>
                  </div>

                  <div className={`p-2 rounded text-center text-[10px] font-mono font-bold uppercase ${
                      i === 0 ? 'bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30' : 'bg-white/5 text-outline border border-dashed border-white/10'
                  }`}>
                    Final Hybrid Score: <span className="text-xs">{item.scores?.final}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
