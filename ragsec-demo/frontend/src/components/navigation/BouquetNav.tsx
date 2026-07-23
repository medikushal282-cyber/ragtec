import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { 
  ShieldAlert, 
  Activity, 
  Target, 
  ScanSearch, 
  Database, 
  Settings 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── TYPES ────────────────────────────────────────────────────────
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
  stats: string;
  status: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Command Center',
    icon: <Activity size={20} />,
    path: '/app/dashboard',
    description: 'Global security overview and active monitoring.',
    stats: 'System Nominal',
    status: 'Online'
  },
  {
    id: 'threats',
    label: 'Threat Intelligence',
    icon: <ShieldAlert size={20} />,
    path: '/app/threats',
    description: 'Monitor live cyber threats and global attack trends.',
    stats: 'Updated 12s ago',
    status: 'Active'
  },
  {
    id: 'incidents',
    label: 'Incident Response',
    icon: <Target size={20} />,
    path: '/app/incidents',
    description: 'Investigate alerts and contain active breaches.',
    stats: '247 Active Incidents',
    status: 'Critical'
  },
  {
    id: 'scanner',
    label: 'Vulnerability Scanner',
    icon: <ScanSearch size={20} />,
    path: '/app/scanner',
    description: 'Continuous deep scan of network topology.',
    stats: '89% Coverage',
    status: 'Scanning'
  },
  {
    id: 'forensics',
    label: 'Digital Forensics',
    icon: <Database size={20} />,
    path: '/app/forensics',
    description: 'Deep packet inspection and timeline reconstruction.',
    stats: '1.2TB Analyzed',
    status: 'Archiving'
  },
  {
    id: 'settings',
    label: 'Security Policies',
    icon: <Settings size={20} />,
    path: '/app/settings',
    description: 'Configure firewall rules and access control.',
    stats: 'v2.4.1',
    status: 'Synced'
  }
];

// ─── UTILS & ANIMATIONS ──────────────────────────────────────────

const SPRING_CONFIG = { stiffness: 400, damping: 25, mass: 0.8 };
const SLOW_SPRING = { stiffness: 200, damping: 30, mass: 1.2 };

// Custom hook for magnetic cursor effect
function useMagnetic(ref: React.RefObject<HTMLElement | null>, strength: number = 0.2) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, SPRING_CONFIG);
  const springY = useSpring(y, SPRING_CONFIG);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      // Calculate distance from center of element
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      
      // Only magnetize if within a certain radius (e.g., 100px)
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
      if (distance < 100) {
        x.set(distanceX * strength);
        y.set(distanceY * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, strength, x, y]);

  return { x: springX, y: springY };
}

// ─── MINI PREVIEWS ────────────────────────────────────────────────
// Extremely lightweight SVG animations for the hover panels
const LivePreview = ({ id }: { id: string }) => {
  if (id === 'threats') {
    return (
      <div className="w-full h-16 rounded overflow-hidden relative bg-black/40 border border-cyber-cyan/10">
        <motion.div 
          animate={{ x: [0, -100] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 flex items-center gap-2 px-2"
        >
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-6 w-16 bg-red-500/20 border border-red-500/50 rounded flex-shrink-0" />
          ))}
        </motion.div>
      </div>
    );
  }
  if (id === 'scanner') {
    return (
      <div className="w-full h-16 rounded overflow-hidden relative bg-black/40 border border-cyber-cyan/10 flex items-center justify-center">
         <motion.div 
           animate={{ scale: [1, 2], opacity: [1, 0] }}
           transition={{ repeat: Infinity, duration: 1.5 }}
           className="absolute w-8 h-8 rounded-full border border-cyber-cyan"
         />
         <ScanSearch size={16} className="text-cyber-cyan relative z-10" />
      </div>
    );
  }
  return (
    <div className="w-full h-16 rounded overflow-hidden relative bg-black/40 border border-cyber-cyan/10 flex items-end gap-1 p-2">
      {[40, 70, 30, 90, 50, 80].map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: [`${h}%`, `${Math.random() * 100}%`, `${h}%`] }}
          transition={{ repeat: Infinity, duration: 2 + i * 0.2 }}
          className="flex-1 bg-cyber-cyan/40 rounded-t-sm"
        />
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────

