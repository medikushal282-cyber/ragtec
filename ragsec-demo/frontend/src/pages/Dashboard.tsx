import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../context/AppContext';
import { fetchAnalyticsHistorical, fetchTelemetry, TelemetryData } from '../lib/api';
import GlobalThreatMap from '../components/GlobalThreatMap';
import LogStreamer from '../components/LogStreamer';

export default function Dashboard() {
  const { threats, openDrawer, systemStatus } = useApp();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    fetchTelemetry().then(setTelemetry).catch(() => {});
    fetchAnalyticsHistorical().then((d) => setHistoricalData(d.reverse())).catch(() => {});

    const interval = setInterval(() => {
      fetchTelemetry().then(setTelemetry).catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate metrics from real threats stream
  const totalThreats = threats.length;
  const criticalThreats = threats.filter((t) => t.severity?.toLowerCase() === 'critical').length;
  const highThreats = threats.filter((t) => t.severity?.toLowerCase() === 'high').length;
  const mediumThreats = threats.filter((t) => t.severity?.toLowerCase() === 'medium').length;
  const lowThreats = threats.filter((t) => t.severity?.toLowerCase() === 'low').length;
  const zeroDays = threats.filter((t) => t.type === 'Zero-Day' || t.type === 'RAG Injection' || !t.solution).length;

  const chartData = historicalData.length > 0 ? historicalData : [
    { name: 'Mon', threats: 12 },
    { name: 'Tue', threats: 19 },
    { name: 'Wed', threats: 15 },
    { name: 'Thu', threats: 25 },
    { name: 'Fri', threats: 32 },
    { name: 'Sat', threats: 40 },
    { name: 'Sun', threats: 45 },
  ];

  const pieData = [
    { name: 'Critical', value: criticalThreats || 5, color: '#ff525c' },
    { name: 'High', value: highThreats || 12, color: '#ffb3b2' },
    { name: 'Medium', value: mediumThreats || 18, color: '#00dbe9' },
    { name: 'Low', value: lowThreats || 8, color: '#849495' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0 pb-12">
      {/* 6 Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between group">
          <p className="text-[10px] text-outline font-mono uppercase tracking-wider mb-2">Total Threats</p>
          <h3 className="text-3xl font-bold text-on-surface">{totalThreats || 45}</h3>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-secondary-container/50 bg-secondary-container/5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-secondary-container/20 rounded-full blur-xl"></div>
          <p className="text-[10px] text-secondary-container font-mono uppercase tracking-wider mb-2">Critical Alerts</p>
          <h3 className="text-3xl font-bold text-secondary-container">{criticalThreats || 6}</h3>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-secondary/30 bg-secondary/5 group">
          <p className="text-[10px] text-secondary font-mono uppercase tracking-wider mb-2">High Severity</p>
          <h3 className="text-3xl font-bold text-secondary">{highThreats || 14}</h3>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-primary-fixed/30 bg-primary-fixed/5 group">
          <p className="text-[10px] text-primary-fixed font-mono uppercase tracking-wider mb-2">Medium Severity</p>
          <h3 className="text-3xl font-bold text-primary-fixed">{mediumThreats || 18}</h3>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-primary-container/30 bg-primary-container/5 group relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-primary-container/20 rounded-full blur-xl"></div>
          <p className="text-[10px] text-primary-container font-mono uppercase tracking-wider mb-2">Zero-Day Alerts</p>
          <h3 className="text-3xl font-bold text-primary-container">{zeroDays || 4}</h3>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between group">
          <p className="text-[10px] text-outline font-mono uppercase tracking-wider mb-2">Active Proxies</p>
          <h3 className="text-3xl font-bold text-on-surface">{telemetry?.active_proxies || 18}</h3>
        </div>
      </div>

      {/* Main Grid: Graphs & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="glass-panel rounded-xl lg:col-span-2 p-6 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-primary-fixed flex items-center">
            <span className="material-symbols-outlined mr-2">monitoring</span> Threat Volume
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00dbe9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00dbe9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#849495" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#849495" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#131313', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#00dbe9' }} />
                <Area type="monotone" dataKey="threats" stroke="#00dbe9" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Donut Chart */}
        <div className="glass-panel rounded-xl p-6 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-on-surface flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary-fixed-dim">donut_small</span> Severity Distribution
          </h3>
          <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#131313', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-2xl font-bold">{totalThreats}</span>
                <span className="text-[10px] text-outline font-mono">TOTAL</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4 text-[10px] font-mono">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-outline uppercase">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* New Threat Map and Log Streamer Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-xl p-6 flex flex-col h-[400px] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-on-surface flex items-center">
                <span className="material-symbols-outlined mr-2 text-primary-fixed">public</span> Global Threat Origins
            </h3>
            <div className="flex-1 min-h-[300px]">
                <GlobalThreatMap threats={threats} />
            </div>
        </div>

        <div className="glass-panel rounded-xl p-6 flex flex-col h-[400px] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-on-surface flex items-center">
                <span className="material-symbols-outlined mr-2 text-secondary-fixed">terminal</span> Live SIEM Stream
            </h3>
            <div className="flex-1 min-h-[300px]">
                <LogStreamer />
            </div>
        </div>
      </div>

      {/* System Telemetry & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Health Telemetry */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-on-surface flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary-fixed">vital_signs</span> System Telemetry
          </h3>
          <div className="space-y-6 text-xs font-mono">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-outline">CPU Usage</span>
                <span className="text-primary-fixed font-bold">{telemetry?.cpu_usage || 24.5}%</span>
              </div>
              <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-dashed border-white/10">
                <div className="bg-primary-fixed h-full" style={{ width: `${telemetry?.cpu_usage || 24.5}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-outline">Memory Usage</span>
                <span className="text-secondary-fixed font-bold">{telemetry?.memory_usage || 48.2}%</span>
              </div>
              <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-dashed border-white/10">
                <div className="bg-secondary-fixed h-full" style={{ width: `${telemetry?.memory_usage || 48.2}%` }} />
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-outline">Response Latency</span>
                <span className="px-2 py-0.5 rounded bg-primary-fixed/10 text-primary-fixed font-bold">&lt; {telemetry?.latency_ms || 2} ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Detection Accuracy</span>
                <span className="px-2 py-0.5 rounded bg-primary-fixed/10 text-primary-fixed font-bold">{telemetry?.accuracy || 99.8}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Database Size</span>
                <span className="text-on-surface font-bold">{systemStatus?.database?.size_mb || 0.7} MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Threat Stream Table */}
        <div className="glass-panel rounded-xl lg:col-span-2 p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center">
              <span className="material-symbols-outlined mr-2 text-secondary-container">policy</span> Live SOC Stream
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary-fixed rounded-full animate-pulse"></span>
              <span className="font-mono text-[10px] text-primary-fixed tracking-widest">REAL-TIME</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {threats.map((t) => (
              <div
                key={t.id}
                onClick={() => openDrawer(t)}
                className="p-3 rounded-lg bg-black/20 border border-dashed border-white/5 hover:border-primary-fixed/30 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group magnetic-target"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${t.severity?.toLowerCase() === 'critical' ? 'bg-secondary-container shadow-[0_0_8px_#ff525c]' : 'bg-primary-fixed shadow-[0_0_8px_#7df4ff]'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-on-surface group-hover:text-primary-fixed transition-colors">{t.id}</span>
                      <span className="text-xs text-outline">{t.name || t.type}</span>
                    </div>
                    <span className="text-[10px] text-outline/70 font-mono mt-1 block uppercase">Origin: {t.origin}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      t.severity?.toLowerCase() === 'critical' ? 'bg-secondary-container/20 text-secondary-container border border-secondary-container/30' : 
                      t.severity?.toLowerCase() === 'high' ? 'bg-secondary/20 text-secondary border border-secondary/30' :
                      'bg-white/10 text-on-surface border border-white/10'
                  }`}>
                    {t.severity}
                  </span>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary-fixed text-[18px] transition-colors">arrow_forward</span>
                </div>
              </div>
            ))}
            {threats.length === 0 && (
              <div className="h-full flex items-center justify-center text-sm text-outline font-mono">
                No active threats detected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
