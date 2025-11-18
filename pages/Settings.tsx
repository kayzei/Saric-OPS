import React, { useState } from 'react';
import { User, Bell, Lock, Globe, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full relative">
       <h1 className="text-2xl font-bold text-slate-800 mb-6">System Configuration</h1>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex min-h-[600px]">
           {/* Settings Sidebar */}
           <div className="w-64 border-r border-slate-100 bg-slate-50 p-4">
               <nav className="space-y-1">
                   <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
                   >
                       <User size={18} />
                       <span>Profile & Account</span>
                   </button>
                   <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'notifications' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
                   >
                       <Bell size={18} />
                       <span>Notifications</span>
                   </button>
                   <button 
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'security' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
                   >
                       <Lock size={18} />
                       <span>Security</span>
                   </button>
                   <button 
                        onClick={() => setActiveTab('system')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'system' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
                   >
                       <Globe size={18} />
                       <span>System Preferences</span>
                   </button>
               </nav>
           </div>

           {/* Content Area */}
           <div className="flex-1 p-8">
               {activeTab === 'profile' && (
                   <div className="max-w-lg space-y-6 animate-fade-in">
                       <div>
                           <h3 className="text-lg font-bold text-slate-800 mb-1">Profile Information</h3>
                           <p className="text-sm text-slate-500">Update your account details and public profile.</p>
                       </div>
                       <div className="space-y-4">
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                               <input type="text" defaultValue="Admin User" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                               <input type="email" defaultValue="admin@sariclogistics.co.zm" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                               <input type="text" defaultValue="System Administrator" disabled className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
                           </div>
                       </div>
                   </div>
               )}

                {activeTab === 'notifications' && (
                   <div className="max-w-lg space-y-6 animate-fade-in">
                       <div>
                           <h3 className="text-lg font-bold text-slate-800 mb-1">Alert Preferences</h3>
                           <p className="text-sm text-slate-500">Manage how you receive critical alerts.</p>
                       </div>
                       <div className="space-y-4">
                           <div className="flex items-center justify-between py-3 border-b border-slate-50">
                               <div>
                                   <h4 className="text-sm font-medium text-slate-800">Breakdown SMS Alerts</h4>
                                   <p className="text-xs text-slate-500">Receive immediate SMS for asset breakdowns.</p>
                               </div>
                               <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                           </div>
                           <div className="flex items-center justify-between py-3 border-b border-slate-50">
                               <div>
                                   <h4 className="text-sm font-medium text-slate-800">Daily Report Email</h4>
                                   <p className="text-xs text-slate-500">08:00 AM digest of fleet performance.</p>
                               </div>
                               <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                           </div>
                           <div className="flex items-center justify-between py-3 border-b border-slate-50">
                               <div>
                                   <h4 className="text-sm font-medium text-slate-800">Geofence Violations</h4>
                                   <p className="text-xs text-slate-500">Alert when assets leave authorized zones.</p>
                               </div>
                               <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                           </div>
                       </div>
                   </div>
               )}

               <div className="mt-10 pt-6 border-t border-slate-100">
                   <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                   >
                       <Save size={18} />
                       Save Changes
                   </button>
               </div>
           </div>
       </div>
    </div>
  );
};

export default Settings;