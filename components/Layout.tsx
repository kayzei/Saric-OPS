
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FeedbackModal from './FeedbackModal';

interface LayoutProps {
  onLogout: () => void;
  userRole: 'admin' | 'user';
}

const Layout: React.FC<LayoutProps> = ({ onLogout, userRole }) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar userRole={userRole} onOpenFeedback={() => setIsFeedbackOpen(true)} />
      
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300 relative">
        <Header onLogout={onLogout} />
        
        <main className="flex-1 overflow-y-auto pt-16 relative">
           <Outlet />
        </main>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
};

export default Layout;
