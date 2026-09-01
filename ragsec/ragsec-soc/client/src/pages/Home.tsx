import { useMemo, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, CheckCircle2, ChevronRight, CircleDashed, CircleDot,
  ClipboardCheck, CloudUpload, Database, FileKey2, FileWarning, Filter, Flame, Globe2,
  Hash, LayoutDashboard, LockKeyhole, Menu, MessageSquareText, Network, Play, Plus,
  Radar, RefreshCw, Search, Send, Server, Settings2, ShieldAlert, ShieldCheck, Siren,
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
  const page = active === "Dashboard" ? <Dashboard onNavigate={setActive} demoMode={demoMode} /> : active === "Threat Query" ? <ThreatQuery query={query} setQuery={setQuery} sentQuery={sentQuery} setSentQuery={setSentQuery} /> : active === "Knowledge Base" ? <Knowledge flash={flash} /> : active === "Audit Log" ? <Audit /> : <StubPage name={active} demoMode={demoMode} />;

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

function ThreatQuery({ query, setQuery, sentQuery, setSentQuery }: any) {
  const queryApi = trpc.soc.queryPhase7.useMutation();
  
  const send = () => {
    if (query.trim()) {
      setSentQuery(query);
      queryApi.mutate({ query });
      setQuery("");
    }
  };
  
  const evidence = queryApi.data?.evidence || [];
  const answer = queryApi.data?.answer || "";
  const gov = queryApi.data?.governance || null;
  const status = queryApi.data?.status || "";
  const confidence = queryApi.data?.confidence_score;
  const isAbstained = status === "ABSTAINED";
  
  const GovCheck = ({ ok, label }: { ok: boolean | undefined; label: string }) => (
    <li style={{color: ok === undefined ? "var(--text-muted)" : ok ? "var(--lime)" : "var(--pink)"}}>
      {ok === undefined ? <CircleDashed size={14} /> : ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {" "}{label}
    </li>
  );
  
  return <div className="page">
    <SectionTitle eyebrow="RAGSEC CO-PILOT / GROUNDED INTELLIGENCE" title="Ask the knowledge base" action={<div className="confidence-pill"><span className="pulse" /> EVIDENCE MODE · ON</div>} />
    <div className="query-grid">
      <section className="panel query-panel">
        <div className="query-top"><div className="ai-orb"><Sparkles size={23} /></div><div><b>RAGSec Investigator</b><span>Evidence Retrieval · Reranking · Grounded Generation</span></div><Badge>LOCAL INFERENCE</Badge></div>
        <div className="chat-area">
          {sentQuery && <div className="query-bubble"><span className="bubble-label">YOU</span>{sentQuery}</div>}
          
          <div className="answer-block">
            <div className="answer-head"><div className="ai-mini"><Bot size={15} /></div><span>RAGSEC · {queryApi.isPending ? "THINKING..." : "RESPONSE"}</span>{!queryApi.isPending && status && <Badge style={{marginLeft:8}} variant={isAbstained ? "destructive" : "default"}>{status}</Badge>}{!queryApi.isPending && confidence !== undefined && <span style={{marginLeft:8,fontSize:"0.7rem",color:"var(--text-muted)"}}>CONFIDENCE: {(confidence * 100).toFixed(1)}%</span>}</div>
            
            {queryApi.isPending && <div style={{padding: "1rem"}} className="muted">Running retrieval → reranking → evidence gating → LLM generation → CRC verification...</div>}
            
            {answer && !queryApi.isPending && (
              <div className="answer-text">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  table: ({node, ...props}) => <div className="overflow-x-auto"><table className="border-collapse border border-gray-700 w-full" {...props} /></div>,
                  th: ({node, ...props}) => <th className="border border-gray-600 bg-gray-800 px-4 py-2" {...props} />,
                  td: ({node, ...props}) => <td className="border border-gray-700 px-4 py-2" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                }}>
                  {answer}
                </ReactMarkdown>
              </div>
            )}
            {!queryApi.isPending && !answer && <div style={{padding: "1rem"}} className="muted">Submit a query to generate an AI response grounded in the knowledge base.</div>}
            
            {!queryApi.isPending && gov?.warnings && gov.warnings.length > 0 && <div style={{padding: "0.75rem 1rem", background: "rgba(255,61,169,0.1)", borderLeft: "3px solid var(--pink)", margin: "0.5rem 1rem", fontSize: "0.8rem"}}>
              <b>⚠ Verification Warnings:</b>
              {gov.warnings.map((w: string, i: number) => <div key={i} style={{marginTop:4}}>{w}</div>)}
            </div>}
            
            {!queryApi.isPending && evidence.length > 0 && <div className="evidence-trace-ui" style={{marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem"}}>
              <h4 style={{fontSize: "0.75rem", letterSpacing: "1px", color: "var(--cyan)", marginBottom: "1rem"}}>CITATIONS / EVIDENCE TRACE</h4>
              {evidence.map((e: any, i: number) => (
                <div key={e.chunk_id || i} style={{padding: "1rem", border: "1px solid var(--border)", margin: "0.5rem 0", borderRadius: "4px", background: "rgba(0,0,0,0.2)"}}>
                  <div style={{display: "flex", justifyContent: "space-between", marginBottom: "0.5rem"}}>
                    <b><FileKey2 size={12} style={{display:"inline", marginRight:4}}/> [{e.citation_tag || "C"+(i+1)}] {e.source_name || e.source}</b>
                    <div style={{display:"flex", gap: "10px"}}>
                      {e.rerank_score != null && <span style={{fontSize: "0.75rem", color: "var(--pink)"}}>RERANK: {Number(e.rerank_score).toFixed(2)}</span>}
                      {e.dense_score != null && <span style={{fontSize: "0.75rem", color: "var(--text-muted)"}}>DENSE: {Number(e.dense_score).toFixed(2)}</span>}
                    </div>
                  </div>
                  <div style={{fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--mono)", marginBottom: "0.5rem"}}>
                    Entities: {e.entities ? e.entities.join(", ") : (e.extracted_entities || []).join(", ") || "None"}
                  </div>
                  <p style={{fontSize: "0.85rem", lineHeight: 1.5}}>{e.masked_text || e.text || e.chunk_text}</p>
                </div>
              ))}
            </div>}
          </div>
        </div>
        <div className="query-compose">
          <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}} placeholder="Ask about recent threats, IOCs, or affected hosts..." />
          <button className="pink-btn" onClick={send} disabled={queryApi.isPending}><Sparkles size={14} /> {queryApi.isPending ? "Generating..." : "Generate"}</button>
        </div>
      </section>
      <aside className="panel nav-panel">
        <div className="side-label">GOVERNANCE</div>
        <ul className="gov-list">
          <GovCheck ok={gov ? gov.identity_verified : undefined} label="Identity verified" />
          <GovCheck ok={gov ? gov.pii_masked : undefined} label="PII masking active" />
          <GovCheck ok={gov ? gov.cross_encoder_active : undefined} label="Cross-encoder alignment" />
          <GovCheck ok={gov ? (gov.citation_check === "VERIFIED" || gov.citation_check === "PARTIAL") : undefined} label={`Citation check${gov?.citation_check ? ` (${gov.citation_check})` : ""}`} />
        </ul>
        {gov?.gating && <div style={{marginTop:"1rem",padding:"0.5rem",fontSize:"0.7rem",borderTop:"1px solid var(--border)"}}>
          <div>Gating: <b style={{color: gov.gating === "PASSED" ? "var(--lime)" : "var(--pink)"}}>{gov.gating}</b></div>
          {gov.gating_reason && <div style={{color:"var(--pink)",marginTop:4}}>{gov.gating_reason}</div>}
        </div>}
      </aside>
    </div>
  </div>;
}

function Knowledge({ flash }: { flash: (t: string) => void }) {
  const sources = trpc.soc.listSources.useQuery();
  const upload = trpc.soc.uploadKnowledgeSource.useMutation({ onSuccess: () => { flash("Document ingested"); sources.refetch(); }});
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = () => { const b64 = (reader.result as string).split(",")[1]; upload.mutate({ name: f.name, mimeType: f.type || "text/plain", base64: b64 }); }; reader.readAsDataURL(f); };
  return <div className="page"><SectionTitle eyebrow="KNOWLEDGE BASE / CTI CORPUS" title="Ingested sources" action={<label className="pink-btn" style={{cursor:"pointer"}}><CloudUpload size={14} /> Upload<input type="file" hidden onChange={handleUpload} /></label>} />
    <div className="incident-list">{(sources.data || []).map((s: any) => <div className="incident-row" key={s.id}><div className="incident-marker medium"><Database size={15} /></div><div className="incident-main"><div><b>{s.name}</b><span>{s.id}</span></div><div className="incident-meta"><span>{s.chunkCount} chunks</span><span className="techniques">{(s.extractedEntities || []).slice(0,5).map((e: string) => <code key={e}>{e}</code>)}</span></div></div><Badge>{s.ingestionStatus}</Badge></div>)}</div>
  </div>;
}

