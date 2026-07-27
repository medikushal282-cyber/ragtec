import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUIInvestigation: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    Deep Investigation
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Forensic analysis environment for active incidents
                </motion.p>
            </header>

            <BentoGrid className="max-w-full flex-1 md:auto-rows-fr">
                <BentoGridItem
                    delay={0.1}
                    title="Graph Analysis"
                    description="Visual relationship mapping of current indicators of compromise."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[12rem] rounded-xl bg-black/50 border border-white/5 flex items-center justify-center relative overflow-hidden">
                            {/* Mock Graph Nodes */}
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="relative w-32 h-32">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full blur-[2px] shadow-[0_0_20px_red]"></div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 bg-primary-fixed rounded-full blur-[1px]"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-purple-500 rounded-full blur-[1px]"></div>
                                {/* Connecting Lines */}
                                <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                                    <line x1="50%" y1="10%" x2="15%" y2="85%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4" />
                                    <line x1="50%" y1="10%" x2="85%" y2="85%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                                </svg>
                            </motion.div>
                        </div>
                    }
                    className="md:col-span-2"
                />
                
                <BentoGridItem
                    delay={0.2}
                    title="Related CVEs"
                    description="Vulnerabilities associated with the identified TTPs."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[12rem] rounded-xl bg-black/50 border border-white/5 p-4 flex flex-col gap-2">
                            {['CVE-2024-21410', 'CVE-2023-4211', 'CVE-2022-42827'].map((cve, i) => (
                                <div key={i} className="px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-sm font-mono text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                                    {cve}
                                </div>
                            ))}
                        </div>
                    }
                    className="md:col-span-1"
                />
                
                <BentoGridItem
                    delay={0.3}
                    title="Evidence Locker"
                    description="Quarantined payloads and PCAP files ready for detonation."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[12rem] rounded-xl bg-black/50 border border-white/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-white/20">inventory_2</span>
                        </div>
                    }
                    className="md:col-span-3"
                />
            </BentoGrid>
        </div>
    );
};
