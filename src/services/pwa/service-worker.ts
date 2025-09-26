/**
 * Progressive Web App Service Worker
 * Handles caching, offline functionality, and background sync
 */

/// <reference lib="webworker" />

const CACHE_NAME = 'growth-app-v1.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

// Critical resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/admin',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/static/media/logo.svg',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache with strategies
const API_CACHE_PATTERNS = [
  { pattern: /\/api\/assessments/, strategy: 'staleWhileRevalidate' },
  { pattern: /\/api\/explorations/, strategy: 'staleWhileRevalidate' },
  { pattern: /\/api\/library/, strategy: 'staleWhileRevalidate' },
  { pattern: /\/api\/community/, strategy: 'networkFirst' },
  { pattern: /\/api\/auth/, strategy: 'networkOnly' },
];

// Background sync queues
const SYNC_QUEUES = {
  assessmentResults: 'assessment-results-sync',
  userProgress: 'user-progress-sync',
  analytics: 'analytics-sync'
};

const sw = self as unknown as ServiceWorkerGlobalScope;

/**
 * Install Event - Cache critical assets
 */
sw.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        const staticCache = await caches.open(STATIC_CACHE);
        await staticCache.addAll(STATIC_ASSETS);
        console.log('[SW] Static assets cached');
        
        // Skip waiting to activate immediately
        await sw.skipWaiting();
      } catch (error) {
        console.error('[SW] Install failed:', error);
      }
    })()
  );
});

/**
 * Activate Event - Clean up old caches
 */
sw.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const cachesToDelete = cacheNames.filter(cacheName => 
          cacheName.startsWith('growth-app-') && cacheName !== CACHE_NAME
        );
        
        await Promise.all(
          cachesToDelete.map(cache => caches.delete(cache))
        );
        
        console.log('[SW] Old caches cleaned up');
        
        // Claim all clients immediately
        await sw.clients.claim();
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

/**
 * Fetch Event - Implement caching strategies
 */
sw.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(handleFetch(event.request));
});

/**
 * Handle fetch requests with appropriate caching strategy
 */
async function handleFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  try {
    // API requests
    if (url.pathname.startsWith('/api/')) {
      return await handleApiRequest(request);
    }
    
    // Static assets (JS, CSS, images)
    if (isStaticAsset(request.url)) {
      return await handleStaticAsset(request);
    }
    
    // HTML pages
    if (request.headers.get('accept')?.includes('text/html')) {
      return await handlePageRequest(request);
    }
    
    // Other resources (fonts, etc.)
    return await handleOtherResources(request);
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    return await handleFallback(request);
  }
}

/**
 * Handle API requests with caching strategies
 */
async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const cachePattern = API_CACHE_PATTERNS.find(pattern => 
    pattern.pattern.test(url.pathname)
  );
  
  const strategy = cachePattern?.strategy || 'networkFirst';
  
  switch (strategy) {
    case 'networkFirst':
      return await networkFirst(request, API_CACHE);
    case 'cacheFirst':
      return await cacheFirst(request, API_CACHE);
    case 'staleWhileRevalidate':
      return await staleWhileRevalidate(request, API_CACHE);
    case 'networkOnly':
      return await fetch(request);
    default:
      return await networkFirst(request, API_CACHE);
  }
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request: Request): Promise<Response> {
  return await cacheFirst(request, STATIC_CACHE);
}

/**
 * Handle page requests with network-first strategy
 */
async function handlePageRequest(request: Request): Promise<Response> {
  try {
    // Try network first for HTML pages
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page as last resort
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    throw error;
  }
}

/**
 * Handle other resources with stale-while-revalidate
 */
async function handleOtherResources(request: Request): Promise<Response> {
  return await staleWhileRevalidate(request, DYNAMIC_CACHE);
}

/**
 * Network-first caching strategy
 */
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Cache-first caching strategy
 */
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

/**
 * Stale-while-revalidate caching strategy
 */
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Background fetch to update cache
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Don't await the fetch promise to return cached version immediately
    fetchPromise.catch(console.error);
    return cachedResponse;
  }
  
  // If no cached version, wait for network
  return await fetchPromise;
}

/**
 * Handle fallback responses
 */
async function handleFallback(request: Request): Promise<Response> {
  // For HTML requests, return offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // For API requests, return structured offline response
  if (request.url.includes('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. This data will sync when connection is restored.',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  // Generic fallback
  return new Response('Offline', { status: 503 });
}

/**
 * Background Sync Event
 */
sw.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  switch (event.tag) {
    case SYNC_QUEUES.assessmentResults:
      event.waitUntil(syncAssessmentResults());
      break;
    case SYNC_QUEUES.userProgress:
      event.waitUntil(syncUserProgress());
      break;
    case SYNC_QUEUES.analytics:
      event.waitUntil(syncAnalytics());
      break;
  }
});

/**
 * Push Event for notifications
 */
sw.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options: NotificationOptions = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: data.image,
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        action: data.action
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-action.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      sw.registration.showNotification(data.title || 'Growth App', options)
    );
  } catch (error) {
    console.error('[SW] Push event error:', error);
  }
});

/**
 * Notification Click Event
 */
sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Message Event - Handle messages from main thread
 */
sw.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      sw.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'QUEUE_BACKGROUND_SYNC':
      queueBackgroundSync(payload.tag, payload.data);
      break;
  }
});

// Sync functions
async function syncAssessmentResults() {
  try {
    const db = await openIndexedDB();
    const pendingResults = await getFromIndexedDB(db, 'pendingAssessmentResults');
    
    for (const result of pendingResults) {
      try {
        await fetch('/api/assessment-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result)
        });
        
        // Remove from pending queue on success
        await removeFromIndexedDB(db, 'pendingAssessmentResults', result.id);
      } catch (error) {
        console.error('[SW] Failed to sync assessment result:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Assessment sync failed:', error);
  }
}

async function syncUserProgress() {
  // Similar implementation for user progress sync
  console.log('[SW] Syncing user progress...');
}

async function syncAnalytics() {
  // Similar implementation for analytics sync
  console.log('[SW] Syncing analytics...');
}

// IndexedDB helpers
async function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('growth-app-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pendingAssessmentResults')) {
        db.createObjectStore('pendingAssessmentResults', { keyPath: 'id' });
      }
    };
  });
}

async function getFromIndexedDB(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removeFromIndexedDB(db: IDBDatabase, storeName: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function queueBackgroundSync(tag: string, data: any) {
  // Queue data for background sync
  console.log(`[SW] Queuing background sync: ${tag}`, data);
}

function isStaticAsset(url: string): boolean {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/.test(url);
}

export {};