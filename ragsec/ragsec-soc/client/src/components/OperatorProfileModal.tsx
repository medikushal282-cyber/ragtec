import React, { useState } from "react";
import { 
  ShieldCheck, 
  User, 
  Key, 
  Lock, 
  LogOut, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Terminal, 
  Zap, 
  Clock, 
  Fingerprint,
  ChevronRight,
  Shield
} from "lucide-react";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SOC_ANALYST" | "AUDITOR";
  roleLabel: string;
  clearance: string;
  avatarInitial: string;
  isAuthenticated: boolean;
  lastLogin: string;
}

export const DEFAULT_OPERATORS: UserProfile[] = [
  {
    id: "op-001",
    name: "Alex Vance",
    email: "alex.vance@ragsec.local",
    role: "ADMIN",
    roleLabel: "SOC Director & Admin (Tier-3)",
    clearance: "Top Secret // Compartmented (TS/SCI)",
    avatarInitial: "AV",
    isAuthenticated: true,
    lastLogin: "Active Now"
  },
  {
    id: "op-002",
    name: "Elena Rostova",
    email: "elena.r@ragsec.local",
    role: "SOC_ANALYST",
    roleLabel: "Senior Incident Responder (Tier-2)",
    clearance: "Secret // NATO High",
    avatarInitial: "ER",
    isAuthenticated: false,
    lastLogin: "2 hours ago"
  },
  {
    id: "op-003",
    name: "Marcus Kane",
    email: "marcus.k@ragsec.local",
    role: "AUDITOR",
    roleLabel: "Compliance & CRC Auditor",
    clearance: "Confidential // Audit Clearance",
    avatarInitial: "MK",
    isAuthenticated: false,
    lastLogin: "Yesterday"
  }
];

interface OperatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  operators: UserProfile[];
  onAddOperator: (operator: UserProfile) => void;
}

