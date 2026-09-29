export type NavCategory = "OVERVIEW" | "OPERATIONS" | "INTELLIGENCE" | "RESPONSE" | "SYSTEM";

export type NavSubTab =
  // Overview
  | "overview"
  | "demo"
  // Operations
  | "events"
  | "alerts"
  | "incidents"
  | "fleet"
  | "fim"
  | "analyzer"
  | "code_explorer"
  // Intelligence
  | "investigation"
  | "knowledge"
  | "autonomous_tester"
  | "test_reports"
  | "search"
  // Response
  | "mitigation"
  | "mitigation_rules"
  | "playbooks"
  // System
  | "governance"
  | "sps_benchmark"
  | "siem"
  | "audit"
  | "settings";

export type ThreatSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type ThreatStatus = "SAFE" | "SUSPICIOUS" | "THREAT" | "UNKNOWN";

export type ThreatCategory =
  | "Malware"
  | "Ransomware"
  | "Trojan"
  | "Worm"
  | "Spyware"
  | "Rootkit"
  | "Phishing / Credential Theft"
  | "Suspicious Script / Execution"
  | "Persistence / Privilege Abuse"
  | "Data Theft / Exfiltration"
  | "Lateral Movement"
  | "BENIGN"
  | "UNKNOWN";

export interface Network {
  id: string;
  name: string;
  cidr: string;
  description?: string;
  zone: "CORP" | "DMZ" | "PROD" | "INTERNAL";
}

export interface Device {
  id: string;
  hostname: string;
  ip_address: string;
  mac_address?: string;
  network_id: string;
  os: string;
  status: "ONLINE" | "OFFLINE" | "ISOLATED" | "WARNING";
  risk_score: number;
  last_seen: string;
  device_type?: "WORKSTATION" | "SERVER" | "GATEWAY" | "DATABASE" | "ENDPOINT";
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source_type: "FIM" | "IDS" | "Syslog" | "EDR" | "FIREWALL" | "DEMO";
  network_id: string;
  device_id: string;
  raw_message: string;
  is_suspicious: boolean;
  threat_category?: ThreatCategory;
  severity: ThreatSeverity;
  status?: string;
  canonical?: {
    file_path?: string;
    action?: string;
    file_hash?: string;
    process_name?: string;
    user?: string;
    risk_score?: number;
    is_quarantined?: boolean;
    quarantine_path?: string;
  };
}

export interface ThreatClassification {
  category: { value?: string } | string;
  severity: { value?: string } | string;
  confidence: number;
  indicators: string[];
}

export interface Incident {
  id: string;
  network_id: string;
  affected_device_ids: string[];
  events: SecurityEvent[];
  threat_classification: ThreatClassification;
  status: "ACTIVE" | "INVESTIGATING" | "CONTAINED" | "RESOLVED";
  created_at: string;
  updated_at: string;
  title?: string;
  description?: string;
  mitigation_actions?: MitigationAction[];
  cross_network_correlations?: any[];
}

export interface MitigationAction {
  id: string;
  incident_id: string;
  action_type: string;
  description: string;
  target_device_id: string;
  status: "RECOMMENDED" | "APPROVED" | "EXECUTED" | "VERIFIED" | "REJECTED";
  created_at: string;
  executed_at?: string;
  analyst_id?: string;
  is_simulated?: boolean;
  notes?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  result: string;
  evidence_ref?: string;
  previous_hash?: string;
  current_hash: string;
}

export interface StaticAnalysisResult {
  id?: string;
  filename: string;
  file_path?: string;
  sha256: string;
  size_bytes: number;
  entropy: number;
  file_type: string;
  is_pe: boolean;
  is_script: boolean;
  threat_state: "SAFE" | "SUSPICIOUS" | "THREAT";
  classification: ThreatCategory;
  risk_score: number;
  confidence: number;
  detected_indicators: string[];
  behavioral_summary: string;
  recommended_action: string;
  syntax_preview?: string;
  created_at?: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  mimeType: string;
  chunkCount: number;
  ingestionStatus: string;
  createdAt: string;
  doc_type: string;
  primary_category: string;
  target_categories: string[];
  summary: string;
  mitigation_steps: string[];
  confidence: number;
  extractedEntities?: any[];
}

export interface RAGInvestigationResponse {
  query: string;
  answer: string;
  confidence_score: number;
  response_status?: string;
  sources: Array<{
    id: string;
    document_id: string;
    content: string;
    score: number;
    metadata?: {
      source?: string;
      doc_type?: string;
      sensitivity_tier?: string;
    };
  }>;
  retrieval_latency_ms?: number;
  generation_latency_ms?: number;
  grounding_verified?: boolean;
}

export interface Playbook {
  id: string;
  title: string;
  threat_category: ThreatCategory;
  severity: ThreatSeverity;
  description: string;
  steps: Array<{
    id: string;
    name: string;
    action_type: string;
    description: string;
    is_automated: boolean;
    simulated: boolean;
  }>;
}

export interface P8TestReport {
  id: string;
  target_url: string;
  target_name: string;
  started_at: string;
  status: "completed" | "running" | "failed";
  pass_rate: number;
  accessibility_score: number;
  steps_executed: number;
  detected_issues: Array<{
    id: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    affected_url: string;
    description: string;
    wcag_rule_id?: string;
    reproduction_steps?: string[];
  }>;
  agent_steps: Array<{
    step_number: number;
    timestamp: string;
    action_type: string;
    description: string;
    status: string;
  }>;
}

export interface DemoStep {
  stepIndex: number;
  phaseName: "TELEMETRY" | "DETECTION" | "ALERT" | "INCIDENT" | "INVESTIGATION" | "MITIGATION" | "AUDIT";
  title: string;
  summary: string;
  highlightTab: NavSubTab;
  actionRequired: string;
  activeEntityId?: string;
}
