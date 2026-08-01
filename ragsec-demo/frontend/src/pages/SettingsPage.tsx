import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { User, Key, Shield, Bell, Database, Globe, Save, RefreshCw, Trash2, Plus, Moon, Sun } from 'lucide-react';
import { fetchSettingsProfile, updateSettingsProfile } from '../lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [profile, setProfile] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [username, setUsername] = useState('Administrator');
  const [mandatoryFeedback, setMandatoryFeedback] = useState(false);
  const [iamRole, setIamRole] = useState('L1 Analyst');
  const [strictMasking, setStrictMasking] = useState(false);

  useEffect(() => {
    fetchSettingsProfile().then(p => {
      setProfile(p);
      setTheme(p.theme || 'dark');
      setUsername(p.username || 'Administrator');
      setMandatoryFeedback(p.mandatoryFeedback || false);
      setIamRole(p.iamRole || 'L1 Analyst');
      setStrictMasking(p.strictMasking || false);
      if (p.theme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      await updateSettingsProfile({ username, theme, mandatoryFeedback, iamRole, strictMasking });
      setSaved(true);
      if (theme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
        <p className="text-gray-400">Configure platform endpoints, notification thresholds, and security preferences.</p>
      </header>

      <div className="space-y-6">
        <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-xl font-bold border border-white/10">
                  {profile ? profile.username?.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="font-bold text-white">{profile ? profile.username : 'Administrator'}</h3>
                  <p className="text-gray-400 text-sm">Super Admin</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Change Avatar</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent" 
                />
              </div>
            </div>
        </Card>

        {/* Global Theme Settings */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4" /> Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-bold">UI Theme</p>
              <p className="text-xs text-gray-400">Toggle between dark and light modes.</p>
            </div>
            <div className="flex items-center gap-2 bg-black/50 border border-white/10 p-1 rounded-lg">
              <button 
                onClick={() => setTheme('dark')}
                className={`p-2 rounded flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={`p-2 rounded flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>


        {/* API Keys */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-cyber-yellow uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4" /> LLM Integration Keys (Optional)
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400">OpenAI / Anthropic API Key (Development Mode):</label>
            <input
              type="password"
              placeholder="sk-proj-********************************"
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs font-mono text-white outline-none focus:border-cyber-cyan"
            />
            <p className="text-[10px] text-gray-500">Currently using RAGSec Smart Mock AI engine.</p>
          </div>
        </Card>

        {/* Advanced SOC Settings */}
        <Card className="p-6 space-y-6">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" /> Advanced RAGSec Enterprise Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-bold">Mandatory Analyst Feedback</p>
                <p className="text-xs text-gray-400">Require User Trust Rating before closing Critical threats.</p>
              </div>
              <button 
                onClick={() => setMandatoryFeedback(!mandatoryFeedback)}
                className={`relative w-12 h-6 rounded-full transition-colors ${mandatoryFeedback ? 'bg-cyber-cyan' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${mandatoryFeedback ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-bold">Strict Entity Masking</p>
                <p className="text-xs text-gray-400">Completely redact unverified entities (CVEs, IPs) instead of highlighting red.</p>
              </div>
              <button 
                onClick={() => setStrictMasking(!strictMasking)}
                className={`relative w-12 h-6 rounded-full transition-colors ${strictMasking ? 'bg-red-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${strictMasking ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="pt-2">
              <label className="text-xs font-mono text-gray-400 block mb-2">IAM Role Simulation (Data Classification Filtering)</label>
              <select 
                value={iamRole}
                onChange={(e) => setIamRole(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyber-cyan"
              >
                <option value="L1 Analyst">L1 Analyst (Restricted Playbook Access)</option>
                <option value="L2 Responder">L2 Responder (Standard Access)</option>
                <option value="L3 Threat Hunter">L3 Threat Hunter (Full Top-Secret Access)</option>
              </select>
              <p className="text-[10px] text-gray-500 mt-2">Adjusting this role will filter out confidential documents dynamically during vector retrieval.</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} variant="glow">
            <Save className="w-4 h-4 mr-2" /> {saved ? 'Settings Saved!' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}
