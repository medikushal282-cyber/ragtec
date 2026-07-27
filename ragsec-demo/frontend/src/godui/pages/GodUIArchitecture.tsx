import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUIArchitecture: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    Data Pipeline
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Live telemetry ingestion and ETL flow
                </motion.p>
            </header>
            
            <BentoGrid className="max-w-full flex-1 md:auto-rows-[16rem]">
                <BentoGridItem
                    delay={0.1}
                    title="Pipeline Topology"
                    description="Real-time visualization of data streams."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[12rem] rounded-xl bg-black/50 border border-white/5 flex items-center justify-center p-8 gap-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                <span className="material-symbols-outlined text-white/50">cloud_download</span>
                                <div className="absolute -right-8 top-1/2 w-8 h-px bg-white/20 overflow-hidden">
                                    <motion.div animate={{ x: [0, 32] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-full bg-primary-fixed"></motion.div>
                                </div>
                            </div>
                            <div className="w-20 h-20 rounded-2xl bg-primary-fixed/10 border border-primary-fixed/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                                <span className="material-symbols-outlined text-primary-fixed text-3xl">memory</span>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-8 top-1/2 w-8 h-px bg-white/20 overflow-hidden">
                                    <motion.div animate={{ x: [0, 32] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-full bg-primary-fixed"></motion.div>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                    <span className="material-symbols-outlined text-white/50">database</span>
                                </div>
                            </div>
                        </div>
                    }
                    className="md:col-span-3"
                />
            </BentoGrid>
        </div>
    );
};
