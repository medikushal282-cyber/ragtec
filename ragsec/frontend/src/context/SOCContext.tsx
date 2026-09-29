import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  NavCategory,
  NavSubTab,
  Incident,
  Device,
  SecurityEvent,
  MitigationAction,
  AuditEvent,
  DemoStep
} from "../types/soc";
import { socApi } from "../services/api";

export const DEMO_SCENARIOS: DemoStep[] = [
  {
    stepIndex: 1,
    phaseName: "TELEMETRY",
    title: "Adversary Drops Encoded Dropper & Binary",
    summary: "FIM Watcher captures anomalous file creation: `malware_simulation.exe` and `suspicious_script.ps1` in `monitored_workspace/`.",
    highlightTab: "fim",
    actionRequired: "Inspect FIM filesystem activity stream",
    activeEntityId: "EVT-FIM-01"
  },
  {
    stepIndex: 2,
    phaseName: "DETECTION",
    title: "Static Signal Classification Triggered",
    summary: "Static analyzer detects high-entropy packed executable with credential dumping strings and base64 PowerShell invocation.",
    highlightTab: "analyzer",
    actionRequired: "Review static heuristics & threat classification",
    activeEntityId: "ANALYSIS-MALWARE"
  },
  {
    stepIndex: 3,
    phaseName: "ALERT",
    title: "Correlation Rules Elevate to Active Alert",
    summary: "Multi-signal correlation generates Alert `ALT-MAL-901`: Potential Cobalt Strike / Ransomware stage 1 loader.",
    highlightTab: "alerts",
    actionRequired: "Review alert trigger evidence and escalate to Incident",
    activeEntityId: "ALT-MAL-901"
  },
  {
    stepIndex: 4,
    phaseName: "INCIDENT",
    title: "Critical Security Incident Declared",
    summary: "Incident `INC-2026-001` (Severity: CRITICAL) opened against host `WS-ANALYST-104` across `NET-CORP-01`.",
    highlightTab: "incidents",
    actionRequired: "Open incident triage and launch AI Threat Investigation",
    activeEntityId: "INC-2026-001"
  },
  {
    stepIndex: 5,
    phaseName: "INVESTIGATION",
    title: "Grounded AI RAG Threat Investigation",
    summary: "RAGSec queries ChromaDB vector index with cross-encoder reranking. Identifies APT29 TTPs and recommends immediate containment.",
    highlightTab: "investigation",
    actionRequired: "Review cited CTI evidence and generate mitigation playbooks",
    activeEntityId: "INC-2026-001"
  },
  {
    stepIndex: 6,
    phaseName: "MITIGATION",
    title: "Human-in-the-Loop Mitigation Approval & Execution",
    summary: "Analyst reviews actions: (1) Isolate Endpoint WS-ANALYST-104, (2) Quarantine binary to secure enclave, (3) Block C2 IP.",
    highlightTab: "mitigation",
    actionRequired: "Approve and Execute pending mitigation commands",
    activeEntityId: "MIT-01"
  },
  {
    stepIndex: 7,
    phaseName: "AUDIT",
    title: "Cryptographic SHA-256 Audit Verification",
    summary: "Every analyst decision and mitigation execution is permanently recorded in the immutable SHA256 audit ledger.",
    highlightTab: "audit",
    actionRequired: "Verify cryptographic hash chain integrity",
    activeEntityId: "AUD-01"
  }
];

interface SOCContextType {
  activeTab: NavSubTab;
  activeCategory: NavCategory;
  expandedCategories: Record<NavCategory, boolean>;
  toggleCategory: (cat: NavCategory) => void;
  navigateTo: (tab: NavSubTab, entityId?: string) => void;

  // Selected Entities for cross-screen linking
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  targetAnalysisPath: string | null;
  setTargetAnalysisPath: (path: string | null) => void;

  // Demo Mode
  demoModeActive: boolean;
  setDemoModeActive: (active: boolean) => void;
  currentDemoStep: number;
  nextDemoStep: () => void;
  prevDemoStep: () => void;
  setDemoStepIndex: (index: number) => void;
  resetDemo: () => void;
  currentDemoInfo: DemoStep;

  // Live Data
  incidents: Incident[];
  devices: Device[];
  events: SecurityEvent[];
  auditTrail: AuditEvent[];
  refreshAll: () => Promise<void>;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SOCContext = createContext<SOCContextType | undefined>(undefined);

export const SOCProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavSubTab>("overview");
  const [expandedCategories, setExpandedCategories] = useState<Record<NavCategory, boolean>>({
    OVERVIEW: true,
    OPERATIONS: true,
    INTELLIGENCE: true,
    RESPONSE: true,
    SYSTEM: true
  });

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>("INC-2026-001");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [targetAnalysisPath, setTargetAnalysisPath] = useState<string | null>("monitored_workspace/malware_simulation.exe");

