import React, { useState } from "react";
import { MitigationRule } from "../types";
import { 
  Zap, 
  ShieldCheck, 
  Lock, 
  Plus, 
  CheckCircle2, 
  Slash, 
  Sliders, 
  Terminal,
  RefreshCw
} from "lucide-react";

export const MitigationCenter: React.FC = () => {
  const [rules, setRules] = useState<MitigationRule[]>([
    {
      id: "rule-01",
      name: "Auto-Quarantine FIM Mismatch",
      type: "quarantine_auto",
      status: "active",
      target: "monitored_workspace/**/*",
      action_count: 14,
      last_triggered: "12 mins ago"
    },
    {
      id: "rule-02",
      name: "Block Suspicious Egress IP 185.220.101.5",
      type: "ip_block",
      status: "active",
      target: "185.220.101.5/32",
      action_count: 8,
      last_triggered: "1 hour ago"
    },
    {
      id: "rule-03",
      name: "Strict Prompt Injection Delimiter Guard",
      type: "prompt_guard",
      status: "active",
      target: "RAGSec Retrieval Generator",
      action_count: 42,
      last_triggered: "Just now"
    },
    {
      id: "rule-04",
      name: "Shadow File System Write Lockdown",
      type: "fim_lock",
      status: "disabled",
      target: "monitored_workspace/etc/shadow*",
      action_count: 0
    }
  ]);

  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleType, setNewRuleType] = useState<MitigationRule["type"]>("ip_block");
  const [newRuleTarget, setNewRuleTarget] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus = r.status === "active" ? "disabled" : "active";
          setToast(`Rule "${r.name}" is now ${nextStatus.toUpperCase()}`);
          setTimeout(() => setToast(null), 3000);
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleTarget.trim()) return;

    const newRule: MitigationRule = {
      id: `rule-${Date.now().toString().slice(-4)}`,
      name: newRuleName,
      type: newRuleType,
      status: "active",
      target: newRuleTarget,
      action_count: 0
    };

    setRules([newRule, ...rules]);
    setNewRuleName("");
    setNewRuleTarget("");
    setShowAddForm(false);
    setToast(`Added new mitigation rule "${newRule.name}"`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Automated Mitigation & Governance Rules
          </h3>
          <p className="text-xs text-slate-400">
            Enforce real-time containment rules, IP blocking, and FIM auto-quarantine policies
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? "Cancel Rule Creation" : "Create Mitigation Rule"}
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {toast}
        </div>
      )}

      {/* Add Rule Drawer Form */}
      {showAddForm && (
        <div className="glass-panel p-6 rounded-2xl max-w-2xl space-y-4">
          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2 border-b border-white/10 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Define New Mitigation Rule Policy
          </h4>

          <form onSubmit={handleAddRule} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Rule Policy Name</label>
              <input
                type="text"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="e.g. Block Rogue Subnet 192.168.50.0/24"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Rule Type</label>
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="ip_block">IP / Network Block</option>
                  <option value="quarantine_auto">FIM Auto-Quarantine</option>
                  <option value="prompt_guard">Prompt Injection Guard</option>
                  <option value="fim_lock">Filesystem Lock</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Target Pattern / IP</label>
                <input
                  type="text"
                  value={newRuleTarget}
                  onChange={(e) => setNewRuleTarget(e.target.value)}
                  placeholder="e.g. 192.168.50.0/24"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20"
            >
              <Zap className="w-4 h-4" />
              Save & Activate Rule
            </button>
          </form>
        </div>
      )}

      {/* Rules Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h4 className="font-bold text-white text-base font-mono">Active Mitigation Policies</h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold">
            {rules.filter((r) => r.status === "active").length} ACTIVE
          </span>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                rule.status === "active"
                  ? "bg-black/40 border-white/10 hover:border-cyan-500/30"
                  : "bg-white/5 border-white/5 opacity-60"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">{rule.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                    rule.type === "ip_block" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                    rule.type === "quarantine_auto" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                    "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  }`}>
                    {rule.type}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Target: <code className="text-cyan-400">{rule.target}</code>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right text-xs font-mono">
                  <div className="text-slate-300 font-bold">{rule.action_count} Triggers</div>
                  <div className="text-[10px] text-slate-500">{rule.last_triggered || "Never"}</div>
                </div>

                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    rule.status === "active"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
                      : "bg-white/10 text-slate-400 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-300"
                  }`}
                >
                  {rule.status === "active" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ACTIVE
                    </>
                  ) : (
                    <>
                      <Slash className="w-3.5 h-3.5 text-slate-400" />
                      DISABLED
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MitigationCenter;
