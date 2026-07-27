import React from 'react';
import { BentoGrid, BentoGridItem } from '../components/bento-grid';
import { motion } from 'framer-motion';

export const GodUIKnowledgeBase: React.FC = () => {
    return (
        <div className="w-full h-full space-y-8 flex flex-col">
            <header className="shrink-0 mb-4">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white inline-block mb-2"
                >
                    Vector Knowledge Base
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/50 font-mono text-sm"
                >
                    Manage embeddings, indices, and unstructured security documents
                </motion.p>
            </header>
            
            <BentoGrid className="max-w-full flex-1">
                <BentoGridItem
                    delay={0.1}
                    title="Vector Store Status"
                    description="ChromaDB connection active. 1.2M vectors stored."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center space-y-2">
                            <span className="text-4xl font-black text-purple-400 font-mono">1.2M</span>
                            <span className="text-xs text-purple-400/50 uppercase tracking-widest">Embeddings</span>
                        </div>
                    }
                    className="md:col-span-1"
                />
                <BentoGridItem
                    delay={0.2}
                    title="Document Ingestion"
                    description="Upload PDFs, STIX/TAXII files, or raw JSON."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-black/50 border border-white/5 p-4 flex items-center justify-center group-hover:border-primary-fixed/30 transition-colors cursor-pointer border-dashed">
                            <div className="flex flex-col items-center text-white/30 group-hover:text-primary-fixed transition-colors">
                                <span className="material-symbols-outlined text-4xl mb-2">upload_file</span>
                                <span className="text-sm font-medium">Drag & Drop Documents</span>
                            </div>
                        </div>
                    }
                    className="md:col-span-2"
                />
            </BentoGrid>
        </div>
    );
};
