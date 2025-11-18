import React from 'react';
import { Wrench, Calendar, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { INITIAL_MAINTENANCE } from '../constants';

const Maintenance: React.FC = () => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle size={12} /> Completed</span>;
      case 'In Progress': return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold"><Clock size={12} /> In Progress</span>;
      case 'Scheduled': return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold"><Calendar size={12} /> Scheduled</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Maintenance & Workshop
                <Wrench className="text-saric-600" size={24} />
            </h1>
            <p className="text-slate-500 text-sm">Fleet service schedules, repairs, and cost tracking.</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
            Schedule Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase">This Month's Spend</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">ZMW 28,500</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase">Vehicles in Workshop</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{INITIAL_MAINTENANCE.filter(m => m.status === 'In Progress').length}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase">Upcoming Services</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">{INITIAL_MAINTENANCE.filter(m => m.status === 'Scheduled').length}</h3>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                    <th className="px-6 py-4">Job ID</th>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Workshop / Mechanic</th>
                    <th className="px-6 py-4">Cost</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Notes</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {INITIAL_MAINTENANCE.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-indigo-600">{record.id}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{record.assetId}</td>
                        <td className="px-6 py-4">{record.type}</td>
                        <td className="px-6 py-4">{record.date}</td>
                        <td className="px-6 py-4">{record.mechanic}</td>
                        <td className="px-6 py-4 font-mono">{formatCurrency(record.cost)}</td>
                        <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                        <td className="px-6 py-4 text-xs max-w-xs truncate" title={record.notes}>{record.notes}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Maintenance;