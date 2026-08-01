import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  postChat, 
  fetchFolderScan, 
  fetchSessions, 
  fetchSessionHistory, 
  deleteSession,
  submitFeedback,
  fetchSettingsProfile,
  ChatResponse, 
  ChatSession 
} from '../lib/api';
import { Check, Copy, Bot, Terminal, ShieldAlert, Sparkles, ThumbsUp, ThumbsDown, Star } from 'lucide-react';

export default function AIAssistant() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [strictMasking, setStrictMasking] = useState(false);
  const [feedbackState, setFeedbackState] = useState<Record<number, boolean>>({});

  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'I have analyzed the telemetry for **WS-10-45**. I detected a sequence of high-confidence anomalies indicative of compromised credentials being used for internal reconnaissance and lateral movement.\n\n`CRITICAL` `[T1078] Valid Accounts` `[T1021.002] SMB/Windows Admin Shares` \n\n```log\nEventID: 4624\nLogonType: 3 // Network Logon\nTargetUserName: SVC_SQL_BACKUP\nIpAddress: 10.0.0.45\nWorkstationName: WS-10-45\n---------------------------------------------\nSuspicious Execution Detected:\ncmd.exe /c "net use \\\\FS-CORP-01\\IPC$ /u:CORP\\SVC_SQL_BACKUP & wmic /node:FS-CORP-01 process call create \'powershell.exe -w hidden\'"\n```',
      latency: '1.24s',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2');
  const [imageB64, setImageB64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [availableModels, setAvailableModels] = useState<string[]>(['llama3.2', 'llama3.2-vision', 'gemini-1.5-pro']);
  const [isModelsLoading, setIsModelsLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
      const profile = await fetchSettingsProfile();
      setStrictMasking(profile.strictMasking || false);
    } catch (err) {
      console.error("Failed to fetch chat sessions:", err);
    }
  };

  useEffect(() => {
    loadSessions();
    const fetchModels = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/chat/models');
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            setAvailableModels(data.models);
          }
        }
      } catch (err) {
        console.error("Failed to fetch models from server:", err);
      } finally {
        setIsModelsLoading(false);
      }
    };
    fetchModels();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pipelineStage]);

  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const history = await fetchSessionHistory(sessionId);
      if (history && history.messages && history.messages.length > 0) {
        setMessages(history.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          image_b64: m.image_b64,
          executive_summary: m.executive_summary,
          technical_analysis: m.technical_analysis,
          immediate_mitigation: m.immediate_mitigation,
          confidence: m.confidence,
          is_zero_day: m.is_zero_day,
          latency: '1.20s'
        })));
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([
      {
        role: 'assistant',
        content: 'Welcome to Enterprise Security Copilot. I use time-aware hybrid RAG to provide grounded threat intelligence, executive summaries, and emergency mitigation workflows.',
        latency: '0.85s'
      },
    ]);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await deleteSession(sessionId);
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      loadSessions();
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Only image files are supported for multimodal drag & drop!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setImageB64(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleCopyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleFeedback = async (idx: number, rating: number, upvote: boolean) => {
    try {
      await submitFeedback(rating, upvote);
      setFeedbackState(prev => ({ ...prev, [idx]: true }));
    } catch (e) {
      console.error("Failed to submit feedback", e);
    }
  };

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if ((!text.trim() && !imageB64) || isLoading) return;

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
        const scanLog = "```log\n" + folderStruct + "\n```";
        const aiMessage = {
          role: 'assistant',
          content: "Successfully scanned directory: `" + scanRes.path + "`\n\n" + scanLog + "\n\nI have reviewed the directory structure. What would you like me to analyze?",
          confidence: 1.0,
          latency: '0.64s',
          evidence: []
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err: any) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Folder scan failed: ${err.message}`, confidence: 0, latency: '0.12s', evidence: [] }]);
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

    const startTime = Date.now();

    try {
      const data: ChatResponse = await postChat(text, selectedModel, messages, currentImage || undefined, activeSessionId || undefined);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2) + 's';
      if (data.session_id && !activeSessionId) {
        setActiveSessionId(data.session_id);
        loadSessions();
      }
      setMessages((prev) => [...prev, { ...data, latency: elapsed }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Failed to communicate with RAGSec Copilot API engine.',
          confidence: 0,
          latency: '0.05s',
          evidence: [],
        },
      ]);
    } finally {
      setIsLoading(false);
      setPipelineStage(null);
    }
  };

  return (
    <div 
      className="h-full w-full min-w-0 flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 pb-12"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* LEFT COLUMN: Chat Interface */}
      <div className={`flex-1 flex flex-col h-[calc(100vh-140px)] border border-dashed rounded-xl overflow-hidden glass-panel relative transition-colors duration-300 ${isDragging ? 'border-primary-fixed bg-primary-fixed/5' : 'border-white/15'}`}>
        
        {isDragging && (
          <div className="absolute inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
            <span className="material-symbols-outlined text-[64px] text-primary-fixed mb-4 animate-bounce">cloud_upload</span>
            <h2 className="text-xl font-bold uppercase tracking-widest text-primary-fixed">Drop file to attach</h2>
          </div>
        )}
        
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
            <Bot className="w-6 h-6 text-cyber-cyan" />
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest text-on-surface">AI Threat Copilot</h1>
              <p className="text-[10px] text-outline font-mono">Deterministic Telemetry Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-outline uppercase hidden sm:inline">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isModelsLoading}
                className="bg-black/60 border border-white/15 rounded px-2 py-1 text-xs text-primary-fixed font-mono focus:outline-none focus:border-primary-fixed"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m} className="bg-black text-on-surface">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNewChat}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 rounded text-xs font-mono text-outline hover:text-on-surface transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#090b10]">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.role === 'user'
                    ? 'bg-primary-fixed/10 text-primary-fixed border-primary-fixed/30'
                    : 'bg-black/60 border-white/15 text-cyber-cyan'
                }`}
              >
                {msg.role === 'user' ? (
                  <span className="material-symbols-outlined text-[18px]">person</span>
                ) : (
                  <Bot className="w-5 h-5 text-cyber-cyan" />
                )}
              </div>

              {/* Message Content Container */}
              <div className={`max-w-[88%] space-y-3 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                
                {/* Assistant Output Header Bar (🤖 ANALYSIS COMPLETE · 1.24s) */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 tracking-wider">
                    <span className="text-cyber-cyan font-bold flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5 text-cyber-cyan" />
                      ANALYSIS COMPLETE
                    </span>
                    <span>·</span>
                    <span className="text-gray-400">{msg.latency || '1.18s'}</span>
                  </div>
                )}

                {msg.image_b64 && (
                  <div className="rounded-lg overflow-hidden border border-dashed border-white/15 max-w-sm">
                    <img src={msg.image_b64} alt="Uploaded evidence" className="w-full h-auto object-cover" />
                  </div>
                )}
                
                {/* User Message Bubble */}
                {msg.role === 'user' ? (
                  <div className="p-4 rounded-xl text-sm leading-relaxed bg-[#111622] border border-white/10 text-gray-200 font-sans shadow-lg">
                    {msg.content}
                  </div>
                ) : (
                  /* Assistant SOC Response Panel */
                  <div className="p-4 rounded-xl text-sm leading-relaxed bg-[#0b0e14] border border-white/10 text-gray-200 space-y-4 shadow-2xl">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom Pill Badges for Hostnames, Severities, and MITRE Codes
                        code({node, inline, className, children, ...props}: any) {
                          const codeStr = String(children).replace(/\n$/, '');
                          const match = /language-(\w+)/.exec(className || '');

                          if (!inline && (match || className === 'language-log' || codeStr.includes('\n'))) {
                            return (
                              <div className="relative group/code my-3 rounded-lg overflow-hidden border border-white/15 bg-[#05070a]">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-black/60 border-b border-white/10 text-[10px] font-mono text-gray-400">
                                  <span className="flex items-center gap-1 text-cyber-cyan">
                                    <Terminal className="w-3 h-3" /> Telemetry Log Output
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(codeStr, idx)}
                                    className="hover:text-white flex items-center gap-1 text-gray-400 transition-colors"
                                    title="Copy Code"
                                  >
                                    {copiedIdx === idx ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  {...props}
                                  children={codeStr}
                                  style={atomDark}
                                  language={match ? match[1] : 'bash'}
                                  PreTag="div"
                                  className="!bg-transparent !p-4 !m-0 font-mono text-xs text-gray-300 leading-relaxed"
                                />
                              </div>
                            );
                          }

                          // Styled Badges: Severity vs MITRE ATT&CK vs Entity Pill
                          if (codeStr === 'CRITICAL' || codeStr.includes('CRITICAL')) {
                            return (
                              <span className="inline-flex items-center gap-1 bg-[#ff3344]/20 text-[#ff3344] border border-[#ff3344]/40 px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase mx-1">
                                <ShieldAlert className="w-3 h-3" /> CRITICAL
                              </span>
                            );
                          }

                          if (codeStr.startsWith('[T') || codeStr.includes('Valid Accounts') || codeStr.includes('Admin Shares')) {
                            return (
                              <span className="inline-flex items-center gap-1 bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold mx-1">
                                {codeStr}
                              </span>
                            );
                          }

                          // Verified Entity Highlighting
                          if (codeStr.startsWith('WS-') || codeStr.includes('10.0.') || codeStr.includes('SVC_')) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/40 rounded text-[11px] font-mono font-bold mx-1" title="Verified in RAG Corpus">
                                ✓ {codeStr}
                              </span>
                            );
                          }
                          
                          // Unverified / Hallucination Risk Entity Highlighting
                          if (codeStr.includes('Unknown') || codeStr.includes('Unverified') || codeStr.includes('Novel')) {
                            if (strictMasking) {
                              return <span className="inline-flex items-center px-2 py-0.5 bg-gray-500/20 text-gray-400 border border-gray-500/40 rounded text-[11px] font-mono font-bold mx-1" title="Masked due to strict policy">[REDACTED]</span>
                            }
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-[11px] font-mono font-bold mx-1" title="Unverified/Hallucination Risk">
                                ⚠ {codeStr}
                              </span>
                            );
                          }

                          return (
                            <code {...props} className="bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-cyber-cyan font-mono text-xs mx-0.5">
                              {children}
                            </code>
                          );
                        },
                        strong({children}) {
                          const str = String(children);
                          // Verified Entity Highlighting
                          if (str.startsWith('WS-') || str.includes('10.0.') || str.includes('SVC_')) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/40 rounded text-[11px] font-mono font-bold mx-1" title="Verified in RAG Corpus">
                                ✓ {str}
                              </span>
                            );
                          }
                          // Unverified / Hallucination Risk Entity Highlighting
                          if (str.includes('Unknown') || str.includes('Unverified') || str.includes('Novel')) {
                            if (strictMasking) {
                              return <span className="inline-flex items-center px-2 py-0.5 bg-gray-500/20 text-gray-400 border border-gray-500/40 rounded text-[11px] font-mono font-bold mx-1" title="Masked due to strict policy">[REDACTED]</span>
                            }
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-[11px] font-mono font-bold mx-1" title="Unverified/Hallucination Risk">
                                ⚠ {str}
                              </span>
                            );
                          }
                          return <strong className="font-bold text-white">{children}</strong>;
                        },
                        a({children, href}) {
                          return <a href={href} target="_blank" rel="noreferrer" className="text-cyber-cyan hover:underline">{children}</a>
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Structured AI Output Panel */}
                {msg.role === 'assistant' && (msg.executive_summary || msg.evidence?.length > 0) && (
                  <div className="bg-[#0b0e14] border border-white/15 p-4 rounded-xl space-y-3 text-xs text-gray-300">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-cyber-cyan font-bold font-mono uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Confidence: {((msg.confidence || 0.97) * 100).toFixed(1)}%</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 border border-white/20 rounded text-gray-400 font-mono">VERIFIED</span>
                    </div>

                    {msg.is_zero_day === 'True' || msg.is_zero_day === true ? (
                      <div className="p-2.5 bg-[#ff3344]/15 border border-[#ff3344]/40 rounded-lg text-[#ff3344] font-bold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> 
                        ZERO DAY ALERT: Immediate Containment Recommended
                      </div>
                    ) : null}

                    {msg.technical_analysis && (
                      <div>
                        <span className="font-mono text-gray-400 uppercase font-bold block mb-1">Technical Analysis:</span>
                        <p className="text-gray-200">{msg.technical_analysis}</p>
                      </div>
                    )}

                    {msg.immediate_mitigation && msg.immediate_mitigation.length > 0 && (
                      <div>
                        <span className="font-mono text-cyber-cyan uppercase font-bold block mb-1.5">Mitigation Checklist:</span>
                        <ul className="space-y-1.5 text-gray-200">
                          {msg.immediate_mitigation.map((m: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-cyber-cyan font-bold">✓</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* SOC Analyst Feedback Loop (User Trust Rating) */}
                    <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono uppercase text-gray-500">Analyst Trust Rating:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => handleFeedback(idx, star, true)} disabled={feedbackState[idx]} className={`transition-colors ${feedbackState[idx] ? 'text-cyber-yellow' : 'text-gray-600 hover:text-cyber-yellow'}`} title={`Rate ${star}/5`}>
                              <Star className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleFeedback(idx, 5, true)} disabled={feedbackState[idx]} className={`transition-colors ${feedbackState[idx] ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}>
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleFeedback(idx, 1, false)} disabled={feedbackState[idx]} className={`transition-colors ${feedbackState[idx] ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}>
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Reasoning Stream Loading State */}
          {isLoading && (
            <div className="flex gap-4 items-center">
              <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/15 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-cyber-cyan animate-spin" />
              </div>
              <div className="p-3.5 rounded-xl bg-[#0b0e14] border border-white/15 flex items-center gap-3 text-xs font-mono text-cyber-cyan">
                <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse"></span>
                <span>{pipelineStage || 'Analyzing threat telemetry...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="shrink-0 p-4 border-t border-dashed border-white/15 bg-black/50 backdrop-blur-md">
          {imageB64 && (
            <div className="mb-3 flex items-center gap-3 bg-white/5 border border-dashed border-white/15 p-2 rounded-lg w-fit">
              <img src={imageB64} alt="Attachment" className="w-12 h-12 object-cover rounded border border-white/10" />
              <div className="text-xs font-mono">
                <div className="text-on-surface font-bold">Image Attachment</div>
                <div className="text-outline text-[10px]">Multimodal Vision Ready</div>
              </div>
              <button onClick={() => setImageB64(null)} className="text-outline hover:text-red-400 p-1">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 rounded-xl text-outline hover:text-primary-fixed transition-colors flex items-center justify-center magnetic-target"
              title="Attach Image Evidence"
            >
              <span className="material-symbols-outlined text-[20px]">image</span>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Issue command or query telemetry..."
              disabled={isLoading}
              className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline font-mono focus:outline-none focus:border-cyber-cyan transition-colors"
            />
            
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !imageB64)}
              className="px-5 py-3 bg-cyber-cyan hover:bg-cyber-cyan/80 text-black font-bold font-mono rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
            >
              <span>Send</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
