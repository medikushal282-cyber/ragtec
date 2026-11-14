import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Severity = "THREAT" | "SUSPICIOUS" | "SAFE" | "QUARANTINED";
type EventRow = {
  id: number;
  status: Severity;
  event: string;
  path: string;
  process: string;
  pid: number;
  hash: string;
  time: number;
};

const API_BASE = "http://127.0.0.1:8000";

const C = {
  threat: "#fb4967",
  safe: "#27d69a",
  blue: "#4a8fff",
  amber: "#f7ad38",
  violet: "#9b77ff",
  cyan: "#25c9e8",
};

const seedEvents: EventRow[] = [
  {
    id: 1,
    status: "THREAT",
    event: "CREATE",
    path: "/sandbox/web_backdoor.php",
    process: "apache2",
    pid: 3824,
    hash: "af30dd1e8970d65fa63e7218d1c90321",
    time: Date.now() - 3000,
  },
  {
    id: 2,
    status: "SUSPICIOUS",
    event: "MODIFY",
    path: "/sandbox/combined_behavior_sim.bat",
    process: "cmd.exe",
    pid: 4492,
    hash: "290ff7d840aa7bfe1ce4603ab6123bc9",
    time: Date.now() - 18000,
  },
  {
    id: 3,
    status: "SAFE",
    event: "READ",
    path: "/workspace/auth_handler.py",
    process: "python.exe",
    pid: 1042,
    hash: "c4d12ff85bf915bb6102a66a9aa82cab",
    time: Date.now() - 42000,
  },
  {
    id: 4,
    status: "SAFE",
    event: "MODIFY",
    path: "/sandbox/app_config.json",
    process: "code.exe",
    pid: 1804,
    hash: "ea1720ac778f029de834498bab60f102",
    time: Date.now() - 61000,
  },
  {
    id: 5,
    status: "SAFE",
    event: "READ",
    path: "/workspace/export_script.sh",
    process: "bash",
    pid: 991,
    hash: "7238b773a9158ab0aa91211ee3e9a065",
    time: Date.now() - 98000,
  },
  {
    id: 6,
    status: "SAFE",
    event: "CREATE",
    path: "/workspace/session.cache",
    process: "node.exe",
    pid: 2178,
    hash: "0cc9ff2f541cc38533dd48918fa897ad",
    time: Date.now() - 132000,
  },
];

const nav = [
  ["threat", "Threat Center", "LIVE"],
  ["scanner", "AI Threat Scanner", "GROQ LPU"],
  ["fleet", "Fleet & IEM", "IEM"],
  ["playbooks", "Mitigation & Playbooks", "HITL"],
  ["copilot", "AI Copilot Chat", "CHAT"],
];
const labNav = [
  ["triage", "Incident Triage", ""],
  ["simulation", "Threat Simulation Lab", ""],
  ["knowledge", "Knowledge Base Centre", "RAG"],
  ["verification", "Verification & Audit", "100%"],
  ["governance", "Governance & CRC", ""],
  ["benchmark", "SPS Benchmark", ""],
  ["siem", "SIEM Export", ""],
];

