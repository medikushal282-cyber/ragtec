import { API_BASE } from './utils';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Threat {
  id: string;
  name: string;
  type: string;
  origin: string;
  severity: string;
  solution?: string;
  exceptions?: string;
  ts?: string;
  created_at?: string;
}

export interface TelemetryData {
  cpu_usage: number;
  memory_usage: number;
  latency_ms: number;
  accuracy: number;
  active_proxies: number;
}

export interface ChatResponse {
  role: string;
  content: string;
  confidence: number;
  evidence: string[];
  executive_summary?: string;
  severity?: string;
  technical_analysis?: string;
  business_impact?: string;
  risk_score?: number;
  immediate_mitigation?: string[];
  patch_guidance?: string;
  workarounds?: string[];
  detection?: string[];
  mitre_mapping?: string[];
  references?: string[];
  sources?: string[];
  is_zero_day?: boolean;
  zero_day_guidance?: Record<string, string>;
  session_id?: string;
}

export interface RetrieveResult {
  id: string;
  severity: string;
  timestamp: string;
  scores: {
    similarity: number;
    recency: number;
    severity: number;
    trust: number;
    final: number;
  };
}

export interface SystemStatus {
  frontend: string;
  backend: string;
  database: { status: string; threat_count: number; size_mb: number };
  websocket: { status: string; active_connections: number };
  threat_feed: string;
  ai_engine: string;
  telemetry: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  threat_id?: string;
  severity: string;
  timestamp: string;
  read: boolean;
}

export interface AnalyticsHistorical {
  name: string;
  threats: number;
}

// ─── Fetch Wrapper ───────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('ragsec_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  
  if (res.status === 401) {
    localStorage.removeItem('ragsec_token');
    window.location.href = '/login';
    throw new Error('Unauthorized - Please login again');
  }
  
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Threats ─────────────────────────────────────────────────────────────────
export async function fetchThreats(params?: {
  limit?: number;
  severity?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
}): Promise<Threat[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.severity) query.set('severity', String(params.severity));
  if (params?.search) query.set('search', params.search);
  if (params?.sort_by) query.set('sort_by', params.sort_by);
  if (params?.sort_dir) query.set('sort_dir', params.sort_dir);
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));
  const qs = query.toString();
  return apiFetch<Threat[]>(`/api/threats/${qs ? `?${qs}` : ''}`);
}

export async function fetchInitialThreats(): Promise<Threat[]> {
  return apiFetch<Threat[]>('/api/threats/initial');
}

export async function fetchThreatCount(): Promise<number> {
  try {
    const data = await apiFetch<{ count: number }>('/api/threats/count');
    return data.count;
  } catch {
    return 0;
  }
}

// ─── Telemetry ───────────────────────────────────────────────────────────────
export async function fetchTelemetry(): Promise<TelemetryData> {
  return apiFetch<TelemetryData>('/api/system/telemetry');
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export async function fetchAnalyticsHistorical(): Promise<AnalyticsHistorical[]> {
  return apiFetch<AnalyticsHistorical[]>('/api/analytics/historical');
}

export async function fetchAnalyticsTrending(): Promise<any[]> {
  return apiFetch('/api/analytics/trending');
}

export async function fetchAnalyticsVendors(): Promise<any[]> {
  return apiFetch('/api/analytics/vendors');
}

export async function fetchAnalyticsMetrics(): Promise<any> {
  return apiFetch('/api/analytics/metrics');
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export interface ChatSessionHistory extends ChatSession {
  messages: ChatResponse[];
}

// ─── Chat (AI Copilot) ──────────────────────────────────────────────────────
export async function fetchSessions(): Promise<ChatSession[]> {
  return apiFetch<ChatSession[]>('/api/chat/sessions');
}

export async function fetchSessionHistory(sessionId: string): Promise<ChatSessionHistory> {
  return apiFetch<ChatSessionHistory>(`/api/chat/sessions/${sessionId}`);
}

export async function deleteSession(sessionId: string): Promise<any> {
  return apiFetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function fetchModels(): Promise<string[]> {
  const data = await apiFetch<{models: string[]}>('/api/chat/models');
  return data.models;
}

export async function postChat(
  message: string, 
  model: string = 'llama3.2', 
  history: any[] = [], 
  image_b64?: string,
  session_id?: string
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, model, history, image_b64, session_id }),
  });
}

// ─── Scanner ────────────────────────────────────────────────────────────────
export async function fetchFolderScan(path: string): Promise<any> {
  return apiFetch(`/api/scanner/folder?path=${encodeURIComponent(path)}`);
}

// ─── Retrieve ────────────────────────────────────────────────────────────────
export async function postRetrieve(
  query: string,
  useRagsec: boolean,
  weights?: { sim?: number; recency?: number; severity?: number; trust?: number }
): Promise<RetrieveResult[]> {
  return apiFetch<RetrieveResult[]>('/api/retrieve/', {
    method: 'POST',
    body: JSON.stringify({
      query,
      useRagsec,
      sim_weight: weights?.sim,
      recency_weight: weights?.recency,
      severity_weight: weights?.severity,
      trust_weight: weights?.trust,
    }),
  });
}

