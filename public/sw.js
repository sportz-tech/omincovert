const CACHE_NAME = 'ominconvert-static-v1';
const DYNAMIC_CACHE_NAME = 'ominconvert-dynamic-v1';

// Assets to cache immediately on installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon.svg',
  '/pdf.worker.min.mjs',
  '/manifest.json'
];

// Install Event - Pre-cache crucial shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate strategy with bypass for AdSense & Analytics
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass caching for AdSense, Google Analytics, and other behavioral check APIs
  if (
    requestUrl.hostname.includes('pagead2') ||
    requestUrl.hostname.includes('googlesyndication') ||
    requestUrl.hostname.includes('doubleclick') ||
    requestUrl.hostname.includes('google-analytics') ||
    requestUrl.hostname.includes('googletagmanager') ||
    requestUrl.pathname.includes('ads.txt') ||
    event.request.method !== 'GET'
  ) {
    return; // Fetch directly from network, do not touch cache
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Fetch request from network in the background to update cache
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request fails, just return cached response (if exists)
          return null;
        });

      // Return cached response instantly if we have it, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
