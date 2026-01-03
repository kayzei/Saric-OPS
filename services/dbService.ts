import { supabase, checkDatabaseHealth } from '../lib/supabaseClient';
import { InventoryItem, AttendanceRecord, Announcement, Profile, Shipment, Project, MaintenanceRecord } from '../types';
import { syncService } from './syncService';

export const dbService = {
  // --- SYSTEM DISCOVERY & DECOUPLING ---
  async getSystemPulse() {
    if (!supabase) return null;
    try {
      const tables = ['profiles', 'assets', 'shipments', 'invoices', 'projects', 'attendance', 'audit_logs', 'inventory', 'maintenance_records'];
      const pulse: Record<string, { count: number; healthy: boolean }> = {};
      
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        pulse[table] = { count: count || 0, healthy: !error };
      }
      return pulse;
    } catch (e) {
      return null;
    }
  },

  async logMilestone(milestone: string, details?: string) {
    if (!supabase) return;
    return this.logSecurityEvent('MILESTONE', `[STRUCTURAL] ${milestone}: ${details || 'System update registered'}`, 'INFO');
  },

  // --- AUTH & IDENTITY ---
  async login(email: string, pass: string) {
    if (!supabase) throw new Error("Database link not established.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  },

  async recoverIdentity(email: string) {
    if (!supabase) throw new Error("Database link not established.");
    await checkDatabaseHealth();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#/reset-password',
    });
    if (error) throw error;
    return true;
  },

  async updatePassword(newPassword: string) {
    if (!supabase) throw new Error("Database link not established.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  },

  async logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('saric_profile');
  },

  async getProfile(userId: string): Promise<Profile> {
    if (!supabase) throw new Error("Database link not established.");
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      fullName: data.full_name,
      role: data.role,
      department: data.department || 'Operations',
      avatarUrl: data.avatar_url,
      lastActive: data.last_active,
      currentTask: data.current_task,
      email: data.email
    };
  },

  // --- LOGISTICS & SHIPMENTS ---
  async getShipments(): Promise<Shipment[]> {
    if (!supabase) throw new Error("Database link not established.");
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      origin: d.origin,
      destination: d.destination,
      client: d.client,
      eta: d.eta,
      status: d.status,
      assetId: d.asset_id,
      delayReason: d.delay_reason
    }));
  },

  // --- PROJECT MANAGEMENT ---
  async getProjects(): Promise<Project[]> {
    if (!supabase) throw new Error("Database link not established.");
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      name: d.name,
      client: d.client,
      location: d.location,
      startDate: d.start_date,
      completionDate: d.completion_date,
      status: d.status,
      progress: d.progress,
      budget: d.budget,
      assetsAssigned: d.assets_assigned || []
    }));
  },

  // --- MAINTENANCE & WORKSHOP ---
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    if (!supabase) throw new Error("Database link not established.");
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      assetId: d.asset_id,
      type: d.type,
      date: d.date,
      cost: d.cost,
      mechanic: d.mechanic,
      notes: d.notes,
      status: d.status
    }));
  },

  async saveMaintenanceRecord(record: Partial<MaintenanceRecord>) {
    const payload = {
      asset_id: record.assetId,
      type: record.type,
      date: record.date || new Date().toISOString().split('T')[0],
      cost: record.cost,
      mechanic: record.mechanic,
      notes: record.notes,
      status: record.status
    };
    // Use the reliable sync outbox
    await syncService.registerWrite('maintenance_records', 'UPSERT', payload);
    return [payload];
  },

  // --- INVENTORY ---
  async getInventory(): Promise<InventoryItem[]> {
    if (!supabase) throw new Error("Database link not established.");
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category,
      quantity: d.quantity,
      minThreshold: d.min_threshold,
      unit: d.unit,
      lastUpdated: d.last_updated
    }));
  },

  async updateInventory(item: Partial<InventoryItem>) {
    const payload: any = {
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      min_threshold: item.minThreshold,
      unit: item.unit,
      last_updated: new Date().toISOString()
    };
    if (item.id && !item.id.includes('mock')) {
      payload.id = item.id;
    }
    // Reliable sync outbox
    await syncService.registerWrite('inventory', 'UPSERT', payload);
    return [payload];
  },

  // --- ATTENDANCE ---
  async getAttendance(): Promise<AttendanceRecord[]> {
    if (!supabase) throw new Error("Database link not established.");
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      userId: d.user_id,
      userName: d.user_name,
      clockIn: d.clock_in,
      clockOut: d.clock_out,
      date: d.date,
      mood: d.mood
    }));
  },

  async saveAttendance(record: Partial<AttendanceRecord>) {
    const payload: any = {
      user_id: record.userId,
      user_name: record.userName,
      clock_in: record.clockIn,
      clock_out: record.clockOut,
      date: record.date || new Date().toISOString().split('T')[0],
      mood: record.mood
    };
    if (record.id && !record.id.includes('mock')) {
      payload.id = record.id;
    }
    // Reliable sync outbox
    await syncService.registerWrite('attendance', 'UPSERT', payload);
    return [payload];
  },

  // --- AUDIT & SECURITY ---
  async logSecurityEvent(type: string, details: string, severity: string = 'INFO') {
    try {
      const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      const payload = {
        event_type: type,
        details: details,
        severity: severity,
        user_id: session?.user.id || 'anonymous',
        created_at: new Date().toISOString()
      };
      // Use standard insert for logs, but still reliable via syncService
      await syncService.registerWrite('audit_logs', 'INSERT', payload);
    } catch (e) {
      console.warn("Security log queuing failed", e);
    }
  },

  // --- ANNOUNCEMENTS ---
  async getAnnouncements(): Promise<Announcement[]> {
    if (!supabase) throw new Error("Database link not established.");
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      title: d.title,
      content: d.content,
      authorName: d.author_name,
      date: d.date
    }));
  }
};