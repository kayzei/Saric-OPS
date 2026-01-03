import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Asset, AssetStatus, InventoryItem } from '../types';
import { generateFleetReport, generateDriverBriefing } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { Brain, AlertTriangle, Activity, Leaf, DollarSign, Truck, Megaphone, Calendar, Navigation, RefreshCw, Volume2, Play, Zap, Server, Shield, Package, ArrowRight, UserPlus, Users, ShieldCheck, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { LIVE_TICKER_DATA } from '../constants';
import { checkDatabaseHealth, supabase } from '../lib/supabaseClient';

interface DashboardProps {
  assets: Asset[];
  userRole: 'admin' | 'user';
}

const Dashboard: React.FC<DashboardProps> = ({ assets, userRole }) => {
  const navigate = useNavigate();
  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);
  const [tickerMessages, setTickerMessages] = useState<string[]>(LIVE_TICKER_DATA);
  const [isBriefing, setIsBriefing] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const verify = async () => {
      const healthy = await checkDatabaseHealth();
      setDbHealthy(healthy);
      
      if (healthy && dbService) {
        try {
          const announcements = await dbService.getAnnouncements();
          if (announcements.length > 0) {
            setTickerMessages(announcements.map(d => d.title));
          }
          const inv = await dbService.getInventory();
          setInventory(inv);
        } catch (e) {
          console.error("Dashboard init error", e);
        }
      }
    };
    verify();

    if (supabase) {
        const channel = supabase.channel('announcements-feed')
            .on('postgres_changes', { event: 'INSERT', table: 'announcements', schema: 'public' }, (payload) => {
                setTickerMessages(prev => [payload.new.title, ...prev].slice(0, 5));
                toast("New Command Directive Received", { icon: '📢' });
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }
  }, []);

  const handleStartBriefing = async () => {
    const myAsset = assets.find(a => a.id === 'SRC-104') || assets[0];
    setIsBriefing(true);
    toast.loading("Downloading Intelligence Brief...", { id: 'briefing' });
    
    try {
      const audioData = await generateDriverBriefing('Operative', myAsset);
      if (audioData) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        
        const dataInt16 = new Int16Array(audioData.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        toast.success("Voice Briefing Active", { id: 'briefing' });
        source.onended = () => setIsBriefing(false);
      } else {
        throw new Error("No audio generated");
      }
    } catch (e) {
      toast.error("Vanguard Link Failure", { id: 'briefing' });
      setIsBriefing(false);
    }
  };

  const statusData = [
    { name: 'Moving', value: assets.filter(a => a.status === AssetStatus.MOVING).length, color: '#10b981' },
    { name: 'Idle', value: assets.filter(a => a.status === AssetStatus.IDLE).length, color: '#f59e0b' },
    { name: 'Stopped', value: assets.filter(a => a.status === AssetStatus.STOPPED).length, color: '#64748b' },
    { name: 'Breakdown', value: assets.filter(a => a.status === AssetStatus.BREAKDOWN).length, color: '#ef4444' },
  ];

  const lowStockItems = inventory.filter(i => i.quantity <= i.minThreshold);

  const efficiencyData = assets.slice(0, 6).map(a => ({
    name: a.id,
    efficiency: Math.round(70 + Math.random() * 30),
    fuel: a.fuelLevel
  }));

  const totalRevenue = assets.reduce((acc, curr) => acc + (curr.revenueMonthToDate || 0), 0);
  const totalCO2 = assets.reduce((acc, curr) => acc + (curr.co2Emissions || 0), 0);

  const handleGenerateReport = async () => {
    setLoadingAi(true);
    try {
      const report = await generateFleetReport(assets);
      setAiReport(report);
      toast.success("Strategic Insight Loaded");
    } catch (e) {
      toast.error("AI Link Interrupted");
    } finally {
      setLoadingAi(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-ZM', { 
      notation: "compact", 
      compactDisplay: "short", 
      style: 'currency', 
      currency: 'ZMW' 
    }).format(val);

  if (userRole === 'user') {
      const myAsset = assets.find(a => a.id === 'SRC-104') || assets[0];
      return (
        <div className="p-6 bg-slate-950 min-h-full text-slate-300">
            <header className="mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tighter">OPERATIVE <span className="text-indigo-500">PORTAL</span></h1>
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Status: Cluster 01 Authorized</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
                    <Server size={18} className="text-kvi-gold" />
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Environment</p>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Production</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleStartBriefing}
                    disabled={isBriefing}
                    className={`group flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isBriefing ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20'}`}
                  >
                    {isBriefing ? <Volume2 className="animate-pulse" size={18} /> : <Play size={18} />}
                    <span>{isBriefing ? 'Briefing in Progress' : 'Start Vanguard Briefing'}</span>
                  </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Zap size={120} /></div>
                    <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center text-white">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md"><Truck size={24} /></div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight uppercase">Mission Live Stream</h3>
                                <p className="text-xs text-indigo-100 font-mono opacity-80">{myAsset.id} • {myAsset.name}</p>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-white/20 backdrop-blur-md flex items-center gap-2`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                            {myAsset.status}
                        </span>
                    </div>
                    <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Fuel Energy</p>
                            <p className={`text-2xl font-black ${myAsset.fuelLevel < 30 ? 'text-red-500' : 'text-white'}`}>
                                {Math.round(myAsset.fuelLevel)}%
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Velocity</p>
                            <p className="text-2xl font-black text-white">{Math.round(myAsset.speed)} <span className="text-xs text-slate-500 font-normal">KM/H</span></p>
                        </div>
                        <div className="col-span-2">
                             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Geolocation Node</p>
                             <p className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                                <Navigation size={14} />
                                {myAsset.locationName || `${myAsset.location.lat.toFixed(4)}, ${myAsset.location.lng.toFixed(4)}`}
                             </p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl">
                    <h3 className="font-black text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
                        <Calendar size={18} className="text-indigo-500" /> SEQUENCE LOG
                    </h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                <div className="w-px h-full bg-slate-800 my-2"></div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">06:00 Zulu</p>
                                <p className="text-sm font-bold text-white">Departure Seq Authorized</p>
                                <p className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1 uppercase tracking-tighter">Verified</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Phase</p>
                                <p className="text-sm font-bold text-white">Route: Lusaka Corridor</p>
                                <p className="text-[10px] text-indigo-400 mt-1 uppercase font-bold">Estimated Handover: 14:30</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-full flex flex-col gap-8 text-slate-300">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl overflow-hidden flex items-center shadow-2xl">
          <div className="bg-indigo-600 px-6 py-3 flex items-center gap-3 shrink-0 font-black text-xs uppercase tracking-widest">
              <Megaphone size={16} className="animate-pulse" />
              <span>LIVE VANGUARD FEED</span>
          </div>
          <div className="flex-1 overflow-hidden relative h-12">
              <div className="absolute top-0 left-0 whitespace-nowrap animate-[marquee_25s_linear_infinite] flex items-center h-full">
                  {tickerMessages.map((item, index) => (
                      <span key={index} className="mx-10 text-xs font-bold text-slate-400 flex items-center tracking-tight uppercase group">
                          <span className="w-1 h-1 bg-indigo-500 rounded-full mr-3 group-hover:bg-green-500"></span>
                          {item}
                      </span>
                  ))}
              </div>
          </div>
          <div className="bg-slate-950 px-4 py-3 flex items-center gap-2 border-l border-slate-800 text-[9px] font-black uppercase tracking-widest text-indigo-400">
              <Wifi size={12} className="animate-pulse" />
              Connected
          </div>
      </div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-8 gap-4">
        <div>
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
                COMMAND <span className="text-indigo-500">DECK</span>
                <div className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 text-[10px] uppercase font-black tracking-widest">Live Operations</div>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Enterprise fleet telemetry and strategic intelligence suite.</p>
        </div>
        <div className="flex gap-4">
            <div className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3 shadow-xl">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                <Server size={20} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Environment Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Production Hub</p>
                </div>
              </div>
            </div>

            <button 
                onClick={handleGenerateReport}
                disabled={loadingAi}
                className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 font-black text-sm uppercase tracking-widest"
            >
                <Brain size={20} />
                <span>{loadingAi ? 'Calculating...' : 'Execute Intel Protocol'}</span>
            </button>
        </div>
      </header>

      {aiReport && (
        <div className="bg-slate-900 rounded-3xl border border-indigo-500/30 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col md:flex-row shadow-2xl">
            <div className="bg-indigo-600/10 p-6 flex flex-col items-center justify-center text-indigo-400 md:w-40 shrink-0 border-r border-indigo-500/20">
                <Brain size={40} className="mb-3 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-center tracking-[0.2em]">Intel Core</span>
            </div>
            <div className="p-8 flex-1">
                 <h3 className="font-black text-white text-lg mb-3 tracking-tight">VANGUARD STRATEGIC OVERVIEW</h3>
                 <p className="text-slate-400 leading-relaxed text-sm italic">"{aiReport}"</p>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
            { label: 'Net Yield (MTD)', val: formatCurrency(totalRevenue), icon: DollarSign, color: 'indigo' },
            { label: 'CO2 Emission', val: `${totalCO2.toLocaleString()} KG`, icon: Leaf, color: 'green' },
            { label: 'Active Load', val: `${Math.round((assets.filter(a => a.status === AssetStatus.MOVING).length / Math.max(1, assets.length)) * 100)}%`, icon: Activity, color: 'amber' },
            { label: 'Crit Alerts', val: assets.filter(a => a.status === AssetStatus.BREAKDOWN).length, icon: AlertTriangle, color: 'red' }
        ].map((stat, i) => (
            <div key={i} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 group hover:border-indigo-500/50 transition-all shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black text-white mt-2 tracking-tighter">{stat.val}</h3>
                    </div>
                    <div className={`p-4 bg-slate-800 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all`}>
                        <stat.icon size={24} />
                    </div>
                </div>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <h3 className="text-sm font-black text-white mb-8 tracking-widest uppercase flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" /> Operational Efficiency Matrix
            </h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={efficiencyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 800}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 800}} />
                        <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px'}} />
                        <Bar dataKey="efficiency" fill="#6366f1" radius={[10, 10, 0, 0]} name="Efficiency Score" />
                        <Bar dataKey="fuel" fill="#10b981" radius={[10, 10, 0, 0]} name="Fuel Capacity" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col shadow-2xl">
            <h3 className="text-sm font-black text-white mb-6 tracking-widest uppercase flex items-center gap-2">
              <Package size={18} className="text-kvi-gold" /> Quick Command Panel
            </h3>
            <div className="space-y-4">
               <button 
                  onClick={() => navigate('/admin/operatives')}
                  className="w-full flex items-center justify-between p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl group hover:bg-indigo-600 transition-all shadow-lg"
               >
                  <div className="flex items-center gap-4 text-left">
                     <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                        <UserPlus size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-indigo-400 group-hover:text-white uppercase tracking-widest">Provisioning</p>
                        <p className="text-xs font-bold text-white uppercase">Add Operative</p>
                     </div>
                  </div>
                  <ArrowRight size={18} className="text-indigo-400 group-hover:text-white" />
               </button>

               <button 
                  onClick={() => navigate('/invoicing')}
                  className="w-full flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-2xl group hover:border-indigo-500 transition-all"
               >
                  <div className="flex items-center gap-4 text-left">
                     <div className="w-10 h-10 bg-slate-950 text-indigo-500 rounded-xl flex items-center justify-center">
                        <DollarSign size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Finance</p>
                        <p className="text-xs font-bold text-white uppercase">Generate Invoice</p>
                     </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-600 group-hover:text-indigo-400" />
               </button>

               <button 
                  onClick={() => navigate('/admin/security')}
                  className="w-full flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-2xl group hover:border-indigo-500 transition-all"
               >
                  <div className="flex items-center gap-4 text-left">
                     <div className="w-10 h-10 bg-slate-950 text-amber-500 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cyber SOC</p>
                        <p className="text-xs font-bold text-white uppercase">Security Audit</p>
                     </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-600 group-hover:text-amber-400" />
               </button>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-800">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Critical Inventory</h4>
                <div className="space-y-3 overflow-y-auto max-h-[150px] scrollbar-hide pr-2">
                  {lowStockItems.length > 0 ? lowStockItems.map(item => (
                    <div key={item.id} className="p-4 bg-slate-800/50 rounded-2xl border border-red-500/20 flex justify-between items-center group hover:bg-slate-800 transition-colors">
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-red-400">{item.quantity} {item.unit}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-4 opacity-30">
                      <Shield size={24} />
                      <p className="text-[8px] font-black uppercase mt-1">Supplies Optimal</p>
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