// ─── System Status ───────────────────────────────────────────────────────────
export async function fetchSystemStatus(): Promise<SystemStatus> {
  return apiFetch<SystemStatus>('/api/system/status');
}

// ─── Notifications ───────────────────────────────────────────────────────────
export async function fetchNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>('/api/notifications');
}

// ─── Investigation ───────────────────────────────────────────────────────────
export async function fetchInvestigation(threatId: string): Promise<any> {
  return apiFetch(`/api/investigation/${encodeURIComponent(threatId)}`);
}

// ─── Actionable SOC Workflows (Phase 4) ──────────────────────────────────────
export async function blockIoc(ioc: string, threatId: string): Promise<any> {
  return apiFetch(`/api/actions/block-ioc?ioc=${encodeURIComponent(ioc)}&threat_id=${encodeURIComponent(threatId)}`, {
    method: 'POST'
  });
}

export async function triggerMitigation(threatId: string): Promise<any> {
  return apiFetch(`/api/actions/trigger-mitigation?threat_id=${encodeURIComponent(threatId)}`, {
    method: 'POST'
  });
}

export async function downloadReport(threatId: string): Promise<void> {
  const token = localStorage.getItem('ragsec_token');
  const res = await fetch(`${API_BASE}/api/actions/export-report/${encodeURIComponent(threatId)}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to download report');
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Incident_Report_${threatId}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ─── Playbooks ───────────────────────────────────────────────────────────────
export async function fetchPlaybooks(): Promise<any[]> {
  return apiFetch('/api/actions/playbooks');
}

// ─── WebSocket Factory (Phase 5 - Exponential Backoff & Heartbeat) ───────────
export function createThreatSocket(onMessage: (threat: Threat) => void): WebSocket {
  const wsBase = API_BASE.replace(/^http/, 'ws');
  let ws: WebSocket;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 7; // Cap at ~2 minutes backoff
  const baseDelayMs = 1000;
  
  // Heartbeat tracking
  let pingInterval: ReturnType<typeof setInterval>;
  let pongTimeout: ReturnType<typeof setTimeout>;

  function connect() {
    ws = new WebSocket(`${wsBase}/ws/threats`);
    
    ws.onopen = () => {
      console.log('[RAGSec WS] Connected to threat feed');
      reconnectAttempts = 0; // Reset attempts on success
      
      // Start Heartbeat
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
          // Expect a pong back within 5 seconds
          pongTimeout = setTimeout(() => {
            console.warn('[RAGSec WS] Heartbeat timeout. Reconnecting...');
            ws.close();
          }, 5000);
        }
      }, 30000); // Ping every 30s
    };
    
    ws.onmessage = (event) => {
      // Handle heartbeat pong
      if (event.data === 'pong') {
        clearTimeout(pongTimeout);
        return;
      }
      
      try {
        const threat: Threat = JSON.parse(event.data);
        onMessage(threat);
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('[RAGSec WS] Disconnected.');
      clearInterval(pingInterval);
      clearTimeout(pongTimeout);
      
      // Exponential Backoff Reconnection
      if (reconnectAttempts < maxReconnectAttempts) {
        const backoffDelay = baseDelayMs * Math.pow(2, reconnectAttempts);
        console.log(`[RAGSec WS] Reconnecting in ${backoffDelay}ms (Attempt ${reconnectAttempts + 1})`);
        setTimeout(() => connect(), backoffDelay);
        reconnectAttempts++;
      } else {
        console.error('[RAGSec WS] Max reconnection attempts reached. Feed offline.');
      }
    };
    
    ws.onerror = (err) => {
      console.error('[RAGSec WS] Error:', err);
      ws.close(); // Force trigger onclose for reconnection logic
    };
  }

  connect();
  
  // Expose a pseudo-WebSocket interface that proxies to the current instance
  return {
    close: () => {
      reconnectAttempts = maxReconnectAttempts; // Prevent auto-reconnect on deliberate close
      ws.close();
    },
    get readyState() { return ws.readyState; },
    send: (data: string) => ws.send(data),
  } as unknown as WebSocket;
}
export const fetchPatchQueue = async () => {
  const response = await fetch(`${API_BASE}/api/v1/patch/queue`);
  if (!response.ok) throw new Error('Failed to fetch patch queue');
  return response.json();
};

export const fetchKBDocuments = async () => {
  const response = await fetch(`${API_BASE}/api/v1/kb/documents`);
  if (!response.ok) throw new Error('Failed to fetch KB documents');
  return response.json();
};

export const fetchPipelineTopology = async () => {
  const response = await fetch(`${API_BASE}/api/v1/pipeline/topology`);
  if (!response.ok) throw new Error('Failed to fetch pipeline topology');
  return response.json();
};

export const fetchSettingsProfile = async () => {
  const response = await fetch(`${API_BASE}/api/v1/settings/profile`);
  if (!response.ok) throw new Error('Failed to fetch settings profile');
  return response.json();
};
