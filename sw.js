const CACHE_NAME = 'deadryx-cache-v1';

// We cache core files to allow the app to work offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './analysis.html',
  './memories.html',
  './notes.html',
  './privacy.html',
  './styles.css',
  './script.js',
  './shared.js',
  './stats.js',
  './bmi.js',
  './notes.js',
  './analysis.js',
  './gdrive-sync.js',
  './logo.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy for dynamic updates, falling back to cache if offline
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If valid response, clone it and update cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, serve from cache
        return caches.match(event.request);
      })
  );
});
