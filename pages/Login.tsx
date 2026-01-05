
import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin, isAdminAvailable, checkDatabaseHealth } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { ShieldCheck, Lock, Fingerprint, RefreshCw, User, Terminal, Zap, Mail, X, CloudOff, Wifi, AlertTriangle, Database } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Profile } from '../types';

interface LoginProps {
  onLogin: (profile: Profile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [showDemoCreds, setShowDemoCreds] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setDbConnected(null);
    const healthy = await checkDatabaseHealth();
    setDbConnected(healthy);
    if (!healthy) {
      toast.error("Identity Cluster Unreachable", { id: 'conn-error' });
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dbService.recoverIdentity(recoveryEmail);
      toast.success("Recovery link transmitted to enterprise mail.");
      setShowRecovery(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate recovery.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * EMERGENCY PROVISIONING: Creates the requested test identities.
   * Only works if VITE_SUPABASE_SERVICE_ROLE_KEY is in .env
   */
  const bootstrapInfrastructure = async () => {
    if (!isAdminAvailable() || !supabaseAdmin) {
      toast.error("Vanguard Administrative Key Missing.");
      return;
    }
    
    setIsBootstrapping(true);
    const loadId = toast.loading("Provisioning Cluster Infrastructure...");

    const testUsers = [
      { e: 'admin@saric.co.zm', p: 'vanguard2025', n: 'Command Deck Admin', r: 'admin' },
      { e: 'kalalukainfo@gmail.com', p: 'kalalukainfo@gmail.com', n: 'CEO Strategic Lead', r: 'CEO' },
      { e: 'driver1@saric.co.zm', p: 'driver2025', n: 'Field Operative 01', r: 'DRIVER' }
    ];

    try {
      for (const u of testUsers) {
        // Create user in Auth
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: u.e,
          password: u.p,
          email_confirm: true,
          user_metadata: { full_name: u.n, role: u.r }
        });

        // If user already exists, just update their profile to match role
        if (authError && authError.message.includes('already registered')) {
          console.warn(`User ${u.e} already present.`);
          continue;
        }

        if (userData.user) {
            // Profile is handled by DB trigger, but we enforce role update
            await supabaseAdmin.from('profiles').update({ role: u.r, full_name: u.n }).eq('id', userData.user.id);
        }
      }
      
      toast.success("Identity Cluster Provisioned", { id: loadId });
      setShowDemoCreds(true);
    } catch (err: any) {
      toast.error("Provisioning Halted: " + err.message, { id: loadId });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setShowDemoCreds(false);
    toast.success("Identity Loaded", { icon: '💾' });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.error("Credentials required");
      setLoading(false);
      return;
    }

    if (!supabase) {
      toast.error("Database connection unavailable.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.user) {
        const profile = await dbService.getProfile(data.user.id);
        onLogin(profile);
        toast.success(`Authenticated: ${profile.fullName}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Unauthorized access attempt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full blur-[140px] animate-pulse transition-all duration-1000 ${dbConnected === null ? 'bg-indigo-600/10' : dbConnected ? 'bg-green-600/10' : 'bg-red-600/10'}`}></div>
        </div>

        <div className="w-full max-w-md p-8 relative z-10">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-600/40 mb-8 group transition-all relative">
                    <div className="absolute inset-0 bg-white/20 rounded-[2rem] animate-ping opacity-20 group-hover:opacity-40"></div>
                    <ShieldCheck size={48} className="text-white relative z-10" />
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-2">SARIC <span className="text-indigo-500">OPS</span></h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] mt-2">Logistics Command Center</p>
                
                <div className="mt-6 flex flex-col items-center gap-2">
                    <button 
                      onClick={checkConnection}
                      className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-md flex items-center gap-3 transition-all hover:scale-105 active:scale-95 ${dbConnected === null ? 'bg-slate-900 border-slate-800 text-slate-500' : dbConnected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                    >
                        {dbConnected === null ? <RefreshCw size={14} className="animate-spin" /> : dbConnected ? <Wifi size={14} /> : <CloudOff size={14} />}
                        {dbConnected === null ? "Scanning Identity Cluster..." : dbConnected ? "Production Hub Active" : "Cluster Offline - Click to Wake"}
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                
                <div className="flex justify-center gap-2 mb-8">
                  <button 
                    onClick={() => setShowDemoCreds(!showDemoCreds)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 rounded-2xl border border-slate-800 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white hover:border-indigo-500 transition-all active:scale-95"
                  >
                    <Terminal size={14} /> {showDemoCreds ? "Hide Vault" : "Identity Vault"}
                  </button>
                  {isAdminAvailable() && (
                    <button 
                      onClick={bootstrapInfrastructure}
                      disabled={isBootstrapping}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/10 rounded-2xl border border-indigo-600/30 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Database size={14} /> Provision Cluster
                    </button>
                  )}
                </div>

                {showDemoCreds && (
                  <div className="mb-8 space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    {[
                      { e: 'admin@saric.co.zm', p: 'vanguard2025', label: 'Command Deck (Admin)' },
                      { e: 'kalalukainfo@gmail.com', p: 'kalalukainfo@gmail.com', label: 'CEO Access' },
                      { e: 'driver1@saric.co.zm', p: 'driver2025', label: 'Field Operative' }
                    ].map((demo) => (
                      <button 
                        key={demo.e}
                        onClick={() => fillDemo(demo.e, demo.p)}
                        className="w-full text-left p-4 bg-slate-950/50 border border-slate-800 rounded-3xl group/btn hover:border-indigo-500/50 transition-all flex items-center justify-between"
                      >
                        <div>
                          <p className="text-[10px] font-black text-slate-500 group-hover/btn:text-indigo-400 uppercase tracking-widest mb-1">{demo.label}</p>
                          <p className="text-xs text-slate-300 font-mono">{demo.e}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 ml-1">Access Identity</label>
                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@saric.co.zm"
                                className="w-full bg-slate-950/50 border border-slate-800 text-white pl-14 pr-6 py-5 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-3 ml-1">
                            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Passkey</label>
                            <button type="button" onClick={() => setShowRecovery(true)} className="text-[9px] font-black text-indigo-500 uppercase hover:text-indigo-400">Forgot?</button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950/50 border border-slate-800 text-white pl-14 pr-6 py-5 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-3xl shadow-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-50 active:scale-95"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <><Fingerprint size={24} /> Authenticate</>}
                    </button>
                </form>
            </div>
        </div>

        {showRecovery && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden">
                    <div className="p-8 text-white text-center relative">
                        <button onClick={() => setShowRecovery(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl"><X size={20} /></button>
                        <Mail size={32} className="mx-auto mb-4 text-indigo-500" />
                        <h2 className="text-xl font-black uppercase">Reset Password</h2>
                    </div>
                    <form onSubmit={handleRecovery} className="p-8 pt-0 space-y-6">
                        <input 
                            type="email" 
                            required
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            placeholder="Enterprise Email"
                            className="w-full bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-2xl outline-none"
                        />
                        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase">Transmit Link</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Login;
