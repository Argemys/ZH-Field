const CACHE_NAME = 'zh-app-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './corine_biotopes.json',
  './catalogue_flore_alslor_floragis_zh.json'
];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then(cached => cached ||
      fetch(evt.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
        return res;
      }).catch(() => cached)
    )
  );
});
