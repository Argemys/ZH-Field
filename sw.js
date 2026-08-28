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

// Installation du nouveau service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Gestion des requêtes
self.addEventListener('fetch', event => {
  const request = event.request;

  // On ne gère que les requêtes GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Pages HTML : réseau en priorité
  // Cela permet de récupérer immédiatement les nouvelles versions.
  const isHTML =
    request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html');

  // Référentiels : réseau en priorité également
  const isReference =
    url.pathname.endsWith('/corine_biotopes.json') ||
    url.pathname.endsWith('/catalogue_flore_alslor_floragis_zh.json');

  if (isHTML || isReference) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy));
          }

          return response;
        })
        .catch(() => {
          return caches.match(request, { ignoreSearch: true })
            .then(cached => {
              return cached || caches.match('./index.html');
            });
        })
    );

    return;
  }

  // Autres ressources : cache en priorité
  // puis réseau si elles ne sont pas disponibles.
  event.respondWith(
    caches.match(request, { ignoreSearch: true })
      .then(cached => {
        if (cached) {
          return cached;
        }

        return fetch(request)
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, copy));
            }

            return response;
          });
      })
  );
});
