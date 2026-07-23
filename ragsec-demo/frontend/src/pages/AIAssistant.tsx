import { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Send, Bot, User, Loader2, ShieldCheck, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIAssistant() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Hello, I am the RAGSec AI Assistant. I use time-aware retrieval to provide the most current and critical threat intelligence. How can I help you today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });
      const data = await res.json();
      setMessages(prev => [...prev, data]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to connect to backend.',
        confidence: 0,
        evidence: []
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full min-w-0 flex flex-col space-y-4 animate-in fade-in duration-500">
      <header className="shrink-0">
        <h1 className="text-3xl font-bold">AI Threat Assistant</h1>
        <p className="text-gray-400">Grounded analysis with evidence and confidence scores.</p>
      </header>

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden p-0 border-white/10 relative">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-surface border border-white/10'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-accent" />}
              </div>
              
              <div className={`max-w-[80%] space-y-3 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                <div className={`p-4 rounded-xl ${msg.role === 'user' ? 'bg-primary text-background' : 'bg-surface/80 border border-white/5'}`}>
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
                
                {/* RAGSec Specifics: Evidence and Confidence */}
                {msg.role === 'assistant' && msg.evidence && (
                  <div className="bg-surface/50 border border-white/5 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-accent">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="font-semibold">AI Confidence: {(msg.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <Badge variant="high">Retrieval Grounded</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Evidence Sources</p>
                      {msg.evidence.map((ev: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="break-all">{ev}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              </div>
              <div className="p-4 rounded-xl bg-surface/80 border border-white/5 flex items-center">
                <span className="text-gray-400">Analyzing latest intelligence...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-surface/80 border-t border-white/10">
          <div className="flex gap-4 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about recent threats, zero-days, or specific CVEs..."
              className="flex-1 bg-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="lg" className="w-14 px-0">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex gap-2 justify-center mt-3 text-xs text-gray-500">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => setInput("What are today's critical CVEs?")}>"What are today's critical CVEs?"</span>
            <span>•</span>
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => setInput("Summarize latest ransomware activity")}>"Summarize latest ransomware activity"</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
