import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type LaunchpadProps = {
    isOpen: boolean;
    onClose: () => void;
};

const CATEGORIES = [
    {
        name: "Operations",
        items: [
            { icon: "dashboard", label: "Executive Dashboard", path: "/v3/dashboard" },
            { icon: "monitoring", label: "Threat Intel Feed", path: "/v3/feed" },
            { icon: "plagiarism", label: "Deep Investigation", path: "/v3/investigation" },
            { icon: "search", label: "Local Scanner", path: "/v3/scanner" },
        ]
    },
    {
        name: "Capabilities",
        items: [
            { icon: "smart_toy", label: "AI Threat Copilot", path: "/v3/assistant" },
            { icon: "manage_search", label: "Time-Aware Retrieval", path: "/v3/retrieval" },
            { icon: "analytics", label: "Executive Analytics", path: "/v3/analytics" },
        ]
    },
    {
        name: "Response",
        items: [
            { icon: "book", label: "Incident Playbooks", path: "/v3/playbooks" },
            { icon: "system_update", label: "Patch Management", path: "/v3/patch" },
        ]
    },
    {
        name: "System Architecture",
        items: [
            { icon: "account_tree", label: "Data Pipeline", path: "/v3/architecture" },
            { icon: "database", label: "Vector Knowledge Base", path: "/v3/knowledge-base" },
            { icon: "api", label: "API Explorer", path: "/v3/api" },
            { icon: "vital_signs", label: "System Health", path: "/v3/status" },
            { icon: "settings", label: "Settings", path: "/v3/settings" },
        ]
    }
];

export const Launchpad: React.FC<LaunchpadProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 pt-20 pb-32 px-8 overflow-y-auto custom-scrollbar"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/10 hover:border-white/20 hover:rotate-90 duration-300"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>

                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.1 }}
                        className="w-full max-w-6xl space-y-12"
                    >
                        {CATEGORIES.map((category, catIdx) => (
                            <div key={category.name} className="space-y-6">
                                <motion.h3 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (catIdx * 0.1) }}
                                    className="text-white/40 font-mono text-sm uppercase tracking-[0.3em] pl-2 border-l border-primary-fixed/50"
                                >
                                    {category.name}
                                </motion.h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {category.items.map((item, itemIdx) => (
                                        <motion.button
                                            key={item.label}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + (catIdx * 0.1) + (itemIdx * 0.05) }}
                                            onClick={() => handleNavigate(item.path)}
                                            className="group flex flex-col items-center text-center space-y-4 p-6 rounded-3xl hover:bg-white/5 transition-all duration-300 hover:scale-105 active:scale-95"
                                        >
                                            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-primary-fixed/10 group-hover:border-primary-fixed/30 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <span className="material-symbols-outlined text-4xl text-white/70 group-hover:text-primary-fixed transition-colors z-10">{item.icon}</span>
                                            </div>
                                            <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                                                {item.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
