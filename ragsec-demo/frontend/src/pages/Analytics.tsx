import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, TrendingUp, Target, Layers, X, ShieldAlert } from 'lucide-react';
import { fetchAnalyticsHistorical, fetchAnalyticsVendors } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function Analytics() {
  const { threats, openDrawer } = useApp();
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [vendorData, setVendorData] = useState<any[]>([]);
  const [selectedDrilldown, setSelectedDrilldown] = useState<{ title: string; filterKey: string; filterVal: string } | null>(null);

  useEffect(() => {
    fetchAnalyticsHistorical().then((d) => setHistoricalData(d.reverse())).catch(() => {});
    fetchAnalyticsVendors().then(setVendorData).catch(() => {});
  }, []);

  const chartData = historicalData.length > 0 ? historicalData : [
    { name: 'Mon', threats: 14 },
    { name: 'Tue', threats: 22 },
    { name: 'Wed', threats: 18 },
    { name: 'Thu', threats: 29 },
    { name: 'Fri', threats: 35 },
    { name: 'Sat', threats: 42 },
    { name: 'Sun', threats: 48 },
  ];

  const vendorChartData = vendorData.length > 0 ? vendorData : [
    { name: 'Microsoft', threats: 42 },
    { name: 'Google', threats: 28 },
    { name: 'Apple', threats: 19 },
    { name: 'Cisco', threats: 15 },
    { name: 'Linux', threats: 12 },
  ];

  const handleBarClick = (data: any) => {
    if (data && data.name) {
      setSelectedDrilldown({
        title: `Threats Affecting ${data.name} Ecosystem`,
        filterKey: 'vendor',
        filterVal: data.name,
      });
    }
  };

  const handleAreaClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const dayName = data.activePayload[0].payload.name;
      setSelectedDrilldown({
        title: `Telemetry Breakdown for ${dayName}`,
        filterKey: 'day',
        filterVal: dayName,
      });
    }
  };

  const drilldownThreats = selectedDrilldown
    ? threats.filter((t) =>
        selectedDrilldown.filterKey === 'vendor'
          ? t.origin?.toLowerCase().includes(selectedDrilldown.filterVal.toLowerCase()) || t.name?.toLowerCase().includes(selectedDrilldown.filterVal.toLowerCase())
          : true
      )
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Executive Analytics & Threat Trends</h1>
        <p className="text-gray-400">High-level telemetry, MTTR metrics, and vulnerability forecasting. (Click chart elements for deep drilldown)</p>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-cyber-cyan/20 rounded-lg text-cyber-cyan">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase">Mean Time To Detect (MTTD)</p>
            <h3 className="text-2xl font-bold text-white">&lt; 4.2 mins</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-cyber-yellow/20 rounded-lg text-cyber-yellow">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase">Mean Time To Respond (MTTR)</p>
            <h3 className="text-2xl font-bold text-cyber-yellow">12.8 mins</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-cyber-pink/20 rounded-lg text-cyber-pink">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase">Weekly Threat Growth</p>
            <h3 className="text-2xl font-bold text-cyber-pink">+14.2%</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-accent/20 rounded-lg text-accent">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase">Resolution Rate</p>
            <h3 className="text-2xl font-bold text-accent">94.8%</h3>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Threat Volume Over Time */}
        <Card className="hover:border-cyber-cyan/40 transition-colors">
          <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
            <Activity className="w-5 h-5" /> 7-Day Threat Acceleration (Click data point)
          </h3>
          <div className="h-72 cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} onClick={handleAreaClick}>
                <defs>
                  <linearGradient id="colorAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1f2937' }} />
                <Area type="monotone" dataKey="threats" stroke="#00d2ff" strokeWidth={2} fillOpacity={1} fill="url(#colorAnalytics)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Affected Vendors */}
        <Card className="hover:border-cyber-yellow/40 transition-colors">
          <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider text-cyber-yellow flex items-center gap-2">
            <Layers className="w-5 h-5" /> Top Targeted Vendor Ecosystems (Click Bar)
          </h3>
          <div className="h-72 cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1f2937' }} />
                <Bar dataKey="threats" fill="#fadf00" radius={[4, 4, 0, 0]} onClick={handleBarClick} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Drilldown Modal */}
      {selectedDrilldown && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-cyber-cyan/40 rounded-2xl w-full max-w-3xl p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-cyber-cyan" /> {selectedDrilldown.title}
              </h3>
              <button onClick={() => setSelectedDrilldown(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {drilldownThreats.length > 0 ? (
                drilldownThreats.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedDrilldown(null);
                      openDrawer(t);
                    }}
                    className="p-3 bg-black/40 border border-white/10 hover:border-cyber-cyan/40 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <span className="font-mono text-xs text-cyber-cyan font-bold block">{t.id}</span>
                      <span className="text-xs text-white">{t.name || t.type}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      {t.severity}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs font-mono text-gray-500">
                  No direct threats matching filter criteria in current database snapshot.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
