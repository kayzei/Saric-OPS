import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, LogOut, Menu, X, ChevronDown, Settings, Database, Wifi, WifiOff, Truck, Users, FileText, ArrowRight, RefreshCw, CloudUpload } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { checkDatabaseHealth } from '../lib/supabaseClient';
import { INITIAL_ASSETS, INITIAL_DRIVERS, INITIAL_INVOICES } from '../constants';
import { syncService } from '../services/syncService';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDbOnline, setIsDbOnline] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const verifyConn = async () => {
      const status = await checkDatabaseHealth();
      setIsDbOnline(status);
    };
    verifyConn();
    const interval = setInterval(verifyConn, 30000); // Check every 30s
    
    // Subscribe to sync queue changes
    const unsubscribeSync = syncService.subscribe((count) => {
        setPendingSyncCount(count);
    });

    return () => {
        clearInterval(interval);
        unsubscribeSync();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
        markAllAsRead();
    }
  };

  const getNotificationIcon = (type: string) => {
      switch(type) {
          case 'error': return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
          case 'warning': return <div className="w-2 h-2 rounded-full bg-amber-500"></div>;
          case 'success': return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
          default: return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      }
  };

  // Global Search Logic
  const searchResults = searchQuery.length > 1 ? {
    assets: INITIAL_ASSETS.filter(a => a.id.toLowerCase().includes(searchQuery.toLowerCase()) || a.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3),
    drivers: INITIAL_DRIVERS.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3),
    invoices: INITIAL_INVOICES.filter(i => i.id.toLowerCase().includes(searchQuery.toLowerCase()) || i.customer.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
  } : { assets: [], drivers: [], invoices: [] };

  const hasResults = searchResults.assets.length > 0 || searchResults.drivers.length > 0 || searchResults.invoices.length > 0;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-30 shadow-sm">
        {/* Search */}
        <div className="flex items-center flex-1 max-w-xl relative" ref={searchRef}>
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    placeholder="Global Search (Assets, Shipments, Drivers)..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                />
            </div>

            {showSearchResults && searchQuery.length > 1 && (
              <div className="absolute top-12 left-0 right-0 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  {!hasResults ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic">No matching records found.</div>
                  ) : (
                    <>
                      {searchResults.assets.length > 0 && (
                        <div className="mb-2">
                          <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fleet Assets</p>
                          {searchResults.assets.map(asset => (
                            <button key={asset.id} onClick={() => { navigate('/assets', { state: { targetAssetId: asset.id } }); setSearchQuery(''); }} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg group transition-colors">
                              <div className="flex items-center gap-3">
                                <Truck size={14} className="text-slate-400 group-hover:text-indigo-500" />
                                <span>{asset.id} - {asset.name}</span>
                              </div>
                              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.drivers.length > 0 && (
                        <div className="mb-2">
                          <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</p>
                          {searchResults.drivers.map(driver => (
                            <button key={driver.id} onClick={() => { navigate('/drivers'); setSearchQuery(''); }} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg group transition-colors">
                              <div className="flex items-center gap-3">
                                <Users size={14} className="text-slate-400 group-hover:text-indigo-500" />
                                <span>{driver.name}</span>
                              </div>
                              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.invoices.length > 0 && (
                        <div>
                          <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoices</p>
                          {searchResults.invoices.map(inv => (
                            <button key={inv.id} onClick={() => { navigate('/invoicing'); setSearchQuery(''); }} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg group transition-colors">
                              <div className="flex items-center gap-3">
                                <FileText size={14} className="text-slate-400 group-hover:text-indigo-500" />
                                <span>{inv.id} - {inv.customer}</span>
                              </div>
                              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 lg:gap-6">
            {/* Sync Status Indicator */}
            {pendingSyncCount > 0 && (
                <div 
                    onClick={() => syncService.processQueue()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-all shadow-sm animate-pulse"
                    title={`${pendingSyncCount} operations pending synchronization`}
                >
                    <RefreshCw size={14} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{pendingSyncCount} Pending</span>
                </div>
            )}

            {/* DB Status Indicator */}
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
                isDbOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}
              title={isDbOnline ? "Identity Cluster: Online" : "Identity Cluster: Simulation Mode"}
            >
                {isDbOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider">
                  {isDbOnline ? 'Production' : 'Simulation'}
                </span>
            </div>

            {/* Notifications */}
            <div className="relative">
                <button 
                    onClick={handleNotificationClick}
                    className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                    )}
                </button>

                {showNotifications && (
                    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                        <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                            <span className="text-xs text-slate-500">{notifications.length} recent</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? notifications.map((notif) => (
                                <div key={notif.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                    <div className="flex gap-3">
                                        <div className="mt-1.5">{getNotificationIcon(notif.type)}</div>
                                        <div>
                                            <p className="text-sm text-slate-800 font-medium leading-tight mb-1">{notif.title}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{notif.timestamp.toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No new notifications
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile */}
            <div className="relative">
                <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 hover:bg-slate-50 p-1 rounded-lg transition-colors"
                >
                    <div className="w-8 h-8 bg-gradient-to-br from-saric-500 to-saric-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                        AD
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-xs font-bold text-slate-800">Admin User</p>
                        <p className="text-[10px] text-slate-500">System Administrator</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                </button>

                {showProfileMenu && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                        <div className="p-2">
                            <button 
                                onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                                <Settings size={16} /> Settings
                            </button>
                            <div className="h-px bg-slate-100 my-1"></div>
                            <button 
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </header>
  );
};

export default Header;