import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUIPlaybooks: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    Incident Playbooks
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Automated response strategies powered by LLMs
                </motion.p>
            </header>
            
            <BentoGrid className="max-w-full flex-1">
                {['Ransomware Containment', 'DDoS Mitigation', 'Insider Threat Protocol', 'Zero-Day Response'].map((pb, i) => (
                    <BentoGridItem
                        key={i}
                        delay={0.1 + (i * 0.1)}
                        title={pb}
                        description="Automated orchestration workflow."
                        header={
                            <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-black/50 border border-white/5 flex items-center justify-center group-hover:bg-primary-fixed/5 transition-colors">
                                <span className="material-symbols-outlined text-4xl text-white/30 group-hover:text-primary-fixed transition-colors">book</span>
                            </div>
                        }
                        className="md:col-span-1"
                    />
                ))}
            </BentoGrid>
        </div>
    );
};