function Audit() {
  const audit = trpc.soc.immutableAudit.useQuery();
  return <div className="page"><SectionTitle eyebrow="GOVERNANCE / AUDIT" title="Immutable audit trail" />
    <div className="incident-list">{(audit.data || []).map((a: any) => <div className="incident-row" key={a.id}><div className="incident-marker low"><ClipboardCheck size={15} /></div><div className="incident-main"><div><b>{a.action}</b><span>{a.target}</span></div><div className="incident-meta"><span>{a.result}</span><code style={{fontSize:"0.6rem"}}>{a.chainHash}</code></div></div><span className="state-text">{new Date(a.createdAt).toLocaleTimeString()}</span></div>)}</div>
  </div>;
}

function IncidentsPage() {
  const q = trpc.soc.getIncidents.useQuery();
  return <div className="page"><SectionTitle eyebrow="SOC QUEUE" title="Incidents" />
    <div className="panel">
      {q.isLoading && <div style={{padding:"2rem"}}>Loading incidents...</div>}
      {!q.isLoading && (q.data || []).length === 0 && <div style={{padding:"2rem"}} className="muted">No incidents active.</div>}
      <table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}>
        <thead><tr style={{borderBottom:"1px solid var(--border)"}}><th style={{padding:"0.5rem"}}>ID</th><th>Title</th><th>Severity</th><th>Status</th></tr></thead>
        <tbody>
          {(q.data || []).map((i: any) => <tr key={i.id} style={{borderBottom:"1px solid var(--border)"}}>
            <td style={{padding:"1rem 0.5rem",fontFamily:"var(--mono)",fontSize:"0.8rem"}}>{i.id}</td>
            <td>{i.title}</td>
            <td><Severity value={i.threat_classification?.severity || "Medium"} /></td>
            <td><Status value={i.status || "Open"} /></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}

function AlertsPage() {
  const q = trpc.soc.getEvents.useQuery();
  return <div className="page"><SectionTitle eyebrow="SOC QUEUE" title="Security Alerts & Events" />
    <div className="panel">
      {q.isLoading && <div style={{padding:"2rem"}}>Loading alerts...</div>}
      {!q.isLoading && (q.data || []).length === 0 && <div style={{padding:"2rem"}} className="muted">No security events found.</div>}
      <table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}>
        <thead><tr style={{borderBottom:"1px solid var(--border)"}}><th style={{padding:"0.5rem"}}>Time</th><th>Source</th><th>Description</th></tr></thead>
        <tbody>
          {(q.data || []).map((e: any) => <tr key={e.id} style={{borderBottom:"1px solid var(--border)"}}>
            <td style={{padding:"1rem 0.5rem",fontFamily:"var(--mono)",fontSize:"0.8rem"}}>{new Date(e.timestamp).toLocaleString()}</td>
            <td><Badge>{e.source_type}</Badge></td>
            <td>{e.title || "Security Event"}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}

function FimMonitorPage({ demoMode }: { demoMode?: boolean }) {
  const q = trpc.soc.getFimEvents.useQuery();
  const rawEvents = demoMode ? [
    { id: "demo-1", timestamp: new Date().toISOString(), device_id: "FIN-WS-042", canonical: { action: "CREATE", file_path: "C:\\Users\\Public\\invoice.exe", risk_score: 98 } },
    { id: "demo-2", timestamp: new Date(Date.now() - 180000).toISOString(), device_id: "DMZ-WEB-03", canonical: { action: "MODIFY", file_path: "/var/www/html/.cache.php", risk_score: 86 } },
    { id: "demo-3", timestamp: new Date(Date.now() - 300000).toISOString(), device_id: "FIN-WS-042", canonical: { action: "CREATE", file_path: "C:\\Users\\Public\\ransom_note.txt", risk_score: 99 } },
    { id: "demo-4", timestamp: new Date(Date.now() - 420000).toISOString(), device_id: "FIN-WS-042", canonical: { action: "MODIFY", file_path: "C:\\Users\\Finance\\Q3_report.xlsx", risk_score: 65 } },
    { id: "demo-5", timestamp: new Date(Date.now() - 600000).toISOString(), device_id: "FIN-WS-042", canonical: { action: "RENAME", file_path: "C:\\Backups\\db.zip -> db.locked", risk_score: 95 } },
    { id: "demo-6", timestamp: new Date(Date.now() - 900000).toISOString(), device_id: "CORP-DC-01", canonical: { action: "DELETE", file_path: "C:\\Windows\\System32\\winevt\\Logs\\Security.evtx", risk_score: 90 } }
  ] : (q.data || []);

  return <div className="page">
    <SectionTitle eyebrow="FILE INTEGRITY" title="FIM Monitor" />
    {demoMode && (
      <div style={{padding:"0.75rem 1rem",background:"rgba(255,184,0,0.1)",border:"1px solid #f59e0b",borderRadius:6,marginBottom:"1rem",color:"#fbbf24",fontSize:"0.8rem",display:"flex",alignItems:"center",gap:8}}>
        <Flame size={16} />
        <b>DEMO TELEMETRY ACTIVE:</b> Showing synthetic FIM demonstration attack chain. Switch top-right toggle to LIVE MODE for real filesystem monitoring.
      </div>
    )}
    <div className="panel">
      {q.isLoading && !demoMode && <div style={{padding:"2rem"}}>Loading FIM data...</div>}
      {!q.isLoading && rawEvents.length === 0 && <div style={{padding:"2rem"}} className="muted">No FIM events found. Try creating or deleting a file in the monitored workspace.</div>}
      <table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}>
        <thead><tr style={{borderBottom:"1px solid var(--border)"}}><th style={{padding:"0.5rem"}}>Time</th><th>Host</th><th>Action</th><th>File Path</th><th>Risk</th></tr></thead>
        <tbody>
          {rawEvents.map((e: any) => <tr key={e.id} style={{borderBottom:"1px solid var(--border)"}}>
            <td style={{padding:"1rem 0.5rem",fontFamily:"var(--mono)",fontSize:"0.8rem"}}>{new Date(e.timestamp).toLocaleTimeString()}</td>
            <td>{e.device_id || "local"}</td>
            <td><span className={`fim-action ${e.canonical?.action?.toLowerCase() || ""}`}>{e.canonical?.action}</span></td>
            <td style={{fontFamily:"var(--mono)",fontSize:"0.75rem"}}>{e.canonical?.file_path}</td>
            <td>{e.canonical?.risk_score > 50 ? <span className="risk-score">RISK {e.canonical.risk_score}</span> : <span className="fim-badge benign">Benign</span>}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}

function FleetPage() {
  const q = trpc.soc.getDevices.useQuery();
  return <div className="page"><SectionTitle eyebrow="ASSET MANAGEMENT" title="Fleet" />
    <div className="panel">
      {q.isLoading && <div style={{padding:"2rem"}}>Loading fleet devices...</div>}
      {!q.isLoading && (q.data || []).length === 0 && <div style={{padding:"2rem"}} className="muted">No devices reporting to the SOC.</div>}
      <table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}>
        <thead><tr style={{borderBottom:"1px solid var(--border)"}}><th style={{padding:"0.5rem"}}>Hostname</th><th>IP</th><th>OS</th><th>Criticality</th></tr></thead>
        <tbody>
          {(q.data || []).map((d: any) => <tr key={d.id} style={{borderBottom:"1px solid var(--border)"}}>
            <td style={{padding:"1rem 0.5rem"}}>{d.hostname}</td>
            <td style={{fontFamily:"var(--mono)",fontSize:"0.8rem"}}>{d.ip_address}</td>
            <td>{d.os_type || d.device_type}</td>
            <td><Badge variant="outline">{d.criticality}</Badge></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}

function MitigationPage() {
  return <div className="page"><SectionTitle eyebrow="RESPONSE" title="Autonomous Mitigation" /><div className="panel" style={{padding:"2rem",textAlign:"center"}}><CircleDashed size={40} style={{opacity:0.3,marginBottom:"1rem"}} /><p className="muted">This feature requires Phase 8 (Autonomous Simulation) and is not yet implemented.</p></div></div>;
}

function SettingsPage() {
  return <div className="page"><SectionTitle eyebrow="CONFIGURATION" title="Settings" /><div className="panel" style={{padding:"2rem",textAlign:"center"}}><p className="muted">System settings are currently managed via backend environment variables (config.py).</p></div></div>;
}

function StubPage({ name, demoMode }: { name: string; demoMode?: boolean }) {
  if (name === "Incidents") return <IncidentsPage />;
  if (name === "Alerts") return <AlertsPage />;
  if (name === "FIM Monitor") return <FimMonitorPage demoMode={demoMode} />;
  if (name === "Fleet") return <FleetPage />;
  if (name === "Mitigation") return <MitigationPage />;
  if (name === "Settings") return <SettingsPage />;
  return <div className="page"><SectionTitle eyebrow="UNDER CONSTRUCTION" title={name} /><div className="panel" style={{padding:"2rem",textAlign:"center"}}><CircleDashed size={40} style={{opacity:0.3,marginBottom:"1rem"}} /><p className="muted">This module is scheduled for implementation in a future phase.</p></div></div>;
}
