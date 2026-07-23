import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  Activity, 
  Target, 
  ScanSearch, 
  Database, 
  Settings 
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Command Center', icon: <Activity size={20} />, path: '/app/dashboard' },
  { id: 'threats', label: 'Threat Intel', icon: <ShieldAlert size={20} />, path: '/app/threats' },
  { id: 'incidents', label: 'Incident Response', icon: <Target size={20} />, path: '/app/incidents' },
  { id: 'scanner', label: 'Scanner', icon: <ScanSearch size={20} />, path: '/app/scanner' },
  { id: 'forensics', label: 'Forensics', icon: <Database size={20} />, path: '/app/forensics' },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/app/settings' }
];

// SVG Annular Sector Math
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle - 1); // -1 and +1 for tiny gap between slices
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle + 1);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle - 1);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle + 1);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    "Z"
  ].join(" ");
}

export function RadialContextMenu() {
  const [menuState, setMenuState] = useState({ isOpen: false, x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Hide on landing page completely
    if (location.pathname === '/') {
      setMenuState(s => ({ ...s, isOpen: false }));
      return;
    }

    const handleContextMenu = (e: MouseEvent) => {
      // Allow default context menu if Shift is held
      if (e.shiftKey) return;
      
      e.preventDefault();
      
      // Calculate coordinates, keeping menu fully on screen
      const menuRadius = 160; 
      let x = e.clientX;
      let y = e.clientY;
      
      // Screen bounds clamping
      if (x < menuRadius) x = menuRadius;
      if (y < menuRadius) y = menuRadius;
      if (x > window.innerWidth - menuRadius) x = window.innerWidth - menuRadius;
      if (y > window.innerHeight - menuRadius) y = window.innerHeight - menuRadius;

      setMenuState({ isOpen: true, x, y });
    };

    const handleClickOutside = () => {
      setMenuState(s => ({ ...s, isOpen: false }));
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [location.pathname]);

  const handleSliceClick = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuState(s => ({ ...s, isOpen: false }));
    navigate(path);
  };

  if (!menuState.isOpen) return null;

  const INNER_RADIUS = 40;
  const OUTER_RADIUS = 140;
  const CENTER_X = OUTER_RADIUS;
  const CENTER_Y = OUTER_RADIUS;
  const SIZE = OUTER_RADIUS * 2;
  const SLICE_ANGLE = 360 / NAV_ITEMS.length;

  return (
    <div 
      className="fixed z-[99999]"
      style={{
        left: menuState.x - CENTER_X,
        top: menuState.y - CENTER_Y,
        width: SIZE,
        height: SIZE,
      }}
      onContextMenu={(e) => e.preventDefault()} // Prevent normal menu over our menu
    >
      {/* Background Overlay just for drop shadow */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          background: 'rgba(10, 12, 15, 0.5)',
        }}
      />

      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative z-10">
        {/* SVG Defs (if needed later) */}
        <defs></defs>

        <AnimatePresence>
          {NAV_ITEMS.map((item, i) => {
            const startAngle = i * SLICE_ANGLE - 30; // -30 to center first item at top
            const endAngle = startAngle + SLICE_ANGLE;
            const pathD = describeArc(CENTER_X, CENTER_Y, INNER_RADIUS, OUTER_RADIUS, startAngle, endAngle);
            
            // Icon positioning math
            const midAngle = startAngle + SLICE_ANGLE / 2;
            const iconRadius = INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) / 2;
            const iconPos = polarToCartesian(CENTER_X, CENTER_Y, iconRadius, midAngle);
            
            const isHovered = hoveredIndex === i;
            
            // Layered animation stagger: group 1 (even index) vs group 2 (odd index)
            const animationDelay = (i % 2 === 0) ? 0 : 0.05;

            return (
              <motion.g
                key={item.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: animationDelay }}
                style={{ transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
                onClick={(e: any) => handleSliceClick(item.path, e)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* The Wedge */}
                <path
                  d={pathD}
                  fill={isHovered ? 'rgba(0, 255, 136, 0.15)' : 'rgba(20, 24, 30, 0.9)'}
                  stroke={isHovered ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
                  strokeWidth="1.5"
                  style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                />

                {/* The Icon & Text */}
                <g 
                  transform={`translate(${iconPos.x}, ${iconPos.y})`}
                  style={{ transition: 'transform 0.2s', transform: isHovered ? `translate(${iconPos.x}px, ${iconPos.y}px) scale(1.1)` : `translate(${iconPos.x}px, ${iconPos.y}px) scale(1)` }}
                >
                  <g transform="translate(-10, -16)" style={{ color: isHovered ? '#00ff88' : '#8e8e9f' }}>
                    {/* SVG Icon Injection via React Node -> SVG requires foreignObject to render lucide cleanly, or we map it */}
                  </g>
                  <foreignObject x="-40" y="-18" width="80" height="40" style={{ pointerEvents: 'none' }}>
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <span className={`transition-colors duration-200 ${isHovered ? 'text-cyber-cyan filter drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]' : 'text-gray-400'}`}>
                        {item.icon}
                      </span>
                      {isHovered && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white mt-1 text-center leading-tight">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </foreignObject>
                </g>
              </motion.g>
            );
          })}

          {/* Center Hub */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
            className="pointer-events-none"
          >
            <circle 
              cx={CENTER_X} 
              cy={CENTER_Y} 
              r={INNER_RADIUS - 4} 
              fill="rgba(10, 12, 15, 0.95)" 
              stroke="rgba(0, 255, 136, 0.3)" 
              strokeWidth="2"
            />
            {/* Center dot/logo */}
            <circle 
              cx={CENTER_X} 
              cy={CENTER_Y} 
              r={4} 
              fill="#00ff88"
            />
          </motion.g>
        </AnimatePresence>
      </svg>
    </div>
  );
}
