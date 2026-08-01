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
import SettingsPage from './pages/SettingsPage';
import ScannerDashboard from './pages/ScannerDashboard';
import AdvancedScanner from './pages/AdvancedScanner';
import AuditLogs from './pages/AuditLogs';
import Login from './pages/Login';
import EnterpriseNetwork from './pages/EnterpriseNetwork';
import { GodUIAppShell } from './godui/layouts/GodUIAppShell';
import { GodUIDashboard } from './godui/pages/GodUIDashboard';
import { GodUIAssistant } from './godui/pages/GodUIAssistant';
import { GodUIThreatFeed } from './godui/pages/GodUIThreatFeed';
import { GodUIScanner } from './godui/pages/GodUIScanner';
import { GodUIEnterprise } from './godui/pages/GodUIEnterprise';
import { GodUISettings } from './godui/pages/GodUISettings';
import { GodUILanding } from './godui/pages/GodUILanding';
import { GodUILogin } from './godui/pages/GodUILogin';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full min-h-screen"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full min-h-screen"
            >
              <Login />
            </motion.div>
          }
        />

        {/* Dashboard Application Routes wrapped in AppShell */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-screen overflow-hidden"
              >
                <AppShell>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="feed" element={<ThreatFeed />} />
                  <Route path="assistant" element={<AIAssistant />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="scanner" element={<ScannerDashboard />} />
                  <Route path="advanced-scanner" element={<AdvancedScanner />} />
                  <Route path="network" element={<EnterpriseNetwork />} />
                  <Route path="audit" element={<AuditLogs />} />
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
          <Route path="scanner" element={<GodUIScanner />} />
          <Route path="network" element={<GodUIEnterprise />} />
          <Route path="settings" element={<GodUISettings />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="advanced-scanner" element={<AdvancedScanner />} />
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
