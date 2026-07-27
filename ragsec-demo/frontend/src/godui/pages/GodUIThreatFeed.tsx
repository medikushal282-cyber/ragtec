import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MOCK_THREATS = [
    { id: 'T-1042', severity: 'critical', type: 'Zero-Day Exploit', target: 'API Gateway', status: 'Active', timestamp: '2 mins ago' },
    { id: 'T-1041', severity: 'high', type: 'SQL Injection', target: 'Customer DB', status: 'Blocked', timestamp: '15 mins ago' },
    { id: 'T-1040', severity: 'medium', type: 'Brute Force', target: 'Admin Portal', status: 'Investigating', timestamp: '1 hr ago' },
    { id: 'T-1039', severity: 'critical', type: 'Ransomware Dropper', target: 'Endpoint-04', status: 'Quarantined', timestamp: '2 hrs ago' },
    { id: 'T-1038', severity: 'low', type: 'Port Scan', target: 'DMZ', status: 'Logged', timestamp: '5 hrs ago' },
];

export const GodUIThreatFeed: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 flex items-end justify-between mb-2">
                <div>
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 inline-block mb-2"
                    >
                        Live Threat Intel
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/50 font-mono text-sm"
                    >
                        Real-time IoC ingestion and correlation feed
                    </motion.p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">pause_circle</span> Pause Feed
                    </button>
                </div>
            </header>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 border border-white/10 bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 p-6 border-b border-white/5 bg-white/[0.02] text-xs font-mono text-white/40 uppercase tracking-widest">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-1">Severity</div>
                    <div className="col-span-2">Threat Vector</div>
                    <div className="col-span-1">Target</div>
                    <div className="col-span-1">Status</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {MOCK_THREATS.map((threat, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (idx * 0.05) }}
                            key={threat.id}
                            className="grid grid-cols-6 gap-4 p-4 mx-2 my-2 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer items-center group"
                        >
                            <div className="col-span-1 font-mono text-sm text-white/70 group-hover:text-white">{threat.id}</div>
                            <div className="col-span-1">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                                    threat.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                    threat.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                    threat.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                }`}>
                                    {threat.severity}
                                </span>
                            </div>
                            <div className="col-span-2 flex flex-col">
                                <span className="text-sm font-medium text-white">{threat.type}</span>
                                <span className="text-xs text-white/40 font-mono">{threat.timestamp}</span>
                            </div>
                            <div className="col-span-1 text-sm text-white/60">{threat.target}</div>
                            <div className="col-span-1 flex items-center justify-between">
                                <span className="text-sm text-white/80">{threat.status}</span>
                                <span className="material-symbols-outlined text-white/20 group-hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
