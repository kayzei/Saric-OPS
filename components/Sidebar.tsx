
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Truck, Package, FileText, Users, Wrench, Folder, Shield, ShieldAlert, Archive, MessageSquarePlus, Radio, WifiOff, Lock } from 'lucide-react';
import { Profile } from '../types';

interface SidebarProps {
  profile?: Profile | null;
  onOpenFeedback?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ profile, onOpenFeedback }) => {
  const userRole = profile?.role || 'user';
  const isOnDuty = profile?.onDuty || false;
  const isNoSim = profile?.noSim || false;

  const navClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
      isActive
        ? 'bg-slate-800 text-saric-500 border-saric-500'
        : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  // If on duty, restrict navigation to tactical essentials
  const restrictedLinks = (
    <>
      <div className="px-6 mb-2 mt-2 text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
        <Radio size={12} className="animate-pulse" /> Mission Tactical Hud
      </div>
      <NavLink to="/" className={navClasses}>
        <LayoutDashboard size={18} />
        <span>Operations Desk</span>
      </NavLink>
      <NavLink to="/live-tracking" className={navClasses}>
        <Map size={18} />
        <span>Tactical Map</span>
      </NavLink>
      <NavLink to="/assets" className={navClasses}>
        <Truck size={18} />
        <span>Unit Health</span>
      </NavLink>
      <NavLink to="/maintenance" className={navClasses}>
        <Wrench size={18} />
        <span>Technical Log</span>
      </NavLink>
      
      <div className="mt-auto px-6 py-8">
         <div className={`p-4 rounded-2xl border ${isNoSim ? 'bg-amber-600/10 border-amber-600/30' : 'bg-red-600/10 border-red-600/30'} flex flex-col items-center text-center gap-2`}>
            {isNoSim ? <WifiOff className="text-amber-500" size={24} /> : <Lock className="text-red-500" size={24} />}
            <p className={`text-[9px] font-black uppercase tracking-widest ${isNoSim ? 'text-amber-400' : 'text-red-400'}`}>
               {isNoSim ? 'SIM DEACTIVATED' : 'DUTY LOCK ACTIVE'}
            </p>
            <p className="text-[8px] text-slate-500 uppercase font-bold leading-tight">All standard comms blocked. Use Radio Protocol only.</p>
         </div>
      </div>
    </>
  );

  const standardLinks = (
    <>
      <div className="px-6 mb-2 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {userRole === 'admin' ? 'Operations Center' : 'My Workstation'}
      </div>
      <NavLink to="/" className={navClasses}>
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/live-tracking" className={navClasses}>
        <Map size={18} />
        <span>Live Map</span>
      </NavLink>
      <NavLink to="/assets" className={navClasses}>
        <Truck size={18} />
        <span>Fleet Assets</span>
      </NavLink>
      <NavLink to="/maintenance" className={navClasses}>
        <Wrench size={18} />
        <span>Maintenance</span>
      </NavLink>
      <NavLink to="/inventory" className={navClasses}>
        <Archive size={18} />
        <span>Inventory Hub</span>
      </NavLink>

      {userRole === 'admin' && (
          <>
              <div className="px-6 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security & Risk</div>
              <NavLink to="/admin/security" className={navClasses}>
                  <ShieldAlert size={18} className="text-indigo-400" />
                  <span className="text-indigo-400 font-bold">Secure SOC</span>
              </NavLink>

              <div className="px-6 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Business Units</div>
              <NavLink to="/shipments" className={navClasses}>
              <Package size={18} />
              <span>Logistics & Cargo</span>
              </NavLink>
              <NavLink to="/projects" className={navClasses}>
                  <Shield size={18} />
                  <span>Subsidiaries</span>
              </NavLink>
              
              <div className="px-6 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Administration</div>
              <NavLink to="/admin/operatives" className={navClasses}>
                  <Users size={18} />
                  <span>Operatives & Access</span>
              </NavLink>
              <NavLink to="/invoicing" className={navClasses}>
                  <FileText size={18} />
                  <span>Smart Invoicing</span>
              </NavLink>
              <NavLink to="/drivers" className={navClasses}>
                  <Users size={18} />
                  <span>Drivers & HR</span>
              </NavLink>
          </>
      )}
      
      <NavLink to="/documents" className={navClasses}>
          <Folder size={18} />
          <span>Digital Docs</span>
      </NavLink>

      <div className="px-6 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Communication</div>
      <button 
        onClick={onOpenFeedback}
        className="w-full flex items-center space-x-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 border-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
      >
        <MessageSquarePlus size={18} className="text-kvi-gold" />
        <span>Send Feedback</span>
      </button>
    </>
  );

  return (
    <div className={`w-64 bg-slate-900 h-screen flex flex-col border-r shadow-2xl shrink-0 z-40 fixed left-0 top-0 transition-all duration-500 ${isNoSim ? 'border-amber-600/40 shadow-amber-600/10' : 'border-slate-800'}`}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-lg ${isNoSim ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20' : 'bg-gradient-to-br from-saric-500 to-saric-600 shadow-saric-500/20'}`}>S</div>
          <div>
            <h2 className="text-white font-bold tracking-wider text-sm">SARIC OPS</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{isOnDuty ? 'Tactical Mode' : (userRole === 'admin' ? 'Enterprise' : 'Staff Portal')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-hide flex flex-col">
         {isOnDuty ? restrictedLinks : standardLinks}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="text-center">
            <div className={`inline-block px-2 py-1 rounded border ${isNoSim ? 'border-amber-500/30 bg-amber-500/5' : 'border-kvi-gold/30 bg-kvi-gold/5'}`}>
                <p className={`text-[10px] font-medium tracking-wider ${isNoSim ? 'text-amber-500' : 'text-kvi-gold'}`}>
                  {isNoSim ? 'NO SIM MODE' : 'SECURED BY KVI'}
                </p>
            </div>
            <p className="text-[10px] text-slate-600 mt-2">v2.5.0 STABLE</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
