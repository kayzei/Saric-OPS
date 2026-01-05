import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, Plus, Minus, AlertTriangle, RefreshCw, Filter, ArrowUpRight, ArrowDownLeft, Box, Droplet, Shield, Settings2, X, Save, History, ClipboardList } from 'lucide-react';
import { dbService } from '../services/dbService';
import { InventoryItem } from '../types';
import toast from 'react-hot-toast';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getInventory();
      setItems(data);
    } catch (e) {
      toast.error("Cluster sync failed: Using local cache");
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['All', 'Spare Parts', 'Fuel', 'PPE', 'Maintenance', 'Office'];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [items, searchTerm, activeCategory]);

  const handleAdjustStock = async () => {
    if (!selectedItem) return;
    
    const finalAdjustment = adjustmentType === 'add' ? adjustmentValue : -adjustmentValue;
    const newQuantity = selectedItem.quantity + finalAdjustment;

    if (newQuantity < 0) {
      toast.error("Insufficient stock for this operation");
      return;
    }

    const loadId = toast.loading("Processing stock adjustment...");
    try {
      await dbService.updateInventory({
        ...selectedItem,
        quantity: newQuantity
      });
      toast.success(`Stock ${adjustmentType === 'add' ? 'increased' : 'decreased'} successfully`, { id: loadId });
      setSelectedItem(null);
      setAdjustmentValue(0);
      fetchInventory();
    } catch (e) {
      toast.error("Transmission failed", { id: loadId });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fuel': return <Droplet size={16} className="text-blue-500" />;
      case 'PPE': return <Shield size={16} className="text-orange-500" />;
      case 'Spare Parts': return <Settings2 size={16} className="text-indigo-500" />;
      default: return <Box size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-full text-slate-300">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <Package className="text-indigo-500" size={32} />
            INVENTORY <span className="text-indigo-500">HUB</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Global Supply Chain & Warehouse SOC</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchInventory}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20">
            <Plus size={18} /> Provision Item
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stock Criticality</p>
          <h3 className="text-3xl font-black text-red-500 tracking-tighter">
            {items.filter(i => i.quantity <= i.minThreshold).length} Items
          </h3>
          <AlertTriangle className="absolute top-4 right-4 text-red-500/20" size={40} />
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Inventory Valuation</p>
          <h3 className="text-3xl font-black text-white tracking-tighter">ZMW 1.2M</h3>
          <ArrowUpRight className="absolute top-4 right-4 text-slate-800" size={40} />
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Operational Flux</p>
          <h3 className="text-3xl font-black text-indigo-500 tracking-tighter">Stable</h3>
          <History className="absolute top-4 right-4 text-slate-800" size={40} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Query SKU, Name or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-300 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                activeCategory === cat 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.length > 0 ? filteredItems.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 hover:border-indigo-500/50 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-indigo-500 transition-all">
                {getCategoryIcon(item.category)}
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                  item.quantity <= item.minThreshold ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}>
                  {item.quantity <= item.minThreshold ? 'Critical' : 'Nominal'}
                </span>
              </div>
            </div>
            
            <h3 className="font-black text-white tracking-tight mb-1">{item.name}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-6">{item.category}</p>
            
            <div className="flex items-end justify-between border-t border-slate-800 pt-4">
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mb-1">Current Stock</p>
                <p className={`text-2xl font-black ${item.quantity <= item.minThreshold ? 'text-red-500' : 'text-white'}`}>
                  {item.quantity} <span className="text-xs font-normal text-slate-600 uppercase">{item.unit}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedItem(item)}
                className="p-3 bg-slate-950 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-2xl border border-slate-800 transition-all"
              >
                <ClipboardList size={18} />
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
            <Box size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-700 text-center">Warehouse Registry Empty</p>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                {getCategoryIcon(selectedItem.category)}
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase">{selectedItem.name}</h2>
              <p className="text-indigo-100 text-xs font-bold tracking-widest mt-2 uppercase opacity-80">Stock Level Adjustment Protocol</p>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setAdjustmentType('add')}
                  className={`flex flex-col items-center gap-2 p-6 rounded-3xl border transition-all ${
                    adjustmentType === 'add' ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <ArrowDownLeft size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Receive</span>
                </button>
                <button 
                  onClick={() => setAdjustmentType('remove')}
                  className={`flex flex-col items-center gap-2 p-6 rounded-3xl border transition-all ${
                    adjustmentType === 'remove' ? 'bg-red-600 border-red-500 text-white shadow-xl' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <ArrowUpRight size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Issue Out</span>
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Quantity to Process ({selectedItem.unit})</label>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setAdjustmentValue(Math.max(0, adjustmentValue - 1))}
                    className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
                  >
                    <Minus size={20} />
                  </button>
                  <input 
                    type="number" 
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-center py-4 rounded-2xl text-2xl font-black text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <button 
                    onClick={() => setAdjustmentValue(adjustmentValue + 1)}
                    className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAdjustStock}
                disabled={adjustmentValue <= 0}
                className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                  adjustmentType === 'add' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                }`}
              >
                <Save size={20} /> Authorize Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
