import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldAlert, Activity, Cpu, Database, Settings, ShieldCheck, Zap, Layers, HelpCircle, Terminal } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: any;
  path: string;
}

const COMMANDS: CommandItem[] = [
  { id: 'dash', title: 'SOC Command Center', category: 'Navigation', icon: Activity, path: '/app/dashboard' },
  { id: 'feed', title: 'Threat Intelligence Feed', category: 'Navigation', icon: ShieldAlert, path: '/app/feed' },
  { id: 'copilot', title: 'Enterprise Security Copilot', category: 'Navigation', icon: Cpu, path: '/app/assistant' },
  { id: 'demo', title: 'Time-Aware Retrieval Demo', category: 'Navigation', icon: Zap, path: '/app/demo' },
  { id: 'analytics', title: 'Executive Analytics', category: 'Navigation', icon: Activity, path: '/app/analytics' },
  { id: 'playbooks', title: 'Incident Response Playbooks', category: 'Navigation', icon: ShieldCheck, path: '/app/playbooks' },
  { id: 'investigation', title: 'Deep Threat Investigation', category: 'Navigation', icon: Database, path: '/app/investigation' },
  { id: 'patch', title: 'Patch Management', category: 'Navigation', icon: Layers, path: '/app/patch' },
  { id: 'arch', title: 'System Architecture', category: 'System', icon: Layers, path: '/app/forensics' },
  { id: 'api', title: 'API Explorer', category: 'System', icon: Terminal, path: '/app/api-explorer' },
  { id: 'kb', title: 'Knowledge Base', category: 'System', icon: HelpCircle, path: '/app/knowledge-base' },
  { id: 'status', title: 'System Health & Status', category: 'System', icon: Activity, path: '/app/system-status' },
  { id: 'settings', title: 'Settings & Workspace', category: 'System', icon: Settings, path: '/app/settings' },
];

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const filteredCommands = COMMANDS.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    setCommandPaletteOpen(false);
    setQuery('');
    navigate(path);
  };

  if (!commandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-start justify-center pt-24 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-xl bg-cyber-dark/95 border border-cyber-cyan/40 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl"
        >
          {/* Search Input */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <Search className="w-5 h-5 text-cyber-cyan shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search platform (e.g. Dashboard, Playbooks)..."
              className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 font-sans text-sm"
            />
            <span className="mono text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">ESC</span>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.path)}
                    className="p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-cyber-cyan/10 hover:border-cyber-cyan/30 border border-transparent transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-surface border border-white/5 group-hover:text-cyber-cyan text-gray-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-cyber-cyan">{cmd.title}</div>
                        <div className="mono text-[10px] text-gray-500">{cmd.category}</div>
                      </div>
                    </div>
                    <span className="mono text-[10px] text-gray-500 group-hover:text-cyber-cyan">Jump →</span>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">No matching commands found.</div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-black/40 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-500 font-mono">
            <span>Use ↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
