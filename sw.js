const CACHE_NAME = 'extraquiz-v55';
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
