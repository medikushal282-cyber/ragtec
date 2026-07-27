import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldAlert, TrendingUp, Clock, Target, Layers } from 'lucide-react';
import { fetchAnalyticsHistorical, fetchAnalyticsTrending, fetchAnalyticsVendors } from '../lib/api';

export default function Analytics() {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [trendingData, setTrendingData] = useState<any[]>([]);
  const [vendorData, setVendorData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsHistorical().then((d) => setHistoricalData(d.reverse())).catch(() => {});
    fetchAnalyticsTrending().then(setTrendingData).catch(() => {});
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Executive Analytics & Threat Trends</h1>
        <p className="text-gray-400">High-level telemetry, MTTR metrics, and vulnerability forecasting.</p>
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
        <Card>
          <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
            <Activity className="w-5 h-5" /> 7-Day Threat Acceleration
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
        <Card>
          <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider text-cyber-yellow flex items-center gap-2">
            <Layers className="w-5 h-5" /> Top Targeted Vendor Ecosystems
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1f2937' }} />
                <Bar dataKey="threats" fill="#fadf00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
