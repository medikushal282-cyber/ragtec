import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUISettings: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    Global Settings
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Configure user preferences, API keys, and RBAC
                </motion.p>
            </header>
            
            <BentoGrid className="max-w-full flex-1 md:auto-rows-[14rem]">
                <BentoGridItem
                    delay={0.1}
                    title="Profile Configuration"
                    description="Manage your account details and MFA."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-black/50 border border-white/5 flex items-center justify-center p-4">
                           <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-fixed to-purple-500 p-[2px]">
                                <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-white font-bold">JD</div>
                           </div>
                        </div>
                    }
                    className="md:col-span-1"
                />
                <BentoGridItem
                    delay={0.2}
                    title="API Keys"
                    description="Generate and revoke application tokens."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-black/50 border border-white/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-white/30 group-hover:text-primary-fixed transition-colors">key</span>
                        </div>
                    }
                    className="md:col-span-2"
                />
            </BentoGrid>
        </div>
    );
};
