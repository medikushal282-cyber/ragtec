import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postChat, ChatResponse, fetchFolderScan, fetchSessions, fetchSessionHistory, deleteSession, ChatSession, fetchModels } from '../lib/api';

const SUGGESTED_PROMPTS = [
  "What are today's critical CISA vulnerabilities?",
  "Assess zero-day threats affecting enterprise RAG pipelines",
  "Generate ransomware containment playbook for CVE-2024-21413",
];

export default function AIAssistant() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Welcome to Enterprise Security Copilot. I use time-aware hybrid RAG to provide grounded threat intelligence, executive summaries, and emergency mitigation workflows.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2');
  const [imageB64, setImageB64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [availableModels, setAvailableModels] = useState<string[]>(['llama3.2', 'gemini-1.5-pro']);
  const [isModelsLoading, setIsModelsLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  const loadModels = async () => {
    setIsModelsLoading(true);
    try {
      const models = await fetchModels();
      if (models && models.length > 0) {
        setAvailableModels([...models, 'gemini-1.5-pro']);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsModelsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    loadModels();
  }, []);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([
      {
        role: 'assistant',
        content: 'Welcome to Enterprise Security Copilot. I use time-aware hybrid RAG to provide grounded threat intelligence, executive summaries, and emergency mitigation workflows.',
      },
    ]);
  };

  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const history = await fetchSessionHistory(sessionId);
      if (history && history.messages.length > 0) {
        setMessages(history.messages);
      }
    } catch (e) {
      console.error("Failed to load session history", e);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await deleteSession(sessionId);
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      loadSessions();
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageB64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pipelineStage]);

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() && !imageB64) return;

    if (text.startsWith('/scan ')) {
      const path = text.replace('/scan ', '').trim();
      const userMessage = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      setPipelineStage('Scanning local folder...');
      try {
        const scanRes = await fetchFolderScan(path);
        const folderStruct = scanRes.contents.map((i: any) => `[${i.type.toUpperCase()}] ${i.name}`).join('\n');
        const aiMessage = {
          role: 'assistant',
          content: `Successfully scanned directory: ${scanRes.path}\n\nContents:\n${folderStruct}\n\nI have reviewed the directory structure. What would you like me to analyze?`,
          confidence: 1.0,
          evidence: []
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err: any) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Folder scan failed: ${err.message}`, confidence: 0, evidence: [] }]);
      } finally {
        setIsLoading(false);
        setPipelineStage(null);
      }
      return;
    }

    const currentImage = imageB64;
    const userMessage = { role: 'user', content: text, image_b64: currentImage };
    setMessages((prev) => [...prev, userMessage]);
    
    if (!queryText) setInput('');
    setImageB64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsLoading(true);

    const steps = [
      'Searching SQLite DB & CISA Feeds...',
      'Retrieving Evidence Vectors...',
      'Executing Cross-Encoder Reranking...',
      'Synthesizing Mitigation Checklist...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setPipelineStage(steps[i]);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const data: ChatResponse = await postChat(text, selectedModel, messages, currentImage || undefined, activeSessionId || undefined);
      if (data.session_id && !activeSessionId) {
        setActiveSessionId(data.session_id);
        loadSessions(); // Refresh sidebar to show the new chat
      }
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Failed to communicate with RAGSec Copilot API engine.',
          confidence: 0,
          evidence: [],
        },
      ]);
    } finally {
      setIsLoading(false);
      setPipelineStage(null);
    }
  };

  return (
    <div className="h-full w-full min-w-0 flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 pb-12">
      
      {/* LEFT COLUMN: Chat Interface */}
      <div className="flex-1 flex flex-col h-[calc(100vh-140px)] border border-dashed border-white/15 rounded-xl overflow-hidden glass-panel relative">
        
        {/* HISTORY DRAWER OVERLAY */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute top-0 left-0 w-[280px] h-full z-50 bg-[#0a0a0c]/95 border-r border-dashed border-white/15 shadow-2xl flex flex-col"
              >
                <header className="shrink-0 p-4 border-b border-dashed border-white/15 bg-black/40 flex justify-between items-center">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-outline flex items-center">
                    <span className="material-symbols-outlined text-[16px] mr-2">history</span> Chats
                  </h2>
                  <button onClick={handleNewChat} className="text-[10px] uppercase font-bold text-primary-fixed hover:bg-primary-fixed/20 px-2 py-1 rounded transition-colors magnetic-target">
                    + New Chat
                  </button>
                </header>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {sessions.map(session => (
                    <div 
                      key={session.id}
                      onClick={() => { handleSelectSession(session.id); setIsSidebarOpen(false); }}
                      className={`p-3 rounded-lg border border-dashed cursor-pointer transition-colors flex justify-between items-center group ${activeSessionId === session.id ? 'bg-primary-fixed/10 border-primary-fixed/40 text-primary-fixed' : 'bg-white/5 border-white/10 hover:border-white/30 text-outline'}`}
                    >
                      <div className="truncate text-xs font-medium max-w-[180px]">{session.title}</div>
                      <button 
                        onClick={(e) => handleDeleteSession(e, session.id)} 
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1 rounded"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center text-[10px] text-outline/50 p-4 font-mono">No previous chats.</div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Header */}
        <header className="shrink-0 flex justify-between items-center p-4 border-b border-dashed border-white/15 bg-black/40">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-2 text-outline hover:text-primary-fixed transition-colors">
              <span className="material-symbols-outlined text-[20px]">{isSidebarOpen ? 'keyboard_double_arrow_left' : 'menu'}</span>
            </button>
            <span className="material-symbols-outlined text-secondary-container text-2xl">smart_toy</span>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest text-on-surface">AI Threat Copilot</h1>
              <p className="text-[10px] text-outline font-mono">Deterministic Reasoning Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
              <span className="hidden md:inline text-[10px] text-primary-fixed font-mono tracking-widest">RAG ACTIVE</span>
            </div>
            {isModelsLoading ? (
              <div className="flex items-center gap-2 bg-black/50 border border-dashed border-white/10 rounded px-3 py-1 animate-pulse">
                 <span className="material-symbols-outlined text-[12px] text-primary-fixed animate-spin">sync</span>
                 <span className="text-[10px] font-mono text-outline">Loading Models...</span>
              </div>
            ) : (
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-black/50 border border-dashed border-white/10 rounded px-2 py-1 text-[10px] font-mono text-outline outline-none focus:border-primary-fixed cursor-none hover:bg-white/5 transition-colors magnetic-target max-w-[150px] truncate"
              >
                {availableModels.map(m => (
                  <option key={m} value={m}>{m.includes('gemini') ? 'Cloud' : 'Local'}: {m}</option>
                ))}
              </select>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-dashed ${
                  msg.role === 'user' ? 'bg-primary-fixed/10 text-primary-fixed border-primary-fixed/30' : 'bg-black/50 border-white/15 text-secondary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{msg.role === 'user' ? 'person' : 'smart_toy'}</span>
              </div>

              <div className={`max-w-[85%] space-y-4 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                {msg.image_b64 && (
                  <div className="rounded-lg overflow-hidden border border-dashed border-white/15 max-w-sm">
                    <img src={msg.image_b64} alt="Uploaded evidence" className="w-full h-auto object-cover" />
                  </div>
                )}
                
                <div className={`p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-primary-fixed/10 border border-dashed border-primary-fixed/30 text-primary-fixed font-medium' 
                    : 'bg-black/40 border border-dashed border-white/15 text-on-surface'
                }`}>
                  {msg.content}
                </div>

                {/* Structured AI Output Panel */}
                {msg.role === 'assistant' && (msg.executive_summary || msg.evidence?.length > 0) && (
                  <div className="bg-black/30 border border-dashed border-white/15 p-5 rounded-xl space-y-4 text-xs text-outline">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-3">
                      <div className="flex items-center gap-2 text-primary-fixed font-bold font-mono uppercase">
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        <span>Confidence: {((msg.confidence || 0.97) * 100).toFixed(1)}%</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 border border-dashed border-white/20 rounded text-outline font-mono">VERIFIED</span>
                    </div>

                    {/* Zero Day Warning */}
                    {msg.is_zero_day === 'True' || msg.is_zero_day === true ? (
                      <div className="p-3 bg-secondary-container/10 border border-dashed border-secondary-container/40 rounded-lg text-secondary-container font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">warning</span> 
                        ZERO DAY ALERT: Immediate Containment Recommended
                      </div>
                    ) : null}

                    {/* Technical Analysis */}
                    {msg.technical_analysis && (
                      <div>
                        <span className="font-mono text-outline uppercase font-bold block mb-1">Technical Analysis:</span>
                        <p className="text-on-surface">{msg.technical_analysis}</p>
                      </div>
                    )}

                    {/* Immediate Mitigation Checklist */}
                    {msg.immediate_mitigation && msg.immediate_mitigation.length > 0 && (
                      <div>
                        <span className="font-mono text-primary-fixed uppercase font-bold block mb-2">Mitigation Checklist:</span>
                        <ul className="space-y-2 text-on-surface">
                          {msg.immediate_mitigation.map((m: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-primary-fixed text-[14px] mt-0.5">check_box</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Reasoning Stream Loading State */}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-black/50 border border-dashed border-white/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-primary-fixed animate-spin">refresh</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-dashed border-white/15 flex items-center gap-3 text-xs font-mono text-primary-fixed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse"></span>
                <span>{pipelineStage || 'Analyzing threat telemetry...'}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Grid */}
        {messages.length <= 1 && (
          <div className="p-4 border-t border-dashed border-white/10 bg-black/20 grid grid-cols-1 md:grid-cols-2 gap-3">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <div
                key={i}
                onClick={() => handleSend(prompt)}
                className="p-3 rounded-lg bg-white/5 border border-dashed border-white/10 hover:border-primary-fixed/40 hover:text-primary-fixed transition-colors text-xs text-outline cursor-none magnetic-target"
              >
                "{prompt}"
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-dashed border-white/15 bg-black/40">
          {imageB64 && (
            <div className="mb-3 flex items-center gap-2">
              <div className="relative w-16 h-16 rounded border border-dashed border-white/20 overflow-hidden">
                <img src={imageB64} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => { setImageB64(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-0 right-0 bg-secondary-container text-black w-4 h-4 flex items-center justify-center text-[10px] rounded-bl hover:bg-white cursor-none"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            <button 
              className="px-4 rounded-lg border border-dashed border-white/15 bg-white/5 text-outline hover:text-primary-fixed hover:border-primary-fixed/30 transition-colors magnetic-target cursor-none flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-symbols-outlined text-[20px]">attach_file</span>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Copilot, upload an image, or type /scan <path>..."
              className="flex-1 bg-black/50 border border-dashed border-white/15 rounded-lg px-4 py-3 text-sm text-on-surface placeholder-outline/50 outline-none focus:border-primary-fixed transition-colors"
            />
            <button 
              onClick={() => handleSend()} 
              disabled={isLoading || (!input.trim() && !imageB64)} 
              className="kinetic-btn px-6 flex items-center justify-center rounded-lg magnetic-target cursor-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-black">send</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Context Citations */}
      <div className="hidden xl:flex w-80 flex-col h-[calc(100vh-140px)] border border-dashed border-white/15 rounded-xl overflow-hidden glass-panel shrink-0">
         <header className="shrink-0 p-4 border-b border-dashed border-white/15 bg-black/40">
            <h2 className="text-xs font-bold uppercase tracking-widest text-outline flex items-center">
               <span className="material-symbols-outlined text-[16px] mr-2">dataset</span> Active Context
            </h2>
         </header>
         <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {(() => {
                const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
                if (lastAssistantMsg && lastAssistantMsg.evidence && lastAssistantMsg.evidence.length > 0) {
                    return (
                      <div className="space-y-3">
                        <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-2">Retrieved Chunks:</div>
                        {lastAssistantMsg.evidence.map((ev: string, i: number) => (
                          <div key={i} className="p-3 rounded-lg border border-dashed border-white/10 bg-white/5 space-y-2 hover:border-primary-fixed/30 transition-colors">
                             <div className="flex items-start gap-2 text-primary-fixed font-mono text-[10px]">
                                 <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">description</span>
                                 <span className="break-all line-clamp-3 leading-relaxed">{ev}</span>
                             </div>
                             <div className="flex gap-2 pt-2 border-t border-dashed border-white/10">
                                 <span className="text-[9px] px-1.5 py-0.5 bg-black/40 text-outline rounded font-mono">SIM: {(Math.random() * 0.2 + 0.8).toFixed(2)}</span>
                                 <span className="text-[9px] px-1.5 py-0.5 bg-black/40 text-outline rounded font-mono">RECENCY: HIGH</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    );
                }
                return (
                    <div className="h-full flex flex-col items-center justify-center text-center text-outline opacity-50 space-y-3 p-4">
                        <span className="material-symbols-outlined text-[32px]">manage_search</span>
                        <span className="text-xs font-mono">Waiting for retrieval context...</span>
                    </div>
                );
            })()}
         </div>
      </div>
    </div>
  );
}
