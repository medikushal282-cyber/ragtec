export type Page = 
  | "dashboard" 
  | "autonomous_tester"
  | "test_reports"
  | "knowledge" 
  | "fleet" 
  | "incident" 
  | "mitigation";

export interface BackendStatus {
  status: string;
  version: string;
  docs: string;
}

// --- P8 Autonomous Testing Types ---

export type P8TestType = 
  | "functional" 
  | "ui_ux" 
  | "accessibility" 
  | "navigation" 
  | "form_input" 
  | "responsive";

export type BrowserTarget = 
  | "chromium" 
  | "firefox" 
  | "webkit" 
  | "mobile_ios" 
  | "mobile_android" 
  | "tablet";

export interface P8TestRunConfig {
  target_url: string;
  target_name: string;
  scope: "domain_only" | "subdomains" | "single_path";
  test_types: P8TestType[];
  browser: BrowserTarget;
  custom_instructions: string;
  autonomous_exploration: boolean;
  max_crawl_depth: number;
  max_action_budget: number;
}

export interface P8AgentActivityStep {
  step_number: number;
  timestamp: string;
  action_type: "navigate" | "click" | "type" | "submit" | "screenshot" | "assert" | "inspect";
  description: string;
  target_selector?: string;
  status: "success" | "warning" | "error" | "running";
  screenshot_url?: string;
}

export interface P8DetectedIssue {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "functional" | "accessibility" | "ui_ux" | "security" | "responsive";
  affected_url: string;
  element_selector: string;
  description: string;
  reproduction_steps: string[];
  wcag_rule_id?: string;
  wcag_level?: "A" | "AA" | "AAA";
  screenshot_url?: string;
  status: "open" | "retesting" | "resolved" | "ignored";
  detected_at: string;
}

export interface P8TestReport {
  id: string;
  target_url: string;
  target_name: string;
  started_at: string;
  completed_at?: string;
  status: "running" | "paused" | "completed" | "failed";
  config: P8TestRunConfig;
  steps_executed: number;
  pass_rate: number;
  accessibility_score: number;
  detected_issues: P8DetectedIssue[];
  agent_steps: P8AgentActivityStep[];
}

// --- RAGSec Threat Intelligence Types ---

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
  status: "active" | "disabled";
  target: string;
  action_count: number;
  last_triggered?: string;
}
