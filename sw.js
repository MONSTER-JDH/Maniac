/* Офлайн-кэш: игра открывается без интернета (онлайн-комнаты по-прежнему требуют сеть) */
const V='maniac-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png',
 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.allSettled(CORE.map(u=>c.add(new Request(u,u.startsWith('http')?{mode:'no-cors'}:{}))))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  const same=u.origin===location.origin,cdn=u.hostname==='cdn.jsdelivr.net';
  if(!same&&!cdn)return; /* сигнальный сервер PeerJS и TURN не трогаем */
  if(r.mode==='navigate'||(same&&/index\.html$/.test(u.pathname))){
    /* страница: сначала сеть (чтобы обновления доходили), без сети — из кэша */
    e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x}).catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x})));
});
