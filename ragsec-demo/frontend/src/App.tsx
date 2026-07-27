import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/navigation/AppShell';
import { MagneticCursor } from './components/ui/MagneticCursor';

// Lazy Loaded Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ThreatFeed from './pages/ThreatFeed';
import AIAssistant from './pages/AIAssistant';
import RetrievalDemo from './pages/RetrievalDemo';
import Architecture from './pages/Architecture';
import Analytics from './pages/Analytics';
import Playbooks from './pages/Playbooks';
import PatchManagement from './pages/PatchManagement';
import Investigation from './pages/Investigation';
import APIExplorer from './pages/APIExplorer';
import KnowledgeBase from './pages/KnowledgeBase';
import SystemStatus from './pages/SystemStatus';
import SettingsPage from './pages/SettingsPage';
import ScannerDashboard from './pages/ScannerDashboard';
import Login from './pages/Login';
import GodUIMenuPreview from './pages/GodUIMenuPreview';
import { GodUIAppShell } from './godui/layouts/GodUIAppShell';
import { GodUIDashboard } from './godui/pages/GodUIDashboard';
import { GodUIAssistant } from './godui/pages/GodUIAssistant';
import { GodUIThreatFeed } from './godui/pages/GodUIThreatFeed';
import { GodUIInvestigation } from './godui/pages/GodUIInvestigation';
import { GodUIScanner } from './godui/pages/GodUIScanner';
import { GodUIRetrieval } from './godui/pages/GodUIRetrieval';
import { GodUIAnalytics } from './godui/pages/GodUIAnalytics';
import { GodUIPlaybooks } from './godui/pages/GodUIPlaybooks';
import { GodUIPatchManagement } from './godui/pages/GodUIPatchManagement';
import { GodUIArchitecture } from './godui/pages/GodUIArchitecture';
import { GodUIKnowledgeBase } from './godui/pages/GodUIKnowledgeBase';
import { GodUIAPIExplorer } from './godui/pages/GodUIAPIExplorer';
import { GodUISystemStatus } from './godui/pages/GodUISystemStatus';
import { GodUISettings } from './godui/pages/GodUISettings';
import { GodUILanding } from './godui/pages/GodUILanding';
import { GodUILogin } from './godui/pages/GodUILogin';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppProvider>{children}</AppProvider>;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing Page (Standalone Product Reveal) */}
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full absolute inset-0"
            >
              <LandingPage />
            </motion.div>
          }
        />
        
        {/* Login Page */}
        <Route
          path="/login"
          element={
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full absolute inset-0"
            >
              <Login />
            </motion.div>
          }
        />

        {/* GodUI Preview Page */}
        <Route
          path="/godui-preview"
          element={
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full absolute inset-0"
            >
              <GodUIMenuPreview />
            </motion.div>
          }
        />

        {/* Dashboard Application Routes wrapped in AppShell */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.4 }}
                className="w-full h-full absolute inset-0"
              >
                <AppShell>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="feed" element={<ThreatFeed />} />
                  <Route path="assistant" element={<AIAssistant />} />
                  <Route path="demo" element={<RetrievalDemo />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="playbooks" element={<Playbooks />} />
                  <Route path="patch" element={<PatchManagement />} />
                  <Route path="investigation" element={<Investigation />} />
                  <Route path="forensics" element={<Architecture />} />
                  <Route path="api-explorer" element={<APIExplorer />} />
                  <Route path="knowledge-base" element={<KnowledgeBase />} />
                  <Route path="system-status" element={<SystemStatus />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="scanner" element={<ScannerDashboard />} />
                </Routes>
              </AppShell>
              </motion.div>
            </ProtectedRoute>
          }
        />

        {/* V3 GodUI Parallel Architecture */}
        <Route path="/v3/landing" element={<GodUILanding />} />
        <Route path="/v3/login" element={<GodUILogin />} />
        <Route
          path="/v3/*"
          element={
            <ProtectedRoute>
                <GodUIAppShell />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<GodUIDashboard />} />
          <Route path="assistant" element={<GodUIAssistant />} />
          <Route path="feed" element={<GodUIThreatFeed />} />
          <Route path="investigation" element={<GodUIInvestigation />} />
          <Route path="scanner" element={<GodUIScanner />} />
          <Route path="retrieval" element={<GodUIRetrieval />} />
          <Route path="analytics" element={<GodUIAnalytics />} />
          <Route path="playbooks" element={<GodUIPlaybooks />} />
          <Route path="patch" element={<GodUIPatchManagement />} />
          <Route path="architecture" element={<GodUIArchitecture />} />
          <Route path="knowledge-base" element={<GodUIKnowledgeBase />} />
          <Route path="api" element={<GodUIAPIExplorer />} />
          <Route path="status" element={<GodUISystemStatus />} />
          <Route path="settings" element={<GodUISettings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MagneticCursor />
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}
