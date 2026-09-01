import { useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, CheckCircle2, ChevronRight, CircleDot,
  ClipboardCheck, CloudUpload, Database, FileKey2, FileWarning, Filter, Flame, Globe2,
  Hash, LayoutDashboard, LockKeyhole, Menu, MessageSquareText, Network, Play, Plus,
  Radar, RefreshCw, Search, Send, Server, Settings2, ShieldAlert, ShieldCheck, Siren,
  SlidersHorizontal, Sparkles, Terminal, UserRound, Users, X, Zap
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
function Status({ value }: { value: string }) { return <span className={`status status-${value.toLowerCase()}`}><span className="dot" />{value}</span>; }
function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="section-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>; }
function MiniStat({ label, value, tone, sub }: { label: string; value: string; tone: string; sub: string }) { return <div className="mini-stat"><div className={`stat-icon ${tone}`}><Activity size={17} /></div><div><div className="stat-label">{label}</div><strong>{value}</strong><span>{sub}</span></div></div>; }

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [active, setActive] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [sentQuery, setSentQuery] = useState("How does the ransomware signal on FIN-WS-042 map to known ATT&CK techniques?");
  const [mobileNav, setMobileNav] = useState(false);
  const [live, setLive] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(alerts[0]);
  const [notice, setNotice] = useState("");

  const answer = useMemo(() => `Submit a query to retrieve evidence-grounded analysis from the private knowledge base.`, [sentQuery]);

  const flash = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(""), 2600); };
  const page = active === "Dashboard" ? <Dashboard onNavigate={setActive} /> : active === "Threat Query" ? <ThreatQuery query={query} setQuery={setQuery} sentQuery={sentQuery} setSentQuery={setSentQuery} answer={answer} /> : active === "Alerts" ? <Alerts onSelect={setSelectedAlert} selected={selectedAlert} flash={flash} /> : active === "Incidents" ? <Incidents flash={flash} /> : active === "FIM Monitor" ? <FIM /> : active === "Fleet" ? <Fleet /> : active === "Mitigation" ? <Mitigation flash={flash} /> : active === "Knowledge Base" ? <Knowledge flash={flash} /> : active === "Audit Log" ? <Audit /> : <Settings />;

  if (loading) return <div className="splash"><Radar size={34} /><span>INITIALIZING SECURE CONSOLE</span></div>;
  return <div className="app-shell">
    {notice && <div className="toast"><CheckCircle2 size={17} /> {notice}</div>}
    <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Radar size={21} /></div><div><b>RAGSEC</b><span>SOC / COMMAND</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
      <div className="side-label">OPERATIONS</div>
      <nav>{nav.slice(0, 7).map(([label, Icon]) => <button key={label} className={active === label ? "nav-active" : ""} onClick={() => { setActive(label); setMobileNav(false); }}><Icon size={17} /><span>{label}</span>{["Alerts", "Incidents"].includes(label) && <em>{label === "Alerts" ? "12" : "3"}</em>}</button>)}</nav>
      <div className="side-label">GOVERNANCE</div>
      <nav>{nav.slice(7).map(([label, Icon]) => <button key={label} className={active === label ? "nav-active" : ""} onClick={() => { setActive(label); setMobileNav(false); }}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <div className="side-bottom"><div className="system-card"><div className="online"><span className="pulse" /> SYSTEM NOMINAL</div><small>All collectors reporting</small><div className="system-bar"><span /></div></div><div className="profile"><div className="avatar">{user?.name?.slice(0, 1) || "A"}</div><div><b>{user?.name || "Analyst One"}</b><span>Tier 3 Â· SOC Analyst</span></div><ChevronRight size={15} /></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="crumb"><span>SECURITY OPERATIONS</span><ChevronRight size={14} /><b>{active.toUpperCase()}</b></div><div className="top-actions"><div className="global-search"><Search size={15} /><input placeholder="Search IOC, host, CVEâ€¦" /></div><div className="status-pill"><span className="pulse" /> ALL SYSTEMS NOMINAL</div><button className="icon-button" onClick={() => flash("No new notifications") }><BellIcon /></button>{isAuthenticated ? <div className="top-avatar">{user?.name?.slice(0, 1) || "A"}</div> : <Button onClick={() => startLogin()} className="login-btn">Sign in</Button>}</div></header>
      <div className="content">{page}</div>
    </main>
  </div>;
}
function BellIcon() { return <Siren size={17} />; }

function Dashboard({ onNavigate }: { onNavigate: (x: string) => void }) { const telemetry = trpc.soc.telemetrySnapshot.useQuery(undefined, { refetchInterval: 12000 }); const activeCount = telemetry.data?.alerts?.length ? String(telemetry.data.alerts.length) : "12"; return <div className="page"><div className="hero-row"><div><p className="eyebrow">WED Â· 19 AUG 2026 / 09:49 UTC Â· TELEMETRY LINK ACTIVE</p><h1>Good morning, <span>Analyst.</span></h1><p className="muted">Your network is being watched. Here is the signal.</p></div><Button className="outline-btn" onClick={() => onNavigate("Threat Query")}><Sparkles size={16} /> Ask RAGSec</Button></div><div className="stat-grid"><MiniStat label="Active alerts" value={activeCount} tone="pink" sub="+3 in last hour" /><MiniStat label="Critical incidents" value="02" tone="red" sub="1 escalated" /><MiniStat label="Protected endpoints" value="248" tone="cyan" sub="98.4% reporting" /><MiniStat label="SOC productivity" value="2.711" tone="lime" sub="+14.8% this week" /></div><div className="dashboard-grid"><section className="panel threat-panel"><SectionTitle eyebrow="THREAT LANDSCAPE / 24H" title="Signal intensity" action={<span className="live-tag"><span className="pulse" /> LIVE</span>} /><div className="heatmap"><div className="heat-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div><div className="heat-grid">{Array.from({ length: 96 }, (_, i) => <i key={i} style={{ opacity: 0.18 + ((i * 17) % 80) / 100, background: i % 11 === 0 ? "#ff3da9" : i % 5 === 0 ? "#47eaff" : "#8c4dff" }} />)}</div><div className="heat-legend"><span><i className="legend-dot cyan" /> Ingested 84.2K</span><span><i className="legend-dot pink" /> Suspicious 1,284</span><span><i className="legend-dot red" /> Critical 38</span></div></div></section><section className="panel sps-panel"><SectionTitle eyebrow="AI PERFORMANCE / SPS" title="Productivity score" action={<button className="ghost-btn"><RefreshCw size={14} /></button>} /><div className="gauge-wrap"><div className="gauge"><div className="gauge-inner"><strong>2.711</strong><span>OUT OF 3.0</span></div></div><div className="gauge-copy"><p>Governed RAG pipeline</p><small>Target threshold <b>2.400</b></small></div></div><div className="metric-row"><div><span>Factual alignment</span><b>94.2%</b><Progress value={94} /></div><div><span>Triage efficiency</span><b>87.8%</b><Progress value={88} /></div></div></section></div><div className="lower-grid"><section className="panel"><SectionTitle eyebrow="ACTIVE QUEUE" title="Recent incidents" action={<button className="text-btn" onClick={() => onNavigate("Incidents")}>View all <ArrowUpRight size={14} /></button>} /><div className="incident-list">{incidents.map(i => <div className="incident-row" key={i.id}><div className={`incident-marker ${i.severity.toLowerCase()}`}><Siren size={15} /></div><div className="incident-main"><div><b>{i.title}</b><span>{i.id} Â· {i.time}</span></div><div className="incident-meta"><Severity value={i.severity} /><span className="techniques">{i.techniques.map(t => <code key={t}>{t}</code>)}</span></div></div><span className="state-text">{i.state}</span><ChevronRight size={16} /></div>)}</div></section><section className="panel"><SectionTitle eyebrow="AUTONOMOUS RESPONSE" title="Action stream" action={<span className="muted mono">LAST 60 MIN</span>} /><div className="action-stream"><div><span className="stream-time">09:47:19</span><span className="stream-icon good"><ShieldCheck size={14} /></span><p><b>IP block staged</b><small>185.220.101.4 Â· Edge Firewall</small></p><span className="stream-state">AUTO</span></div><div><span className="stream-time">09:42:08</span><span className="stream-icon warn"><LockKeyhole size={14} /></span><p><b>Host quarantine requested</b><small>FIN-WS-042 Â· Approval required</small></p><span className="stream-state pending">PENDING</span></div><div><span className="stream-time">09:31:45</span><span className="stream-icon good"><CheckCircle2 size={14} /></span><p><b>Process terminated</b><small>powershell.exe Â· OPS-SRV-07</small></p><span className="stream-state">AUTO</span></div></div></section></div></div> }

REPLACE_ME
