import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap } from 'lucide-react';

export default function RetrievalDemo() {
  const [traditionalResults, setTraditionalResults] = useState<any[]>([]);
  const [ragsecResults, setRagsecResults] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const [tradRes, ragsecRes] = await Promise.all([
        fetch('http://localhost:3000/api/retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'latest threats', useRagsec: false })
        }).then(r => r.json()),
        fetch('http://localhost:3000/api/retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'latest threats', useRagsec: true })
        }).then(r => r.json())
      ]);

      setTraditionalResults(tradRes.slice(0, 5));
      setRagsecResults(ragsecRes.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const ThreatCard = ({ threat, isRagsec, index }: { threat: any, isRagsec: boolean, index: number }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: isRagsec ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.5, type: 'spring' }}
      className={`p-4 rounded-xl border ${isRagsec && index === 0 ? 'bg-primary/10 border-primary glow-cyan' : 'bg-surface/50 border-white/5'} mb-4`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-700">#{index + 1}</span>
          <div>
            <h4 className={`font-bold ${isRagsec && index === 0 ? 'text-primary' : 'text-white'}`}>{threat.id}</h4>
            <span className="text-xs text-gray-400">{new Date(threat.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
        <Badge variant={threat.severity.toLowerCase() as any}>{threat.severity}</Badge>
      </div>
      
      {isRagsec ? (
        <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
          <div className="bg-surface p-2 rounded border border-white/5">
            <span className="block text-gray-500 mb-1">Sim</span>
            <span className="font-mono text-white">{threat.scores.similarity}</span>
          </div>
          <div className="bg-surface p-2 rounded border border-white/5">
            <span className="block text-gray-500 mb-1">Time</span>
            <span className="font-mono text-accent">{threat.scores.recency}</span>
          </div>
          <div className="bg-surface p-2 rounded border border-white/5">
            <span className="block text-gray-500 mb-1">Risk</span>
            <span className="font-mono text-critical">{threat.scores.severity}</span>
          </div>
          <div className="bg-surface p-2 rounded border border-white/5">
            <span className="block text-gray-500 mb-1">Trust</span>
            <span className="font-mono text-primary">{threat.scores.trust}</span>
          </div>
          <div className="col-span-4 mt-2 bg-primary/20 text-primary p-2 rounded font-bold">
            Final RAGSec Score: {threat.scores.final}
          </div>
        </div>
      ) : (
        <div className="mt-4 bg-surface p-2 rounded border border-white/5 text-center">
          <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Similarity Score Only</span>
          <span className="font-mono text-white font-bold">{threat.scores.similarity}</span>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4">Time-Aware Retrieval Demo</h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          See how RAGSec prevents zero-day misses by prioritizing Recency, Severity, and Source Trust over semantic similarity alone.
        </p>
        <button 
          onClick={runSimulation}
          disabled={isSimulating}
          className="mt-6 px-6 py-3 bg-primary text-background font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSimulating ? 'Running Simulation...' : 'Re-run Reranking Simulation'}
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Traditional AI Column */}
        <div>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <Database className="text-gray-400 w-8 h-8" />
            <h2 className="text-2xl font-bold">Traditional AI</h2>
          </div>
          <p className="text-center text-gray-500 mb-8 h-12">
            Ranks exclusively by semantic similarity. Old and new threats are treated equally.
          </p>
          
          <Card className="bg-surface/30 border-white/5 p-4">
            <AnimatePresence mode="popLayout">
              {traditionalResults.map((t, i) => (
                <ThreatCard key={`trad-${t.id}`} threat={t} isRagsec={false} index={i} />
              ))}
            </AnimatePresence>
          </Card>
        </div>

        {/* RAGSec Column */}
        <div>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <Zap className="text-primary w-8 h-8" />
            <h2 className="text-2xl font-bold text-gradient">RAGSec AI</h2>
          </div>
          <p className="text-center text-gray-500 mb-8 h-12">
            Ranks using: <span className="text-white">0.45(Sim) + 0.30(Time) + 0.15(Risk) + 0.10(Trust)</span>
          </p>

          <Card glow="cyan" className="p-4">
            <AnimatePresence mode="popLayout">
              {ragsecResults.map((t, i) => (
                <ThreatCard key={`ragsec-${t.id}`} threat={t} isRagsec={true} index={i} />
              ))}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}
