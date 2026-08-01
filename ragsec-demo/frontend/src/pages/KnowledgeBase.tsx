import React, { useState, useEffect, useRef } from 'react';
import { fetchKBDocuments, uploadKBDocument } from '../lib/api';

export default function KnowledgeBase() {
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = () => {
    fetchKBDocuments().then(setDocuments).catch(console.error);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadKBDocument(file);
      loadDocs();
      alert(`Successfully ingested '${file.name}' into vector database!`);
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = documents.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full min-w-0 max-w-6xl mx-auto pb-12">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-on-surface">Knowledge Base & Memory</h1>
          <p className="text-sm text-outline mt-1">Vector DB management and retrieval corpus</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-4 py-2 rounded flex flex-col">
              <span className="text-[10px] font-mono text-outline uppercase">Total Vectors</span>
              <span className="font-bold text-primary-fixed">1,248,932</span>
          </div>
          <div className="glass-panel px-4 py-2 rounded flex flex-col border-secondary-container/30 bg-secondary-container/5">
              <span className="text-[10px] font-mono text-secondary-container uppercase">Index Health</span>
              <span className="font-bold text-secondary-container">99.8% OPTIMAL</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Ingestion & Search */}
        <div className="space-y-6">
            {/* Search Input */}
            <div className="glass-panel p-4 rounded-xl space-y-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search vector corpus..."
                      className="w-full bg-black/40 border border-dashed border-white/15 rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder-outline focus:border-primary-fixed outline-none transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 bg-white/5 border border-dashed border-white/15 rounded py-1.5 text-[10px] font-mono text-outline hover:text-primary-fixed hover:border-primary-fixed/30 transition-colors magnetic-target cursor-none">CISA KEV</button>
                    <button className="flex-1 bg-white/5 border border-dashed border-white/15 rounded py-1.5 text-[10px] font-mono text-outline hover:text-primary-fixed hover:border-primary-fixed/30 transition-colors magnetic-target cursor-none">MITRE</button>
                    <button className="flex-1 bg-white/5 border border-dashed border-white/15 rounded py-1.5 text-[10px] font-mono text-outline hover:text-primary-fixed hover:border-primary-fixed/30 transition-colors magnetic-target cursor-none">OWASP</button>
                </div>
            </div>

            {/* Ingestion Drop Zone */}
            <div className="glass-panel p-6 rounded-xl border-dashed border-2 border-outline/30 hover:border-primary-fixed/50 transition-colors flex flex-col items-center justify-center text-center group cursor-none magnetic-target min-h-[250px]">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".txt,.pdf,.json,.stix"
                />
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-primary-fixed/10 group-hover:text-primary-fixed group-hover:scale-110 transition-all">
                    <span className={`material-symbols-outlined text-[24px] ${isUploading ? 'animate-spin text-primary-fixed' : ''}`}>
                      {isUploading ? 'sync' : 'upload_file'}
                    </span>
                </div>
                <h3 className="text-sm font-bold text-on-surface mb-2">Ingest Threat Intel</h3>
                <p className="text-xs text-outline mb-4">Drag and drop PDFs, STIX/TAXII JSON, or raw text to embed.</p>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading}
                  className="kinetic-btn px-6 py-2 rounded text-xs font-bold uppercase cursor-none disabled:opacity-50"
                >
                  {isUploading ? 'Embedding Vector...' : 'Browse Files'}
                </button>
            </div>
        </div>

        {/* Right Column: Vector List */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col h-[600px]">
          <header className="p-4 border-b border-dashed border-white/15 bg-black/40 flex justify-between items-center shrink-0">
             <h2 className="text-xs font-bold uppercase tracking-widest text-outline flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-2">dataset</span> Vector Chunks
             </h2>
             <span className="text-[10px] font-mono text-primary-fixed px-2 py-0.5 bg-primary-fixed/10 rounded">LIVE SYNC</span>
          </header>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {filtered.map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-black/20 border border-dashed border-white/10 hover:border-primary-fixed/30 transition-colors magnetic-target cursor-none group">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-primary-fixed">menu_book</span>
                        <span className="mono text-[10px] text-primary-fixed uppercase font-bold px-1.5 py-0.5 bg-primary-fixed/10 rounded">{item.category}</span>
                        <span className="mono text-[10px] text-outline ml-2">{item.id}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-[9px] font-mono text-outline px-1.5 py-0.5 border border-dashed border-white/10 rounded">SIM: {item.similarity}</span>
                        <span className="text-[9px] font-mono text-secondary-container px-1.5 py-0.5 bg-secondary-container/10 border border-dashed border-secondary-container/20 rounded">{item.status}</span>
                    </div>
                </div>
                <h3 className="text-sm font-bold text-on-surface mb-2 group-hover:text-primary-fixed transition-colors">{item.title}</h3>
                <p className="text-xs text-outline leading-relaxed">{item.content}</p>
                
                <div className="mt-4 pt-3 border-t border-dashed border-white/10 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[10px] font-mono text-outline hover:text-primary-fixed flex items-center gap-1 cursor-none">
                        <span className="material-symbols-outlined text-[12px]">code</span> View JSON
                    </button>
                    <button className="text-[10px] font-mono text-outline hover:text-secondary-container flex items-center gap-1 cursor-none">
                        <span className="material-symbols-outlined text-[12px]">delete</span> Remove
                    </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-outline opacity-50 space-y-2">
                    <span className="material-symbols-outlined text-[32px]">search_off</span>
                    <span className="text-sm">No vectors match your query.</span>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
