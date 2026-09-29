import React from "react";
import { useSOC } from "../context/SOCContext";
import { SeverityBadge, CategoryTag, StatusBadge } from "../components/Badges";
import {
  Bell,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  FileSearch,
  Check,
  Lock
} from "lucide-react";

export const ActiveAlerts: React.FC = () => {
  const { incidents, navigateTo, setSelectedIncidentId, setTargetAnalysisPath } = useSOC();

  const mockAlerts = [
    {
      id: "ALT-MAL-901",
      title: "Potential Cobalt Strike / Ransomware Stage 1 Loader",
      category: "Malware",
      severity: "CRITICAL",
      status: "ACTIVE",
      timestamp: new Date().toISOString(),
      targetHost: "WS-ANALYST-104",
      targetPath: "monitored_workspace/malware_simulation.exe",
      riskScore: 96,
      indicators: [
        "Executable binary created in non-standard workspace root",
        "High Shannon Entropy (7.82) indicative of encryption/packing",
        "PE Header anomaly: Suspicious virtual size vs raw size"
      ]
    },
    {
      id: "ALT-SCR-902",
      title: "Obfuscated PowerShell Process Execution",
      category: "Suspicious Script / Execution",
      severity: "HIGH",
      status: "ACTIVE",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      targetHost: "WS-ANALYST-104",
      targetPath: "monitored_workspace/suspicious_script.ps1",
      riskScore: 88,
      indicators: [
        "Base64 encoded command string detected",
        "WMI query for domain user accounts (Discovery tactic)",
        "Invoke-Expression (IEX) memory injection pattern"
      ]
    },
    {
      id: "ALT-RANS-903",
      title: "Bulk Document Modification & VSS Shadow Copy Purge",
      category: "Ransomware",
      severity: "CRITICAL",
      status: "ACTIVE",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      targetHost: "WS-FINANCE-108",
      targetPath: "monitored_workspace/ransomware_simulation.txt",
      riskScore: 98,
      indicators: [
        "High-velocity file rewrite across documents directory",
        "Command execution: vssadmin delete shadows /all /quiet",
        "Ransom note template creation detected"
      ]
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="editorial-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-black" />
          <span className="font-serif font-bold text-sm text-black uppercase tracking-wider">Correlated Threat Alerts</span>
          <span className="text-[#64748B]">({mockAlerts.length} Active Alerts)</span>
        </div>

        <div className="text-xs text-[#64748B]">
          Correlated to Incident: <strong className="text-black">INC-2026-001</strong>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {mockAlerts.map(alert => (
          <div key={alert.id} className="editorial-card p-6 space-y-4 bg-white transition-all hover:border-black">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-black">{alert.id}</span>
                <CategoryTag category={alert.category} />
                <SeverityBadge severity={alert.severity} />
                <span className="font-mono text-xs text-[#64748B]">Target Host: <strong className="text-black">{alert.targetHost}</strong></span>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#64748B]">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                <StatusBadge status={alert.status} />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-black">{alert.title}</h3>
              <p className="text-xs font-mono text-[#64748B]">File Target: <code className="text-black font-semibold">{alert.targetPath}</code></p>
            </div>

            {/* Indicator Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-[#64748B] block tracking-wider">Observed Threat Indicators:</span>
              <div className="flex flex-wrap gap-2">
                {alert.indicators.map((ind, i) => (
                  <span key={i} className="text-xs font-mono px-3 py-1 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] text-[#1E293B]">
                    • {ind}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E7EB] font-mono text-xs">
              <div className="text-xs text-[#64748B]">
                Confidence Risk Score: <strong className="text-black font-serif text-sm">{alert.riskScore} / 100</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTargetAnalysisPath(alert.targetPath);
                    navigateTo("analyzer", alert.targetPath);
                  }}
                  className="btn-white py-1.5 px-3 text-xs"
                >
                  <Cpu className="w-3.5 h-3.5 text-black" />
                  <span>Static Analysis</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedIncidentId("INC-2026-001");
                    navigateTo("investigation", "INC-2026-001");
                  }}
                  className="btn-black py-1.5 px-4 text-xs"
                >
                  <span>Investigate with AI</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ActiveAlerts;
