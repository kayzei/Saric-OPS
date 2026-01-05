
import { supabase } from '../lib/supabaseClient';
import { InventoryItem, AttendanceRecord, Profile, Asset, Invoice, CommTopic, MessagePayload, Shipment, Project, MaintenanceRecord, InvoiceItem } from '../types';

// Deterministic UUIDs for the required topics (mapping string topics to required UUID room_id)
const TOPIC_UUIDS: Record<CommTopic, string> = {
  'chat:general': '00000000-0000-0000-0000-000000000001',
  'chat:ops': '00000000-0000-0000-0000-000000000002',
  'radio:dispatch_log': '00000000-0000-0000-0000-000000000003',
  'chat:personnel': '00000000-0000-0000-0000-000000000004'
};

export const dbService = {
  // --- COMMUNICATION (Strategic Command Protocol) ---
  async sendMessage(topic: CommTopic, payload: MessagePayload) {
    if (!supabase) return;
    
    const { error } = await supabase.from('messages').insert({
      room_id: TOPIC_UUIDS[topic],
      user_id: payload.sender_id,
      content: payload.text,
      metadata: payload // Schema defined JSONB payload
    });
    
    if (error) throw error;
  },

  async logSystemEvent(type: 'FLEET_SYNC' | 'SECURITY_ALERT' | 'STRATEGIC_DIRECTIVE', payload: any, userId?: string) {
    if (!supabase) return;
    await supabase.from('system_events').insert({
      event_type: type,
      user_id: userId,
      payload: payload
    });
  },

  async logAudit(action: string, metadata: any, userId?: string) {
    if (!supabase) return;
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      metadata
    });
  },

  // --- IDENTITY ---
  async getProfile(userId: string): Promise<Profile> {
    if (!supabase) throw new Error("Database link offline");
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return {
      id: data.id,
      fullName: data.full_name,
      role: data.role,
      department: data.department || 'Operations',
      email: data.email,
      onDuty: data.on_duty || false,
      noSim: data.no_sim || false
    };
  },

  // Fix for operative and security profile updates
  async updateProfile(profile: Partial<Profile> & { id: string }) {
    if (!supabase) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.fullName,
        role: profile.role,
        department: profile.department,
        on_duty: profile.onDuty,
        no_sim: profile.noSim
      })
      .eq('id', profile.id);
    if (error) throw error;
  },

  async logout() {
    if (supabase) await supabase.auth.signOut();
  },

  async updatePassword(password: string) {
    if (!supabase) throw new Error("Database link offline");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async recoverIdentity(email: string) {
    if (!supabase) throw new Error("Database link offline");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  // --- OPERATIONS (Schema Mapping) ---
  async updateAsset(asset: Asset) {
    if (!supabase) return;
    const { error } = await supabase.from('assets').upsert({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      driver_name: asset.driver,
      status: asset.status,
      lat: asset.location.lat,
      lng: asset.location.lng,
      location_name: asset.locationName,
      dest_lat: asset.destination.lat,
      dest_lng: asset.destination.lng,
      // Fix for Error in services/dbService.ts on line 111: Property 'cargo_type' does not exist on type 'Asset'.
      cargo_type: asset.cargoType,
      speed: asset.speed,
      fuel_level: asset.fuelLevel,
      revenue_mtd: asset.revenueMonthToDate,
      cost_mtd: asset.costMonthToDate,
      co2_emissions: asset.co2Emissions,
      updated_at: new Date().toISOString()
    });
    
    if (asset.status === 'BREAKDOWN') {
      await this.logSystemEvent('SECURITY_ALERT', { 
        severity: 'CRITICAL',
        message: `ASSET FAILURE DETECTED: ${asset.id}`, 
        assetId: asset.id 
      });
    } else {
      await this.logSystemEvent('FLEET_SYNC', { assetId: asset.id, status: asset.status });
    }
    
    if (error) throw error;
  },

  // Fix for shipment management
  async getShipments(): Promise<Shipment[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
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

  // Fix for project tracking
  async getProjects(): Promise<Project[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('projects').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
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

  // Fix for maintenance logging
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('maintenance').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
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
    if (!supabase) return;
    const { error } = await supabase.from('maintenance').insert({
      asset_id: record.assetId,
      type: record.type,
      date: record.date || new Date().toISOString().split('T')[0],
      cost: record.cost,
      mechanic: record.mechanic,
      notes: record.notes,
      status: record.status || 'Scheduled'
    });
    if (error) throw error;
  },

  // Fix for driver attendance tracking
  async getAttendance(): Promise<AttendanceRecord[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('attendance').select('*').order('clock_in', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
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
    if (!supabase) return;
    const { error } = await supabase.from('attendance').upsert({
      id: record.id,
      user_id: record.userId,
      user_name: record.userName,
      clock_in: record.clockIn,
      clock_out: record.clockOut,
      date: record.date || new Date().toISOString().split('T')[0],
      mood: record.mood
    });
    if (error) throw error;
  },

  async createInvoice(invoiceData: Partial<Invoice>, items: InvoiceItem[]) {
    if (!supabase) return;
    const { data: inv, error: invErr } = await supabase.from('invoices').insert({
      id: invoiceData.id,
      customer_name: invoiceData.customer,
      tpin: invoiceData.tpin,
      currency: invoiceData.currency,
      exchange_rate: invoiceData.exchangeRate,
      net_amount: invoiceData.amount,
      vat_amount: invoiceData.vat,
      summary: invoiceData.items,
      status: 'Pending',
      invoice_date: new Date().toISOString()
    }).select().single();

    if (invErr) throw invErr;

    const lineItems = items.map(item => ({
      invoice_id: invoiceData.id,
      description: item.description,
      hs_code: item.hsCode,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_type: item.taxType,
      total: item.total
    }));

    const { error: itemErr } = await supabase.from('invoice_items').insert(lineItems);
    if (itemErr) throw itemErr;
  },

  // Fix for ZRA fiscalisation workflow
  async fiscaliseInvoice(id: string, signature: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'Fiscalised',
        zra_signature: signature
      })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteInvoice(id: string) {
    if (!supabase) return;
    const { data: inv, error: fetchErr } = await supabase
      .from('invoices')
      .select('zra_signature')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    if (inv.zra_signature && inv.zra_signature.startsWith('ZRA-')) {
      throw new Error("COMPLIANCE LOCK: Fiscalised invoices cannot be deleted from the system.");
    }

    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },

  async getInventory(): Promise<InventoryItem[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('inventory').select('*').order('name');
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      category: d.category,
      quantity: d.quantity,
      minThreshold: d.min_threshold,
      unit: d.unit,
      lastUpdated: d.last_updated
    }));
  },

  // Fix for stock management
  async updateInventory(item: InventoryItem) {
    if (!supabase) return;
    const { error } = await supabase.from('inventory').upsert({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      min_threshold: item.minThreshold,
      unit: item.unit,
      last_updated: new Date().toISOString()
    });
    if (error) throw error;
  },

  // Fix for operational feedback reporting
  async submitFeedback(content: string, category: string, rating: number) {
    if (!supabase) return;
    const { error } = await supabase.from('feedback').insert({
      content,
      category,
      rating,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  async getSystemPulse() {
    if (!supabase) return null;
    const tables = ['assets', 'drivers', 'shipments', 'invoices', 'inventory', 'maintenance', 'attendance'];
    const results: any = {};
    for (const table of tables) {
      try {
          const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
          results[table] = { count: count || 0, healthy: !error };
      } catch (e) {
          results[table] = { count: 0, healthy: false };
      }
    }
    return results;
  }
};
