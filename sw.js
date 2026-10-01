// Aumente a versão sempre que mudar algum ficheiro em PRECACHE.
const VERSION = "flipclock-v1";
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./flip_animation.css",
  "./app.js",
  "./lofi-config.js",
  "./manifest.json",
  "./images/favicon.png",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "./images/icon-maskable-512.png",
  "./images/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;

  // Navegação: network-first, com fallback para o index em cache (offline).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Restantes recursos (próprios e CDN de fontes/ícones): cache-first,
  // guardando em cache o que vier da rede. Iframes de vídeo (YouTube etc.) ficam de fora.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res && (res.ok || res.type === "opaque")) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached)
    )
  );
});
