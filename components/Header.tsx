
import React, { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, ChevronDown, Settings, Wifi, WifiOff, ShieldAlert } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { checkDatabaseHealth } from '../lib/supabaseClient';
import { Profile } from '../types';

interface HeaderProps {
  onLogout: () => void;
  profile: Profile | null;
}

const Header: React.FC<HeaderProps> = ({ onLogout, profile }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDbOnline, setIsDbOnline] = useState<boolean | null>(null);
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const isNoSim = profile?.noSim || false;

  const verifyConn = async () => {
    const status = await checkDatabaseHealth();
    setIsDbOnline(status);
  };

  useEffect(() => {
    verifyConn();
    const interval = setInterval(verifyConn, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-30 shadow-sm">
        <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search operations..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
            </div>
        </div>

        <div className="flex items-center gap-4 border-l border-slate-100 pl-6 ml-6">
            {isNoSim && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-black uppercase animate-pulse">
                <WifiOff size={14} /> Signal Loss Reported
              </div>
            )}

            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                isDbOnline === true
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-red-50 text-red-700 border-red-100'
              }`}
            >
                {isDbOnline ? <Wifi size={14} /> : <WifiOff size={14} className="animate-pulse" />}
                {isDbOnline ? 'Hub Linked' : 'Hub Offline'}
            </div>

            <div className="h-8 w-px bg-slate-100"></div>

            <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>

            <div className="relative">
                <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 hover:bg-slate-50 p-1 rounded-lg transition-colors"
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${profile?.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {profile?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'OP'}
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                </button>

                {showProfileMenu && (
                    <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in p-1">
                        <div className="px-4 py-2 border-b border-slate-50">
                           <p className="text-xs font-black text-slate-900 truncate uppercase">{profile?.fullName}</p>
                           <p className="text-[10px] text-slate-400 uppercase tracking-widest">{profile?.role}</p>
                        </div>
                        <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"><Settings size={16} /> Settings</button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"><LogOut size={16} /> Sign Out</button>
                    </div>
                )}
            </div>
        </div>
    </header>
  );
};

export default Header;
