import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Database, Server, Cpu, Shield, Layers, FileSearch, CheckCircle } from 'lucide-react';

export default function Architecture() {
  const flowSteps = [
    { id: 1, title: 'Threat Feeds', icon: Database, desc: 'Heterogeneous security telemetry and reports' },
    { id: 2, title: 'Processing & Indexing', icon: Layers, desc: 'Parsing, chunking, and metadata tagging (Severity, Trust)' },
    { id: 3, title: 'Vector Database', icon: Server, desc: 'Semantic embeddings storage' },
    { id: 4, title: 'Time-Aware Retrieval', icon: FileSearch, desc: 'Ranks chunks by Sim + Time + Risk + Trust' },
    { id: 5, title: 'Grounded LLM', icon: Cpu, desc: 'Generates evidence-backed responses and citations' },
    { id: 6, title: 'SOC Dashboard', icon: Shield, desc: 'Presents verified intelligence to analysts' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-500">
      <header className="text-center mb-16">
        <h1 className="text-4xl font-extrabold mb-4">RAGSec Architecture</h1>
        <p className="text-gray-400 text-lg">An enterprise-grade retrieval pipeline designed for high-stakes security operations.</p>
      </header>

      <div className="relative">
        {/* Animated Connecting Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-accent/50 -translate-x-1/2 z-0 hidden md:block" />

        <div className="space-y-8 relative z-10">
          {flowSteps.map((step, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? '' : 'md:flex-row-reverse'}`}
              >
                {/* Card Side */}
                <div className={`w-full md:w-1/2 ${isEven ? 'md:text-right' : 'text-left'}`}>
                  <Card className={`inline-block w-full md:w-80 p-6 ${index === 3 ? 'glow-cyan border-primary/50' : ''}`}>
                    <div className={`flex items-center gap-4 mb-2 ${isEven ? 'md:justify-end' : ''}`}>
                      {isEven && <h3 className="text-xl font-bold">{step.title}</h3>}
                      <div className={`p-3 rounded-xl bg-surface border border-white/10 ${index === 3 ? 'text-primary border-primary/30' : 'text-gray-300'}`}>
                        <step.icon className="w-6 h-6" />
                      </div>
                      {!isEven && <h3 className="text-xl font-bold">{step.title}</h3>}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">{step.desc}</p>
                  </Card>
                </div>

                {/* Center Node */}
                <div className="hidden md:flex w-12 h-12 rounded-full bg-background border-4 border-surface items-center justify-center relative z-20">
                  <div className={`w-4 h-4 rounded-full ${index === 3 ? 'bg-primary shadow-[0_0_10px_#00d2ff]' : 'bg-gray-500'}`} />
                </div>

                {/* Empty Side for layout */}
                <div className="hidden md:block w-1/2" />
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="mt-16 text-center"
      >
        <Card glow="cyan" className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Future Ready</h3>
          <p className="text-gray-400">This architecture is designed to integrate seamlessly with Pinecone/ChromaDB for vector storage and PostgreSQL for structured relational data in production deployments.</p>
        </Card>
      </motion.div>
    </div>
  );
}
