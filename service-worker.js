const CACHE_NAME='tc-offline-v210-20261004';
const APP_SHELL=[
  './',
  './tests-culinaires.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './css/styles.css',
  './css/correctifs.css',
  './css/fin.css',
  './js/01-v199-role-bootstrap.js',
  './js/02-bandeau-version.js',
  './js/03-v197-cache-reset.js',
  './js/04-diagnostic-demarrage-ipad.js',
  './js/05-application-principale.js',
  './js/06-v20-partage-securise-supabase-auth.js',
  './js/07-v31-assistant-guide-de-fin.js',
  './js/08-v30-repetition-generale-locale-sans.js',
  './js/09-v29-sauvegardes-automatiques-et-reprise.js',
  './js/10-v28-controle-avant-jury.js',
  './js/11-v24-preparation-materielle-imprimable.js',
  './js/12-v23-mode-jour-du-jury.js',
  './js/13-v35-centre-de-mise-en.js',
  './js/14-v34-centre-de-validation-finale.js',
  './js/15-v33-assistant-de-test-multi.js',
  './js/16-v21-qr-codes-individuels-des.js',
  './js/17-v32-diagnostic-securite-supabase-final.js',
  './js/18-v19-protection-administrateur-par-jeton.js',
  './js/19-v22-installation-pwa-et-fonctionnement.js',
  './js/20-v36-stabilisation-finale-wrappers-tardifs.js',
  './js/21-v69-navigation-simple.js',
  './js/22-v162-verrou-global-de-la.js',
  './js/23-v197-home-tools-guard.js',
  './js/24-v200-product-sheet-home-status.js',
  './js/25-protection-tactile.js'
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

  // Ne jamais mettre en cache les appels Supabase/API.
  if(url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/')){
    return;
  }

  // Navigation : réseau d'abord, puis version en cache.
  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE_NAME).then(c=>c.put('./tests-culinaires.html',copy)).catch(()=>{});
        return res
      }).catch(()=>caches.match('./tests-culinaires.html').then(r=>r||caches.match('./')))
    );
    return;
  }

  // Fichiers de l'appli (css/, js/, icônes...) : réseau d'abord, cache si hors ligne.
  // Évite de mélanger une page à jour avec d'anciens scripts après un déploiement.
  if(url.origin===self.location.origin){
    event.respondWith(
      fetch(req).then(res=>{
        if(res && res.status===200){
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(req,copy)).catch(()=>{})
        }
        return res
      }).catch(()=>caches.match(req))
    );
    return;
  }

  // Bibliothèques externes (CDN) : cache d'abord, réseau en complément.
  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached)return cached;
      return fetch(req).then(res=>{
        if(res && (res.status===200 || res.type==='opaque')){
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(req,copy)).catch(()=>{})
        }
        return res
      })
    })
  );
});
