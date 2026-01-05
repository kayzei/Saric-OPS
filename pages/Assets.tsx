import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Asset, AssetStatus, AssetCategory, Profile, MaintenanceRecord } from '../types';
import { Truck, AlertCircle, CheckCircle, Clock, Pencil, X, Save, Bus, Construction, Wrench, Car, BarChart2, Fuel, Gauge, Search, MapPin, ClipboardCheck, History, DollarSign, WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';

interface AssetsProps {
  assets: Asset[];
  onUpdateAsset: (asset: Asset) => void;
  userRole?: string;
  profile?: Profile | null;
}

const Assets: React.FC<AssetsProps> = ({ assets, onUpdateAsset, userRole = 'user', profile }) => {
  const location = useLocation();
  const targetAssetId = location.state?.targetAssetId;
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAssetDetails, setViewingAssetDetails] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<AssetCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // Highlight and scroll to target asset if passed from navigation state
  useEffect(() => {
    if (targetAssetId && rowRefs.current[targetAssetId]) {
      rowRefs.current[targetAssetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.success(`Focusing on Unit ${targetAssetId}`, { icon: '🎯' });
    }
  }, [targetAssetId]);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const records = await dbService.getMaintenanceRecords();
        setMaintenanceRecords(records);
      } catch (e) {
        console.warn("Failed to fetch maintenance history.");
      }
    };
    fetchMaintenance();
  }, []);

  const toggleNoSim = async () => {
    if (!profile) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = !profile.noSim;
      await dbService.updateProfile({ ...profile, noSim: newStatus });
      toast.success(newStatus ? "Signal Loss Reported" : "Signal Restored");
      window.location.reload();
    } catch (e) {
      toast.error("Handshake Link Failure");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredAssets = assets.filter(a => {
      const matchesCategory = activeTab === 'All' || a.category === activeTab;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
          (a.locationName?.toLowerCase().includes(searchLower)) ||
          (a.id.toLowerCase().includes(searchLower)) ||
          (a.name.toLowerCase().includes(searchLower));
      return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: AssetStatus) => {
    const baseClasses = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 w-fit border shadow-sm transition-all";
    switch (status) {
      case AssetStatus.MOVING:
        return (
          <div className={`${baseClasses} bg-green-50 text-green-700 border-green-200`}>
             <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Moving
          </div>
        );
      case AssetStatus.BREAKDOWN:
        return (
            <div className={`${baseClasses} bg-red-50 text-red-700 border-red-200 animate-pulse ring-1 ring-red-200`}>
                 <AlertCircle size={12} className="text-red-600" />
                 Breakdown
            </div>
        );
      case AssetStatus.IDLE:
        return (
          <div className={`${baseClasses} bg-amber-50 text-amber-700 border-amber-200`}>
            <Clock size={12} /> Idle
          </div>
        );
      default:
        return <div className={`${baseClasses} bg-slate-50 text-slate-500 border-slate-200`}>{status}</div>;
    }
  };

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
        case 'Heavy Transport': return <Truck size={16} className="text-slate-500" />;
        case 'Shuttle': return <Bus size={16} className="text-indigo-500" />;
        case 'Construction': return <Construction size={16} className="text-orange-500" />;
        default: return <Car size={16} className="text-slate-500" />;
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      await onUpdateAsset(editingAsset);
      setEditingAsset(null);
    }
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fleet Management</h1>
          <p className="text-sm text-slate-500">Real-time status and operational controls.</p>
        </div>
        {profile?.role === 'DRIVER' && (
          <button 
            onClick={toggleNoSim}
            disabled={isUpdatingStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              profile?.noSim 
              ? 'bg-red-600 text-white shadow-lg' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isUpdatingStatus ? <RefreshCw className="animate-spin" size={14} /> : profile?.noSim ? <WifiOff size={14} /> : <Wifi size={14} />}
            {profile?.noSim ? 'Signal: Lost' : 'Signal: Active'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="flex space-x-1 overflow-x-auto bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full lg:w-auto">
            {['All', 'Heavy Transport', 'Shuttle', 'Construction', 'Support'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                      activeTab === tab 
                      ? 'bg-slate-900 text-white shadow' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <div className="relative w-full lg:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
                type="text"
                placeholder="Filter by ID, City, Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-full bg-white shadow-sm transition-all"
            />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Asset ID</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Fuel</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset) => (
                <tr 
                  key={asset.id} 
                  ref={(el) => { rowRefs.current[asset.id] = el; }}
                  className={`transition-colors ${asset.id === targetAssetId ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-6 py-4 font-mono font-medium text-indigo-600">{asset.id}</td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          {getCategoryIcon(asset.category)}
                          <span className="text-xs">{asset.category}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{asset.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">{asset.driver}</div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                  <td className="px-6 py-4">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[60px] mb-1">
                          <div className={`h-1.5 rounded-full ${asset.fuelLevel < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${asset.fuelLevel}%` }}></div>
                      </div>
                      <span className="text-[10px] font-mono">{Math.round(asset.fuelLevel)}%</span>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs mb-0.5 flex items-center gap-1"><MapPin size={10} className="text-slate-400" /> {asset.locationName || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{asset.location.lat.toFixed(4)}, {asset.location.lng.toFixed(4)}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setViewingAssetDetails(asset)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><BarChart2 size={18} /></button>
                        {userRole === 'admin' && (
                          <button onClick={() => setEditingAsset(asset)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Pencil size={18} /></button>
                        )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Details Modal */}
      {viewingAssetDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded border border-slate-200 text-indigo-600">{getCategoryIcon(viewingAssetDetails.category)}</div>
                        <div>
                             <h3 className="font-bold text-slate-800 text-lg">{viewingAssetDetails.name} Intelligence Briefing</h3>
                             <p className="text-xs text-slate-500 font-mono">{viewingAssetDetails.id} • Driver: {viewingAssetDetails.driver}</p>
                        </div>
                    </div>
                    <button onClick={() => setViewingAssetDetails(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                 </div>
                 
                 <div className="p-8 overflow-y-auto bg-slate-50/30 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                             <p className="text-xs text-slate-400 uppercase font-bold mb-2 flex items-center gap-2"><Gauge size={14} /> Performance</p>
                             <h3 className="text-3xl font-bold text-slate-800">{Math.round(viewingAssetDetails.speed)} <span className="text-sm font-normal text-slate-400">km/h</span></h3>
                         </div>
                          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                             <p className="text-xs text-slate-400 uppercase font-bold mb-2 flex items-center gap-2"><Fuel size={14} /> Energy Level</p>
                             <h3 className="text-3xl font-bold text-slate-800">{Math.round(viewingAssetDetails.fuelLevel)} <span className="text-sm font-normal text-slate-400">%</span></h3>
                         </div>
                         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                             <p className="text-xs text-slate-400 uppercase font-bold mb-2 flex items-center gap-2"><Wrench size={14} /> Health Index</p>
                             <h3 className="text-3xl font-bold text-green-600">A+</h3>
                         </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <div className="space-y-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-64">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-indigo-600" /> Speed Telemetry</h4>
                                <ResponsiveContainer width="100%" height="80%">
                                    <AreaChart data={viewingAssetDetails.telemetryHistory || []}>
                                        <defs>
                                            <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="speed" stroke="#6366f1" fillOpacity={1} fill="url(#colorSpeed)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><History size={16} className="text-indigo-600" /> Maintenance History</h4>
                                <div className="space-y-4">
                                  {maintenanceRecords.filter(r => r.assetId === viewingAssetDetails.id).length > 0 ? (
                                    maintenanceRecords.filter(r => r.assetId === viewingAssetDetails.id).map(record => (
                                      <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-white rounded border border-slate-200">
                                            <Wrench size={14} className="text-slate-400" />
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-slate-800">{record.type}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{record.date}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs font-bold text-slate-700">{new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(record.cost)}</p>
                                          <span className={`text-[9px] font-bold uppercase ${record.status === 'Completed' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {record.status}
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-center text-slate-400 text-xs py-4">No maintenance history recorded for this unit.</p>
                                  )}
                                </div>
                            </div>
                         </div>

                         <div className="space-y-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><ClipboardCheck size={16} className="text-indigo-600" /> Operational Context</h4>
                                <div className="space-y-4">
                                  <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Last Service Date</span>
                                    <span className="text-xs font-bold text-slate-700">{viewingAssetDetails.lastServiceDate || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Service Threshold</span>
                                    <span className="text-xs font-bold text-slate-700">{viewingAssetDetails.nextServiceMileage} km remaining</span>
                                  </div>
                                  <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">MTD Revenue</span>
                                    <span className="text-xs font-bold text-indigo-600">{new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(viewingAssetDetails.revenueMonthToDate || 0)}</span>
                                  </div>
                                  <div className="flex justify-between py-2">
                                    <span className="text-xs text-slate-500">MTD Costs</span>
                                    <span className="text-xs font-bold text-red-500">{new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(viewingAssetDetails.costMonthToDate || 0)}</span>
                                  </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
                               <h4 className="text-sm font-bold text-white mb-4">Command Action</h4>
                               <div className="grid grid-cols-2 gap-3">
                                  <button className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 border border-white/10">
                                    <WifiOff size={16} /> Signal Halt
                                  </button>
                                  <button className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 border border-indigo-500">
                                    <RefreshCw size={16} /> Sync Logs
                                  </button>
                               </div>
                            </div>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Edit Asset Node</h3>
                <button onClick={() => setEditingAsset(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Asset Reference</label>
                    <input type="text" value={editingAsset.name} onChange={(e) => setEditingAsset({...editingAsset, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Assigned Operative</label>
                    <input type="text" value={editingAsset.driver} onChange={(e) => setEditingAsset({...editingAsset, driver: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingAsset(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20"><Save size={18} /> Deploy Changes</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;