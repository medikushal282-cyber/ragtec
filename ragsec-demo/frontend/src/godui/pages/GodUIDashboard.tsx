import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUIDashboard: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8">
            <header className="mb-10">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40 inline-block mb-2"
                >
                    Executive Overview
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Real-time Threat Matrix Analysis
                </motion.p>
            </header>

            <BentoGrid className="max-w-7xl mx-auto">
                <BentoGridItem
                    delay={0.1}
                    title="Critical Vulnerabilities"
                    description="CISA documented actively exploited vulnerabilities detected on endpoints."
                    header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-red-500/20 to-neutral-900 border border-red-500/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]"><span className="text-4xl font-black text-red-400 font-mono">12</span></div>}
                    icon={<span className="material-symbols-outlined text-red-400">warning</span>}
                    className="md:col-span-1"
                />
                <BentoGridItem
                    delay={0.2}
                    title="AI Copilot Interactions"
                    description="Automated playbook generations and queries handled by the RAGSEC Copilot."
                    header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary-fixed/20 to-neutral-900 border border-primary-fixed/20 flex items-center justify-center"><span className="text-4xl font-black text-primary-fixed font-mono">3,492</span></div>}
                    icon={<span className="material-symbols-outlined text-primary-fixed">smart_toy</span>}
                    className="md:col-span-1"
                />
                <BentoGridItem
                    delay={0.3}
                    title="Global Threat Feed"
                    description="Live ingestion of IoCs from 42 external security feeds."
                    header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-[url('https://godui.design/topographic.svg')] bg-cover bg-center border border-white/5 flex flex-col items-center justify-center overflow-hidden relative">
                         <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
                         <span className="z-10 material-symbols-outlined text-5xl text-white/80 animate-pulse">public</span>
                    </div>}
                    icon={<span className="material-symbols-outlined text-white/70">monitoring</span>}
                    className="md:col-span-1"
                />
                <BentoGridItem
                    delay={0.4}
                    title="Active Investigations"
                    description="Deep-dive forensic processes currently underway in the vector knowledge base."
                    header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-500/20 to-neutral-900 border border-purple-500/20 flex flex-col p-4 space-y-2">
                        <div className="w-3/4 h-2 rounded-full bg-purple-500/50 animate-pulse"></div>
                        <div className="w-1/2 h-2 rounded-full bg-purple-500/30 animate-pulse delay-75"></div>
                        <div className="w-full h-2 rounded-full bg-purple-500/20 animate-pulse delay-150"></div>
                    </div>}
                    icon={<span className="material-symbols-outlined text-purple-400">plagiarism</span>}
                    className="md:col-span-2"
                />
                 <BentoGridItem
                    delay={0.5}
                    title="System Health"
                    description="Database, Websocket, and Vector stores are operating optimally."
                    header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-500/20 to-neutral-900 border border-emerald-500/20 flex items-center justify-center">
                        <div className="relative">
                           <span className="material-symbols-outlined text-4xl text-emerald-400">vital_signs</span>
                           <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
                        </div>
                    </div>}
                    icon={<span className="material-symbols-outlined text-emerald-400">check_circle</span>}
                    className="md:col-span-1"
                />
            </BentoGrid>
        </div>
    );
};
