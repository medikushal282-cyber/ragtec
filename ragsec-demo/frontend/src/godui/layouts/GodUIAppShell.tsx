import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DockNav } from '../../components/navigation/DockNav';

const DOCK_ITEMS = [
  { label: 'Executive Dashboard', path: '/v3/dashboard', icon: 'dashboard' },
  { label: 'Threat Intel Feed', path: '/v3/feed', icon: 'monitoring' },
  { label: 'Enterprise Network', path: '/v3/network', icon: 'dns' },
  { label: 'Local Scanner', path: '/v3/scanner', icon: 'search' },
  { label: 'AI Threat Copilot', path: '/v3/assistant', icon: 'smart_toy' },
  { label: 'Compliance & Audit', path: '/v3/audit', icon: 'manage_search' },
  { label: 'Settings', path: '/v3/settings', icon: 'settings' },
];

export const GodUIAppShell: React.FC = () => {
    const location = useLocation();

    // Helper to format breadcrumb
    const getBreadcrumbs = () => {
        const p = location.pathname;
        let page = 'Dashboard';
        
        for (const item of DOCK_ITEMS) {
            if (p.includes(item.path)) {
                page = item.label;
                break;
            }
        }
        return { group: 'System', page };
    };

    const { group, page } = getBreadcrumbs();

    return (
        <div className="flex flex-col h-screen w-full bg-[#030303] text-gray-200 font-sans overflow-hidden selection:bg-primary-fixed/20 relative">
            {/* Animated Mesh Gradient Background (GodUI style) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/30 blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-fixed/20 blur-[120px]"></div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
                {/* Topbar */}
                <header className="relative h-24 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-8 z-20 shrink-0">
                    <div className="flex items-center text-sm font-mono">
                        <div className="flex items-center mr-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FFCC00]/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,204,0,0.1)] mr-3">
                                <span className="material-symbols-outlined text-[#FFCC00] text-lg">security</span>
                            </div>
                            <span className="font-black text-lg tracking-widest text-white leading-none">
                                RAG<span className="text-[#FFCC00]">SEC</span>
                            </span>
                        </div>
                        <span className="text-white/30">{group}</span>
                        <span className="mx-3 text-white/10">/</span>
                        <motion.span 
                            key={page}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-white"
                        >
                            {page}
                        </motion.span>
                    </div>

                    {/* Absolute Center Dock - Expands Downward */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-4 z-50">
                        <DockNav items={DOCK_ITEMS} />
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="flex items-center text-xs font-mono text-white/50 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <span className="w-2 h-2 rounded-full mr-3 bg-primary-fixed animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.8)]"></span>
                            GODUI CONNECTED
                        </div>
                        <div className="hidden md:flex items-center bg-black/40 border border-white/10 rounded-full px-4 py-2 hover:border-white/20 hover:bg-white/5 transition-all cursor-text group">
                            <span className="material-symbols-outlined text-[18px] text-white/30 mr-2 group-hover:text-primary-fixed transition-colors">search</span>
                            <span className="text-xs font-mono text-white/40">Search system...</span>
                            <span className="ml-8 text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5 font-mono">⌘K</span>
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-2"></div>

                        <button className="relative w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary-fixed rounded-full border-2 border-black shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span>
                        </button>
                        
                        <button className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all">
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                        </button>
                    </div>
                </header>

                {/* Page Viewport */}
                <main className="flex-1 overflow-y-auto relative min-h-0 custom-scrollbar p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};
