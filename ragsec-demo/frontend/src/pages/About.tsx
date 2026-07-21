import { Card } from '../components/ui/Card';
import { FileWarning, ShieldCheck, XCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold mb-4">About RAGSec</h1>
        <p className="text-gray-400 text-lg">Retrieval-Augmented Generation for Cybersecurity Threat Intelligence</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-white/10 pb-2">The Problem</h2>
        <Card className="bg-surface/50">
          <p className="text-gray-300 leading-relaxed mb-6">
            "Existing AI security tools rely on static data models that fail to keep pace with rapidly changing cyber threats. Because these systems treat old data and brand-new exploits with equal weight, security analysts frequently receive outdated threat intelligence. This lack of time-aware tracking leaves enterprise networks highly vulnerable to emerging zero-day attacks."
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-red-400 flex items-center gap-2"><XCircle className="w-5 h-5"/> Loopholes in Existing Systems</h3>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                <li>Traditional AI treats old and new threats equally.</li>
                <li>No awareness of zero-day exploits.</li>
                <li>Can hallucinate because responses are not grounded.</li>
                <li>No evidence or citations provided to analysts.</li>
                <li>No trust score for the source of intelligence.</li>
                <li>No severity-aware prioritization.</li>
                <li>Slow analyst workflow due to poor explainability.</li>
              </ul>
            </div>
            <div className="flex items-center justify-center p-6">
              <FileWarning className="w-32 h-32 text-red-500/20" />
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-white/10 pb-2 text-gradient">The RAGSec Solution</h2>
        <Card glow="cyan" className="bg-surface/50 border-primary/20">
          <p className="text-gray-300 leading-relaxed mb-6">
            RAGSec is a Time-Aware Retrieval-Augmented Generation system that prioritizes recent, verified, high-severity threats instead of treating every document equally. By implementing a multi-variable ranking formula, RAGSec ensures analysts see what matters most, right now.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-center p-6">
              <ShieldCheck className="w-32 h-32 text-primary/20 glow-cyan" />
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-primary flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> How RAGSec Fixes Them</h3>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                <li>Real-Time Retrieval of latest intelligence.</li>
                <li>Time-Aware Ranking prevents stale data.</li>
                <li>Evidence-Based Answers eliminate hallucinations.</li>
                <li>Recent Threat Priority catches zero-days faster.</li>
                <li>Source Verification builds analyst confidence.</li>
                <li>Severity Awareness for critical incident focus.</li>
              </ul>
            </div>
          </div>
        </Card>
      </section>
      
      <section className="text-center text-sm text-gray-500 pt-12 border-t border-white/10">
        <p>Built as a demonstrative prototype for enterprise SOC environments.</p>
        <p className="mt-2">Uses simulated data to demonstrate Time-Aware RAG principles.</p>
      </section>
    </div>
  );
}
