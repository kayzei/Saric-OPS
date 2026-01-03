import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck, Fingerprint, RefreshCw, X, ShieldAlert } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passkeys do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Passkey must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await dbService.updatePassword(password);
      toast.success("Identity updated successfully.");
      // Redirect to projects for onboarding/first-login context
      navigate('/projects');
    } catch (err: any) {
      toast.error(err.message || "Failed to update passkey.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
        {/* Background FX */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] bg-indigo-600/10"></div>
        </div>

        <div className="w-full max-w-md p-8 relative z-10">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-indigo-600 shadow-2xl shadow-indigo-600/40 mb-8">
                    <ShieldAlert size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">UPDATE <span className="text-indigo-500">PASSKEY</span></h1>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Identity Cluster Recovery</p>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                <form onSubmit={handleReset} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">New Secure Passkey</label>
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 8 characters"
                                className="w-full bg-slate-950/50 border border-slate-800 text-white pl-14 pr-6 py-5 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Confirm Passkey</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                            <input 
                                type="password" 
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950/50 border border-slate-800 text-white pl-14 pr-6 py-5 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                            />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-3xl shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 transition-all disabled:opacity-50 active:scale-95"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <><Fingerprint size={24} /> Resync Identity</>}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => navigate('/')}
                        className="w-full text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2 hover:text-slate-400 transition-colors"
                    >
                        Abort Recovery
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default ResetPassword;