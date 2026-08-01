import React, { useState, useMemo, useEffect } from 'react';
import { DitherShader } from './ui/dither-shader';
import { Threat } from '../lib/api';
import { Link } from 'react-router-dom';
import { X, ExternalLink, Radio, Info } from 'lucide-react';

const SEVERITY_ICONS: { [key: string]: { path: string; label: string; color: string } } = {
  'zero-day': { path: '/pixel_icons/pixel_3.png', label: 'Zero-Day Attack', color: '#ff0066' },
  'critical': { path: '/pixel_icons/pixel_4.png', label: 'Critical Incident', color: '#ff3344' },
  'high': { path: '/pixel_icons/pixel_1.png', label: 'High Priority Alert', color: '#ffaa00' },
  'medium': { path: '/pixel_icons/pixel_2.png', label: 'Medium Advisory', color: '#00f0ff' },
  'low': { path: '/pixel_icons/pixel_5.png', label: 'Low / Contained', color: '#00ff88' },
};

function getIconFilter(path: string) {
  if (path.includes('pixel_1.png')) {
    // Warning Sign Triangle: Keep original colors!
    return 'none';
  }
  if (path.includes('pixel_4.png')) {
    // Cross X-Mark: Make Red!
    return 'brightness(0) saturate(100%) invert(25%) sepia(90%) saturate(6000%) hue-rotate(350deg)';
  }
  // Others: Pure Solid White!
  return 'brightness(0) invert(1)';
}

