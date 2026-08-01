import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FolderSearch, AlertTriangle, ShieldCheck, Play, Loader2 } from 'lucide-react';
import { API_BASE } from '../lib/utils';

export default function ScannerDashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('demoMode') === 'true');
  const [emulatedFiles, setEmulatedFiles] = useState<string[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  useEffect(() => {
    const handleDemoChange = () => setDemoMode(localStorage.getItem('demoMode') === 'true');
    window.addEventListener('demoModeChanged', handleDemoChange);
    return () => window.removeEventListener('demoModeChanged', handleDemoChange);
  }, []);

  const startScan = async () => {
    setIsScanning(true);
    setError(null);
    setScanResults(null);
    setEmulatedFiles([]);
    setCurrentFileIndex(0);

    if (demoMode) {
      // Local Storage Emulator Mode
      const fakeFiles = [
        'C:\\Windows\\System32\\cmd.exe',
        'C:\\Windows\\System32\\svchost.exe',
        'C:\\Users\\admin\\Documents\\Q3_Financials.pdf',
        'C:\\Program Files\\Nodejs\\node.exe',
        'C:\\Users\\admin\\Downloads\\invoice_urgent.exe',
        'C:\\Windows\\System32\\drivers\\etc\\hosts',
        'C:\\Users\\admin\\AppData\\Local\\Temp\\update_v2.ps1'
      ];
      setEmulatedFiles(fakeFiles);
      
      for (let i = 0; i < fakeFiles.length; i++) {
        setCurrentFileIndex(i);
        await new Promise(r => setTimeout(r, 600)); // Simulate time parsing each file
      }

      setScanResults({
        scanned_directory: 'C:\\Users\\admin\\Downloads',
        findings: [
          {
            file: 'invoice_urgent.exe',
            threat_type: 'Ransomware',
            severity: 'Critical',
            analysis: 'Detected malicious behavioral signature: rapid file encryption patterns and VSS shadow copy deletion attempts.',
            remedy: {
              executive_summary: 'Critical ransomware payload neutralized before execution.',
              technical_analysis: 'The binary attempted to spawn a child powershell process to delete local backup shadows (vssadmin.exe Delete Shadows /All /Quiet).',
              immediate_mitigation: ['Process execution terminated.', 'File quarantined to isolated sandbox.', 'Endpoint isolated from internal network.']
            }
          },
          {
            file: 'update_v2.ps1',
            threat_type: 'Fileless Malware',
            severity: 'High',
            analysis: 'Obfuscated PowerShell script attempting to establish C2 beacon.',
            remedy: {
              executive_summary: 'Unauthorized PowerShell execution prevented.',
              technical_analysis: 'Script contains base64 encoded payload initiating a reverse shell to a known malicious IP.',
              immediate_mitigation: ['Execution blocked by EDR.', 'Script deleted from Temp folder.']
            }
          }
        ]
      });
      setIsScanning(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/scanner/scan-directory`);
      if (!res.ok) throw new Error('Failed to reach backend scanner.');
      const data = await res.json();
      setScanResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FolderSearch className="w-8 h-8 text-cyber-cyan" />
          Local Storage Scanner
        </h1>
        <p className="text-gray-400 mt-2">
          Scans the isolated <code className="bg-white/10 px-1 rounded">sandbox_scan</code> directory for malware signatures and vulnerable dependencies, generating AI mitigations on the fly.
        </p>
      </header>

      <Card className="p-6 bg-surface/40 backdrop-blur-md border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Initiate Scan</h2>
            <p className="text-sm text-gray-400">Run a deep AI-augmented static analysis on local files.</p>
          </div>
          <Button onClick={startScan} disabled={isScanning} className="gap-2 bg-cyber-cyan text-black hover:bg-cyber-cyan/80">
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isScanning ? 'Scanning Directory...' : 'Start Scan'}
          </Button>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </Card>

      {isScanning && demoMode && emulatedFiles.length > 0 && (
        <Card className="p-6 bg-black text-green-500 font-mono text-sm border-dashed border-green-500/30">
          <div className="flex items-center gap-3 mb-2 text-green-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>[EMULATOR] Deep File Inspection in Progress...</span>
          </div>
          <div className="space-y-1 h-32 overflow-hidden relative">
            {emulatedFiles.slice(0, currentFileIndex + 1).map((f, i) => (
              <div key={i} className="opacity-80">
                {">"} Analyzing: {f} ... {i === currentFileIndex ? 'Scanning' : 'OK'}
              </div>
            ))}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black to-transparent pointer-events-none" />
          </div>
        </Card>
      )}

      {scanResults && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Findings in <code className="bg-black/50 px-2 py-1 rounded text-sm text-gray-300">{scanResults.scanned_directory}</code></h3>
          
          {scanResults.findings.length === 0 ? (
            <Card className="p-8 text-center text-gray-400 border-dashed border-white/20 flex flex-col items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
              <p>No threats detected in the scanned directory.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {scanResults.findings.map((finding: any, idx: number) => (
                <Card key={idx} className="p-5 bg-surface/60 border-l-4 border-l-red-500 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h4 className="font-bold text-lg text-white">{finding.file}</h4>
                        <Badge variant={finding.severity === 'Critical' ? 'critical' : 'high'}>{finding.severity}</Badge>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">Type: {finding.threat_type}</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-xs text-gray-300">
                    <span className="text-red-400 font-bold block mb-1">STATIC ANALYSIS:</span>
                    {finding.analysis}
                  </div>

                  {finding.remedy && (
                    <div className="bg-cyber-cyan/10 p-4 rounded-lg border border-cyber-cyan/30 mt-4 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-cyber-cyan mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        AI MITIGATION PLAYBOOK
                      </div>
                      
                      <div className="text-sm text-gray-200">
                        <span className="font-bold text-gray-400 text-xs uppercase block mb-1">Executive Summary</span>
                        {finding.remedy.executive_summary}
                      </div>

                      <div className="text-sm text-gray-200">
                        <span className="font-bold text-gray-400 text-xs uppercase block mb-1">Technical Context</span>
                        {finding.remedy.technical_analysis}
                      </div>

                      <div>
                        <span className="font-bold text-cyber-cyan text-xs uppercase block mb-1">Remediation Steps</span>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                          {finding.remedy.immediate_mitigation?.map((step: string, i: number) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
