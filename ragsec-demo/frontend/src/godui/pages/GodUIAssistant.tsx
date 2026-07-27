import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const GodUIAssistant: React.FC = () => {
    const [messages, setMessages] = useState<{role: string, content: string}[]>([
        { role: 'assistant', content: "System initialized. RAGSEC Copilot v3 is online. How can I assist with your investigation today?" }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        setInput('');
        setIsThinking(true);
        
        // Mock response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: "I've analyzed the telemetry. The anomalous payload matches a known CVE from the CISA catalog affecting the API gateway. I recommend initiating the incident response playbook immediately." }]);
            setIsThinking(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto border border-white/5 bg-black/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Ambient GodUI Glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-fixed to-transparent opacity-50"></div>
            
            <header className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-fixed/20 to-primary-fixed/5 border border-primary-fixed/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary-fixed">smart_toy</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">RAGSEC Copilot</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs text-white/50 font-mono">Llama 3.2 (Local)</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary-fixed text-black' : 'bg-white/5 border border-white/10 text-white/90'}`}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                    {isThinking && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary-fixed animate-bounce"></span>
                                <span className="w-2 h-2 rounded-full bg-primary-fixed animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                <span className="w-2 h-2 rounded-full bg-primary-fixed animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Prompt Composer */}
            <div className="p-4 shrink-0 bg-white/[0.01]">
                <div className="relative group/composer">
                    {/* Glowing border effect on hover */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-fixed to-purple-500 rounded-3xl opacity-0 group-focus-within/composer:opacity-30 blur transition duration-500"></div>
                    
                    <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-inner">
                        <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors shrink-0">
                            <span className="material-symbols-outlined">attach_file</span>
                        </button>
                        
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask Copilot to query the RAG database..."
                            className="flex-1 bg-transparent border-none outline-none text-white px-3 text-sm placeholder:text-white/30"
                        />
                        
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isThinking}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${input.trim() ? 'bg-primary-fixed text-black hover:scale-105' : 'bg-white/5 text-white/30'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </div>
                </div>
                
                <div className="flex gap-2 justify-center mt-4">
                    {['Query latest CVEs', 'Summarize IoCs', 'Analyze network logs'].map((prompt, i) => (
                        <button key={i} onClick={() => setInput(prompt)} className="text-xs font-mono text-white/40 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5 transition-colors">
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