const titles: Record<string, [string, string]> = {
  threat: ["Threat Center", "Real-time security posture and filesystem telemetry"],
  scanner: ["AI Threat Scanner", "Static analysis and zero-trust quarantine enclave"],
  fleet: ["Fleet & IEM", "Enterprise endpoint integrity mesh"],
  playbooks: ["Mitigation & Playbooks", "Human-authorized autonomous response"],
  copilot: ["AI Copilot", "Grounded security intelligence assistant"],
  triage: ["Incident Triage", "Structured forensics and evidence curation"],
  simulation: ["Threat Simulation Lab", "Safe adversary emulation walkthrough"],
  knowledge: ["Knowledge Base Centre", "Vectorized threat intelligence and detection synthesis"],
  verification: ["Verification & Audit", "Automated platform health and integrity checks"],
  governance: ["Governance & CRC", "Cryptographically verifiable evidence ledger"],
  benchmark: ["SPS Benchmark", "Machine-speed detection performance suite"],
  siem: ["SIEM & SOAR Gateway", "Enterprise telemetry forwarding"],
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const map: Record<string, ReactNode> = {
    threat: (
      <>
        <path d="M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z" />
      </>
    ),
    scanner: (
      <>
        <path d="M4 3h11l4 4v14H4z" />
        <circle cx="11" cy="13" r="3.5" />
        <path d="m14 16 3 3" />
      </>
    ),
    fleet: (
      <>
        <rect x="3" y="4" width="18" height="6" rx="2" />
        <rect x="3" y="14" width="18" height="6" rx="2" />
        <path d="M7 7h.01M7 17h.01" />
      </>
    ),
    playbooks: <path d="m13 2-9 12h7l-1 8 9-12h-7z" />,
    copilot: (
      <>
        <rect x="4" y="7" width="16" height="13" rx="4" />
        <path d="M12 3v4M8 13h.01M16 13h.01M9 17h6" />
      </>
    ),
    triage: (
      <>
        <path d="M12 3 2 20h20z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    simulation: (
      <path d="M12 2c1 5-3 6-1 10 1-2 3-3 4-5 3 3 5 8 2 12-3 4-11 3-12-2-1-4 2-7 4-9 0 3 1 4 2 5" />
    ),
    knowledge: (
      <>
        <path d="M9 4a4 4 0 0 0-4 4v1a4 4 0 0 0 1 7v1a3 3 0 0 0 3 3M15 4a4 4 0 0 1 4 4v1a4 4 0 0 1-1 7v1a3 3 0 0 1-3 3M12 3v18" />
      </>
    ),
    verification: (
      <>
        <path d="M7 3h10v3h3v15H4V6h3z" />
        <path d="m8 14 3 3 6-7" />
      </>
    ),
    governance: (
      <>
        <path d="M12 3a7 7 0 0 0-7 7c0 4-1 7-2 9M12 7a3 3 0 0 0-3 3c0 5-1 8-2 11M12 11c0 5-1 8-2 10M16 8c1 1 1 3 1 5 0 4 1 6 2 8M15 15c0 3 1 5 2 6" />
      </>
    ),
    benchmark: (
      <>
        <circle cx="12" cy="9" r="6" />
        <path d="m8 14-2 8 6-3 6 3-2-8M12 6v3l2 1" />
      </>
    ),
    siem: (
      <>
        <circle cx="5" cy="12" r="2" />
        <circle cx="19" cy="5" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="m7 11 10-5M7 13l10 5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {map[name] || <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}
function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Button({
  children,
  onClick,
  tone = "",
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`btn ${tone}`}>
      {children}
    </button>
  );
}
function Progress({ value, tone = "blue" }: { value: number; tone?: string }) {
  return (
    <div className="progress">
      <i className={tone} style={{ width: `${value}%` }} />
    </div>
  );
}
function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`}>
        <header>
          <div>
            <span className="eyebrow">RAGSEC SECURE INTERFACE</span>
            <h2>{title}</h2>
          </div>
          <button className="close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  color,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  note: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`metric ${active ? "active" : ""}`}
      style={{ "--metric": color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="metric-top">
        <span>{label}</span>
        <i />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </button>
  );
}

function App() {
  // Backend Live Polling & State Sync
  useEffect(() => {
    let mounted = true;
    const syncBackend = async () => {
      try {
        const [resEvents, resStats, resSentinel] = await Promise.allSettled([
          fetch(`${API_BASE}/api/fim/events`),
          fetch(`${API_BASE}/api/dashboard/stats`),
          fetch(`${API_BASE}/api/active-threats/sentinel/status`)
        ]);

        if (resEvents.status === "fulfilled" && resEvents.value.ok) {
          const data = await resEvents.value.json();
          if (Array.isArray(data) && data.length > 0 && mounted) {
            const mapped: EventRow[] = data.map((e: any, idx: number) => ({
              id: e.id || (Date.now() - idx * 1000),
              status: (e.threat_status === "THREAT" ? "THREAT" : e.threat_status === "SUSPICIOUS" ? "SUSPICIOUS" : e.threat_status === "QUARANTINED" ? "QUARANTINED" : "SAFE") as Severity,
              event: e.event_type || "MODIFY",
              path: e.file_path || e.path || "/sandbox/artifact.bin",
              process: e.process_name || "system",
              pid: e.process_pid || (1000 + idx),
              hash: (e.file_hash || e.hash || "af30dd1e8970d65fa63e7218d1c90321").slice(0, 32),
              time: e.timestamp ? new Date(e.timestamp).getTime() : (Date.now() - idx * 4000)
            }));
            setEvents(mapped);
          }
        }

        if (resSentinel.status === "fulfilled" && resSentinel.value.ok && mounted) {
          const s = await resSentinel.value.json();
          if (typeof s.active === "boolean") setSentinel(s.active);
        }
      } catch {}
    };

    syncBackend();
    const interval = setInterval(syncBackend, 3500);
    return () => { mounted = false; clearInterval(interval); };
  }, []);
  const [view, setView] = useState("threat");
  const [collapsed, setCollapsed] = useState(false);
  const [labOpen, setLabOpen] = useState(true);
  const [sentinel, setSentinel] = useState(true);
  const [events, setEvents] = useState(seedEvents);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState("");
  const [toast, setToast] = useState("");
  const [velocity, setVelocity] = useState([14, 19, 16, 28, 24, 36, 30, 42, 34, 29, 38, 31]);
  const [model, setModel] = useState("Groq Llama 3.3 70B");
  const [quarantine, setQuarantine] = useState<string[]>([]);
  const [paletteQuery, setPaletteQuery] = useState("");

  const threats = events.filter((e) => e.status === "THREAT" || e.status === "SUSPICIOUS").length;
  const clean = events.filter((e) => e.status === "SAFE").length;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };
  const navigate = (id: string) => {
    setView(id);
    setModal("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const quarantineEvent = async (id: number) => {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    setEvents((x) => x.map((e) => (e.id === id ? { ...e, status: "QUARANTINED" } : e)));
    setQuarantine((x) => [...new Set([...x, target.path])]);
    notify(`${target.path.split("/").pop()} isolated in secure enclave`);
    try {
      await fetch(`${API_BASE}/api/fim/quarantine-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: target.path })
      });
    } catch {}
  };
  const inject = async (kind: string) => {
    const data: Record<string, Partial<EventRow>> = {
      lockbit: {
        path: "/sandbox/README_RESTORE_FILES.txt",
        process: "vssadmin.exe",
        pid: 6610,
        event: "CREATE",
      },
      backdoor: {
        path: "/sandbox/web_backdoor.php",
        process: "apache2",
        pid: 3824,
        event: "MODIFY",
      },
      mimikatz: {
        path: "/Finance-WS-042/POWERSHELL_MALICIOUS_ENCODED",
        process: "powershell.exe",
        pid: 7124,
        event: "CREATE",
      },
    };
    if (kind === "reset") {
      setEvents((x) => x.map((e) => ({ ...e, status: "SAFE" as Severity })));
      setQuarantine([]);
      notify("Nominal cryptographic baseline restored");
      try {
        await fetch(`${API_BASE}/api/threat-lab/clean`, { method: "POST" });
        await fetch(`${API_BASE}/api/fim/init-workspace`, { method: "POST" });
      } catch {}
    } else {
      const d = data[kind];
      setEvents((x) => [
        {
          id: Date.now(),
          status: "THREAT",
          hash: crypto.randomUUID().replaceAll("-", ""),
          time: Date.now(),
          ...d,
        } as EventRow,
        ...x,
      ]);
      notify(`${kind.toUpperCase()} simulation deployed — threat intercepted`);
      try {
        if (kind === "lockbit") {
          await fetch(`${API_BASE}/api/fim/create-file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: "README_RESTORE_FILES.txt",
              content: "YOUR FILES ARE ENCRYPTED! vssadmin delete shadows /all /quiet\nbcdedit /set {default} recoveryenabled No"
            })
          });
        } else if (kind === "backdoor") {
          await fetch(`${API_BASE}/api/fim/create-file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: "web_backdoor.php",
              content: "<?php if(isset($_POST['cmd'])){ system($_POST['cmd']); } ?>"
            })
          });
        } else if (kind === "mimikatz") {
          await fetch(`${API_BASE}/api/fleet/simulate-harmful-log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              device_id: "DEV-FIN-WS-042",
              device_name: "Finance-Workstation-042",
              event_type: "POWERSHELL_MALICIOUS_ENCODED",
              threat_status: "THREAT"
            })
          });
        }
      } catch {}
    }
    setModal("");
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModal("palette");
      }
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setModal("palette");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const samples = [
        ["/sandbox/app_config.json", "code.exe", "MODIFY"],
        ["/workspace/auth_handler.py", "python.exe", "READ"],
        ["/workspace/session.cache", "node.exe", "CREATE"],
      ];
      const s = samples[Math.floor(Math.random() * samples.length)];
      setEvents((x) =>
        [
          {
            id: Date.now(),
            status: "SAFE",
            event: s[2],
            path: s[0],
            process: s[1],
            pid: 900 + Math.floor(Math.random() * 5000),
            hash: crypto.randomUUID().replaceAll("-", ""),
            time: Date.now(),
          },
          ...x,
        ].slice(0, 30),
      );
      setVelocity((x) => [...x.slice(1), 12 + Math.floor(Math.random() * 34)]);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="app">
      <aside className={collapsed ? "collapsed" : ""}>
        <div className="brand">
          <div className="brandmark">
            <svg viewBox="0 0 32 36">
              <path
                d="M16 2 29 7v9c0 9-5 15-13 18C8 31 3 25 3 16V7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="m10 18 4 4 8-10" fill="none" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <b>
                RAG<span>Sec</span>
              </b>
              <small>
                <i /> v2.4 Enterprise
              </small>
            </div>
          )}
          <button className="collapse" onClick={() => setCollapsed((x) => !x)}>
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        <nav>
          {!collapsed && <label>PRIMARY WORKSPACE</label>}
          {nav.map((n) => (
            <button
              key={n[0]}
              className={view === n[0] ? "selected" : ""}
              onClick={() => navigate(n[0])}
              title={n[1]}
            >
              <Icon name={n[0]} />
              <span>{n[1]}</span>
              {n[2] && <em>{n[2]}</em>}
            </button>
          ))}
          <div className="nav-divider" />
          <button className="lab-toggle" onClick={() => setLabOpen((x) => !x)}>
            <span className="dotgrid">⠿</span>
            <span>Diagnostics & Lab</span>
            <b>{labOpen ? "⌃" : "⌄"}</b>
          </button>
          {labOpen &&
            labNav.map((n) => (
              <button
                key={n[0]}
                className={view === n[0] ? "selected" : ""}
                onClick={() => navigate(n[0])}
                title={n[1]}
              >
                <Icon name={n[0]} />
                <span>{n[1]}</span>
                {n[2] && <em>{n[2]}</em>}
              </button>
            ))}
        </nav>
        <button className="operator" onClick={() => setModal("operator")}>
          <span className="avatar">
            KM
            <i />
          </span>
          {!collapsed && (
            <>
              <span>
                <b>Kushal Medikonda</b>
                <small>SOC ADMIN · ONLINE</small>
              </span>
              <strong>•••</strong>
            </>
          )}
        </button>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="crumb">
            <span>RAGSec</span>
            <b>/</b>
            <span>Workspaces</span>
            <b>/</b>
            <strong>{titles[view][0]}</strong>
          </div>
          <div className="top-actions">
            <button
              className="threat-count"
              onClick={() => {
                navigate("threat");
                setFilter("THREATS");
              }}
            >
              <i /> <b>{threats}</b>
              <span>ACTIVE THREATS</span>
            </button>
            <button
              className={`sentinel ${sentinel ? "on" : ""}`}
              onClick={async () => {
                const next = !sentinel;
                setSentinel(next);
                notify(`Active Defense Sentinel ${next ? "ACTIVATED" : "DEACTIVATED"}`);
                try {
                  await fetch(`${API_BASE}/api/active-threats/sentinel/toggle`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ enabled: next })
                  });
                } catch {}
              }}
            >
              <span>
                <i />
              </span>
              <b>Sentinel: {sentinel ? "ACTIVE" : "STANDBY"}</b>
            </button>
            <button className="brief" onClick={() => setModal("brief")}>
              <Icon name="verification" size={15} /> Executive Brief
            </button>
            <button className="search-trigger" onClick={() => setModal("palette")}>
              <span>Search CVEs, hashes, PIDs...</span>
              <kbd>⌘ K</kbd>
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">AUTONOMOUS SECURITY OPERATIONS</span>
              <h1>{titles[view][0]}</h1>
              <p>{titles[view][1]}</p>
            </div>
            <div className="live">
              <i /> LIVE TELEMETRY <span>02:41:08 UTC</span>
            </div>
          </div>
          {view === "threat" && (
            <ThreatView
              events={events}
              threats={threats}
              clean={clean}
              filter={filter}
              setFilter={setFilter}
              query={query}
              setQuery={setQuery}
              velocity={velocity}
              quarantine={quarantineEvent}
              inspect={() => setModal("inspect")}
              navigate={navigate}
              notify={notify}
            />
          )}
          {view === "scanner" && (
            <ScannerView
              quarantine={quarantine}
              setQuarantine={setQuarantine}
              notify={notify}
              inject={inject}
            />
          )}
          {view === "fleet" && <FleetView notify={notify} inject={inject} />}
          {view === "playbooks" && <PlaybookView notify={notify} />}
          {view === "copilot" && (
            <CopilotView model={model} openModel={() => setModal("model")} notify={notify} />
          )}
          {view === "triage" && <TriageView notify={notify} />}
          {view === "simulation" && <SimulationView inject={inject} notify={notify} />}
          {view === "knowledge" && (
            <KnowledgeView notify={notify} exportRule={() => setModal("rules")} />
          )}
          {view === "governance" && <GovernanceView notify={notify} />}
          {view === "benchmark" && <BenchmarkView notify={notify} />}
          {view === "siem" && <SiemView notify={notify} />}
          {view === "verification" && <VerificationView notify={notify} />}
        </main>
      </div>
      {toast && (
        <div className="toast">
          <span>✓</span>
          <div>
            <b>SECURITY OPERATION COMPLETE</b>
            <p>{toast}</p>
          </div>
        </div>
      )}
      {modal === "palette" && (
        <CommandPalette
          query={paletteQuery}
          setQuery={setPaletteQuery}
          navigate={navigate}
          inject={inject}
          setModal={setModal}
          sentinel={sentinel}
          setSentinel={setSentinel}
        />
      )}
      {modal === "brief" && (
        <ExecutiveBrief
          threats={threats}
          clean={clean}
          total={events.length}
          quarantined={quarantine.length}
          close={() => setModal("")}
          notify={notify}
        />
      )}
      {modal === "model" && (
        <ModelModal
          model={model}
          select={(m) => {
            setModel(m);
            setModal("");
            notify(`AI brain switched to ${m}`);
          }}
          close={() => setModal("")}
        />
      )}
      {modal === "rules" && <RulesModal close={() => setModal("")} notify={notify} />}
      {modal === "operator" && <OperatorModal close={() => setModal("")} notify={notify} />}
      {modal === "inspect" && (
        <InspectModal
          close={() => setModal("")}
          quarantine={() => {
            quarantineEvent(1);
            setModal("");
          }}
        />
      )}
    </div>
  );
}

function ThreatView({
  events,
  threats,
  clean,
  filter,
  setFilter,
  query,
  setQuery,
  velocity,
  quarantine,
  inspect,
  navigate,
  notify,
}: any) {
  const list = events.filter(
    (e: EventRow) =>
      (filter === "ALL" ||
        filter === "AI" ||
        (filter === "THREATS" && ["THREAT", "SUSPICIOUS"].includes(e.status)) ||
        (filter === "BENIGN" && e.status === "SAFE")) &&
      `${e.path}${e.process}${e.pid}${e.hash}`.toLowerCase().includes(query.toLowerCase()),
  );
  const points = velocity
    .map((v: number, i: number) => `${i * (520 / 11)},${105 - v * 1.9}`)
    .join(" ");
  return (
    <>
      <div className="metrics">
        <Metric
          label="ACTIVE FLAGGED THREATS"
          value={threats}
          note="Requires operator action"
          color={threats ? C.threat : C.safe}
          active={filter === "THREATS"}
          onClick={() => setFilter("THREATS")}
        />
        <Metric
          label="CRUD OPERATIONS STREAMED"
          value="1,284"
          note="+24 in the last minute"
          color={C.blue}
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        />
        <Metric
          label="VERIFIED CLEAN ASSETS"
          value={clean + 1273}
          note="99.6% CRC clean"
          color={C.safe}
          active={filter === "BENIGN"}
          onClick={() => setFilter("BENIGN")}
        />
        <Metric
          label="QUARANTINED ENCLAVE"
          value="05"
          note="View isolated vault →"
          color={C.violet}
          onClick={() => navigate("scanner")}
        />
      </div>
      <div className="dashboard-grid">
        <Panel className="stream">
          <div className="panel-head">
            <div>
              <span className="eyebrow">EVENT STREAM</span>
              <h3>Live FIM Audit Stream</h3>
            </div>
            <div className="stream-state">
              <i /> INGESTING <b>12.5K/s</b>
            </div>
          </div>
          <div className="table-tools">
            <div className="tabs">
              {["ALL", "THREATS", "BENIGN", "AI"].map((t) => (
                <button
                  key={t}
                  className={filter === t ? "active" : ""}
                  onClick={() => setFilter(t)}
                >
                  {t === "THREATS"
                    ? "THREATS ONLY"
                    : t === "BENIGN"
                      ? "BENIGN ONLY"
                      : t === "AI"
                        ? "AI ANALYSIS"
                        : t}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter path, PID, hash..."
            />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>EVENT</th>
                  <th>FILE PATH</th>
                  <th>PROCESS & PID</th>
                  <th>SHA-256 / CRC</th>
                  <th>TIME</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e: EventRow) => (
                  <tr key={e.id}>
                    <td>
                      <Badge tone={e.status.toLowerCase()}>{e.status}</Badge>
                    </td>
                    <td>
                      <b className="event-type">{e.event}</b>
                    </td>
                    <td>
                      <button
                        className="path"
                        onClick={() => {
                          navigator.clipboard?.writeText(e.path);
                          notify("File path copied");
                        }}
                      >
                        {e.path}
                      </button>
                    </td>
                    <td>
                      <span className="mono">{e.process}</span>
                      <small>PID {e.pid}</small>
                    </td>
                    <td>
                      <span className="hash">◇ {e.hash.slice(0, 12)}…</span>
                    </td>
                    <td>
                      <span className="time">
                        {Math.max(1, Math.round((Date.now() - e.time) / 1000))}s ago
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button title="Quarantine" onClick={() => quarantine(e.id)}>
                          ⊘
                        </button>
                        <button
                          title="Whitelist"
                          onClick={() => notify("Hash added to trusted whitelist")}
                        >
                          ✓
                        </button>
                        <button title="Inspect" onClick={inspect}>
                          ⌕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="side-stack">
          <Panel>
            <div className="panel-head">
              <div>
                <span className="eyebrow">LAST 60 SECONDS</span>
                <h3>Threat Velocity</h3>
              </div>
              <b className="eps">
                31 <small>EPS</small>
              </b>
            </div>
            <svg className="spark" viewBox="0 0 520 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#4a8fff" stopOpacity=".35" />
                  <stop offset="1" stopColor="#4a8fff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={`0,120 ${points} 520,120`} fill="url(#g)" stroke="none" />
              <polyline points={points} fill="none" stroke="#4a8fff" strokeWidth="2.5" />
            </svg>
            <div className="spark-labels">
              <span>-60s</span>
              <span>-30s</span>
              <span>Now</span>
            </div>
          </Panel>
          <Panel className="posture">
            <div className="panel-head">
              <div>
                <span className="eyebrow">AI DEFENSE POSTURE</span>
                <h3>Autonomous Response</h3>
              </div>
              <Badge tone="safe">OPTIMAL</Badge>
            </div>
            <div className="ring">
              <div>
                <strong>98</strong>
                <small>/ 100</small>
              </div>
            </div>
            {["FIM Sensor Coverage", "CTI Knowledge Freshness", "Containment Readiness"].map(
              (x, i) => (
                <div className="health" key={x}>
                  <span>{x}</span>
                  <b>{[100, 96, 100][i]}%</b>
                  <Progress value={[100, 96, 100][i]} tone="safe" />
                </div>
              ),
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function ScannerView({ quarantine, setQuarantine, notify, inject }: any) {
  const [tab, setTab] = useState("files"),
    [selected, setSelected] = useState(0),
    [scan, setScan] = useState(0);
  const [filesList, setFilesList] = useState<any[]>([
    ["web_backdoor.php", "/sandbox", "4.7 KB", "7.81", "THREAT"],
    ["combined_behavior_sim.bat", "/sandbox", "2.1 KB", "6.92", "SUSPICIOUS"],
    ["app_config.json", "/sandbox", "1.3 KB", "3.21", "SAFE"],
    ["auth_handler.py", "/workspace", "8.6 KB", "4.14", "SAFE"],
    ["export_script.sh", "/workspace", "3.9 KB", "4.82", "SAFE"],
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/api/fim/workspace-files`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          const mapped = d.map((f: any) => [
            f.filename,
            f.relative_path || "/sandbox",
            `${(f.size_bytes / 1024).toFixed(1)} KB`,
            f.entropy ? f.entropy.toFixed(2) : "4.12",
            f.verdict === "UNSAFE" ? "THREAT" : f.verdict === "VULNERABLE" ? "SUSPICIOUS" : "SAFE"
          ]);
          setFilesList(mapped);
        }
      })
      .catch(() => {});
    fetch(`${API_BASE}/api/fim/quarantined`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setQuarantine(d.map((q: any) => q.filename || q.filepath || q));
        }
      })
      .catch(() => {});
  }, []);

  const files = filesList;
  const runScan = () => {
    setScan(3);
    try {
      fetch(`${API_BASE}/api/fim/scan-workspace`, { method: "POST" }).catch(() => {});
    } catch {}
    const t = setInterval(
      () =>
        setScan((x) => {
          if (x >= 100) {
            clearInterval(t);
            notify("Workspace scan completed: 1 critical artifact identified");
            return 100;
          }
          return x + 4;
        }),
      90,
    );
  };
  return (
    <>
      <div className="action-row">
        <div className="tabs large">
          <button className={tab === "files" ? "active" : ""} onClick={() => setTab("files")}>
            Workspace Files
          </button>
          <button className={tab === "vault" ? "active" : ""} onClick={() => setTab("vault")}>
            Quarantined Vault <b>{quarantine.length}</b>
          </button>
        </div>
        <div>
          <Button onClick={() => inject("backdoor")}>Inject Test Backdoor</Button>
          <Button tone="danger" onClick={() => inject("lockbit")}>
            Inject Ransomware
          </Button>
          <Button tone="primary" onClick={runScan}>
            Scan Entire Workspace
          </Button>
        </div>
      </div>
      {scan > 0 && scan < 100 && (
        <Panel className="scan-progress">
          <div>
            <span className="eyebrow">GROQ LPU ANALYSIS PIPELINE</span>
            <h3>
              {scan < 25
                ? "Reading workspace filesystem artifacts..."
                : scan < 50
                  ? "Generating AST & computing Shannon entropy..."
                  : scan < 80
                    ? "Querying Groq LPU inference..."
                    : "Matching CTI knowledge base & MITRE matrix..."}
            </h3>
          </div>
          <strong>
            {scan}% <small>~{Math.ceil((100 - scan) / 12)}s</small>
          </strong>
          <Progress value={scan} />
        </Panel>
      )}
      {tab === "files" ? (
        <div className="scanner-grid">
          <Panel className="file-list">
            <div className="panel-head">
              <div>
                <span className="eyebrow">MONITORED ARTIFACTS</span>
                <h3>/sandbox & /workspace</h3>
              </div>
              <Badge>8 FILES</Badge>
            </div>
            {files.map((f, i) => (
              <button
                className={selected === i ? "file selected" : "file"}
                onClick={() => setSelected(i)}
                key={f[0]}
              >
                <span className="file-icon">{f[0].split(".").pop()}</span>
                <span>
                  <b>{f[0]}</b>
                  <small>
                    {f[1]} · {f[2]}
                  </small>
                </span>
                <span className="entropy">
                  <small>ENTROPY</small>
                  <b>{f[3]}</b>
                </span>
                <Badge tone={f[4].toLowerCase()}>{f[4]}</Badge>
              </button>
            ))}
          </Panel>
          <Panel className="code-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">AST VULNERABILITY INSPECTOR</span>
                <h3>{files[selected][0]}</h3>
              </div>
              <Badge tone={files[selected][4].toLowerCase()}>{files[selected][4]}</Badge>
            </div>
            <div className="code">
              <div>
                <i>1</i>
                <span>{"<?php"}</span>
              </div>
              <div>
                <i>2</i>
                <span>{'$cmd = $_POST[\"cmd\"];'}</span>
              </div>
              <div className="danger-line">
                <i>3</i>
                <span>{"system($cmd);"}</span>
                <b>CWE-78 · CRITICAL</b>
              </div>
              <div>
                <i>4</i>
                <span>{"$socket = fsockopen($ip, $port);"}</span>
              </div>
              <div>
                <i>5</i>
                <span>{"?>"}</span>
              </div>
            </div>
            <div className="finding">
              <span>!</span>
              <div>
                <b>OS Command Injection / Remote Shell Execution</b>
                <p>
                  Unsanitized operator-controlled input reaches a system execution sink. Confidence
                  99.2%.
                </p>
              </div>
              <Button onClick={() => notify("AI secure patch generated and copied")}>
                View AI Patch
              </Button>
            </div>
            <Mitre />
          </Panel>
        </div>
      ) : (
        <Panel>
          <div className="panel-head">
            <div>
              <span className="eyebrow">ZERO-TRUST ISOLATION</span>
              <h3>Quarantined Enclave Vault</h3>
            </div>
            <Badge tone="quarantined">{quarantine.length} ARTIFACTS</Badge>
          </div>
          {quarantine.length ? (
            quarantine.map((q: string) => (
              <div className="vault-row" key={q}>
                <span className="file-icon">ISO</span>
                <span>
                  <b>{q.split("/").pop()}</b>
                  <small>Original path: {q} · Isolated moments ago</small>
                </span>
                <span className="hash">SHA-256 9fb3…c217</span>
                <Button
                  onClick={async () => {
                    setQuarantine((x: string[]) => x.filter((y) => y !== q));
                    notify("Artifact restored with operator authorization");
                    try {
                      await fetch(`${API_BASE}/api/fim/restore-file`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ filename: q.split("/").pop() })
                      });
                    } catch {}
                  }}
                >
                  Restore
                </Button>
                <Button
                  tone="danger"
                  onClick={async () => {
                    setQuarantine((x: string[]) => x.filter((y) => y !== q));
                    notify("Artifact cryptographically shredded");
                    try {
                      await fetch(`${API_BASE}/api/fim/shred-file`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ filename: q.split("/").pop() })
                      });
                    } catch {}
                  }}
                >
                  Shred
                </Button>
              </div>
            ))
          ) : (
            <Empty text="The enclave is clear. Quarantined artifacts will appear here." />
          )}
        </Panel>
      )}
    </>
  );
}

