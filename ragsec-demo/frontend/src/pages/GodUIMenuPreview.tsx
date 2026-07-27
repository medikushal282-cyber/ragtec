import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dock, DockItem } from '../components/godui/dock';

const NAV_GROUPS = [
  {
    name: 'Operations',
    items: [
      { label: 'Executive Dashboard', path: '/app/dashboard', icon: 'dashboard' },
      { label: 'Threat Intel Feed', path: '/app/feed', icon: 'monitoring' },
      { label: 'Deep Investigation', path: '/app/investigation', icon: 'plagiarism' },
      { label: 'Local Scanner', path: '/app/scanner', icon: 'search' },
    ],
  },
  {
    name: 'Capabilities',
    items: [
      { label: 'AI Threat Copilot', path: '/app/assistant', icon: 'smart_toy', badge: 'pulse' },
      { label: 'Time-Aware Retrieval', path: '/app/demo', icon: 'manage_search' },
      { label: 'Executive Analytics', path: '/app/analytics', icon: 'insights' },
    ],
  },
  {
    name: 'Response',
    items: [
      { label: 'Incident Playbooks', path: '/app/playbooks', icon: 'local_library' },
      { label: 'Patch Management', path: '/app/patch', icon: 'security_update_good' },
    ],
  },
  {
    name: 'System Architecture',
    items: [
      { label: 'Data Pipeline', path: '/app/forensics', icon: 'account_tree' },
      { label: 'Vector Knowledge Base', path: '/app/knowledge-base', icon: 'database' },
      { label: 'API Explorer', path: '/app/api-explorer', icon: 'api' },
      { label: 'System Health', path: '/app/system-status', icon: 'vital_signs' },
      { label: 'Settings', path: '/app/settings', icon: 'settings' },
    ],
  },
];

export default function GodUIMenuPreview() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen w-full bg-[#030303] text-gray-200 font-sans overflow-hidden selection:bg-white/20">
            {/* Main Content Area Preview */}
            <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#030303]">
                 {/* GodUI Background Effect */}
                 <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
                 <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                 
                 <div className="z-10 flex flex-col items-center p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        <span className="material-symbols-outlined text-white text-3xl">auto_awesome</span>
                    </div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-tight mb-2">GodUI Authentic Preview</h1>
                    <p className="text-white/50 mb-8 text-center max-w-sm">Move your pointer across the Dock at the bottom of the screen to see the authentic GodUI spring-based magnification effect.</p>
                    
                    <button 
                        onClick={() => navigate('/app/dashboard')}
                        className="px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
                    >
                        Return to Dashboard
                    </button>
                 </div>
            </main>

            {/* Authentic GodUI Dock */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                <Dock>
                    <DockItem label="Dashboard" onClick={() => navigate('/app/dashboard')}>
                        <span className="material-symbols-outlined text-2xl">dashboard</span>
                    </DockItem>
                    <DockItem label="Threat Feed">
                        <span className="material-symbols-outlined text-2xl">monitoring</span>
                    </DockItem>
                    <DockItem label="Investigation">
                        <span className="material-symbols-outlined text-2xl">plagiarism</span>
                    </DockItem>
                    <DockItem label="Scanner">
                        <span className="material-symbols-outlined text-2xl">search</span>
                    </DockItem>
                    <div className="w-px h-8 bg-white/10 mx-2 self-center"></div>
                    <DockItem label="AI Copilot">
                        <span className="material-symbols-outlined text-2xl">smart_toy</span>
                    </DockItem>
                    <DockItem label="Retrieval Demo">
                        <span className="material-symbols-outlined text-2xl">manage_search</span>
                    </DockItem>
                    <div className="w-px h-8 bg-white/10 mx-2 self-center"></div>
                    <DockItem label="Settings">
                        <span className="material-symbols-outlined text-2xl">settings</span>
                    </DockItem>
                </Dock>
            </div>
        </div>
    )
}
