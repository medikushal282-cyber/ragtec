import React, { useState } from "react";
import { useSOC } from "../context/SOCContext";
import { Playbook, ThreatCategory } from "../types/soc";
import { SeverityBadge, CategoryTag } from "../components/Badges";
import {
  BookOpen,
  Play,
  Check,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RotateCcw
} from "lucide-react";

export const Playbooks: React.FC = () => {
  const { navigateTo } = useSOC();
  const [activePlaybookId, setActivePlaybookId] = useState<string>("PB-COBALT-01");
  const [stepProgress, setStepProgress] = useState<Record<string, "PENDING" | "RUNNING" | "COMPLETED">>({
    "PB-COBALT-01-1": "COMPLETED",
    "PB-COBALT-01-2": "COMPLETED",
    "PB-COBALT-01-3": "PENDING"
  });

  const playbooks: Playbook[] = [
    {
      id: "PB-COBALT-01",
      title: "Cobalt Strike / C2 Beacon Containment Playbook",
      threat_category: "Malware",
      severity: "CRITICAL",
      description: "Standard operating procedure for containing memory-resident beacon loaders and terminating adversary C2 communication channels.",
      steps: [
        {
          id: "PB-COBALT-01-1",
          name: "Endpoint Network Quarantine",
          action_type: "ISOLATE_HOST",
          description: "Disconnect endpoint from corporate routing tables to prevent lateral SMB/WMI propagation.",
          is_automated: true,
          simulated: true
        },
        {
          id: "PB-COBALT-01-2",
          name: "File Enclave Quarantine",
          action_type: "QUARANTINE_FILE",
          description: "Move identified stage 1 binary into .quarantine/ with cryptographic SHA256 tombstone.",
          is_automated: false,
          simulated: false
        },
        {
          id: "PB-COBALT-01-3",
          name: "Firewall Ingress/Egress Drop",
          action_type: "BLOCK_C2_IP",
          description: "Blacklist suspected C2 IP address at perimeter gateway.",
          is_automated: true,
          simulated: true
        },
        {
          id: "PB-COBALT-01-4",
          name: "Cryptographic Audit Ledger Sign-off",
          action_type: "AUDIT_VERIFY",
          description: "Verify all actions are permanently logged to the immutable SQLite audit chain.",
          is_automated: true,
          simulated: false
        }
      ]
    },
    {
      id: "PB-RANSOM-02",
      title: "Ransomware Bulk Encryption Defense Playbook",
      threat_category: "Ransomware",
      severity: "CRITICAL",
      description: "Emergency response playbook triggered by high-velocity filesystem CRUD operations and shadow copy deletion.",
      steps: [
        {
          id: "PB-RANSOM-02-1",
          name: "FIM Rapid Write Lock",
          action_type: "FIM_LOCK",
          description: "Revoke write permissions on shared folders and documents directories.",
          is_automated: true,
          simulated: true
        },
        {
          id: "PB-RANSOM-02-2",
          name: "Terminate Encryptor Subprocesses",
          action_type: "KILL_PROCESS",
          description: "Force terminate anomalous executable PIDs with high I/O throughput.",
          is_automated: false,
          simulated: true
        },
        {
          id: "PB-RANSOM-02-3",
          name: "Preserve VSS Shadow Copies",
          action_type: "SNAPSHOT_BACKUP",
          description: "Trigger snapshot replication before adversary deletes shadow backups.",
          is_automated: true,
          simulated: true
        }
      ]
    }
  ];

  const selectedPlaybook = playbooks.find(p => p.id === activePlaybookId) || playbooks[0];

  const handleExecuteStep = (stepId: string) => {
    setStepProgress(prev => ({ ...prev, [stepId]: "RUNNING" }));
    setTimeout(() => {
      setStepProgress(prev => ({ ...prev, [stepId]: "COMPLETED" }));
    }, 1000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="editorial-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-black" />
          <span className="font-serif font-bold text-sm text-black uppercase tracking-wider">Incident Response Playbooks</span>
          <span className="text-[#64748B]">({playbooks.length} Standard Operating Procedures)</span>
        </div>

        <div className="text-xs text-[#64748B]">
          Step-by-step mitigation workflows
        </div>
      </div>

      {/* Main Playbooks Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Col: Playbook Selector */}
        <div className="editorial-card p-4 space-y-3 bg-white">
          <span className="text-xs font-serif font-bold text-black uppercase block pb-2 border-b border-[#E5E7EB]">
            Playbooks Catalog
          </span>

          <div className="space-y-2.5">
            {playbooks.map(pb => (
              <div
                key={pb.id}
                onClick={() => setActivePlaybookId(pb.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  activePlaybookId === pb.id
                    ? "bg-black text-white border-black shadow-md"
                    : "bg-[#F8F9FA] border-[#E5E7EB] hover:border-black text-[#1E293B]"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className={`font-bold ${activePlaybookId === pb.id ? "text-white" : "text-black"}`}>{pb.id}</span>
                  <SeverityBadge severity={pb.severity} />
                </div>
                <h4 className={`text-xs font-serif font-bold ${activePlaybookId === pb.id ? "text-white" : "text-black"}`}>{pb.title}</h4>
                <CategoryTag category={pb.threat_category} />
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Playbook Step Execution Timeline */}
        <div className="lg:col-span-2 editorial-card p-6 space-y-5 bg-white">
          <div className="pb-4 border-b border-[#E5E7EB] space-y-1.5">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-bold text-black text-sm">{selectedPlaybook.id}</span>
              <SeverityBadge severity={selectedPlaybook.severity} />
              <CategoryTag category={selectedPlaybook.threat_category} />
            </div>
            <h2 className="text-lg font-serif font-bold text-black">{selectedPlaybook.title}</h2>
            <p className="text-xs text-[#334155] font-sans leading-relaxed">{selectedPlaybook.description}</p>
          </div>

          {/* Steps List */}
          <div className="space-y-3 font-mono text-xs">
            <h3 className="text-black uppercase font-serif font-bold text-xs tracking-wider">
              Procedure Checklist ({selectedPlaybook.steps.length} Steps)
            </h3>

            <div className="space-y-3">
              {selectedPlaybook.steps.map((step, idx) => {
                const status = stepProgress[step.id] || "PENDING";

                return (
                  <div key={step.id} className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-serif font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-serif font-bold text-sm text-black">{step.name}</span>
                        {step.simulated && (
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-neutral-200 text-[#475569] font-semibold border border-neutral-300">
                            SIMULATED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        {status === "COMPLETED" ? (
                          <span className="text-black text-xs font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>COMPLETED</span>
                          </span>
                        ) : status === "RUNNING" ? (
                          <span className="text-black text-xs font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>EXECUTING...</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleExecuteStep(step.id)}
                            className="btn-black py-1 px-3 text-xs"
                          >
                            <Play className="w-3 h-3" />
                            <span>Execute Step</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#475569] font-sans pl-8 leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between font-mono text-xs">
            <button
              onClick={() => {
                setStepProgress({});
              }}
              className="text-[#64748B] hover:text-black flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Playbook</span>
            </button>

            <button
              onClick={() => navigateTo("audit")}
              className="btn-black py-2 px-4"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Inspect Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Playbooks;
