import { persistence, SyncOperation } from '../lib/persistence';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

let isProcessing = false;
let syncListeners: ((count: number) => void)[] = [];

export const syncService = {
  subscribe(callback: (count: number) => void) {
    syncListeners.push(callback);
    this.notify();
    return () => {
      syncListeners = syncListeners.filter(l => l !== callback);
    };
  },

  async notify() {
    const ops = await persistence.getAll();
    syncListeners.forEach(l => l(ops.length));
  },

  async registerWrite(table: string, method: SyncOperation['method'], payload: any) {
    await persistence.queue({ table, method, payload });
    this.notify();
    this.processQueue(); // Try immediate sync
  },

  async processQueue() {
    if (isProcessing || !supabase) return;
    
    const ops = await persistence.getAll();
    if (ops.length === 0) return;

    isProcessing = true;
    console.log(`[SyncService] Processing ${ops.length} pending operations...`);

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
          // Standard assumption: payload contains primary key or filter
          const { error: err } = await supabase.from(op.table).update(op.payload).match({ id: op.payload.id });
          error = err;
        }

        if (!error) {
          await persistence.remove(op.id);
          console.log(`[SyncService] Success: ${op.method} on ${op.table}`);
        } else {
          throw error;
        }
      } catch (err) {
        console.warn(`[SyncService] Failed op ${op.id}:`, err);
        await persistence.incrementAttempt(op.id);
        // Stop processing the queue if we hit a network error to avoid multiple fail toasts
        isProcessing = false;
        this.notify();
        return;
      }
    }

    isProcessing = false;
    this.notify();
    toast.success("All data synchronized with central cluster", { id: 'sync-success' });
  }
};

// Auto-process queue on window focus or online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => syncService.processQueue());
  window.addEventListener('focus', () => syncService.processQueue());
  // Initial check
  setTimeout(() => syncService.processQueue(), 5000);
}