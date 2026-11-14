import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  X, 
  Folder, 
  WifiOff, 
  ExternalLink, 
  Laptop, 
  Clock, 
  AlertTriangle,
  Sparkles,
  ChevronRight
} from "lucide-react";

export interface FleetThreatNotificationItem {
  id: string;
  device_id: string;
  hostname: string;
  ip_address: string;
  threat_name: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | string;
  description: string;
  file_path: string;
  timestamp: string;
  os_type?: string;
  segment?: string;
}

interface FloatingPearlescentNotificationProps {
  notifications: FleetThreatNotificationItem[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onInspectSandbox?: (item: FleetThreatNotificationItem) => void;
  onIsolateDevice?: (item: FleetThreatNotificationItem) => void;
}

export const FloatingPearlescentNotification: React.FC<FloatingPearlescentNotificationProps> = ({
  notifications,
  onDismiss,
  onDismissAll,
  onInspectSandbox,
  onIsolateDevice
}) => {
  if (notifications.length === 0) return null;

  return (
    <div 
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-[calc(100vw-2.5rem)] sm:w-[430px] pointer-events-none select-none"
      role="region"
      aria-label="Fleet Threat Notifications"
    >
      {/* Dismiss All Header if multiple alerts */}
      {notifications.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-[11px] text-slate-300 pointer-events-auto shadow-lg"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span className="text-white font-semibold">{notifications.length} Active Fleet Threat Alerts</span>
          </div>
          <button
            onClick={onDismissAll}
            className="text-[10px] text-slate-400 hover:text-white underline transition-colors"
          >
            Dismiss All
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        {notifications.slice(0, 3).map((item) => {
          const isCritical = (item.severity || "").toUpperCase() === "CRITICAL";

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -25, x: 50, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.22, ease: "easeInOut" } }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="pointer-events-auto pearlescent-surface pearlescent-sheen p-4.5 rounded-2xl border border-white/80 shadow-[0_22px_45px_-8px_rgba(0,0,0,0.5),0_0_35px_rgba(215,235,255,0.45),inset_0_1px_2px_rgba(255,255,255,0.95)] overflow-hidden transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 246, 255, 0.92) 25%, rgba(255, 238, 250, 0.94) 62%, rgba(235, 250, 255, 0.97) 100%)",
              }}
            >
              {/* Top Accent Rim Bar */}
              <div 
                className={`h-1 w-full -mt-4.5 -mx-4.5 mb-3.5 ${
                  isCritical 
                    ? "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500" 
                    : "bg-gradient-to-r from-amber-500 via-blue-500 to-indigo-500"
                }`}
              />

              {/* Header Row: Threat Radar Icon + Title + Severity Pill + Dismiss (X) Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    isCritical 
                      ? "bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-300/60" 
                      : "bg-amber-500 text-white shadow-amber-500/30 ring-2 ring-amber-300/60"
                  }`}>
                    <ShieldAlert className="w-4 h-4 animate-pulse" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 font-mono">
                        FLEET ENCLAVE THREAT
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                        isCritical 
                          ? "bg-rose-500 text-white" 
                          : "bg-amber-500 text-white"
                      }`}>
                        {item.severity || "CRITICAL"}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                      {item.threat_name}
                    </h4>
                  </div>
                </div>

                {/* Dismiss (X) Button */}
                <button
                  onClick={() => onDismiss(item.id)}
                  className="p-1 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 transition-all apple-button flex-shrink-0 shadow-sm"
                  title="Dismiss notification"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Threat Description & Details */}
              <p className="text-[11px] text-slate-700 mt-2 leading-relaxed font-normal">
                {item.description}
              </p>

              {/* Endpoint Telemetry Pill & File Path */}
              <div className="mt-2.5 p-2 rounded-xl bg-white/70 border border-slate-200/80 space-y-1 text-[11px] shadow-sm">
                <div className="flex items-center justify-between text-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Laptop className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.hostname}</span>
                    <span className="text-slate-500 font-mono text-[10px]">({item.ip_address})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {item.timestamp ? (new Date(item.timestamp).toLocaleTimeString() !== "Invalid Date" ? new Date(item.timestamp).toLocaleTimeString() : item.timestamp) : "Just now"}
                  </span>
                </div>

                {item.file_path && (
                  <div className="text-[10px] font-mono text-slate-600 truncate pt-0.5 border-t border-slate-200/60">
                    <span className="text-slate-400">Sandbox Path:</span> <code className="text-slate-800 font-semibold">{item.file_path}</code>
                  </div>
                )}
              </div>

              {/* Action Buttons: Inspect Sandbox & Isolate Endpoint */}
              <div className="mt-3 flex items-center gap-2 pt-1 border-t border-slate-200/60">
                {onInspectSandbox && (
                  <button
                    onClick={() => onInspectSandbox(item)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/20 apple-button transition-all"
                  >
                    <Folder className="w-3 h-3 text-cyan-300" />
                    <span>Inspect Sandbox ↗</span>
                  </button>
                )}

                {onIsolateDevice && (
                  <button
                    onClick={() => onIsolateDevice(item)}
                    className="py-1.5 px-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 font-semibold text-[11px] flex items-center gap-1 apple-button transition-all"
                    title="Cut all network access for this endpoint"
                  >
                    <WifiOff className="w-3 h-3" />
                    <span>Isolate</span>
                  </button>
                )}

                <button
                  onClick={() => onDismiss(item.id)}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-medium text-[11px] apple-button transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
