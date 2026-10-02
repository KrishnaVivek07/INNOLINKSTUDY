/**
 * InnoLink Video Storage Utility
 * Uses IndexedDB to store uploaded video files persistently in the browser,
 * enabling real video playback without losing blob URLs on navigation or refresh.
 */

const DB_NAME = 'innolink_video_db';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

function openVideoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory cache for active blob URLs
const blobUrlCache = new Map<string, string>();

/**
 * Stores a video file/blob into IndexedDB and returns a stable video reference key.
 */
export async function saveVideoFile(key: string, file: File | Blob): Promise<string> {
  try {
    const db = await openVideoDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(file, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Create an object URL and cache it
    if (blobUrlCache.has(key)) {
      try {
        URL.revokeObjectURL(blobUrlCache.get(key)!);
      } catch (e) {
        // ignore
      }
    }
    const objectUrl = URL.createObjectURL(file);
    blobUrlCache.set(key, objectUrl);
    return `indexeddb://${key}`;
  } catch (err) {
    console.warn('Failed to save to IndexedDB, fallback to object URL:', err);
    const objectUrl = URL.createObjectURL(file);
    blobUrlCache.set(key, objectUrl);
    return objectUrl;
  }
}

/**
 * Resolves a video reference key (either indexeddb://..., http..., or blob:...)
 * into a playable URL for HTML5 video element.
 */
export async function resolveVideoUrl(videoUrl: string): Promise<string> {
  if (!videoUrl) return '';

  // If already an http/https or data url, return directly
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://') || videoUrl.startsWith('data:')) {
    return videoUrl;
  }

  // Check if it's an indexeddb ref
  if (videoUrl.startsWith('indexeddb://')) {
    const key = videoUrl.replace('indexeddb://', '');
    if (blobUrlCache.has(key)) {
      return blobUrlCache.get(key)!;
    }

    try {
      const db = await openVideoDB();
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      if (blob) {
        const newUrl = URL.createObjectURL(blob);
        blobUrlCache.set(key, newUrl);
        return newUrl;
      }
    } catch (err) {
      console.warn('Failed to retrieve video from IndexedDB:', err);
    }
  }

  return videoUrl;
}

/**
 * Helper to identify if a video URL is a YouTube link
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(ytRegex);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1`;
  }
  return null;
}

/**
 * Helper to identify if a video URL is a Google Drive link
 */
export function getGoogleDriveEmbedUrl(url: string): string | null {
  if (!url) return null;
  const driveRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([^"&?\/\s]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    const fileId = match[1].replace('/view', '');
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return null;
}