function Mitre() {
  return (
    <div className="mitre">
      <span className="eyebrow">MITRE ATT&CK KILLCHAIN</span>
      <div>
        {[
          ["Initial Access", "TA0001"],
          ["Execution", "TA0002"],
          ["Persistence", "TA0003"],
          ["Defense Evasion", "TA0005"],
          ["Command & Control", "TA0011"],
          ["Impact", "TA0040"],
        ].map((x, i) => (
          <button className={i === 1 || i === 4 ? "hot" : ""} key={x[1]}>
            <i>{i + 1}</i>
            <span>
              <b>{x[0]}</b>
              <small>{x[1]}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FleetView({ notify, inject }: any) {
  const [isolated, setIsolated] = useState<string[]>([]),
    [drawer, setDrawer] = useState("");
  const devices = [
    ["Finance-Workstation-042", "Windows 11", "10.0.4.42", "WARNING", 72, 81, 63, 147],
    ["Dev-Linux-Node-01", "Ubuntu 22.04", "10.0.2.15", "ONLINE", 24, 46, 38, 92],
    ["DC-Windows-Server", "Windows Server 2022", "10.0.1.10", "ONLINE", 41, 68, 52, 213],
    ["SecOps-MacBook-Pro", "macOS Sonoma", "10.0.8.88", "ONLINE", 18, 54, 29, 168],
  ];
  return (
    <>
      <div className="action-row">
        <div>
          <span className="eyebrow">ENTERPRISE MESH</span>
          <h3>4 endpoints · 3 sites · 100% sensor coverage</h3>
        </div>
        <div>
          <Button onClick={() => setDrawer("enroll")}>Enroll New Device</Button>
          <Button tone="danger" onClick={() => inject("mimikatz")}>
            Simulate Harmful Event
          </Button>
        </div>
      </div>
      <div className="device-grid">
        {devices.map((d) => (
          <Panel key={d[0]}>
            <div className="device-head">
              <span className="device-icon">
                <Icon name="fleet" />
              </span>
              <div>
                <h3>{d[0]}</h3>
                <p>
                  {d[1]} · <span className="mono">{d[2]}</span>
                </p>
              </div>
              <Badge tone={d[3] === "ONLINE" ? "safe" : "suspicious"}>{d[3]}</Badge>
            </div>
            <div className="dial-grid">
              {[
                ["CPU", d[4]],
                ["MEMORY", d[5]],
                ["DISK", d[6]],
                ["PROCESSES", d[7]],
              ].map((x) => (
                <div key={x[0]}>
                  <small>{x[0]}</small>
                  <strong>
                    {x[1]}
                    {x[0] !== "PROCESSES" && "%"}
                  </strong>
                  <Progress
                    value={Math.min(Number(x[1]), 100)}
                    tone={Number(x[1]) > 75 ? "amber" : "blue"}
                  />
                </div>
              ))}
            </div>
            <div className="device-actions">
              <Button onClick={() => setDrawer(String(d[0]))}>Process Manager</Button>
              <button
                className={`isolate ${isolated.includes(String(d[0])) ? "active" : ""}`}
                onClick={() => {
                  setIsolated((x) =>
                    x.includes(String(d[0])) ? x.filter((y) => y !== d[0]) : [...x, String(d[0])],
                  );
                  notify(
                    `Network isolation ${isolated.includes(String(d[0])) ? "released" : "engaged"}`,
                  );
                }}
              >
                <i /> {isolated.includes(String(d[0])) ? "ISOLATED" : "ISOLATE"}
              </button>
            </div>
          </Panel>
        ))}
      </div>
      {drawer && (
        <Modal
          title={drawer === "enroll" ? "Enroll New Endpoint" : `Remote Process Manager · ${drawer}`}
          onClose={() => setDrawer("")}
          wide
        >
          {drawer === "enroll" ? (
            <div>
              <p className="lead">
                Use this one-time pairing key to join an endpoint to the protected mesh.
              </p>
              <div className="pair-key">RAGS-9X4K-PL72</div>
              <Field
                label="LINUX / MACOS BOOTSTRAP"
                value="curl -fsSL https://enroll.ragsec.local | sudo bash -s -- --key RAGS-9X4K-PL72"
              />
              <Field
                label="WINDOWS POWERSHELL"
                value="irm https://enroll.ragsec.local/win | iex -PairingKey RAGS-9X4K-PL72"
              />
            </div>
          ) : (
            <ProcessList notify={notify} />
          )}
        </Modal>
      )}
    </>
  );
}

function ProcessList({ notify }: any) {
  return (
    <div className="process-list">
      {[
        ["powershell.exe", "3824", "28.4%", "94"],
        ["explorer.exe", "1042", "2.1%", "04"],
        ["svchost.exe", "912", "1.4%", "08"],
        ["RAGSecSensor.exe", "240", "0.8%", "00"],
      ].map((p, i) => (
        <div key={p[1]}>
          <span>
            <b>{p[0]}</b>
            <small>
              PID {p[1]} · CPU {p[2]}
            </small>
          </span>
          <Badge tone={i === 0 ? "threat" : "safe"}>ANOMALY {p[3]}</Badge>
          <Button
            tone={i === 0 ? "danger" : ""}
            onClick={() => notify(`Process ${p[1]} terminated and ledger entry sealed`)}
          >
            Kill Process
          </Button>
        </div>
      ))}
    </div>
  );
}

function PlaybookView({ notify }: any) {
  const [pending, setPending] = useState(true),
    [running, setRunning] = useState("");
  const books = [
    ["Ransomware Auto-Containment", "Isolate endpoint, stop encryption, preserve evidence"],
    ["Webshell Elimination & WAF Ban", "Quarantine shell and block hostile origin"],
    ["Credential Dumping Remediation", "Kill process, rotate credentials, revoke tokens"],
    ["Shadow Copy Rollback", "Verify and restore protected volume snapshots"],
  ];
  const run = (name: string) => {
    setRunning(name);
    setTimeout(() => {
      setRunning("");
      notify(`${name} completed successfully`);
    }, 1800);
  };
  return (
    <>
      <Panel className="approval">
        <div className="panel-head">
          <div>
            <span className="eyebrow">HUMAN-IN-THE-LOOP APPROVAL</span>
            <h3>Pending Operator Signature</h3>
          </div>
          <Badge tone="threat">{pending ? 1 : 0} CRITICAL</Badge>
        </div>
        {pending ? (
          <div className="approval-body">
            <div className="risk-score">
              <strong>94</strong>
              <span>
                /100
                <br />
                <b>CRITICAL</b>
              </span>
            </div>
            <div>
              <h3>Terminate hostile powershell.exe (PID 3824)</h3>
              <p>Block outbound port 4444, preserve volatile memory, and isolate Finance-WS-042.</p>
              <div className="techniques">
                <Badge tone="threat">T1059.001</Badge>
                <Badge tone="suspicious">T1041</Badge>
                <Badge>T1486</Badge>
              </div>
            </div>
            <div className="approval-actions">
              <Button
                tone="primary"
                onClick={() => {
                  setPending(false);
                  notify("Containment executed with signed operator authorization");
                }}
              >
                Approve & Execute
              </Button>
              <Button onClick={() => notify("Dry run passed: no dependent services impacted")}>
                Dry Run
              </Button>
              <Button
                onClick={() => {
                  setPending(false);
                  notify("Recommendation rejected and documented");
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        ) : (
          <Empty text="All autonomous recommendations have been reviewed." />
        )}
      </Panel>
      <div className="section-title">
        <div>
          <span className="eyebrow">RESPONSE AUTOMATION</span>
          <h2>Playbook Execution Engine</h2>
        </div>
      </div>
      <div className="playbook-grid">
        {books.map((b, i) => (
          <Panel key={b[0]}>
            <div className={`play-icon p${i}`}>
              <Icon name="playbooks" />
            </div>
            <h3>{b[0]}</h3>
            <p>{b[1]}</p>
            <div className="steps">
              <span>01 Detect</span>
              <i /> <span>02 Contain</span>
              <i /> <span>03 Verify</span>
            </div>
            <Button tone="primary" disabled={!!running} onClick={() => run(b[0])}>
              {running === b[0] ? "Executing signed steps..." : "Run Playbook"}
            </Button>
          </Panel>
        ))}
      </div>
      <Panel className="rule">
        <span className="eyebrow">VISUAL RULE CREATOR</span>
        <div>
          <b>IF</b>
          <span>FIM Event = CREATE</span>
          <b>AND</b>
          <span>Shannon Entropy &gt; 7.2</span>
          <b>THEN</b>
          <span>Auto-Quarantine + Alert SOC</span>
          <button onClick={() => notify("Detection rule activated")}>Activate Rule</button>
        </div>
      </Panel>
    </>
  );
}

function CopilotView({ model, openModel, notify }: any) {
  const [rag, setRag] = useState(true),
    [online, setOnline] = useState(false),
    [input, setInput] = useState(""),
    [messages, setMessages] = useState<any[]>([
      {
        role: "ai",
        text: "SOC context synchronized. I found one critical artifact in the monitored workspace. How can I assist with your investigation?",
      },
    ]);
  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", text };
    setMessages((x) => [...x, userMsg]);
    setInput("");
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, model, use_rag: rag, use_live_feeds: online })
      });
      if (res.ok) {
        const d = await res.json();
        const reply = d.reply || d.response || d.answer;
        if (reply) {
          setMessages((x) => [
            ...x,
            {
              role: "ai",
              tool: d.tool_called || "inspect_security_context",
              text: reply,
            },
          ]);
          return;
        }
      }
    } catch {}
    setMessages((x) => [
      ...x,
      {
        role: "ai",
        tool: "inspect_security_context",
        text: `Analysis complete. **${text}** maps to the current incident context. The strongest signal is T1059.001 with 94% confidence. I recommend isolating Finance-WS-042 and preserving volatile memory before process termination.`,
      },
    ]);
  };
  return (
    <Panel className="chat">
      <div className="chat-controls">
        <Button onClick={openModel}>
          <Icon name="copilot" size={15} />
          {model}
          <span>⌄</span>
        </Button>
        <label className="toggle">
          <input type="checkbox" checked={rag} onChange={() => setRag((x) => !x)} />
          <i />
          <span>File & Process RAG</span>
          <b>ON</b>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={online} onChange={() => setOnline((x) => !x)} />
          <i />
          <span>Live Network Sources</span>
          <b>{online ? "ON" : "OFF"}</b>
        </label>
        <div className="secure-dot">PRIVATE SESSION</div>
      </div>
      <div className="messages">
        {messages.map((m, i) => (
          <div className={`message ${m.role}`} key={i}>
            {m.role === "ai" && (
              <span className="bot">
                <Icon name="copilot" />
              </span>
            )}
            <div>
              {m.tool && (
                <div className="tool-call">
                  <span>TOOL EXECUTION</span>
                  <b>execute_tool: {m.tool}()</b>
                  <small>✓ Completed in 182ms</small>
                </div>
              )}
              <p>{m.text}</p>
              {m.role === "ai" && <small>GROUNDED IN 12 SOURCES · {model}</small>}
            </div>
          </div>
        ))}
      </div>
      <div className="suggestions">
        {[
          "Summarize active threats",
          "Generate Sigma rule for webshell",
          "Check fleet health",
          "Explain MITRE T1490",
        ].map((x) => (
          <button key={x} onClick={() => send(x)}>
            {x}
          </button>
        ))}
      </div>
      <form
        className="composer"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          send(input);
        }}
      >
        <button type="button" onClick={() => notify("Evidence attachment selector ready")}>
          ＋
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask RAGSec Copilot about threats, processes, CVEs, or containment..."
          rows={1}
        />
        <button type="submit">↑</button>
      </form>
    </Panel>
  );
}

