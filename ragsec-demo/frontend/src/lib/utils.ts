import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Utility: Tailwind class merger ──────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── API Base URL ────────────────────────────────────────────────────────────
export const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
export const WS_BASE = API_BASE.replace(/^http/, 'ws');

// ─── Formatting ──────────────────────────────────────────────────────────────
export function formatTimestamp(ts: string | undefined): string {
  if (!ts) return 'Unknown';
  // If it looks like a date string, format it
  try {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {}
  return ts;
}

export function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateStr;
  }
}

export function formatCVE(id: string): string {
  if (id.startsWith('CVE-')) return id;
  return id;
}

// ─── Severity Helpers ────────────────────────────────────────────────────────
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'resolved' | 'unknown';

export function normalizeSeverity(severity: string | undefined): SeverityLevel {
  const s = severity?.toLowerCase()?.trim();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  if (s === 'medium') return 'medium';
  if (s === 'low') return 'low';
  if (s === 'resolved') return 'resolved';
  return 'unknown';
}

export function severityColor(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    critical: '#ff003c',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
    resolved: '#22c55e',
    unknown: '#8e8e9f',
  };
  return map[severity] || map.unknown;
}

export function severityOrder(severity: SeverityLevel): number {
  const map: Record<SeverityLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    resolved: 4,
    unknown: 5,
  };
  return map[severity] ?? 5;
}

export function severityBgClass(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-400',
    high: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    low: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    resolved: 'bg-green-500/10 border-green-500/30 text-green-400',
    unknown: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
  };
  return map[severity] || map.unknown;
}
