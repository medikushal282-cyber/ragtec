import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Search, Filter, ShieldAlert, Download, Star, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ThreatFeed() {
  const { threats, openDrawer } = useApp();
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtering
  const filteredThreats = threats.filter((t) => {
    const matchesSearch =
      t.id?.toLowerCase().includes(search.toLowerCase()) ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.type?.toLowerCase().includes(search.toLowerCase()) ||
      t.origin?.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = selectedSeverity === 'ALL' || t.severity?.toUpperCase() === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  // Pagination
  const totalPages = Math.ceil(filteredThreats.length / pageSize) || 1;
  const paginatedThreats = filteredThreats.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Export CSV
  const exportCSV = () => {
    const headers = ['Threat ID', 'Name', 'Type', 'Severity', 'Origin', 'Date', 'Mitigation'];
    const rows = filteredThreats.map((t) => [
      t.id,
      `"${t.name || ''}"`,
      `"${t.type || ''}"`,
      t.severity,
      `"${t.origin || ''}"`,
      t.ts || '',
      `"${t.solution || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RAGSec_Threat_Feed_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const exportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredThreats, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `RAGSec_Threat_Feed_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Threat Intelligence Feed</h1>
          <p className="text-gray-400">Enterprise data grid of CISA Known Exploited Vulnerabilities and real-time alerts.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportCSV} variant="outline" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
          <Button onClick={exportJSON} variant="outline" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export JSON
          </Button>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search CVE ID, Vendor, or Threat Type..."
            className="w-full bg-surface border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-cyber-cyan"
          />
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="mono text-xs text-gray-500 mr-2">SEVERITY:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => {
                setSelectedSeverity(sev);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                selectedSeverity === sev
                  ? 'bg-cyber-cyan text-cyber-black glow-cyan'
                  : 'bg-surface border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Threat Grid Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-surface/50 text-xs text-gray-400 font-mono uppercase">
                <th className="p-4 w-12 text-center">★</th>
                <th className="p-4">Threat ID</th>
                <th className="p-4">Name / Summary</th>
                <th className="p-4">Vector Type</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Origin / Vendor</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {paginatedThreats.length > 0 ? (
                paginatedThreats.map((threat) => {
                  const isCritical = threat.severity?.toLowerCase() === 'critical';
                  const isStarred = bookmarked[threat.id];
                  return (
                    <tr
                      key={threat.id}
                      onClick={() => openDrawer(threat)}
                      className={`hover:bg-cyber-cyan/10 transition-colors cursor-pointer group ${
                        isCritical ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => toggleBookmark(threat.id, e)}
                          className={`hover:text-yellow-400 transition-colors ${isStarred ? 'text-yellow-400' : 'text-gray-600'}`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>
                      <td className="p-4 font-mono font-bold text-white group-hover:text-cyber-cyan">{threat.id}</td>
                      <td className="p-4 font-medium text-gray-300 max-w-xs truncate" title={threat.name}>
                        {threat.name || threat.type}
                      </td>
                      <td className="p-4 text-gray-400">{threat.type}</td>
                      <td className="p-4">
                        <Badge variant={isCritical ? 'critical' : 'default'}>{threat.severity}</Badge>
                      </td>
                      <td className="p-4 text-gray-400">{threat.origin}</td>
                      <td className="p-4 text-gray-500 font-mono">{threat.ts || 'Recent'}</td>
                      <td className="p-4 text-right">
                        <span className="text-cyber-cyan group-hover:translate-x-1 inline-block transition-transform">
                          Investigate →
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    No matching threats found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/10 bg-surface/50 flex items-center justify-between text-xs font-mono text-gray-400">
          <span>
            Showing {paginatedThreats.length} of {filteredThreats.length} threats
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded bg-surface border border-white/10 disabled:opacity-30 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded bg-surface border border-white/10 disabled:opacity-30 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
