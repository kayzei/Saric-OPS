import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Asset, AssetStatus, AssetCategory } from '../types';
import { Truck, AlertCircle, CheckCircle, Clock, Pencil, X, Save, Bus, Construction, Wrench, Car, BarChart2, Fuel, Gauge, Search, MapPin, ClipboardCheck, Thermometer, Battery } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AssetsProps {
  assets: Asset[];
  onUpdateAsset: (asset: Asset) => void;
  userRole?: 'admin' | 'user';
}

const Assets: React.FC<AssetsProps> = ({ assets, onUpdateAsset, userRole = 'user' }) => {
  const location = useLocation();
  const targetAssetId = location.state?.targetAssetId;
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingTelemetry, setViewingTelemetry] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<AssetCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // --- DRIVER VIEW (USER) ---
  if (userRole === 'user') {
      const myAsset = assets.find(a => a.id === 'SRC-104') || assets[0]; // Simulation binding
      return (
        <div className="p-6 bg-slate-50/50 min-h-full">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Truck size={24} className="text-indigo-600" />
                My Vehicle Inspector
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Representation & Status */}
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
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                             <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Thermometer size={16} /> <span className="text-xs font-bold uppercase">Engine Temp</span>
                            </div>
                            <p className="text-xl font-mono font-bold text-green-600">92°C</p>
                        </div>
                         <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                             <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Battery size={16} /> <span className="text-xs font-bold uppercase">Battery</span>
                            </div>
                            <p className="text-xl font-mono font-bold text-green-600">24.2 V</p>
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

                {/* Docs & History */}
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
                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded"><Truck size={16} /></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Insurance Policy</p>
                                    <p className="text-xs text-green-600">Active</p>
                                </div>
                            </div>
                            <button className="text-xs text-indigo-600 font-bold hover:underline">View</button>
                         </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 mb-4">Recent Service History</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4 relative">
                            <div className="flex flex-col items-center">
                                <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                                <div className="w-0.5 h-full bg-slate-100 my-1"></div>
                            </div>
                            <div className="pb-4">
                                <p className="text-xs text-slate-400">10 Apr 2024</p>
                                <p className="font-bold text-sm text-slate-800">Routine A-Service</p>
                                <p className="text-xs text-slate-500">Ndola Service Center</p>
                            </div>
                        </div>
                        <div className="flex gap-4 relative">
                             <div className="flex flex-col items-center">
                                <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">15 Jan 2024</p>
                                <p className="font-bold text-sm text-slate-800">Tire Replacement (Rear)</p>
                                <p className="text-xs text-slate-500">Lusaka Workshop</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- ADMIN VIEW ---
  useEffect(() => {
    if (targetAssetId && rowRefs.current[targetAssetId]) {
      rowRefs.current[targetAssetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [targetAssetId]);

  const filteredAssets = assets.filter(a => {
      const matchesCategory = activeTab === 'All' || a.category === activeTab;
      
      const searchLower = searchTerm.toLowerCase();
      // Improved search logic: checks location name, lat/lng strings, ID, and Asset Name
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
      case AssetStatus.STOPPED:
        return (
            <div className={`${baseClasses} bg-slate-50 text-slate-500 border-slate-200`}>
                 <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                 Stopped
            </div>
        );
      case AssetStatus.BREAKDOWN:
        return (
            <div className={`${baseClasses} bg-red-50 text-red-700 border-red-200 animate-pulse ring-1 ring-red-200`}>
                 <AlertCircle size={12} className="text-red-600" />
                 Breakdown
            </div>
        );
      case AssetStatus.MAINTENANCE:
         return (
            <div className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200`}>
                 <Wrench size={12} />
                 Maint.
            </div>
        );
      default:
        return <span className="text-slate-500">{status}</span>;
    }
  };

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
        case 'Heavy Transport': return <Truck size={16} className="text-slate-500" />;
        case 'Shuttle': return <Bus size={16} className="text-indigo-500" />;
        case 'Construction': return <Construction size={16} className="text-orange-500" />;
        case 'Support': return <Wrench size={16} className="text-slate-500" />;
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
      
      {/* Controls: Tabs & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        {/* Tabs */}
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

        {/* Search Bar */}
        <div className="relative w-full lg:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
                type="text"
                placeholder="Filter by City, Coordinates, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-full bg-white shadow-sm transition-all hover:border-indigo-200 placeholder:text-slate-400"
            />
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    <X size={14} />
                </button>
            )}
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
                <th className="px-6 py-4">Speed</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Analytics</th>
                <th className="px-6 py-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length > 0 ? filteredAssets.map((asset) => {
                const isHighlighted = asset.id === targetAssetId;
                return (
                  <tr 
                    key={asset.id} 
                    ref={(el) => { rowRefs.current[asset.id] = el; }}
                    className={`transition-colors duration-500 ${
                        isHighlighted 
                        ? 'bg-indigo-50 ring-2 ring-indigo-500 shadow-inner relative z-10' 
                        : 'hover:bg-slate-50'
                    }`}
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
                    <td className="px-6 py-4">
                        {getStatusBadge(asset.status)}
                    </td>
                    <td className="px-6 py-4">
                        <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[80px] mb-1">
                            <div 
                                className={`h-1.5 rounded-full ${asset.fuelLevel < 30 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${asset.fuelLevel}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-mono">{Math.round(asset.fuelLevel)}%</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{asset.speed.toFixed(0)} km/h</td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            {asset.locationName && (
                                <span className="font-bold text-slate-700 text-xs mb-0.5 flex items-center gap-1">
                                    <MapPin size={10} className="text-slate-400" /> {asset.locationName}
                                </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                                {asset.location.lat.toFixed(4)}, {asset.location.lng.toFixed(4)}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                         <button 
                            onClick={() => setViewingTelemetry(asset)}
                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors flex items-center gap-1 ml-auto text-xs font-medium"
                         >
                            <BarChart2 size={16} />
                            View
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => setEditingAsset(asset)}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                        >
                            <Pencil size={16} />
                        </button>
                    </td>
                  </tr>
                );
              }) : (
                 <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">
                        <div className="flex flex-col items-center justify-center">
                            <Search size={48} className="text-slate-200 mb-2" />
                            <p>No assets found matching "{searchTerm}"</p>
                        </div>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telemetry Modal */}
      {viewingTelemetry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded border border-slate-200 text-indigo-600">
                            {getCategoryIcon(viewingTelemetry.category)}
                        </div>
                        <div>
                             <h3 className="font-bold text-slate-800 text-lg">{viewingTelemetry.name} Telemetry</h3>
                             <p className="text-xs text-slate-500 font-mono">{viewingTelemetry.id} • {viewingTelemetry.driver}</p>
                        </div>
                    </div>
                    <button onClick={() => setViewingTelemetry(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                 </div>
                 
                 <div className="p-6 overflow-y-auto bg-slate-50/30">
                     <div className="grid grid-cols-3 gap-4 mb-6">
                         <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                             <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><Gauge size={12} /> Avg Speed</p>
                             <h3 className="text-2xl font-bold text-slate-800">{Math.round(viewingTelemetry.speed)} <span className="text-sm font-normal text-slate-400">km/h</span></h3>
                         </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                             <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><Fuel size={12} /> Current Fuel</p>
                             <h3 className="text-2xl font-bold text-slate-800">{Math.round(viewingTelemetry.fuelLevel)} <span className="text-sm font-normal text-slate-400">%</span></h3>
                         </div>
                         <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                             <p className="text-xs text-slate-400 uppercase font-bold mb-1">Efficiency Score</p>
                             <h3 className="text-2xl font-bold text-green-600">A+</h3>
                         </div>
                     </div>

                     {viewingTelemetry.telemetryHistory && viewingTelemetry.telemetryHistory.length > 0 ? (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm h-64">
                                 <h4 className="text-sm font-bold text-slate-700 mb-4">Speed Analysis (Last 24h)</h4>
                                 <ResponsiveContainer width="100%" height="100%">
                                     <AreaChart data={viewingTelemetry.telemetryHistory}>
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
                             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm h-64">
                                 <h4 className="text-sm font-bold text-slate-700 mb-4">Fuel Burn Rate</h4>
                                 <ResponsiveContainer width="100%" height="100%">
                                     <LineChart data={viewingTelemetry.telemetryHistory}>
                                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                         <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                         <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                         <Tooltip />
                                         <Line type="monotone" dataKey="fuel" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                     </LineChart>
                                 </ResponsiveContainer>
                             </div>
                         </div>
                     ) : (
                         <div className="flex items-center justify-center h-32 bg-slate-100 rounded-lg text-slate-400">
                             No telemetry data recorded.
                         </div>
                     )}
                 </div>
             </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Edit Asset Configuration</h3>
                <button onClick={() => setEditingAsset(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset Name</label>
                    <input 
                        type="text" 
                        value={editingAsset.name}
                        onChange={(e) => setEditingAsset({...editingAsset, name: e.target.value})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver</label>
                    <input 
                        type="text" 
                        value={editingAsset.driver}
                        onChange={(e) => setEditingAsset({...editingAsset, driver: e.target.value})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location Name</label>
                    <input 
                        type="text" 
                        value={editingAsset.locationName || ''}
                        onChange={(e) => setEditingAsset({...editingAsset, locationName: e.target.value})}
                        placeholder="e.g. Lusaka, Kabwe"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Operational Status</label>
                    <select 
                        value={editingAsset.status}
                        onChange={(e) => setEditingAsset({...editingAsset, status: e.target.value as AssetStatus})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        {Object.values(AssetStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setEditingAsset(null)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;