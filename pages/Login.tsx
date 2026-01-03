import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin, isSupabaseConfigured, checkDatabaseHealth } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Database, Wifi, Activity, ShieldCheck, Key, Lock, Fingerprint, RefreshCw, ChevronRight, ShieldAlert, User, UserPlus, HelpCircle, Info, ExternalLink, ArrowDown, Clipboard, Terminal, Sparkles, CheckCircle2, ShieldQuestion, AlertTriangle, CloudOff, Zap, Mail, X } from 'lucide-react';
import { INITIAL_ASSETS, INITIAL_DRIVERS, INITIAL_SHIPMENTS } from '../constants';
import { dbService } from '../services/dbService';

interface LoginProps {
  onLogin: (role: 'admin' | 'user') => void;
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
  const [bootstrapLog, setBootstrapLog] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setDbConnected(null);
    setFetchError(false);
    const healthy = await checkDatabaseHealth();
    setDbConnected(healthy);
    if (!healthy) {
      setFetchError(true);
      toast.error("Identity Cluster Unreachable", { id: 'conn-error' });
    } else {
      toast.success("Identity Cluster Online", { id: 'conn-success' });
    }
  };

  const addLog = (msg: string) => setBootstrapLog(prev => [...prev.slice(-4), msg]);

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

  const bootstrapInfrastructure = async () => {
    if (!supabaseAdmin) {
      toast.error("Vanguard Security Key Missing");
      return;
    }

    setIsBootstrapping(true);
    setBootstrapLog([]);
    const loadId = toast.loading("Provisioning Cluster Infrastructure...");

    try {
      addLog(">> Uplinking Identity Cluster...");
      const users = [
        { email: 'kalalukainfo@gmail.com', password: 'kalalukainfo@gmail.com', role: 'admin', name: 'Kalaluka Katungu' },
        { email: 'admin@saric.co.zm', password: 'vanguard2025', role: 'admin', name: 'Command Supervisor' },
        { email: 'security@saric.co.zm', password: 'vanguard2025', role: 'admin', name: 'Security Chief' },
        { email: 'operative@saric.co.zm', password: 'field2025', role: 'user', name: 'Field Operative' }
      ];

      for (const u of users) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.name, role: u.role }
        });

        // Upsert profile regardless of auth result to ensure listing
        await supabaseAdmin.from('profiles').upsert({
            id: data.user?.id || `seeded-${u.email}`,
            full_name: u.name,
            role: u.role,
            email: u.email,
            updated_at: new Date().toISOString(),
            current_task: 'Initial Provisioning'
        });
      }

      addLog(">> Transmitting Fleet Telemetry...");
      const assetPayload = INITIAL_ASSETS.map(a => ({
          id: a.id,
          name: a.name,
          category: a.category,
          driver_name: a.driver,
          status: a.status,
          lat: a.location.lat,
          lng: a.location.lng,
          location_name: a.locationName,
          cargo_type: a.cargoType,
          fuel_level: a.fuelLevel,
          speed: a.speed,
          revenue_mtd: a.revenueMonthToDate,
          cost_mtd: a.costMonthToDate
      }));
      await supabaseAdmin.from('assets').upsert(assetPayload);

      addLog(">> Registering Personnel Records...");
      const driverPayload = INITIAL_DRIVERS.map(d => ({
          id: d.id,
          name: d.name,
          status: d.status,
          compliance_score: d.complianceScore
      }));
      await supabaseAdmin.from('drivers').upsert(driverPayload);

      toast.success("Infrastructure Online & Synchronized", { id: loadId });
      checkConnection();
      setTimeout(() => setIsBootstrapping(false), 2000);
    } catch (err: any) {
      toast.error("Provisioning Halted: " + err.message, { id: loadId });
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

    const role = email.toLowerCase().includes('admin') || 
                 email.toLowerCase().includes('security') || 
                 email.toLowerCase().includes('kalaluka') ? 'admin' : 'user';

    if (dbConnected && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        onLogin((profile?.role as 'admin' | 'user') || role);
        toast.success("Identity Verified");
      } catch (error: any) {
        if (error.message?.includes('fetch')) {
            toast.error("Network Link Severed: Identity Cluster unreachable.");
            setFetchError(true);
            setDbConnected(false);
        } else {
            toast.error(error.message || "Unauthorized access attempt.");
        }
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
      onLogin(role);
      toast("Simulation Active (Offline Mode)", { icon: '⚠️' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
        {/* Background Grid & FX */}
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
                        {dbConnected === null ? "Scanning Identity Cluster..." : dbConnected ? "Production Hub Active" : "Cluster Offline - Click to Wake Hub"}
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                
                <div className="flex flex-col gap-4 mb-8">
                  {fetchError && !dbConnected && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 animate-in slide-in-from-top-2">
                        <AlertTriangle className="text-red-500 shrink-0" size={18} />
                        <div>
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Critical Connection Error</p>
                            <p className="text-[9px] text-slate-400 leading-relaxed uppercase">The identity cluster is hibernating. Click the status button above to force a wake-up sequence. This may take up to 30 seconds.</p>
                        </div>
                    </div>
                  )}

                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => setShowDemoCreds(!showDemoCreds)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 rounded-2xl border border-slate-800 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white hover:border-indigo-500 transition-all active:scale-95"
                    >
                      <Terminal size={14} /> {showDemoCreds ? "Hide Vault" : "Identity Vault"}
                    </button>
                    {dbConnected && (
                      <button 
                        onClick={bootstrapInfrastructure}
                        disabled={isBootstrapping}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                      >
                        <Zap size={14} /> {isBootstrapping ? "Provisioning..." : "Provision Cluster"}
                      </button>
                    )}
                  </div>
                </div>

                {showDemoCreds && (
                  <div className="mb-8 space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    {[
                      { e: 'kalalukainfo@gmail.com', p: 'kalalukainfo@gmail.com', label: 'Requested Admin (Kalaluka Katungu)', icon: Sparkles },
                      { e: 'admin@saric.co.zm', p: 'vanguard2025', label: 'Command Deck (Admin)', icon: ShieldCheck },
                      { e: 'security@saric.co.zm', p: 'vanguard2025', label: 'Security SOC (Chief)', icon: ShieldAlert },
                      { e: 'operative@saric.co.zm', p: 'field2025', label: 'Field HUD (Staff)', icon: User }
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
                        <demo.icon size={18} className="text-slate-800 group-hover/btn:text-indigo-500/50 transition-colors" />
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
                                className="w-full bg-slate-950/50 border border-slate-800 text-white pl-14 pr-6 py-5 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800 font-medium"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-3 ml-1">
                            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Secure Passkey</label>
                            <button 
                                type="button"
                                onClick={() => setShowRecovery(true)}
                                className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors"
                            >
                                Forgot Passkey?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950/50 border border-slate-800 text-white pl-14 pr-6 py-5 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800 font-medium"
                            />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-3xl shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 transition-all disabled:opacity-50 active:scale-95"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <><Fingerprint size={24} /> Authenticate Link</>}
                    </button>
                </form>
            </div>
            
            <div className="mt-10 text-center flex items-center justify-center gap-4">
                <span className="h-px w-8 bg-slate-900"></span>
                <p className="text-[10px] text-slate-700 uppercase tracking-[0.4em] font-black">Vanguard Core Stable</p>
                <span className="h-px w-8 bg-slate-900"></span>
            </div>
        </div>

        {/* Password Reset / Identity Recovery Modal */}
        {showRecovery && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-8 text-white text-center relative">
                        <button onClick={() => setShowRecovery(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-600/20">
                            <Mail size={32} />
                        </div>
                        <h2 className="text-xl font-black tracking-tighter uppercase">Reset Password</h2>
                        <p className="text-slate-500 text-[10px] font-bold tracking-widest mt-2 uppercase">Request a reset link for your user identity.</p>
                    </div>
                    <form onSubmit={handleRecovery} className="p-8 space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Enterprise Email</label>
                            <input 
                                type="email" 
                                required
                                value={recoveryEmail}
                                onChange={(e) => setRecoveryEmail(e.target.value)}
                                placeholder="name@saric.co.zm"
                                className="w-full bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : "Transmit Reset Link"}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Login;