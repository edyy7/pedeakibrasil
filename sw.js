const CACHE_VERSION="pedeai-v5.4.3";
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok&&new URL(e.request.url).origin===location.origin){const c=r.clone();caches.open(CACHE_VERSION).then(k=>k.put(e.request,c))}return r}).catch(()=>caches.match(e.request)))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const c of l){if("focus"in c)return c.focus()}return self.clients.openWindow("./")}))});
