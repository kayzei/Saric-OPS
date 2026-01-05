import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, UserCog, Lock, UserPlus, RefreshCw, X, Mail, Clock, Zap, SendHorizontal, Circle, ShieldAlert, AlertCircle } from 'lucide-react';
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
    
    // Invitation Modal State
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

        if (diffMinutes < 5) return { label: 'Online', color: 'bg-green-500', isOnline: true };
        if (diffMinutes < 60) return { label: 'Away', color: 'bg-amber-500', isOnline: false };
        return { label: 'Offline', color: 'bg-slate-500', isOnline: false };
    };

    const handleInviteOperative = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // --- SIMULATION MODE FALLBACK ---
        if (!isAdminAvailable() || !supabaseAdmin) {
            setIsSubmitting(true);
            toast.promise(
                new Promise(async (resolve, reject) => {
                    setTimeout(async () => {
                        // Attempt to at least create a profile entry if RLS permits
                        if (supabase) {
                            const tempId = crypto.randomUUID();
                            const { error } = await supabase.from('profiles').insert({
                                id: tempId,
                                full_name: newName,
                                email: newEmail,
                                role: newRole,
                                current_task: 'Simulated Onboarding'
                            });
                            
                            if (error) {
                                reject("Simulation restricted by database policy.");
                            } else {
                                resolve("Simulation Successful");
                                fetchUsers();
                                setShowAddModal(false);
                            }
                        } else {
                            reject("No database link.");
                        }
                    }, 1500);
                }),
                {
                    loading: 'Simulating Invitation Dispatch...',
                    success: 'Operative Provisioned (Simulation Mode)',
                    error: 'Administrative Key Required for Real Invitations'
                }
            ).finally(() => setIsSubmitting(false));
            return;
        }

        setIsSubmitting(true);
        const loadId = toast.loading(`Dispatching invitation to ${newEmail}...`);

        try {
            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(newEmail, {
                redirectTo: `${window.location.origin}/#/reset-password`,
                data: { full_name: newName, role: newRole }
            });

            if (inviteError) throw inviteError;

            if (inviteData.user) {
                await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: inviteData.user.id,
                        full_name: newName,
                        role: newRole,
                        email: newEmail,
                        current_task: 'Awaiting Onboarding',
                        updated_at: new Date().toISOString()
                    });
            }

            toast.success(`Invitation transmitted to ${newName}`, { id: loadId });
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
        const newRole = (currentRole === 'admin' ? 'user' : 'admin') as Profile['role'];
        
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
        
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast.success(`Operative ${newRole === 'admin' ? 'Promoted to ADMIN' : 'Demoted to USER'}`);
    };

    const filteredUsers = users.filter(u => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = 
            (u.fullName?.toLowerCase() || "").includes(query) || 
            (u.id?.toLowerCase() || "").includes(query) ||
            (u.email?.toLowerCase() || "").includes(query);
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
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Personnel Management & Onboarding</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={fetchUsers}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"
                        title="Resync Cluster"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20"
                    >
                        <UserPlus size={18} /> Invite Operative
                    </button>
                </div>
            </header>

            {!isAdminAvailable() && (
                <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-4 text-indigo-400">
                    <AlertCircle size={20} />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest">Simulation Mode Active</p>
                        <p className="text-[10px] opacity-70">Admin Service Role Key is missing. Actions will be simulated in the database without sending real invitation emails.</p>
                    </div>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text"
                            placeholder="Filter by Name, ID, or Email..."
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
                                <th className="px-8 py-5 text-center">Clearance</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Last Handshake</th>
                                <th className="px-8 py-5 text-right">Access Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <RefreshCw className="text-indigo-500 animate-spin mx-auto mb-4" size={40} />
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-600">Querying identity cluster...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? filteredUsers.map((user) => {
                                const status = getStatusIndicator(user.lastActive);
                                return (
                                    <tr key={user.id} className="hover:bg-indigo-500/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 font-black border border-slate-700">
                                                        {user.fullName?.charAt(0) || '?'}
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${status.color}`}></div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white tracking-tight">{user.fullName}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{user.email || user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                user.role === 'admin' 
                                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}>
                                                {user.role}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${status.isOnline ? 'text-green-500' : 'text-slate-500'}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-mono text-xs text-slate-500">
                                            {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Pending'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleRoleToggle(user.id, user.role)}
                                                    className="p-3 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-2xl transition-all border border-slate-700"
                                                    title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
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
                                        No operatives found matching "{searchTerm}".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
                            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-black tracking-tighter uppercase">Invite Operative</h2>
                            <p className="text-indigo-100 text-xs font-bold tracking-widest mt-2 uppercase opacity-80">Credentialing Dispatch Protocol</p>
                        </div>

                        <form onSubmit={handleInviteOperative} className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Operative Name"
                                    className="w-full bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Enterprise Email</label>
                                <input 
                                    type="email" 
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="email@saric.co.zm"
                                    className="w-full bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Clearance Level</label>
                                <select 
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                                    className="w-full bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-bold text-xs"
                                >
                                    <option value="user">Field Operative (User)</option>
                                    <option value="admin">Command Admin</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 flex items-center justify-center gap-3 transition-all"
                            >
                                {isSubmitting ? <RefreshCw className="animate-spin" /> : <><SendHorizontal size={20} /> Dispatch Invitation</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Operatives;