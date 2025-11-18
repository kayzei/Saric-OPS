import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, Truck, Package, FileText, Users, Wrench, Folder, Shield, Settings } from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void; // Optional as logout is now in Header mainly
}

const Sidebar: React.FC<SidebarProps> = () => {
  const navClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
      isActive
        ? 'bg-slate-800 text-saric-500 border-saric-500'
        : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col border-r border-slate-800 shadow-2xl shrink-0 z-40 fixed left-0 top-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-saric-500 to-saric-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-saric-500/20">S</div>
          <div>
            <h2 className="text-white font-bold tracking-wider text-sm">SARIC OPS</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Enterprise</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="px-6 mb-2 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operations Center</div>
        <NavLink to="/" className={navClasses}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/live-tracking" className={navClasses}>
          <Map size={18} />
          <span>Live Tracking</span>
        </NavLink>
        <NavLink to="/assets" className={navClasses}>
          <Truck size={18} />
          <span>Fleet Assets</span>
        </NavLink>
        <NavLink to="/maintenance" className={navClasses}>
          <Wrench size={18} />
          <span>Maintenance</span>
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
        <NavLink to="/invoicing" className={navClasses}>
            <FileText size={18} />
            <span>Smart Invoicing</span>
        </NavLink>
        <NavLink to="/documents" className={navClasses}>
            <Folder size={18} />
            <span>Digital Docs</span>
        </NavLink>
        <NavLink to="/drivers" className={navClasses}>
            <Users size={18} />
            <span>Drivers & HR</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="text-center">
            <div className="inline-block px-2 py-1 rounded border border-kvi-gold/30 bg-kvi-gold/5">
                <p className="text-[10px] text-kvi-gold font-medium tracking-wider">POWERED BY KVI</p>
            </div>
            <p className="text-[10px] text-slate-600 mt-2">v2.4.0 Enterprise Build</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;