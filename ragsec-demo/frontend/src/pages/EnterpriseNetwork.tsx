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
    <div className="p-6 md:p-8 min-h-screen bg-[#05070a] text-gray-300 flex flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 pb-6 mb-8">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
          <Server className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Network Security</h1>
          <p className="text-sm text-gray-400 font-mono mt-1">Manage endpoints, scan file systems, and mitigate threats.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Pane: Devices */}
        <div className="lg:col-span-1 bg-[#0a0d14] border border-white/5 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/40 font-bold uppercase text-xs text-gray-400 tracking-wider">
            Connected Endpoints
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {devices.map(dev => (
              <button
                key={dev.id}
                onClick={() => selectDevice(dev)}
                className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between ${
                  selectedDevice?.id === dev.id 
                    ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'bg-black/20 border-white/5 hover:bg-white/5 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HardDrive className={`w-5 h-5 ${selectedDevice?.id === dev.id ? 'text-purple-400' : 'text-gray-500'}`} />
                  <div>
                    <div className="font-bold text-sm">{dev.name}</div>
                    <div className="text-xs font-mono opacity-60 mt-0.5">{dev.os}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane: File System & Scanner */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedDevice ? (
            <>
              {/* File System Explorer */}
              <div className="bg-[#0a0d14] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-black/40 font-bold uppercase text-xs text-gray-400 tracking-wider flex justify-between items-center">
                  <span>File System: {selectedDevice.id}</span>
                  <span className="text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{selectedDevice.status}</span>
                </div>
                <div className="p-4 space-y-2">
                  {fileSystem.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        {item.type === 'folder' ? <Folder className="w-4 h-4 text-yellow-500" /> : <File className="w-4 h-4 text-blue-400" />}
                        <span className="font-mono text-sm text-gray-300">{item.path}</span>
                      </div>
                      <InteractiveHoverButton 
                        text={scanning ? "Scanning..." : "Deep Scan"} 
                        onClick={() => handleScan(item.path)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Scan Results & Mitigation */}
              {scanResult && (
                <div className={`bg-[#0a0d14] border rounded-xl shadow-2xl p-6 transition-colors ${
                  scanResult.status === 'infected' && !mitigated ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' :
                  mitigated ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]' :
                  'border-green-500/20'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {scanResult.status === 'infected' && !mitigated ? (
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50 animate-pulse">
                          <ShieldAlert className="w-6 h-6 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                      )}
                      
                      <div>
                        <h2 className={`text-xl font-bold ${
                          scanResult.status === 'infected' && !mitigated ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {mitigated ? 'Threat Mitigated Successfully' : 
                           scanResult.status === 'infected' ? 'Critical Threat Detected' : 'Target is Clean'}
                        </h2>
                        <p className="text-sm font-mono text-gray-400 mt-1">Target: {scanResult.target}</p>
                        
                        {scanResult.status === 'infected' && !mitigated && scanResult.findings.map((f: any, i: number) => (
                          <div key={i} className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <div className="font-bold text-red-400 text-sm">[{f.severity}] {f.threat}</div>
                            <div className="text-gray-300 text-xs mt-1">{f.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {scanResult.status === 'infected' && !mitigated && (
                      <InteractiveHoverButton 
                        text={mitigating ? "Mitigating..." : "Playbook"} 
                        className="!bg-red-500/20 !border-red-500/50 !text-red-400 hover:!text-white"
                        onClick={handleMitigate}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#0a0d14] border border-dashed border-white/10 rounded-xl h-full flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <Activity className="w-12 h-12 mb-4 opacity-50" />
              <div className="font-bold text-lg">Select an Endpoint</div>
              <div className="text-sm font-mono mt-2">Choose a device from the network to view its file system and run scans.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
