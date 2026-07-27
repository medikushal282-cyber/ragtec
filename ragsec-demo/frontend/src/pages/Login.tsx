import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch('http://localhost:8000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      login(data.access_token);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cyber-black text-white scanline-container relative">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="z-10 w-full max-w-md p-8 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center mb-4 glow-cyan">
            <ShieldCheck className="w-8 h-8 text-cyber-cyan" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest uppercase">RAG<span className="text-cyber-cyan">SEC+</span></h1>
          <p className="text-sm text-gray-400 font-mono mt-1">SECURE SOC LOGIN</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm font-mono text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">USERNAME</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-cyber-cyan focus:outline-none transition-colors"
                placeholder="admin"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-cyber-cyan focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-cyan hover:bg-cyber-cyan/80 text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'AUTHENTICATE'}
          </button>
          
          <button
            type="button"
            onClick={async () => {
              setUsername('admin');
              setPassword('ragsec2026');
              
              setLoading(true);
              setError('');
              try {
                const formData = new URLSearchParams();
                formData.append('username', 'admin');
                formData.append('password', 'ragsec2026');

                const res = await fetch('http://localhost:8000/api/auth/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: formData.toString()
                });

                if (!res.ok) throw new Error('Invalid credentials');
                const data = await res.json();
                login(data.access_token);
                navigate('/app/dashboard');
              } catch (err: any) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full mt-3 bg-transparent border border-cyber-cyan/30 hover:bg-cyber-cyan/10 text-cyber-cyan font-bold py-3 rounded-lg transition-all flex items-center justify-center text-xs tracking-wider"
          >
            QUICK DEMO LOGIN
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs font-mono text-gray-500">
          AUTHORIZED PERSONNEL ONLY
        </div>
      </div>
    </div>
  );
}
