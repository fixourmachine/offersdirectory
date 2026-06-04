/* ============================================================
   Offers Directory — Service Worker
   Strategy: Network-first with cache fallback.
   - Always tries network for offers.json (fresh data)
   - Falls back to cache if offline
   - Static assets cached on install
   ============================================================ */

const CACHE_NAME = 'offers-dir-v1';
const DATA_CACHE = 'offers-data-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for data, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for offers.json — always try to get fresh data
  if (url.pathname.endsWith('offers.json')) {
    event.respondWith(networkFirstData(event.request));
    return;
  }

  // Cache-first for static assets (fonts, fuse.js, icons, etc.)
  event.respondWith(cacheFirstStatic(event.request));
});

async function networkFirstData(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName: DATA_CACHE });
    return cached || new Response('{"error":"offline"}', {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}
