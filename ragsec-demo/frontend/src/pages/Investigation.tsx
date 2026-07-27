import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Database, ShieldAlert, Cpu, Server, Activity, ArrowRight, CheckCircle2, AlertOctagon, Download, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { blockIoc, triggerMitigation, downloadReport } from '../lib/api';

export default function Investigation() {
  const { threats, openDrawer } = useApp();
  const [selectedThreat, setSelectedThreat] = useState<any>(threats[0] || {
    id: 'CVE-2026-9999',
    name: 'RAG Pipeline Vector Poisoning RCE',
    type: 'Vector Poisoning',
    origin: 'CISA KEV',
    severity: 'Critical',
    solution: 'Isolate vector storage cluster and flush transient cache.',
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleBlockIOC = async () => {
    setLoadingAction('block');
    try {
      await blockIoc('10.0.4.15', selectedThreat.id);
      alert(`Successfully blocked IOC 10.0.4.15 for Threat ${selectedThreat.id}`);
    } catch (err) {
      alert('Failed to block IOC');
    }
    setLoadingAction(null);
  };

  const handleMitigate = async () => {
    setLoadingAction('mitigate');
    try {
      await triggerMitigation(selectedThreat.id);
      alert(`Mitigation playbook triggered successfully for ${selectedThreat.id}!`);
    } catch (err) {
      alert('Failed to trigger mitigation');
    }
    setLoadingAction(null);
  };

  const handleExport = async () => {
    setLoadingAction('export');
    try {
      await downloadReport(selectedThreat.id);
    } catch (err) {
      alert('Failed to export report');
    }
    setLoadingAction(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Deep Threat Investigation Workflow</h1>
          <p className="text-gray-400">Forensics analysis, kill chain mapping, and IOC correlation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!!loadingAction}>
            <Download className="w-4 h-4 mr-2" />
            {loadingAction === 'export' ? 'Exporting...' : 'Export Report'}
          </Button>
          <Button variant="default" onClick={() => openDrawer(selectedThreat)}>
            Open Investigation Drawer →
          </Button>
        </div>
      </header>

      {/* Select Threat Dropdown Bar */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-cyber-cyan" />
          <span className="text-xs font-mono uppercase text-gray-400">Active Investigation Subject:</span>
          <select
            value={selectedThreat.id}
            onChange={(e) => {
              const match = threats.find((t) => t.id === e.target.value);
              if (match) setSelectedThreat(match);
            }}
            className="bg-black/50 border border-white/10 rounded px-3 py-1.5 text-xs font-bold text-white font-mono outline-none focus:border-cyber-cyan"
          >
            {threats.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} - {t.name || t.type} ({t.severity})
              </option>
            ))}
          </select>
        </div>
        <Badge variant={selectedThreat.severity?.toLowerCase() === 'critical' ? 'critical' : 'default'}>
          {selectedThreat.severity}
        </Badge>
      </Card>

      {/* Kill Chain Stage Flow */}
      <Card>
        <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-cyan mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Cyber Kill Chain Progression
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
          {[
            { step: '01', title: 'Reconnaissance', desc: 'Port Scanning & Vector Probe', active: true },
            { step: '02', title: 'Weaponization', desc: 'Crafted Indirect Prompt Payload', active: true },
            { step: '03', title: 'Delivery', desc: 'Unauthenticated API Query', active: true },
            { step: '04', title: 'Exploitation', desc: 'Embedding Poisoning', active: selectedThreat.severity?.toLowerCase() === 'critical' },
            { step: '05', title: 'Actions on Objective', desc: 'Context Memory Exfiltration', active: false },
          ].map((s, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border ${
                s.active ? 'bg-cyber-cyan/10 border-cyber-cyan/40 text-white' : 'bg-surface/30 border-white/5 text-gray-500'
              }`}
            >
              <span className="mono text-xs text-cyber-cyan block mb-1">STAGE {s.step}</span>
              <h4 className="font-bold text-xs uppercase mb-1">{s.title}</h4>
              <p className="text-[10px] text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Forensic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Evidence & IOC Analysis */}
        <Card>
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-yellow mb-4 flex items-center gap-2">
            <Server className="w-4 h-4" /> Evidence & Indicators of Compromise
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-black/40 rounded border border-white/5 flex justify-between">
              <span className="text-gray-400">Threat Vector:</span>
              <span className="text-cyber-cyan font-bold">{selectedThreat.type}</span>
            </div>
            <div className="p-3 bg-black/40 rounded border border-white/5 flex justify-between">
              <span className="text-gray-400">Target Origin:</span>
              <span className="text-white">{selectedThreat.origin}</span>
            </div>
            <div className="p-3 bg-black/40 rounded border border-white/5 flex justify-between">
              <span className="text-gray-400">CISA KEV Status:</span>
              <span className="text-accent font-bold">Catalog Verified</span>
            </div>
            <div className="p-3 bg-black/40 rounded border border-white/5 flex justify-between">
              <span className="text-gray-400">Mitigation:</span>
              <span className="text-gray-300 truncate max-w-xs">{selectedThreat.solution || 'Isolate host service'}</span>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50" onClick={handleBlockIOC} disabled={!!loadingAction}>
              <Shield className="w-4 h-4 mr-2" />
              {loadingAction === 'block' ? 'Blocking...' : 'Block IOC (10.0.4.15)'}
            </Button>
            <Button variant="default" className="flex-1 bg-cyber-cyan text-black hover:bg-cyber-cyan/80" onClick={handleMitigate} disabled={!!loadingAction}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {loadingAction === 'mitigate' ? 'Mitigating...' : 'Trigger AI Mitigation'}
            </Button>
          </div>
        </Card>

        {/* MITRE Mapping */}
        <Card>
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-pink mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> MITRE ATT&CK Mapping
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface/50 rounded border border-white/5">
              <span className="mono text-cyber-pink font-bold block mb-1">T1190 - Exploit Public-Facing Application</span>
              <p className="text-gray-400">Attacker leverages unauthenticated endpoint to inject adversarial prompt context.</p>
            </div>
            <div className="p-3 bg-surface/50 rounded border border-white/5">
              <span className="mono text-cyber-pink font-bold block mb-1">T1059 - Command & Scripting Interpreter</span>
              <p className="text-gray-400">Execution of arbitrary commands within the LLM agent container sandbox.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
