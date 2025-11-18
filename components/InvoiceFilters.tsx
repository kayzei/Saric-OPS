import React from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';

interface InvoiceFiltersProps {
  filters: {
    query: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    query: string;
    status: string;
    startDate: string;
    endDate: string;
  }>>;
}

const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({ filters, setFilters }) => {
  const handleChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ query: '', status: 'All', startDate: '', endDate: '' });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                placeholder="Search Customer, TPIN or Invoice #..."
                value={filters.query}
                onChange={(e) => handleChange('query', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-shadow"
            />
        </div>

        {/* Status Filter */}
        <div className="relative w-full lg:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none bg-white cursor-pointer"
                style={{ backgroundImage: 'none' }} // Remove default arrow in some browsers to prevent double arrows if custom icon used, though here we rely on browser default for simplicity or add chevron manually.
            >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Fiscalised">Fiscalised</option>
                <option value="Failed">Failed</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className="w-full lg:w-auto pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                    placeholder="Start Date"
                 />
            </div>
            <span className="text-slate-400 font-medium">-</span>
             <div className="relative flex-1 lg:flex-none">
                 <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    className="w-full lg:w-auto pl-3 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                    placeholder="End Date"
                 />
            </div>
        </div>

        {/* Reset */}
        {(filters.query || filters.status !== 'All' || filters.startDate || filters.endDate) && (
            <button
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium whitespace-nowrap"
                title="Reset Filters"
            >
                <X size={16} />
                Clear
            </button>
        )}
    </div>
  );
};

export default InvoiceFilters;