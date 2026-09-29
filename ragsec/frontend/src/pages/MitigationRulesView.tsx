import React, { useState } from "react";
import {
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Radio,
  FileCode2,
  Search,
  Check
} from "lucide-react";

interface FirewallRule {
  id: string;
  name: string;
  action: "BLOCK" | "ISOLATE" | "QUARANTINE" | "RATE_LIMIT";
  targetType: "IP" | "SUBNET" | "PROCESS" | "FILE_HASH";
  targetValue: string;
  triggerEvent: string;
  isActive: boolean;
  hitCount: number;
}

const INITIAL_RULES: FirewallRule[] = [
  {
    id: "RULE-01",
    name: "Auto-Isolate on Bulk File Modification",
    action: "ISOLATE",
    targetType: "SUBNET",
    targetValue: "192.168.1.0/24 (Workstations)",
    triggerEvent: "Ransomware signature or >100 file writes/sec",
    isActive: true,
    hitCount: 14
  },
  {
    id: "RULE-02",
    name: "Quarantine Unregistered PE Executable Creation",
    action: "QUARANTINE",
    targetType: "FILE_HASH",
    targetValue: "All unsigned executables in workspace",
    triggerEvent: "FIM Watchdog CREATED event",
    isActive: true,
    hitCount: 38
  },
  {
    id: "RULE-03",
    name: "Block C2 Ingress/Egress on Port 4444/8000",
    action: "BLOCK",
    targetType: "IP",
    targetValue: "192.168.1.105 (Suspicious Gateway)",
    triggerEvent: "Lateral movement beaconing",
    isActive: true,
    hitCount: 5
  },
  {
    id: "RULE-04",
    name: "Rate-Limit PowerShell Remote WMI Spawns",
    action: "RATE_LIMIT",
    targetType: "PROCESS",
    targetValue: "powershell.exe / wmic.exe",
    triggerEvent: ">5 invocations per minute from non-admin token",
    isActive: false,
    hitCount: 0
  }
];

export const MitigationRulesView: React.FC = () => {
  const [rules, setRules] = useState<FirewallRule[]>(INITIAL_RULES);
  const [filter, setFilter] = useState("");
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleAction, setNewRuleAction] = useState<FirewallRule["action"]>("BLOCK");
  const [newRuleTargetValue, setNewRuleTargetValue] = useState("");

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleTargetValue.trim()) return;

    const newRule: FirewallRule = {
      id: `RULE-0${rules.length + 1}`,
      name: newRuleName,
      action: newRuleAction,
      targetType: "IP",
      targetValue: newRuleTargetValue,
      triggerEvent: "Analyst custom rule definition",
      isActive: true,
      hitCount: 0
    };

    setRules([newRule, ...rules]);
    setNewRuleName("");
    setNewRuleTargetValue("");
  };

  const filteredRules = rules.filter(r =>
    r.name.toLowerCase().includes(filter.toLowerCase()) ||
    r.targetValue.toLowerCase().includes(filter.toLowerCase()) ||
    r.action.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="modern-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">Active Defense</span>
            <span className="text-neutral-300">•</span>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              Firewall & Response Rules
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight">
            Automated Mitigation Rules & Response Policies
          </h2>
          <p className="text-xs text-[#475569] mt-1 max-w-2xl">
            Configure automated reactive policies: instant host isolation, proactive enclave quarantine, IP blocking, and rate limiting upon confirmed threat telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#64748B]">Active Rules: <strong className="text-black">{rules.filter(r => r.isActive).length}</strong></span>
        </div>
      </div>

      {/* Add New Rule Form */}
      <form onSubmit={handleAddRule} className="modern-card p-5 space-y-4">
        <h3 className="font-bold text-sm text-black">Deploy New Response Rule</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Rule Name (e.g. Block Ransomware C2)"
            value={newRuleName}
            onChange={e => setNewRuleName(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black"
          />
          <select
            value={newRuleAction}
            onChange={e => setNewRuleAction(e.target.value as FirewallRule["action"])}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-sans text-black focus:outline-none focus:border-black"
          >
            <option value="BLOCK">Action: Block Traffic (IP/Port)</option>
            <option value="ISOLATE">Action: Isolate Endpoint Host</option>
            <option value="QUARANTINE">Action: Quarantine Payload</option>
            <option value="RATE_LIMIT">Action: Rate Limit Process</option>
          </select>
          <input
            type="text"
            placeholder="Target (e.g. 192.168.1.105, SHA256...)"
            value={newRuleTargetValue}
            onChange={e => setNewRuleTargetValue(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black"
          />
          <button type="submit" className="btn-primary-black py-2">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>
      </form>

      {/* Rules Table */}
      <div className="modern-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search response rules..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-black focus:outline-none focus:border-black"
            />
          </div>
          <span className="text-xs font-mono text-[#64748B]">{filteredRules.length} Rules Configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Rule Description</th>
                <th>Action</th>
                <th>Target Spec</th>
                <th>Trigger Logic</th>
                <th>Hits</th>
                <th>State</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map(rule => (
                <tr key={rule.id}>
                  <td className="font-mono font-bold text-black">{rule.id}</td>
                  <td className="font-semibold text-black">{rule.name}</td>
                  <td>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      rule.action === "ISOLATE"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : rule.action === "QUARANTINE"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {rule.action}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[#334155]">{rule.targetValue}</td>
                  <td className="text-xs text-[#64748B]">{rule.triggerEvent}</td>
                  <td className="font-mono text-xs text-black font-semibold">{rule.hitCount}</td>
                  <td>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                        rule.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                      }`}
                    >
                      {rule.isActive ? "ENABLED" : "DISABLED"}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
export default MitigationRulesView;
