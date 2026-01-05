import { persistence, SyncOperation } from '../lib/persistence';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

let isProcessing = false;
let syncListeners: ((status: { count: number; isProcessing: boolean }) => void)[] = [];

export const syncService = {
  subscribe(callback: (status: { count: number; isProcessing: boolean }) => void) {
    syncListeners.push(callback);
    this.notify();
    return () => {
      syncListeners = syncListeners.filter(l => l !== callback);
    };
  },

  async notify() {
    try {
      const ops = await persistence.getAll();
      syncListeners.forEach(l => l({ count: ops.length, isProcessing }));
    } catch (e) {
      console.error("Sync notification failure", e);
    }
  },

  async registerWrite(table: string, method: SyncOperation['method'], payload: any) {
    await persistence.queue({ table, method, payload });
    this.notify();
    this.processQueue(); 
  },

  async processQueue() {
    if (isProcessing || !supabase) return;
    
    const ops = await persistence.getAll();
    if (ops.length === 0) {
        this.notify();
        return;
    }

    isProcessing = true;
    this.notify();

    for (const op of ops) {
      try {
        let error;
        if (op.method === 'UPSERT') {
          const { error: err } = await supabase.from(op.table).upsert(op.payload);
          error = err;
        } else if (op.method === 'INSERT') {
          const { error: err } = await supabase.from(op.table).insert(op.payload);
          error = err;
        } else if (op.method === 'UPDATE') {
          const { error: err } = await supabase.from(op.table).update(op.payload).match({ id: op.payload.id });
          error = err;
        }

        if (!error) {
          await persistence.remove(op.id);
        } else {
          throw error;
        }
      } catch (err) {
        await persistence.incrementAttempt(op.id);
        isProcessing = false;
        this.notify();
        return;
      }
    }

    isProcessing = false;
    this.notify();
    toast.success("All changes synced to cloud storage.", { id: 'sync-success' });
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => syncService.processQueue());
  window.addEventListener('focus', () => syncService.processQueue());
}