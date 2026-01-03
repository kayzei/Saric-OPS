import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, List, LayoutGrid, Send, AlertTriangle, Brain, Activity, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { INITIAL_MAINTENANCE, INITIAL_ASSETS } from '../constants';
import { MaintenanceRecord, Asset } from '../types';
import { analyzeMaintenanceHistory } from '../services/geminiService';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';

interface MaintenanceProps {
    userRole?: 'admin' | 'user';
}

const Maintenance: React.FC<MaintenanceProps> = ({ userRole = 'user' }) => {
  const [records, setRecords] = useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'intelligence'>('list');
  const [issueDesc, setIssueDesc] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await dbService.getMaintenanceRecords();
      if (data && data.length > 0) {
        setRecords(data);
      }
    } catch (e) {
      console.warn("Maintenance sync deferred.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount);
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeMaintenanceHistory(records, INITIAL_ASSETS);
      setAiAnalysis(result);
      toast.success("Vanguard Analytics Complete");
    } catch (e) {
      toast.error("Analytics Handshake Error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle size={12} /> Completed</span>;
      case 'In Progress': return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold"><Clock size={12} /> In Progress</span>;
      case 'Scheduled': return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold"><Calendar size={12} /> Scheduled</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleSubmitIssue = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!issueDesc) return;
      
      const loadId = toast.loading("Transmitting Diagnostic Fault...");
      try {
          await dbService.saveMaintenanceRecord({
              assetId: 'SRC-104', // Simulation context
              type: 'Repair',
              cost: 0,
              mechanic: 'Awaiting Assignment',
              notes: `[${severity}] ${issueDesc}`,
              status: 'Scheduled'
          });
          toast.success("Maintenance Sequence Initiated", { id: loadId });
          setIssueDesc('');
          fetchRecords();
      } catch (err) {
          toast.error("Transmission Error", { id: loadId });
      }
  };
  
  if (userRole === 'user') {
      return (
        <div className="p-6 bg-slate-50/50 min-h-full max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <AlertTriangle size={24} className="text-amber-500" />
                Technical Fault Registry
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <form onSubmit={handleSubmitIssue} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Severity Level</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Low', 'Medium', 'Critical'].map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setSeverity(level)}
                                    className={`py-3 rounded-lg border text-sm font-bold transition-all ${
                                        severity === level 
                                        ? (level === 'Critical' ? 'bg-red-600 text-white border-red-600' : level === 'Medium' ? 'bg-amber-500 text-white border-amber-500' : 'bg-green-600 text-white border-green-600')
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Anomaly Description</label>
                        <textarea 
                            value={issueDesc}
                            onChange={(e) => setIssueDesc(e.target.value)}
                            placeholder="Describe unusual vibrations, leaks, or sensor warnings..."
                            className="w-full h-32 p-4 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                        ></textarea>
                    </div>

                    <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                        <Send size={18} /> Transmit Field Data
                    </button>
                </form>
            </div>

            <h3 className="font-bold text-slate-700 mb-3 ml-1">My Technical Logs</h3>
            <div className="space-y-3">
                {records.filter(r => r.assetId === 'SRC-104').slice(0, 3).map(rec => (
                    <div key={rec.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div>
                            <p className="font-bold text-sm text-slate-800">{rec.type}</p>
                            <p className="text-xs text-slate-500">{rec.date}</p>
                        </div>
                        {getStatusBadge(rec.status)}
                    </div>
                ))}
            </div>
        </div>
      );
  }

  return (
    <div className="p-8 bg-slate-50/50 min-h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Workshop Operations Hub
                <Wrench className="text-indigo-600" size={24} />
            </h1>
            <p className="text-slate-500 text-sm">Asset life-cycle management and workshop SOC.</p>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={fetchRecords} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="bg-white border border-slate-200 rounded-lg flex overflow-hidden shadow-sm">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <List size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 transition-colors ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('intelligence')}
                    className={`p-2 transition-colors ${viewMode === 'intelligence' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Brain size={18} />
                </button>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-md">
                Schedule Service
            </button>
        </div>
      </div>

      {viewMode === 'intelligence' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5"><Brain size={120} /></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                            <Sparkles className="text-indigo-400" /> VANGUARD LIFECYCLE ENGINE
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-widest">Autonomous Reliability Matrix</p>
                    </div>
                    <button 
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Activity size={18} />}
                        {isAnalyzing ? 'Calculating Mtbf...' : 'Initiate AI Analysis'}
                    </button>
                </div>

                {aiAnalysis ? (
                    <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800 font-mono text-xs leading-relaxed text-indigo-300">
                        <p className="mb-4 text-slate-500"># LOG_START: VANGUARD PREDICTIVE ENGINE</p>
                        {aiAnalysis.split('\n').map((line, i) => (
                            <p key={i} className="mb-2">>> {line}</p>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl text-slate-600">
                        <ShieldAlert size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest">Awaiting Live Telemetry Stream</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Forecasted Events', val: '4 Critical', color: 'red' },
                    { label: 'Fleet Reliability', val: '94.2%', color: 'indigo' },
                    { label: 'Estimated Saving', val: 'ZMW 18.5K', color: 'emerald' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h4 className={`text-2xl font-black text-slate-800 mt-1`}>{stat.val}</h4>
                    </div>
                ))}
            </div>
        </div>
      ) : viewMode === 'list' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Task ID</th>
                        <th className="px-6 py-4">Asset</th>
                        <th className="px-6 py-4">Protocol</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Facility</th>
                        <th className="px-6 py-4">Value</th>
                        <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-mono font-medium text-indigo-600">{record.id}</td>
                            <td className="px-6 py-4 font-medium text-slate-800">{record.assetId}</td>
                            <td className="px-6 py-4">{record.type}</td>
                            <td className="px-6 py-4 font-mono text-xs">{record.date}</td>
                            <td className="px-6 py-4">{record.mechanic}</td>
                            <td className="px-6 py-4 font-mono">{formatCurrency(record.cost)}</td>
                            <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in p-6">
              <h3 className="font-bold text-slate-800 mb-4">Workshop Scheduler</h3>
              <div className="grid grid-cols-7 gap-4 min-h-[400px]">
                  {weekDays.map((day, index) => (
                      <div key={day} className="border-t-2 border-slate-100 pt-2">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">{day}</p>
                          <div className="space-y-2">
                              {records.filter((_, i) => i % 7 === index).slice(0, 2).map(task => (
                                  <div key={task.id} className="p-2 rounded bg-slate-50 border border-slate-100 text-xs group hover:border-indigo-200 transition-colors cursor-pointer">
                                      <div className="flex justify-between items-start">
                                          <span className="font-bold text-slate-700">{task.assetId}</span>
                                          <span className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                                      </div>
                                      <p className="text-slate-500 mt-1 truncate uppercase font-bold tracking-tighter">{task.type}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default Maintenance;