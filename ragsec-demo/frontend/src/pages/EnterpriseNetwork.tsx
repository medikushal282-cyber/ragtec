import React, { useState, useEffect } from 'react';
import { Server, HardDrive, Folder, File, ShieldAlert, CheckCircle, Activity, ChevronRight, Search, Shield, Zap } from 'lucide-react';
import { InteractiveHoverButton } from '../components/ui/InteractiveHoverButton';

export default function EnterpriseNetwork() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [fileSystem, setFileSystem] = useState<any[]>([]);
  
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [mitigating, setMitigating] = useState(false);
  const [mitigated, setMitigated] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/enterprise/devices')
      .then(res => res.json())
      .then(data => setDevices(data))
      .catch(e => console.error(e));
  }, []);

  const selectDevice = (dev: any) => {
    setSelectedDevice(dev);
    setScanResult(null);
    setMitigated(false);
    fetch(`http://localhost:8000/api/enterprise/device/${dev.id}/fs`)
      .then(res => res.json())
      .then(data => setFileSystem(data))
      .catch(e => console.error(e));
  };

  const handleScan = async (path: string) => {
    setScanning(true);
    setScanResult(null);
    setMitigated(false);
    try {
      const res = await fetch('http://localhost:8000/api/enterprise/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: path, device_id: selectedDevice.id })
      });
      const data = await res.json();
      setScanResult({ ...data, target: path });
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const handleMitigate = async () => {
    setMitigating(true);
    try {
      await fetch('http://localhost:8000/api/enterprise/mitigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: scanResult.target, device_id: selectedDevice.id, action: 'Quarantine and Delete' })
      });
      setMitigated(true);
    } catch (e) {
      console.error(e);
    } finally {
      setMitigating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 min-h-screen bg-black text-gray-300 flex flex-col">
      <div className="flex items-center gap-3 border-b border-green-500/20 pb-6 mb-8">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/30">
          <Server className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Network Security</h1>
          <p className="text-sm text-green-500/70 font-mono mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            ACTIVE MONITORING
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Pane: Devices */}
        <div className="lg:col-span-1 bg-[#050505] border border-green-500/20 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-green-500/10 bg-green-900/10 font-bold uppercase text-xs text-green-400 tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" /> Connected Endpoints
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {devices.map((dev, i) => (
              <button
                key={dev.id}
                onClick={() => selectDevice(dev)}
                className={`w-full text-left p-4 rounded-lg border transition-all flex flex-col gap-3 ${
                  selectedDevice?.id === dev.id 
                    ? 'bg-blue-900/10 border-blue-500/50 text-white shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]' 
                    : 'bg-black border-white/5 hover:border-green-500/30 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <HardDrive className={`w-5 h-5 ${selectedDevice?.id === dev.id ? 'text-blue-400' : 'text-gray-500'}`} />
                    <div>
                      <div className={`font-bold text-sm ${selectedDevice?.id === dev.id ? 'text-blue-400' : 'text-white/80'}`}>{dev.name}</div>
                      <div className="text-xs font-mono opacity-60 mt-0.5">{dev.os}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="bg-white/5 rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-[9px] text-white/40">CPU</span>
                    <span className="text-[10px] font-mono text-green-400">{15 + (i * 7) % 60}%</span>
                  </div>
                  <div className="bg-white/5 rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-[9px] text-white/40">MEM</span>
                    <span className="text-[10px] font-mono text-blue-400">{30 + (i * 12) % 50}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane: File System & Scanner */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedDevice ? (
            <>
              {/* File System Explorer */}
              <div className="bg-[#050505] border border-blue-500/20 rounded-xl shadow-2xl overflow-hidden relative">
                {scanning && (
                  <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 z-0 pointer-events-none animate-pulse"></div>
                )}
                <div className="p-4 border-b border-blue-500/20 bg-blue-900/10 font-bold uppercase text-xs text-blue-400 tracking-wider flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-2"><Search className="w-4 h-4" /> Target: {selectedDevice.id}</div>
                  <span className="text-blue-300 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{selectedDevice.status}</span>
                </div>
                
                <div className="p-4 space-y-2 relative z-10">
                  {fileSystem.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-black border border-white/5 hover:border-blue-500/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        {item.type === 'folder' ? <Folder className="w-4 h-4 text-yellow-500" /> : <File className="w-4 h-4 text-blue-400" />}
                        <span className="font-mono text-sm text-gray-300 group-hover:text-blue-300 transition-colors">{item.path}</span>
                      </div>
                      <InteractiveHoverButton 
                        text={scanning && scanResult?.target === item.path ? "Scanning..." : "Deep Scan"} 
                        onClick={() => handleScan(item.path)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Scan Results & Mitigation */}
              {scanResult && (
                <div className={`bg-[#050505] border rounded-xl shadow-2xl p-6 transition-colors relative overflow-hidden ${
                  scanResult.status === 'infected' && !mitigated ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' :
                  mitigated ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]' :
                  'border-green-500/20'
                }`}>
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-start gap-4">
                      {scanResult.status === 'infected' && !mitigated ? (
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/50 animate-pulse">
                          <ShieldAlert className="w-6 h-6 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/50">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                      )}
                      
                      <div>
                        <h2 className={`text-xl font-bold uppercase tracking-tight ${
                          scanResult.status === 'infected' && !mitigated ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {mitigated ? 'Threat Mitigated Successfully' : 
                           scanResult.status === 'infected' ? 'Critical Threat Detected' : 'Target is Clean'}
                        </h2>
                        <p className="text-sm font-mono text-white/50 mt-1 bg-white/5 px-2 py-1 rounded inline-block">TARGET: {scanResult.target}</p>
                        
                        {scanResult.status === 'infected' && !mitigated && scanResult.findings.map((f: any, i: number) => (
                          <div key={i} className="mt-4 p-3 bg-red-950/30 border-l-2 border-red-500 rounded-r-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-red-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-sm">{f.severity}</span>
                              <span className="font-bold text-red-400 text-sm">{f.threat}</span>
                            </div>
                            <div className="text-gray-300 text-xs mt-1 font-mono">{f.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {scanResult.status === 'infected' && !mitigated && (
                      <InteractiveHoverButton 
                        text={mitigating ? "Mitigating..." : "Deploy Playbook"} 
                        className="!bg-red-500/20 !border-red-500/50 !text-red-400 hover:!bg-red-500 hover:!text-white transition-all shrink-0"
                        onClick={handleMitigate}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#050505] border border-dashed border-green-500/20 rounded-xl h-full min-h-[300px] flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <Zap className="w-12 h-12 mb-4 opacity-30 text-green-500" />
              <div className="font-bold text-lg text-white/70 uppercase">Select an Endpoint</div>
              <div className="text-sm font-mono mt-2 text-white/40 max-w-sm">Choose a node from the topology to initialize deep file system inspection.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
