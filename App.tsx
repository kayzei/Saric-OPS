import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase, isSupabaseConfigured, checkDatabaseHealth } from './lib/supabaseClient';
import Preloader from './components/Preloader';
import Layout from './components/Layout';
import Login from './pages/Login';
import { NotificationProvider } from './contexts/NotificationContext';
import { useFleetData } from './hooks/useFleetData';
import LiveAIAssistant from './components/LiveAIAssistant';
import { dbService } from './services/dbService';

// Lazy Load Pages
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
const AdminSecurity = lazy(() => import('./pages/AdminSecurity'));
const Operatives = lazy(() => import('./pages/Operatives'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const AppContent: React.FC<{ 
  isAuthenticated: boolean; 
  setIsAuthenticated: (val: boolean) => void;
  userRole: 'admin' | 'user';
  setUserRole: (role: 'admin' | 'user') => void;
}> = ({ isAuthenticated, setIsAuthenticated, userRole, setUserRole }) => {
  const { assets, updateAsset } = useFleetData(isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
          try {
            const profile = await dbService.getProfile(session.user.id);
            if (profile) setUserRole(profile.role);
          } catch (e) {
            console.warn("Profile fetch failed, using default role.");
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserRole('user');
        } else if (event === 'PASSWORD_RECOVERY') {
          navigate('/reset-password');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [setIsAuthenticated, setUserRole, navigate]);

  return (
    <>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Login onLogin={(role) => {
                setUserRole(role);
                setIsAuthenticated(true);
            }} />} />
          </>
        ) : (
          <Route path="/" element={<Layout userRole={userRole} onLogout={() => {
              dbService.logout();
              setIsAuthenticated(false);
          }} />}>
            <Route index element={<Dashboard assets={assets} userRole={userRole} />} />
            <Route path="live-tracking" element={<LiveTracking assets={assets} userRole={userRole} />} />
            <Route path="assets" element={<Assets assets={assets} onUpdateAsset={updateAsset} userRole={userRole} />} />
            <Route path="maintenance" element={<Maintenance userRole={userRole} />} />
            
            {userRole === 'admin' && (
              <>
                  <Route path="admin/security" element={<AdminSecurity />} />
                  <Route path="admin/operatives" element={<Operatives />} />
                  <Route path="shipments" element={<Shipments assets={assets} />} />
                  <Route path="invoicing" element={<Invoicing />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="drivers" element={<Drivers />} />
                  <Route path="settings" element={<Settings />} />
              </>
            )}

            <Route path="documents" element={<Documents />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
      {isAuthenticated && <LiveAIAssistant assets={assets} userRole={userRole} />}
    </>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          // Attempt a soft wake-up but don't hang the app if it fails
          const isHealthy = await checkDatabaseHealth();
          
          if (isHealthy) {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            if (session) {
              setIsAuthenticated(true);
              const profile = await dbService.getProfile(session.user.id).catch(() => null);
              if (profile) {
                setUserRole(profile.role);
                localStorage.setItem('saric_profile', JSON.stringify(profile));
              } else {
                setUserRole(session.user.email?.includes('admin') ? 'admin' : 'user');
              }
            } else {
              const cached = localStorage.getItem('saric_profile');
              if (cached) {
                  const p = JSON.parse(cached);
                  setUserRole(p.role);
              }
            }
          }
        } catch (err) {
          console.warn("Vanguard handshake deferred: Project may be hibernating.");
        }
      }
      setLoading(false);
    };

    fetchSession();
  }, []);

  if (loading) return <Preloader />;

  return (
    <Router>
      <NotificationProvider>
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
          <Toaster position="top-right" />
          <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-950 text-indigo-400 font-bold uppercase tracking-widest animate-pulse">Establishing Secure Uplink...</div>}>
             <AppContent 
                isAuthenticated={isAuthenticated} 
                setIsAuthenticated={(val) => setIsAuthenticated(val)} 
                userRole={userRole}
                setUserRole={setUserRole}
             />
          </Suspense>
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;