export function BouquetNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Global magnetic pull for the entire cluster
  const { x: globalX, y: globalY } = useMagnetic(containerRef, 0.05);

  if (location.pathname === '/') return null;

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNavigate = (path: string) => {
    // If we have page transitions set up, we could add delays here
    setIsOpen(false);
    navigate(path);
  };

  // Radial positions for the open state (hand-crafted organic offsets)
  // Indices: 0: center (trigger), 1-5: surrounding petals
  const getOpenPosition = (index: number) => {
    if (!isOpen) return { x: 0, y: 0, scale: 0.9, opacity: 0 };
    
    // Fan out in a perfect quarter-circle towards Top-Left
    const offsets = [
      { x: 0, y: 0 },         // 0 (Trigger)
      { x: -100, y: 0 },      // 1 Left
      { x: -92, y: -38 },     // 2
      { x: -71, y: -71 },     // 3 Top Left
      { x: -38, y: -92 },     // 4
      { x: 0, y: -100 },      // 5 Top
    ];
    
    return { 
      x: offsets[index].x, 
      y: offsets[index].y, 
      scale: 1, 
      opacity: 1 
    };
  };

  // Closed state positions (2 rows of 3 overlapping)
  const getClosedPosition = (index: number) => {
    if (isOpen) return null; // handled by open state
    
    // All elements hide perfectly behind the trigger
    const isTrigger = index === 0;
    return {
      x: 0,
      y: 0,
      scale: isTrigger ? 1 : 0,
      opacity: isTrigger ? 1 : 0,
      zIndex: isTrigger ? 30 : 10
    };
  };

  return (
    <div 
      className="fixed bottom-12 right-12 z-[9999] pointer-events-none"
      style={{ perspective: 1000 }}
    >
      <motion.div 
        ref={containerRef}
        style={{ x: globalX, y: globalY }}
        className="relative w-16 h-16 flex items-center justify-center pointer-events-auto"
      >
        
        {/* Background Blur Overlay when open */}
        <AnimatePresence>
          {isOpen && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/20 backdrop-blur-[2px] -z-10"
               style={{ width: '100vw', height: '100vh', left: '-calc(100vw - 100%)', top: '-2rem' }}
               onClick={() => setIsOpen(false)}
             />
          )}
        </AnimatePresence>

        {/* The 6 Buttons */}
        {NAV_ITEMS.map((item, i) => {
          const isTrigger = i === 0;
          const openProps = getOpenPosition(i);
          const closedProps = getClosedPosition(i);
          
          const isHovered = hoveredId === item.id;
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.id}
              onClick={() => isTrigger && !isOpen ? toggleMenu() : handleNavigate(item.path)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              initial={false}
              animate={isOpen ? {
                x: openProps.x,
                y: openProps.y,
                scale: isHovered ? 1.15 : openProps.scale,
                opacity: openProps.opacity,
                zIndex: isHovered ? 50 : 40,
                rotate: isHovered ? 5 : 0
              } : {
                x: closedProps?.x,
                y: closedProps?.y,
                scale: isHovered && isTrigger ? 1.08 : closedProps?.scale,
                opacity: closedProps?.opacity,
                zIndex: closedProps?.zIndex,
                rotate: 0
              }}
              transition={isOpen 
                ? { type: "spring", ...SPRING_CONFIG, delay: i * 0.05 } 
                : { type: "spring", ...SLOW_SPRING, delay: (5 - i) * 0.04 }
              }
              whileTap={{ scale: 0.9 }}
              className={`absolute w-14 h-14 rounded-full flex items-center justify-center cursor-pointer overflow-hidden border
                ${isTrigger 
                  ? 'border-cyber-cyan/50 shadow-[0_0_20px_rgba(0,255,136,0.3)]' 
                  : 'border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.5)]'
                }
              `}
              style={{
                // Frosted matte glassmorphism (lighter for visibility)
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(0,255,136,0.3) 0%, rgba(0,100,50,0.5) 100%)' 
                  : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: isHovered 
                  ? 'inset 0 0 20px rgba(255,255,255,0.15), 0 10px 30px rgba(0,0,0,0.5)' 
                  : 'inset 0 0 10px rgba(255,255,255,0.05), 0 4px 15px rgba(0,0,0,0.3)'
              }}
            >
              {/* Idle Breathing & Reflections */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"
                animate={!isOpen && isTrigger ? {
                  opacity: [0.3, 0.6, 0.3],
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className={`relative z-10 ${isTrigger || isActive ? 'text-cyber-cyan' : 'text-gray-400'}`}>
                {item.icon}
              </div>
            </motion.button>
          );
        })}

        {/* Intelligent Hover Panels */}
        <AnimatePresence>
          {isOpen && hoveredId && (
            <motion.div
              key="hover-panel"
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: -160, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 0, filter: 'blur(10px)' }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="absolute right-full top-0 w-64 rounded-xl border border-white/10 p-4 shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, rgba(20,25,32,0.95) 0%, rgba(10,12,15,0.98) 100%)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {NAV_ITEMS.map(item => item.id === hoveredId && (
                <div key={item.id} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="text-cyber-cyan">{item.icon}</span>
                    <h3 className="text-sm font-bold tracking-wide uppercase text-white">{item.label}</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Live Preview Block */}
                  <div className="mt-1">
                    <LivePreview id={item.id} />
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{item.stats}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-cyber-cyan shadow-[0_0_8px_rgba(0,255,136,0.6)] animate-pulse'}`} />
                      <span className="text-[10px] font-mono text-white uppercase">{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
