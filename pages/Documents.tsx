import React, { useState } from 'react';
import { Folder, FileText, Download, Search, Filter } from 'lucide-react';
import { INITIAL_DOCUMENTS } from '../constants';
import toast from 'react-hot-toast';

const Documents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDownload = (docTitle: string) => {
      toast.success(`Downloading ${docTitle}...`);
  };

  const filteredDocs = INITIAL_DOCUMENTS.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.relatedId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
      switch (type) {
          case 'POD': return 'bg-purple-100 text-purple-700';
          case 'Invoice': return 'bg-green-100 text-green-700';
          case 'Permit': return 'bg-blue-100 text-blue-700';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Digital Filing Cabinet
                <Folder className="text-saric-600" size={24} />
            </h1>
            <p className="text-slate-500 text-sm">Centralized document repository for logistics operations.</p>
        </div>
        <div className="flex gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search documents..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-64"
                />
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2">
                <FileText size={16} /> Upload
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 divide-y divide-slate-100">
            {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm transition-all">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">{doc.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${getTypeColor(doc.type)}`}>{doc.type}</span>
                                <span className="text-xs text-slate-400">{doc.dateUploaded}</span>
                                <span className="text-xs text-slate-300">•</span>
                                <span className="text-xs text-slate-400 font-mono">Ref: {doc.relatedId}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-xs text-slate-400 font-mono">{doc.size}</span>
                        <button 
                            onClick={() => handleDownload(doc.title)}
                            className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                            title="Download"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                </div>
            )) : (
                <div className="p-12 text-center text-slate-400">
                    <Folder size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No documents found.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Documents;