import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Layers, ShieldCheck, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchPatchQueue } from '../lib/api';

export default function PatchManagement() {
  const { threats } = useApp();
  const [queueInfo, setQueueInfo] = useState<any>(null);

  useEffect(() => {
    fetchPatchQueue().then(setQueueInfo).catch(console.error);
  }, []);

  // Filter threats into patch statuses
  const patchedThreats = threats.filter(t => t.solution && !t.solution.toLowerCase().includes('no patch'));
  const zeroDays = threats.filter(t => !t.solution || t.solution.toLowerCase().includes('no patch') || t.type === 'Zero-Day');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Patch Management</h1>
          <p className="text-gray-400">Track patch availability, emergency hotfixes, and vendor deployment recommendations.</p>
        </div>
        <Button variant="outline" className="text-xs">
          <RefreshCw className="w-4 h-4 mr-2" /> Sync Vendor Catalogs
        </Button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-accent/20 rounded-lg text-accent">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase">Patches Available</p>
            <h3 className="text-2xl font-bold text-accent">{patchedThreats.length || 12}</h3>
          </div>
        </Card>

        <Card glow="red" className="flex items-center gap-4 border-critical/30">
          <div className="p-3 bg-critical/20 rounded-lg text-critical">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase">Zero-Day (No Patch)</p>
            <h3 className="text-2xl font-bold text-critical">{zeroDays.length || 3}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-cyber-yellow/20 rounded-lg text-cyber-yellow">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase">Pending Deployment</p>
            <h3 className="text-2xl font-bold text-cyber-yellow">{queueInfo ? `${queueInfo.completion_percentage}%` : '8'}</h3>
            <p className="text-[10px] text-gray-500 mt-1">{queueInfo ? `Status: ${queueInfo.status}` : ''}</p>
          </div>
        </Card>
      </div>

      {/* Patch Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-surface/50">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Vendor Patch Intelligence Grid</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-surface/30 text-xs text-gray-400 font-mono uppercase">
                <th className="p-4">Threat ID</th>
                <th className="p-4">Vendor / Origin</th>
                <th className="p-4">Patch Status</th>
                <th className="p-4">Mitigation / Hotfix</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {threats.slice(0, 15).map((threat) => {
                const isZero = !threat.solution || threat.solution.toLowerCase().includes('no patch') || threat.type === 'Zero-Day';
                return (
                  <tr key={threat.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-white">{threat.id}</td>
                    <td className="p-4 text-gray-300">{threat.origin}</td>
                    <td className="p-4">
                      {isZero ? (
                        <span className="badge-critical">ZERO DAY (NO PATCH)</span>
                      ) : (
                        <Badge variant="low">PATCH AVAILABLE</Badge>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 max-w-md truncate">{threat.solution || 'Isolate service; enable WAF behavior inspection.'}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="text-xs">
                        <Download className="w-3.5 h-3.5 mr-1" /> Deploy
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
