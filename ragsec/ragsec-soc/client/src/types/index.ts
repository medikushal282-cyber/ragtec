export type Page = 
  | "dashboard" 
  | "code_explorer"
  | "file_scanner"
  | "threat_lab"
  | "ai_chat"
  | "mitigation"
  | "incident"
  | "knowledge"
  | "test_reports"
  | "autonomous_tester"
  | "governance_lab"
  | "sps_benchmark"
  | "siem_gateway"
  | "fleet" 
  | "active_threats";

export interface BackendStatus {
  status: string;
  version: string;
  docs: string;
}

// --- 10-Category Threat Taxonomy ---
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
  | "BENIGN"
  | "UNKNOWN";

export type ThreatStatus = "SAFE" | "SUSPICIOUS" | "THREAT" | "UNKNOWN" | "QUARANTINED" | "BENIGN";
export type ThreatSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type CRUDEventType = "CREATED" | "MODIFIED" | "DELETED" | "MOVED" | "PERM_CHANGE" | "AI_ANALYSIS" | "SCAN" | "QUARANTINED";

export interface FileCRUDEvent {
  id: string;
  timestamp: string;
  event_type: CRUDEventType;
  file_path: string;
  file_name: string;
  file_size_bytes?: number;
  file_hash?: string;
  process_name?: string;
  user?: string;
  threat_status: ThreatStatus;
  category: ThreatCategory;
  severity: ThreatSeverity;
  confidence: number;
  reasons: string[];
  evidence: string[];
  quarantined: boolean;
  content_preview?: string;
}

export interface FileAnalysisDetail {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  size_bytes: number;
  modified_at: string;
  sha256_hash: string;
  threat_status: ThreatStatus;
  category: ThreatCategory;
  severity: ThreatSeverity;
  confidence: number;
  syntax_highlighted_code?: string;
  defensive_indicators: {
    persistence_mechanisms: boolean;
    credential_access: boolean;
    obfuscated_code: boolean;
    network_comms: boolean;
    destructive_file_ops: boolean;
    suspicious_process_exec: boolean;
    encoded_payloads: boolean;
  };
  explanation: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  timestamp: string;
  text: string;
  evidence_references?: {
    file_name: string;
    file_path: string;
    category: ThreatCategory;
    severity: ThreatSeverity;
    confidence: number;
  }[];
}
