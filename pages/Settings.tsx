
import React, { useState } from 'react';
import { User, Bell, Lock, Globe, Save, Building2, Clock, ShieldCheck, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Profile } from '../types';

interface SettingsProps {
  profile: Profile | null;
}

const Settings: React.FC<SettingsProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [dept, setDept] = useState(profile?.department || 'Operations');

  const handleSave = () => {
    toast.success("Identity profile synchronized successfully");
  };

  const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return 'No recorded handshake';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full relative">
       <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <Globe className="text-indigo-600" size={24} />
          System Configuration
       </h1>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex min-h-[600px]">
           {/* Settings Sidebar */}
           <div className="w-64 border-r border-slate-100 bg-slate-50 p-4">
               <nav className="space-y-1">
                   {[
                     { id: 'profile', icon: User, label: 'Profile & Account' },
                     { id: 'notifications', icon: Bell, label: 'Notifications' },
                     { id: 'security', icon: Lock, label: 'Security' },
                     { id: 'system', icon: Globe, label: 'System Preferences' }
                   ].map(tab => (
                     <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
                     >
                       <tab.icon size={18} />
                       <span>{tab.label}</span>
                     </button>
                   ))}
               </nav>
           </div>

           {/* Content Area */}
           <div className="flex-1 p-12">
               {activeTab === 'profile' && (
                   <div className="max-w-xl space-y-8 animate-fade-in">
                       <div>
                           <h3 className="text-xl font-bold text-slate-800 mb-1">Operative Profile</h3>
                           <p className="text-sm text-slate-500">Manage your command identity and organizational metadata.</p>
                       </div>
                       
                       <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-6">
                               <div className="col-span-2">
                                   <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Full Legal Name</label>
                                   <div className="relative">
                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input 
                                        type="text" 
                                        defaultValue={profile?.fullName} 
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700" 
                                      />
                                   </div>
                               </div>

                               <div className="col-span-2">
                                   <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Enterprise Email</label>
                                   <input 
                                     type="email" 
                                     defaultValue={profile?.email} 
                                     disabled 
                                     className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed font-mono text-sm" 
                                   />
                               </div>

                               <div>
                                   <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Department</label>
                                   <div className="relative">
                                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input 
                                        type="text" 
                                        value={dept}
                                        onChange={(e) => setDept(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700" 
                                      />
                                   </div>
                               </div>

                               <div>
                                   <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Clearance Level</label>
                                   <div className="relative">
                                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                      <input 
                                        type="text" 
                                        defaultValue={profile?.role?.toUpperCase()} 
                                        disabled 
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs tracking-widest" 
                                      />
                                   </div>
                               </div>

                               <div className="col-span-2">
                                   <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Last Active Handshake</label>
                                   <div className="relative">
                                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input 
                                        type="text" 
                                        value={formatLastActive(profile?.lastActive)} 
                                        disabled 
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-mono text-xs" 
                                      />
                                   </div>
                               </div>
                           </div>
                       </div>

                       <div className="pt-6 border-t border-slate-100 flex justify-end">
                           <button 
                                onClick={handleSave}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
                           >
                               <Save size={18} />
                               Sync Profile Changes
                           </button>
                       </div>
                   </div>
               )}

               {activeTab !== 'profile' && (
                 <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                    <Settings2 size={48} className="mb-4 opacity-10" />
                    <p className="text-sm font-medium uppercase tracking-widest">Section under maintenance</p>
                 </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default Settings;
