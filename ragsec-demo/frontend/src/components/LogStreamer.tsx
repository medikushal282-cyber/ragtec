import React, { useEffect, useState, useRef } from 'react';

const LOG_TEMPLATES = [
  "[SIEM] INGRESS Blocked | IP: {ip} | Port: {port} | Protocol: TCP",
  "[AUTH] Failed login attempt | User: root | Source: {ip}",
  "[WAF] XSS Payload Detected | URI: /api/v1/auth | Action: DROP",
  "[IDS] Anomalous lateral movement detected | Source: 10.0.4.12 | Target: {ip}",
  "[SYS] High CPU utilization on DB-01 | Value: 94%",
];

const generateRandomIp = () => `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;

export default function LogStreamer() {
  const [logs, setLogs] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      const log = `[${new Date().toISOString()}] ${template.replace('{ip}', generateRandomIp()).replace('{port}', Math.floor(Math.random() * 65535).toString())}`;
      
      setLogs(prev => {
        const newLogs = [...prev, log];
        return newLogs.slice(-50); // Keep last 50
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full bg-black/80 rounded-xl border border-dashed border-white/10 p-4 font-mono text-[10px] sm:text-xs overflow-hidden flex flex-col relative group">
      <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10"></div>
      
      <div ref={containerRef} className="flex-1 overflow-y-hidden custom-scrollbar space-y-1 text-outline">
        {logs.map((log, i) => {
            const isError = log.includes("Blocked") || log.includes("Failed") || log.includes("DROP");
            const isWarn = log.includes("High") || log.includes("Anomalous");
            const colorClass = isError ? 'text-secondary-container' : isWarn ? 'text-secondary' : 'text-primary-fixed';
            
            return (
                <div key={i} className={`opacity-80 transition-opacity hover:opacity-100 ${colorClass}`}>
                  {log}
                </div>
            );
        })}
      </div>
    </div>
  );
}
