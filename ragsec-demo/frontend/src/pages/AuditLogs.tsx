import React, { useEffect, useState } from 'react';
import { Shield, Clock, FileText, Activity, Database, CheckSquare } from 'lucide-react';

interface AuditLog {
  id: string;
  user: string;
  action_type: string;
  resource: string;
  details: string;
  timestamp: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/system/audit');
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (e) {
        console.error("Failed to fetch audit logs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'SCAN': return <Activity className="w-4 h-4 text-cyber-cyan" />;
      case 'RETRIEVE': return <Database className="w-4 h-4 text-purple-400" />;
      case 'INGEST': return <CheckSquare className="w-4 h-4 text-green-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-[#05070a] text-gray-300">
      <div className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/30">
          <Shield className="w-5 h-5 text-cyber-cyan" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Compliance & Audit Trail</h1>
          <p className="text-sm text-gray-400 font-mono mt-1">Immutable SOC action logs in accordance with ISO27001 / GDPR compliance.</p>
        </div>
      </div>

      <div className="bg-[#0a0d14] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono whitespace-nowrap">
            <thead className="bg-[#05070a] text-gray-500 uppercase text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
                      Loading Secure Audit Logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-gray-500 text-xs flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action_type)}
                        <span className="font-semibold text-gray-300">{log.action_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 truncate max-w-xs">{log.resource}</td>
                    <td className="px-6 py-4 text-gray-400">{log.user}</td>
                    <td className="px-6 py-4 text-gray-400 truncate max-w-md" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
