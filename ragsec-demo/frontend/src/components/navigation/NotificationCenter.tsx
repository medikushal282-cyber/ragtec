import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShieldAlert, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationsRead, openDrawer, threats } = useApp();

  if (!isOpen) return null;

  const handleNotificationClick = (threatId?: string) => {
    if (threatId) {
      const match = threats.find((t) => t.id === threatId);
      if (match) {
        openDrawer(match);
      }
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-14 right-8 w-80 bg-cyber-dark/95 border border-cyber-cyan/30 rounded-xl shadow-2xl z-[9999] overflow-hidden backdrop-blur-xl"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyber-cyan" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Alert Center</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markNotificationsRead}
              title="Mark all read"
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n.threat_id)}
                className={`p-3 text-xs cursor-pointer hover:bg-cyber-cyan/10 transition-colors flex items-start gap-3 ${
                  !n.read ? 'bg-red-500/5' : ''
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-critical shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-gray-200 font-medium leading-tight">{n.message}</p>
                  <span className="mono text-[9px] text-gray-500 block">{n.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-gray-500">No critical notifications.</div>
          )}
        </div>

        <div className="p-3 bg-black/40 border-t border-white/10 text-center">
          <span className="mono text-[10px] text-cyber-cyan">REAL-TIME CISA THREAT MONITORING</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
