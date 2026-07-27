import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { NotificationCenter } from './NotificationCenter';
import { InvestigationDrawer } from '../ui/InvestigationDrawer';
import { CommandPalette } from '../ui/CommandPalette';

interface NavGroup {
  name: string;
  items: {
    label: string;
    path: string;
    icon: string; // Material symbol name
    badge?: 'pulse' | string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
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

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    sidebarOpen,
    unreadNotificationCount,
    connectionStatus,
    setCommandPaletteOpen
  } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();

  // Helper to format breadcrumb
  const getBreadcrumbs = () => {
    const p = location.pathname;
    let group = 'System';
    let page = 'Dashboard';
    
    for (const g of NAV_GROUPS) {
        for (const item of g.items) {
            if (p === item.path) {
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
    <div className="flex h-screen w-full relative overflow-hidden font-sans bg-[#0A0A0A] text-on-surface">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="border-r border-dashed border-white/15 bg-black/50 backdrop-blur-md flex flex-col relative z-20 shrink-0 h-full"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-dashed border-white/15 shrink-0 overflow-hidden">
          <span className="material-symbols-outlined text-primary-fixed mr-2 text-2xl shrink-0">security</span>
          {sidebarOpen && (
            <>
              <span className="font-bold text-lg tracking-widest text-on-surface whitespace-nowrap">
                  RAG<span className="text-primary-fixed">SEC</span>
              </span>
              <span className="ml-2 text-[10px] bg-primary-fixed/20 text-primary-fixed px-1.5 py-0.5 rounded font-mono shrink-0">v2.4</span>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          {NAV_GROUPS.map((navGroup) => (
            <div key={navGroup.name}>
              {sidebarOpen && (
                <div className="text-[10px] uppercase tracking-[0.2em] text-outline mb-4 px-2 font-semibold">
                  {navGroup.name}
                </div>
              )}
              <div className="space-y-1">
                {navGroup.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={!sidebarOpen ? item.label : undefined}
                      className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors magnetic-target group relative overflow-hidden ${
                        isActive 
                          ? 'text-primary-fixed bg-primary-fixed/10' 
                          : 'text-outline hover:text-on-surface hover:bg-white/5'
                      } ${!sidebarOpen ? 'justify-center' : ''}`}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-fixed"></div>}
                      
                      <span 
                        className={`material-symbols-outlined text-[20px] transition-colors ${
                            !sidebarOpen ? 'mr-0' : 'mr-3'
                        } ${isActive ? '' : 'group-hover:text-primary-fixed'}`}
                        data-weight={isActive ? 'fill' : undefined}
                      >
                        {item.icon}
                      </span>
                      
                      {sidebarOpen && (
                        <div className="flex-1 flex justify-between items-center whitespace-nowrap">
                          <span>{item.label}</span>
                          {item.badge === 'pulse' && (
                              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse shrink-0"></span>
                          )}
                          {item.badge && item.badge !== 'pulse' && (
                              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-outline">
                                {item.badge}
                              </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-dashed border-white/15 bg-black/30 backdrop-blur-md flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center text-sm font-mono text-outline">
            <span>{group}</span>
            <span className="mx-2">/</span>
            <span className="text-primary-fixed">{page}</span>
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
