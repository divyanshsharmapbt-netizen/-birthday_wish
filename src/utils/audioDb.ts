/**
 * IndexedDB utility for persistent browser-side storage of user voice notes and audio songs.
 * This ensures that even on minor page refreshes or previews, their uploaded audio remains active.
 */

const DB_NAME = 'BirthdayMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_cache';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = (e) => {
      resolve((e.target as IDBOpenDBRequest).result);
    };
    
    request.onerror = (e) => {
      reject((e.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Stores a file in IndexedDB
 */
export async function saveMediaToDB(key: string, file: File): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put(file, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB save failed:', error);
  }
}

/**
 * Retrieves a file from IndexedDB and returns a temporary blob URL.
 */
export async function getMediaFromDB(key: string): Promise<{ blob: Blob; url: string } | null> {
  try {
    const db = await getDB();
    const file: File | Blob | undefined = await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (file) {
      const url = URL.createObjectURL(file);
      return { blob: file, url };
    }
  } catch (error) {
    console.error('IndexedDB fetch failed:', error);
  }
  return null;
}

/**
 * Deletes a file from IndexedDB
 */
export async function deleteMediaFromDB(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB deletion failed:', error);
  }
}
