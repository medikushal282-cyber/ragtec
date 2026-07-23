import { useState, useEffect, useRef, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_LINKS = ['Threat Intel', 'Defense', 'Analytics', 'Community']

const THREAT_CATEGORIES = [
  { label: 'RAG Injection', severity: 'critical' as const },
  { label: 'Prompt Leakage', severity: 'high' as const },
  { label: 'Vector Poisoning', severity: 'critical' as const },
  { label: 'Embedding Theft', severity: 'medium' as const },
  { label: 'Context Overflow', severity: 'high' as const },
  { label: 'And More...', severity: 'medium' as const },
]

const STATS = [
  { value: '10K+', label: 'Threats Neutralized', mono: 'threats_blocked_total' },
  { value: '99.9%', label: 'Detection Accuracy', mono: 'accuracy_rate' },
  { value: '< 2ms', label: 'Response Latency', mono: 'avg_latency_ms' },
]

type Threat = {
  id: string;
  type: string;
  origin: string;
  severity: 'critical' | 'high' | 'medium';
  ts: string;
};

const FEATURES = [
  {
    num: '01',
    title: 'RAG Security Layer',
    body: 'Real-time inspection of retrieval-augmented generation pipelines, blocking injection attempts before they reach your LLM.',
  },
  {
    num: '02',
    title: 'Vector DB Sentinel',
    body: 'Continuous monitoring of embedding stores for poisoning, exfiltration, and unauthorized query patterns across all clusters.',
  },
  {
    num: '03',
    title: 'Adaptive Defense',
    body: 'Machine learning models that evolve with emerging threat signatures — zero-day AI attack coverage updated in real time.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CyberOrb() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
      {/* Ambient glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(0,255,136,0.18) 0%, transparent 70%)',
          animation: 'pulse-glow 3s ease-in-out infinite',
        }}
      />
      {/* Core sphere */}
      <div
        className="absolute rounded-full"
        style={{
          width: 100,
          height: 100,
          background: 'radial-gradient(circle at 35% 35%, rgba(0,255,136,0.5) 0%, rgba(0,80,50,0.3) 50%, transparent 75%)',
          border: '1px solid rgba(0,255,136,0.5)',
          boxShadow: '0 0 30px rgba(0,255,136,0.35), inset 0 0 20px rgba(0,255,136,0.1)',
        }}
      />
      {/* Orbit ring 1 */}
      <div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          border: '1px solid rgba(0,255,136,0.2)',
          transform: 'rotateX(75deg)',
        }}
      />
      {/* Orbit ring 2 */}
      <div
        className="absolute rounded-full"
        style={{
          width: 220,
          height: 220,
          border: '1px solid rgba(0,255,136,0.1)',
          transform: 'rotateX(75deg) rotateZ(60deg)',
        }}
      />
      {/* Orbiting dot 1 */}
      <div
        className="absolute"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#00ff88',
          boxShadow: '0 0 8px #00ff88',
          animation: 'orbit 4s linear infinite',
          top: '50%',
          left: '50%',
          marginTop: -3,
          marginLeft: -3,
        }}
      />
      {/* Orbiting dot 2 */}
      <div
        className="absolute"
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#ff003c',
          boxShadow: '0 0 6px #ff003c',
          animation: 'orbit-reverse 6s linear infinite',
          top: '50%',
          left: '50%',
          marginTop: -2,
          marginLeft: -2,
        }}
      />
      {/* Corner data tags */}
      <div className="mono absolute top-0 right-0 text-right" style={{ fontSize: 9, color: '#00ff88', opacity: 0.7 }}>
        <div>SYS::ACTIVE</div>
        <div>VEC_DIM:1536</div>
      </div>
      <div className="mono absolute bottom-0 left-0" style={{ fontSize: 9, color: '#8e8e9f' }}>
        <div>RAG_PROXY</div>
        <div>LAYER::7</div>
      </div>
    </div>
  )
}

