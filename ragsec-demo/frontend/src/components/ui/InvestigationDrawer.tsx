import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, AlertTriangle, ExternalLink, CheckSquare, Server, Cpu, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { fetchInvestigation } from '../../lib/api';

export const InvestigationDrawer: React.FC = () => {
  const { activeThreat, isDrawerOpen, closeDrawer } = useApp();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeThreat) {
      setLoading(true);
      fetchInvestigation(activeThreat.id)
        .then(setDetails)
        .catch(() => setDetails(null))
        .finally(() => setLoading(false));
    }
  }, [activeThreat]);

  if (!activeThreat) return null;

  const isCritical = activeThreat.severity?.toLowerCase() === 'critical';
  const isZeroDay = activeThreat.type === 'Zero-Day' || activeThreat.type === 'RAG Injection' || !activeThreat.solution;

  const toggleCheck = (key: string) => {
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-cyber-dark/95 border-l border-cyber-cyan/30 z-[9999] overflow-y-auto flex flex-col shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-start justify-between bg-surface/50 sticky top-0 z-10 backdrop-blur-md">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="mono text-xs text-cyber-cyan">{activeThreat.id}</span>
                  <Badge variant={isCritical ? 'critical' : 'default'}>{activeThreat.severity}</Badge>
                  {isZeroDay && (
                    <span className="badge-critical flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> ZERO DAY
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white tracking-wide">{activeThreat.name || activeThreat.type}</h2>
                <p className="text-xs text-gray-400">Source: {activeThreat.origin} • Added: {activeThreat.ts || 'Just now'}</p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-lg bg-surface hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8 flex-1">
              {/* Executive Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Executive Summary
                </h3>
                <div className="p-4 rounded-xl bg-surface/60 border border-white/5 text-sm text-gray-300 leading-relaxed">
                  {details?.executive_summary || activeThreat.solution || `${activeThreat.id} poses an active threat to enterprise infrastructure. Immediate isolation and mitigation are strongly advised.`}
                </div>
              </div>

              {/* Business Impact & Risk Bar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface/40 border border-white/5 space-y-1">
                  <span className="text-xs text-gray-500 font-mono uppercase">CVSS Score</span>
                  <div className="text-2xl font-bold text-cyber-pink">
                    {isCritical ? '9.8 / 10.0' : '7.5 / 10.0'}
                  </div>
                  <span className="text-[10px] text-gray-400">High Exploitability Vector</span>
                </div>
                <div className="p-4 rounded-xl bg-surface/40 border border-white/5 space-y-1">
                  <span className="text-xs text-gray-500 font-mono uppercase">Business Impact</span>
                  <div className="text-lg font-semibold text-white">
                    {isCritical ? 'High - Potential RCE' : 'Medium - Denial of Service'}
                  </div>
                  <span className="text-[10px] text-gray-400">Enterprise Infrastructure</span>
                </div>
              </div>

              {/* Zero Day Response Protocol */}
              {isZeroDay && (
                <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/40 space-y-3">
                  <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Zero-Day Emergency Protocol
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    No official patch currently exists for this threat. Enforce immediate network containment:
                  </p>
                  <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
                    <li>Isolate host service from internal subnet</li>
                    <li>Enable strict Web Application Firewall (WAF) blocking</li>
                    <li>Deploy EDR behavior monitoring rules</li>
                  </ul>
                </div>
              )}

              {/* Immediate Action Checklist */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" /> Immediate Mitigation Checklist
                </h3>
                <div className="space-y-2">
                  {[
                    `Verify affected system inventory for ${activeThreat.origin}`,
                    `Apply patch/mitigation: ${activeThreat.solution || 'Isolate service'}`,
                    'Inspect authentication logs for anomalous query vectors',
                    'Notify Security Incident Response Team (SIRT)',
                  ].map((step, i) => {
                    const key = `step-${i}`;
                    const done = completedSteps[key];
                    return (
                      <div
                        key={i}
                        onClick={() => toggleCheck(key)}
                        className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                          done ? 'bg-cyber-cyan/10 border-cyber-cyan/40 text-cyber-cyan' : 'bg-surface/40 border-white/5 text-gray-300 hover:bg-surface/80'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${done ? 'bg-cyber-cyan border-cyber-cyan text-cyber-black' : 'border-gray-500'}`}>
                          {done && '✓'}
                        </div>
                        <span className={`text-xs ${done ? 'line-through opacity-70' : ''}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Indicators of Compromise */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                  <Server className="w-4 h-4" /> Indicators of Compromise (IOCs)
                </h3>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>IP Address:</span> <span className="text-white">192.168.1.104 (Subnet Blocked)</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>File Hash:</span> <span className="text-white">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Attack Vector:</span> <span className="text-cyber-yellow">{activeThreat.type}</span>
                  </div>
                </div>
              </div>

              {/* External References */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Official Intelligence References</h3>
                <div className="flex gap-3">
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${activeThreat.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full text-xs py-2 h-auto flex items-center justify-center gap-2">
                      NVD Database <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                  <a
                    href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full text-xs py-2 h-auto flex items-center justify-center gap-2">
                      CISA Catalog <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
