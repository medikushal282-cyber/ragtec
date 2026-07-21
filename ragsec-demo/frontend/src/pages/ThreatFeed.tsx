import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Search, Filter, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function ThreatFeed() {
  const [threats, setThreats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/threats')
      .then(res => res.json())
      .then(data => setThreats(data))
      .catch(() => console.error("Error fetching threats"));
  }, []);

  const filteredThreats = threats.filter(t => 
    t.id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Threat Intelligence Feed</h1>
          <p className="text-gray-400">Live stream of enterprise security events.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search threats..." 
              className="bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        </div>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-surface/50">
                <th className="p-4 font-semibold text-gray-300">Threat ID</th>
                <th className="p-4 font-semibold text-gray-300">Type</th>
                <th className="p-4 font-semibold text-gray-300">Severity</th>
                <th className="p-4 font-semibold text-gray-300">Date</th>
                <th className="p-4 font-semibold text-gray-300">Source</th>
                <th className="p-4 font-semibold text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredThreats.length > 0 ? filteredThreats.map((threat) => {
                const isCritical = threat.severity === 'Critical';
                const isZeroDay = threat.type === 'Zero-Day';
                
                return (
                  <tr 
                    key={threat.id} 
                    className={`hover:bg-white/5 transition-colors ${isCritical || isZeroDay ? 'bg-red-500/5' : ''}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-mono font-medium">
                        {isCritical && <ShieldAlert className="w-4 h-4 text-critical" />}
                        <span className={isCritical ? 'text-critical' : isZeroDay ? 'text-primary' : 'text-white'}>
                          {threat.id}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{threat.type}</td>
                    <td className="p-4">
                      <Badge variant={threat.severity.toLowerCase() as any}>
                        {threat.severity}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(threat.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">{threat.source}</td>
                    <td className="p-4">
                      <Badge variant={threat.status === 'Active' ? 'critical' : threat.status === 'Mitigated' ? 'low' : 'default'}>
                        {threat.status}
                      </Badge>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No threats found. Ensure backend is running.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
