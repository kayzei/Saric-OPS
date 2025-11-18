import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Preloader from './components/Preloader';
import Layout from './components/Layout';
import Login from './pages/Login';
import { NotificationProvider } from './contexts/NotificationContext';
import { useFleetSimulation } from './hooks/useFleetSimulation';

// Lazy Load Pages for Performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiveTracking = lazy(() => import('./pages/LiveTracking'));
const Assets = lazy(() => import('./pages/Assets'));
const Shipments = lazy(() => import('./pages/Shipments'));
const Invoicing = lazy(() => import('./pages/Invoicing'));
const Projects = lazy(() => import('./pages/Projects'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Documents = lazy(() => import('./pages/Documents'));
const Settings = lazy(() => import('./pages/Settings'));

const AppContent: React.FC<{ isAuthenticated: boolean; setIsAuthenticated: (val: boolean) => void }> = ({ isAuthenticated, setIsAuthenticated }) => {
  const { assets, updateAsset } = useFleetSimulation(isAuthenticated);

  return (
    <Routes>
      {!isAuthenticated ? (
        <Route path="*" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
      ) : (
        <Route path="/" element={<Layout onLogout={() => setIsAuthenticated(false)} />}>
          <Route index element={<Dashboard assets={assets} />} />
          <Route path="live-tracking" element={<LiveTracking assets={assets} />} />
          <Route path="assets" element={<Assets assets={assets} onUpdateAsset={updateAsset} />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="invoicing" element={<Invoicing />} />
          <Route path="documents" element={<Documents />} />
          <Route path="projects" element={<Projects />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <Router>
      <NotificationProvider>
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
          <Toaster position="top-right" reverseOrder={false} />
          <Suspense fallback={<div className="flex items-center justify-center h-screen w-full bg-slate-50 text-slate-400">Loading Resources...</div>}>
             <AppContent isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          </Suspense>
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;