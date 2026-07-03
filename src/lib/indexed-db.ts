export interface CachedMessage {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const DB_NAME = 'StrataDB';
const STORE_NAME = 'messages';

/**
 * Initializes connection to the browser's IndexedDB database.
 * Returns null if executed server-side.
 */
export function initDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
      console.warn('[IndexedDB] Failed to open database:', event);
      resolve(null);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Loads all cached messages from browser IndexedDB.
 */
export async function getCachedMessages(): Promise<CachedMessage[]> {
  const db = await initDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const messages: CachedMessage[] = request.result || [];
        // Sort descending (newest messages first)
        messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(messages);
      };

      request.onerror = () => {
        resolve([]);
      };
    } catch (e) {
      console.warn('[IndexedDB] Read transaction error:', e);
      resolve([]);
    }
  });
}

/**
 * Overwrites IndexedDB store with a fresh array of messages from the server.
 */
export async function setCachedMessages(messages: CachedMessage[]): Promise<boolean> {
  const db = await initDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Clear the store
      store.clear();

      // Put new records
      for (const msg of messages) {
        store.put({
          id: msg.id,
          name: msg.name,
          email: msg.email,
          subject: msg.subject || null,
          message: msg.message,
          status: msg.status,
          createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : new Date(msg.createdAt).toISOString()
        });
      }

      transaction.oncomplete = () => {
        resolve(true);
      };

      transaction.onerror = (err) => {
        console.warn('[IndexedDB] Transaction write failed:', err);
        resolve(false);
      };
    } catch (e) {
      console.warn('[IndexedDB] Write exception:', e);
      resolve(false);
    }
  });
}
