import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        <Header onLogout={onLogout} />
        
        <main className="flex-1 overflow-y-auto pt-16 relative">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;