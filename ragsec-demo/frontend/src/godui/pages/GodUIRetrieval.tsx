import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUIRetrieval: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    Time-Aware Retrieval
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Query historical incident vectors across discrete timeframes
                </motion.p>
            </header>
            
            <BentoGrid className="max-w-full flex-1 md:auto-rows-fr">
                <BentoGridItem
                    delay={0.1}
                    title="Time Machine Slider"
                    description="Scrub through historical threat data."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[12rem] rounded-xl bg-black/50 border border-white/5 p-8 flex flex-col items-center justify-center relative">
                            <div className="w-full h-1 bg-white/10 rounded-full relative">
                                <div className="absolute top-1/2 -translate-y-1/2 left-[30%] w-4 h-4 bg-primary-fixed rounded-full shadow-[0_0_15px_rgba(0,240,255,0.8)] cursor-grab"></div>
                            </div>
                            <div className="flex justify-between w-full mt-4 text-xs font-mono text-white/40">
                                <span>Jan 2024</span>
                                <span>Present</span>
                            </div>
                        </div>
                    }
                    className="md:col-span-3"
                />
            </BentoGrid>
        </div>
    );
};
