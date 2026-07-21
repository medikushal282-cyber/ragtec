import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Activity, MessageSquare, ArrowLeftRight, Settings, Info, LogOut } from 'lucide-react';
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
    { path: '/app/dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { path: '/app/feed', label: 'Threat Feed', icon: Activity },
    { path: '/app/assistant', label: 'AI Assistant', icon: MessageSquare },
    { path: '/app/demo', label: 'RAGSec Demo', icon: ArrowLeftRight },
    { path: '/app/architecture', label: 'Architecture', icon: Settings },
    { path: '/app/about', label: 'About', icon: Info },
  ];

  return (
    <nav className="fixed top-0 left-0 h-screen w-64 bg-cyber-dark/95 border-r border-cyber-cyan/30 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3 border-b border-cyber-cyan/30">
        <Shield className="w-8 h-8 text-cyber-cyan" />
        <span className="text-xl font-bold text-gradient glitch-text" data-text="RAGSec AI">RAGSec AI</span>
      </div>
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-all uppercase tracking-widest font-semibold",
              location.pathname === item.path
                ? "bg-cyber-cyan/20 text-cyber-cyan border-l-4 border-cyber-cyan glow-cyan"
                : "text-cyber-gray hover:bg-cyber-cyan/10 hover:text-white border-l-4 border-transparent"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="p-4 border-t border-cyber-cyan/30">
        <Link to="/" className="flex items-center gap-3 px-4 py-3 text-cyber-pink hover:bg-cyber-pink/10 transition-all font-semibold uppercase tracking-widest text-sm">
          <LogOut className="w-5 h-5" />
          <span>Exit System</span>
        </Link>
      </div>
    </nav>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cyber-black relative overflow-hidden font-sans">
      <div className="scanlines"></div>
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyber-cyan/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyber-purple/10 blur-[120px] rounded-full pointer-events-none" />
      
      <Navigation />
      
      <main className="flex-1 ml-64 p-8 relative z-10 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Isolated Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Dashboard Routes wrapped in layout */}
        <Route path="/app/*" element={
          <DashboardLayout>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="feed" element={<ThreatFeed />} />
              <Route path="assistant" element={<AIAssistant />} />
              <Route path="demo" element={<RetrievalDemo />} />
              <Route path="architecture" element={<Architecture />} />
              <Route path="about" element={<About />} />
            </Routes>
          </DashboardLayout>
        } />
      </Routes>
    </Router>
  );
}
