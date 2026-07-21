import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert, Zap, Database, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto py-12 space-y-24">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-extrabold tracking-tight mb-6">
            Time-Aware <span className="text-gradient">RAGSec</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Existing AI security tools rely on static data models that fail to keep pace with rapidly changing cyber threats. RAGSec prioritizes recent, verified, high-severity threats to catch Zero-Day attacks before they spread.
          </p>
        </motion.div>
        
        <motion.div 
          className="flex justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <Link to="/demo">
            <Button size="lg" variant="glow" className="text-lg">
              Try Interactive Demo <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link to="/about">
            <Button size="lg" variant="outline" className="text-lg">
              Learn More
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Architecture Comparison */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">The RAGSec Advantage</h2>
        <div className="grid md:grid-cols-2 gap-12">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-red-500/30">
              <div className="flex items-center gap-3 mb-6">
                <Database className="text-red-400 w-8 h-8" />
                <h3 className="text-2xl font-semibold">Traditional Static AI</h3>
              </div>
              <ul className="space-y-6 relative">
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-lg">Searches only by similarity</h4>
                    <p className="text-gray-400 text-sm">Treats old data and brand-new exploits with equal weight.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-lg">Outdated Results</h4>
                    <p className="text-gray-400 text-sm">Security analysts receive intelligence from 2023 for 2026 threats.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-lg">Misses Zero Days</h4>
                    <p className="text-gray-400 text-sm">Lack of time-aware tracking leaves networks vulnerable.</p>
                  </div>
                </li>
              </ul>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card glow="cyan" className="h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldAlert className="w-48 h-48" />
              </div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <Zap className="text-primary w-8 h-8" />
                <h3 className="text-2xl font-semibold">RAGSec Architecture</h3>
              </div>
              <ul className="space-y-6 relative z-10">
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-lg">Time-Aware Retrieval</h4>
                    <p className="text-gray-400 text-sm">Calculates Recency + Severity + Source Trust + Similarity.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-lg">Prioritizes Latest Threats</h4>
                    <p className="text-gray-400 text-sm">Ranks newest and most critical exploits first.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-lg">Grounded AI Responses</h4>
                    <p className="text-gray-400 text-sm">Provides evidence, confidence scores, and threat age citations.</p>
                  </div>
                </li>
              </ul>
            </Card>
          </motion.div>

        </div>
      </section>
    </div>
  );
}
