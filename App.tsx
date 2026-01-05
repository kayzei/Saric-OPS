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
import { Profile } from './types';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiveTracking = lazy(() => import('./pages/LiveTracking'));
const Assets = lazy(() => import('./pages/Assets'));
const Shipments = lazy(() => import('./pages/Shipments'));
const Invoicing = lazy(() => import('./pages/Invoicing'));
const Projects = lazy(() => import('./pages/Projects'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Documents = lazy(() => import('./pages/Documents'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminSecurity = lazy(() => import('./pages/AdminSecurity'));
const Operatives = lazy(() => import('./pages/Operatives'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const AppContent: React.FC<{ 
  isAuthenticated: boolean; 
  setIsAuthenticated: (val: boolean) => void;
  userRole: string;
  setUserRole: (role: any) => void;
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
}> = ({ isAuthenticated, setIsAuthenticated, userRole, setUserRole, profile, setProfile }) => {
  const { assets, updateAsset } = useFleetData(isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          setIsAuthenticated(true);
          try {
            const p = await dbService.getProfile(session.user.id);
            setProfile(p);
            setUserRole(p.role);
          } catch (e) {
            console.warn("Profile fetch deferred: Cluster sync active.");
          }
        } else {
          setIsAuthenticated(false);
          setProfile(null);
          setUserRole('user');
        }
        
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/reset-password');
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [setIsAuthenticated, setUserRole, navigate, setProfile]);

  return (
    <>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Login onLogin={(p) => {
              setProfile(p);
              setUserRole(p.role);
              setIsAuthenticated(true);
            }} />} />
          </>
        ) : (
          <Route path="/" element={<Layout profile={profile} onLogout={() => {
              dbService.logout();
              setIsAuthenticated(false);
          }} />}>
            <Route index element={<Dashboard assets={assets} userRole={userRole} profile={profile} />} />
            <Route path="live-tracking" element={<LiveTracking assets={assets} userRole={userRole as any} />} />
            <Route path="assets" element={<Assets assets={assets} onUpdateAsset={updateAsset} userRole={userRole as any} profile={profile} />} />
            <Route path="maintenance" element={<Maintenance userRole={userRole as any} />} />
            <Route path="inventory" element={<Inventory />} />
            {userRole === 'admin' && !profile?.onDuty && (
              <>
                  <Route path="admin/security" element={<AdminSecurity />} />
                  <Route path="admin/operatives" element={<Operatives />} />
                  <Route path="shipments" element={<Shipments assets={assets} />} />
                  <Route path="invoicing" element={<Invoicing />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="drivers" element={<Drivers />} />
                  <Route path="settings" element={<Settings profile={profile} />} />
              </>
            )}
            <Route path="documents" element={<Documents />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
      {isAuthenticated && <LiveAIAssistant assets={assets} profile={profile} />}
    </>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const healthy = await checkDatabaseHealth();
          if (healthy) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setIsAuthenticated(true);
              const p = await dbService.getProfile(session.user.id).catch(() => null);
              setProfile(p);
              if (p) setUserRole(p.role);
            }
          }
        } catch (err) {
          console.warn("Vanguard handshake deferred.");
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
        <div className="bg-slate-950 min-h-screen font-sans">
          <Toaster position="top-right" />
          <Suspense fallback={<Preloader />}>
             <AppContent 
                isAuthenticated={isAuthenticated} 
                setIsAuthenticated={setIsAuthenticated} 
                userRole={userRole}
                setUserRole={setUserRole}
                profile={profile}
                setProfile={setProfile}
             />
          </Suspense>
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;