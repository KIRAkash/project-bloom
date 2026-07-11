import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface BloomDB extends DBSchema {
  context: {
    key: string;
    value: any;
  };
  assets: {
    key: string; // e.g. 'logo', 'theme'
    value: {
      type: string;
      data: Blob | string; // Blobs for images, strings for URLs/base64
    };
  };
}

let dbPromise: Promise<IDBPDatabase<BloomDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<BloomDB>('bloom-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('context')) {
        db.createObjectStore('context');
      }
      if (!db.objectStoreNames.contains('assets')) {
        db.createObjectStore('assets');
      }
    },
  });
}

/**
 * Save business context key-value pairs
 */
export async function saveContext(key: string, value: any) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put('context', value, key);
}

/**
 * Retrieve all business context
 */
export async function getAllContext(): Promise<Record<string, any>> {
  if (!dbPromise) return {};
  const db = await dbPromise;
  const keys = await db.getAllKeys('context');
  const values = await db.getAll('context');
  
  const result: Record<string, any> = {};
  keys.forEach((key, index) => {
    result[key as string] = values[index];
  });
  
  return result;
}

/**
 * Save an asset like a logo blob or theme config
 */
export async function saveAsset(key: string, data: Blob | string, type: string) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put('assets', { type, data }, key);
}

/**
 * Get an asset
 */
export async function getAsset(key: string) {
  if (!dbPromise) return null;
  const db = await dbPromise;
  return await db.get('assets', key);
}
