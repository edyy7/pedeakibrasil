/*
 * Service worker do PedeAí. Estratégia: rede primeiro, com cópia em cache para uso offline.
 * Para publicar uma nova versão do app, troque CACHE_VERSION: o cache antigo é apagado na ativação.
 */
const CACHE_VERSION = "pedeai-v118-6";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.indexOf("/downloads/") === 0 || req.headers.has("range")) return;
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.status === 200 && res.type === "basic") caches.open(CACHE_VERSION).then(c => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});

self.addEventListener("notificationclick", event => {
  const n = event.notification, d = n.data || {};
  n.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const msg = { tipo: "corrida-acao", acao: event.action || "abrir", id: d.id };
    if (list.length) { list[0].postMessage(msg); return list[0].focus(); }
    return self.clients.openWindow(self.registration.scope);
  }));
});
