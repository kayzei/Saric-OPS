import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Clock, ArrowRight, Truck, History, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { INITIAL_SHIPMENTS } from '../constants';

const Shipments: React.FC = () => {
  const navigate = useNavigate();

  const activeShipments = INITIAL_SHIPMENTS.filter(s => ['In Transit', 'Pending'].includes(s.status));
  const historyShipments = INITIAL_SHIPMENTS.filter(s => ['Delivered', 'Delayed'].includes(s.status));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-100 text-blue-700';
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleAssetClick = (assetId?: string) => {
    if (assetId) {
      navigate('/assets', { state: { targetAssetId: assetId } });
    }
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Shipment Management</h1>
            <p className="text-slate-500 text-sm">Active bills of lading and cargo tracking.</p>
        </div>
        <button className="px-4 py-2 bg-saric-600 text-white rounded-lg hover:bg-saric-500 transition-colors text-sm font-medium shadow-sm">
            New Shipment
        </button>
      </div>
      
      {/* Active Shipments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Active Operations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Shipment ID</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">ETA</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned Asset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeShipments.length > 0 ? activeShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-mono font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                        <Package size={16} className="text-slate-400" />
                        {shipment.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{shipment.origin}</span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span className="font-medium">{shipment.destination}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{shipment.client}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-500">
                        <Clock size={14} />
                        {shipment.eta}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {shipment.assetId ? (
                        <button 
                            onClick={() => handleAssetClick(shipment.assetId)}
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:underline font-mono bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-all"
                            title="View Asset Details"
                        >
                            <Truck size={14} />
                            {shipment.assetId}
                        </button>
                    ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                </tr>
              )) : (
                 <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">No active shipments currently.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <History size={16} className="text-slate-500" />
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Shipment History & Exceptions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
             <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Shipment ID</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {historyShipments.length > 0 ? historyShipments.map((shipment) => (
                     <tr key={shipment.id} className="hover:bg-slate-50 transition-colors group/row opacity-80 hover:opacity-100">
                        <td className="px-6 py-4 font-mono font-medium text-slate-500">
                            {shipment.id}
                        </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{shipment.origin}</span>
                                <ArrowRight size={12} />
                                <span>{shipment.destination}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{shipment.client}</td>
                        <td className="px-6 py-4 relative group/tooltip">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)} cursor-help flex items-center gap-1 w-fit`}>
                                {shipment.status}
                                {shipment.status === 'Delayed' && <Info size={10} />}
                            </span>
                            {shipment.status === 'Delayed' && shipment.delayReason && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                    <p className="font-bold mb-1 text-red-200">Delay Reason:</p>
                                    {shipment.delayReason}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {shipment.status === 'Delivered' ? (
                                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                    <CheckCircle size={14} /> Verified
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
                                    <AlertTriangle size={14} /> Intervention Req.
                                </div>
                            )}
                        </td>
                     </tr>
                )) : (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No history records found.</td></tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Shipments;