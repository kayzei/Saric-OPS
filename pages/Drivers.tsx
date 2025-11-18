import React, { useState } from 'react';
import { Driver, FatigueStatus, DriverMessage } from '../types';
import { INITIAL_DRIVERS } from '../constants';
import { Users, Clock, AlertTriangle, Activity, Award, MessageCircle, Send, X, Radio } from 'lucide-react';
import toast from 'react-hot-toast';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [selectedDriverForChat, setSelectedDriverForChat] = useState<Driver | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const getFatigueColor = (status: FatigueStatus) => {
    switch (status) {
        case FatigueStatus.FRESH: return 'text-green-500';
        case FatigueStatus.OK: return 'text-blue-500';
        case FatigueStatus.TIRED: return 'text-orange-500';
        case FatigueStatus.CRITICAL: return 'text-red-600';
    }
  };

  const getFatigueBarColor = (hours: number) => {
      if (hours > 10) return 'bg-red-600';
      if (hours > 8) return 'bg-orange-500';
      if (hours > 5) return 'bg-blue-500';
      return 'bg-green-500';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDriverForChat) return;

    const newMsg: DriverMessage = {
        id: Date.now().toString(),
        sender: 'HR',
        content: newMessage,
        timestamp: new Date().toISOString(),
        isRead: true,
        type: 'General'
    };

    // Update local state to show message immediately
    setDrivers(prev => prev.map(d => {
        if (d.id === selectedDriverForChat.id) {
            return { ...d, messages: [...(d.messages || []), newMsg] };
        }
        return d;
    }));
    
    // Also update the currently selected driver object to reflect in modal
    setSelectedDriverForChat(prev => prev ? { ...prev, messages: [...(prev.messages || []), newMsg] } : null);

    setNewMessage('');
    toast.success('Message sent to driver');
  };

  const handleBroadcast = () => {
      toast.success("Broadcast sent to all active drivers", { icon: '📡' });
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full relative">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Workforce & Fatigue Management
                    <Activity className="text-indigo-600" size={24} />
                </h1>
                <p className="text-slate-500 text-sm">Driver clocking, fatigue monitoring, and communication.</p>
            </div>
            <div className="flex gap-3">
                 <button 
                    onClick={handleBroadcast}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 hover:bg-slate-700 transition-colors text-sm font-medium"
                 >
                    <Radio size={16} />
                    Broadcast Alert
                 </button>
                 <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex flex-col items-end">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Active Drivers</span>
                    <span className="font-bold text-slate-800 text-lg">{drivers.filter(d => d.status === 'On Duty').length}</span>
                 </div>
                 <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex flex-col items-end">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Fatigue Alerts</span>
                    <span className="font-bold text-red-600 text-lg">{drivers.filter(d => d.fatigueLevel === FatigueStatus.CRITICAL).length}</span>
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => (
                <div key={driver.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 relative">
                                <Users size={24} />
                                {driver.messages && driver.messages.some(m => !m.isRead && m.sender === 'Driver') && (
                                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{driver.name}</h3>
                                <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${driver.status === 'On Duty' ? 'bg-green-100 text-green-700' : driver.status === 'Resting' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            {driver.status}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Clock In Info */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock size={14} />
                                <span>Clocked In</span>
                            </div>
                            <span className="font-mono font-medium text-slate-800">
                                {driver.clockInTime ? new Date(driver.clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            </span>
                        </div>

                        {/* Asset Info */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Users size={14} />
                                <span>Assigned Asset</span>
                            </div>
                            <span className="font-mono font-medium text-indigo-600">
                                {driver.assignedAssetId || 'Unassigned'}
                            </span>
                        </div>

                        {/* Fatigue Meter */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Driving Time (Today)</span>
                                <span className={`text-xs font-bold ${getFatigueColor(driver.fatigueLevel)}`}>
                                    {driver.drivingHoursToday} hrs / 10 hrs
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${getFatigueBarColor(driver.drivingHoursToday)}`} 
                                    style={{ width: `${Math.min(100, (driver.drivingHoursToday / 10) * 100)}%` }}
                                ></div>
                            </div>
                            {driver.fatigueLevel === FatigueStatus.CRITICAL && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                    <AlertTriangle size={12} />
                                    <span className="font-bold">Mandatory Rest Required</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase">Compliance</span>
                                <div className="flex items-center gap-1 text-slate-800 font-bold">
                                    <Award size={14} className="text-kvi-gold" />
                                    {driver.complianceScore}%
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedDriverForChat(driver)}
                                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition-colors flex items-center gap-1"
                            >
                                <MessageCircle size={14} />
                                Message
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Messaging Modal */}
        {selectedDriverForChat && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px]">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                {selectedDriverForChat.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{selectedDriverForChat.name}</h3>
                                <p className="text-xs text-slate-500 font