import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUIPatchManagement: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    Patch Management
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Orchestrate updates across the deployment fleet
                </motion.p>
            </header>
            
            <BentoGrid className="max-w-full flex-1">
                <BentoGridItem
                    delay={0.1}
                    title="Available Updates"
                    description="12 packages require updates across 4 nodes."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-center justify-center space-y-2">
                            <span className="text-4xl font-black text-orange-400 font-mono">12</span>
                            <span className="text-xs text-orange-400/50 uppercase tracking-widest">Pending</span>
                        </div>
                    }
                    className="md:col-span-1"
                />
                <BentoGridItem
                    delay={0.2}
                    title="Rollout Queue"
                    description="Automated patching schedule."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-black/50 border border-white/5 p-4 flex flex-col gap-2">
                            <div className="w-full h-2 rounded-full bg-white/10">
                                <div className="w-1/3 h-full bg-primary-fixed rounded-full"></div>
                            </div>
                            <span className="text-xs text-white/40 text-right mt-1">33% Complete</span>
                        </div>
                    }
                    className="md:col-span-2"
                />
            </BentoGrid>
        </div>
    );
};
