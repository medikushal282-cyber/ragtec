import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const GodUIScanner: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);

    const startScan = () => {
        setIsScanning(true);
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsScanning(false);
                    return 100;
                }
                return prev + 5;
            });
        }, 300);
    };

    return (
        <div className="w-full h-full space-y-8 flex flex-col items-center justify-center relative">
            {/* Background radar effect */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <motion.div 
                    animate={{ scale: [1, 2, 3], opacity: [1, 0.5, 0] }} 
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-48 h-48 rounded-full border border-primary-fixed absolute"
                />
                <motion.div 
                    animate={{ scale: [1, 2, 3], opacity: [1, 0.5, 0] }} 
                    transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
                    className="w-48 h-48 rounded-full border border-primary-fixed absolute"
                />
            </div>

            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="z-10 flex flex-col items-center p-12 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl max-w-lg w-full text-center"
            >
                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-8 transition-colors duration-500 ${isScanning ? 'border-primary-fixed bg-primary-fixed/10' : 'border-white/10 bg-white/5'}`}>
                    <span className={`material-symbols-outlined text-4xl transition-colors duration-500 ${isScanning ? 'text-primary-fixed animate-spin' : 'text-white/50'}`}>
                        {isScanning ? 'radar' : 'policy'}
                    </span>
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Local System Scanner</h1>
                <p className="text-white/50 mb-8">Initiate a deep heuristic scan of the local environment against known YARA rules and IoCs.</p>

                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-8 relative">
                    <motion.div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-fixed to-purple-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>

                <AnimatePresence mode="wait">
                    {!isScanning && progress === 0 ? (
                        <motion.button 
                            key="start"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onClick={startScan}
                            className="px-8 py-4 rounded-full bg-white text-black font-bold tracking-wide hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                        >
                            INITIATE SCAN
                        </motion.button>
                    ) : isScanning ? (
                        <motion.div 
                            key="scanning"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-primary-fixed font-mono text-sm uppercase tracking-widest animate-pulse"
                        >
                            Scanning filesystem... {progress}%
                        </motion.div>
                    ) : (
                        <motion.button 
                            key="complete"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onClick={() => setProgress(0)}
                            className="px-8 py-4 rounded-full bg-emerald-500 text-black font-bold tracking-wide hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                        >
                            SCAN COMPLETE - VIEW REPORT
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
