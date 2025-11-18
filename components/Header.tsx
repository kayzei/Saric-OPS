import React, { useState } from 'react';
import { Bell, Search, User, LogOut, Menu, X, ChevronDown, Settings } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-30 shadow-sm">
        {/* Search */}
        <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Global Search (Assets, Shipments, Drivers)..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                />
            </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
            {/* Enterprise Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                <span className="text-[10px] font-bold uppercase tracking-wider">Enterprise Plan</span>
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