// マナクエ Service Worker — PWAインストール用の最小実装
const CACHE_NAME = 'manaque-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // ネットワーク優先（オフラインキャッシュは最小限）
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
