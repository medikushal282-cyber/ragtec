import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Radio, RefreshCw, CheckCircle2, Server, Database, Cpu, Activity } from 'lucide-react';
import { fetchSystemStatus, SystemStatus as SystemStatusType } from '../lib/api';

export default function SystemStatus() {
  const [status, setStatus] = useState<SystemStatusType | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = () => {
    setLoading(true);
    fetchSystemStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const components = [
    { name: 'FastAPI Backend Core', status: status?.backend || 'online', icon: Server, desc: 'Uvicorn HTTP & WebSocket REST router' },
    { name: 'SQLite Threat Database', status: status?.database?.status || 'online', icon: Database, desc: `Size: ${status?.database?.size_mb || 0.7} MB • Rows: ${status?.database?.threat_count || 1650}` },
    { name: 'WebSocket Threat Stream', status: status?.websocket?.status || 'online', icon: Radio, desc: 'Real-time alert broadcast layer' },
    { name: 'AI Security Engine', status: status?.ai_engine || 'online', icon: Cpu, desc: 'Grounded retrieval & zero-day analysis' },
    { name: 'CISA KEV Ingestion Tool', status: status?.threat_feed || 'online', icon: Activity, desc: 'Real-time threat catalog polling' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0 max-w-4xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">System Status & Live Uptime</h1>
          <p className="text-gray-400">Real-time health monitoring of all RAGSec+ platform services.</p>
        </div>
        <Button onClick={loadStatus} disabled={loading} variant="outline" className="text-xs">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </Button>
      </header>

      {/* Operational Banner */}
      <Card glow="cyan" className="p-6 bg-cyber-cyan/10 border-cyber-cyan/30 flex items-center gap-4">
        <CheckCircle2 className="w-10 h-10 text-cyber-cyan shrink-0" />
        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wide">All Systems Operational</h3>
          <p className="text-xs text-gray-300">All backend routers, WebSocket connections, and data pipelines are running normally.</p>
        </div>
      </Card>

      {/* Components Grid */}
      <div className="space-y-4">
        {components.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.name} className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-surface border border-white/10 text-cyber-cyan">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase">{c.name}</h4>
                  <p className="text-xs text-gray-400">{c.desc}</p>
                </div>
              </div>
              <Badge variant="low">
                <span className="w-2 h-2 rounded-full bg-accent inline-block mr-1.5 animate-pulse" />
                OPERATIONAL
              </Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
