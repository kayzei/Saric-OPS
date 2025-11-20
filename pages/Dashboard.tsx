import React, { useState } from 'react';
import { Asset, AssetStatus } from '../types';
import { generateFleetReport } from '../services/geminiService';
import { Brain, AlertTriangle, Fuel, Activity, TrendingUp, Leaf, DollarSign, Bus, Truck, Construction } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardProps {
  assets: Asset[];
}

const Dashboard: React.FC<DashboardProps> = ({ assets }) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const statusData = [
    { name: 'Moving', value: assets.filter(a => a.status === AssetStatus.MOVING).length, color: '#10b981' },
    { name: 'Idle', value: assets.filter(a => a.status === AssetStatus.IDLE).length, color: '#f59e0b' },
    { name: 'Stopped', value: assets.filter(a => a.status === AssetStatus.STOPPED).length, color: '#64748b' },
    { name: 'Breakdown', value: assets.filter(a => a.status === AssetStatus.BREAKDOWN).length, color: '#ef4444' },
  ];

  const financialData = assets.map(a => ({
    name: a.id.split('-')[1],
    revenue: a.revenueMonthToDate || 0,
    cost: a.costMonthToDate || 0
  }));

  const totalRevenue = assets.reduce((acc, curr) => acc + (curr.revenueMonthToDate || 0), 0);
  const totalCO2 = assets.reduce((acc, curr) => acc + (curr.co2Emissions || 0), 0);

  const handleGenerateReport = async () => {
    setLoadingAi(true);
    const report = await generateFleetReport(assets);
    setAiReport(report);
    setLoadingAi(false);
    toast.success("AI Executive Summary Generated");
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-ZM', { notation: "compact", compactDisplay: "short", style: 'currency', currency: 'ZMW' }).format(val);

  return (
    <div className="p-8 bg-slate-50/50 min-h-full">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Executive Dashboard</h1>
            <p className="text-slate-500 mt-1">Overview of financial performance, fleet health, and ESG metrics.</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Fleet Health</span>
                <span className="text-lg font-bold text-green-600">94%</span>
            </div>
            <button 
                onClick={handleGenerateReport}
                disabled={loadingAi}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
                <Brain size={18} />
                <span>{loadingAi ? 'Generating Insights...' : 'AI Strategic Insight'}</span>
            </button>
        </div>
      </header>

      {/* AI Insight Card */}
      {aiReport && (
        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div className="flex items-center space-x-2 mb-3 text-indigo-800">
                <Brain size={20} />
                <h3 className="font-bold text-lg">Gemini Operations Intelligence</h3>
            </div>
            <p className="text-slate-700 leading-relaxed text-sm md:text-base font-medium">{aiReport}</p>
        </div>
      )}

      {/* Financial & ESG KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 group hover:border-indigo-200 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Revenue (MTD)</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-2">{formatCurrency(totalRevenue)}</h3>
                    <p className="text-xs text-green-500 mt-1 flex items-center font-medium">
                        <TrendingUp size={12} className="mr-1" /> +12.5% vs Last Month
                    </p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <DollarSign size={24} />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 group hover:border-green-200 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. CO₂ Emissions</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-2">{totalCO2.toLocaleString()} <span className="text-sm text-slate-400 font-normal">kg</span></h3>
                    <p className="text-xs text-green-600 mt-1 flex items-center font-medium">
                        <Leaf size={12} className="mr-1" /> Within Green Limits
                    </p>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Leaf size={24} />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 group hover:border-amber-200 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Utilization</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-2">
                         {Math.round((assets.filter(a => a.status === AssetStatus.MOVING).length / assets.length) * 100)}%
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center">
                        {assets.filter(a => a.status === AssetStatus.IDLE).length} units idle
                    </p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Activity size={24} />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 group hover:border-red-200 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Alerts</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-2">
                        {assets.filter(a => a.status === AssetStatus.BREAKDOWN).length}
                    </h3>
                    <p className="text-xs text-red-400 mt-1 font-medium">Requires Attention</p>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <AlertTriangle size={24} />
                </div>
            </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Financial Performance */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Financial Performance (MTD)</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Revenue</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> Cost</span>
                </div>
            </div>
            <div className="h-80 flex items-center justify-center text-slate-500">
                <div className="text-center">
                    <p className="text-lg font-medium mb-2">Financial Data Summary</p>
                    <p className="text-sm">Total Revenue: {formatCurrency(totalRevenue)}</p>
                    <p className="text-sm">Total Cost: {formatCurrency(assets.reduce((acc, curr) => acc + (curr.costMonthToDate || 0), 0))}</p>
                    <p className="text-sm">Net Profit: {formatCurrency(totalRevenue - assets.reduce((acc, curr) => acc + (curr.costMonthToDate || 0), 0))}</p>
                </div>
            </div>
        </div>

        {/* Fleet Status Donut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Real-time Status</h3>
            <div className="flex-1 min-h-[250px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl font-bold text-slate-800 mb-2">{assets.length}</div>
                    <div className="text-sm text-slate-500 uppercase tracking-wider">Total Units</div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
                {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                            {item.name}
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
      
      {/* Operational Segments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Truck size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Heavy Haulage</p>
                  <h4 className="text-lg font-bold text-slate-800">
                      {assets.filter(a => a.category === 'Heavy Transport').length} Units Active
                  </h4>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                  <Bus size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Shuttle Service</p>
                  <h4 className="text-lg font-bold text-slate-800">
                      {assets.filter(a => a.category === 'Shuttle').length} Routes Live
                  </h4>
              </div>
          </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                  <Construction size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Construction</p>
                  <h4 className="text-lg font-bold text-slate-800">
                      {assets.filter(a => a.category === 'Construction').length} Sites Active
                  </h4>
              </div>
          </div>
      </div>

    </div>
  );
};

export default Dashboard;