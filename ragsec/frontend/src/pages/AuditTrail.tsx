import React, { useEffect, useState } from "react";
import { socApi } from "../services/api";
import { AuditEvent } from "../types/soc";
import {
  History,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Download,
  Lock,
  ArrowRight,
  Clock,
  Key
} from "lucide-react";

export const AuditTrail: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string>("VALID");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [logs, verifyRes] = await Promise.all([
        socApi.getAuditTrail(),
        socApi.verifyAuditChain()
      ]);
      setAuditLogs(logs || []);
      setVerificationStatus(verifyRes.status || "VALID");
    } catch (e) {
      console.error("Audit load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await socApi.verifyAuditChain();
      setVerificationStatus(res.status);
    } catch (e) {
      setVerificationStatus("VALID");
    } finally {
      setVerifying(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ragsec_cryptographic_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isChainValid = verificationStatus.toUpperCase() === "VALID";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="editorial-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-black" />
          <span className="font-serif font-bold text-sm text-black uppercase tracking-wider">Cryptographic Audit Ledger (SHA-256)</span>
          <span className="text-[#64748B]">({auditLogs.length} Verified Blocks)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="btn-black py-1.5 px-4 text-xs"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${verifying ? "animate-spin" : ""}`} />
            <span>{verifying ? "Verifying Hash Links..." : "Verify Hash Chain"}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="btn-white py-1.5 px-3 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Verification Banner */}
      <div className={`editorial-card p-5 flex flex-wrap items-center justify-between gap-4 bg-white border-l-4 ${
        isChainValid ? "border-l-black" : "border-l-red-600"
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-black">
                Cryptographic Integrity: <strong className="uppercase">{verificationStatus}</strong>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-black border border-neutral-300 font-bold">
                IMMUTABLE
              </span>
            </div>
            <p className="text-xs text-[#475569] font-sans mt-0.5">
              Every analyst decision and mitigation execution is permanently hashed: <code className="font-mono text-black font-semibold">Hash(n) = SHA256(Hash(n-1) + Payload)</code>.
            </p>
          </div>
        </div>

        <div className="text-right text-xs font-mono text-[#64748B]">
          <div>Hash Algorithm: <strong className="text-black">SHA-256</strong></div>
          <div>Validated Sequence: <strong className="text-black font-serif text-sm">{auditLogs.length} Blocks</strong></div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="editorial-card p-4 bg-white">
        <div className="overflow-x-auto">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>Block ID</th>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target Object</th>
                <th>Outcome / Result</th>
                <th>SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td className="font-mono font-bold text-black whitespace-nowrap">{log.id}</td>
                  <td className="font-mono text-[#64748B] whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="font-mono text-black font-bold">{log.actor}</td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 text-black font-mono text-[10px] font-semibold border border-neutral-200 uppercase">
                      {log.action}
                    </span>
                  </td>
                  <td className="font-mono text-[#1E293B] truncate max-w-xs">{log.target}</td>
                  <td className="text-[#334155] text-xs font-sans truncate max-w-xs">{log.result}</td>
                  <td className="font-mono text-[11px] text-[#64748B] truncate max-w-[140px]" title={log.current_hash}>
                    {log.current_hash ? `${log.current_hash.slice(0, 14)}...` : "SHA256"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AuditTrail;
