const CACHE_NAME = 'zh-app-v4';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];
const REFERENTIELS = ['./corine_biotopes.json', './catalogue_flore_alslor_floragis_zh.json', './catalogue_flore_champagne_ardenne.json'];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ASSETS).then(() =>
        // Mise en cache des référentiels au mieux : si un fichier est absent du dépôt,
        // ça ne doit pas empêcher le reste de l'appli d'être mis en cache hors connexion.
        Promise.all(REFERENTIELS.map(url =>
          cache.add(url).catch(() => {})
        ))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(cached => cached || fetch(evt.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
      return res;
    }).catch(() => cached))
  );
});
