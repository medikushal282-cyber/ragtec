import React, { useState } from 'react';
import { API_BASE } from '../lib/utils';

interface Endpoint {
  method: 'GET' | 'POST' | 'WS';
  path: string;
  desc: string;
  sampleBody?: string;
}

export default function APIExplorer() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selected, setSelected] = useState<Endpoint | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bodyInput, setBodyInput] = useState('');

  React.useEffect(() => {
    fetch(`${API_BASE}/openapi.json`)
      .then(res => res.json())
      .then(data => {
        const loadedEndpoints: Endpoint[] = [];
        for (const [path, methods] of Object.entries(data.paths || {})) {
          for (const [method, details] of Object.entries(methods as any)) {
            loadedEndpoints.push({
              method: method.toUpperCase() as any,
              path: path,
              desc: (details as any).summary || (details as any).description || 'No description available',
              sampleBody: ['post', 'put', 'patch'].includes(method) ? '{\n  "example": "data"\n}' : undefined
            });
          }
        }
        setEndpoints(loadedEndpoints);
        if (loadedEndpoints.length > 0) {
          setSelected(loadedEndpoints[0]);
          setBodyInput(loadedEndpoints[0].sampleBody || '');
        }
      })
      .catch(console.error);
  }, []);

  const executeCall = async () => {
    if (!selected) return;
    if (selected.method === 'WS') {
      setResponse({ message: 'WebSocket connections cannot be tested via REST client. Please refer to WS documentation.' });
      return;
    }
    
    setLoading(true);
    setResponse(null);
    try {
      const options: RequestInit = {
        method: selected.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (selected.method === 'POST' && bodyInput) {
        options.body = bodyInput;
      }
      const res = await fetch(`${API_BASE}${selected.path}`, options);
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setResponse({ error: err.message || 'Failed to communicate with API' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full min-w-0 max-w-7xl mx-auto pb-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-on-surface">API Explorer</h1>
        <p className="text-sm text-outline mt-1">Interactive sandbox for RAGSec+ REST and WebSocket endpoints</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Endpoints Sidebar */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
          <header className="p-4 border-b border-dashed border-white/15 bg-black/40 flex items-center justify-between shrink-0">
             <h2 className="text-xs font-bold uppercase tracking-widest text-outline flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-2">route</span> Endpoints
             </h2>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {endpoints.map((ep) => (
              <div
                key={`${ep.method}-${ep.path}`}
                onClick={() => {
                  setSelected(ep);
                  setBodyInput(ep.sampleBody || '');
                  setResponse(null);
                }}
                className={`p-3 rounded-lg cursor-none transition-all flex flex-col gap-1 magnetic-target ${
                  selected?.path === ep.path && selected?.method === ep.method
                    ? 'bg-primary-fixed/10 border border-dashed border-primary-fixed/40' 
                    : 'bg-white/5 border border-dashed border-white/10 hover:border-primary-fixed/30 hover:bg-white/10 group'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      ep.method === 'GET' ? 'bg-secondary-fixed/20 text-secondary-fixed' : 
                      ep.method === 'POST' ? 'bg-primary-fixed/20 text-primary-fixed' :
                      'bg-secondary-container/20 text-secondary-container'
                  }`}>
                    {ep.method}
                  </span>
                  <span className={`mono text-[11px] font-bold ${selected?.path === ep.path && selected?.method === ep.method ? 'text-primary-fixed' : 'text-on-surface group-hover:text-primary-fixed/80'}`}>{ep.path}</span>
                </div>
                <span className="text-[10px] text-outline ml-10 truncate">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel rounded-xl overflow-hidden shrink-0 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <header className="p-4 border-b border-dashed border-white/15 bg-black/40 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`mono text-xs font-bold px-2 py-0.5 rounded ${
                      selected?.method === 'GET' ? 'bg-secondary-fixed/20 text-secondary-fixed border border-dashed border-secondary-fixed/30' : 
                      selected?.method === 'POST' ? 'bg-primary-fixed/20 text-primary-fixed border border-dashed border-primary-fixed/30' :
                      'bg-secondary-container/20 text-secondary-container border border-dashed border-secondary-container/30'
                  }`}>
                    {selected?.method}
                  </span>
                  <span className="mono text-sm font-bold text-on-surface group-hover:text-primary-fixed transition-colors">{API_BASE}{selected?.path}</span>
                </div>
                <p className="text-[11px] text-outline mt-2">{selected?.desc}</p>
              </div>
              <button 
                onClick={executeCall} 
                disabled={loading || selected?.method === 'WS'} 
                className="kinetic-btn px-4 py-2 rounded text-xs font-bold uppercase flex items-center disabled:opacity-50 disabled:cursor-not-allowed cursor-none"
              >
                <span className={`material-symbols-outlined mr-2 text-[16px] ${loading ? 'animate-spin' : ''}`}>
                    {loading ? 'refresh' : 'play_arrow'}
                </span> 
                {loading ? 'Executing' : 'Send'}
              </button>
            </header>

            {selected?.method === 'POST' && (
              <div className="p-4 bg-black/20 group">
                <label className="text-[10px] font-mono text-outline uppercase tracking-wider block mb-2 group-hover:text-primary-fixed transition-colors">Request Body (JSON)</label>
                <textarea
                  rows={4}
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  className="w-full bg-black/50 border border-dashed border-white/15 rounded-lg p-4 font-mono text-xs text-primary-fixed outline-none focus:border-primary-fixed transition-all resize-none hover:bg-black/60"
                />
              </div>
            )}
          </div>

          {/* Response Window */}
          <div className="glass-panel rounded-xl flex flex-col flex-1 overflow-hidden">
            <header className="p-3 border-b border-dashed border-white/15 bg-black/40 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono text-outline uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-primary-fixed">data_object</span> Response Payload
              </span>
              {response && !response.error && selected?.method !== 'WS' && (
                <span className="text-[10px] font-mono text-primary-fixed bg-primary-fixed/10 border border-primary-fixed/20 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span> 200 OK
                </span>
              )}
              {response?.error && (
                <span className="text-[10px] font-mono text-secondary-container bg-secondary-container/10 border border-secondary-container/20 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                  <span className="material-symbols-outlined text-[12px]">error</span> ERROR
                </span>
              )}
            </header>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                <pre className="font-mono text-[11px] text-secondary-fixed whitespace-pre-wrap break-words">
                {response ? JSON.stringify(response, null, 2) : '// Click "Send Request" to execute endpoint and view response.'}
                </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
