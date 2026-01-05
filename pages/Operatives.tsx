import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, UserCog, Lock, Fingerprint, Activity, ShieldCheck, UserPlus, RefreshCw, Filter, Trash2, Mail, Calendar, Database, X, Sparkles, Key, CheckCircle2, ShieldAlert, Circle, Clock, Zap, SendHorizontal } from 'lucide-react';
import { supabase, supabaseAdmin, isSupabaseConfigured, isAdminAvailable } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Profile } from '../types';

interface OperativeProfile extends Profile {
    created_at?: string;
}

const Operatives: React.FC = () => {
    const [users, setUsers] = useState<OperativeProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
    
    // Provisioning Form State
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        if (isSupabaseConfigured() && supabase) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('last_active', { ascending: false });

                if (error) throw error;
                if (data) {
                    setUsers(data.map(d => ({
                        id: d.id,
                        fullName: d.full_name,
                        role: d.role,
                        department: d.department || 'Operations',
                        email: d.email,
                        lastActive: d.last_active,
                        currentTask: d.current_task || (d.last_active ? 'Idle' : 'Awaiting Onboarding'),
                        created_at: d.created_at
                    })));
                }
            } catch (err: any) {
                toast.error("Cluster sync failed: " + err.message);
            }
        }
        setIsLoading(false);
    };

    const getStatusIndicator = (lastActive?: string) => {
        if (!lastActive) return { label: 'Pending', color: 'bg-amber-400', isOnline: false };
        
        const activeDate = new Date(lastActive);
        const now = new Date();
        const diffMinutes = (now.getTime() - activeDate.getTime()) / 60000;

        if (diffMinutes < 5) {
            return { label: 'Online', color: 'bg-green-500', isOnline: true };
        } else if (diffMinutes < 60) {
            return { label: 'Away', color: 'bg-amber-500', isOnline: false };
        } else {
            return { label: 'Offline', color: 'bg-slate-500', isOnline: false };
        }
    };

    const formatLastActive = (dateStr?: string) => {
        if (!dateStr) return 'Pending Invite';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const handleInviteOperative = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdminAvailable() || !supabaseAdmin) {
            toast.error("Cloud infrastructure administrative link missing. Set VITE_SUPABASE_SERVICE_ROLE_KEY.");
            return;
        }

        setIsSubmitting(true);
        const loadId = toast.loading(`Dispatching invitation to ${newEmail}...`);

        try {
            // 1. Dispatch Invitation Email via Supabase Auth Admin
            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(newEmail, {
                redirectTo: `${window.location.origin}/#/reset-password`,
                data: { full_name: newName, role: newRole }
            });

            if (inviteError) throw inviteError;

            if (inviteData.user) {
                // 2. Create the shell profile immediately
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: inviteData.user.id,
                        full_name: newName,
                        role: newRole,
                        email: newEmail,
                        current_task: 'Awaiting Onboarding',
                        updated_at: new Date().toISOString()
                    });

                if (profileError) throw profileError;
            }

            toast.success(`Onboarding link transmitted to ${newName}`, { id: loadId });
            setShowAddModal(false);
            setNewName('');
            setNewEmail('');
            fetchUsers();
        } catch (err: any) {
            toast.error("Invitation failed: " + err.message, { id: loadId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleToggle = async (userId: string, currentRole: Profile['role']) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        
        if (isSupabaseConfigured() && supabase) {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);
            
            if (error) {
                toast.error("Identity update failed");
                return;
            }
        }
        
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
        toast.success(`Operative role changed to ${newRole.toUpperCase()}`);
    };

    const filteredUsers = users.filter(u => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = u.fullName.toLowerCase().includes(query) || 
                             u.id.toLowerCase().includes(query) ||
                             (u.email && u.email.toLowerCase().includes(query));
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="p-8 bg-slate-950 min-h-full text-slate-300">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                        <Users className="text-indigo-500" size={32} />
                        OPERATIVE <span className="text-indigo-500">CLUSTER</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Personnel Real-time Status & Onboarding</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={fetchUsers}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"
                        title="Resync Cluster"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {isAdminAvailable() && (
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20"
                        >
                            <SendHorizontal size={18} /> Invite Operative
                        </button>
                    )}
                </div>
            </header>

            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Personnel</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter">{users.length}</h3>
                    <Users className="absolute top-4 right-4 text-slate-800" size={40} />
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Active Now</p>
                    <h3 className="text-3xl font-black text-green-500 tracking-tighter">
                        {users.filter(u => getStatusIndicator(u.lastActive).isOnline).length}
                    </h3>
                    <div className="absolute top-4 right-4 text-green-500/20 animate-pulse"><Circle fill="currentColor" size={40} /></div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pending Onboarding</p>
                    <h3 className="text-3xl font-black text-amber-500 tracking-tighter">
                        {users.filter(u => !u.lastActive).length}
                    </h3>
                    <Mail className="absolute top-4 right-4 text-slate-800" size={40} />
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cluster Health</p>
                    <h3 className="text-lg font-bold text-green-500 tracking-tighter uppercase flex items-center gap-2 mt-2">
                        <Zap size={18} className="text-kvi-gold animate-pulse" /> Nominal
                    </h3>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text"
                            placeholder="Search Name, UUID, Task..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-300 transition-all font-mono"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                        {(['all', 'admin', 'user'] as const).map((role) => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    roleFilter === role ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Personnel</th>
                                <th className="px-8 py-5">Connectivity</th>
                                <th className="px-8 py-5">Current Operation</th>
                                <th className="px-8 py-5">Last Handshake</th>
                                <th className="px-8 py-5 text-right">Access Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <RefreshCw className="text-indigo-500 animate-spin" size={40} />
                                            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-600">Querying identity cluster...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? filteredUsers.map((user) => {
                                const status = getStatusIndicator(user.lastActive);
                                return (
                                    <tr key={user.id} className="hover:bg-indigo-500/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 font-black border border-slate-700 shadow-inner group-hover:border-indigo-500/50 transition-all">
                                                        {user.fullName?.charAt(0) || '?'}
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${status.color} ${status.isOnline ? 'animate-pulse' : ''}`}></div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white tracking-tight">{user.fullName}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{user.email || 'no-mail'}</p>
                                                    <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                                        user.role === 'admin' 
                                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                                                        : 'bg-slate-800 border-slate-700 text-slate-400'
                                                    }`}>
                                                        {user.role}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${status.isOnline ? 'text-green-500' : 'text-slate-500'}`}>
                                                    {status.label}
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-mono uppercase tracking-tighter">Session Active</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Zap size={14} className={status.isOnline ? "text-indigo-400" : "text-slate-700"} />
                                                <span className={`text-xs font-bold ${status.isOnline ? 'text-indigo-200' : 'text-slate-500'}`}>
                                                    {user.currentTask}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                                                <Clock size={14} className="text-slate-600" />
                                                {formatLastActive(user.lastActive)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleRoleToggle(user.id, user.role)}
                                                    className="p-3 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-2xl transition-all border border-slate-700"
                                                    title="Modify Clearance Level"
                                                >
                                                    <UserCog size={18} />
                                                </button>
                                                <button className="p-3 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-2xl transition-all border border-slate-700">
                                                    <Lock size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-600 italic">
                                        No operatives matching "{searchTerm}" found in cluster.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Operative Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
                            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                                <Mail size={32} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tighter uppercase">Invite Operative</h2>
                            <p className="text-indigo-100 text-xs font-bold tracking-widest mt-2 uppercase opacity-80">Onboarding Dispatch Protocol</p>
                        </div>

                        <form onSubmit={handleInviteOperative} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Full Legal Name</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                        <input 
                                            type="text" 
                                            required
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Operative Name"
                                            className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Enterprise Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                        <input 
                                            type="email" 
                                            required
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="email@saric.co.zm"
                                            className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Clearance Level</label>
                                    <select 
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black uppercase text-[10px] tracking-widest appearance-none"
                                    >
                                        <option value="user">Field Operative</option>
                                        <option value="admin">Command Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                                    <ShieldAlert size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase leading-relaxed tracking-wider">
                                        The invited user will receive a secure email. Upon clicking the link, they will be redirected to the dashboard to set their credentials.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <RefreshCw className="animate-spin" />
                                    ) : (
                                        <><SendHorizontal size={24} /> Dispatch Invitation</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Operatives;