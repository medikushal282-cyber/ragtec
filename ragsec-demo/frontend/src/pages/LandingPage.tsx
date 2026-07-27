import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="bg-[#0A0A0A] text-on-surface font-sans min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary-fixed selection:text-black">
      {/* Background Elements */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20" 
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #00dbe9 0%, transparent 50%)' }}
      ></div>
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-10" 
        style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #ff525c 0%, transparent 50%)' }}
      ></div>
      
      {/* Top Nav */}
      <header className="h-20 border-b border-dashed border-white/15 bg-black/30 backdrop-blur-md flex items-center justify-between px-8 z-20 w-full shrink-0">
        <div className="flex items-center">
            <span className="material-symbols-outlined text-primary-fixed mr-2 text-3xl">security</span>
            <span className="font-bold text-2xl tracking-widest text-on-surface">
              RAG<span className="text-primary-fixed">SEC</span>
            </span>
            <span className="ml-2 text-xs bg-primary-fixed/20 text-primary-fixed px-2 py-0.5 rounded font-mono">v2.4</span>
        </div>
        <div className="flex items-center space-x-6">
            <a href="#" className="hidden md:block text-sm text-outline hover:text-on-surface transition-colors magnetic-target">Documentation</a>
            <a href="#" className="hidden md:block text-sm text-outline hover:text-on-surface transition-colors magnetic-target">API Specs</a>
            <a href="#" className="hidden md:block text-sm text-outline hover:text-on-surface transition-colors magnetic-target">Enterprise</a>
            <Link to="/app/dashboard" className="kinetic-btn px-6 py-2 text-sm font-bold uppercase tracking-wider magnetic-target flex items-center">
                Launch Console
                <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
            </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-8 py-20 w-full max-w-7xl mx-auto min-h-0 overflow-y-auto custom-scrollbar">
          
          {/* Hero Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center mb-8 px-4 py-1.5 rounded-full border border-dashed border-white/15 bg-white/5 backdrop-blur-sm"
          >
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse mr-3"></span>
              <span className="font-mono text-xs text-outline tracking-wider">SYSTEM ACTIVE • 1.2M VECTORS INDEXED</span>
          </motion.div>

          {/* Hero Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-8xl font-bold text-center leading-tight tracking-tight mb-6"
          >
              Precision Intelligence.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-fixed to-primary-fixed-dim glitch-text" data-text="Zero Compromise.">Zero Compromise.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-outline max-w-2xl text-center mb-12"
          >
              The next-generation autonomous Security Operations Center. Powered by Time-Aware Retrieval Augmented Generation and deterministic AI workflows.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-24"
          >
              <Link to="/app/dashboard" className="kinetic-btn px-8 py-4 text-base font-bold uppercase tracking-wider magnetic-target flex items-center w-full sm:w-auto justify-center">
                  <span className="material-symbols-outlined mr-2">dashboard</span>
                  Access Dashboard
              </Link>
              <Link to="/app/api-explorer" className="kinetic-btn-secondary px-8 py-4 text-base font-bold uppercase tracking-wider magnetic-target flex items-center w-full sm:w-auto justify-center">
                  <span className="material-symbols-outlined mr-2">terminal</span>
                  Explore API
              </Link>
          </motion.div>

          {/* Bento Grid Features */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          >
              {/* Feature 1 */}
              <div className="glass-panel p-6 rounded-xl hover:glass-panel-active transition-all group magnetic-target cursor-none">
                  <div className="w-12 h-12 rounded-lg bg-primary-fixed/10 border border-primary-fixed/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-primary-fixed text-2xl">manage_search</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Time-Aware RAG</h3>
                  <p className="text-sm text-outline">Dynamic reranking algorithm prioritizes recent threat intelligence over legacy CVEs, ensuring high-fidelity context.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="glass-panel p-6 rounded-xl hover:glass-panel-active transition-all group magnetic-target cursor-none">
                  <div className="w-12 h-12 rounded-lg bg-secondary-container/10 border border-secondary-container/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-secondary-container text-2xl">neurology</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">AI Threat Copilot</h3>
                  <p className="text-sm text-outline">Deterministic reasoning engine with direct access to your telemetry, providing autonomous investigation capabilities.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="glass-panel p-6 rounded-xl hover:glass-panel-active transition-all group magnetic-target cursor-none">
                  <div className="w-12 h-12 rounded-lg bg-primary-fixed-dim/10 border border-primary-fixed-dim/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">account_tree</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Forensic Pipeline</h3>
                  <p className="text-sm text-outline">Visual, real-time data ingestion and processing pipeline mapping. Track every artifact from source to vector DB.</p>
              </div>
          </motion.div>

      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-dashed border-white/15 flex items-center justify-center z-20 w-full text-xs font-mono text-outline shrink-0">
          <span className="mr-4">© 2026 RAGSEC ENTERPRISE</span>
          <span className="w-1 h-1 bg-outline rounded-full mr-4"></span>
          <span className="mr-4">OPERATIONAL METRICS: NOMINAL</span>
          <span className="w-1 h-1 bg-outline rounded-full mr-4"></span>
          <span>LATENCY: 42ms</span>
      </footer>
    </div>
  );
}
