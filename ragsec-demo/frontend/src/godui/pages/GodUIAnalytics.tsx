import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUIAnalytics: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    Executive Analytics
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    High-level metrics and trending analysis
                </motion.p>
            </header>
            
            <BentoGrid className="max-w-full flex-1 md:auto-rows-[20rem]">
                <BentoGridItem
                    delay={0.1}
                    title="Global Threat Map"
                    description="Geospatial analysis of attack vectors."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[12rem] rounded-xl bg-[url('https://godui.design/topographic.svg')] bg-cover bg-center border border-white/5 flex items-center justify-center opacity-70">
                            <span className="material-symbols-outlined text-6xl text-primary-fixed drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]">travel_explore</span>
                        </div>
                    }
                    className="md:col-span-3"
                />
            </BentoGrid>
        </div>
    );
};
