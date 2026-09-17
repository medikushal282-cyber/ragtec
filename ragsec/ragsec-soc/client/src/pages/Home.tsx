import { useMemo, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, CheckCircle2, ChevronRight, CircleDashed, CircleDot,
  ClipboardCheck, Clock, CloudUpload, Database, EyeOff, FileKey2, FileWarning, Filter, Flame, Globe2,
  Hash, LayoutDashboard, LockKeyhole, Menu, MessageSquareText, Network, Play, Plus,
  Radar, RefreshCw, RotateCcw, Search, Send, Server, Settings2, ShieldAlert, ShieldCheck, Siren,
  SlidersHorizontal, Sparkles, Terminal, UserRound, Users, X, XCircle, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

const nav = [
  ["Dashboard", LayoutDashboard], ["Threat Query", MessageSquareText], ["Alerts", ShieldAlert],
  ["Incidents", Siren], ["FIM Monitor", FileWarning], ["Fleet", Server], ["Mitigation", Zap],
  ["Knowledge Base", Database], ["Audit Log", ClipboardCheck], ["Settings", Settings2]
] as const;

const alerts = [
  { id: "ALT-10482", title: "Ransomware encryption behavior", host: "FIN-WS-042", severity: "Critical", status: "Investigating", age: "4m", tactic: "Impact", hash: "a9f2â€¦c31e" },
  { id: "ALT-10481", title: "PowerShell encoded command", host: "ENG-LT-019", severity: "High", status: "New", age: "11m", tactic: "Execution", hash: "b41câ€¦99d2" },
  { id: "ALT-10480", title: "Unsigned binary in system32", host: "DMZ-WEB-03", severity: "High", status: "Investigating", age: "18m", tactic: "Defense Evasion", hash: "7d0aâ€¦4f18" },
  { id: "ALT-10479", title: "Repeated failed lateral movement", host: "OPS-SRV-07", severity: "Medium", status: "New", age: "29m", tactic: "Lateral Movement", hash: "â€”" },
  { id: "ALT-10477", title: "External scan against VPN", host: "EDGE-GW-01", severity: "Low", status: "Resolved", age: "42m", tactic: "Reconnaissance", hash: "â€”" },
];
const incidents = [
  { id: "INC-2026-019", title: "Active encryption chain on Finance subnet", severity: "Critical", state: "Escalated", time: "09:42", owner: "M. Chen", techniques: ["T1486", "T1059.001"] },
  { id: "INC-2026-018", title: "Credential access indicators on engineering laptop", severity: "High", state: "Investigating", time: "08:56", owner: "A. Rao", techniques: ["T1059", "T1003"] },
  { id: "INC-2026-017", title: "Internet-facing web shell candidate", severity: "Medium", state: "Contained", time: "Yesterday", owner: "J. Patel", techniques: ["T1505.003"] },
];
const fim = [
  { time: "09:48:14", host: "FIN-WS-042", path: "C:\\Users\\Public\\invoice.exe", action: "Added", risk: 98, hash: "a9f2c3â€¦c31e", judgment: "Suspicious" },
  { time: "09:45:02", host: "DMZ-WEB-03", path: "/var/www/html/.cache.php", action: "Modified", risk: 86, hash: "7d0a44â€¦4f18", judgment: "Suspicious" },
  { time: "09:39:41", host: "ENG-LT-019", path: "C:\\Windows\\Temp\\ps_1.tmp", action: "Added", risk: 74, hash: "b41c11â€¦99d2", judgment: "Suspicious" },
  { time: "09:31:19", host: "OPS-SRV-07", path: "/etc/ssh/sshd_config", action: "Modified", risk: 38, hash: "d0ee55â€¦1a2c", judgment: "Benign" },
];
const logs = [
  "09:48:14.221  IDS/IPS  signature=ET RANSOMWARE Possible BlackSuit encryption  src=10.24.8.42 dst=10.24.1.19 action=ALERT",
  "09:47:56.012  FIM      host=FIN-WS-042 event=CREATE path=C:\\Users\\Public\\invoice.exe sha256=a9f2c3â€¦c31e",
  "09:47:02.843  SIGMA    rule=Suspicious PowerShell Encoded Command host=ENG-LT-019 user=<INTERNAL_USER_1>",
  "09:46:38.521  NETFLOW  src=10.24.8.42 dst=10.24.1.19 ports=445,3389 bytes=18840 verdict=ANOMALOUS",
  "09:45:02.449  FIM      host=DMZ-WEB-03 event=MODIFY path=/var/www/html/.cache.php sha256=7d0a44â€¦4f18",
  "09:44:15.108  IDS/IPS  signature=ET SCAN Potential SSH Scan src=185.220.101.4 dst=10.24.0.0/16 action=DROP",
];

function Severity({ value }: { value: string }) { const cls = value === "Critical" ? "critical" : value === "High" ? "high" : value === "Medium" ? "medium" : "low"; return <span className={`severity ${cls}`}><span className="dot" />{value}</span>; }
function Status({ value }: { value: string }) { return <span className={`status status-${(value || "open").toLowerCase()}`}><span className="dot" />{value}</span>; }
function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="section-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>; }
function MiniStat({ label, value, tone, sub }: { label: string; value: string; tone: string; sub: string }) { return <div className="mini-stat"><div className={`stat-icon ${tone}`}><Activity size={17} /></div><div><div className="stat-label">{label}</div><strong>{value}</strong><span>{sub}</span></div></div>; }

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [active, setActive] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [sentQuery, setSentQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchResults = trpc.soc.globalSearch.useQuery({ q: searchQuery }, { enabled: searchQuery.length >= 2 });
  const health = trpc.soc.systemHealth.useQuery(undefined, { refetchInterval: 10000 });

  const flash = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(""), 2600); };
  const page = active === "Dashboard" ? <Dashboard onNavigate={setActive} demoMode={demoMode} /> : active === "Threat Query" ? <ThreatQuery demoMode={demoMode} /> : active === "Knowledge Base" ? <Knowledge demoMode={demoMode} flash={flash} /> : active === "Audit Log" ? <Audit demoMode={demoMode} /> : <StubPage name={active} demoMode={demoMode} flash={flash} />;

  const isNominal = health.data?.status === "online";
  const healthLabel = health.data?.msg || "CHECKING...";
  
  if (loading) return <div className="splash"><Radar size={34} /><span>INITIALIZING SECURE CONSOLE</span></div>;
  return <div className="app-shell">
    {notice && <div className="toast"><CheckCircle2 size={17} /> {notice}</div>}
    <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Radar size={21} /></div><div><b>RAGSEC</b><span>SOC / COMMAND</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
      <div className="side-label">OPERATIONS</div>
      <nav>{nav.slice(0, 7).map(([label, Icon]) => <button key={label} className={active === label ? "nav-active" : ""} onClick={() => { setActive(label); setMobileNav(false); }}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <div className="side-label">GOVERNANCE</div>
      <nav>{nav.slice(7).map(([label, Icon]) => <button key={label} className={active === label ? "nav-active" : ""} onClick={() => { setActive(label); setMobileNav(false); }}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <div className="side-bottom"><div className="system-card"><div className={isNominal ? "online" : "offline"}><span className={isNominal ? "pulse" : ""} /> {healthLabel}</div><small>Core services</small><div className="system-bar"><span style={{background: isNominal ? "var(--lime)" : "var(--pink)"}} /></div></div><div className="profile"><div className="avatar">{user?.name?.slice(0, 1) || "A"}</div><div><b>{user?.name || "Analyst One"}</b><span>Tier 3 · SOC Analyst</span></div><ChevronRight size={15} /></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="crumb"><span>SECURITY OPERATIONS</span><ChevronRight size={14} /><b>{active.toUpperCase()}</b></div><div className="top-actions"><div className="global-search" style={{position:"relative"}}><Search size={15} /><input placeholder="Search IOC, host, CVE…" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)} onBlur={() => setTimeout(() => setShowSearch(false), 200)} />{showSearch && searchQuery.length >= 2 && <div style={{position:"absolute",top:"100%",left:0,width:350,background:"#11131a",border:"1px solid var(--border)",borderRadius:6,maxHeight:300,overflowY:"auto",zIndex:999,padding:"0.5rem",boxShadow:"0 10px 25px rgba(0,0,0,0.5)"}}>{searchResults.isLoading && <div className="muted" style={{padding:"0.5rem"}}>Searching...</div>}{!searchResults.isLoading && (searchResults.data?.results || []).length === 0 && <div className="muted" style={{padding:"0.5rem"}}>No results for "{searchQuery}"</div>}{(searchResults.data?.results || []).map((r: any, i: number) => (
          <div key={i} style={{padding:"0.4rem 0.5rem",borderBottom:"1px solid var(--border)",fontSize:"0.8rem",cursor:"pointer"}} onClick={() => { 
            if(r.type === "entity") { setQuery(r.value); setActive("Threat Query"); } 
            setShowSearch(false); 
          }}>
            <span style={{fontSize:"0.65rem",padding:"1px 6px",borderRadius:3,background:"var(--cyan)",color:"#000",marginRight:6}}>{r.type.toUpperCase()}</span>
            {r.type === "entity" ? `${r.entity_type}: ${r.value}` : r.type === "document" ? r.name : (r.text || r.snippet)?.slice(0,80)}
            {r.score && <span style={{color:"var(--green)",marginLeft:6,fontSize:"0.7rem"}}>({r.score})</span>}
          </div>
        ))}</div>}</div><div className="status-pill" style={{borderColor: isNominal ? "var(--lime)" : "var(--pink)", color: isNominal ? "var(--lime)" : "var(--pink)"}}><span className={isNominal ? "pulse" : ""} style={{background: isNominal ? "var(--lime)" : "var(--pink)"}} /> {healthLabel}</div><button className="icon-button" onClick={() => flash("No new notifications") }><BellIcon /></button><button className={`demo-toggle-btn ${demoMode ? "demo-active" : ""}`} onClick={() => { const next = !demoMode; setDemoMode(next); flash(next ? "DEMO TELEMETRY ACTIVE (Synthetic Dataset)" : "LIVE TELEMETRY ACTIVE (Real Filesystem)"); }} style={{display:"inline-flex",alignItems:"center",gap:"6px",background:demoMode ? "rgba(255, 184, 0, 0.18)" : "rgba(255, 255, 255, 0.05)",border:`1px solid ${demoMode ? "#f59e0b" : "var(--border)"}`,color:demoMode ? "#fbbf24" : "var(--text-muted)",padding:"4px 10px",borderRadius:"16px",fontSize:"0.75rem",fontWeight:600,cursor:"pointer",letterSpacing:"0.5px"}} title="Toggle Demo Mode"><span style={{width:7,height:7,borderRadius:"50%",background:demoMode ? "#fbbf24" : "#666",boxShadow:demoMode ? "0 0 8px #fbbf24" : "none"}} />{demoMode ? "DEMO MODE" : "LIVE MODE"}</button>{isAuthenticated ? <div className="top-avatar">{user?.name?.slice(0, 1) || "A"}</div> : <Button onClick={() => startLogin()} className="login-btn">Sign in</Button>}</div></header>
      <div className="content">{page}</div>
    </main>
  </div>;
}
function BellIcon() { return <Siren size={17} />; }

function Dashboard({ onNavigate, demoMode }: { onNavigate: (x: string) => void; demoMode?: boolean }) {
    const telemetry = trpc.soc.telemetrySnapshot.useQuery(undefined, { refetchInterval: 12000 });
    const data = telemetry.data;
    const activeCount = demoMode ? "12" : data?.incidents?.length ? String(data.incidents.length) : "0";
    const criticalCount = demoMode ? "3" : data?.metrics?.critical_incidents ? String(data.metrics.critical_incidents) : "0";
    const protectedCount = demoMode ? "48" : data?.metrics?.device_count ? String(data.metrics.device_count) : "7";
    
    // Fallbacks to empty arrays
    const liveIncidents = demoMode ? incidents : (data?.incidents || []);
    const liveFim = demoMode ? fim : (data?.fim || []);
    const logs: string[] = []; // Not implemented in MVP yet
    
    return <div className="page">
      {demoMode && (
        <div style={{padding:"0.75rem 1rem",background:"rgba(255,184,0,0.1)",border:"1px solid #f59e0b",borderRadius:6,marginBottom:"1rem",color:"#fbbf24",fontSize:"0.8rem",display:"flex",alignItems:"center",gap:8}}>
          <Flame size={16} />
          <b>DEMO TELEMETRY ACTIVE:</b> You are viewing the synthetic cybersecurity demonstration dataset. Toggle top-right to switch to Live Real Telemetry.
        </div>
      )}
      <div className="hero-row">
        <div>
          <p className="eyebrow">{demoMode ? "DEMO MODE · SYNTHETIC TELEMETRY FIXTURES" : "LIVE MODE · REAL FILESYSTEM & DATABASE ACTIVE"}</p>
          <h1>Good morning, <span>Analyst.</span></h1>
          <p className="muted">Your network is being watched. Here is the signal.</p>
        </div>
        <Button className="outline-btn" onClick={() => onNavigate("Threat Query")}><Sparkles size={16} /> Ask RAGSec</Button>
      </div>
      
      <div className="stat-grid">
        <MiniStat label="Active alerts" value={activeCount} tone="pink" sub={demoMode ? "Demo" : "Live"} />
        <MiniStat label="Critical incidents" value={criticalCount} tone="red" sub={demoMode ? "Demo" : "Live"} />
        <MiniStat label="Protected endpoints" value={protectedCount} tone="cyan" sub={demoMode ? "Demo" : "Live"} />
        <MiniStat label="SOC productivity" value={demoMode ? "94% efficiency" : "Not yet measured"} tone="lime" sub="" />
      </div>
      
      <div className="dashboard-grid">
        <section className="panel threat-panel">
          <SectionTitle eyebrow="THREAT LANDSCAPE / 24H" title="Signal intensity" action={<span className="live-tag"><span className="pulse" /> LIVE</span>} />
          <div className="heatmap">
            <div className="heat-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
            <div className="heat-grid">{Array.from({ length: 96 }, (_, i) => <i key={i} style={{ opacity: 0.18 + ((i * 17) % 80) / 100, background: i % 11 === 0 ? "#ff3da9" : i % 5 === 0 ? "#47eaff" : "#8c4dff" }} />)}</div>
            <div className="heat-legend">
              <span><i className="legend-dot cyan" /> Ingested {data?.metrics?.total_events || 0}</span>
              <span><i className="legend-dot pink" /> FIM Events {data?.metrics?.fim_events || 0}</span>
              <span><i className="legend-dot red" /> Incidents {data?.metrics?.total_incidents || 0}</span>
            </div>
          </div>
        </section>
        
        <section className="panel sps-panel">
          <SectionTitle eyebrow="AI PERFORMANCE / SPS" title="Productivity score" action={<button className="ghost-btn"><RefreshCw size={14} /></button>} />
          <div className="gauge-wrap" style={{opacity: 0.5}}>
            <div className="gauge"><div className="gauge-inner"><strong style={{fontSize:"1.5rem"}}>Not measured</strong><span>OUT OF 3.0</span></div></div>
            <div className="gauge-copy"><p>Governed RAG pipeline</p><small>Target threshold <b>2.400</b></small></div>
          </div>
          <div className="metric-row" style={{opacity: 0.5}}>
            <div><span>Factual alignment</span><b>N/A</b><Progress value={0} /></div>
            <div><span>Triage efficiency</span><b>N/A</b><Progress value={0} /></div>
          </div>
        </section>
      </div>
      
      <div className="lower-grid">
        <section className="panel">
          <SectionTitle eyebrow="ACTIVE QUEUE" title="Recent incidents" action={<button className="text-btn" onClick={() => onNavigate("Incidents")}>View all <ArrowUpRight size={14} /></button>} />
          <div className="incident-list">
            {liveIncidents.length === 0 && <div className="muted" style={{padding:"2rem",textAlign:"center"}}>No incidents active.</div>}
            {liveIncidents.map((i: any) => <div className="incident-row" key={i.id}>
              <div className={`incident-marker ${(i.threat_classification?.severity || 'medium').toLowerCase()}`}><Siren size={15} /></div>
              <div className="incident-main">
                <p>{i.title}</p>
                <div className="incident-meta">
                  <Severity value={i.severity} />
                  <span className="incident-id">{i.id}</span>
                  <Status value={i.state} />
                </div>
              </div>
              <div className="incident-tail"><span>{i.time}</span><span>{i.owner}</span></div>
              <button className="icon-button"><ChevronRight size={16}/></button>
            </div>)}
          </div>
        </section>
        
        <section className="panel">
          <SectionTitle eyebrow="FILE INTEGRITY MONITORING" title="File system activity" action={<button className="text-btn" onClick={() => onNavigate("FIM Monitor")}>View all <ArrowUpRight size={14} /></button>} />
          <div className="fim-list">
            {liveFim.length === 0 && <div className="muted" style={{padding:"2rem",textAlign:"center"}}>No FIM activity monitored.</div>}
            {liveFim.map((f: any, idx: number) => {
              const formattedTime = f.time || (f.timestamp ? new Date(f.timestamp).toLocaleTimeString() : "Now");
              const host = f.host || f.device_id || "local";
              const action = (f.action || f.canonical?.action || "unknown").toLowerCase();
              const path = f.path || f.canonical?.file_path || f.title || "unknown";
              const isRisk = (f.risk || f.canonical?.risk_score || 0) > 50;
              const judgment = f.judgment || (isRisk ? "Suspicious" : "Benign");
              return (
                <div className="fim-row" key={f.id || idx}>
                  <div className="fim-main">
                    <span className="fim-time">{formattedTime}</span>
                    <span className="fim-host">{host}</span>
                    <span className={`fim-action ${action}`}>{action.toUpperCase()}</span>
                    <p className="fim-path">{path}</p>
                  </div>
                  <div className="fim-meta">
                    {isRisk ? <span className="risk-score">RISK {f.risk || f.canonical?.risk_score}</span> : null}
                    <span className={`fim-badge ${isRisk ? 'suspect' : 'benign'}`}>{judgment}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        
        <section className="panel col-span-2">
          <SectionTitle eyebrow="AUTONOMOUS RESPONSE" title="Action stream" action={<span className="metric-tag">LAST 60 MIN</span>} />
          <div className="stream-list">
            {logs.length === 0 && <div className="muted" style={{padding:"2rem",textAlign:"center"}}>No autonomous actions.</div>}
          </div>
        </section>
      </div>
    </div>;
  }

function ThreatQuery({ demoMode }: { demoMode?: boolean }) {
  const [inputVal, setInputVal] = useState("");
  const [showEvidenceMap, setShowEvidenceMap] = useState<Record<number, boolean>>({});
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    status?: string;
    confidence?: number;
    evidence?: any[];
    governance?: any;
    timestamp: string;
  }>>([
    {
      id: "init-1",
      role: "assistant",
      content: "Hello! I am your **RAGSec Cybersecurity Co-Pilot**. You can ask me about recent security incidents, threat actor tactics, indicators of compromise (IOCs), or recommended mitigation playbooks. How can I assist your investigation today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const queryApi = trpc.soc.queryPhase7.useMutation({
    onSuccess: (data) => {
      setChatHistory(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: data.answer || "No response generated.",
          status: data.status,
          confidence: data.confidence_score,
          evidence: data.evidence || [],
          governance: data.governance || null,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    },
    onError: (err) => {
      setChatHistory(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `⚠ **Investigation Error:** ${err.message || "Failed to query threat intelligence backend."}`,
          status: "ERROR",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  });

  const send = () => {
    const q = inputVal.trim();
    if (!q) return;

    // Append user message immediately
    setChatHistory(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: q,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setInputVal("");

    if (demoMode) {
      // Instant rich demo response
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev,
          {
            id: `demo-${Date.now()}`,
            role: "assistant",
            content: `### Threat Intelligence Assessment\n\nBased on enterprise CTI corpus and real-time telemetry:\n\n* **Primary Vector:** Spearphishing email carrying malicious macro targeting host \`FIN-WS-042\` [C1].\n* **Observed IOCs:** SHA-256 hash \`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\`, C2 Domain \`badguy-command.xyz\` [C2].\n* **Exploited CVE:** **CVE-2023-38831** (WinRAR Remote Code Execution vulnerability) [C3].\n* **Recommended Immediate Action:** Execute immediate quarantine of payload and isolate \`FIN-WS-042\` from subnet 10.0.0.0/24.`,
            status: "VERIFIED",
            confidence: 0.94,
            evidence: [
              { citation_tag: "C1", source_name: "Internal Incident Narrative", rerank_score: 8.95, text: "Initial access achieved via spearphishing delivering payload on FIN-WS-042." },
              { citation_tag: "C2", source_name: "CISA Cybersecurity Advisory", rerank_score: 8.42, text: "Threat actor utilizes badguy-command.xyz for second-stage C2 staging." },
              { citation_tag: "C3", source_name: "NVD CVE-2023-38831", rerank_score: 7.91, text: "Vulnerability allows execution of arbitrary code via weaponized ZIP archives." }
            ],
            governance: { identity_verified: true, pii_masked: true, cross_encoder_active: true, citation_check: "VERIFIED", gating: "PASSED" },
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }, 600);
      return;
    }

    queryApi.mutate({ query: q });
  };

  const toggleEvidence = (idx: number) => {
    setShowEvidenceMap(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const lastAssistantMsg = [...chatHistory].reverse().find(m => m.role === "assistant");
  const latestGov = lastAssistantMsg?.governance;

  const GovCheck = ({ ok, label }: { ok: boolean | undefined; label: string }) => (
    <li style={{color: ok === undefined ? "var(--text-muted)" : ok ? "var(--lime)" : "var(--pink)", display:"flex", alignItems:"center", gap:6, marginBottom:6, fontSize:"0.75rem"}}>
      {ok === undefined ? <CircleDashed size={13} /> : ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      <span>{label}</span>
    </li>
  );

  return <div className="page">
    <SectionTitle eyebrow="RAGSEC CO-PILOT / THREAT INTELLIGENCE CHAT" title="Interactive Security Assistant" action={<div className="confidence-pill"><span className="pulse" /> EVIDENCE MODE · ON</div>} />
    {demoMode && (
      <div style={{padding:"0.6rem 1rem",background:"rgba(255,184,0,0.1)",border:"1px solid #f59e0b",borderRadius:6,marginBottom:"1rem",color:"#fbbf24",fontSize:"0.8rem",display:"flex",alignItems:"center",gap:8}}>
        <Flame size={16} />
        <b>DEMO MODE ACTIVE:</b> Multi-turn AI assistant simulation with continuous context memory and verified grounding.
      </div>
    )}
    <div className="query-grid">
      <section className="panel query-panel" style={{display:"flex", flexDirection:"column", height:"620px"}}>
        <div className="query-top"><div className="ai-orb"><Sparkles size={20} /></div><div><b>RAGSec Tier-3 Security Analyst</b><span>Continuous Multi-Turn Grounded Reasoning</span></div><Badge>{demoMode ? "DEMO ACTIVE" : "LOCAL OLLAMA"}</Badge></div>
        
        {/* Continuous Chat Message Stream */}
        <div className="chat-area" style={{flex:1, overflowY:"auto", padding:"1rem", display:"flex", flexDirection:"column", gap:"1rem"}}>
          {chatHistory.map((msg, idx) => {
            const isUser = msg.role === "user";
            const showEv = !!showEvidenceMap[idx];
            const evList = msg.evidence || [];

            return (
              <div key={msg.id || idx} style={{display:"flex", flexDirection:"column", alignItems: isUser ? "flex-end" : "flex-start"}}>
                <div style={{
                  maxWidth: "85%",
                  background: isUser ? "rgba(255,61,169,0.15)" : "#131620",
                  border: isUser ? "1px solid rgba(255,61,169,0.4)" : "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "0.9rem 1.1rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                }}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, borderBottom:"1px solid rgba(255,255,255,0.06)", paddingBottom:4}}>
                    <span style={{fontSize:"0.7rem", fontWeight:700, color: isUser ? "var(--pink)" : "var(--cyan)", letterSpacing:"0.5px"}}>
                      {isUser ? "YOU" : "RAGSEC AI"}
                    </span>
                    <div style={{display:"flex", gap:6, alignItems:"center"}}>
                      {!isUser && msg.status && (
                        <Badge variant={msg.status === "ABSTAINED" || msg.status === "ERROR" ? "destructive" : "default"} style={{fontSize:"0.65rem", padding:"1px 6px"}}>
                          {msg.status}
                        </Badge>
                      )}
                      {!isUser && msg.confidence !== undefined && (
                        <span style={{fontSize:"0.65rem", color:"var(--text-muted)"}}>
                          {(msg.confidence * 100).toFixed(0)}% CONF
                        </span>
                      )}
                      <span style={{fontSize:"0.65rem", color:"var(--text-muted)", fontFamily:"var(--mono)"}}>{msg.timestamp}</span>
                    </div>
                  </div>

                  <div className="answer-text" style={{fontSize:"0.85rem", lineHeight:1.5, color:"#e2e8f0"}}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Clean, Collapsible Evidence Accordion */}
                  {!isUser && evList.length > 0 && (
                    <div style={{marginTop:"0.75rem", borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:"0.5rem"}}>
                      <button 
                        onClick={() => toggleEvidence(idx)}
                        style={{
                          background:"transparent",
                          border:"1px solid var(--border)",
                          borderRadius:4,
                          color:"var(--cyan)",
                          fontSize:"0.7rem",
                          fontWeight:600,
                          padding:"3px 8px",
                          cursor:"pointer",
                          display:"inline-flex",
                          alignItems:"center",
                          gap:4
                        }}
                      >
                        <FileKey2 size={11} /> {showEv ? "Hide Evidence Sources" : `View Evidence Sources (${evList.length} Chunks)`}
                      </button>

                      {showEv && (
                        <div style={{marginTop:"0.6rem", display:"flex", flexDirection:"column", gap:"0.5rem"}}>
                          {evList.map((e: any, eIdx: number) => (
                            <div key={eIdx} style={{background:"rgba(0,0,0,0.4)", borderRadius:4, padding:"0.6rem", border:"1px solid var(--border)", fontSize:"0.75rem"}}>
                              <div style={{display:"flex", justifyContent:"space-between", marginBottom:2}}>
                                <b style={{color:"#fff"}}>[{e.citation_tag || "C"+(eIdx+1)}] {e.source_name || e.source || "CTI Corpus"}</b>
                                {e.rerank_score != null && <span style={{color:"var(--pink)", fontFamily:"var(--mono)"}}>SCORE: {Number(e.rerank_score).toFixed(2)}</span>}
                              </div>
                              <p style={{color:"#aaa", lineHeight:1.4, margin:0}}>{e.masked_text || e.text || e.chunk_text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {queryApi.isPending && (
            <div style={{display:"flex", alignItems:"center", gap:8, color:"var(--cyan)", fontSize:"0.8rem", padding:"0.5rem"}}>
              <RefreshCw size={14} className="spin" /> RAGSec is retrieving grounded intelligence & reranking evidence...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="query-compose">
          <textarea 
            value={inputVal} 
            onChange={e => setInputVal(e.target.value)} 
            onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}} 
            placeholder="Type your security question (e.g. 'What threat techniques were used on FIN-WS-042?')..." 
            rows={2}
          />
          <button className="pink-btn" onClick={send} disabled={queryApi.isPending}>
            <Sparkles size={14} /> {queryApi.isPending ? "Analyzing..." : "Send"}
          </button>
        </div>
      </section>

      <aside className="panel nav-panel" style={{height:"620px"}}>
        <div className="side-label">GOVERNANCE & TRUST MATRIX</div>
        <ul className="gov-list" style={{padding:0, listStyle:"none", marginTop:"1rem"}}>
          <GovCheck ok={latestGov ? latestGov.identity_verified : true} label="Analyst Identity Verified" />
          <GovCheck ok={latestGov ? latestGov.pii_masked : true} label="PII & Enclave Masking Active" />
          <GovCheck ok={latestGov ? latestGov.cross_encoder_active : true} label="Cross-Encoder Rerank Alignment" />
          <GovCheck ok={latestGov ? (latestGov.citation_check === "VERIFIED" || latestGov.citation_check === "PARTIAL") : true} label={`Citation & CRC Verification`} />
          <GovCheck ok={latestGov ? latestGov.gating === "PASSED" : true} label="Evidence Sufficiency Gating" />
        </ul>

        <div style={{marginTop:"1.5rem", padding:"0.8rem", background:"rgba(0,0,0,0.3)", borderRadius:6, border:"1px solid var(--border)"}}>
          <div style={{fontSize:"0.7rem", fontWeight:700, color:"var(--cyan)", marginBottom:4}}>ACTIVE REASONING ENGINE</div>
          <div style={{fontSize:"0.75rem", color:"#ccc"}}>Model: <b>llama3.2 / Grounded RAG</b></div>
          <div style={{fontSize:"0.75rem", color:"#ccc", marginTop:2}}>Cross-Encoder: <b>ms-marco-MiniLM-L-6-v2</b></div>
          <div style={{fontSize:"0.75rem", color:"#ccc", marginTop:2}}>Embeddings: <b>BAAI/bge-small-en-v1.5</b></div>
        </div>
      </aside>
    </div>
  </div>;
}

function Knowledge({ demoMode, flash }: { demoMode?: boolean; flash: (t: string) => void }) {
  const sources = trpc.soc.listSources.useQuery();
  const upload = trpc.soc.uploadKnowledgeSource.useMutation({ onSuccess: () => { flash("Document ingested"); sources.refetch(); }});
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = () => { const b64 = (reader.result as string).split(",")[1]; upload.mutate({ name: f.name, mimeType: f.type || "text/plain", base64: b64 }); }; reader.readAsDataURL(f); };

  const demoSources = [
    { id: "SRC-CISA-01", name: "CISA Cybersecurity Advisory AA23-347A.pdf", chunkCount: 24, ingestionStatus: "INGESTED", extractedEntities: ["cve:CVE-2023-38831", "ttp:T1566.001", "malware:DarkGate"] },
    { id: "SRC-MITRE-02", name: "MITRE ATT&CK Enterprise Matrix v14.1.json", chunkCount: 142, ingestionStatus: "INGESTED", extractedEntities: ["ttp:T1059.001", "ttp:T1003", "ttp:T1021"] },
    { id: "SRC-CTI-03", name: "CrowdStrike 2026 Global Threat Report.pdf", chunkCount: 56, ingestionStatus: "INGESTED", extractedEntities: ["actor:FANCY_BEAR", "actor:SCATTERED_SPIDER", "ip:185.220.101.4"] },
    { id: "SRC-UNIT42-04", name: "Unit 42 Ransomware Threat Dossier.txt", chunkCount: 18, ingestionStatus: "INGESTED", extractedEntities: ["ransom:LockBit3", "ext:.locked", "ext:.crypted"] },
    { id: "SRC-IOCS-05", name: "Enterprise SOC Threat IOC Feed.csv", chunkCount: 8, ingestionStatus: "INGESTED", extractedEntities: ["ip:198.51.100.42", "domain:badguy-command.xyz", "hash:e3b0c442"] }
  ];

  const list = demoMode ? demoSources : (sources.data || []);

  return <div className="page">
    <SectionTitle eyebrow="KNOWLEDGE BASE / CTI CORPUS" title="Ingested Threat Intelligence Sources" action={<label className="pink-btn" style={{cursor:"pointer"}}><CloudUpload size={14} /> Upload Threat Doc<input type="file" hidden onChange={handleUpload} /></label>} />
    {demoMode && (
      <div style={{padding:"0.6rem 1rem",background:"rgba(255,184,0,0.1)",border:"1px solid #f59e0b",borderRadius:6,marginBottom:"1rem",color:"#fbbf24",fontSize:"0.8rem",display:"flex",alignItems:"center",gap:8}}>
        <Flame size={16} />
        <b>DEMO KNOWLEDGE CORPUS ACTIVE:</b> Showing 5 ingested enterprise threat intelligence feeds and vector embeddings.
      </div>
    )}
    <div className="incident-list">
      {list.map((s: any) => (
        <div className="incident-row" key={s.id}>
          <div className="incident-marker medium"><Database size={15} /></div>
          <div className="incident-main">
            <div><b>{s.name}</b><span style={{fontFamily:"var(--mono)",fontSize:"0.75rem",marginLeft:8,color:"var(--text-muted)"}}>{s.id}</span></div>
            <div className="incident-meta">
              <span>{s.chunkCount} chunks</span>
              <span className="techniques">{(s.extractedEntities || []).slice(0,5).map((e: string) => <code key={e}>{e}</code>)}</span>
            </div>
          </div>
          <Badge variant="outline" style={{borderColor:"var(--lime)",color:"var(--lime)"}}>{s.ingestionStatus}</Badge>
        </div>
      ))}
    </div>
  </div>;
}

function Audit({ demoMode }: { demoMode?: boolean }) {
  const audit = trpc.soc.immutableAudit.useQuery();
  const demoAudit = [
    { id: "AUD-001", action: "QUARANTINE_FILE", target: "C:\\Projects\\RAGTEC\\monitored_workspace\\invoice.exe", result: "Moved to .quarantine enclave", chainHash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069", createdAt: new Date().toISOString() },
    { id: "AUD-002", action: "ISOLATE_ENDPOINT", target: "FIN-WS-042", result: "Network adapter disabled via EDR", chainHash: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", createdAt: new Date(Date.now() - 360000).toISOString() },
    { id: "AUD-003", action: "INGEST_SOURCE", target: "CISA_Advisory_AA23.pdf", result: "Chunked (24) & Vectorized", chainHash: "sha256:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", createdAt: new Date(Date.now() - 1200000).toISOString() },
    { id: "AUD-004", action: "EXECUTE_MITIGATION", target: "EDGE-GW-01", result: "IP Block rule deployed: 185.220.101.4", chainHash: "sha256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a", createdAt: new Date(Date.now() - 2500000).toISOString() }
  ];

  const list = demoMode ? demoAudit : (audit.data || []);

  return <div className="page">
    <SectionTitle eyebrow="GOVERNANCE & COMPLIANCE" title="Immutable Audit Trail (Cryptographic Chained Log)" />
    {demoMode && (
      <div style={{padding:"0.6rem 1rem",background:"rgba(255,184,0,0.1)",border:"1px solid #f59e0b",borderRadius:6,marginBottom:"1rem",color:"#fbbf24",fontSize:"0.8rem",display:"flex",alignItems:"center",gap:8}}>
        <Flame size={16} />
        <b>DEMO AUDIT TRAIL ACTIVE:</b> Demonstrating SHA-256 verifiable chain of SOC Analyst and autonomous responses.
      </div>
    )}
    <div className="incident-list">
      {list.map((a: any) => (
        <div className="incident-row" key={a.id}>
          <div className="incident-marker low"><ClipboardCheck size={15} /></div>
          <div className="incident-main">
            <div><b>{a.action}</b><span style={{marginLeft:8,fontFamily:"var(--mono)",fontSize:"0.75rem",color:"var(--cyan)"}}>{a.target}</span></div>
            <div className="incident-meta">
              <span>{a.result}</span>
              <code style={{fontSize:"0.65rem",color:"var(--text-muted)"}}>{a.chainHash || a.id}</code>
            </div>
          </div>
          <span className="state-text">{new Date(a.createdAt || a.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  </div>;
}

function IncidentsPage({ demoMode }: { demoMode?: boolean }) {
  const q = trpc.soc.getIncidents.useQuery();
  const demoIncidents = [
    { id: "INC-2026-001", title: "Ransomware Binary Deployment & Extortion Artifacts", threat_classification: { severity: "Critical" }, status: "CONTAINED", time: "10:14 AM", affected_devices: ["FIN-WS-042"] },
    { id: "INC-2026-002", title: "Web Shell PHP Backdoor Execution in DMZ Web Server", threat_classification: { severity: "High" }, status: "INVESTIGATING", time: "09:48 AM", affected_devices: ["DMZ-WEB-03"] },
    { id: "INC-2026-003", title: "Credential Dumping via LSASS Memory Injection (Mimikatz)", threat_classification: { severity: "Critical" }, status: "MITIGATED", time: "08:32 AM", affected_devices: ["CORP-DC-01"] },
    { id: "INC-2026-004", title: "Anomalous High-Volume Outbound Data Exfiltration via DNS", threat_classification: { severity: "High" }, status: "DETECTED", time: "07:15 AM", affected_devices: ["DEV-OPS-SRV"] }
  ];

  const list = demoMode ? demoIncidents : (q.data || []);

  return <div className="page">
    <SectionTitle eyebrow="SOC INCIDENT QUEUE" title="Active Security Incidents" />
    {demoMode && (
      <div style={{padding:"0.6rem 1rem",background:"rgba(255,184,0,0.1)",border:"1px solid #f59e0b",borderRadius:6,marginBottom:"1rem",color:"#fbbf24",fontSize:"0.8rem",display:"flex",alignItems:"center",gap:8}}>
        <Flame size={16} />
        <b>DEMO INCIDENTS ACTIVE:</b> Showing realistic multi-host enterprise incident queue.
      </div>
    )}
    <div className="panel">
      {q.isLoading && !demoMode && <div style={{padding:"2rem"}}>Loading incidents...</div>}
      {!q.isLoading && list.length === 0 && <div style={{padding:"2rem"}} className="muted">No incidents active.</div>}
      {list.length > 0 && (
        <table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:"1px solid var(--border)",fontSize:"0.75rem",color:"var(--text-muted)"}}><th style={{padding:"0.6rem 0.5rem"}}>ID</th><th>Incident Title</th><th>Severity</th><th>Status</th></tr></thead>
          <tbody>
            {list.map((i: any) => (
              <tr key={i.id} style={{borderBottom:"1px solid var(--border)",fontSize:"0.8rem"}}>
                <td style={{padding:"1rem 0.5rem",fontFamily:"var(--mono)",fontSize:"0.8rem"}}>{i.id}</td>
                <td style={{fontWeight:600}}>{i.title}</td>
                <td><Severity value={i.threat_classification?.severity || i.severity || "Medium"} /></td>
                <td><Status value={i.status || i.state || "Open"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>;
}

function AlertsPage({ demoMode }: { demoMode?: boolean }) {
  const q = trpc.soc.getEvents.useQuery();
  const demoAlerts = [
    { id: "ALT-001", source_type: "EDR", title: "Obfuscated PowerShell Execution (IEX / EncodedCommand)", severity: "High", timestamp: new Date().toISOString() },
    { id: "ALT-002", source_type: "FIM", title: "Unauthorized File Creation: C:\\Users\\Public\\invoice.exe", severity: "Critical", timestamp: new Date(Date.now() - 120000).toISOString() },
    { id: "ALT-003", source_type: "NETWORK", title: "C2 Beaconing Detected to IP 185.220.101.4 (Port 443)", severity: "Critical", timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: "ALT-004", source_type: "FIREWALL", title: "Outbound SSH Brute-Force Attempt from DMZ-WEB-03", severity: "High", timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: "ALT-005", source_type: "IAM", title: "Off-Hours Bulk Privilege Escalation on CORP-DC-01", severity: "Medium", timestamp: new Date(Date.now() - 1200000).toISOString() }
  ];

  const list = demoMode ? demoAlerts : (q.data || []);

  return <div className="page">
    <SectionTitle eyebrow="SOC TELEMETRY STREAM" title="Security Alerts & Event Feed" />
    {demoMode && (
      <div style={{padding:"0.6rem 1rem",background:"rgba(255,184,0,0.1)",border:"1px solid #f59e0b",borderRadius:6,marginBottom:"1rem",color:"#fbbf24",fontSize:"0.8rem",display:"flex",alignItems:"center",gap:8}}>
        <Flame size={16} />
        <b>DEMO ALERTS ACTIVE:</b> Showing aggregated telemetry across EDR, FIM, Network, and IAM sensors.
      </div>
    )}
    <div className="panel">
      {q.isLoading && !demoMode && <div style={{padding:"2rem"}}>Loading alerts...</div>}
      {!q.isLoading && list.length === 0 && <div style={{padding:"2rem"}} className="muted">No security events found.</div>}
      {list.length > 0 && (
        <table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:"1px solid var(--border)",fontSize:"0.75rem",color:"var(--text-muted)"}}><th style={{padding:"0.6rem 0.5rem"}}>Time</th><th>Sensor Source</th><th>Alert Description</th><th>Severity</th></tr></thead>
          <tbody>
            {list.map((e: any) => (
              <tr key={e.id} style={{borderBottom:"1px solid var(--border)",fontSize:"0.8rem"}}>
                <td style={{padding:"1rem 0.5rem",fontFamily:"var(--mono)",fontSize:"0.75rem",color:"var(--text-muted)"}}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                <td><Badge variant="outline">{e.source_type}</Badge></td>
                <td style={{fontWeight:600}}>{e.title || e.raw_message || "Security Event"}</td>
                <td><Severity value={e.severity || e.threat_analysis?.severity || "Medium"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>;
}

function FimMonitorPage({ demoMode, flash }: { demoMode?: boolean; flash?: (t: string) => void }) {
  const [fimTab, setFimTab] = useState<"telemetry" | "quarantine" | "whitelist">("telemetry");
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [ignoreModal, setIgnoreModal] = useState<{ filePath: string; eventId?: string; fileName: string } | null>(null);
  const [ignoreDuration, setIgnoreDuration] = useState<"temporary" | "permanent">("temporary");
  const [ignoreReason, setIgnoreReason] = useState<string>("");

  const fimEvents = trpc.soc.getFimEvents.useQuery(undefined, { refetchInterval: 5000 });
  const fimAlerts = trpc.soc.getFimAlerts.useQuery(undefined, { refetchInterval: 5000 });
  const quarantined = trpc.soc.listQuarantined.useQuery(undefined, { refetchInterval: 5000 });
  const whitelistQuery = trpc.soc.listWhitelist.useQuery(undefined, { refetchInterval: 5000 });

  const scanMut = trpc.soc.scanWorkspace.useMutation({
    onSuccess: (data: any) => {
      flash?.(`Workspace scan complete: ${data.files_scanned || 0} files scanned, ${data.threats_flagged || 0} threats detected`);
      fimEvents.refetch();
      fimAlerts.refetch();
    }
  });

  const quarMut = trpc.soc.quarantineFile.useMutation({
    onSuccess: (data: any) => {
      flash?.(data.status === "SUCCESS" ? "File successfully isolated to .quarantine security enclave" : "Quarantine processed");
      fimEvents.refetch();
      fimAlerts.refetch();
      quarantined.refetch();
    }
  });

  const restoreMut = trpc.soc.restoreFile.useMutation({
    onSuccess: (data: any) => {
      flash?.(data.status === "SUCCESS" ? "File successfully unquarantined and restored to workspace" : "Restore failed");
      fimEvents.refetch();
      fimAlerts.refetch();
      quarantined.refetch();
    }
  });

  const ignoreMut = trpc.soc.ignoreFile.useMutation({
    onSuccess: (data: any) => {
      flash?.(`Alert suppressed (${ignoreDuration === "permanent" ? "Permanently whitelisted" : "Ignored for 1 hour"})`);
      fimAlerts.refetch();
      whitelistQuery.refetch();
      setIgnoreModal(null);
      setIgnoreReason("");
    }
  });

  const handleQuarantine = (filePath?: string, eventId?: string) => {
    const fileName = filePath ? filePath.split(/[/\\]/).pop() || "" : "";
    const cleanPath = filePath ? filePath.replace(/\\/g, "/").toLowerCase() : "";
    
    setDismissedAlerts(prev => [
      ...prev,
      ...(eventId ? [eventId] : []),
      ...(filePath ? [filePath, cleanPath] : []),
      ...(fileName ? [fileName, fileName.toLowerCase()] : [])
    ]);

    flash?.("File quarantined and alert removed from console");
    quarMut.mutate({ filePath, eventId });
  };

  const handleConfirmIgnore = () => {
    if (!ignoreModal) return;
    const { filePath, eventId, fileName } = ignoreModal;
    const cleanPath = filePath ? filePath.replace(/\\/g, "/").toLowerCase() : "";

    setDismissedAlerts(prev => [
      ...prev,
      ...(eventId ? [eventId] : []),
      ...(filePath ? [filePath, cleanPath] : []),
      ...(fileName ? [fileName, fileName.toLowerCase()] : [])
    ]);

    ignoreMut.mutate({
      filePath,
      eventId,
      duration: ignoreDuration,
      reason: ignoreReason || (ignoreDuration === "permanent" ? "Permanent whitelist" : "Temporary 1h suppression")
    });
  };

  const rawEvents = demoMode ? [
    { id: "demo-1", timestamp: new Date().toISOString(), device_id: "FIN-WS-042", canonical: { action: "CREATE", file_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\invoice.exe", risk_score: 98 }, threat_analysis: { classification: "Malware", severity: "High", rationale: "Executable binary dropped in workspace", mitigation_steps: [{ step: 1, title: "Quarantine File", action: "QUARANTINE_FILE", description: "Move invoice.exe to .quarantine enclave" }, { step: 2, title: "Process Triage", action: "PROCESS_TRIAGE", description: "Investigate parent process tree" }] } },
    { id: "demo-2", timestamp: new Date(Date.now() - 180000).toISOString(), device_id: "DMZ-WEB-03", canonical: { action: "MODIFY", file_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\cache.php", risk_score: 86 }, threat_analysis: { classification: "Malware", severity: "High", rationale: "Web shell backdoor execution function detected", mitigation_steps: [{ step: 1, title: "Quarantine File", action: "QUARANTINE_FILE", description: "Isolate cache.php" }] } },
    { id: "demo-3", timestamp: new Date(Date.now() - 300000).toISOString(), device_id: "FIN-WS-042", canonical: { action: "CREATE", file_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\ransom_note.txt", risk_score: 99 }, threat_analysis: { classification: "Ransomware", severity: "Critical", rationale: "Ransomware extortion note detected", mitigation_steps: [{ step: 1, title: "Quarantine File", action: "QUARANTINE_FILE", description: "Move note to quarantine" }, { step: 2, title: "Isolate Subnet", action: "ISOLATE_ENDPOINT", description: "Block lateral movement" }] } },
    { id: "demo-4", timestamp: new Date(Date.now() - 420000).toISOString(), device_id: "FIN-WS-042", canonical: { action: "MODIFY", file_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\Q3_report.xlsx", risk_score: 10 }, threat_analysis: { classification: "Benign", severity: "Low", rationale: "Routine file modification" } },
    { id: "demo-5", timestamp: new Date(Date.now() - 600000).toISOString(), device_id: "FIN-WS-042", canonical: { action: "RENAME", file_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\db.locked", risk_score: 95 }, threat_analysis: { classification: "Ransomware", severity: "Critical", rationale: "Encrypted file artifact (.locked extension)" } },
    { id: "demo-6", timestamp: new Date(Date.now() - 900000).toISOString(), device_id: "CORP-DC-01", canonical: { action: "DELETE", file_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\Security.evtx", risk_score: 90 }, threat_analysis: { classification: "Insider Threat", severity: "High", rationale: "Security event log clearing detected" } }
  ] : (fimEvents.data || []);

  const baseAlerts = demoMode ? rawEvents.filter((e: any) => (e.canonical?.risk_score || 0) > 50) : (fimAlerts.data || []);
  const activeAlerts = baseAlerts.filter((a: any) => {
    const fp = a.canonical?.file_path || a.title || "";
    const fn = fp ? fp.split(/[/\\]/).pop() || "" : "";
    const cleanFp = fp ? fp.replace(/\\/g, "/").toLowerCase() : "";

    const isDismissed =
      a.status === "QUARANTINED" ||
      a.canonical?.quarantine_path ||
      a.canonical?.is_quarantined ||
      dismissedAlerts.includes(a.id) ||
      dismissedAlerts.includes(fp) ||
      dismissedAlerts.includes(cleanFp) ||
      dismissedAlerts.includes(fn) ||
      dismissedAlerts.includes(fn.toLowerCase());

    return !isDismissed;
  });

  const demoQuarantined = [
    { filename: "payload_dropper.exe", quarantined_filename: "payload_dropper.exe.20260901_120000.quarantined", quarantine_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\.quarantine\\payload_dropper.exe.20260901_120000.quarantined", original_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\payload_dropper.exe", size_bytes: 48210, quarantined_at: new Date(Date.now() - 7200000).toISOString() },
    { filename: "crypted_vault.locked", quarantined_filename: "crypted_vault.locked.20260901_114500.quarantined", quarantine_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\.quarantine\\crypted_vault.locked.20260901_114500.quarantined", original_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\crypted_vault.locked", size_bytes: 124800, quarantined_at: new Date(Date.now() - 14400000).toISOString() }
  ];

  const quarantinedList = demoMode ? demoQuarantined : (quarantined.data || []);
  const whitelistList = demoMode ? [
    { id: "IGN-001", file_name: "deploy_patch.ps1", file_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\deploy_patch.ps1", duration: "permanent", expires_at: null, reason: "Approved CI/CD deployment script" },
    { id: "IGN-002", file_name: "backup_task.bat", file_path: "C:\\Projects\\RAGTEC\\monitored_workspace\\backup_task.bat", duration: "temporary", expires_at: new Date(Date.now() + 3600000).toISOString(), reason: "Routine daily backup run" }
  ] : (whitelistQuery.data || []);

  return <div className="page" style={{position:"relative"}}>
    {/* Interactive Ignore Modal Dialog */}
    {ignoreModal && (
      <div style={{
        position:"fixed", top:0, left:0, right:0, bottom:0, 
        background:"rgba(0,0,0,0.75)", zIndex:1000, 
        display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)"
      }}>
        <div style={{
          background:"#151722", border:"1px solid var(--pink)", borderRadius:10, 
          padding:"1.5rem", maxWidth:480, width:"90%", boxShadow:"0 12px 30px rgba(0,0,0,0.7)"
        }}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <EyeOff size={18} color="var(--pink)" />
              <b style={{fontSize:"1rem", color:"#fff"}}>Ignore Alert: {ignoreModal.fileName}</b>
            </div>
            <button 
              onClick={() => setIgnoreModal(null)}
              style={{background:"transparent", border:"none", color:"#aaa", fontSize:"1.2rem", cursor:"pointer"}}
            >
              ✕
            </button>
          </div>

          <p style={{fontSize:"0.8rem", color:"#ccc", marginBottom:"1.2rem", lineHeight:1.4}}>
            Select how you would like to suppress threat detections for <code>{ignoreModal.filePath}</code>.
          </p>

          <div style={{display:"flex", flexDirection:"column", gap:"0.75rem", marginBottom:"1.2rem"}}>
            <div 
              onClick={() => setIgnoreDuration("temporary")}
              style={{
                border:`1px solid ${ignoreDuration === "temporary" ? "var(--pink)" : "var(--border)"}`,
                background: ignoreDuration === "temporary" ? "rgba(255,61,169,0.1)" : "rgba(0,0,0,0.3)",
                padding:"0.8rem", borderRadius:6, cursor:"pointer"
              }}
            >
              <div style={{display:"flex", alignItems:"center", gap:8, fontWeight:700, fontSize:"0.85rem", color: ignoreDuration === "temporary" ? "var(--pink)" : "#fff"}}>
                <Clock size={15} /> Ignore for a while (1 Hour Session)
              </div>
              <div style={{fontSize:"0.75rem", color:"#aaa", marginTop:3, marginLeft:23}}>
                Temporarily dismisses this alert. Telemetry tracking will resume after 60 minutes.
              </div>
            </div>

            <div 
              onClick={() => setIgnoreDuration("permanent")}
              style={{
                border:`1px solid ${ignoreDuration === "permanent" ? "var(--cyan)" : "var(--border)"}`,
                background: ignoreDuration === "permanent" ? "rgba(0,240,255,0.1)" : "rgba(0,0,0,0.3)",
                padding:"0.8rem", borderRadius:6, cursor:"pointer"
              }}
            >
              <div style={{display:"flex", alignItems:"center", gap:8, fontWeight:700, fontSize:"0.85rem", color: ignoreDuration === "permanent" ? "var(--cyan)" : "#fff"}}>
                <ShieldCheck size={15} /> Ignore Permanently (Add to Whitelist)
              </div>
              <div style={{fontSize:"0.75rem", color:"#aaa", marginTop:3, marginLeft:23}}>
                Adds this file to the persistent SOC whitelist. It will never generate alerts again.
              </div>
            </div>
          </div>

          <div style={{marginBottom:"1.2rem"}}>
            <label style={{fontSize:"0.75rem", color:"#aaa", display:"block", marginBottom:4}}>Justification / Reason (Optional):</label>
            <input 
              type="text" 
              value={ignoreReason} 
              onChange={e => setIgnoreReason(e.target.value)}
              placeholder="e.g. Approved administrative maintenance script"
              style={{
                width:"100%", background:"#0b0d14", border:"1px solid var(--border)", 
                borderRadius:4, padding:"6px 10px", color:"#fff", fontSize:"0.8rem"
              }}
            />
          </div>

          <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
            <Button variant="outline" size="sm" onClick={() => setIgnoreModal(null)}>Cancel</Button>
            <Button 
              size="sm" 
              onClick={handleConfirmIgnore}
              disabled={ignoreMut.isPending}
              style={{background:"var(--pink)", color:"#fff", fontWeight:700}}
            >
              {ignoreMut.isPending ? "Applying..." : "Confirm Ignore"}
            </Button>
          </div>
        </div>
      </div>
    )}

    <SectionTitle 
      eyebrow="FILE INTEGRITY MONITORING & ENCLAVE DEFENSE" 
      title="FIM Telemetry, Quarantine & Whitelist" 
      action={
        <div style={{display:"flex", gap:"8px", alignItems:"center"}}>
          <Button 
            className="pink-btn" 
            onClick={() => scanMut.mutate()} 
            disabled={scanMut.isPending}
            style={{display:"inline-flex", alignItems:"center", gap:"6px"}}
          >
            <RefreshCw size={14} className={scanMut.isPending ? "spin" : ""} /> {scanMut.isPending ? "Scanning..." : "Scan Workspace"}
          </Button>
        </div>
      } 
    />

    {demoMode && (
      <div style={{padding:"0.75rem 1rem", background:"rgba(255,184,0,0.1)", border:"1px solid #f59e0b", borderRadius:6, marginBottom:"1rem", color:"#fbbf24", fontSize:"0.8rem", display:"flex", alignItems:"center", gap:8}}>
        <Flame size={16} />
        <b>DEMO TELEMETRY ACTIVE:</b> Showing synthetic FIM attack & containment demonstration.
      </div>
    )}

    {/* Navigation Sub-Tabs */}
    <div style={{display:"flex", gap:"8px", marginBottom:"1.2rem", borderBottom:"1px solid var(--border)", paddingBottom:"0.6rem"}}>
      <button 
        onClick={() => setFimTab("telemetry")}
        style={{
          background: fimTab === "telemetry" ? "var(--pink)" : "transparent",
          color: fimTab === "telemetry" ? "#fff" : "var(--text-muted)",
          border: "1px solid " + (fimTab === "telemetry" ? "var(--pink)" : "var(--border)"),
          borderRadius: 6, padding: "5px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
          display:"inline-flex", alignItems:"center", gap:6
        }}
      >
        <ShieldAlert size={14} /> Active Threat Alerts & Telemetry
      </button>

      <button 
        onClick={() => setFimTab("quarantine")}
        style={{
          background: fimTab === "quarantine" ? "var(--amber)" : "transparent",
          color: fimTab === "quarantine" ? "#000" : "var(--text-muted)",
          border: "1px solid " + (fimTab === "quarantine" ? "var(--amber)" : "var(--border)"),
          borderRadius: 6, padding: "5px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
          display:"inline-flex", alignItems:"center", gap:6
        }}
      >
        <LockKeyhole size={14} /> Quarantined Archive ({quarantinedList.length})
      </button>

      <button 
        onClick={() => setFimTab("whitelist")}
        style={{
          background: fimTab === "whitelist" ? "var(--cyan)" : "transparent",
          color: fimTab === "whitelist" ? "#000" : "var(--text-muted)",
          border: "1px solid " + (fimTab === "whitelist" ? "var(--cyan)" : "var(--border)"),
          borderRadius: 6, padding: "5px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
          display:"inline-flex", alignItems:"center", gap:6
        }}
      >
        <EyeOff size={14} /> Whitelist & Ignored Rules ({whitelistList.length})
      </button>
    </div>

    {/* TAB 1: ACTIVE THREAT ALERTS & TELEMETRY */}
    {fimTab === "telemetry" && (
      <>
        {activeAlerts.length > 0 ? (
          <div style={{marginBottom:"2rem"}}>
            <h3 style={{fontSize:"0.9rem", letterSpacing:"1px", color:"var(--pink)", marginBottom:"0.75rem", display:"flex", alignItems:"center", gap:"6px"}}>
              <ShieldAlert size={16} /> THREAT IDENTIFIED — ACTIONABLE SECURITY ALERTS ({activeAlerts.length})
            </h3>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(380px, 1fr))", gap:"1rem"}}>
              {activeAlerts.map((a: any) => {
                const analysis = a.threat_analysis || {};
                const filePath = a.canonical?.file_path || "unknown";
                const fileName = filePath.split(/[/\\]/).pop() || filePath;
                const steps = analysis.mitigation_steps || [
                  { step: 1, title: "Quarantine File", action: "QUARANTINE_FILE", description: `Move ${fileName} to isolated .quarantine enclave` },
                  { step: 2, title: "Investigate Parent Process", action: "PROCESS_TRIAGE", description: "Inspect origin and command arguments" }
                ];

                return (
                  <div key={a.id} style={{background:"#151722", border:"1px solid rgba(255,61,169,0.3)", borderRadius:8, padding:"1.2rem", boxShadow:"0 8px 20px rgba(0,0,0,0.4)", position:"relative"}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem"}}>
                      <div>
                        <div style={{display:"flex", gap:"6px", alignItems:"center", marginBottom:"4px"}}>
                          <Badge variant="destructive">{analysis.classification || "Malware"}</Badge>
                          <Severity value={analysis.severity || "High"} />
                          <span style={{fontSize:"0.7rem", color:"var(--text-muted)", fontFamily:"var(--mono)"}}>{a.device_id || "local"}</span>
                        </div>
                        <b style={{fontSize:"0.95rem", color:"#fff"}}>{fileName}</b>
                      </div>
                      <div style={{display:"flex", alignItems:"center", gap:6}}>
                        <span style={{fontSize:"0.75rem", fontWeight:700, color:"var(--pink)", background:"rgba(255,61,169,0.15)", padding:"2px 8px", borderRadius:4}}>
                          RISK {a.canonical?.risk_score || 95}
                        </span>
                      </div>
                    </div>

                    <p style={{fontSize:"0.8rem", color:"#bbb", marginBottom:"0.75rem", lineHeight:1.4}}>
                      {analysis.rationale || a.raw_message}
                    </p>

                    <div style={{background:"rgba(0,0,0,0.3)", borderRadius:6, padding:"0.6rem 0.8rem", marginBottom:"0.9rem", border:"1px solid var(--border)"}}>
                      <div style={{fontSize:"0.7rem", fontWeight:700, color:"var(--cyan)", letterSpacing:"0.5px", marginBottom:"4px"}}>
                        REQUIRED MITIGATION PLAYBOOK:
                      </div>
                      {steps.map((s: any, idx: number) => (
                        <div key={idx} style={{fontSize:"0.75rem", color:"#ddd", marginTop:"3px", display:"flex", alignItems:"flex-start", gap:"6px"}}>
                          <span style={{color:"var(--cyan)", fontWeight:700}}>{s.step || idx+1}.</span>
                          <div><b>{s.title}:</b> {s.description}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
                      <span style={{fontSize:"0.7rem", color:"var(--text-muted)", fontFamily:"var(--mono)"}}>
                        {new Date(a.timestamp).toLocaleTimeString()} · {a.canonical?.action}
                      </span>
                      
                      <div style={{display:"flex", gap:"6px"}}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setIgnoreModal({ filePath: a.canonical?.file_path, eventId: a.id, fileName })}
                          style={{fontSize:"0.75rem", height:28, borderColor:"#a855f7", color:"#c084fc", display:"inline-flex", alignItems:"center", gap:4}}
                        >
                          <EyeOff size={12} /> Ignore
                        </Button>

                        <Button 
                          size="sm" 
                          onClick={() => handleQuarantine(a.canonical?.file_path, a.id)}
                          disabled={quarMut.isPending}
                          style={{background:"#e11d48", color:"#fff", fontSize:"0.75rem", fontWeight:700, height:28, display:"inline-flex", alignItems:"center", gap:4}}
                        >
                          <LockKeyhole size={12} /> Quarantine
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{padding:"1rem 1.2rem", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:8, color:"var(--lime)", fontSize:"0.85rem", display:"flex", alignItems:"center", gap:10, marginBottom:"1.5rem"}}>
            <CheckCircle2 size={18} />
            <div>
              <b>ACTIVE THREAT QUEUE SECURE:</b> All flagged suspicious files have been quarantined or whitelisted. Workspace is clean.
            </div>
          </div>
        )}

        {/* Real-Time CRUD Telemetry Stream */}
        <div className="panel">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
            <div>
              <h3 style={{fontSize:"0.85rem", letterSpacing:"1px", color:"var(--cyan)"}}>REAL-TIME CRUD AUDIT FEED</h3>
              <p className="muted" style={{fontSize:"0.75rem", marginTop:2}}>
                Live watcher active on <code>C:\Projects\RAGTEC\monitored_workspace</code> (Polling every 5s)
              </p>
            </div>
            {quarantinedList.length > 0 && (
              <Badge variant="outline" style={{borderColor:"var(--amber)", color:"#fbbf24"}}>
                {quarantinedList.length} Files in Quarantine
              </Badge>
            )}
          </div>

          {fimEvents.isLoading && !demoMode && <div style={{padding:"2rem"}}>Loading FIM data...</div>}
          {!fimEvents.isLoading && rawEvents.length === 0 && (
            <div style={{padding:"2rem"}} className="muted">
              No FIM events logged yet. Create, edit, rename, or delete any file in <code>C:\Projects\RAGTEC\monitored_workspace</code> to see real-time detection.
            </div>
          )}
          
          {rawEvents.length > 0 && (
            <table style={{width:"100%", textAlign:"left", borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--border)", fontSize:"0.75rem", color:"var(--text-muted)"}}>
                  <th style={{padding:"0.6rem 0.5rem"}}>Time</th>
                  <th>Host</th>
                  <th>CRUD Action</th>
                  <th>File Path</th>
                  <th>Threat Classification</th>
                  <th>Mitigation Action</th>
                </tr>
              </thead>
              <tbody>
                {rawEvents.map((e: any) => {
                  const isThreat = (e.canonical?.risk_score || 0) > 50;
                  const isQuarantined = e.status === "QUARANTINED" || e.canonical?.quarantine_path || dismissedAlerts.includes(e.id);
                  const isIgnored = e.status === "IGNORED";
                  const path = e.canonical?.file_path || e.title || "unknown";
                  const fileName = path.split(/[/\\]/).pop() || path;
                  const action = (e.canonical?.action || e.event_type || "UNKNOWN").toUpperCase();

                  return (
                    <tr key={e.id} style={{borderBottom:"1px solid var(--border)", fontSize:"0.8rem"}}>
                      <td style={{padding:"0.8rem 0.5rem", fontFamily:"var(--mono)", fontSize:"0.75rem", color:"var(--text-muted)"}}>
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </td>
                      <td>{e.device_id || "local"}</td>
                      <td>
                        <span className={`fim-action ${action.toLowerCase()}`}>{action}</span>
                      </td>
                      <td style={{fontFamily:"var(--mono)", fontSize:"0.75rem", maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}} title={path}>
                        {path}
                      </td>
                      <td>
                        {isThreat ? (
                          <span className="risk-score" style={{display:"inline-flex", alignItems:"center", gap:4}}>
                            <AlertTriangle size={12} /> {e.threat_analysis?.classification || "Threat"} (Risk {e.canonical?.risk_score})
                          </span>
                        ) : (
                          <span className="fim-badge benign">Benign</span>
                        )}
                      </td>
                      <td>
                        {isQuarantined ? (
                          <span style={{color:"var(--lime)", fontSize:"0.75rem", fontWeight:700, display:"flex", alignItems:"center", gap:4}}>
                            <CheckCircle2 size={13} /> Quarantined
                          </span>
                        ) : isIgnored ? (
                          <span style={{color:"#a855f7", fontSize:"0.75rem", fontWeight:700, display:"flex", alignItems:"center", gap:4}}>
                            <EyeOff size={13} /> Ignored
                          </span>
                        ) : isThreat ? (
                          <div style={{display:"flex", gap:4}}>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setIgnoreModal({ filePath: e.canonical?.file_path, eventId: e.id, fileName })}
                              style={{height:24, fontSize:"0.65rem", borderColor:"#a855f7", color:"#c084fc"}}
                            >
                              Ignore
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleQuarantine(e.canonical?.file_path, e.id)}
                              disabled={quarMut.isPending}
                              style={{height:24, fontSize:"0.65rem", borderColor:"var(--pink)", color:"var(--pink)"}}
                            >
                              Quarantine
                            </Button>
                          </div>
                        ) : (
                          <span className="muted" style={{fontSize:"0.75rem"}}>Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </>
    )}

    {/* TAB 2: QUARANTINED ARCHIVE & UNQUARANTINE / RESTORE */}
    {fimTab === "quarantine" && (
      <div className="panel">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
          <div>
            <h3 style={{fontSize:"0.85rem", letterSpacing:"1px", color:"var(--amber)"}}>QUARANTINED FILES ENCLAVE</h3>
            <p className="muted" style={{fontSize:"0.75rem", marginTop:2}}>
              Isolated payloads stored in <code>C:\Projects\RAGTEC\monitored_workspace\.quarantine</code> with execution permissions stripped.
            </p>
          </div>
          <Badge variant="outline" style={{borderColor:"var(--amber)", color:"#fbbf24"}}>
            {quarantinedList.length} In Enclave
          </Badge>
        </div>

        {quarantinedList.length === 0 ? (
          <div style={{padding:"2.5rem", textAlign:"center"}} className="muted">
            <CheckCircle2 size={24} style={{color:"var(--lime)", marginBottom:8}} />
            <div>No quarantined files in the secure enclave. All clean!</div>
          </div>
        ) : (
          <table style={{width:"100%", textAlign:"left", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--border)", fontSize:"0.75rem", color:"var(--text-muted)"}}>
                <th style={{padding:"0.6rem 0.5rem"}}>Quarantined File</th>
                <th>Enclave Timestamp</th>
                <th>File Size</th>
                <th>Original Location</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quarantinedList.map((qf: any, idx: number) => (
                <tr key={idx} style={{borderBottom:"1px solid var(--border)", fontSize:"0.8rem"}}>
                  <td style={{padding:"0.8rem 0.5rem"}}>
                    <b style={{color:"#fff"}}>{qf.filename}</b>
                    <div style={{fontSize:"0.7rem", color:"var(--text-muted)", fontFamily:"var(--mono)"}}>{qf.quarantined_filename || qf.filename}</div>
                  </td>
                  <td style={{fontFamily:"var(--mono)", fontSize:"0.75rem", color:"var(--text-muted)"}}>
                    {qf.quarantined_at ? new Date(qf.quarantined_at).toLocaleString() : "Recently"}
                  </td>
                  <td style={{fontFamily:"var(--mono)", fontSize:"0.75rem"}}>
                    {qf.size_bytes ? `${(qf.size_bytes / 1024).toFixed(1)} KB` : "1.2 KB"}
                  </td>
                  <td style={{fontFamily:"var(--mono)", fontSize:"0.75rem", maxWidth:250, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}} title={qf.original_path}>
                    {qf.original_path}
                  </td>
                  <td>
                    <Button 
                      size="sm"
                      onClick={() => restoreMut.mutate({ quarantinePath: qf.quarantine_path, originalPath: qf.original_path })}
                      disabled={restoreMut.isPending}
                      style={{
                        background:"rgba(34,197,94,0.15)", border:"1px solid var(--lime)", color:"var(--lime)",
                        fontSize:"0.75rem", fontWeight:700, height:28, display:"inline-flex", alignItems:"center", gap:4
                      }}
                    >
                      <RotateCcw size={12} /> {restoreMut.isPending ? "Restoring..." : "Unquarantine / Restore"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )}

    {/* TAB 3: WHITELIST & IGNORED RULES */}
    {fimTab === "whitelist" && (
      <div className="panel">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
          <div>
            <h3 style={{fontSize:"0.85rem", letterSpacing:"1px", color:"var(--cyan)"}}>ACTIVE SUPPRESSION & WHITELIST RULES</h3>
            <p className="muted" style={{fontSize:"0.75rem", marginTop:2}}>
              Files configured to ignore alerts temporarily or permanently.
            </p>
          </div>
          <Badge variant="outline" style={{borderColor:"var(--cyan)", color:"var(--cyan)"}}>
            {whitelistList.length} Active Rules
          </Badge>
        </div>

        {whitelistList.length === 0 ? (
          <div style={{padding:"2.5rem", textAlign:"center"}} className="muted">
            <EyeOff size={24} style={{color:"#a855f7", marginBottom:8}} />
            <div>No active whitelist or suppression rules. All risky files are alerted.</div>
          </div>
        ) : (
          <table style={{width:"100%", textAlign:"left", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--border)", fontSize:"0.75rem", color:"var(--text-muted)"}}>
                <th style={{padding:"0.6rem 0.5rem"}}>Rule ID</th>
                <th>Target File</th>
                <th>Suppression Type</th>
                <th>Expiration</th>
                <th>Justification</th>
              </tr>
            </thead>
            <tbody>
              {whitelistList.map((wl: any, idx: number) => (
                <tr key={idx} style={{borderBottom:"1px solid var(--border)", fontSize:"0.8rem"}}>
                  <td style={{padding:"0.8rem 0.5rem", fontFamily:"var(--mono)", fontSize:"0.75rem", color:"var(--cyan)"}}>{wl.id}</td>
                  <td>
                    <b style={{color:"#fff"}}>{wl.file_name || wl.file_path}</b>
                    <div style={{fontSize:"0.7rem", color:"var(--text-muted)", fontFamily:"var(--mono)"}}>{wl.file_path}</div>
                  </td>
                  <td>
                    <Badge variant={wl.duration === "permanent" ? "outline" : "secondary"}>
                      {wl.duration === "permanent" ? "Permanent Whitelist" : "Temporary (1 Hour)"}
                    </Badge>
                  </td>
                  <td style={{fontFamily:"var(--mono)", fontSize:"0.75rem", color:"var(--text-muted)"}}>
                    {wl.expires_at ? new Date(wl.expires_at).toLocaleTimeString() : "Never (Permanent)"}
                  </td>
                  <td style={{color:"#ccc"}}>{wl.reason || "Analyst approved"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )}
  </div>;
}

function FleetPage({ demoMode }: { demoMode?: boolean }) {
  const q = trpc.soc.getDevices.useQuery();
  const demoFleet = [
    { id: "DEV-CORP-WS1", hostname: "FINANCE-PC-014", ip_address: "10.0.0.14", os_type: "Windows 11 Enterprise", criticality: "Medium", status: "Active" },
    { id: "DEV-CORP-DC1", hostname: "CORP-DC-01", ip_address: "10.0.0.2", os_type: "Windows Server 2022", criticality: "Critical", status: "Active" },
    { id: "DEV-DC-DB1", hostname: "PROD-DB-01", ip_address: "172.16.0.100", os_type: "Ubuntu 22.04 LTS", criticality: "Critical", status: "Active" },
    { id: "DEV-DMZ-WEB1", hostname: "DMZ-WEB-03", ip_address: "192.168.1.10", os_type: "Debian 12 / Nginx", criticality: "High", status: "Investigating" },
    { id: "DEV-ENG-LT1", hostname: "ENG-LT-019", ip_address: "10.0.2.45", os_type: "macOS Sonoma 14.5", criticality: "High", status: "Active" },
    { id: "DEV-OPS-SRV", hostname: "OPS-SRV-07", ip_address: "172.16.0.40", os_type: "RHEL 9.2", criticality: "Medium", status: "Active" },
    { id: "DEV-EDGE-GW", hostname: "EDGE-GW-01", ip_address: "185.220.101.1", os_type: "FortiOS 7.4", criticality: "Critical", status: "Active" }
  ];

  const devices = demoMode ? demoFleet : (q.data || []);

  return <div className="page">
    <SectionTitle eyebrow="ASSET MANAGEMENT & ENDPOINT TELEMETRY" title="Fleet Inventory" />
    {demoMode && (
      <div style={{padding:"0.75rem 1rem",background:"rgba(255,184,0,0.1)",border:"1px solid #f59e0b",borderRadius:6,marginBottom:"1rem",color:"#fbbf24",fontSize:"0.8rem",display:"flex",alignItems:"center",gap:8}}>
        <Flame size={16} />
        <b>DEMO FLEET ACTIVE:</b> Showing synthetic asset telemetry across 7 corporate networks.
      </div>
    )}
    <div className="panel">
      {q.isLoading && !demoMode && <div style={{padding:"2rem"}}>Loading fleet devices...</div>}
      {!q.isLoading && devices.length === 0 && <div style={{padding:"2rem"}} className="muted">No devices reporting to the SOC.</div>}
      <table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{borderBottom:"1px solid var(--border)"}}>
            <th style={{padding:"0.5rem"}}>Hostname</th>
            <th>IP Address</th>
            <th>Operating System</th>
            <th>Criticality</th>
            <th>Sensor Status</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d: any) => (
            <tr key={d.id} style={{borderBottom:"1px solid var(--border)"}}>
              <td style={{padding:"1rem 0.5rem",fontWeight:600}}>{d.hostname}</td>
              <td style={{fontFamily:"var(--mono)",fontSize:"0.8rem"}}>{d.ip_address}</td>
              <td>{d.os_type || d.device_type}</td>
              <td><Badge variant={d.criticality?.toLowerCase() === "critical" ? "destructive" : "outline"}>{d.criticality}</Badge></td>
              <td>
                <span style={{color:"var(--lime)",fontSize:"0.75rem",display:"flex",alignItems:"center",gap:4}}>
                  <span className="pulse" style={{width:6,height:6,borderRadius:"50%",background:"var(--lime)"}} /> Connected
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>;
}

function MitigationPage({ demoMode, flash }: { demoMode?: boolean; flash?: (t: string) => void }) {
  const [actionsState, setActionsState] = useState<any[]>([
    { id: "MIT-001", target: "FIN-WS-042", type: "QUARANTINE_FILE", desc: "Isolate ransomware binary 'invoice.exe' to secure enclave", status: "RECOMMENDED", playbook: "PB-RANSOMWARE-01" },
    { id: "MIT-002", target: "EDGE-GW-01", type: "BLOCK_IP", desc: "Deploy edge firewall block for C2 address 185.220.101.4", status: "APPROVED", playbook: "PB-C2-CONTAINMENT" },
    { id: "MIT-003", target: "ENG-LT-019", type: "KILL_PROCESS", desc: "Terminate unauthorized obfuscated powershell.exe (PID 4912)", status: "EXECUTED", playbook: "PB-EXECUTION-TRIAGE" },
    { id: "MIT-004", target: "FIN-WS-042", type: "ISOLATE_ENDPOINT", desc: "Sever network adapter link on subnet 10.0.0.0/24", status: "RECOMMENDED", playbook: "PB-LATERAL-PREVENT" }
  ]);

  const handleAction = (id: string, nextStatus: string, msg: string) => {
    setActionsState(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));
    flash?.(msg);
  };

  return <div className="page">
    <SectionTitle eyebrow="INCIDENT RESPONSE & REMEDIATION ORCHESTRATOR" title="Autonomous Mitigation Console" />
    <div className="panel">
      <div style={{marginBottom:"1rem"}}>
        <h3 style={{fontSize:"0.85rem",letterSpacing:"1px",color:"var(--cyan)"}}>ACTIVE MITIGATION ACTIONS & PLAYBOOKS</h3>
        <p className="muted" style={{fontSize:"0.75rem",marginTop:2}}>
          Actions are recommended by the RAGSec Reasoning Engine and require Tier 3 SOC Analyst authorization.
        </p>
      </div>

      <table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{borderBottom:"1px solid var(--border)",fontSize:"0.75rem",color:"var(--text-muted)"}}>
            <th style={{padding:"0.6rem 0.5rem"}}>ID</th>
            <th>Target Device</th>
            <th>Remediation Type</th>
            <th>Playbook & Rationale</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {actionsState.map(a => (
            <tr key={a.id} style={{borderBottom:"1px solid var(--border)",fontSize:"0.8rem"}}>
              <td style={{padding:"1rem 0.5rem",fontFamily:"var(--mono)",fontSize:"0.75rem"}}>{a.id}</td>
              <td style={{fontWeight:600}}>{a.target}</td>
              <td>
                <span style={{fontFamily:"var(--mono)",fontSize:"0.75rem",padding:"2px 6px",borderRadius:4,background:"rgba(71,234,255,0.1)",color:"var(--cyan)"}}>
                  {a.type}
                </span>
              </td>
              <td>
                <div><b>[{a.playbook}]</b> {a.desc}</div>
              </td>
              <td>
                <Badge variant={a.status === "EXECUTED" ? "default" : a.status === "APPROVED" ? "outline" : "destructive"}>
                  {a.status}
                </Badge>
              </td>
              <td>
                {a.status === "RECOMMENDED" && (
                  <Button size="sm" onClick={() => handleAction(a.id, "APPROVED", `Mitigation action ${a.id} approved by Analyst`)} style={{fontSize:"0.7rem",height:26}}>
                    Approve
                  </Button>
                )}
                {a.status === "APPROVED" && (
                  <Button size="sm" onClick={() => handleAction(a.id, "EXECUTED", `Executing automated remediation on ${a.target}...`)} style={{background:"var(--lime)",color:"#000",fontSize:"0.7rem",height:26,fontWeight:700}}>
                    <Play size={10} style={{marginRight:4}} /> Execute
                  </Button>
                )}
                {a.status === "EXECUTED" && (
                  <span style={{color:"var(--lime)",fontSize:"0.75rem",display:"flex",alignItems:"center",gap:4}}>
                    <CheckCircle2 size={13} /> Verified
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>;
}

function SettingsPage({ flash }: { flash?: (t: string) => void }) {
  const [monitoredDir, setMonitoredDir] = useState("C:\\Projects\\RAGTEC\\monitored_workspace");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [model, setModel] = useState("llama3.2");
  const [critThresh, setCritThresh] = useState("0.70");

  const save = () => {
    flash?.("System configuration updated successfully");
  };

  return <div className="page">
    <SectionTitle eyebrow="SYSTEM CONFIGURATION & POLICY ENGINE" title="SOC Console Settings" />
    <div className="panel" style={{maxWidth:700}}>
      <div style={{display:"flex",flexDirection:"column",gap:"1.2rem"}}>
        <div>
          <label style={{fontSize:"0.8rem",fontWeight:700,color:"var(--cyan)"}}>MONITORED WORKSPACE DIRECTORY</label>
          <p className="muted" style={{fontSize:"0.75rem",marginBottom:"0.5rem"}}>Local folder path continuously monitored by the FIM Watcher and Threat Analyzer.</p>
          <Input value={monitoredDir} onChange={e => setMonitoredDir(e.target.value)} style={{fontFamily:"var(--mono)",fontSize:"0.8rem"}} />
        </div>

        <div>
          <label style={{fontSize:"0.8rem",fontWeight:700,color:"var(--cyan)"}}>LOCAL LLM INFERENCE ENGINE (OLLAMA)</label>
          <p className="muted" style={{fontSize:"0.75rem",marginBottom:"0.5rem"}}>Host URL for private on-premises generative inference.</p>
          <Input value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} style={{fontFamily:"var(--mono)",fontSize:"0.8rem"}} />
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div>
            <label style={{fontSize:"0.8rem",fontWeight:700,color:"var(--cyan)"}}>ACTIVE REASONING MODEL</label>
            <Input value={model} onChange={e => setModel(e.target.value)} style={{fontFamily:"var(--mono)",fontSize:"0.8rem",marginTop:4}} />
          </div>
          <div>
            <label style={{fontSize:"0.8rem",fontWeight:700,color:"var(--cyan)"}}>CRITICAL SIMILARITY THRESHOLD</label>
            <Input value={critThresh} onChange={e => setCritThresh(e.target.value)} style={{fontFamily:"var(--mono)",fontSize:"0.8rem",marginTop:4}} />
          </div>
        </div>

        <Button className="pink-btn" onClick={save} style={{alignSelf:"flex-start",marginTop:"0.5rem"}}>
          Save Configuration
        </Button>
      </div>
    </div>
  </div>;
}

function StubPage({ name, demoMode, flash }: { name: string; demoMode?: boolean; flash?: (t: string) => void }) {
  if (name === "Incidents") return <IncidentsPage />;
  if (name === "Alerts") return <AlertsPage />;
  if (name === "FIM Monitor") return <FimMonitorPage demoMode={demoMode} flash={flash} />;
  if (name === "Fleet") return <FleetPage demoMode={demoMode} />;
  if (name === "Mitigation") return <MitigationPage demoMode={demoMode} flash={flash} />;
  if (name === "Settings") return <SettingsPage flash={flash} />;
  return <div className="page"><SectionTitle eyebrow="UNDER CONSTRUCTION" title={name} /><div className="panel" style={{padding:"2rem",textAlign:"center"}}><CircleDashed size={40} style={{opacity:0.3,marginBottom:"1rem"}} /><p className="muted">This module is scheduled for implementation in a future phase.</p></div></div>;
}
