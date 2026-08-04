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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-green-500/20 pb-6 relative">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <Server className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Network Orchestrator</h1>
            <p className="text-green-500/70 font-mono mt-1 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              ACTIVE MONITORING
            </p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="bg-black/50 border border-blue-500/30 rounded-lg px-4 py-2 flex flex-col items-end">
            <span className="text-xs text-blue-400/60 font-mono">GLOBAL UPTIME</span>
            <span className="text-blue-400 font-bold font-mono">99.998%</span>
          </div>
          <div className="bg-black/50 border border-green-500/30 rounded-lg px-4 py-2 flex flex-col items-end">
            <span className="text-xs text-green-400/60 font-mono">NODES ONLINE</span>
            <span className="text-green-400 font-bold font-mono">{devices.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* Left Pane: Topology Matrix */}
        <div className="lg:col-span-1 bg-black border border-green-500/20 rounded-3xl flex flex-col overflow-hidden relative shadow-[inset_0_0_40px_rgba(34,197,94,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/0 via-green-500/50 to-green-500/0"></div>
          
          <div className="p-5 border-b border-green-500/10 bg-green-900/5 font-bold text-xs text-green-500/70 tracking-widest uppercase flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Node Topology
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <AnimatePresence>
              {devices.map((dev, i) => {
                const isSelected = selectedDevice?.id === dev.id;
                // Faux telemetry
                const cpu = 15 + (i * 7) % 60;
                const mem = 30 + (i * 12) % 50;

                return (
                  <motion.button
                    key={dev.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => selectDevice(dev)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                      isSelected 
                        ? 'bg-blue-900/10 border-blue-500/50 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                        : 'bg-black border-white/5 hover:border-green-500/30 text-white/60'
                    }`}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="active-node" 
                        className="absolute left-0 top-0 w-1 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      />
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl border ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10 group-hover:border-green-500/30'}`}>
                        <HardDrive className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-white/40 group-hover:text-green-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                              <div className={`font-bold text-sm ${isSelected ? 'text-blue-400' : 'text-white/80'}`}>{dev.name}</div>
                              <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${isSelected ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                {dev.status}
                          </div>
                        </div>
                        <div className="text-xs font-mono opacity-60 mt-1">{dev.os} | {dev.id}</div>
                        
                        {/* Faux Telemetry Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="bg-black/50 border border-white/5 rounded p-1.5 flex items-center justify-between">
                            <span className="text-[9px] text-white/40">CPU</span>
                            <span className={`text-[10px] font-mono ${cpu > 50 ? 'text-orange-400' : 'text-green-400'}`}>{cpu}%</span>
                          </div>
                          <div className="bg-black/50 border border-white/5 rounded p-1.5 flex items-center justify-between">
                            <span className="text-[9px] text-white/40">MEM</span>
                            <span className="text-[10px] font-mono text-blue-400">{mem}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Pane: Deep Inspection Terminal */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar">
          {selectedDevice ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* File System Terminal */}
              <div className="bg-black border border-blue-500/20 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.05)] relative">
                
                {/* Scanning Laser Overlay */}
                <AnimatePresence>
                  {scanning && (
                    <motion.div
                      initial={{ top: 0, opacity: 0 }}
                      animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,1)] z-10 pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                <div className="p-4 border-b border-blue-500/20 bg-blue-900/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-xs text-blue-400 tracking-widest uppercase">Deep Inspection: {selectedDevice.id}</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] font-bold text-white/30 uppercase tracking-wider border-b border-white/5">
                    <div className="col-span-6">Resource Path</div>
                    <div className="col-span-3 text-right">Size</div>
                    <div className="col-span-3 text-right">Action</div>
                  </div>

                  {fileSystem.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl bg-black border border-white/5 hover:bg-blue-900/10 hover:border-blue-500/30 transition-colors group"
                    >
                      <div className="col-span-6 flex items-center gap-3">
                        <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                          {item.type === 'folder' ? <Folder className="w-4 h-4 text-yellow-500" /> : <File className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div>
                          <div className="font-mono text-sm text-white/80 group-hover:text-blue-300 transition-colors truncate">{item.path}</div>
                          <div className="text-[10px] text-white/30 font-mono mt-0.5">PERM: 755 | root:root</div>
                        </div>
                      </div>
                      
                      <div className="col-span-3 text-right font-mono text-xs text-white/40">
                        {item.type === 'folder' ? '--' : `${Math.floor(Math.random() * 1024 + 12)} KB`}
                      </div>

                      <div className="col-span-3 flex justify-end">
                        <InteractiveHoverButton 
                          text={scanning && scanResult?.target === item.path ? "Scanning..." : "Deep Scan"} 
                          onClick={() => handleScan(item.path)}
                          disabled={scanning}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Threat Result Panel */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-black border rounded-3xl p-6 transition-all relative overflow-hidden ${
                      scanResult.status === 'infected' && !mitigated 
                        ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]' 
                        : mitigated 
                        ? 'border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.15)]' 
                        : 'border-green-500/20'
                    }`}
                  >
                    {/* Background Glow */}
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${
                      scanResult.status === 'infected' && !mitigated ? 'bg-red-500' : 'bg-green-500'
                    }`} />

                    <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
                      <div className="flex items-start gap-5">
                        {scanResult.status === 'infected' && !mitigated ? (
                          <div className="w-14 h-14 shrink-0 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/50 animate-pulse relative">
                            <ShieldAlert className="w-7 h-7 text-red-500" />
                            <div className="absolute inset-0 border border-red-500 rounded-2xl animate-ping opacity-20"></div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 shrink-0 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/50">
                            <CheckCircle className="w-7 h-7 text-green-500" />
                          </div>
                        )}
                        
                        <div>
                          <h2 className={`text-2xl font-black uppercase tracking-tight ${
                            scanResult.status === 'infected' && !mitigated ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {mitigated ? 'Threat Neutralized' : 
                             scanResult.status === 'infected' ? 'Critical Vulnerability' : 'Target Secured'}
                          </h2>
                          <div className="text-xs font-mono text-white/50 mt-1 bg-white/5 px-2 py-1 rounded inline-block">
                            TARGET: <span className="text-white/80">{scanResult.target}</span>
                          </div>
                          
                          {scanResult.status === 'infected' && !mitigated && scanResult.findings.map((f: any, i: number) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
                              key={i} 
                              className="mt-5 p-4 bg-red-950/30 border-l-2 border-red-500 rounded-r-xl"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-red-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-sm">{f.severity}</span>
                                <span className="font-bold text-red-400 text-sm">{f.threat}</span>
                              </div>
                              <div className="text-white/60 text-xs font-mono leading-relaxed mt-2">{f.desc}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {scanResult.status === 'infected' && !mitigated && (
                        <InteractiveHoverButton 
                          text={mitigating ? "EXECUTING..." : "DEPLOY PLAYBOOK"} 
                          className="!bg-red-500 !text-white !border-red-400 hover:!bg-red-600 shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                          onClick={handleMitigate}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="bg-black border border-dashed border-green-500/20 rounded-3xl h-full min-h-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/5 flex items-center justify-center mb-6 border border-green-500/20 relative">
                <Zap className="w-8 h-8 text-green-500/50" />
                <div className="absolute inset-0 border border-green-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
              </div>
              <div className="font-bold text-xl text-green-500/80 uppercase tracking-widest">Awaiting Node Selection</div>
              <div className="text-xs font-mono mt-3 max-w-sm text-green-500/40">
                Select an endpoint from the topology matrix to initialize deep inspection and monitor real-time integrity.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
