import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Activity, MessageSquare, ArrowLeftRight, Settings, Info } from 'lucide-react';
import { cn } from './components/ui/Button';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ThreatFeed from './pages/ThreatFeed';
import AIAssistant from './pages/AIAssistant';
import RetrievalDemo from './pages/RetrievalDemo';
import Architecture from './pages/Architecture';
import About from './pages/About';

function Navigation() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Home', icon: Shield },
    { path: '/dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { path: '/feed', label: 'Threat Feed', icon: Activity },
    { path: '/assistant', label: 'AI Assistant', icon: MessageSquare },
    { path: '/demo', label: 'RAGSec Demo', icon: ArrowLeftRight },
    { path: '/architecture', label: 'Architecture', icon: Settings },
    { path: '/about', label: 'About', icon: Info },
  ];

  return (
    <nav className="fixed top-0 left-0 h-screen w-64 glass-panel border-r border-white/5 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <span className="text-xl font-bold text-gradient">RAGSec AI</span>
      </div>
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
              location.pathname === item.path
                ? "bg-primary/20 text-primary glow-cyan"
                : "text-gray-400 hover:bg-surface hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-background relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />
        
        <Navigation />
        
        <main className="flex-1 ml-64 p-8 relative z-10 h-screen overflow-y-auto">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/feed" element={<ThreatFeed />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/demo" element={<RetrievalDemo />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
