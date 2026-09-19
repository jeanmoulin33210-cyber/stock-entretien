const CACHE_NAME='tests-culinaires-v36-20260919';
const APP_SHELL=[
  './',
  './tests-culinaires.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).catch(()=>Promise.resolve())
  );
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;

  const url=new URL(req.url);

  if(
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/')
  ){
    return;
  }

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE_NAME)
          .then(c=>c.put('./tests-culinaires.html',copy))
          .catch(()=>{});
        return res;
      }).catch(()=>
        caches.match('./tests-culinaires.html')
          .then(r=>r||caches.match('./'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached)return cached;

      return fetch(req).then(res=>{
        if(res && (res.status===200 || res.type==='opaque')){
          const copy=res.clone();
          caches.open(CACHE_NAME)
            .then(c=>c.put(req,copy))
            .catch(()=>{});
        }
        return res;
      });
    })
  );
});