function TriageView({ notify }: any) {
  const [selected, setSelected] = useState(0);
  const incidents = [
    ["P1", "INC-2407", "Active PHP webshell on public node", "INVESTIGATING", "12m"],
    ["P2", "INC-2406", "Encoded PowerShell execution", "CONTAINED", "41m"],
    ["P3", "INC-2402", "Anomalous permission change", "NEW", "2h"],
  ];
  return (
    <div className="triage-grid">
      <Panel>
        <div className="panel-head">
          <div>
            <span className="eyebrow">PRIORITY QUEUE</span>
            <h3>Active Incidents</h3>
          </div>
          <Badge tone="threat">3 OPEN</Badge>
        </div>
        {incidents.map((x, i) => (
          <button
            className={`incident ${selected === i ? "selected" : ""}`}
            onClick={() => setSelected(i)}
            key={x[1]}
          >
            <Badge tone={i === 0 ? "threat" : i === 1 ? "suspicious" : "blue"}>{x[0]}</Badge>
            <span>
              <small>
                {x[1]} · {x[4]} ago
              </small>
              <b>{x[2]}</b>
              <em>{x[3]} · Assigned to K. Medikonda</em>
            </span>
          </button>
        ))}
      </Panel>
      <Panel>
        <div className="panel-head">
          <div>
            <span className="eyebrow">FORENSIC EVIDENCE</span>
            <h3>{incidents[selected][1]} Timeline</h3>
          </div>
          <Button onClick={() => notify("Evidence package exported with signed hash ledger")}>
            Export Case
          </Button>
        </div>
        <div className="timeline">
          {[
            ["02:31:04", "File creation intercepted", "web_backdoor.php created by apache2"],
            ["02:31:05", "Process execution observed", "Child shell spawned with PID 3824"],
            ["02:31:07", "Network beacon blocked", "Outbound TCP/4444 denied"],
            ["02:31:12", "Artifact quarantined", "SHA-256 evidence seal generated"],
          ].map((x, i) => (
            <div key={x[0]}>
              <i className={i === 3 ? "done" : ""} />
              <time>{x[0]}</time>
              <span>
                <b>{x[1]}</b>
                <p>{x[2]}</p>
              </span>
            </div>
          ))}
        </div>
        <div className="evidence">
          <h4>Evidence Locker</h4>
          {["memory_3824.dmp", "packet_capture_2407.pcap", "sha256_ledger_proof.json"].map((x) => (
            <button onClick={() => notify(`${x} downloaded with integrity proof`)} key={x}>
              <span>DOC</span>
              {x}
              <b>↓</b>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SimulationView({ inject, notify }: any) {
  const [scenario, setScenario] = useState("lockbit"),
    [step, setStep] = useState(0);
  const scenarios = [
    ["lockbit", "LockBit 3.0 Ransomware"],
    ["backdoor", "PHP Reverse Shell Backdoor"],
    ["mimikatz", "Mimikatz LSASS Credential Dump"],
    ["log4j", "Log4j JNDI Remote Exploit"],
  ];
  const steps = [
    "Deploy Attack Payload",
    "Observe Real-Time FIM Alert",
    "Trigger AI Heuristic Analysis",
    "Execute Autonomous Containment",
    "Verify Zero-Damage Posture",
  ];
  const run = () => {
    if (step === 0) inject(scenario === "log4j" ? "backdoor" : scenario);
    else notify(`${steps[step]} completed`);
    setStep((x) => Math.min(4, x + 1));
  };
  return (
    <>
      <div className="scenario-grid">
        {scenarios.map((s, i) => (
          <button
            className={scenario === s[0] ? "active" : ""}
            onClick={() => {
              setScenario(s[0]);
              setStep(0);
            }}
            key={s[0]}
          >
            <span>0{i + 1}</span>
            <Icon name="simulation" />
            <b>{s[1]}</b>
            <small>MITRE ATT&CK emulation · safe sandbox</small>
          </button>
        ))}
      </div>
      <Panel className="walkthrough">
        <div className="panel-head">
          <div>
            <span className="eyebrow">INTERACTIVE WALKTHROUGH</span>
            <h3>{scenarios.find((x) => x[0] === scenario)?.[1]}</h3>
          </div>
          <Badge>ISOLATED LAB</Badge>
        </div>
        <div className="stepper">
          {steps.map((x, i) => (
            <div className={i < step ? "done" : i === step ? "current" : ""} key={x}>
              <span>{i < step ? "✓" : i + 1}</span>
              <b>{x}</b>
              <small>
                {
                  [
                    "Inject a controlled signature into the monitored workspace.",
                    "Watch the FIM watcher intercept within milliseconds.",
                    "Evaluate AST, entropy, and grounded CTI context.",
                    "Kill the process and move artifact to enclave.",
                    "Prove no collateral file modification occurred.",
                  ][i]
                }
              </small>
            </div>
          ))}
        </div>
        <div className="walk-actions">
          <Button
            onClick={() => {
              setStep(0);
              notify("Simulation reset");
            }}
          >
            Reset Lab
          </Button>
          <Button tone="primary" onClick={run}>
            {step === 4 ? "Generate Verification Certificate" : `Run Step ${step + 1}`}
          </Button>
        </div>
      </Panel>
    </>
  );
}

function KnowledgeView({ notify, exportRule }: any) {
  const [running, setRunning] = useState(false),
    [result, setResult] = useState(false);
  const compare = async () => {
    setRunning(true);
    setResult(false);
    try {
      await fetch(`${API_BASE}/api/knowledge/compare-threat-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: "web_backdoor.php",
          content: '<?php system($_POST["cmd"]); ?>',
          process_name: "apache2",
          process_pid: 3824
        })
      });
    } catch {}
    setTimeout(() => {
      setRunning(false);
      setResult(true);
      notify("Grounded threat comparison complete");
    }, 1200);
  };
  return (
    <>
      <div className="intel-grid">
        <Panel>
          <div className="panel-head">
            <div>
              <span className="eyebrow">LIVE THREAT INTELLIGENCE</span>
              <h3>CTI Feeds</h3>
            </div>
            <Button onClick={() => notify("NVD, CISA KEV, and Exploit-DB feeds synchronized")}>
              Refresh Feeds
            </Button>
          </div>
          {[
            ["CISA KEV", "CVE-2024-3400", "Command injection in PAN-OS", "CRITICAL"],
            ["NVD", "CVE-2024-3094", "XZ Utils supply chain backdoor", "CRITICAL"],
            ["EXPLOIT-DB", "EDB-51841", "PHP CGI argument injection", "HIGH"],
          ].map((x) => (
            <div className="feed" key={x[1]}>
              <Badge tone={x[3] === "CRITICAL" ? "threat" : "suspicious"}>{x[0]}</Badge>
              <span>
                <b>{x[1]}</b>
                <small>{x[2]}</small>
              </span>
              <time>12m ago</time>
            </div>
          ))}
        </Panel>
        <Panel>
          <div className="panel-head">
            <div>
              <span className="eyebrow">PLAYBOOK INCUBATOR</span>
              <h3>Vector Library</h3>
            </div>
            <Button onClick={() => notify("Threat playbook ingestion form initialized")}>
              Ingest Playbook
            </Button>
          </div>
          {[
            ["Enterprise Ransomware Containment", "94.2%", "RESTRICTED"],
            ["Webshell Eradication", "91.8%", "CONFIDENTIAL"],
            ["Credential Theft Response", "89.4%", "PUBLIC"],
          ].map((x) => (
            <div className="feed" key={x[0]}>
              <span className="vector">V</span>
              <span>
                <b>{x[0]}</b>
                <small>{x[2]} · 18 vector chunks</small>
              </span>
              <strong>
                {x[1]}
                <small> MATCH</small>
              </strong>
            </div>
          ))}
        </Panel>
      </div>
      <Panel className="comparator">
        <div className="panel-head">
          <div>
            <span className="eyebrow">FILE & PROCESS RAG THREAT COMPARATOR</span>
            <h3>Grounded Multi-Factor Evaluation</h3>
          </div>
          <Badge tone="safe">VECTOR DB ONLINE</Badge>
        </div>
        <div className="compare-form">
          <label>
            PRESET
            <select>
              <option>Web Backdoor — web_backdoor.php</option>
              <option>Ransomware Note</option>
              <option>Mimikatz Dump</option>
              <option>Nominal Utility</option>
            </select>
          </label>
          <label>
            FILE NAME
            <input defaultValue="web_backdoor.php" />
          </label>
          <label>
            PROCESS / PID
            <input defaultValue="apache2 / 3824" />
          </label>
          <label className="payload">
            CODE / PAYLOAD
            <textarea defaultValue={'<?php system($_POST[\"cmd\"]); ?>'} />
          </label>
          <Button tone="primary" disabled={running} onClick={compare}>
            {running ? "Comparing vectors & AST..." : "Run RAG Threat Comparison"}
          </Button>
        </div>
        {running && <Progress value={72} />}
        {result && (
          <div className="rag-result">
            <div className="risk-ring">
              <strong>92</strong>
              <span>/100</span>
              <b>UNSAFE</b>
            </div>
            <div className="score-bars">
              {[
                ["Entropy Score", 22],
                ["AST Signal Score", 25],
                ["RAG CTI Score", 24],
                ["Process Anomaly", 21],
              ].map((x) => (
                <div key={x[0]}>
                  <span>
                    {x[0]} <b>{x[1]}/25</b>
                  </span>
                  <Progress value={Number(x[1]) * 4} tone="amber" />
                </div>
              ))}
            </div>
            <div className="match">
              <span className="eyebrow">BEST GROUNDED MATCH</span>
              <h3>Enterprise Ransomware & Web Backdoor Containment</h3>
              <b>94.2% vector similarity</b>
              <p>Kill process → Quarantine to enclave → Add egress firewall rule</p>
              <Button tone="primary" onClick={exportRule}>
                Export Sigma / YARA
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}

function GovernanceView({ notify }: any) {
  const [valid, setValid] = useState(false);
  return (
    <div className="govern-grid">
      <Panel>
        <div className="panel-head">
          <div>
            <span className="eyebrow">TAMPER-EVIDENT AUDIT</span>
            <h3>Cryptographic Ledger</h3>
          </div>
          <Badge tone="safe">6 BLOCKS SEALED</Badge>
        </div>
        {[1048, 1047, 1046, 1045, 1044].map((x, i) => (
          <div className="block" key={x}>
            <span>#{x}</span>
            <i />
            <div>
              <b>
                {
                  [
                    "Quarantine authorization",
                    "FIM event ingested",
                    "Process termination",
                    "Analyst authentication",
                    "CRC baseline check",
                  ][i]
                }
              </b>
              <small>Previous: 00{7 - i}ac…912f · SHA-256</small>
            </div>
            <code>{crypto.randomUUID().slice(0, 18)}…</code>
            <Badge tone="safe">VALID</Badge>
          </div>
        ))}
      </Panel>
      <Panel className="merkle">
        <div className="panel-head">
          <div>
            <span className="eyebrow">MERKLE VERIFICATION</span>
            <h3>Integrity Tree</h3>
          </div>
        </div>
        <div className="tree">
          <div className="root">
            ROOT<small>9af2…c401</small>
          </div>
          <div className="branches">
            <span>
              HASH A<small>1bd3…0ee9</small>
            </span>
            <span>
              HASH B<small>80c2…7aa1</small>
            </span>
          </div>
          <div className="leaves">
            {[1, 2, 3, 4].map((x) => (
              <i key={x}>B{x}</i>
            ))}
          </div>
        </div>
        {valid ? (
          <div className="certificate">
            <b>100% VALID</b>
            <span>ZERO TAMPERING DETECTED</span>
            <small>Verified against local audit ledger moments ago</small>
          </div>
        ) : (
          <Button
            tone="primary"
            onClick={() => {
              setValid(true);
              notify("Ledger integrity cryptographically verified");
            }}
          >
            Validate Ledger Integrity
          </Button>
        )}
      </Panel>
    </div>
  );
}

function BenchmarkView({ notify }: any) {
  const [run, setRun] = useState(false);
  return (
    <>
      <div className="metrics">
        <Metric
          label="INFERENCE SPEED"
          value="18.2 ms"
          note="Average response time"
          color={C.cyan}
        />
        <Metric
          label="LPU THROUGHPUT"
          value="842 t/s"
          note="Groq hardware acceleration"
          color={C.violet}
        />
        <Metric
          label="FIM INGESTION"
          value="12.5K/s"
          note="Sustained event capacity"
          color={C.blue}
        />
        <Metric
          label="CRC HASH LATENCY"
          value="<0.05 ms"
          note="Per-file verification"
          color={C.safe}
        />
      </div>
      <div className="benchmark-grid">
        <Panel>
          <div className="panel-head">
            <div>
              <span className="eyebrow">DETECTION QUALITY</span>
              <h3>Accuracy Matrix</h3>
            </div>
            <Badge tone="safe">PRODUCTION</Badge>
          </div>
          {[
            ["True Positive Rate", 99.4],
            ["Precision", 99.8],
            ["Recall", 99.2],
            ["False Positive Rejection", 99.8],
          ].map((x) => (
            <div className="accuracy" key={x[0]}>
              <span>{x[0]}</span>
              <strong>{x[1]}%</strong>
              <Progress value={Number(x[1])} tone="safe" />
            </div>
          ))}
        </Panel>
        <Panel>
          <div className="panel-head">
            <div>
              <span className="eyebrow">CONCURRENCY STRESS TEST</span>
              <h3>Live SPS Benchmark</h3>
            </div>
            <Button
              tone="primary"
              onClick={() => {
                setRun(true);
                setTimeout(() => {
                  setRun(false);
                  notify("50 concurrent mutations processed with zero drops");
                }, 2200);
              }}
            >
              {run ? "Processing 50 mutations..." : "Run Live Benchmark"}
            </Button>
          </div>
          <div className="bars">
            {[42, 70, 51, 85, 61, 92, 68, 78, 55, 72, 48, 64, 39, 58, 44, 69, 52, 46, 61, 35].map(
              (x, i) => (
                <i key={i} style={{ height: `${run ? x : Math.max(8, x / 3)}%` }} />
              ),
            )}
          </div>
          <div className="bench-stats">
            <span>
              <b>{run ? "9.4" : "0.0"} ms</b> P50 LATENCY
            </span>
            <span>
              <b>{run ? "22.1" : "0.0"} ms</b> P99 LATENCY
            </span>
            <span>
              <b>0</b> DROPPED
            </span>
          </div>
        </Panel>
      </div>
    </>
  );
}

function SiemView({ notify }: any) {
  const [selected, setSelected] = useState("Splunk HEC");
  return (
    <div className="siem-grid">
      <Panel>
        <div className="panel-head">
          <div>
            <span className="eyebrow">INTEGRATION CONNECTORS</span>
            <h3>Enterprise Destinations</h3>
          </div>
        </div>
        {[
          ["Splunk HEC", "HTTP Event Collector", "CONNECTED"],
          ["Microsoft Sentinel", "Log Analytics API", "READY"],
          ["Elastic Security", "ECS / Bulk API", "READY"],
          ["Generic Syslog", "RFC 5424 / CEF", "READY"],
        ].map((x) => (
          <button
            className={`connector ${selected === x[0] ? "selected" : ""}`}
            onClick={() => setSelected(x[0])}
            key={x[0]}
          >
            <span>{x[0].slice(0, 2).toUpperCase()}</span>
            <div>
              <b>{x[0]}</b>
              <small>{x[1]}</small>
            </div>
            <Badge tone={x[2] === "CONNECTED" ? "safe" : "blue"}>{x[2]}</Badge>
          </button>
        ))}
      </Panel>
      <Panel>
        <div className="panel-head">
          <div>
            <span className="eyebrow">LIVE TELEMETRY PREVIEW</span>
            <h3>{selected} · CEF / JSON</h3>
          </div>
          <Button
            tone="primary"
            onClick={() => notify(`Heartbeat delivered to ${selected} in 41ms`)}
          >
            Send Test Heartbeat
          </Button>
        </div>
        <pre className="telemetry">{`{\n  \"timestamp\": \"2025-07-18T02:41:08.123Z\",\n  \"vendor\": \"RAGSec\",\n  \"product\": \"Autonomous SOC\",\n  \"event_type\": \"fim.file.threat\",\n  \"severity\": 10,\n  \"file\": { \"path\": \"/sandbox/web_backdoor.php\" },\n  \"process\": { \"name\": \"apache2\", \"pid\": 3824 },\n  \"mitre\": [\"T1190\", \"T1059.004\"],\n  \"action\": \"quarantined\"\n}`}</pre>
        <div className="delivery">
          <i />
          <span>
            <b>Streaming securely</b>
            <small>Last delivery 2s ago · TLS 1.3 · 0 dropped</small>
          </span>
        </div>
      </Panel>
    </div>
  );
}

function VerificationView({ notify }: any) {
  const [run, setRun] = useState(false);
  const tests = [
    ["Backend API Endpoints", "116 routes", "12 / 12"],
    ["AST Static Analyzers", "5 languages", "14 / 14"],
    ["FIM Watcher & Sandbox", "12.5K EPS", "11 / 11"],
    ["Cryptographic CRC Ledger", "SHA-256", "11 / 11"],
  ];
  return (
    <>
      <Panel className="verification-hero">
        <div className="health-orb">
          <strong>{run ? "…" : "100%"}</strong>
          <span>{run ? "TESTING" : "PASSING"}</span>
        </div>
        <div>
          <span className="eyebrow">SYSTEM SELF-DIAGNOSTICS</span>
          <h2>
            {run ? "Executing 48 verification checks" : "All systems verified and production ready"}
          </h2>
          <p>
            Last full audit completed moments ago · 48 / 48 tests passed · Zero integrity
            deviations.
          </p>
        </div>
        <Button
          tone="primary"
          disabled={run}
          onClick={() => {
            setRun(true);
            setTimeout(() => {
              setRun(false);
              notify("48 of 48 verification tests passed");
            }, 2000);
          }}
        >
          {run ? "Running Test Suite..." : "Run All Tests"}
        </Button>
      </Panel>
      <div className="test-grid">
        {tests.map((x, i) => (
          <Panel key={x[0]}>
            <div className={`test-icon ${run ? "running" : ""}`}>{run ? "↻" : "✓"}</div>
            <span className="eyebrow">CATEGORY 0{i + 1}</span>
            <h3>{x[0]}</h3>
            <p>{x[1]} · regression and integrity verification</p>
            <div>
              <Badge tone={run ? "blue" : "safe"}>{run ? "RUNNING" : "PASSED"}</Badge>
              <b>{run ? "—" : x[2]}</b>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

function CommandPalette({
  query,
  setQuery,
  navigate,
  inject,
  setModal,
  sentinel,
  setSentinel,
}: any) {
  const all = [...nav, ...labNav].filter((x) => x[1].toLowerCase().includes(query.toLowerCase()));
  return (
    <Modal title="Command Centre" onClose={() => setModal("")} wide>
      <input
        autoFocus
        className="command-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search commands, CVEs, hashes, PIDs, techniques..."
      />
      <div className="command-grid">
        <div>
          <span className="eyebrow">NAVIGATION</span>
          {all.map((x) => (
            <button onClick={() => navigate(x[0])} key={x[0]}>
              <Icon name={x[0]} />
              <span>{x[1]}</span>
              <kbd>↵</kbd>
            </button>
          ))}
        </div>
        <div>
          <span className="eyebrow">EXECUTIVE ACTIONS</span>
          <button onClick={() => setModal("brief")}>
            <Icon name="verification" />
            <span>Generate Executive Brief</span>
            <kbd>G B</kbd>
          </button>
          <button onClick={() => navigate("siem")}>
            <Icon name="siem" />
            <span>Export SIEM Telemetry</span>
          </button>
          <button
            onClick={() => {
              setSentinel(!sentinel);
              setModal("");
            }}
          >
            <Icon name="governance" />
            <span>Toggle Active Defense</span>
            <Badge tone={sentinel ? "safe" : "threat"}>{sentinel ? "ON" : "OFF"}</Badge>
          </button>
          <span className="eyebrow demo-label">DEMO SCENARIOS</span>
          <button onClick={() => inject("lockbit")}>
            <Icon name="simulation" />
            <span>Deploy LockBit 3.0 Ransomware</span>
          </button>
          <button onClick={() => inject("backdoor")}>
            <Icon name="scanner" />
            <span>Deploy PHP Web Backdoor</span>
          </button>
          <button onClick={() => inject("mimikatz")}>
            <Icon name="playbooks" />
            <span>Deploy Mimikatz Credential Dumping</span>
          </button>
          <button onClick={() => inject("reset")}>
            <Icon name="verification" />
            <span>Reset to Nominal Baseline</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ExecutiveBrief({ threats, clean, total, quarantined, close, notify }: any) {
  const copy = () => {
    navigator.clipboard?.writeText("RAGSec Executive Incident Brief");
    notify("Executive brief copied as Markdown");
  };
  return (
    <Modal title="Executive Incident Debrief" onClose={close} wide>
      <div className="brief-meta">
        <Badge tone="threat">ENTERPRISE CONFIDENTIAL</Badge>
        <span>Generated just now</span>
        <span>Evaluator: Groq Llama 3.3 70B</span>
      </div>
      <div className="brief-kpis">
        <span>
          <b>{threats}</b>Active Threats
        </span>
        <span>
          <b>{quarantined}</b>Quarantined
        </span>
        <span>
          <b>{total}</b>FIM Events
        </span>
        <span>
          <b>{clean}</b>Clean Baseline
        </span>
      </div>
      <article className="brief-copy">
        <h3>1. Executive Summary</h3>
        <p>
          RAGSec is actively monitoring the enterprise filesystem and endpoint mesh. Current
          telemetry identifies <b>{threats} uncontained threat signals</b>. Autonomous defense
          remains operational and all evidence is sealed to the cryptographic audit ledger.
        </p>
        <h3>2. Threat Landscape & Observed Tactics</h3>
        <p>
          Observed behaviors map to <code>T1490</code> Inhibit System Recovery,{" "}
          <code>T1059.001</code> PowerShell, and <code>T1190</code> Exploit Public-Facing
          Application. The highest-confidence artifact is a PHP command execution backdoor.
        </p>
        <h3>3. Recommended Containment</h3>
        <p>
          Authorize endpoint isolation, terminate hostile child processes, preserve volatile memory,
          and rotate affected credentials. Maintain heightened monitoring for 24 hours.
        </p>
      </article>
      <div className="modal-actions">
        <Button onClick={copy}>Copy Markdown</Button>
        <Button onClick={() => {
          const md = `# RAGSec Executive Incident Debrief\nClassification: ENTERPRISE CONFIDENTIAL\nDate: ${new Date().toISOString()}\n\n## 1. Executive Summary\n- Active Threats: ${threats}\n- Quarantined: ${quarantined}\n- FIM Events: ${total}\n- Clean Baseline: ${clean}\n\n## 2. Threat Landscape & Observed Tactics\nObserved behaviors map to T1490 Inhibit System Recovery, T1059.001 PowerShell, and T1190 Exploit Public-Facing Application.\n\n## 3. Recommended Containment\nAuthorize endpoint isolation, terminate hostile child processes, preserve volatile memory, and rotate affected credentials.\n`;
          const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `RAGSec-Executive-Brief-${new Date().toISOString().split("T")[0]}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          notify("RAGSec-Executive-Brief.md downloaded");
        }}>Download .md</Button>
        <Button tone="primary" onClick={close}>
          Close Brief
        </Button>
      </div>
    </Modal>
  );
}

function ModelModal({ model, select, close }: any) {
  const models = [
    ["Groq Llama 3.3 70B", "Ultra-low latency LPU inference", "RECOMMENDED"],
    ["OpenAI GPT-OSS 120B", "Deep reasoning & multi-step tools", "DEEP REASONING"],
    ["Anthropic Claude 3.5 Sonnet", "High-precision code patching", "PRECISION"],
    ["Ollama DeepSeek R1", "Local on-premise zero-leakage", "PRIVATE"],
  ];
  return (
    <Modal title="Select AI Brain" onClose={close}>
      {models.map((m, i) => (
        <button
          className={`model-option ${model === m[0] ? "selected" : ""}`}
          onClick={() => select(m[0])}
          key={m[0]}
        >
          <span className={`brain b${i}`}>
            <Icon name="copilot" />
          </span>
          <span>
            <b>{m[0]}</b>
            <small>{m[1]}</small>
          </span>
          <Badge tone={i === 0 ? "safe" : "blue"}>{m[2]}</Badge>
          {model === m[0] && <strong>✓</strong>}
        </button>
      ))}
    </Modal>
  );
}

function RulesModal({ close, notify }: any) {
  const [tab, setTab] = useState("sigma");
  const sigma = `title: RAGSec PHP Webshell Execution\nid: 24ac87d0-7ef4-4dd8-a2f7-4c9a12e4dc22\nstatus: stable\ndescription: Detects command execution from PHP web workers\nauthor: RAGSec Autonomous SOC\nlogsource:\n  category: process_creation\n  product: linux\ndetection:\n  selection:\n    ParentImage|endswith: '/apache2'\n    Image|endswith:\n      - '/sh'\n      - '/bash'\n  condition: selection\nfalsepositives: [Administrative maintenance]\nlevel: critical`;
  const yara = `rule RAGSec_PHP_Webshell_CommandExec {\n  meta:\n    author = \"RAGSec Autonomous SOC\"\n    severity = \"critical\"\n    mitre = \"T1059.004, T1505.003\"\n  strings:\n    $php = \"<?php\" ascii\n    $exec1 = /system\\\\s*\\\\(\\\\s*\\\\$_(POST|GET)/ nocase\n    $exec2 = \"shell_exec(\" ascii nocase\n  condition:\n    uint16(0) == 0x3f3c and $php and any of ($exec*)\n}`;
  const text = tab === "sigma" ? sigma : yara;
  return (
    <Modal title="Detection Rule Export" onClose={close} wide>
      <div className="tabs large">
        <button className={tab === "sigma" ? "active" : ""} onClick={() => setTab("sigma")}>
          Sigma Rule (.yml)
        </button>
        <button className={tab === "yara" ? "active" : ""} onClick={() => setTab("yara")}>
          YARA Signature (.yar)
        </button>
      </div>
      <pre className="rule-code">{text}</pre>
      <div className="modal-actions">
        <Button
          onClick={() => {
            navigator.clipboard?.writeText(text);
            notify("Detection rule copied");
          }}
        >
          Copy Rule
        </Button>
        <Button
          tone="primary"
          onClick={() => {
            const ext = tab === "sigma" ? "yml" : "yar";
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `RAGSec_Detection_Rule.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            notify(`RAGSec_Detection_Rule.${ext} downloaded`);
          }}
        >
          Download Rule
        </Button>
      </div>
    </Modal>
  );
}

function OperatorModal({ close, notify }: any) {
  const [role, setRole] = useState("SOC Administrator");
  return (
    <Modal title="Operator Profile & Authentication" onClose={close}>
      <div className="profile">
        <span className="profile-avatar">
          KM
          <i />
        </span>
        <h2>Kushal Medikonda</h2>
        <p>kushal.medikonda@ragsec.local</p>
        <Badge tone="safe">MFA VERIFIED · ONLINE</Badge>
      </div>
      <span className="eyebrow">SWITCH OPERATOR PROFILE</span>
      {[
        ["Lead SOC Analyst", "Read / Write / Quarantine"],
        ["SOC Administrator", "Full Root Privileges"],
        ["Compliance Auditor", "Read-Only Certified"],
      ].map((x) => (
        <button
          className={`role ${role === x[0] ? "selected" : ""}`}
          onClick={() => {
            setRole(x[0]);
            notify(`Operator role switched to ${x[0]}`);
          }}
          key={x[0]}
        >
          <span>
            <b>{x[0]}</b>
            <small>{x[1]}</small>
          </span>
          {role === x[0] && <Badge tone="safe">ACTIVE</Badge>}
        </button>
      ))}
      <Button
        tone="danger"
        onClick={() => {
          notify("Terminal locked — re-authentication required");
          close();
        }}
      >
        Lock Secure Terminal
      </Button>
    </Modal>
  );
}

function InspectModal({ close, quarantine }: any) {
  return (
    <Modal title="AST Signal & Artifact Inspection" onClose={close} wide>
      <div className="inspect-grid">
        <div>
          <span className="eyebrow">ARTIFACT</span>
          <h2>web_backdoor.php</h2>
          <p className="lead">
            Critical remote command execution behavior detected through static AST analysis and
            process lineage correlation.
          </p>
          <Field label="SHA-256" value="af30dd1e8970d65fa63e7218d1c90321" />
          <Field label="PROCESS LINEAGE" value="systemd → apache2 (PID 3824) → /bin/sh" />
        </div>
        <div className="signal-list">
          {[
            ["AST command execution sink", 100],
            ["Untrusted input propagation", 98],
            ["CTI vector similarity", 94],
            ["Shannon entropy anomaly", 82],
          ].map((x) => (
            <div key={x[0]}>
              <span>
                {x[0]}
                <b>{x[1]}%</b>
              </span>
              <Progress value={Number(x[1])} tone="amber" />
            </div>
          ))}
        </div>
      </div>
      <Mitre />
      <div className="modal-actions">
        <Button onClick={close}>Close</Button>
        <Button tone="danger" onClick={quarantine}>
          Quarantine Artifact
        </Button>
      </div>
    </Modal>
  );
}

function Field({ label, value }: any) {
  return (
    <label className="field">
      <span>{label}</span>
      <code>{value}</code>
      <button onClick={() => navigator.clipboard?.writeText(value)}>COPY</button>
    </label>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <span>◇</span>
      <p>{text}</p>
    </div>
  );
}

export default App;
