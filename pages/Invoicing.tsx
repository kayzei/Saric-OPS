import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle, AlertCircle, QrCode, RefreshCw, ShieldCheck, History, X, User } from 'lucide-react';
import { INITIAL_INVOICES } from '../constants';
import { Invoice, AuditEntry } from '../types';
import toast from 'react-hot-toast';
import InvoiceFilters from '../components/InvoiceFilters';

const Invoicing: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAuditInvoice, setSelectedAuditInvoice] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState({
    query: '',
    status: 'All',
    startDate: '',
    endDate: ''
  });

  // Filter Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Search Query Filter
      const searchLower = filters.query.toLowerCase();
      const matchesQuery = 
        filters.query === '' || 
        inv.customer.toLowerCase().includes(searchLower) ||
        inv.id.toLowerCase().includes(searchLower) ||
        inv.tpin.includes(searchLower);

      // Status Filter
      const matchesStatus = filters.status === 'All' || inv.status === filters.status;

      // Date Range Filter
      let matchesDate = true;
      if (filters.startDate) {
        matchesDate = matchesDate && inv.date >= filters.startDate;
      }
      if (filters.endDate) {
        matchesDate = matchesDate && inv.date <= filters.endDate;
      }

      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [invoices, filters]);

  const handleFiscalise = (id: string) => {
    setProcessingId(id);
    
    // Simulate API call to ZRA ESD Server
    setTimeout(() => {
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      
      setInvoices(prev => prev.map(inv => {
        if (inv.id === id) {
          const newAuditEntry: AuditEntry = {
            timestamp: timestamp,
            action: 'Fiscalised via ESD',
            user: 'SARIC-ADMIN'
          };

          return {
            ...inv,
            status: 'Fiscalised',
            zraSignature: `ZRA-ESD-${Math.floor(Math.random() * 900000) + 100000}-GEN`,
            auditTrail: [...(inv.auditTrail || []), newAuditEntry]
          };
        }
        return inv;
      }));
      setProcessingId(null);
      toast.success('Invoice fiscalised successfully via ZRA ESD', {
        icon: '🇿🇲',
        style: {
            borderRadius: '10px',
            background: '#064e3b', // dark green
            color: '#fff',
        }
      });
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount);
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                ZRA Smart Invoicing
                <ShieldCheck className="text-green-600" size={24} />
            </h1>
            <p className="text-slate-500 text-sm">Manage tax invoices and ESD fiscalisation.</p>
        </div>
        <button className="px-4 py-2 bg-saric-600 text-white rounded-lg hover:bg-saric-500 transition-colors text-sm font-medium shadow-sm flex items-center gap-2">
            <FileText size={16} />
            Generate New Invoice
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Revenue (ZMW)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(invoices.reduce((acc, curr) => acc + curr.amount, 0))}
            </h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <p className="text-xs font-semibold text-slate-400 uppercase">VAT Liability (16%)</p>
             <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                {formatCurrency(invoices.reduce((acc, curr) => acc + curr.vat, 0))}
            </h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase">Pending Fiscalisation</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {invoices.filter(i => i.status === 'Pending').length}
            </h3>
        </div>
      </div>
      
      <InvoiceFilters filters={filters} setFilters={setFilters} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer / TPIN</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Total (ZMW)</th>
                <th className="px-6 py-4 text-center">ZRA Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 text-xs">{invoice.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{invoice.customer}</div>
                    <div className="text-xs text-slate-400 font-mono">TPIN: {invoice.tpin}</div>
                  </td>
                   <td className="px-6 py-4 text-xs max-w-xs truncate">
                    {invoice.items}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium">
                    {formatCurrency(invoice.amount + invoice.vat)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                        {invoice.status === 'Fiscalised' ? (
                            <>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle size={12} className="mr-1" /> Verified
                                </span>
                                <span className="text-[10px] font-mono text-green-600/70">{invoice.zraSignature?.slice(0,15)}...</span>
                            </>
                        ) : (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                <AlertCircle size={12} className="mr-1" /> Pending
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                        {invoice.status === 'Pending' ? (
                            <button 
                                onClick={() => handleFiscalise(invoice.id)}
                                disabled={processingId === invoice.id}
                                className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                {processingId === invoice.id ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                    <QrCode size={12} />
                                )}
                                {processingId === invoice.id ? 'Connecting...' : 'Fiscalise'}
                            </button>
                        ) : (
                            <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium underline">
                                PDF
                            </button>
                        )}
                        
                        <button 
                            onClick={() => setSelectedAuditInvoice(invoice)}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                            title="View Audit Log"
                        >
                            <History size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                            <FileText size={48} className="text-slate-200 mb-2" />
                            <p>No invoices found matching your filters.</p>
                            <button onClick={() => setFilters({ query: '', status: 'All', startDate: '', endDate: '' })} className="text-indigo-500 text-sm mt-2 hover:underline">Clear Filters</button>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {selectedAuditInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800">Invoice Audit Trail</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedAuditInvoice.id}</p>
                    </div>
                    <button 
                        onClick={() => setSelectedAuditInvoice(null)}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {selectedAuditInvoice.auditTrail && selectedAuditInvoice.auditTrail.length > 0 ? (
                        <div className="relative pl-4 space-y-6">
                            {/* Vertical Line */}
                            <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                            
                            {selectedAuditInvoice.auditTrail.map((entry, idx) => (
                                <div key={idx} className="relative flex gap-4">
                                    {/* Dot */}
                                    <div className="mt-1.5 z-10">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-100"></div>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800">{entry.action}</div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                            <span>{entry.timestamp}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                <User size={10} /> {entry.user}
                                            </span>
                                        </div>
                                        {entry.details && (
                                            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                                                {entry.details}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <History size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No audit history available for this record.</p>
                        </div>
                    )}
                </div>
                
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button 
                        onClick={() => setSelectedAuditInvoice(null)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-100 transition-colors font-medium shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Invoicing;