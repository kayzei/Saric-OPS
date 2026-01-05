import React, { useState, useEffect } from 'react';
import { Asset, AssetStatus, Profile } from '../types';
import { dbService } from '../services/dbService';
import { generateFleetReport } from '../services/geminiService';
import { Brain, Activity, Zap, Server, Shield, Package, DollarSign, Leaf, AlertTriangle, Truck, Terminal, WifiOff, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardProps {
  assets: Asset[];
  userRole: string;
  profile?: Profile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ assets, userRole, profile }) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  
  const isDriverOnDuty = profile?.role === 'DRIVER' && profile?.onDuty;
  const isNoSim = profile?.noSim;

  const stats = [
    { label: 'NET REVENUE', val: 'ZMW 1.4M', icon: DollarSign, color: 'text-blue-500' },
    { label: 'FLEET UPTIME', val: '99.4%', icon: Activity, color: 'text-green-500' },
    { label: 'CRITICAL FAULTS', val: assets.filter(a => a.status === AssetStatus.BREAKDOWN).length, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'CO2 OFFSET', val: '2.4T', icon: Leaf, color: 'text-blue-400' }
  ];

  const handleGenerateBriefing = async () => {
    setLoadingAi(true);
    try {
      const report = await generateFleetReport(assets);
      setAiReport(report);
      toast.success("Strategic Intelligence Hydrated");
    } catch (e) {
      toast.error("Vanguard Intelligence Link Failure");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="p-12 bg-slate-950 min-h-full space-y-12">
      {/* Strategic Header */}
      <header className="flex justify-between items-end border-b border-slate-900 pb-12">
        <div>
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
            COMMAND <span className="text-blue-600">DECK</span>
          </h1>
          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-600/20 rounded-2xl text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">
                {userRole === 'admin' ? 'Strategic Authorization' : 'Field Operative Link'}
             </div>
             <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Vanguard Core Stable
             </div>
          </div>
        </div>
        
        {isDriverOnDuty && (
          <div className={`bg-red-600/10 border border-red-600/20 px-8 py-6 rounded-[3rem] ${isNoSim ? 'animate-pulse' : ''}`}>
             <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-1">
                {isNoSim ? '⚠️ SIM DISCONNECTED - RADIO ONLY' : 'RADIO ENFORCEMENT ACTIVE'}
             </p>
             <p className="text-sm font-bold text-white uppercase tracking-tight">
                {isNoSim ? 'Critical: Zero Signal Mode' : 'Messaging Terminal: Disabled'}
             </p>
          </div>
        )}
      </header>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-10 rounded-[4rem] shadow-2xl group hover:border-blue-600/50 transition-all">
             <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{stat.label}</p>
                <stat.icon size={24} className={stat.color} />
             </div>
             <h3 className="text-5xl font-black text-white tracking-tighter">{stat.val}</h3>
          </div>
        ))}
      </div>

      {/* Main Command Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* AI Briefing Widget */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-[4rem] p-12 relative overflow-hidden shadow-2xl group transition-all hover:border-indigo-500">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Brain size={180} />
            </div>
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4">
                  <Sparkles className="text-indigo-500" /> Vanguard Intelligence
               </h3>
               <button 
                onClick={handleGenerateBriefing}
                disabled={loadingAi}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
               >
                 {loadingAi ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                 {loadingAi ? 'Synthesizing...' : 'Request Briefing'}
               </button>
            </div>
            
            <div className="min-h-[100px] flex items-center justify-center">
              {aiReport ? (
                <div className="bg-slate-950/50 border border-indigo-500/20 p-8 rounded-[2.5rem] w-full animate-in fade-in duration-700">
                   <p className="text-indigo-200 text-sm leading-relaxed italic font-medium">"{aiReport}"</p>
                </div>
              ) : (
                <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.2em]">Awaiting high-clearance strategic analysis...</p>
              )}
            </div>
          </div>

          {/* Operational Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-[4rem] p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none"><Terminal size={200} /></div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-10 flex items-center gap-4">
                <Zap className="text-blue-600" /> Operational Matrix
            </h3>
            
            <div className="space-y-8">
                {assets.slice(0, 4).map(asset => (
                  <div key={asset.id} className="flex items-center justify-between p-6 bg-slate-950/50 border border-slate-800 rounded-2.5rem group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${asset.status === 'MOVING' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                          {asset.id.split('-')[1]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase">{asset.name}</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{asset.locationName || 'AWAITING TELEMETRY'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-blue-500">{asset.speed} <span className="text-[9px] opacity-50">KM/H</span></p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{asset.status}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-blue-600 rounded-[4rem] p-12 text-white shadow-2xl shadow-blue-600/20">
              <h3 className="text-xl font-black uppercase tracking-widest mb-6">STRATEGIC SYNC</h3>
              <p className="text-sm font-bold text-blue-100 leading-relaxed mb-8 italic opacity-80">
                 {isNoSim ? '"Operative link SRC-104 currently strictly Radio. Automated reroute disabled."' : '"Optimization of route corridor CH-04 recommended to offset 15% fuel latency."'}
              </p>
              <button className={`w-full ${isNoSim ? 'bg-slate-950/50 cursor-not-allowed opacity-50' : 'bg-white hover:bg-slate-50'} text-blue-600 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all`}>
                 {isNoSim ? 'Sync Locked: No Signal' : 'Authorize Re-route'}
              </button>
           </div>

           <div className="bg-slate-900 border border-slate-800 rounded-[4rem] p-12 shadow-2xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">NODE SECURITY</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <Shield className="text-green-500" size={18} />
                    <p className="text-xs font-bold text-white uppercase">Encrypted Handshake: OK</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <Server className="text-blue-500" size={18} />
                    <p className="text-xs font-bold text-white uppercase">Identity Cluster: Online</p>
                 </div>
                 {isNoSim && (
                   <div className="flex items-center gap-4 bg-red-600/10 p-3 rounded-2xl border border-red-600/20">
                      <WifiOff className="text-red-500" size={18} />
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Cellular Link Lost</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;