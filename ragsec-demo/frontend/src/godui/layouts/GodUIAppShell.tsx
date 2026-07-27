import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_GROUPS = [
  {
    name: 'Operations',
    items: [
      { label: 'Executive Dashboard', path: '/v3/dashboard', icon: 'dashboard' },
      { label: 'Threat Intel Feed', path: '/v3/feed', icon: 'monitoring' },
      { label: 'Deep Investigation', path: '/v3/investigation', icon: 'plagiarism' },
      { label: 'Local Scanner', path: '/v3/scanner', icon: 'search' },
    ],
  },
  {
    name: 'Capabilities',
    items: [
      { label: 'AI Threat Copilot', path: '/v3/assistant', icon: 'smart_toy', badge: 'pulse' },
      { label: 'Time-Aware Retrieval', path: '/v3/retrieval', icon: 'manage_search' },
      { label: 'Executive Analytics', path: '/v3/analytics', icon: 'insights' },
    ],
  },
  {
    name: 'Response',
    items: [
      { label: 'Incident Playbooks', path: '/v3/playbooks', icon: 'local_library' },
      { label: 'Patch Management', path: '/v3/patch', icon: 'security_update_good' },
    ],
  },
  {
    name: 'System Architecture',
    items: [
      { label: 'Data Pipeline', path: '/v3/architecture', icon: 'account_tree' },
      { label: 'Vector Knowledge Base', path: '/v3/knowledge-base', icon: 'database' },
      { label: 'API Explorer', path: '/v3/api', icon: 'api' },
      { label: 'System Health', path: '/v3/status', icon: 'vital_signs' },
      { label: 'Settings', path: '/v3/settings', icon: 'settings' },
    ],
  },
];

export const GodUIAppShell: React.FC = () => {
    const location = useLocation();

    // Helper to format breadcrumb
    const getBreadcrumbs = () => {
        const p = location.pathname;
        let group = 'System';
        let page = 'Dashboard';
        
        for (const g of NAV_GROUPS) {
            for (const item of g.items) {
                if (p.includes(item.path)) {
                    group = g.name;
                    page = item.label;
                    break;
                }
            }
        }
        return { group, page };
    };

    const { group, page } = getBreadcrumbs();

    return (
        <div className="flex flex-row h-screen w-full bg-[#030303] text-gray-200 font-sans overflow-hidden selection:bg-primary-fixed/20 relative">
            {/* Animated Mesh Gradient Background (GodUI style) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/30 blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-fixed/20 blur-[120px]"></div>
            </div>

            {/* Left Sidebar */}
            <aside className="w-64 flex flex-col relative z-20 border-r border-white/5 bg-black/40 backdrop-blur-3xl shrink-0 h-full">
                {/* Logo Area */}
                <div className="h-20 flex items-center px-6 border-b border-white/5 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-fixed/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.1)] mr-3">
                        <span className="material-symbols-outlined text-primary-fixed text-xl">security</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-lg tracking-widest text-white leading-none">
                            RAG<span className="text-primary-fixed">SEC</span>
                        </span>
                        <span className="text-[9px] text-white/40 font-mono tracking-widest mt-1">GODUI ENGINE</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                    {NAV_GROUPS.map((navGroup) => (
                        <div key={navGroup.name}>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 px-2 font-semibold">
                                {navGroup.name}
                            </div>
                            <div className="space-y-1">
                                {navGroup.items.map((item) => {
                                    const isActive = location.pathname.includes(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className="group relative flex items-center px-3 py-2.5 rounded-xl transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Hover / Active Background */}
                                            <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10 border border-white/10' : 'opacity-0 group-hover:opacity-100 group-hover:bg-white/5 border border-transparent'}`}></div>
                                            
                                            {/* Active Glow Indicator */}
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="activeNavIndicator"
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary-fixed rounded-r-full shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                                                />
                                            )}

                                            <span 
                                                className={`material-symbols-outlined text-[20px] relative z-10 transition-colors duration-300 mr-3 ${isActive ? 'text-primary-fixed' : 'text-white/40 group-hover:text-white'}`}
                                                data-weight={isActive ? 'fill' : undefined}
                                            >
                                                {item.icon}
                                            </span>
                                            
                                            <div className="flex-1 flex justify-between items-center relative z-10">
                                                <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/90'}`}>
                                                    {item.label}
                                                </span>
                                                {item.badge === 'pulse' && (
                                                    <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
                {/* Topbar */}
                <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-8 z-20 shrink-0">
                    <div className="flex items-center text-sm font-mono">
                        <span className="text-white/30">{group}</span>
                        <span className="mx-3 text-white/10">/</span>
                        <motion.span 
                            key={page} // Force re-render animation on page change
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-white font-semibold"
                        >
                            {page}
                        </motion.span>
                    </div>

                    <div className="flex items-center space-x-4">
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
