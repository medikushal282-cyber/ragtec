import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { fetchPipelineTopology } from '../lib/api';

export default function Architecture() {
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    fetchPipelineTopology().then((data) => {
      setPipelineData(data);
      setNodes(data.nodes || []);
      setSelectedNode(data.nodes[0]);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500 w-full min-w-0 pb-12">
      <header className="text-center mb-12 space-y-2">
        <h1 className="text-3xl font-extrabold uppercase tracking-widest text-on-surface">Data Pipeline Architecture</h1>
        <p className="text-outline max-w-2xl mx-auto text-sm">
          Drag and drop pipeline nodes to reorder execution workflow, or click any component to inspect data telemetry.
        </p>
      </header>

      {/* Interactive System Graph with Reorder */}
      <div className="glass-panel p-8 relative overflow-hidden rounded-xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary-fixed/5 rounded-full blur-[100px] pointer-events-none"></div>

        {nodes.length > 0 && (
          <Reorder.Group axis="x" values={nodes} onReorder={setNodes} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {nodes.map((node: any) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <Reorder.Item key={node.id} value={node}>
                  <motion.div
                    onClick={() => setSelectedNode(node)}
                    whileHover={{ y: -5 }}
                    className={`p-5 rounded-xl border border-dashed cursor-grab active:cursor-grabbing transition-all magnetic-target group ${
                      isSelected
                        ? 'bg-primary-fixed/20 border-primary-fixed/50 shadow-[0_0_20px_rgba(0,219,233,0.15)]'
                        : 'bg-black/40 border-white/10 hover:border-primary-fixed/30 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                          isSelected ? 'bg-primary-fixed text-black' : 'bg-white/10 text-outline group-hover:text-primary-fixed'
                      }`}>
                        <span className="material-symbols-outlined text-[20px]">{node.icon}</span>
                      </div>
                      <h4 className={`font-bold text-xs uppercase tracking-wider ${isSelected ? 'text-primary-fixed' : 'text-on-surface'}`}>
                          {node.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-outline leading-relaxed">{node.desc}</p>
                  </motion.div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </div>

      {/* Selected Node Details Panel */}
      {selectedNode && (
        <AnimatePresence mode="wait">
            <motion.div 
              key={selectedNode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel p-6 rounded-xl relative overflow-hidden border-primary-fixed/30 bg-black/40"
            >
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-fixed/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-start justify-between relative z-10">
                  <div>
                      <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-[24px] text-primary-fixed">{selectedNode.icon}</span>
                      <h3 className="text-xl font-bold text-on-surface uppercase tracking-widest">{selectedNode.title}</h3>
                      </div>
                      <p className="text-sm text-outline mb-6 max-w-2xl">{selectedNode.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-primary-fixed px-3 py-1 bg-primary-fixed/10 border border-primary-fixed/30 rounded flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse"></span>
                      OPERATIONAL
                  </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  <div className="p-4 rounded-lg bg-black/50 border border-dashed border-white/10">
                      <span className="text-[10px] text-outline font-mono uppercase block mb-1">Component ID</span>
                      <span className="text-sm text-on-surface font-mono">{selectedNode.id}</span>
                  </div>
                  <div className="p-4 rounded-lg bg-black/50 border border-dashed border-white/10">
                      <span className="text-[10px] text-outline font-mono uppercase block mb-1">Communication Protocol</span>
                      <span className="text-sm text-secondary-fixed font-mono">REST / WebSockets</span>
                  </div>
                  <div className="p-4 rounded-lg bg-black/50 border border-dashed border-white/10">
                      <span className="text-[10px] text-outline font-mono uppercase block mb-1">Data Processing</span>
                      <span className="text-sm text-secondary-container font-mono">Real-time (Low Latency)</span>
                  </div>
              </div>
            </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