  const [demoModeActive, setDemoModeActive] = useState<boolean>(true);
  const [currentDemoStep, setCurrentDemoStep] = useState<number>(1);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const refreshAll = async () => {
    setIsLoading(true);
    try {
      const [incData, devData, evtData, audData] = await Promise.all([
        socApi.getIncidents(),
        socApi.getDevices(),
        socApi.getEvents(),
        socApi.getAuditTrail()
      ]);
      setIncidents(incData || []);
      setDevices(devData || []);
      setEvents(evtData || []);
      setAuditTrail(audData || []);
      if (incData?.length && !selectedIncidentId) {
        setSelectedIncidentId(incData[0].id);
      }
    } catch (e) {
      console.error("SOC Data load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 12000);
    return () => clearInterval(interval);
  }, []);

  const getCategoryForTab = (tab: NavSubTab): NavCategory => {
    if (tab === "overview") return "OVERVIEW";
    if (["events", "alerts", "incidents", "fleet", "fim", "analyzer"].includes(tab)) return "OPERATIONS";
    if (["investigation", "knowledge", "search"].includes(tab)) return "INTELLIGENCE";
    if (["mitigation", "playbooks"].includes(tab)) return "RESPONSE";
    return "SYSTEM";
  };

  const activeCategory = getCategoryForTab(activeTab);

  const toggleCategory = (cat: NavCategory) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const navigateTo = (tab: NavSubTab, entityId?: string) => {
    setActiveTab(tab);
    const cat = getCategoryForTab(tab);
    setExpandedCategories(prev => ({ ...prev, [cat]: true }));
    if (entityId) {
      if (tab === "incidents" || tab === "investigation") setSelectedIncidentId(entityId);
      if (tab === "fleet") setSelectedDeviceId(entityId);
      if (tab === "events") setSelectedEventId(entityId);
      if (tab === "analyzer") setTargetAnalysisPath(entityId);
    }
  };

  const currentDemoInfo = DEMO_SCENARIOS[currentDemoStep - 1] || DEMO_SCENARIOS[0];

  const nextDemoStep = () => {
    if (currentDemoStep < DEMO_SCENARIOS.length) {
      const nextStep = currentDemoStep + 1;
      setCurrentDemoStep(nextStep);
      const stepConfig = DEMO_SCENARIOS[nextStep - 1];
      if (stepConfig) {
        navigateTo(stepConfig.highlightTab, stepConfig.activeEntityId);
      }
    }
  };

  const prevDemoStep = () => {
    if (currentDemoStep > 1) {
      const prevStep = currentDemoStep - 1;
      setCurrentDemoStep(prevStep);
      const stepConfig = DEMO_SCENARIOS[prevStep - 1];
      if (stepConfig) {
        navigateTo(stepConfig.highlightTab, stepConfig.activeEntityId);
      }
    }
  };

  const setDemoStepIndex = (index: number) => {
    if (index >= 1 && index <= DEMO_SCENARIOS.length) {
      setCurrentDemoStep(index);
      const stepConfig = DEMO_SCENARIOS[index - 1];
      if (stepConfig) {
        navigateTo(stepConfig.highlightTab, stepConfig.activeEntityId);
      }
    }
  };

  const resetDemo = () => {
    setCurrentDemoStep(1);
    navigateTo("overview");
  };

  return (
    <SOCContext.Provider
      value={{
        activeTab,
        activeCategory,
        expandedCategories,
        toggleCategory,
        navigateTo,
        selectedIncidentId,
        setSelectedIncidentId,
        selectedDeviceId,
        setSelectedDeviceId,
        selectedEventId,
        setSelectedEventId,
        targetAnalysisPath,
        setTargetAnalysisPath,
        demoModeActive,
        setDemoModeActive,
        currentDemoStep,
        nextDemoStep,
        prevDemoStep,
        setDemoStepIndex,
        resetDemo,
        currentDemoInfo,
        incidents,
        devices,
        events,
        auditTrail,
        refreshAll,
        isLoading,
        searchQuery,
        setSearchQuery
      }}
    >
      {children}
    </SOCContext.Provider>
  );
};

export const useSOC = () => {
  const context = useContext(SOCContext);
  if (!context) {
    throw new Error("useSOC must be used within a SOCProvider");
  }
  return context;
};
