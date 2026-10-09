// INVENTÁRIO PRO — service worker: deixa o app abrir mesmo sem internet
const CACHE='invpro-v1';
const BASE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
const CDNS=['cdnjs.cloudflare.com','cdn.jsdelivr.net','www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // O app em si: tenta a versão nova da internet; sem sinal, usa a guardada
  if(url.origin===location.origin){
    e.respondWith(fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return r;})
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
    return;
  }
  // Bibliotecas (planilha, Firebase, ícones, fonte): guarda e reaproveita
  if(CDNS.includes(url.hostname)){
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(r=>{if(r.ok||r.type==='opaque'){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return r;}).catch(()=>hit);
      return hit||net;
    }));
  }
  // Banco (Firebase) e fotos (Cloudinary) vão direto pra internet
});
