const CACHE_NAME = 'extraquiz-v79';
const ASSETS = [
    './',
    './index.html',
    './js/ranks.js',
    './js/components/LevelUpPopup.js',
    './css/style.css',
    './css/style-dark.css',
    './assets/logo.png',
    './js/app.js',
    './js/store.js',
    './js/db.js',
    './js/ai.js',
    './js/sfx.js',
    './js/voice.js',
    './js/components/quotes.js',
    './js/components/adminpanel.js',
    './js/memoryengine.js',
    './js/personaengine.js',
    './js/aiinsight.js',
    './js/i18n.js'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (e) => {
    // Chỉ cache các request HTTP(S) tĩnh, bỏ qua các request của Firebase/Google API
    if (e.request.url.includes('firestore.googleapis.com') || 
        e.request.url.includes('generativelanguage.googleapis.com') ||
        e.request.url.includes('identitytoolkit.googleapis.com')) {
        return;
    }

    // Network-First cho các file JS, CSS, HTML để luôn nhận code mới nhất
    if (e.request.destination === 'script' || 
        e.request.destination === 'style' || 
        e.request.destination === 'document' ||
        e.request.url.endsWith('.js') ||
        e.request.url.endsWith('.css') ||
        e.request.url.endsWith('.html')) {
        e.respondWith(
            fetch(e.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                return caches.match(e.request);
            })
        );
        return;
    }

    // Cache-First cho hình ảnh và font tĩnh
    e.respondWith(
        caches.match(e.request).then((response) => {
            if (response) return response;
            return fetch(e.request).catch((err) => {
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                throw err;
            });
        })
    );
});

self.addEventListener('activate', (e) => {
    self.clients.claim();
    const cacheWhitelist = [CACHE_NAME];
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
