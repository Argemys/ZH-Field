const CACHE_NAME = 'zh-app-v5';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];
const REFERENTIELS = ['./corine_biotopes.json', './catalogue_flore_alslor_floragis_zh.json', './catalogue_flore_champagne_ardenne.json'];
// Fichiers pour lesquels on veut TOUJOURS la dernière version en ligne quand le réseau est
// disponible (le HTML de l'appli + les référentiels) : évite le problème récurrent de cache
// périmé après une mise à jour sur GitHub. Le cache ne sert alors que de secours hors connexion.
const NETWORK_FIRST = ['./index.html', ...REFERENTIELS];

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

function isNetworkFirst(request){
  if(request.mode === 'navigate') return true;
  return NETWORK_FIRST.some(path => request.url.endsWith(path.replace('./','')));
}

self.addEventListener('fetch', evt => {
  const req = evt.request;

  if(isNetworkFirst(req)){
    evt.respondWith(
      fetch(req, {cache:'no-cache'}).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  evt.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});