function LiveThreatRow({ threat, index }: { threat: Threat, index: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 120)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 group cursor-pointer transition-all duration-200"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-8px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, background 0.2s ease',
        background: 'transparent',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,255,136,0.04)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      <span className="mono" style={{ fontSize: 11, color: '#8e8e9f', minWidth: 70 }}>{threat.id}</span>
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{threat.type}</span>
      <span className="mono" style={{ fontSize: 10, color: '#8e8e9f', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{threat.origin}</span>
      <span className={threat.severity === 'critical' ? 'badge-critical' : threat.severity === 'high' ? 'badge-high' : 'badge-medium'}>
        {threat.severity}
      </span>
      <span className="mono" style={{ fontSize: 10, color: '#8e8e9f', minWidth: 52, textAlign: 'right' }}>{threat.ts}</span>
    </div>
  )
}

function StatCard({ stat, index }: { stat: typeof STATS[0], index: number }) {
  const [count, setCount] = useState(0)
  const isPercent = stat.value.includes('%')
  const isMsLatency = stat.value.includes('ms')
  const numericTarget = parseFloat(stat.value.replace(/[^0-9.]/g, ''))

  useEffect(() => {
    const duration = 1200
    const steps = 40
    const increment = numericTarget / steps
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + increment, numericTarget)
      setCount(current)
      if (current >= numericTarget) clearInterval(interval)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [numericTarget])

  const display = isMsLatency
    ? `< ${Math.round(count)}ms`
    : isPercent
    ? `${count.toFixed(1)}%`
    : `${Math.round(count)}K+`

  return (
    <div
      className="cyber-panel flex flex-col gap-1 p-4 cursor-default group"
      style={{
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        animationDelay: `${index * 150}ms`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(0,255,136,0.5)'
        el.style.boxShadow = '0 0 20px rgba(0,255,136,0.15)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(0,255,136,0.2)'
        el.style.boxShadow = 'none'
      }}
    >
      <span className="mono" style={{ fontSize: 10, color: '#8e8e9f', letterSpacing: '0.08em' }}>{stat.mono}</span>
      <span
        className="glow-text-green"
        style={{ fontSize: 32, fontWeight: 700, color: '#00ff88', lineHeight: 1, letterSpacing: '-0.01em' }}
      >
        {display}
      </span>
      <span style={{ fontSize: 13, color: '#8e8e9f', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {stat.label}
      </span>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState('Threat Intel')
  const [searchQuery, setSearchQuery] = useState('')
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [glowVisible, setGlowVisible] = useState(false)
  const [threatCount, setThreatCount] = useState(9981)
  const [liveThreats, setLiveThreats] = useState<Threat[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Connect to Backend Data
  useEffect(() => {
    // Fetch initial state
    fetch('http://localhost:8000/api/threats/initial')
      .then(res => res.json())
      .then(data => setLiveThreats(data))
      .catch(err => console.error("Failed to fetch initial threats", err));

    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws/threats');
    
    ws.onmessage = (event) => {
      try {
        const newThreat: Threat = JSON.parse(event.data);
        setLiveThreats(prev => {
          // Keep only the most recent 5 threats so the UI doesn't overflow vertically
          const updated = [newThreat, ...prev].slice(0, 5);
          return updated;
        });
        // Real increment for every threat
        setThreatCount(c => c + 1);
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [])

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setGlowVisible(true)
  }

  return (
    <div
      ref={containerRef}
      className="scanline-container"
      style={{ minHeight: '100vh', backgroundColor: '#0a0a0c', position: 'relative', overflowX: 'hidden' }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setGlowVisible(false)}
    >
      {/* Ambient background gradients */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          left: '-10%',
          width: '55vw',
          height: '55vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-20%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(176,38,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(80px)',
        }}
      />

      {/* Cursor follow glow */}
      <div
        style={{
          position: 'fixed',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)',
          transform: `translate(${cursorPos.x - 200}px, ${cursorPos.y - 200}px)`,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: glowVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* ── Main wrapper ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Navbar ── */}
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'rgba(10,10,12,0.92)',
            borderBottom: '1px solid rgba(0,255,136,0.12)',
            backdropFilter: 'blur(12px)',
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px',
            gap: 0,
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: 'rgba(0,255,136,0.1)',
                border: '1px solid rgba(0,255,136,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#00ff88">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.72-2.5 7.19-6 8.38-3.5-1.19-6-4.66-6-8.38V7.67L12 5zm-1 3v5l4.25 2.52.75-1.27-3.5-2.08V8H11z"/>
              </svg>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              RAG<span style={{ color: '#00ff88' }}>SEC</span>
            </span>
            <span
              className="mono"
              style={{ fontSize: 9, color: '#8e8e9f', marginLeft: 2, marginTop: 2, letterSpacing: '0.05em' }}
            >
              AI
            </span>
          </div>

          {/* Nav links — hidden on mobile */}
          <div
            style={{ display: 'flex', gap: 4, alignItems: 'center' }}
            className="hidden-mobile"
          >
            {NAV_LINKS.map(link => (
              <button
                key={link}
                onClick={() => setActiveNav(link)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: activeNav === link ? '#00ff88' : '#8e8e9f',
                  fontFamily: 'Rajdhani, sans-serif',
                  transition: 'color 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (activeNav !== link) (e.currentTarget as HTMLButtonElement).style.color = '#fff'
                }}
                onMouseLeave={e => {
                  if (activeNav !== link) (e.currentTarget as HTMLButtonElement).style.color = '#8e8e9f'
                }}
              >
                {link}
                {activeNav === link && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60%',
                      height: 1,
                      background: '#00ff88',
                      boxShadow: '0 0 6px #00ff88',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* CTA button */}
          <div style={{ display: 'flex', gap: 12, marginLeft: 24, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 10, color: '#00ff88', animation: 'blink 1.4s step-end infinite' }}>
              ▶ LIVE
            </span>
            <Link to="/app/dashboard">
              <button className="btn-cyber cursor-pointer" style={{ padding: '8px 20px', fontSize: 13 }}>
                Launch App
              </button>
            </Link>
          </div>
        </nav>

        {/* ── Hero section ── */}
        <section
          style={{
            paddingTop: 60,
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr auto',
            gap: 0,
          }}
        >
          {/* Hero left */}
          <div
            style={{
              padding: '60px 40px 40px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            {/* Pre-label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: '#00ff88',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#00ff88',
                    boxShadow: '0 0 6px #00ff88',
                    display: 'inline-block',
                    animation: 'pulse-glow 1.5s ease-in-out infinite',
                  }}
                />
                NEXT-GEN AI SECURITY
              </span>
              <span className="badge-medium">v2.4.1</span>
            </div>

            {/* Hero display type */}
            <div style={{ lineHeight: 0.92 }}>
              <div
                style={{
                  fontSize: 'clamp(48px, 7vw, 88px)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  color: '#ffffff',
                  lineHeight: 0.95,
                }}
              >
                THREAT
              </div>
              <div
                className="glitch-text"
                data-text="INTELLIGENCE"
                style={{
                  fontSize: 'clamp(48px, 7vw, 88px)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  color: '#00ff88',
                  lineHeight: 0.95,
                }}
              >
                INTELLIGENCE
              </div>
              <div
                style={{
                  fontSize: 'clamp(48px, 7vw, 88px)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  color: '#ffffff',
                  lineHeight: 0.95,
                  opacity: 0.9,
                }}
              >
                REDEFINED
              </div>
            </div>

            {/* Sub-copy */}
            <p
              style={{
                fontSize: 15,
                color: '#8e8e9f',
                maxWidth: 400,
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              RAGSec AI monitors your entire retrieval-augmented generation stack in real time — blocking injection attacks, vector poisoning, and prompt leakage before they reach production.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-cyber cursor-pointer" style={{ padding: '12px 28px', fontSize: 15 }}>
                Start Scan
              </button>
              <button className="btn-outline-cyber cursor-pointer" style={{ padding: '12px 24px', fontSize: 15 }}>
                View Demo
              </button>
            </div>

            {/* Community stat */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <div style={{ display: 'flex' }}>
                {['#1a4a3a', '#0d3328', '#0a2920'].map((bg, i) => (
                  <div
                    key={i}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: bg,
                      border: '2px solid rgba(0,255,136,0.3)',
                      marginLeft: i === 0 ? 0 : -10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,255,136,0.6)">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                ))}
              </div>
              <div>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#00ff88', marginRight: 6 }}>3,200+</span>
                <span style={{ fontSize: 13, color: '#8e8e9f', fontWeight: 500 }}>Security Engineers</span>
              </div>
              <span style={{ color: '#8e8e9f', fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: '#8e8e9f' }}>Join the community →</span>
            </div>
          </div>

          {/* Hero right — orb + live counter */}
          <div
            style={{
              padding: '60px 40px 40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 32,
              position: 'relative',
            }}
          >
            {/* Grid lines decoration */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              }}
            />

            <CyberOrb />

            {/* Live threat counter */}
            <div
              className="cyber-panel"
              style={{ padding: '16px 24px', minWidth: 240, textAlign: 'center' }}
            >
              <div className="mono" style={{ fontSize: 10, color: '#8e8e9f', letterSpacing: '0.1em', marginBottom: 4 }}>
                THREATS_BLOCKED_SESSION
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#00ff88',
                  letterSpacing: '-0.01em',
                  fontFamily: 'Share Tech Mono, monospace',
                  textShadow: '0 0 15px rgba(0,255,136,0.6)',
                }}
              >
                {threatCount.toLocaleString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#00ff88',
                    display: 'inline-block',
                    animation: 'pulse-glow 1.2s ease-in-out infinite',
                  }}
                />
                <span className="mono" style={{ fontSize: 9, color: '#00ff88', letterSpacing: '0.1em' }}>
                  LIVE MONITORING ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* ── Stats bar (full width, bottom of hero grid) ── */}
          <div
            style={{
              gridColumn: '1 / -1',
              borderTop: '1px solid rgba(0,255,136,0.12)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              padding: '0 32px',
            }}
          >
            {STATS.map((stat, i) => (
              <div
                key={i}
                style={{
                  borderRight: i < STATS.length - 1 ? '1px solid rgba(0,255,136,0.1)' : 'none',
                  padding: '28px 24px',
                }}
              >
                <StatCard stat={stat} index={i} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom grid section ── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1.6fr 1fr',
            gap: 1,
            borderTop: '1px solid rgba(0,255,136,0.08)',
            minHeight: 280,
          }}
        >
          {/* Left: Threat categories */}
          <div
            style={{
              padding: '28px 24px',
              borderRight: '1px solid rgba(0,255,136,0.08)',
            }}
          >
            <div
              className="mono"
              style={{ fontSize: 10, color: '#8e8e9f', letterSpacing: '0.12em', marginBottom: 14, textTransform: 'uppercase' }}
            >
              Threat Vectors
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {THREAT_CATEGORIES.map(({ label, severity }) => (
                <button
                  key={label}
                  className={severity === 'critical' ? 'badge-critical' : severity === 'high' ? 'badge-high' : 'badge-medium'}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s', background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div style={{ marginTop: 20, position: 'relative' }}>
              <input
                className="input-cyber"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search threat database..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8e8e9f"
                strokeWidth="2"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
          </div>

          {/* Center: Live threat feed */}
          <div
            style={{
              padding: '28px 24px',
              borderRight: '1px solid rgba(0,255,136,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span
                className="mono"
                style={{ fontSize: 10, color: '#8e8e9f', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                Live Threat Feed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#ff003c',
                    display: 'inline-block',
                    animation: 'pulse-glow 0.8s ease-in-out infinite',
                    boxShadow: '0 0 6px #ff003c',
                  }}
                />
                <span className="mono" style={{ fontSize: 9, color: '#ff003c' }}>STREAMING</span>
              </span>
            </div>

            {/* Column headers */}
            <div
              className="mono"
              style={{
                display: 'flex',
                gap: 12,
                padding: '0 12px 6px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: 9,
                color: '#8e8e9f',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ minWidth: 70 }}>ID</span>
              <span style={{ flex: 1 }}>Type</span>
              <span style={{ flex: 1 }}>Origin</span>
              <span style={{ minWidth: 56 }}>Severity</span>
              <span style={{ minWidth: 52, textAlign: 'right' }}>Time</span>
            </div>

            {liveThreats.map((t, i) => (
              <LiveThreatRow key={t.id} threat={t} index={i} />
            ))}

            <button
              className="mono"
              style={{
                marginTop: 12,
                background: 'transparent',
                border: 'none',
                color: '#00ff88',
                fontSize: 11,
                cursor: 'pointer',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            >
              View full threat log →
            </button>
          </div>

          {/* Right: Explore + numbered metric */}
          <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Explore card */}
            <div
              className="cyber-panel"
              style={{ padding: '20px 16px', cursor: 'pointer', flex: 1, transition: 'all 0.2s ease', animation: 'float 4s ease-in-out infinite' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'rgba(0,255,136,0.5)'
                el.style.boxShadow = '0 0 20px rgba(0,255,136,0.12)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'rgba(0,255,136,0.2)'
                el.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(0,255,136,0.1)',
                    border: '1px solid rgba(0,255,136,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#00ff88">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Explore Community</div>
                  <div className="mono" style={{ fontSize: 9, color: '#8e8e9f' }}>3,200 engineers</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00ff88' }}>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>Join Defense Network</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#00ff88">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </div>
            </div>

            {/* Numbered metric */}
            <div
              className="cyber-panel"
              style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'default' }}
            >
              <span
                className="mono"
                style={{ fontSize: 36, fontWeight: 400, color: '#00ff88', opacity: 0.25, lineHeight: 1 }}
              >
                01
              </span>
              <div>
                <div className="mono" style={{ fontSize: 9, color: '#8e8e9f', letterSpacing: '0.08em', marginBottom: 4 }}>
                  RANKED #1
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>AI Security Platform</div>
                <div style={{ fontSize: 11, color: '#8e8e9f' }}>2024 · CyberTech Awards</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features section ── */}
        <section
          style={{
            padding: '64px 40px',
            borderTop: '1px solid rgba(0,255,136,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 10, color: '#8e8e9f', letterSpacing: '0.12em' }}>
              CAPABILITIES
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,255,136,0.1)' }} />
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              marginBottom: 40,
              lineHeight: 1,
            }}
          >
            Built for the <span style={{ color: '#00ff88' }}>AI-Native</span> Threat Landscape
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="cyber-panel"
                style={{
                  padding: '28px 24px 24px',
                  cursor: 'default',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(0,255,136,0.45)'
                  el.style.boxShadow = '0 0 24px rgba(0,255,136,0.1)'
                  el.style.transform = 'translateY(-3px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(0,255,136,0.2)'
                  el.style.boxShadow = 'none'
                  el.style.transform = 'translateY(0)'
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 40, color: '#00ff88', opacity: 0.15, lineHeight: 1, display: 'block', marginBottom: 16 }}
                >
                  {f.num}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: '#8e8e9f', lineHeight: 1.65, fontWeight: 400 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          style={{
            borderTop: '1px solid rgba(0,255,136,0.08)',
            padding: '24px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            RAG<span style={{ color: '#00ff88' }}>SEC</span> AI
          </span>
          <span className="mono" style={{ fontSize: 10, color: '#8e8e9f', letterSpacing: '0.08em' }}>
            © 2025 · SECURE YOUR AI STACK · v2.4.1
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Security'].map(l => (
              <span
                key={l}
                style={{ fontSize: 12, color: '#8e8e9f', cursor: 'pointer', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}
              >
                {l}
              </span>
            ))}
          </div>
        </footer>
      </div>

      {/* Responsive style override */}
      <style>{`
        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
          section[style*="grid-template-columns: 1fr 1fr"] {
            display: block !important;
          }
          section[style*="grid-template-columns: 1.1fr"] {
            display: block !important;
          }
          section[style*="grid-template-columns: repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
