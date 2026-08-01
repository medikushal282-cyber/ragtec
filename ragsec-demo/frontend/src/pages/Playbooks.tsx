import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ShieldCheck, ChevronDown, ChevronUp, CheckCircle, Plus, X, Play, FileText } from 'lucide-react';
import { fetchPlaybooks, createPlaybook, runPlaybook } from '../lib/api';

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>('pb-ransomware');

  // Runner Modal State
  const [runningPlaybook, setRunningPlaybook] = useState<any | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isSubmittingRun, setIsSubmittingRun] = useState(false);
  const [runSuccessMsg, setRunSuccessMsg] = useState<string | null>(null);

  // Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Cloud Security');
  const [newSeverity, setNewSeverity] = useState('High');
  const [newDescription, setNewDescription] = useState('');
  const [newStepContainment, setNewStepContainment] = useState('Isolate compromised node; Block inbound IP');
  const [newStepEradication, setNewStepEradication] = useState('Flush RAM cache; Revoke OAuth tokens');
  const [isSavingPlaybook, setIsSavingPlaybook] = useState(false);

  const loadPlaybooks = () => {
    fetchPlaybooks().then(setPlaybooks).catch(() => {});
  };

  useEffect(() => {
    loadPlaybooks();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const startRunner = (pb: any) => {
    setRunningPlaybook(pb);
    setCompletedSteps([]);
    setRunSuccessMsg(null);
  };

  const toggleStepCompleted = (stepText: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepText) ? prev.filter((s) => s !== stepText) : [...prev, stepText]
    );
  };

  const handleFinishRun = async () => {
    if (!runningPlaybook) return;
    setIsSubmittingRun(true);
    try {
      const res = await runPlaybook({
        playbook_id: runningPlaybook.id,
        completed_steps: completedSteps,
        notes: `Executed ${completedSteps.length} steps via SOC Command Center`,
      });
      setRunSuccessMsg(res.message);
      setTimeout(() => {
        setRunningPlaybook(null);
        setRunSuccessMsg(null);
      }, 2000);
    } catch (e) {
      alert('Failed to log playbook run');
    } finally {
      setIsSubmittingRun(false);
    }
  };

  const handleSaveCustomPlaybook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSavingPlaybook(true);
    try {
      await createPlaybook({
        title: newTitle,
        category: newCategory,
        severity: newSeverity,
        description: newDescription,
        steps: {
          Containment: newStepContainment.split(';').map((s) => s.trim()),
          Eradication: newStepEradication.split(';').map((s) => s.trim()),
        },
      });
      setIsBuilderOpen(false);
      setNewTitle('');
      setNewDescription('');
      loadPlaybooks();
    } catch (err) {
      alert('Failed to save custom playbook');
    } finally {
      setIsSavingPlaybook(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0 max-w-5xl mx-auto pb-12">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Incident Response Playbooks</h1>
          <p className="text-gray-400">NIST SP 800-61 aligned response workflows for enterprise threats.</p>
        </div>
        <Button onClick={() => setIsBuilderOpen(true)} className="gap-2 bg-cyber-cyan text-black font-bold">
          <Plus className="w-4 h-4" /> Build Custom Playbook
        </Button>
      </header>

      <div className="space-y-6">
        {playbooks.map((pb) => {
          const isExpanded = expandedId === pb.id;
          return (
            <Card key={pb.id} className="p-6 transition-all duration-300">
              <div onClick={() => toggleExpand(pb.id)} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white tracking-wide">{pb.title}</h3>
                      <Badge variant="critical">{pb.severity}</Badge>
                      <span className="mono text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">{pb.category}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pb.description}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg bg-surface border border-white/10 text-gray-400 hover:text-white">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-8 pt-6 border-t border-white/10 space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(pb.steps || {}).map(([phase, steps]: [string, any]) => (
                      <div key={phase} className="p-4 rounded-xl bg-surface/50 border border-white/5 space-y-3">
                        <h4 className="text-xs font-bold text-cyber-cyan uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> {phase} Phase
                        </h4>
                        <ul className="space-y-2 text-xs text-gray-300">
                          {Array.isArray(steps) &&
                            steps.map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-cyber-cyan font-mono">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <Button variant="outline" className="text-xs">
                      <FileText className="w-3.5 h-3.5 mr-1" /> Download PDF
                    </Button>
                    <Button onClick={() => startRunner(pb)} className="text-xs bg-cyber-cyan text-black font-bold gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-current" /> Execute Interactive Wizard
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* MODAL 1: Interactive Playbook Runner */}
      {runningPlaybook && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-cyber-cyan/40 rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono text-cyber-cyan uppercase tracking-widest block">INTERACTIVE WORKFLOW WIZARD</span>
                <h3 className="text-xl font-bold text-white">{runningPlaybook.title}</h3>
              </div>
              <button onClick={() => setRunningPlaybook(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {runSuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Execution Audit Recorded</h4>
                <p className="text-xs text-gray-400 font-mono">{runSuccessMsg}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(runningPlaybook.steps || {}).map(([phase, steps]: [string, any]) => (
                    <div key={phase} className="space-y-2">
                      <h4 className="text-xs font-mono text-gray-400 uppercase font-bold">{phase} Steps</h4>
                      {Array.isArray(steps) &&
                        steps.map((stepText: string, idx: number) => {
                          const isChecked = completedSteps.includes(stepText);
                          return (
                            <div
                              key={idx}
                              onClick={() => toggleStepCompleted(stepText)}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                                isChecked ? 'bg-cyber-cyan/15 border-cyber-cyan text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'
                              }`}
                            >
                              <span className="text-xs">{stepText}</span>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-cyber-cyan border-cyber-cyan text-black' : 'border-gray-500'}`}>
                                {isChecked && <CheckCircle className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <span className="text-xs font-mono text-gray-400">
                    {completedSteps.length} steps checked
                  </span>
                  <Button onClick={handleFinishRun} disabled={isSubmittingRun || completedSteps.length === 0} className="bg-cyber-cyan text-black font-bold">
                    {isSubmittingRun ? 'Recording Audit...' : 'Finish & Record Audit Log'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Custom Playbook Builder */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveCustomPlaybook} className="bg-[#0f0f13] border border-white/15 rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyber-cyan" /> Author Custom Playbook
              </h3>
              <button type="button" onClick={() => setIsBuilderOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-400 mb-1 uppercase">Playbook Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS S3 Bucket Data Exfiltration Response"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 uppercase">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-cyan"
                  >
                    <option value="Cloud Security">Cloud Security</option>
                    <option value="Network Isolation">Network Isolation</option>
                    <option value="Identity & Auth">Identity & Auth</option>
                    <option value="RAG Security">RAG Security</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 uppercase">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-cyan"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 uppercase">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief summary of the incident response objective..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-cyan resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 uppercase">Containment Steps (Semicolon Separated)</label>
                <input
                  type="text"
                  value={newStepContainment}
                  onChange={(e) => setNewStepContainment(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-cyan"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 uppercase">Eradication Steps (Semicolon Separated)</label>
                <input
                  type="text"
                  value={newStepEradication}
                  onChange={(e) => setNewStepEradication(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-cyan"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setIsBuilderOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingPlaybook} className="bg-cyber-cyan text-black font-bold">
                {isSavingPlaybook ? 'Saving...' : 'Save Playbook to DB'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
