import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert, Database, Zap, FileWarning } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// @ts-ignore
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // GSAP Animations
    const ctx = gsap.context(() => {
      // Hero parallax
      gsap.to('.hero-bg', {
        y: 200,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // Staggered reveal for problem statements
      gsap.from('.problem-card', {
        y: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        scrollTrigger: {
          trigger: '.problem-section',
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        }
      });

      // RAGSec Solution reveal
      gsap.from('.solution-block', {
        scale: 0.8,
        opacity: 0,
        rotationX: 45,
        duration: 1.5,
        scrollTrigger: {
          trigger: '.solution-section',
          start: 'top 60%',
          toggleActions: 'play none none reverse'
        }
      });
    }, containerRef);

    return () => {
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-cyber-black text-cyber-gray min-h-screen font-sans selection:bg-cyber-cyan selection:text-cyber-black overflow-hidden relative">
      <div className="scanlines"></div>
      
      {/* Hero Section */}
      <section className="hero-section relative h-screen flex flex-col items-center justify-center border-b border-cyber-cyan/30 overflow-hidden">
        <div className="hero-bg absolute inset-0 z-0 opacity-20" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at center, #00d2ff 0%, transparent 50%)',
               backgroundSize: '100% 100%'
             }} 
        />
        
        <div className="relative z-10 text-center space-y-8 px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="inline-block border border-cyber-cyan/50 bg-cyber-cyan/10 px-4 py-1 mb-6">
              <span className="text-cyber-cyan font-mono text-sm uppercase tracking-[0.3em]">System Initialization</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-4 text-white">
              <span className="glitch-text text-gradient" data-text="RAGSec AI">RAGSec AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-cyber-gray font-mono max-w-3xl mx-auto leading-relaxed border-l-2 border-cyber-pink pl-4 text-left">
              WARNING: Legacy AI security models detected. Time-awareness protocols offline. Zero-day vulnerability risk: <span className="text-cyber-pink">CRITICAL</span>.
            </p>
          </motion.div>
          
          <motion.div 
            className="pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <Link to="/app/dashboard">
              <Button size="lg" variant="glow" className="text-xl">
                ACCESS NEURAL NET <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-50">
          <span className="font-mono text-xs uppercase tracking-widest text-cyber-cyan mb-2">Scroll to decrypt</span>
          <div className="w-[1px] h-12 bg-cyber-cyan"></div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="problem-section py-32 px-4 relative z-10 bg-cyber-dark/80 backdrop-blur-md border-b border-cyber-cyan/20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 border-b border-cyber-pink/30 pb-4 inline-block">
            <h2 className="text-4xl font-bold text-cyber-pink flex items-center gap-4">
              <FileWarning className="w-10 h-10" />
              THE STATIC AI FATAL FLAW
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="problem-card cyber-panel p-8 bg-black/50 border-cyber-pink/40">
              <Database className="w-12 h-12 text-cyber-pink mb-6 opacity-80" />
              <h3 className="text-xl font-bold text-white mb-4">Amnesia Protocol</h3>
              <p className="font-mono text-sm leading-loose">Traditional LLMs retrieve by semantic similarity alone. A 2022 malware report looks mathematically identical to today's zero-day exploit.</p>
            </div>
            <div className="problem-card cyber-panel p-8 bg-black/50 border-cyber-pink/40">
              <ShieldAlert className="w-12 h-12 text-cyber-pink mb-6 opacity-80" />
              <h3 className="text-xl font-bold text-white mb-4">Hallucinated Defense</h3>
              <p className="font-mono text-sm leading-loose">Ungrounded models fabricate IOCs and attack paths, creating false positives that waste analyst cycles during critical incident response.</p>
            </div>
            <div className="problem-card cyber-panel p-8 bg-black/50 border-cyber-pink/40">
              <div className="text-4xl font-black text-cyber-pink mb-6 font-mono opacity-80">0-DAY</div>
              <h3 className="text-xl font-bold text-white mb-4">Time Blindness</h3>
              <p className="font-mono text-sm leading-loose">Without temporal tracking, the system cannot prioritize breaking intelligence, leaving enterprise perimeters exposed to novel tradecraft.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="solution-section py-40 px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="solution-block cyber-panel p-12 bg-cyber-cyan/5 border-cyber-cyan shadow-[0_0_50px_rgba(0,210,255,0.1)]">
            <Zap className="w-16 h-16 text-cyber-yellow mx-auto mb-8 glow-yellow" />
            <h2 className="text-5xl font-black mb-8 text-white uppercase tracking-tighter">
              Enter <span className="text-gradient">RAGSec</span>
            </h2>
            <p className="text-2xl font-mono text-gray-300 leading-relaxed mb-12">
              A multi-variable retrieval engine overriding static models. <br/>
              <span className="text-cyber-yellow font-bold bg-cyber-yellow/10 px-2 mt-4 inline-block">Score = 0.45(Sim) + 0.30(Time) + 0.15(Risk) + 0.10(Trust)</span>
            </p>
            
            <Link to="/app/demo">
              <Button size="lg" variant="outline" className="text-xl bg-black">
                Run Simulation Protocol
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
