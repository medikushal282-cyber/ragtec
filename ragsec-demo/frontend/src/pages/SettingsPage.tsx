import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { User, Key, Shield, Bell, Database, Globe, Save, RefreshCw, Trash2, Plus } from 'lucide-react';
import { fetchSettingsProfile } from '../lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [profile, setProfile] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettingsProfile().then(setProfile).catch(console.error);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
                <input type="text" defaultValue={profile ? profile.username : 'System Administrator'} className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent" />
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

        <div className="flex justify-end">
          <Button onClick={handleSave} variant="glow">
            <Save className="w-4 h-4 mr-2" /> {saved ? 'Settings Saved!' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}
