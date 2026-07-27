import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const GodUILogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login('mock-godui-token');
            navigate('/v3/dashboard');
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#030303] flex items-center justify-center relative overflow-hidden font-sans text-white">
            <div className="absolute inset-0 bg-[url('https://godui.design/topographic.svg')] bg-cover bg-center opacity-10 pointer-events-none"></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="z-10 w-full max-w-md p-8 md:p-12 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl relative"
            >
                {/* Glowing border effect */}
                <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-[3rem] pointer-events-none -z-10"></div>

                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] mb-6">
                        <span className="material-symbols-outlined text-white text-3xl">security</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Access Control</h2>
                    <p className="text-white/40 text-sm mt-2">Authenticate to enter RAGSEC</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-white/50 ml-2">Operator ID</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary-fixed focus:bg-primary-fixed/5 transition-all"
                            placeholder="admin"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-white/50 ml-2">Passkey</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary-fixed focus:bg-primary-fixed/5 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-4 mt-4 rounded-2xl bg-white text-black font-bold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        AUTHENTICATE
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
