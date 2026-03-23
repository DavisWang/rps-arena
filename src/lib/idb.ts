const DB_NAME = 'rps-arena';
const DB_VERSION = 1;

export const STORE_NAMES = {
  customBots: 'customBots',
  quickMatches: 'quickMatches',
  tournaments: 'tournaments'
} as const;

type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

let openPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!openPromise) {
    openPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        for (const storeName of Object.values(STORE_NAMES)) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
    });
  }

  return openPromise;
}

function runRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readonly');
  return runRequest(transaction.objectStore(storeName).getAll());
}

export async function getFromStore<T>(storeName: StoreName, key: string): Promise<T | undefined> {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readonly');
  const result = await runRequest(transaction.objectStore(storeName).get(key));
  return result ?? undefined;
}

export async function putInStore<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  await runRequest(transaction.objectStore(storeName).put(value));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted.'));
  });
}

export async function deleteFromStore(storeName: StoreName, key: string): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  await runRequest(transaction.objectStore(storeName).delete(key));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB delete failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB delete aborted.'));
  });
}
