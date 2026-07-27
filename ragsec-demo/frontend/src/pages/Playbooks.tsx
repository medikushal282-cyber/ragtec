import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ShieldCheck, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, FileText, Lock } from 'lucide-react';
import { fetchPlaybooks } from '../lib/api';

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>('pb-ransomware');

  useEffect(() => {
    fetchPlaybooks().then(setPlaybooks).catch(() => {});
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Incident Response Playbooks</h1>
        <p className="text-gray-400">NIST SP 800-61 aligned response workflows for enterprise threats.</p>
      </header>

      <div className="space-y-6">
        {playbooks.map((pb) => {
          const isExpanded = expandedId === pb.id;
          return (
            <Card key={pb.id} className="p-6 transition-all duration-300">
              <div
                onClick={() => toggleExpand(pb.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white tracking-wide">{pb.title}</h3>
                      <Badge variant="critical">{pb.severity}</Badge>
                      <span className="mono text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">{pb.category}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pb.description}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg bg-surface border border-white/10 text-gray-400 hover:text-white">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-8 pt-6 border-t border-white/10 space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(pb.steps || {}).map(([phase, steps]: [string, any]) => (
                      <div key={phase} className="p-4 rounded-xl bg-surface/50 border border-white/5 space-y-3">
                        <h4 className="text-xs font-bold text-cyber-cyan uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> {phase} Phase
                        </h4>
                        <ul className="space-y-2 text-xs text-gray-300">
                          {Array.isArray(steps) && steps.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-cyber-cyan font-mono">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <Button variant="outline" className="text-xs">Download Playbook PDF</Button>
                    <Button variant="default" className="text-xs">Execute Automated Workflow</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
