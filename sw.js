// Mi Olivar: funciona sin conexión guardando la app en el dispositivo.
const CACHE = "mi-olivar-v1.1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // La app (index.html): primero la red para recibir actualizaciones; si no hay conexión, la copia guardada.
  if (url.origin === location.origin && (req.mode === "navigate" || url.pathname.endsWith("/index.html"))) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put("./index.html", c)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Librerías y ficheros propios: primero la copia guardada.
  if (url.origin === location.origin || url.hostname === "cdnjs.cloudflare.com") {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; })));
  }
  // Google, Catastro, IGN y mapas: siempre en línea (no se guardan).
});
