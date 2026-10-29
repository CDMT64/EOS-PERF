/* PERFS - service worker.
   A chaque mise en ligne, monter CACHE d'un cran : c'est ce changement
   d'octets qui declenche l'installation de la nouvelle version. */
const CACHE = "perfs-v1.13.0";
const FICHIERS = ["./", "./index.html", "./manifest.json",
                  "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];

self.addEventListener("install", e => {
  /* pas de skipWaiting ici : la nouvelle version attend que la page
     la laisse prendre la main, pour ne pas recharger sous les doigts */
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* la page demande la main quand l'equipage touche la banniere */
self.addEventListener("message", e => {
  if (e.data === "prendre-la-main") self.skipWaiting();
});

/* Reseau d'abord pour la page, cache d'abord pour le reste.
   Hors reseau, tout vient du cache. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const page = req.mode === "navigate" || req.destination === "document";
  if (page) {
    e.respondWith(
      fetch(req).then(r => {
        const copie = r.clone();
        caches.open(CACHE).then(c => c.put(req, copie));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
