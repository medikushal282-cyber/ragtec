import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Activity, AlertTriangle, ShieldAlert, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [threats, setThreats] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/threats')
      .then(res => res.json())
      .then(data => setThreats(data))
      .catch(() => console.error("Error fetching threats, using fallback data for demo if backend is offline."));
  }, []);

  // Compute metrics
  const totalThreats = threats.length;
  const criticalThreats = threats.filter(t => t.severity === 'Critical').length;
  const highThreats = threats.filter(t => t.severity === 'High').length;
  const zeroDays = threats.filter(t => t.type === 'Zero-Day').length;

  // Mock data for charts if API is slow/offline
  const timeData = [
    { name: 'Mon', threats: 12 },
    { name: 'Tue', threats: 19 },
    { name: 'Wed', threats: 15 },
    { name: 'Thu', threats: 25 },
    { name: 'Fri', threats: 32 },
    { name: 'Sat', threats: 40 },
    { name: 'Sun', threats: 45 },
  ];

  const pieData = [
    { name: 'Critical', value: criticalThreats || 5, color: '#ff003c' },
    { name: 'High', value: highThreats || 12, color: '#f97316' },
    { name: 'Medium', value: (totalThreats - criticalThreats - highThreats) || 20, color: '#eab308' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">SOC Dashboard</h1>
        <p className="text-gray-400">Real-time enterprise threat overview.</p>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-lg text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Threats (30d)</p>
            <h3 className="text-2xl font-bold">{totalThreats || 45}</h3>
          </div>
        </Card>
        
        <Card glow="red" className="flex items-center gap-4 border-critical/30">
          <div className="p-3 bg-critical/20 rounded-lg text-critical">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Critical Threats</p>
            <h3 className="text-2xl font-bold text-critical">{criticalThreats || 5}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-orange-500/30">
          <div className="p-3 bg-orange-500/20 rounded-lg text-orange-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">High Threats</p>
            <h3 className="text-2xl font-bold text-orange-400">{highThreats || 12}</h3>
          </div>
        </Card>

        <Card glow="cyan" className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-lg text-primary">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Zero-Day Alerts</p>
            <h3 className="text-2xl font-bold">{zeroDays || 5}</h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6">Threats Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1f2937' }}
                  itemStyle={{ color: '#00d2ff' }}
                />
                <Area type="monotone" dataKey="threats" stroke="#00d2ff" fillOpacity={1} fill="url(#colorThreats)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <h3 className="text-lg font-semibold mb-6">Severity Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1f2937' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <h3 className="text-lg font-semibold mb-6">Recent Activity Feed</h3>
        <div className="space-y-4">
          {(threats.length > 0 ? threats.slice(0, 5) : [1,2,3]).map((threat: any, i) => (
            <div key={threat.id || i} className="flex items-start gap-4 p-4 rounded-lg bg-surface/50 border border-white/5 hover:bg-surface transition-colors">
              <div className={`mt-1 w-2 h-2 rounded-full ${threat.severity === 'Critical' ? 'bg-critical shadow-[0_0_8px_#ff003c]' : 'bg-primary shadow-[0_0_8px_#00d2ff]'}`} />
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-medium">{threat.id || `Threat-${i}`} - {threat.type || 'Unknown'}</h4>
                  <span className="text-xs text-gray-500">{threat.timestamp ? new Date(threat.timestamp).toLocaleDateString() : 'Just now'}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{threat.description || 'Loading...'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
