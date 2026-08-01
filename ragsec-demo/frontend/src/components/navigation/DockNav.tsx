import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Activity, Package, Cpu, ScrollText, Settings, Server } from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '../ui/dock';

const iconMap: Record<string, any> = {
  'dashboard': Home,
  'monitoring': Activity,
  'search': Package,
  'smart_toy': Cpu,
  'manage_search': ScrollText,
  'settings': Settings,
  'dns': Server, // For Enterprise Network
};

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export function DockNav({ items }: { items: NavItem[] }) {
  const location = useLocation();

  return (
    <div className='flex items-center justify-center z-50'>
      <Dock className='items-center py-2 px-6'>
        {items.map((item, idx) => {
          const isActive = location.pathname.includes(item.path);
          const Icon = iconMap[item.icon] || Home;

          return (
            <Link key={idx} to={item.path} className="group relative flex flex-col items-center">
              {/* Bottom Glowing Indicator */}
              <div 
                className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)] rounded-full transition-opacity duration-300 z-10 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`} 
              />

              <DockItem
                className="relative aspect-square rounded-full transition-colors border-none bg-[var(--icon-bg)]"
              >
                {/* Active Solid Border */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full border border-[var(--accent)] shadow-[0_0_15px_var(--accent-glow)]" />
                )}
                
                {/* Hover Spinning Dashed Border */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--accent)] opacity-0 group-hover:opacity-100 group-hover:animate-[spin-dash_8s_linear_infinite]" />
                )}

                <DockLabel>{item.label}</DockLabel>
                <DockIcon>
                  <Icon 
                    strokeWidth={1.5}
                    className={`w-6 h-6 transition-colors relative z-10 ${
                      isActive ? 'text-[var(--text-bright)]' : 'text-[var(--text-mid)] group-hover:text-[var(--text-bright)]'
                    }`}
                  />
                </DockIcon>
              </DockItem>
            </Link>
          );
        })}
      </Dock>
    </div>
  );
}
