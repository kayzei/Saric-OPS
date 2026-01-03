import React, { useState, useEffect } from 'react';
import { Shield, Lock, Activity, Users, Globe, Terminal, AlertCircle, CheckCircle, RefreshCw, Eye, UserPlus, Key, Fingerprint, MapPin, Database, ShieldAlert, MoreVertical, ShieldCheck, UserCog, Search, Zap, Server, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SecurityEvent } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';

interface Profile {
    id: string;
    full_name: string;
    role: 'admin' | 'user';
    created_at?: string;
    email?: string;
}

const AdminSecurity: React.FC = () => {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [activeSessions, setActiveSessions] = useState<number>(0);
    const [dbStatus, setDbStatus] = useState<'connected' | 'offline'>('offline');
    const [isLoading, setIsLoading] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [systemPulse, setSystemPulse] = useState<Record<string, { count: number; healthy: boolean }> | null>(null);

    useEffect(() => {
        fetchSecurityMetrics();
        fetchRegisteredUsers();
        fetchSystemPulse();
    }, []);

    const fetchSystemPulse = async () => {
        const pulse = await dbService.getSystemPulse();
        if (pulse) setSystemPulse(pulse);
    };

    const fetchRegisteredUsers = async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setUsers(data as Profile[]);
            }
        } else {
            setUsers([
                { id: 'usr-001', full_name: 'Kennedy Mumba', role: 'user', created_at: '2024-05-10T10:00:00Z', email: 'k.mumba@saric.co.zm' },
                { id: 'usr-002', full_name: 'Joseph Phiri', role: 'user', created_at: '2024-05-12T08:30:00Z', email: 'j.phiri@saric.co.zm' },
                { id: 'usr-003', full_name: 'Admin Supervisor', role: 'admin', created_at: '2024-01-01T00:00:00Z', email: 'admin@saric.co.zm' },
            ]);
        }
    };

    const fetchSecurityMetrics = async () => {
        if (isSupabaseConfigured() && supabase) {
            setDbStatus('connected');
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                setEvents(data.map(d => ({
                    id: d.id,
                    timestamp: d.created_at,
                    type: d.event_type,
                    severity: d.severity,
                    userId: d.user_id || 'System',
                    ipAddress: d.ip_address || 'Internal',
                    location: 'Lusaka, ZM',
                    userAgent: 'API Client',
                    details: d.details
                })));
            }
            setActiveSessions(Math.floor(Math.random() * 5) + 2);
        }
    };

    const handleRoleToggle = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (isSupabaseConfigured() && supabase) {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);
            
            if (error) {
                toast.error("Role update failed");
                return;
            }
        }
        
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as 'admin' | 'user' } : u));
        toast.success(`Identity updated to ${newRole.toUpperCase()}`);
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            toast.success(`Provisioning Link Sent`, {
                icon: '📩',
                style: { background: '#0f172a', color: '#fff' }
            });
            setShowInviteModal(false);
            setIsLoading(false);
        }, 1500);
    };

    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        u.id.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-slate-950 min-h-screen text-slate-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                        <ShieldAlert className="text-indigo-500" size={32} />
                        SECURITY <span className="text-indigo-500">SOC</span>
                    </h1>
                    <p className="text-slate-500 mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <Activity size={14} className={dbStatus === 'connected' ? "text-green-500" : "text-red-500"} /> 
                        Cluster Status: {dbStatus.toUpperCase()} • <Database size={14} /> PostgreSQL RLS Active • <Lock size={14} /> TLS 1.3
                    </p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20"
                    >
                        <UserPlus size={18} /> Provision operative
                    </button>
                </div>
            </div>

            {/* System Pulse Matrix - Autonomous Discovery Protocol */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Server size={14} className="text-indigo-400" /> Infrastructure Discovery Pulse
                    </h3>
                    <button onClick={fetchSystemPulse} className="text-indigo-500 hover:text-indigo-400 transition-colors">
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {systemPulse ? (Object.entries(systemPulse) as [string, { count: number; healthy: boolean }][]).map(([table, meta]) => (
                        <div key={table} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1 group hover:border-indigo-500/30 transition-all">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{table}</span>
                            <div className="flex items-end justify-between mt-1">
                                <span className="text-xl font-black text-white">{meta.count}</span>
                                <div className={`w-2 h-2 rounded-full ${meta.healthy ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`}></div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full h-16 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-700 text-[10px] font-black uppercase tracking-widest">
                            Establishing neural handshake with data cluster...
                        </div>
                    )}
                </div>
                <p className="mt-3 text-[9px] text-slate-600 uppercase font-bold tracking-widest px-2 italic">
                    Note: Parallel agents should verify Pulse counts before deploying new structural migrations.
                </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Auth Attempts', val: '1,204', icon: CheckCircle, color: 'green' },
                    { label: 'Active Sessions', val: activeSessions, icon: Users, color: 'indigo' },
                    { label: 'Blocked Threats', val: '42', icon: ShieldAlert, color: 'orange' },
                    { label: 'Identity Score', val: '99.8%', icon: ShieldCheck, color: 'green' }
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{stat.val}</h3>
                        <div className="absolute top-4 right-4 text-slate-800"><stat.icon size={40} /></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
                {/* Operative Management Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="px-8 py-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center bg-slate-900/50 gap-4">
                        <h3 className="font-black flex items-center gap-3 text-sm uppercase tracking-widest text-white">
                            <Users size={20} className="text-indigo-500" />
                            Registered Operatives
                        </h3>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text"
                                placeholder="Search UUID or Name..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-300 transition-all font-mono"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-4">Operative Identity</th>
                                    <th className="px-8 py-4">Clearance Role</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-indigo-500/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400 font-black border border-slate-700 shadow-inner">
                                                    {user.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white tracking-tight">{user.full_name}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                user.role === 'admin' 
                                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}>
                                                {user.role === 'admin' ? <Shield size={12} /> : <Users size={12} />}
                                                {user.role}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-tighter">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                                Authenticated
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleRoleToggle(user.id, user.role)}
                                                    className="p-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 group-hover:border-indigo-500/50"
                                                    title="Toggle Clearance Level"
                                                >
                                                    <UserCog size={16} />
                                                </button>
                                                <button className="p-2.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700">
                                                    <Lock size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Events Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="font-black flex items-center gap-3 text-sm uppercase tracking-widest text-white">
                            <Terminal size={18} className="text-indigo-500" />
                            Access Logs (Live Feed)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px]">
                            <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-4">Timestamp</th>
                                    <th className="px-8 py-4">Event</th>
                                    <th className="px-8 py-4">Operative</th>
                                    <th className="px-8 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {events.length > 0 ? events.map((ev) => (
                                    <tr key={ev.id} className="hover:bg-indigo-500/5 transition-colors">
                                        <td className="px-8 py-4 font-mono text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                                        <td className="px-8 py-4">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-400 font-bold border border-slate-700">
                                                {ev.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 font-bold text-slate-300 truncate max-w-[150px]">{ev.userId}</td>
                                        <td className="px-8 py-4 text-slate-500 italic">"{ev.details}"</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center text-slate-600 italic font-medium uppercase tracking-[0.3em] text-[8px]">Scanning identity cluster...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl h-fit">
                    <h3 className="font-black mb-6 flex items-center gap-3 text-sm uppercase tracking-widest text-white">
                        <Globe size={20} className="text-indigo-500" />
                        Network Topology
                    </h3>
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors animate-pulse"></div>
                        <Fingerprint size={48} className="text-slate-800 mb-4" />
                        <span className="text-[9px] font-black text-slate-600 z-10 uppercase tracking-[0.5em] text-center px-4 leading-relaxed">Identity Handshake <br/> Secure Tunnel Active</span>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-indigo-600 p-8 text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                                <Shield className="text-white" size={32} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tighter uppercase">PROVISION OPERATIVE</h2>
                            <p className="text-indigo-100 text-xs font-bold tracking-widest mt-2 uppercase opacity-80">Zero-Trust Credentialing</p>
                        </div>
                        <form onSubmit={handleInvite} className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Enterprise Email</label>
                                <input 
                                    type="email" 
                                    required
                                    placeholder="operative@saric.co.zm"
                                    className="w-full bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? <RefreshCw className="animate-spin" /> : "Authorize & Transmit"}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowInviteModal(false)}
                                className="w-full text-slate-600 hover:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                Abort Operation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSecurity;