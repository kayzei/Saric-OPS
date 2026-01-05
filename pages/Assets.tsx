import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Asset, AssetStatus, AssetCategory, Profile, MaintenanceRecord } from '../types';
import { Truck, AlertCircle, CheckCircle, Clock, Pencil, X, Save, Bus, Construction, Wrench, Car, BarChart2, Fuel, Gauge, Search, MapPin, ClipboardCheck, Thermometer, Battery, WifiOff, Wifi, RefreshCw, History, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
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

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const records = await dbService.getMaintenanceRecords();
        setMaintenanceRecords(records);
      } catch (e) {
        console.warn("Failed to fetch maintenance history for asset details.");
      }
    };
    fetchMaintenance();
  }, []);

  const toggleNoSim = async () => {
    if (!profile) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = !profile.noSim;
      await dbService.updateProfile({ id: profile.id, noSim: newStatus });
      toast.success(newStatus ? "Signal Loss Reported: Switching to Radio" : "Signal Restored: Cellular Active");
      window.location.reload();
    } catch (e) {
      toast.error("Handshake Link Failure");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (userRole === 'user' || userRole === 'DRIVER') {
      const myAsset = assets.find(a => a.id === 'SRC-104') || assets[0];
      return (
        <div className="p-6 bg-slate-50/50 min-h-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Truck size={24} className="text-indigo-600" />
                  My Vehicle Inspector
              </h1>
              
              <button 
                onClick={toggleNoSim}
                disabled={isUpdatingStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  profile?.noSim 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isUpdatingStatus ? <RefreshCw className="animate-spin" size={14} /> : profile?.noSim ? <WifiOff size={14} /> : <Wifi size={14} />}
                {profile?.noSim ? 'Signal: Lost' : 'Signal: Active'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unit ID</span>
                            <h2 className="text-3xl font-bold text-slate-800">{myAsset.id}</h2>
                            <p className="text-slate-500">{myAsset.name}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${myAsset.status === AssetStatus.MOVING ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                            {myAsset.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Gauge size={16} /> <span className="text-xs font-bold uppercase">Odometer</span>
                            </div>
                            <p className="text-xl font-mono font-bold text-slate-800">142,005 km</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                             <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Wrench size={16} /> <span className="text-xs font-bold uppercase">Next Service</span>
                            </div>
                            <p className="text-xl font-mono font-bold text-indigo-600">1,500 km</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ClipboardCheck size={18} /> Pre-Trip Checklist</h3>
                        <div className="space-y-3">
                            {['Tires & Wheels Checked', 'Fluid Levels (Oil, Coolant)', 'Lights & Signals', 'Brakes & Air Pressure'].map((item, idx) => (
                                <label key={idx} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <span className="text-sm font-medium text-slate-700">{item}</span>
                                </label>
                            ))}
                        </div>
                        <button className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                            Submit Inspection Log
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Vehicle Documents</h3>
                    <div className="space-y-2 mb-8">
                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded"><Truck size={16} /></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Fitness Certificate</p>
                                    <p className="text-xs text-green-600">Valid until Dec 2024</p>
                                </div>
                            </div>
                            <button className="text-xs text-indigo-600 font-bold hover:underline">View</button>
                         </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 mb-4">Recent Service History</h3>
                    <div className="space-y-4">
                        {maintenanceRecords.filter(r => r.assetId === myAsset.id).slice(0, 3).map(rec => (
                             <div key={rec.id} className="flex gap-4 relative">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                    <div className="w-0.5 h-full bg-slate-100 my-1"></div>
                                </div>
                                <div className="pb-4">
                                    <p className="text-xs text-slate-400">{rec.date}</p>
                                    <p className="font-bold text-sm text-slate-800">{rec.type}</p>
                                    <p className="text-xs text-slate-500">{rec.mechanic}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  useEffect(() => {
    if (targetAssetId && rowRefs.current[targetAssetId]) {
      rowRefs.current[targetAssetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [targetAssetId]);

  const filteredAssets = assets.filter(a => {
      const matchesCategory = activeTab === 'All' || a.category === activeTab;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
          (a.locationName?.toLowerCase().includes(searchLower)) ||
          (a.location.lat.toString().includes(searchLower)) ||
          (a.location.lng.toString().includes(searchLower)) ||
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
      case AssetStatus.IDLE:
        return (
            <div className={`${baseClasses} bg-amber-50 text-amber-700 border-amber-200`}>
                 <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                 Idle
            </div>
        );
      case AssetStatus.BREAKDOWN:
        return (
            <div className={`${baseClasses} bg-red-50 text-red-700 border-red-200 animate-pulse ring-1 ring-red-200`}>
                 <AlertCircle size={12} className="text-red-600" />
                 Breakdown
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      onUpdateAsset(editingAsset);
      setEditingAsset(null);
    }
  };

  const tabs: (AssetCategory | 'All')[] = ['All', 'Heavy Transport', 'Shuttle', 'Construction', 'Support'];

  return (
    <div className="p-8 bg-slate-50/50 min-h-full">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Fleet Management</h1>
      <p className="text-sm text-slate-500 mb-6">Real-time telemetry and asset configuration.</p>
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="flex space-x-1 overflow-x-auto bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full lg:w-auto">
            {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
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
                placeholder="Filter by City, Coordinates, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-full bg-white shadow-sm transition-all hover:border-indigo-200 placeholder:text-slate-400"
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
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Fuel</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Details</th>
                <th className="px-6 py-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset) => (
                <tr 
                  key={asset.id} 
                  ref={(el) => { rowRefs.current[asset.id] = el; }}
                  className={`transition-colors duration-500 ${asset.id === targetAssetId ? 'bg-indigo-50 ring-2 ring-indigo-500 shadow-inner relative z-10' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-6 py-4 font-mono font-medium text-indigo-600">{asset.id}</td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          {getCategoryIcon(asset.category)}
                          <span className="text-xs">{asset.category}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{asset.name}</td>
                  <td className="px-6 py-4">{asset.driver}</td>
                  <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                  <td className="px-6 py-4">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[80px] mb-1">
                          <div className={`h-1.5 rounded-full ${asset.fuelLevel < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${asset.fuelLevel}%` }}></div>
                      </div>
                      <span className="text-xs font-mono">{Math.round(asset.fuelLevel)}%</span>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs mb-0.5 flex items-center gap-1"><MapPin size={10} className="text-slate-400" /> {asset.locationName || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{asset.location.lat.toFixed(4)}, {asset.location.lng.toFixed(4)}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                       <button onClick={() => setViewingAssetDetails(asset)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors flex items-center gap-1 ml-auto text-xs font-medium">
                          <BarChart2 size={16} /> Details
                      </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <button onClick={() => setEditingAsset(asset)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><Pencil size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingAssetDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded border border-slate-200 text-indigo-600">{getCategoryIcon(viewingAssetDetails.category)}</div>
                        <div>
                             <h3 className="font-bold text-slate-800 text-lg">{viewingAssetDetails.name} Asset Intelligence</h3>
                             <p className="text-xs text-slate-500 font-mono">{viewingAssetDetails.id} • {viewingAssetDetails.driver}</p>
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
                         <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-64">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-indigo-600" /> Telemetry History</h4>
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
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><History size={16} className="text-amber-500" /> Maintenance History</h4>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{maintenanceRecords.filter(r => r.assetId === viewingAssetDetails.id).length} Records Found</span>
                                </div>
                                <div className="space-y-4">
                                    {maintenanceRecords.filter(r => r.assetId === viewingAssetDetails.id).length > 0 ? (
                                        maintenanceRecords.filter(r => r.assetId === viewingAssetDetails.id).map((record) => (
                                            <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-500">
                                                        <Wrench size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{record.type}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-slate-400 font-mono">{record.date}</span>
                                                            <span className="text-[10px] text-slate-300">•</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">{record.mechanic}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-800 flex items-center justify-end gap-1"><DollarSign size={10} className="text-slate-400" />{record.cost.toLocaleString()}</p>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        record.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>{record.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-slate-400 italic text-xs">
                                            No maintenance records archived for this unit.
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>

                         <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            <h4 className="text-sm font-bold text-slate-700 border-b border-slate-50 pb-4">Fleet Assignment Brief</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-slate-500 font-medium">Mission Operator</span>
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{viewingAssetDetails.driver}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-slate-500 font-medium">Operational Hub</span>
                                    <span className="text-xs font-bold text-slate-800">{viewingAssetDetails.locationName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-slate-500 font-medium">Last Inspection</span>
                                    <span className="text-xs font-bold text-indigo-600">10 APR 2024</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-slate-500 font-medium">Next Service Window</span>
                                    <span className="text-xs font-bold text-amber-600">IN 1,500 KM</span>
                                </div>
                            </div>
                            <div className="pt-6">
                                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
                                    Request Tech Intervention
                                </button>
                            </div>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
      )}

      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Edit Asset Configuration</h3>
                <button onClick={() => setEditingAsset(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset Name</label>
                    <input type="text" value={editingAsset.name} onChange={(e) => setEditingAsset({...editingAsset, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver</label>
                    <input type="text" value={editingAsset.driver} onChange={(e) => setEditingAsset({...editingAsset, driver: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingAsset(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2"><Save size={16} /> Save Changes</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;