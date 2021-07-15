const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/dist/bundle.js',
    '/dist/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
];
  
const STATIC_CACHE = 'static-cache-1';
const RUNTIME_CACHE = 'runtime-cache';

self.addEventListener('install', e => {
    e.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
    e.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                return cacheNames.filter(
                    cacheName => !currentCaches.includes(cacheName)
                );
            })
            .then(cachesToRemove => {
                return Promise.all(
                    cachesToRemove.map(cacheToRemove => {
                        return caches.delete(cacheToRemove);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
        e.respondWith(fetch(e.request));
        return;
    }

    if (e.request.url.includes('/api')) {
        e.respondWith(
            caches.open(RUNTIME_CACHE).then(cache => {
                return fetch(e.request)
                    .then(res => {
                        cache.put(e.request, res.clone());
                        return res
                    })
                    .catch(() => caches.match(e.request));
            })
        );
        return;
    };

    e.respondWith(
        caches.match(e.request).then(cachedRes => {
            if (cachedRes) {
                return cachedRes;
            }

            return caches.open(RUNTIME_CACHE).then(cache => {
                return fetch(e.request).then(res => {
                    return cache.put(e.request, res.clone()).then(() => {
                        return res;
                    });
                });
            });
        })
    );
});