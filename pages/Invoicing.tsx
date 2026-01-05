import React, { useState, useMemo, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, QrCode, RefreshCw, ShieldCheck, History, X, User, Plus, Trash2, Printer, Eye, Lock, Database } from 'lucide-react';
import { INITIAL_INVOICES } from '../constants';
import { Invoice, AuditEntry, InvoiceItem, ZraTaxType } from '../types';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';
import InvoiceFilters from '../components/InvoiceFilters';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const Invoicing: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAuditInvoice, setSelectedAuditInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    query: '',
    status: 'All',
    startDate: '',
    endDate: ''
  });

  const [newInvCustomer, setNewInvCustomer] = useState('');
  const [newInvTpin, setNewInvTpin] = useState('');
  const [newInvCurrency, setNewInvCurrency] = useState<'ZMW' | 'USD'>('ZMW');
  const [newInvExchangeRate, setNewInvExchangeRate] = useState<number>(26.5);
  const [newInvItems, setNewInvItems] = useState<InvoiceItem[]>([
      { id: '1', description: '', hsCode: '', quantity: 1, unitPrice: 0, taxType: 'A', total: 0 }
  ]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
      if (!isSupabaseConfigured() || !supabase) return;
      setIsLoading(true);
      try {
          const { data, error } = await supabase
            .from('invoices')
            .select(`*, invoice_items(*)`)
            .order('invoice_date', { ascending: false });

          if (error) throw error;

          if (data) {
              const mappedInvoices: Invoice[] = data.map((d: any) => ({
                  id: d.id,
                  customer: d.customer_name,
                  tpin: d.tpin,
                  currency: d.currency || 'ZMW',
                  exchangeRate: d.exchange_rate,
                  date: d.invoice_date,
                  amount: d.net_amount,
                  vat: d.vat_amount,
                  status: d.status,
                  zraSignature: d.zra_signature,
                  items: d.summary || 'Logistics Service',
                  lineItems: d.invoice_items?.map((item: any) => ({
                      id: item.id,
                      description: item.description,
                      hsCode: item.hs_code,
                      quantity: item.quantity,
                      unitPrice: item.unit_price,
                      tax_type: item.tax_type,
                      total: item.total
                  })) || [],
                  auditTrail: []
              }));
              setInvoices(mappedInvoices);
          }
      } catch (error: any) {
          toast.error('Failed to load live invoices');
      } finally {
          setIsLoading(false);
      }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const searchLower = filters.query.toLowerCase();
      const matchesQuery = filters.query === '' || inv.customer.toLowerCase().includes(searchLower) || inv.id.toLowerCase().includes(searchLower);
      const matchesStatus = filters.status === 'All' || inv.status === filters.status;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, filters]);

  const handleCreateInvoice = async () => {
      if (!newInvCustomer || !newInvTpin) {
          toast.error("Required fields missing");
          return;
      }

      const totalNet = newInvItems.reduce((acc, curr) => acc + curr.total, 0);
      const totalVat = newInvItems.reduce((acc, curr) => acc + (curr.taxType === 'A' ? curr.total * 0.16 : 0), 0);
      const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

      const loadId = toast.loading("Registering transaction...");
      try {
          await dbService.createInvoice({
              id: invoiceId,
              customer: newInvCustomer,
              tpin: newInvTpin,
              currency: newInvCurrency,
              exchangeRate: newInvCurrency === 'USD' ? newInvExchangeRate : undefined,
              amount: totalNet,
              vat: totalVat,
              items: newInvItems[0].description
          }, newInvItems);
          
          toast.success("Invoice Queued for Sync", { id: loadId });
          fetchInvoices();
          setShowCreateModal(false);
      } catch (error: any) {
          toast.error("Process Halted: " + error.message, { id: loadId });
      }
  };

  const handleFiscalise = async (id: string) => {
    setProcessingId(id);
    const signature = `ZRA-ESD-${Math.floor(Math.random() * 900000) + 100000}-GEN`;
    try {
        await dbService.fiscaliseInvoice(id, signature);
        toast.success('Invoice queued for ZRA signature', { icon: '🇿🇲' });
        fetchInvoices();
    } catch (error: any) {
         toast.error("Fiscalisation Protocol Error");
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            ZRA Smart Invoicing <ShieldCheck className="text-green-600" />
        </h1>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium shadow-sm flex items-center gap-2">
            <Plus size={16} /> New Tax Invoice
        </button>
      </div>

      <InvoiceFilters filters={filters} setFilters={setFilters} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? <div className="p-12 text-center text-slate-400">Syncing with Identity Cluster...</div> : (
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono font-medium text-indigo-600">{invoice.id}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{invoice.customer}</td>
                        <td className="px-6 py-4 text-right font-mono">{new Intl.NumberFormat('en-ZM', { style: 'currency', currency: invoice.currency }).format(invoice.amount + invoice.vat)}</td>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${invoice.status === 'Fiscalised' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {invoice.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setViewInvoice(invoice)} className="text-slate-400 hover:text-indigo-600 p-1.5"><Eye size={16} /></button>
                                {invoice.status === 'Pending' && (
                                    <button onClick={() => handleFiscalise(invoice.id)} className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-700">Fiscalise</button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold">Generate Tax Invoice</h3>
                    <button onClick={() => setShowCreateModal(false)}><X /></button>
                </div>
                <div className="p-8 space-y-4">
                    <input type="text" placeholder="Customer Name" value={newInvCustomer} onChange={e => setNewInvCustomer(e.target.value)} className="w-full border p-2 rounded" />
                    <input type="text" placeholder="TPIN" value={newInvTpin} onChange={e => setNewInvTpin(e.target.value)} className="w-full border p-2 rounded" />
                    <div className="bg-slate-50 p-4 border rounded">
                        <input type="text" placeholder="Description" value={newInvItems[0].description} onChange={e => setNewInvItems([{...newInvItems[0], description: e.target.value}])} className="w-full border p-2 rounded mb-2" />
                        <input type="number" placeholder="Price" value={newInvItems[0].unitPrice} onChange={e => setNewInvItems([{...newInvItems[0], unitPrice: parseFloat(e.target.value), total: parseFloat(e.target.value)}])} className="w-full border p-2 rounded" />
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={() => setShowCreateModal(false)} className="px-4 py-2">Cancel</button>
                    <button onClick={handleCreateInvoice} className="px-6 py-2 bg-indigo-600 text-white rounded font-bold">Save Invoice</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Invoicing;