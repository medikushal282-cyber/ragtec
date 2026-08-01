import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Threat, Notification, SystemStatus, fetchInitialThreats, fetchNotifications, createThreatSocket, fetchSystemStatus } from '../lib/api';

interface AppContextType {
  threats: Threat[];
  notifications: Notification[];
  unreadNotificationCount: number;
  systemStatus: SystemStatus | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  activeThreat: Threat | null; // Selected threat for investigation drawer
  isDrawerOpen: boolean;
  openDrawer: (threat: Threat) => void;
  closeDrawer: () => void;
  markNotificationsRead: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [activeThreat, setActiveThreat] = useState<Threat | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchInitialThreats()
      .then(setThreats)
      .catch((err) => console.error('Failed to load initial threats', err));

    fetchNotifications()
      .then(setNotifications)
      .catch(() => {});

    fetchSystemStatus()
      .then(setSystemStatus)
      .catch(() => {});
  }, []);

  // Real-time WebSocket connection
  useEffect(() => {
    setConnectionStatus('connecting');
    const ws = createThreatSocket((newThreat) => {
      setConnectionStatus('connected');
      setThreats((prev) => [newThreat, ...prev].slice(0, 100)); // Keep latest 100

      // Auto-generate notification for Critical threats
      if (newThreat.severity?.toLowerCase() === 'critical') {
        const newNotif: Notification = {
          id: `notif-${Date.now()}`,
          type: 'CRITICAL_ALERT',
          message: `CRITICAL: ${newThreat.id} - ${newThreat.name || newThreat.type}`,
          threat_id: newThreat.id,
          severity: newThreat.severity,
          timestamp: newThreat.ts || new Date().toLocaleTimeString(),
          read: false,
        };
        setNotifications((prev) => [newNotif, ...prev]);
        setActiveToast(newNotif);
        setTimeout(() => setActiveToast(null), 4000);
      }
    });

    ws.onopen = () => setConnectionStatus('connected');
    ws.onclose = () => setConnectionStatus('disconnected');

    return () => {
      ws.close();
    };
  }, []);

  const openDrawer = useCallback((threat: Threat) => {
    setActiveThreat(threat);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        threats,
        notifications,
        unreadNotificationCount,
        systemStatus,
        connectionStatus,
        activeThreat,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        markNotificationsRead,
        sidebarOpen,
        setSidebarOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
      }}
    >
      {children}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-secondary-container/90 border border-secondary-container text-black font-bold p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <span className="material-symbols-outlined text-[24px]">warning</span>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-black/70">CRITICAL WEBSOCKET ALERT</div>
            <div className="text-xs">{activeToast.message}</div>
          </div>
          <button onClick={() => setActiveToast(null)} className="ml-4 hover:opacity-70">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
