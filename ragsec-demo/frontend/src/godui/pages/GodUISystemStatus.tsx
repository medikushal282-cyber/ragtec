import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUISystemStatus: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    System Health
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Real-time monitoring of RAGSEC infrastructure
                </motion.p>
            </header>
            
            <BentoGrid className="max-w-full flex-1">
                {['FastAPI Backend', 'ChromaDB Vector Store', 'Redis Cache', 'Ollama LLM Engine'].map((service, i) => (
                    <BentoGridItem
                        key={i}
                        delay={0.1 + (i * 0.1)}
                        title={service}
                        description="Operational"
                        header={
                            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center space-y-2 relative overflow-hidden">
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                                <span className="material-symbols-outlined text-4xl text-emerald-400/50">dns</span>
                            </div>
                        }
                        className="md:col-span-1"
                    />
                ))}
            </BentoGrid>
        </div>
    );
};
