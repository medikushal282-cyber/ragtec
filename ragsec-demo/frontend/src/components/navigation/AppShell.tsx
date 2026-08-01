import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { NotificationCenter } from './NotificationCenter';
import { InvestigationDrawer } from '../ui/InvestigationDrawer';
import { CommandPalette } from '../ui/CommandPalette';
import { DockNav } from './DockNav';

const DOCK_ITEMS = [
  { label: 'Dashboard', path: '/app/dashboard', icon: 'dashboard' },
  { label: 'Threat Feed', path: '/app/feed', icon: 'monitoring' },
  { label: 'Scanner', path: '/app/scanner', icon: 'search' },
  { label: 'AI Copilot', path: '/app/assistant', icon: 'smart_toy' },
  { label: 'Retrieval', path: '/app/demo', icon: 'manage_search' },
  { label: 'Settings', path: '/app/settings', icon: 'settings' },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    unreadNotificationCount,
    connectionStatus,
    setCommandPaletteOpen
  } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();

  // Helper to format breadcrumb
  const getBreadcrumbs = () => {
    const p = location.pathname;
    let page = 'Dashboard';
    
    for (const item of DOCK_ITEMS) {
        if (p === item.path) {
            page = item.label;
            break;
        }
    }
    return { group: 'System', page };
  };

  const { group, page } = getBreadcrumbs();

  return (
    <div className="flex h-screen w-full relative overflow-hidden font-sans bg-[#0A0A0A] text-on-surface">
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">
        {/* Top Bar */}
        <header className="relative h-24 border-b border-dashed border-white/15 bg-black/30 backdrop-blur-md flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center text-sm font-mono text-outline">
            <div className="flex items-center mr-6">
              <span className="material-symbols-outlined text-[#FFCC00] mr-2 text-2xl shrink-0">security</span>
              <span className="font-bold text-lg tracking-widest text-on-surface whitespace-nowrap">
                  RAG<span className="text-[#FFCC00]">SEC</span>
              </span>
            </div>
            <span>{group}</span>
            <span className="mx-2">/</span>
            <span className="text-primary-fixed">{page}</span>
          </div>

          {/* Absolute Center Dock - Expands Downward */}
          <div className="absolute left-1/2 -translate-x-1/2 top-4 z-50">
            <DockNav items={DOCK_ITEMS} />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center text-xs font-mono text-outline bg-white/5 px-3 py-1.5 rounded-full border border-dashed border-white/15 hover:border-primary-fixed/50 hover:text-on-surface transition-colors magnetic-target group"
            >
              <span className="material-symbols-outlined text-[16px] mr-2 group-hover:text-primary-fixed">search</span>
              Search or command...
              <span className="ml-4 opacity-50">⌘K</span>
            </button>

            <div className="flex items-center text-xs font-mono text-outline bg-white/5 px-3 py-1.5 rounded-full border border-dashed border-white/15">
              <span className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-primary-fixed animate-pulse' : 'bg-secondary-container'}`}></span>
              {connectionStatus === 'connected' ? 'SYSTEM ONLINE' : 'OFFLINE'}
            </div>

            <div className="relative">
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="text-outline hover:text-primary-fixed transition-colors magnetic-target relative flex items-center justify-center"
                >
                    <span className="material-symbols-outlined">notifications</span>
                    {unreadNotificationCount > 0 && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-secondary-container rounded-full"></span>
                    )}
                </button>
                <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
            
            <button className="text-outline hover:text-primary-fixed transition-colors magnetic-target">
                <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative min-h-0 custom-scrollbar">
          {children}
        </main>
      </div>

      <InvestigationDrawer />
      <CommandPalette />
    </div>
  );
};
