import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, HardDrive, Folder, File, ShieldAlert, CheckCircle, Activity, Search, Zap } from 'lucide-react';
import { InteractiveHoverButton } from '../../components/ui/InteractiveHoverButton';

export function GodUIEnterprise() {
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
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <Server className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Enterprise Network</h1>
          <p className="text-white/40 font-mono mt-1 text-sm">GodUI Network Orchestration and File Integrity Monitoring</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* Left Pane: Devices */}
        <div className="lg:col-span-1 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/5 font-bold text-xs text-white/50 tracking-widest uppercase">
            Network Topology
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {devices.map((dev, i) => (
                <motion.button
                  key={dev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => selectDevice(dev)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${
                    selectedDevice?.id === dev.id 
                      ? 'bg-gradient-to-r from-purple-500/20 to-transparent border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/60'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${selectedDevice?.id === dev.id ? 'bg-purple-500/20' : 'bg-black/50'}`}>
                    <HardDrive className={`w-5 h-5 ${selectedDevice?.id === dev.id ? 'text-purple-400' : 'text-white/40'}`} />
                  </div>
                  <div>
                    <div className="font-bold">{dev.name}</div>
                    <div className="text-xs font-mono opacity-60 mt-1">{dev.os}</div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Pane: File System & Scanner */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar">
          {selectedDevice ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* File System */}
              <div className="bg-black/40 border border-white/5 rounded-3xl backdrop-blur-xl overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <span className="font-bold text-xs text-white/50 tracking-widest uppercase">Target Node: {selectedDevice.id}</span>
                  <span className="text-purple-400 text-xs font-mono bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">{selectedDevice.status}</span>
                </div>
                <div className="p-5 space-y-3">
                  {fileSystem.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-black/50 rounded-xl">
                          {item.type === 'folder' ? <Folder className="w-5 h-5 text-yellow-500" /> : <File className="w-5 h-5 text-blue-400" />}
                        </div>
                        <span className="font-mono text-sm text-white/80">{item.path}</span>
                      </div>
                      <InteractiveHoverButton 
                        text={scanning ? "Scanning..." : "Deep Scan"} 
                        onClick={() => handleScan(item.path)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Scan Results */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`bg-black/40 border rounded-3xl backdrop-blur-xl p-6 transition-all ${
                      scanResult.status === 'infected' && !mitigated ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]' :
                      mitigated ? 'border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.15)]' :
                      'border-green-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-5">
                        {scanResult.status === 'infected' && !mitigated ? (
                          <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/50 animate-pulse">
                            <ShieldAlert className="w-7 h-7 text-red-500" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/50">
                            <CheckCircle className="w-7 h-7 text-green-500" />
                          </div>
                        )}
                        
                        <div>
                          <h2 className={`text-2xl font-black ${
                            scanResult.status === 'infected' && !mitigated ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {mitigated ? 'Threat Mitigated Successfully' : 
                             scanResult.status === 'infected' ? 'Critical Threat Detected' : 'Target is Clean'}
                          </h2>
                          <p className="text-sm font-mono text-white/50 mt-1">{scanResult.target}</p>
                          
                          {scanResult.status === 'infected' && !mitigated && scanResult.findings.map((f: any, i: number) => (
                            <div key={i} className="mt-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                              <div className="font-bold text-red-400 text-sm">[{f.severity}] {f.threat}</div>
                              <div className="text-white/70 text-sm mt-2 leading-relaxed">{f.desc}</div>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="bg-black/40 border border-dashed border-white/10 rounded-3xl h-full min-h-[400px] flex flex-col items-center justify-center text-center text-white/30">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                <Activity className="w-8 h-8 opacity-50" />
              </div>
              <div className="font-bold text-xl text-white/50">Awaiting Telemetry</div>
              <div className="text-sm font-mono mt-2 max-w-sm leading-relaxed">Select an endpoint from the network topology to inspect its file system.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
