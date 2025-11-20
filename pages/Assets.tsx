import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Asset, AssetStatus, AssetCategory } from '../types';
import { Truck, AlertCircle, CheckCircle, Clock, Pencil, X, Save, Bus, Construction, Wrench, Car, BarChart2, Fuel, Gauge } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AssetsProps {
  assets: Asset[];
  onUpdateAsset: (asset: Asset) => void;
}

const Assets: React.FC<AssetsProps> = ({ assets, onUpdateAsset }) => {
  const location = useLocation();
  const targetAssetId = location.state?.targetAssetId;
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingTelemetry, setViewingTelemetry] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<AssetCategory | 'All'>('All');

  useEffect(() => {
    if (targetAssetId && rowRefs.current[targetAssetId]) {
      rowRefs.current[targetAssetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [targetAssetId]);

  const filteredAssets = activeTab === 'All' ? assets : assets.filter(a => a.category === activeTab);

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
      
      {/* Category Tabs */}
      <div className="flex space-x-1 mb-6 overflow-x-auto bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
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
              {filteredAssets.map((asset) => {
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
                    <td className="px-6 py-4 font-mono text-xs">{asset.speed} km/h</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                        {asset.location.lat.toFixed(4)}, {asset.location.lng.toFixed(4)}
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
              })}
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