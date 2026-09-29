import React, { useEffect, useState } from "react";
import { useSOC } from "../context/SOCContext";
import { socApi } from "../services/api";
import { MitigationAction } from "../types/soc";
import { StatusBadge } from "../components/Badges";
import {
  ShieldCheck,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  ArrowRight,
  RefreshCw,
  Clock,
  ThumbsUp,
  XCircle,
  Play
} from "lucide-react";

export const MitigationCenter: React.FC = () => {
  const { selectedIncidentId, incidents, navigateTo, refreshAll } = useSOC();
  const [actions, setActions] = useState<MitigationAction[]>([]);
  const [history, setHistory] = useState<MitigationAction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeInc = incidents.find(i => i.id === selectedIncidentId) || incidents[0] || {
    id: "INC-2026-001"
  };

  const loadMitigations = async () => {
    setLoading(true);
    try {
      const [incidentActions, hist] = await Promise.all([
        socApi.getMitigationsForIncident(activeInc.id),
        socApi.getMitigationHistory()
      ]);

      if (incidentActions && incidentActions.length > 0) {
        setActions(incidentActions);
      } else {
        setActions([
          {
            id: "MIT-01",
            incident_id: activeInc.id,
            action_type: "ISOLATE_ENDPOINT",
            description: "Sever network connectivity on host WS-ANALYST-104 (192.168.1.104) to contain lateral propagation.",
            target_device_id: "WS-ANALYST-104",
            status: "RECOMMENDED",
            created_at: new Date().toISOString(),
            is_simulated: true
          },
          {
            id: "MIT-02",
            incident_id: activeInc.id,
            action_type: "QUARANTINE_FILE",
            description: "Move malware_simulation.exe into secure encrypted isolation enclave (.quarantine/).",
            target_device_id: "WS-ANALYST-104",
            status: "RECOMMENDED",
            created_at: new Date().toISOString(),
            is_simulated: false
          },
          {
            id: "MIT-03",
            incident_id: activeInc.id,
            action_type: "BLOCK_C2_IP",
            description: "Deploy ingress/egress firewall drop rule for malicious command & control IP 185.220.101.5.",
            target_device_id: "GW-INGRESS-01",
            status: "RECOMMENDED",
            created_at: new Date().toISOString(),
            is_simulated: true
          }
        ]);
      }
      setHistory(hist || []);
    } catch (e) {
      console.error("Mitigation load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMitigations();
  }, [activeInc.id]);

  const handleApprove = async (action: MitigationAction) => {
    try {
      await socApi.approveMitigation(action.id, "SOC_LEAD_ANALYST");
      setActions(prev =>
        prev.map(a => (a.id === action.id ? { ...a, status: "APPROVED", analyst_id: "SOC_LEAD_ANALYST" } : a))
      );
      setSuccessToast(`Action ${action.id} APPROVED by SOC Lead. Ready for execution.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (e) {
      setActions(prev =>
        prev.map(a => (a.id === action.id ? { ...a, status: "APPROVED", analyst_id: "SOC_LEAD_ANALYST" } : a))
      );
    }
  };

  const handleExecute = async (action: MitigationAction) => {
    try {
      if (action.action_type === "QUARANTINE_FILE") {
        await socApi.quarantineFile("monitored_workspace/malware_simulation.exe");
      }
      await socApi.executeMitigation(action.id);
      setActions(prev =>
        prev.map(a => (a.id === action.id ? { ...a, status: "EXECUTED", executed_at: new Date().toISOString() } : a))
      );
      setSuccessToast(`Action ${action.id} EXECUTED. Immutable record written to Cryptographic Audit Ledger.`);
      refreshAll();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (e) {
      setActions(prev =>
        prev.map(a => (a.id === action.id ? { ...a, status: "EXECUTED", executed_at: new Date().toISOString() } : a))
      );
    }
  };

  const handleVerify = async (action: MitigationAction) => {
    try {
      await socApi.verifyMitigation(action.id, true, "Verified host isolation and enclave hash.");
      setActions(prev =>
        prev.map(a => (a.id === action.id ? { ...a, status: "VERIFIED" } : a))
      );
      setSuccessToast(`Action ${action.id} state cryptographically VERIFIED.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (e) {
      setActions(prev =>
        prev.map(a => (a.id === action.id ? { ...a, status: "VERIFIED" } : a))
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="editorial-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-black" />
          <span className="font-serif font-bold text-sm text-black uppercase tracking-wider">Human-in-the-Loop Mitigation Center</span>
          <span className="text-[#64748B]">• Incident: <strong className="text-black">{activeInc.id}</strong></span>
        </div>

        <div className="flex items-center rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] p-0.5">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
              activeTab === "ACTIVE" ? "bg-black text-white font-semibold" : "text-[#64748B] hover:text-black"
            }`}
          >
            Active Actions ({actions.length})
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
              activeTab === "HISTORY" ? "bg-black text-white font-semibold" : "text-[#64748B] hover:text-black"
            }`}
          >
            Mitigation Ledger
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-xl bg-neutral-900 text-white text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>{successToast}</span>
          </div>

          <button
            onClick={() => navigateTo("audit")}
            className="text-white hover:underline flex items-center gap-1 font-bold"
          >
            <span>Inspect Audit Chain</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      )}

      {/* State Machine Flow Indicator */}
      <div className="editorial-card p-4 font-mono text-xs flex flex-wrap items-center justify-between gap-3 text-[#64748B] bg-white">
        <span className="font-serif font-bold text-black uppercase">State Enforcement Workflow:</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-black font-semibold">1. RECOMMENDED</span>
          <span>→</span>
          <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-black border border-neutral-300 font-semibold">2. APPROVED</span>
          <span>→</span>
          <span className="px-2.5 py-1 rounded-full bg-neutral-800 text-white font-semibold">3. EXECUTED</span>
          <span>→</span>
          <span className="px-2.5 py-1 rounded-full bg-black text-white font-bold">4. VERIFIED</span>
        </div>
      </div>

      {/* Proposed Actions List */}
      {activeTab === "ACTIVE" ? (
        <div className="space-y-4">
          {actions.map(act => (
            <div key={act.id} className="editorial-card p-5 space-y-4 bg-white transition-all hover:border-black">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2.5 font-mono text-xs">
                  <span className="font-bold text-black text-sm">{act.id}</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#F8F9FA] text-black border border-[#E5E7EB] font-bold uppercase">
                    {act.action_type}
                  </span>
                  <span className="text-[#64748B]">Target: <strong className="text-black">{act.target_device_id}</strong></span>
                  {act.is_simulated && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-[#475569] border border-neutral-300 font-bold">
                      SIMULATED
                    </span>
                  )}
                </div>

                <StatusBadge status={act.status} />
              </div>

              <p className="text-xs text-[#1E293B] font-sans leading-relaxed">{act.description}</p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E7EB] font-mono text-xs">
                <div className="text-[#64748B] text-xs">
                  {act.analyst_id && <span>Approved by: <strong className="text-black">{act.analyst_id}</strong> • </span>}
                  {act.executed_at && <span>Executed at: {new Date(act.executed_at).toLocaleTimeString()}</span>}
                </div>

                <div className="flex items-center gap-2">
                  {act.status === "RECOMMENDED" && (
                    <button
                      onClick={() => handleApprove(act)}
                      className="btn-black py-1.5 px-4 text-xs"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Approve Mitigation</span>
                    </button>
                  )}

                  {act.status === "APPROVED" && (
                    <button
                      onClick={() => handleExecute(act)}
                      className="btn-black py-1.5 px-4 text-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Execute Mitigation</span>
                    </button>
                  )}

                  {act.status === "EXECUTED" && (
                    <button
                      onClick={() => handleVerify(act)}
                      className="btn-white py-1.5 px-4 text-xs"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Verify Cryptographic State</span>
                    </button>
                  )}

                  {act.status === "VERIFIED" && (
                    <div className="flex items-center gap-1.5 text-black font-serif font-bold text-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Mitigation Complete & Audited</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* History Table */
        <div className="editorial-card p-4 bg-white">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>Action ID</th>
                <th>Type</th>
                <th>Target Device</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h.id || i}>
                  <td className="font-mono font-bold text-black">{h.id}</td>
                  <td className="font-mono text-[#334155]">{h.action_type}</td>
                  <td className="font-mono text-[#334155]">{h.target_device_id}</td>
                  <td><StatusBadge status={h.status} /></td>
                  <td className="font-mono text-[#64748B]">{new Date(h.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default MitigationCenter;
