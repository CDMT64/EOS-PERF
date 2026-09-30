/* EOS - service worker. Monter CACHE d'un cran a chaque mise en ligne. */
const CACHE = "eos-v1.0.0";
const FICHIERS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Reseau d'abord pour la page (pour recevoir les mises a jour),
   cache d'abord pour le reste. Hors reseau, tout vient du cache. */
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
