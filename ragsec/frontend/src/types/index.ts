export type Page = "dashboard" | "knowledge" | "fleet" | "incident" | "mitigation";

export interface BackendStatus {
  status: string;
  version: string;
  docs: string;
}

export interface VectorSearchResult {
  id: string;
  document_id: string;
  content: string;
  score: number;
  metadata?: {
    source?: string;
    category?: string;
    cve_id?: string;
    threat_actor?: string;
    created_at?: string;
  };
}

export interface QueryResponse {
  query: string;
  answer: string;
  sources: VectorSearchResult[];
  confidence_score: number;
  retrieval_latency_ms: number;
  generation_latency_ms: number;
  security_audit?: {
    prompt_injection_detected: boolean;
    data_exfiltration_risk: boolean;
    sanitized: boolean;
  };
}

export interface FIMEvent {
  id: string;
  timestamp: string;
  file_path: string;
  event_type: "created" | "modified" | "deleted" | "moved" | "permission_change";
  file_hash?: string;
  process_name?: string;
  user?: string;
  threat_score: number;
  quarantined: boolean;
}

export interface QuarantinedFile {
  id: string;
  original_path: string;
  quarantine_path: string;
  quarantined_at: string;
  reason: string;
  size_bytes: number;
}

export interface SOCIncident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "investigating" | "contained" | "resolved";
  category: "ransomware" | "unauthorized_access" | "fim_breach" | "prompt_injection" | "data_exfiltration";
  timestamp: string;
  affected_assets: string[];
  description: string;
  mitigation_status: string;
}

export interface SOCAlert {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  timestamp: string;
  details: string;
}

export interface MitigationRule {
  id: string;
  name: string;
  type: "ip_block" | "fim_lock" | "prompt_guard" | "quarantine_auto";
  status: "active" | "disabled" | "triggered";
  target: string;
  action_count: number;
  last_triggered?: string;
}
