import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const GodUILanding: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full min-h-screen bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">
            {/* Animated Background Flow Field equivalent */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            <motion.div 
                animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-fixed/20 blur-[120px] rounded-full pointer-events-none"
            />
            
            <div className="z-10 text-center max-w-4xl px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
                >
                    <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
                    <span className="text-xs font-mono tracking-widest text-white/70">RAGSEC V3 IS LIVE</span>
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight"
                >
                    The Future of <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-fixed to-purple-500">
                        Cyber Defense
                    </span>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
                >
                    AI-powered threat hunting, automated playbooks, and time-aware retrieval built into an elegant, high-performance interface.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <button 
                        onClick={() => navigate('/v3/login')}
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-bold tracking-wide hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                    >
                        ENTER SYSTEM
                    </button>
                    <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold tracking-wide hover:bg-white/10 transition-colors">
                        VIEW DOCS
                    </button>
                </motion.div>
            </div>
        </div>
    );
};
