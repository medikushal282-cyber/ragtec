import React, { useEffect, useState } from 'react';
import { X, Settings, ShieldAlert, Zap, Globe } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('demoMode') === 'true';
    setDemoMode(saved);
  }, [isOpen]);

  const toggleDemoMode = () => {
    const newState = !demoMode;
    setDemoMode(newState);
    localStorage.setItem('demoMode', newState.toString());
    window.dispatchEvent(new Event('demoModeChanged'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0a0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <Settings className="w-4 h-4 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">System Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          <div className="bg-black/40 border border-white/5 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Globe className={`w-4 h-4 ${demoMode ? 'text-cyber-cyan' : 'text-gray-500'}`} />
                  <h3 className="font-bold text-gray-200">Universal Demo Mode</h3>
                </div>
                <p className="text-xs text-gray-400 font-mono pr-4">
                  Globally mocks system actions. Simulates massive enterprise logging, local storage scanning, and automated threat mitigations.
                </p>
              </div>
              
              {/* Toggle Switch */}
              <button 
                onClick={toggleDemoMode}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${demoMode ? 'bg-cyber-cyan' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${demoMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-4 opacity-50 pointer-events-none">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-gray-500" />
                  <h3 className="font-bold text-gray-200">Strict Enforcement</h3>
                </div>
                <p className="text-xs text-gray-400 font-mono pr-4">
                  Automatically quarantine unknown binaries. (Managed by SOC admin)
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-gray-700">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
