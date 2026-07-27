import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUIAPIExplorer: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    API Explorer
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Interact with the RAGSEC internal APIs (REST & GraphQL)
                </motion.p>
            </header>
            
            <BentoGrid className="max-w-full flex-1">
                <BentoGridItem
                    delay={0.1}
                    title="Endpoint Playground"
                    description="Test routes interactively."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[12rem] rounded-xl bg-black/50 border border-white/5 p-4 flex flex-col gap-2 font-mono text-sm">
                            <div className="flex gap-2">
                                <span className="text-emerald-400">GET</span>
                                <span className="text-white">/api/v1/threats/active</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-blue-400">POST</span>
                                <span className="text-white">/api/v1/vectors/embed</span>
                            </div>
                            <div className="flex gap-2 mt-4 text-white/30">
                                <span>{">"} Select an endpoint to test...</span>
                            </div>
                        </div>
                    }
                    className="md:col-span-3"
                />
            </BentoGrid>
        </div>
    );
};
