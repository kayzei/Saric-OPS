/**
 * Persistence Layer for Reliable Data Sync
 * Utilizes IndexedDB to ensure data survives reloads/crashes.
 */

const DB_NAME = 'SaricOps_Outbox';
const STORE_NAME = 'pending_sync';

export interface SyncOperation {
  id: string;
  table: string;
  method: 'UPSERT' | 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
  attempts: number;
}

export const persistence = {
  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async queue(op: Omit<SyncOperation, 'id' | 'timestamp' | 'attempts'>) {
    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const operation: SyncOperation = {
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      attempts: 0
    };
    return new Promise((resolve, reject) => {
      const req = store.add(operation);
      req.onsuccess = () => resolve(operation);
      req.onerror = () => reject(req.error);
    });
  },

  async getAll(): Promise<SyncOperation[]> {
    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async remove(id: string) {
    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  async incrementAttempt(id: string) {
    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const data = getReq.result;
        if (data) {
          data.attempts += 1;
          store.put(data);
        }
        resolve(true);
      };
    });
  }
};