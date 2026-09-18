import React, { useEffect, useState } from "react";
import { ragsecApi } from "../services/api";
import { FIMEvent, SOCIncident, SOCAlert, ThreatCategory, FileCRUDEvent } from "../types";
import { DemoControlPanel } from "../components/DemoControlPanel";
import { FileCodeExplorer } from "../components/FileCodeExplorer";
import { AIChatbotWidget } from "../components/AIChatbotWidget";
import { 
  SYNTHETIC_DEMO_ARTIFACTS, 
  DemoScenarioArtifact 
} from "../services/demoEngine";
import { 
  ShieldAlert, 
  Activity, 
  Database, 
  Clock, 
  AlertOctagon, 
  FileCheck2, 
  Zap, 
  CheckCircle2, 
  ChevronRight,
  Flame,
  Layers,
  FileCode2,
  BrainCircuit,
  Filter,
  Lock,
  Search
} from "lucide-react";

interface DashboardProps {
  onNavigatePage?: (page: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigatePage }) => {
  // Demo Mode State
  const [demoActive, setDemoActive] = useState(true);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoPaused, setDemoPaused] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Selected file for code explorer
  const [selectedArtifact, setSelectedArtifact] = useState<DemoScenarioArtifact>(
    SYNTHETIC_DEMO_ARTIFACTS.malware
  );

  // Live CRUD Events Stream
  const [crudEvents, setCrudEvents] = useState<FileCRUDEvent[]>([
    {
      id: "evt-01",
      timestamp: new Date().toLocaleTimeString(),
      event_type: "CREATED",
      file_path: "monitored_workspace/bin/malware_simulation.exe",
      file_name: "malware_simulation.exe",
      file_size_bytes: 524288,
      file_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      process_name: "cmd.exe",
      user: "NT AUTHORITY\\SYSTEM",
      threat_status: "THREAT",
      category: "Malware",
      severity: "HIGH",
      confidence: 96,
      reasons: ["Executable binary created in non-standard workspace directory", "Matches synthetic malware signature"],
      evidence: ["PE Header anomaly: Suspicious section names", "Process spawn attempt"],
      quarantined: true
    },
    {
      id: "evt-02",
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      event_type: "MODIFIED",
      file_path: "monitored_workspace/docs/ransomware_simulation.txt",
      file_name: "ransomware_simulation.txt",
      file_size_bytes: 1048576,
      file_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      process_name: "encryptor_demo.exe",
      user: "SYSTEM",
      threat_status: "THREAT",
      category: "Ransomware",
      severity: "CRITICAL",
      confidence: 98,
      reasons: ["Rapid bulk document modification", "VSS shadow copy deletion command"],
      evidence: ["Command: vssadmin delete shadows /all /quiet"],
      quarantined: true
    },
    {
      id: "evt-03",
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      event_type: "CREATED",
      file_path: "monitored_workspace/scripts/suspicious_script.ps1",
      file_name: "suspicious_script.ps1",
      file_size_bytes: 4096,
      file_hash: "fe912bc871900192aa1fe912bc871900192aa1fe912bc871900192aa1fe912b",
      process_name: "powershell.exe",
      user: "admin",
      threat_status: "SUSPICIOUS",
      category: "Suspicious Script / Execution",
      severity: "MEDIUM",
      confidence: 88,
      reasons: ["Base64 encoded string payload detected"],
      evidence: ["Decoded command: Get-WmiObject Win32_UserAccount"],
      quarantined: false
    },
    {
      id: "evt-04",
      timestamp: new Date(Date.now() - 600000).toLocaleTimeString(),
      event_type: "CREATED",
      file_path: "monitored_workspace/docs/normal_document.txt",
      file_name: "normal_document.txt",
      file_size_bytes: 1024,
      file_hash: "5544332211005544332211005544332211005544332211005544332211005544",
      process_name: "notepad.exe",
      user: "operator",
      threat_status: "SAFE",
      category: "BENIGN",
      severity: "LOW",
      confidence: 99,
      reasons: ["Standard plain text document"],
      evidence: ["Low entropy: 3.4"],
      quarantined: false
    }
  ]);

  // Calculate dynamic 10-category taxonomy counts from actual application state
  const categoriesList: ThreatCategory[] = [
    "Malware",
    "Ransomware",
    "Trojan",
    "Worm",
    "Spyware",
    "Rootkit",
    "Phishing / Credential Theft",
    "Suspicious Script / Execution",
    "Persistence / Privilege Abuse",
    "Data Theft / Exfiltration",
    "BENIGN",
    "UNKNOWN"
  ];

  const taxonomyCounts = categoriesList.reduce((acc, cat) => {
    acc[cat] = crudEvents.filter((e) => e.category === cat).length;
    return acc;
  }, {} as Record<ThreatCategory, number>);

  // Demo Runner Implementation
  const runNextDemoStep = (stepNum: number) => {
    setDemoStep(stepNum);
    if (stepNum === 1) {
      // Step 1 & 2: Create malware_simulation.exe
      const art = SYNTHETIC_DEMO_ARTIFACTS.malware;
      setSelectedArtifact(art);
      const newEvt: FileCRUDEvent = {
        id: `evt-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        event_type: "CREATED",
        file_path: art.file_path,
        file_name: art.file_name,
        file_size_bytes: art.size_bytes,
        file_hash: art.sha256_hash,
        process_name: art.process_name,
        user: art.user,
        threat_status: art.threat_status,
        category: art.category,
        severity: art.severity,
        confidence: art.confidence,
        reasons: art.reasons,
        evidence: art.evidence,
        quarantined: true
      };
      setCrudEvents((prev) => [newEvt, ...prev]);
    } else if (stepNum === 6) {
      // Auto-open code explorer for malware
      setSelectedArtifact(SYNTHETIC_DEMO_ARTIFACTS.malware);
    } else if (stepNum === 9) {
      // Trigger ransomware event
      const art = SYNTHETIC_DEMO_ARTIFACTS.ransomware;
      setSelectedArtifact(art);
      const newEvt: FileCRUDEvent = {
        id: `evt-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        event_type: "MODIFIED",
        file_path: art.file_path,
        file_name: art.file_name,
        file_size_bytes: art.size_bytes,
        file_hash: art.sha256_hash,
        process_name: art.process_name,
        user: art.user,
        threat_status: art.threat_status,
        category: art.category,
        severity: art.severity,
        confidence: art.confidence,
        reasons: art.reasons,
        evidence: art.evidence,
        quarantined: true
      };
      setCrudEvents((prev) => [newEvt, ...prev]);
    }
  };

  const handleRunFullDemo = () => {
    setDemoRunning(true);
    setDemoPaused(false);
    let step = 1;
    runNextDemoStep(step);

    const interval = setInterval(() => {
      step += 1;
      if (step > 10) {
        clearInterval(interval);
        setDemoRunning(false);
        setDemoStep(10);
      } else {
        runNextDemoStep(step);
      }
    }, 1800);
  };

  const handleTriggerScenario = (key: string) => {
    const art = SYNTHETIC_DEMO_ARTIFACTS[key];
    if (art) {
      setSelectedArtifact(art);
      const newEvt: FileCRUDEvent = {
        id: `evt-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        event_type: art.event_type,
        file_path: art.file_path,
        file_name: art.file_name,
        file_size_bytes: art.size_bytes,
        file_hash: art.sha256_hash,
        process_name: art.process_name,
        user: art.user,
        threat_status: art.threat_status,
        category: art.category,
        severity: art.severity,
        confidence: art.confidence,
        reasons: art.reasons,
        evidence: art.evidence,
        quarantined: art.threat_status === "THREAT"
      };
      setCrudEvents((prev) => [newEvt, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Control Panel Header Widget */}
      <DemoControlPanel
        demoActive={demoActive}
        onToggleDemoMode={() => setDemoActive(!demoActive)}
        isRunning={demoRunning}
        isPaused={demoPaused}
        currentStep={demoStep}
        onRunFullDemo={handleRunFullDemo}
        onPauseDemo={() => setDemoPaused(!demoPaused)}
        onRestartDemo={() => {
          setDemoStep(0);
          setDemoRunning(false);
        }}
        onNextStep={() => runNextDemoStep(Math.min(10, demoStep + 1))}
        onStopDemo={() => setDemoRunning(false)}
        onTriggerScenario={handleTriggerScenario}
      />

      {/* Metric Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>LIVE CRUD THREAT INDEX</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">ACTIVE</span>
            <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
              {crudEvents.filter((e) => e.threat_status === "THREAT").length} THREATS
            </span>
          </div>
          <p className="text-[11px] text-slate-400">File Integrity Monitor active</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>MONITORED EVENTS</span>
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">{crudEvents.length}</span>
            <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">
              LOGGED
            </span>
          </div>
          <p className="text-[11px] text-slate-400">CREATED, MODIFIED, DELETED tracked</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>BENIGN FILE COUNT</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">{taxonomyCounts.BENIGN}</span>
            <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
              SAFE
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Zero threat indicators verified</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>UNKNOWN CLASSIFICATIONS</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">{taxonomyCounts.UNKNOWN}</span>
            <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30">
              REVIEW NEEDED
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Insufficient evidence states</p>
        </div>
      </div>

      {/* CORE FEATURE 4: 10-Category Threat Taxonomy Widget */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base font-mono">
              10-Category Enterprise Threat Taxonomy
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
            DYNAMIC APPLICATION STATE
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
          {categoriesList.map((cat) => {
            const count = taxonomyCounts[cat] || 0;
            const isThreatCategory = cat !== "BENIGN" && cat !== "UNKNOWN";
            return (
              <div
                key={cat}
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 transition-all ${
                  count > 0 && isThreatCategory
                    ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                    : cat === "BENIGN"
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-black/40 border-white/5 text-slate-400"
                }`}
              >
                <div className="text-[10px] text-slate-400 truncate">{cat}</div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xl font-bold text-white">{count}</span>
                  {count > 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                      {isThreatCategory ? "DETECTED" : "STATE"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CORE FEATURE 1: Live File CRUD Threat Logger Stream */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base font-mono">
              Live File CRUD Threat Logger & Activity Stream
            </h3>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
            {crudEvents.length} EVENTS LOGGED
          </span>
        </div>

        <div className="space-y-3">
          {crudEvents.map((evt) => (
            <div
              key={evt.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                evt.threat_status === "THREAT"
                  ? "bg-black/50 border-rose-500/40 hover:border-rose-500/60"
                  : evt.threat_status === "SUSPICIOUS"
                  ? "bg-black/50 border-amber-500/40 hover:border-amber-500/60"
                  : "bg-black/40 border-white/5 hover:border-white/20"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    evt.event_type === "CREATED" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                    evt.event_type === "MODIFIED" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                    "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}>
                    {evt.event_type}
                  </span>
                  <span className="font-bold text-white text-sm">{evt.file_name}</span>
                  <span className="text-slate-500 text-[11px]">{evt.timestamp}</span>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Path: <code className="text-cyan-400">{evt.file_path}</code>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                  <span>User: <strong className="text-slate-200">{evt.user}</strong></span>
                  <span>Process: <strong className="text-slate-200">{evt.process_name}</strong></span>
                  {evt.reasons.length > 0 && (
                    <span className="text-amber-300">Reason: {evt.reasons[0]}</span>
                  )}
                </div>
              </div>

              {/* Classification Badge & Controls */}
              <div className="flex items-center gap-4 font-mono text-xs flex-shrink-0">
                <div className="text-right">
                  <div className={`px-2.5 py-1 rounded text-xs font-bold uppercase border inline-block ${
                    evt.threat_status === "THREAT" ? "bg-rose-500/20 text-rose-200 border-rose-500/40" :
                    evt.threat_status === "SUSPICIOUS" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                    "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}>
                    {evt.threat_status} — {evt.category}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Confidence: {evt.confidence}%</div>
                </div>

                <button
                  onClick={() => {
                    const art = SYNTHETIC_DEMO_ARTIFACTS[evt.category.toLowerCase()] || SYNTHETIC_DEMO_ARTIFACTS.malware;
                    setSelectedArtifact(art);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-all"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                  Inspect Code
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CORE FEATURE 3: AI File Code Explorer & Malware Inspector */}
      <FileCodeExplorer selectedFile={selectedArtifact} onSelectArtifact={setSelectedArtifact} />

      {/* CORE FEATURE 2: AI File-System Diagnostic Chatbot */}
      <AIChatbotWidget events={crudEvents} />
    </div>
  );
};

export default Dashboard;
