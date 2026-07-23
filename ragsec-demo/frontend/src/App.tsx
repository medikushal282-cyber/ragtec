import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RadialContextMenu } from './components/navigation/RadialContextMenu';
import { cn } from './components/ui/Button';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ThreatFeed from './pages/ThreatFeed';
import AIAssistant from './pages/AIAssistant';
import RetrievalDemo from './pages/RetrievalDemo';
import Architecture from './pages/Architecture';
import About from './pages/About';

// Legacy Sidebar Removed in favor of BouquetNav
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-cyber-black relative overflow-hidden font-sans">
      <div className="scanlines"></div>
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyber-cyan/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyber-purple/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Main Content Area */}
      <main className="flex-1 relative z-10 h-full flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto min-h-0 min-w-0 w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Isolated Landing Page */}
        <Route path="/" element={
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full h-full absolute inset-0">
            <LandingPage />
          </motion.div>
        } />
        
        {/* Dashboard Routes wrapped in layout */}
        <Route path="/app/*" element={
          <motion.div initial={{ opacity: 0, filter: 'blur(20px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(20px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full h-full absolute inset-0">
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="feed" element={<ThreatFeed />} />
                <Route path="incidents" element={<ThreatFeed />} /> {/* Reuse feed for demo */}
                <Route path="assistant" element={<AIAssistant />} />
                <Route path="demo" element={<RetrievalDemo />} />
                <Route path="scanner" element={<RetrievalDemo />} /> {/* Reuse demo */}
                <Route path="forensics" element={<Architecture />} /> {/* Reuse */}
                <Route path="settings" element={<About />} /> {/* Reuse */}
              </Routes>
            </DashboardLayout>
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <RadialContextMenu />
      <AnimatedRoutes />
    </Router>
  );
}
