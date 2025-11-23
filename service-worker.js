// Service Worker for Stock Counting PWA
const CACHE_NAME = 'stock-counting-v6'; // bumped version to force update for Supabase fix
const DYNAMIC_CACHE = 'stock-counting-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip Google Apps Script API requests (always go to network)
    if (url.hostname.includes('script.google.com')) {
        event.respondWith(fetch(request));
        return;
    }

    // Network-first strategy for API calls
    if (request.url.includes('action=')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone response for caching
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request);
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Don't cache if not successful
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone response for caching
                        const responseClone = response.clone();

                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);
                        // Return offline page if available
                        return caches.match('/');
                    });
            })
    );
});

// Background sync for pending data
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-pending-queue') {
        event.waitUntil(
            // Notify all clients to sync
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'BACKGROUND_SYNC',
                        action: 'syncPendingQueue'
                    });
                });
            })
        );
    }
});

// Push notification (future feature)
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');

    const options = {
        body: event.data ? event.data.text() : 'Stock counting update',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'stock-counting-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('ระบบนับสต็อก', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

// Message handling
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

console.log('[Service Worker] Loaded successfully');
