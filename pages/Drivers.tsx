import React, { useState, useRef, useEffect } from 'react';
import { Driver, FatigueStatus, DriverMessage, AttendanceRecord } from '../types';
import { INITIAL_DRIVERS } from '../constants';
import { Users, Clock, Activity, Award, MessageCircle, Send, X, Radio, LogIn, LogOut, RefreshCw, Smile, Meh, Frown } from 'lucide-react';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDriverForChat, setSelectedDriverForChat] = useState<Driver | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsSyncing(true);
    try {
        const records = await dbService.getAttendance();
        setAttendance(records);
        
        // Map attendance to drivers
        setDrivers(prev => prev.map(d => {
            const activeSession = records.find(r => r.userName === d.name && !r.clockOut);
            return activeSession ? { ...d, status: 'On Duty', clockInTime: activeSession.clockIn } : { ...d, status: 'Off Duty' };
        }));
    } catch (e) {
        toast.error("Vanguard Comms Offline");
    } finally {
        setIsSyncing(false);
    }
  };

  const handleClockToggle = async (driver: Driver, mood: string = 'Normal') => {
    try {
      if (driver.status === 'On Duty') {
          const activeRecord = attendance.find(r => r.userName === driver.name && !r.clockOut);
          if (activeRecord) {
              await dbService.saveAttendance({
                ...activeRecord,
                clockOut: new Date().toISOString()
              });
              toast.success(`${driver.name} De-authorized`);
          }
      } else {
          await dbService.saveAttendance({
              userId: driver.id,
              userName: driver.name,
              clockIn: new Date().toISOString(),
              mood: mood
          });
          toast.success(`${driver.name} Clearance Granted`, { icon: '🔐' });
      }
      setShowMoodPicker(null);
      fetchData();
    } catch (e) {
      toast.error("Database Protocol Error");
    }
  };

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

    setDrivers(prev => prev.map(d => {
        if (d.id === selectedDriverForChat.id) {
            return { ...d, messages: [...(d.messages || []), newMsg] };
        }
        return d;
    }));

    setNewMessage('');
    toast.success('Message sent');
  };

  return (
    <div className="p-8 bg-slate-950 min-h-full relative text-slate-300">
        <div className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                    OPERATIVE <span className="text-indigo-500">WELL-BEING</span>
                    <Activity className="text-indigo-600" size={28} />
                </h1>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Fatigue & Attendance Matrix</p>
            </div>
            <div className="flex gap-4">
                 <button onClick={fetchData} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
                    <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                 </button>
                 <div className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-end">
                    <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Active Operatives</span>
                    <span className="font-black text-white text-2xl tracking-tighter">{drivers.filter(d => d.status === 'On Duty').length}</span>
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {drivers.map((driver) => (
                <div key={driver.id} className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 p-8 hover:border-indigo-500/50 transition-all relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Users size={120} /></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-indigo-400 border border-slate-800 shadow-inner group-hover:border-indigo-500 transition-all">
                                <Users size={28} />
                            </div>
                            <div>
                                <h3 className="font-black text-white tracking-tight">{driver.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{driver.id}</p>
                            </div>
                        </div>
                        <div className="relative">
                          {showMoodPicker === driver.id ? (
                            <div className="absolute top-0 right-0 bg-slate-950 border border-slate-800 rounded-2xl p-2 flex gap-2 shadow-2xl animate-in fade-in zoom-in-95 z-20">
                              <button onClick={() => handleClockToggle(driver, 'Happy')} className="p-2 hover:bg-indigo-500/20 rounded-xl text-green-400"><Smile size={18}/></button>
                              <button onClick={() => handleClockToggle(driver, 'Neutral')} className="p-2 hover:bg-indigo-500/20 rounded-xl text-amber-400"><Meh size={18}/></button>
                              <button onClick={() => handleClockToggle(driver, 'Stressed')} className="p-2 hover:bg-indigo-500/20 rounded-xl text-red-400"><Frown size={18}/></button>
                              <button onClick={() => setShowMoodPicker(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 border-l border-slate-800 ml-1"><X size={14}/></button>
                            </div>
                          ) : (
                            <button 
                                onClick={() => driver.status === 'On Duty' ? handleClockToggle(driver) : setShowMoodPicker(driver.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2 transition-all ${
                                    driver.status === 'On Duty' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-slate-950 text-slate-600 border border-slate-800'
                                }`}
                            >
                                {driver.status === 'On Duty' ? <LogOut size={14} /> : <LogIn size={14} />}
                                {driver.status === 'On Duty' ? 'ACTIVE' : 'IDLE'}
                            </button>
                          )}
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                <Clock size={14} className="text-indigo-500" />
                                <span>Shift Start</span>
                            </div>
                            <span className="font-mono font-black text-white text-xs">
                                {driver.clockInTime ? new Date(driver.clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'ZULU OFFLINE'}
                            </span>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shift Endurance</span>
                                <span className={`text-xs font-black ${getFatigueColor(driver.fatigueLevel)}`}>
                                    {driver.drivingHoursToday} <span className="text-[10px] font-normal opacity-50 uppercase ml-1">HRS</span>
                                </span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${getFatigueBarColor(driver.drivingHoursToday)}`} style={{ width: `${Math.min(100, (driver.drivingHoursToday / 10) * 100)}%` }}></div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Risk Score</span>
                                <div className="flex items-center gap-1.5 text-white font-black">
                                    <Award size={16} className="text-kvi-gold" />
                                    {driver.complianceScore}%
                                </div>
                            </div>
                            <button onClick={() => setSelectedDriverForChat(driver)} className="text-[10px] font-black uppercase tracking-widest bg-slate-950 text-indigo-400 px-5 py-2.5 rounded-2xl border border-slate-800 hover:bg-indigo-600 hover:text-white transition-all">
                                Comm Link
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {selectedDriverForChat && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200">
                    <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div>
                            <h3 className="font-black text-white tracking-tight">{selectedDriverForChat.name}</h3>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Neural Encryption Enabled</p>
                        </div>
                        <button onClick={() => setSelectedDriverForChat(null)} className="hover:bg-slate-800 p-2 rounded-xl transition-all"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                        {selectedDriverForChat.messages?.map((msg, i) => (
                            <div key={i} className={`flex ${msg.sender === 'HR' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-5 py-3 rounded-2xl text-xs font-medium max-w-[80%] ${msg.sender === 'HR' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-800 text-slate-300'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-800 flex gap-3 bg-slate-950">
                        <input 
                            type="text" 
                            value={newMessage} 
                            onChange={e => setNewMessage(e.target.value)} 
                            placeholder="Type command..." 
                            className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs" 
                        />
                        <button className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"><Send size={20} /></button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Drivers;