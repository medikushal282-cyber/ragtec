import React from "react";
import { ThreatSeverity, ThreatStatus, ThreatCategory } from "../types/soc";

export const SeverityBadge: React.FC<{ severity: any; className?: string }> = ({ severity, className = "" }) => {
  let sev = "MEDIUM";
  if (typeof severity === "string") {
    sev = severity.toUpperCase();
  } else if (severity && typeof severity === "object") {
    sev = (severity.value || "MEDIUM").toUpperCase();
  }

  switch (sev) {
    case "CRITICAL":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold tracking-wider uppercase ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
          CRITICAL
        </span>
      );
    case "HIGH":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-semibold tracking-wider uppercase ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          HIGH
        </span>
      );
    case "MEDIUM":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[10px] font-semibold tracking-wider uppercase ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
          MEDIUM
        </span>
      );
    case "LOW":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono text-[10px] tracking-wider uppercase ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
          LOW
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 font-mono text-[10px] uppercase ${className}`}>
          {sev || "INFO"}
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: any; className?: string }> = ({ status, className = "" }) => {
  let st = "UNKNOWN";
  if (typeof status === "string") {
    st = status.toUpperCase();
  } else if (status && typeof status === "object") {
    st = (status.value || "UNKNOWN").toUpperCase();
  }

  switch (st) {
    case "THREAT":
    case "ACTIVE":
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-mono text-[10px] font-bold uppercase tracking-wider ${className}`}>
          {st}
        </span>
      );
    case "SUSPICIOUS":
    case "INVESTIGATING":
    case "WARNING":
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-mono text-[10px] font-semibold uppercase tracking-wider ${className}`}>
          {st}
        </span>
      );
    case "SAFE":
    case "ONLINE":
    case "CONTAINED":
    case "RESOLVED":
    case "APPROVED":
    case "VERIFIED":
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold uppercase tracking-wider ${className}`}>
          ✓ {st}
        </span>
      );
    case "ISOLATED":
    case "QUARANTINED":
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-bold uppercase tracking-wider ${className}`}>
          ⚑ {st}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 font-mono text-[10px] uppercase ${className}`}>
          {st || "UNKNOWN"}
        </span>
      );
  }
};

export const CategoryTag: React.FC<{ category: any; className?: string }> = ({ category, className = "" }) => {
  let cat = "Security";
  if (typeof category === "string") {
    cat = category;
  } else if (category && typeof category === "object") {
    cat = category.value || "Security";
  }

  const isMalware = cat.toLowerCase().includes("malware") || cat.toLowerCase().includes("trojan");
  const isRansomware = cat.toLowerCase().includes("ransomware");
  const isScript = cat.toLowerCase().includes("script");
  const isExfil = cat.toLowerCase().includes("theft") || cat.toLowerCase().includes("exfiltration");

  const badgeColor = isRansomware
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : isMalware
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : isScript
    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
    : isExfil
    ? "bg-purple-50 text-purple-700 border-purple-200"
    : "bg-neutral-100 text-neutral-700 border-neutral-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold border ${badgeColor} ${className}`}>
      {cat}
    </span>
  );
};
