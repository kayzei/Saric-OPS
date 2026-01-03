import React, { useState, useEffect } from 'react';
import { INITIAL_PROJECTS } from '../constants';
import { Project } from '../types';
import { dbService } from '../services/dbService';
import { Shield, MapPin, Calendar, DollarSign, ChevronRight, Briefcase, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await dbService.getProjects();
      if (data && data.length > 0) {
        setProjects(data);
      }
    } catch (e) {
      console.warn("Project sync deferred.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW', notation: "compact", maximumFractionDigits: 1 }).format(amount);
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full relative">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Active Operations Hub
                    <Shield className="text-saric-600" size={24} />
                </h1>
                <p className="text-slate-500 text-sm">Subsidiary contracts and active site management.</p>
            </div>
            <div className="flex gap-3">
                <button onClick={fetchProjects} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
                <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
                    New Initiative
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:border-indigo-300 transition-colors group">
                    <div className="flex-shrink-0 md:w-64 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mt-1">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{project.name}</h3>
                                <p className="text-xs text-slate-400 font-mono mb-2">{project.id}</p>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                    project.status === 'Active' ? 'bg-green-100 text-green-700' :
                                    project.status === 'Planning' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                    {project.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1"><MapPin size={10} /> Site Location</p>
                            <p className="text-sm font-medium text-slate-700">{project.location}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Contract Entity</p>
                            <p className="text-sm font-medium text-slate-700">{project.client}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1"><Calendar size={10} /> Target Completion</p>
                            <p className="text-sm font-medium text-slate-700">{project.completionDate}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1"><DollarSign size={10} /> Net Value</p>
                            <p className="text-sm font-medium text-slate-700">{formatCurrency(project.budget)}</p>
                        </div>
                        <div className="col-span-2">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs text-slate-400 uppercase font-semibold">Mission Progress</p>
                                <span className="text-xs font-bold text-indigo-600">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                        <div className="text-right mb-4">
                            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Units Allocated</p>
                            <div className="flex -space-x-2 justify-end">
                                {project.assetsAssigned.length > 0 ? (
                                    project.assetsAssigned.map((asset, idx) => (
                                        <div key={idx} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600" title={asset}>
                                            {asset.split('-')[1]}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-sm text-slate-400 italic">Standby</span>
                                )}
                            </div>
                        </div>
                        <button className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium group-hover:translate-x-1 transition-transform">
                            Full Brief <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default Projects;