import React, { useState } from 'react';
import { Shield, Target, Play, Activity, Server, Mail, Search, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function AdvancedScanner() {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('Malware');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  const handleScan = async () => {
    if (!target) return;
    setScanning(true);
    setResults(null);
    
    try {
      const res = await fetch('http://localhost:8000/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, scan_type: scanType })
      });
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const scanTypes = [
    { id: 'Malware', icon: <Search className="w-4 h-4" />, desc: 'Static/Dynamic File Analysis' },
    { id: 'Network', icon: <Activity className="w-4 h-4" />, desc: 'PCAP Traffic Analysis' },
    { id: 'Phishing', icon: <Mail className="w-4 h-4" />, desc: 'Email Header/URL Analysis' },
    { id: 'Vulnerability', icon: <Server className="w-4 h-4" />, desc: 'SBOM/Dependency Audit' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-[#05070a] text-gray-300">
      <div className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/30">
          <Target className="w-5 h-5 text-cyber-cyan" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Advanced Threat Scanner</h1>
          <p className="text-sm text-gray-400 font-mono mt-1">Multi-vector analysis engine for Malware, Network, Phishing, and Vulnerabilities.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0a0d14] border border-white/5 rounded-xl p-5 shadow-2xl">
            <h2 className="text-sm font-bold uppercase text-gray-400 border-b border-white/10 pb-2 mb-4">Scanner Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-gray-500 mb-1 block">Scan Target (IP, URL, or File)</label>
                <input 
                  type="text" 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. 192.168.1.100 or http://sus.com"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyber-cyan transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-gray-500 mb-2 block">Analysis Engine Vector</label>
                <div className="space-y-2">
                  {scanTypes.map(st => (
                    <button
                      key={st.id}
                      onClick={() => setScanType(st.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        scanType === st.id 
                          ? 'bg-cyber-cyan/10 border-cyber-cyan/40 text-cyber-cyan' 
                          : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {st.icon}
                      <div>
                        <div className="font-bold text-sm">{st.id}</div>
                        <div className="text-[10px] opacity-70 font-mono">{st.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={scanning || !target}
                className="w-full flex items-center justify-center gap-2 bg-cyber-cyan text-black font-bold uppercase text-sm py-3 rounded-lg hover:bg-cyber-cyan/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                {scanning ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Engage Scanner
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {results ? (
            <div className="bg-[#0a0d14] border border-white/5 rounded-xl overflow-hidden shadow-2xl h-full flex flex-col">
              <div className="p-5 border-b border-white/10 bg-black/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyber-cyan" />
                  <h2 className="font-bold text-white tracking-tight">Analysis Report</h2>
                </div>
                <div className="text-xs font-mono text-gray-400">
                  Engine: <span className="text-cyber-cyan">{results.scan_type}</span>
                </div>
              </div>
              
              <div className="p-6 flex-1 space-y-6">
                <div className="text-sm text-gray-300 font-mono">
                  <span className="text-gray-500">Target Analyzed:</span> {results.target}
                </div>
                
                <div className="space-y-3">
                  {results.findings && results.findings.map((finding: any, i: number) => (
                    <div key={i} className={`p-4 rounded-lg border ${
                      finding.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30' :
                      finding.severity === 'High' ? 'bg-orange-500/10 border-orange-500/30' :
                      finding.severity === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-green-500/10 border-green-500/30'
                    }`}>
                      <div className="flex items-start gap-3">
                        {finding.severity === 'Critical' || finding.severity === 'High' ? (
                          <AlertOctagon className={`w-5 h-5 ${finding.severity === 'Critical' ? 'text-red-400' : 'text-orange-400'}`} />
                        ) : finding.severity === 'Medium' ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        <div>
                          <div className={`font-bold text-sm ${
                            finding.severity === 'Critical' ? 'text-red-400' :
                            finding.severity === 'High' ? 'text-orange-400' :
                            finding.severity === 'Medium' ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            [{finding.severity.toUpperCase()}] {finding.threat}
                          </div>
                          <p className="text-sm text-gray-300 mt-1">{finding.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0d14] border border-white/5 rounded-xl shadow-2xl h-full flex flex-col items-center justify-center p-12 text-center border-dashed border-white/10">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-300 mb-2">Awaiting Target</h3>
              <p className="text-sm text-gray-500 max-w-md font-mono">
                Enter an IP, URL, or file path and select an analysis vector to begin deep-packet inspection, static analysis, or vulnerability scanning.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