export default function GlobalThreatMap({ threats }: { threats: Threat[] }) {
  const [activeMarker, setActiveMarker] = useState<any | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [networkFlags, setNetworkFlags] = useState<any[]>([]);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/threats/flags');
        if (res.ok) {
          const data = await res.json();
          setNetworkFlags(data);
        }
      } catch(e) {}
    };
    fetchFlags();
    const interval = setInterval(fetchFlags, 5000);
    return () => clearInterval(interval);
  }, []);

  // Map markers tied to specific severity level icons
  const markers = useMemo(() => {
    const baseMarkers = threats.map((t) => {
      const hash = t.id.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      const regions = [
        { x: 24, y: 34, origin: 'North America (US-EAST)' },
        { x: 33, y: 64, origin: 'South America (SA-BRAZIL)' },
        { x: 51, y: 28, origin: 'Europe (EU-FRANKFURT)' },
        { x: 53, y: 56, origin: 'Africa (AF-JOHANNESBURG)' },
        { x: 74, y: 34, origin: 'Asia Pacific (AP-TOKYO)' },
        { x: 83, y: 71, origin: 'Oceania (AU-SYDNEY)' },
        { x: 67, y: 46, origin: 'South Asia (IN-MUMBAI)' },
      ];
      const region = regions[Math.abs(hash) % regions.length];
      const xPct = Math.min(92, Math.max(8, region.x + (hash % 6)));
      const yPct = Math.min(85, Math.max(12, region.y + ((hash >> 4) % 6)));

      // Determine severity key
      const sevKey = t.severity?.toLowerCase() || 'medium';
      const iconConfig = SEVERITY_ICONS[sevKey] || SEVERITY_ICONS['medium'];

      return {
        id: t.id,
        name: t.name || t.type || 'Unknown Threat Signal',
        type: t.type || 'Cyber Incident',
        severity: t.severity || 'Medium',
        origin: region.origin,
        iconConfig,
        xPct,
        yPct,
      };
    });

    const flagMarkers = networkFlags.map((f) => {
      const sevKey = f.severity?.toLowerCase() || 'medium';
      const iconConfig = SEVERITY_ICONS[sevKey] || SEVERITY_ICONS['medium'];
      
      // Calculate x, y based on lat/long pseudo-mapping
      const xPct = Math.min(95, Math.max(5, ((f.longitude + 180) / 360) * 100));
      const yPct = Math.min(90, Math.max(10, ((90 - f.latitude) / 180) * 100));

      return {
        id: f.id,
        name: f.flag_type || 'Network Anomaly',
        type: 'Network Flag',
        severity: f.severity || 'Medium',
        origin: f.source_ip + ' -> ' + f.destination_ip,
        iconConfig,
        xPct,
        yPct,
      };
    });

    const allMarkers = [...baseMarkers, ...flagMarkers];
    // Limit to 50 items max to prevent DOM overhead
    return allMarkers.slice(0, 50);
  }, [threats, networkFlags]);

  // Format markers array for DitherShader canvas light circles under the dither
  const ditheredLightMarkers = useMemo(() => {
    return markers.map((m) => ({
      xPct: m.xPct,
      yPct: m.yPct,
      color: m.iconConfig.color,
    }));
  }, [markers]);

  return (
    <div className="w-full h-full min-h-[380px] aspect-[1009/665] relative flex flex-col items-center justify-center bg-[#040914] rounded-xl overflow-hidden group border border-white/10 shadow-2xl">
      {/* Animated Dither Shader World Threat Matrix Background */}
      <div className="absolute inset-0 w-full h-full">
        <DitherShader
          src="/world.svg"
          gridSize={2}
          ditherMode="noise"
          colorMode="duotone"
          invert={false}
          animated={true}
          animationSpeed={0.02}
          primaryColor="#040914"
          secondaryColor="#00f0ff"
          threshold={0.35}
          className="w-full h-full"
          markers={ditheredLightMarkers}
        />
      </div>

      {/* Static Crisp 8-Bit Pixelated Circle Outline Overlay (No Pulse Animation) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {markers.map((marker) => {
          const isSelected = activeMarker?.id === marker.id;

          return (
            <div
              key={marker.id}
              style={{
                transform: `translate3d(calc(${marker.xPct}cqi - 50%), calc(${marker.yPct}cqh - 50%), 0)`,
                willChange: 'transform',
                left: `${marker.xPct}%`,
                top: `${marker.yPct}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group/marker"
            >
              {/* Tight Micro Button Container */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMarker(isSelected ? null : marker);
                }}
                className={`relative w-4 h-4 flex items-center justify-center bg-transparent border-none focus:outline-none cursor-pointer transition-transform duration-150 ${
                  isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                }`}
                style={{ willChange: 'transform' }}
                title={`${marker.id}: ${marker.name} [${marker.severity}]`}
              >
                {/* Static Stepped 8-Bit Pixel Circle Outline SVG (Tight 1-2px Gap, Static) */}
                <svg
                  viewBox="0 0 16 16"
                  className="absolute inset-0 w-full h-full opacity-90 transition-opacity"
                  style={{
                    color: marker.iconConfig.color,
                    imageRendering: 'pixelated',
                    filter: `drop-shadow(0 0 1px ${marker.iconConfig.color})`,
                  }}
                >
                  <path
                    d="M 5 1 H 11 V 2 H 13 V 3 H 14 V 5 H 15 V 11 H 14 V 13 H 13 V 14 H 11 V 15 H 5 V 14 H 3 V 13 H 2 V 11 H 1 V 5 H 2 V 3 H 3 V 2 H 5 Z
                       M 5 2 H 3 V 3 H 2 V 5 H 2 V 11 H 3 V 13 H 5 V 14 H 11 V 13 H 13 V 11 H 14 V 5 H 13 V 3 H 11 V 2 Z"
                    fill="currentColor"
                  />
                </svg>

                {/* Micro Pixel Icon Centered in Static 8-Bit Pixel Circle */}
                <img
                  src={marker.iconConfig.path}
                  alt={marker.severity}
                  className="w-2 h-2 object-contain relative z-10"
                  style={{
                    imageRendering: 'pixelated',
                    filter: getIconFilter(marker.iconConfig.path),
                  }}
                />
              </button>

              {/* Interactive Threat Info Popover */}
              {isSelected && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl p-3.5 shadow-2xl text-xs font-mono z-40 animate-in fade-in zoom-in-95 duration-150">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-2 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-cyber-cyan animate-pulse" />
                      <span
                        className="text-[9px] uppercase font-bold px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: `${marker.iconConfig.color}20`,
                          color: marker.iconConfig.color,
                          borderColor: `${marker.iconConfig.color}40`,
                        }}
                      >
                        {marker.severity}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveMarker(null)}
                      className="text-gray-400 hover:text-white transition-colors p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Threat Details */}
                  <div className="space-y-1.5 mb-3 text-left">
                    <div className="font-bold text-white text-xs truncate">{marker.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">ID: {marker.id}</div>
                    <div className="text-[10px] text-gray-300 flex items-center gap-1">
                      <span className="text-gray-500">TYPE:</span> {marker.type}
                    </div>
                    <div className="text-[10px] text-gray-300 flex items-center gap-1">
                      <span className="text-gray-500">ORIGIN:</span> {marker.origin}
                    </div>
                  </div>

                  {/* Action Link */}
                  <Link
                    to="/app/investigation"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-cyber-cyan hover:bg-cyber-cyan/80 text-black rounded text-[10px] font-bold uppercase transition-all shadow-lg"
                  >
                    <span>Investigate Threat</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend Button & Arrowless Tooltip Popup */}
      <div className="absolute bottom-3 left-4 z-30">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-[10px] font-mono text-gray-300 hover:text-white transition-colors shadow-lg"
        >
          <Info className="w-3 h-3 text-cyber-cyan" />
          <span>Legend</span>
        </button>

        {/* Legend Tooltip Popup (No Arrow) */}
        {showLegend && (
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl text-[10px] font-mono space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-[9px] uppercase font-bold text-gray-400 border-b border-white/10 pb-1">
              Severity Indicator Legend
            </div>
            {Object.entries(SEVERITY_ICONS).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2 text-gray-300">
                <img
                  src={config.path}
                  alt={config.label}
                  className="w-2.5 h-2.5 object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    filter: getIconFilter(config.path),
                  }}
                />
                <span className="capitalize text-[10px] font-medium" style={{ color: config.color }}>
                  {config.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
