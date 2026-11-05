const CACHE_VERSION="pedeai-v5.9.8";
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
 const u=new URL(e.request.url),mesma=u.origin===location.origin,ext=/^(www|fonts)\.gstatic\.com$|^fonts\.googleapis\.com$/.test(u.hostname);if(!mesma&&!ext)return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE_VERSION).then(k=>k.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(m=>m||(mesma?caches.match(e.request,{ignoreSearch:true}):undefined))))});
/* Push (FCM, só dados): o servidor manda title/body/tag/icone; o SW mostra a notificação mesmo com o app fechado. */
self.addEventListener("push",e=>{let d={};try{const j=e.data?e.data.json():{};d=j.data||j.notification||j}catch(_){}
 e.waitUntil(self.registration.showNotification(d.title||"PedeAí",{body:d.body||"",tag:d.tag||"pedeai",renotify:true,requireInteraction:true,vibrate:[300,120,300,120,300],icon:"icon-"+(d.icone||"cliente")+"-192.png",badge:"icon-"+(d.icone||"cliente")+"-192.png",data:{url:d.url||"./"}}))});
self.addEventListener("notificationclick",e=>{e.notification.close();const u=new URL((e.notification.data&&e.notification.data.url)||"./",self.registration.scope).href,path=new URL(u).pathname;
 e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const c of l){let p="";try{p=new URL(c.url).pathname}catch(_){}
  if(p===path&&"focus"in c)return c.focus().then(w=>w&&w.navigate?w.navigate(u).catch(()=>w):w)}
  return self.clients.openWindow(u)}))});