export function OperatorProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  operators,
  onAddOperator
}: OperatorProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"session" | "operators" | "add_user" | "signin">(
    currentUser.isAuthenticated ? "session" : "signin"
  );

  // Sign in form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Add operator form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "SOC_ANALYST" | "AUDITOR">("SOC_ANALYST");
  const [newClearance, setNewClearance] = useState("Secret // Defense");

  if (!isOpen) return null;

  const handleRoleSwitch = (role: "ADMIN" | "SOC_ANALYST" | "AUDITOR") => {
    const roleLabels = {
      ADMIN: "SOC Director & Admin (Tier-3)",
      SOC_ANALYST: "Senior Incident Responder (Tier-2)",
      AUDITOR: "Compliance & CRC Auditor"
    };
    const clearances = {
      ADMIN: "Top Secret // Compartmented (TS/SCI)",
      SOC_ANALYST: "Secret // Defense Clearance",
      AUDITOR: "Confidential // Audit Clearance"
    };

    const updated: UserProfile = {
      ...currentUser,
      role,
      roleLabel: roleLabels[role],
      clearance: clearances[role]
    };

    onUpdateUser(updated);
    toast.success(`Role elevation updated: switched to ${roleLabels[role]}`);
  };

  const handleLogout = () => {
    const signedOut: UserProfile = {
      ...currentUser,
      isAuthenticated: false
    };
    onUpdateUser(signedOut);
    setActiveTab("signin");
    toast.info("Operator session locked. Administrative privileges revoked.");
  };

  const handleFastLogin = (operator: UserProfile) => {
    const loggedIn: UserProfile = {
      ...operator,
      isAuthenticated: true,
      lastLogin: "Active Now"
    };
    onUpdateUser(loggedIn);
    setActiveTab("session");
    toast.success(`Authenticated as ${operator.name} (${operator.role})`);
    onClose();
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = operators.find(
      (op) => op.email.toLowerCase() === loginEmail.toLowerCase() || op.name.toLowerCase() === loginEmail.toLowerCase()
    );

    if (matched) {
      handleFastLogin(matched);
    } else {
      // Authenticate as a new custom admin session
      const customUser: UserProfile = {
        id: `op-${Date.now()}`,
        name: loginEmail || "SOC Admin",
        email: loginEmail || "admin@ragsec.local",
        role: "ADMIN",
        roleLabel: "SOC Director & Admin (Tier-3)",
        clearance: "Top Secret // Compartmented (TS/SCI)",
        avatarInitial: (loginEmail[0] || "A").toUpperCase(),
        isAuthenticated: true,
        lastLogin: "Active Now"
      };
      onUpdateUser(customUser);
      setActiveTab("session");
      toast.success(`Authenticated as ${customUser.name}`);
      onClose();
    }
  };

  const handleCreateOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Please provide both name and email.");
      return;
    }

    const initials = newName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const roleLabels = {
      ADMIN: "SOC Director & Admin (Tier-3)",
      SOC_ANALYST: "Senior Incident Responder (Tier-2)",
      AUDITOR: "Compliance & CRC Auditor"
    };

    const newOp: UserProfile = {
      id: `op-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      roleLabel: roleLabels[newRole],
      clearance: newClearance,
      avatarInitial: initials || "OP",
      isAuthenticated: false,
      lastLogin: "Never"
    };

    onAddOperator(newOp);
    toast.success(`Operator ${newName} registered with ${newRole} credentials.`);
    setNewName("");
    setNewEmail("");
    setActiveTab("operators");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="apple-panel max-w-xl w-full p-6 space-y-5 shadow-2xl border border-white/[0.12] text-xs max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Operator Identity & Access</h3>
              <p className="text-[11px] text-[#8E8E93]">Autonomous SOC Role-Based Authentication & Governance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8E8E93] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        {currentUser.isAuthenticated ? (
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
            <button
              onClick={() => setActiveTab("session")}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "session"
                  ? "bg-white/[0.1] text-white border border-white/[0.12]"
                  : "text-[#8E8E93] hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Active Operator</span>
            </button>
            <button
              onClick={() => setActiveTab("operators")}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "operators"
                  ? "bg-white/[0.1] text-white border border-white/[0.12]"
                  : "text-[#8E8E93] hover:text-white"
              }`}
            >
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>Switch Profiles ({operators.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("add_user")}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "add_user"
                  ? "bg-white/[0.1] text-white border border-white/[0.12]"
                  : "text-[#8E8E93] hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Operator</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
            <div className="px-3 py-1.5 rounded-xl font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Console Locked // Authentication Required</span>
            </div>
          </div>
        )}

        {/* TAB 1: ACTIVE SESSION */}
        {activeTab === "session" && currentUser.isAuthenticated && (
          <div className="space-y-4">
            {/* Operator Card */}
            <div className="p-4 rounded-2xl bg-white/[0.035] border border-white/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-blue-500/20">
                    {currentUser.avatarInitial}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0A0D15]"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-sm">{currentUser.name}</h4>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      currentUser.role === "ADMIN" 
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : currentUser.role === "SOC_ANALYST"
                        ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                        : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-[#8E8E93] text-xs mt-0.5">{currentUser.email}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span>Clearance: {currentUser.clearance}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.8 rounded-lg block mb-1">
                  SESSION ACTIVE
                </span>
                <span className="text-[10px] text-[#8E8E93]">Last Auth: {currentUser.lastLogin}</span>
              </div>
            </div>

            {/* Privileges Matrix */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="text-[10px] uppercase font-semibold text-[#8E8E93] tracking-wider block">
                Active Tier Clearance & Privileges
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200">Host Containment & Kill Switch</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200">Groq LPU Copilot Execution</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200">FIM Sandbox Quarantine & Rollback</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200">SIEM Export & CRC Proof Ledger</span>
                </div>
              </div>
            </div>

            {/* Quick Role Switcher */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-semibold text-[#8E8E93] tracking-wider block">
                Fast Role Switch
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("ADMIN")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    currentUser.role === "ADMIN"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm"
                      : "bg-white/[0.02] border-white/[0.06] text-[#8E8E93] hover:text-white"
                  }`}
                >
                  <div className="text-xs">Admin (Tier-3)</div>
                  <div className="text-[9px] text-[#8E8E93] mt-0.5">Full Authority</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("SOC_ANALYST")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    currentUser.role === "SOC_ANALYST"
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-300 font-semibold shadow-sm"
                      : "bg-white/[0.02] border-white/[0.06] text-[#8E8E93] hover:text-white"
                  }`}
                >
                  <div className="text-xs">Analyst (Tier-2)</div>
                  <div className="text-[9px] text-[#8E8E93] mt-0.5">HitL Response</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("AUDITOR")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    currentUser.role === "AUDITOR"
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300 font-semibold shadow-sm"
                      : "bg-white/[0.02] border-white/[0.06] text-[#8E8E93] hover:text-white"
                  }`}
                >
                  <div className="text-xs">Auditor</div>
                  <div className="text-[9px] text-[#8E8E93] mt-0.5">Read-Only CRC</div>
                </button>
              </div>
            </div>

            {/* Logout / Lock Session */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-white font-medium flex items-center gap-2 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock Console / Sign Out</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SWITCH OPERATORS */}
        {activeTab === "operators" && (
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-semibold text-[#8E8E93] tracking-wider block">
              Registered Security Operators
            </span>
            <div className="space-y-2">
              {operators.map((op) => {
                const isActive = currentUser.id === op.id && currentUser.isAuthenticated;
                return (
                  <div
                    key={op.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? "bg-blue-500/10 border-blue-500/30 text-white"
                        : "bg-white/[0.02] border-white/[0.06] text-[#8E8E93] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center font-bold text-white text-xs">
                        {op.avatarInitial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">{op.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                            {op.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8E8E93]">{op.email} • {op.clearance}</p>
                      </div>
                    </div>

                    <div>
                      {isActive ? (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.8 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleFastLogin(op)}
                          className="px-3 py-1.2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-medium flex items-center gap-1 transition-all"
                        >
                          <span>Switch</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab("add_user")}
                className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-medium flex items-center gap-1.5 transition-all text-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                <span>Register New Operator</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: ADD OPERATOR FORM */}
        {activeTab === "add_user" && (
          <form onSubmit={handleCreateOperator} className="space-y-4">
            <span className="text-[10px] uppercase font-semibold text-[#8E8E93] tracking-wider block">
              Enroll New SOC Operator
            </span>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Operator Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Email / Operator ID</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. david.m@ragsec.local"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Security Role</label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0e121d] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-blue-500/60"
                  >
                    <option value="ADMIN">ADMIN (Tier-3 Full Root)</option>
                    <option value="SOC_ANALYST">SOC ANALYST (Tier-2 Response)</option>
                    <option value="AUDITOR">AUDITOR (Read-Only CRC)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Clearance Level</label>
                  <select
                    value={newClearance}
                    onChange={(e) => setNewClearance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0e121d] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-blue-500/60"
                  >
                    <option value="Top Secret // Compartmented (TS/SCI)">Top Secret // TS/SCI</option>
                    <option value="Secret // Defense">Secret // Defense</option>
                    <option value="Confidential // Internal">Confidential // Internal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab("operators")}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] text-[#8E8E93] hover:text-white"
              >
                Back to List
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create & Register</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: SIGN IN / UNLOCK */}
        {activeTab === "signin" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white text-xs">Console Locked</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Sign in with administrative credentials to access live threat containment and host telemetry.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Operator Identifier / Email</label>
                <input
                  type="text"
                  placeholder="alex.vance@ragsec.local or Admin"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Security Token / Passphrase</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all text-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Authenticate Operator</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFastLogin(operators[0])}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="One-click Administrative Login"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1-Click Admin</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
