(function(){
  function ensureHomeTools(){
    var home=document.getElementById('homeView');
    if(!home)return;
    var grid=home.querySelector('.home-command-grid');
    var wrap=home.querySelector('.home-quick-tools-v174');
    if(!wrap && grid){
      wrap=document.createElement('div');
      wrap.className='home-quick-tools-v174';
      wrap.innerHTML='<div class="home-quick-reception"><button class="home-reception-btn" id="homeReceptionBtn" type="button"><span class="quick-icon">🚚</span><span><strong>Réception chauffeur</strong><span>À réceptionner · réceptions partielles</span></span><span class="home-reception-badge" id="homeReceptionBadge">0</span></button><button class="home-reception-btn reception-history-btn" id="homeReceptionHistoryBtn" type="button"><span class="quick-icon">✅</span><span><strong>Réceptions enregistrées</strong><span>Consulter les réceptions terminées</span></span><span class="home-reception-badge" id="homeReceptionHistoryBadge">0</span></button></div><div class="home-quick-reception home-quick-products-v200"><button class="home-product-btn-v174" id="homeProductSheetsBtnV174" type="button"><span class="quick-icon">📋</span><span><strong>Fiches à compléter</strong><span>Traçabilité · conformité · annexes</span></span><span class="home-reception-badge" id="homeProductSheetsPendingBadgeV200">0</span></button><button class="home-product-btn-v174 product-history-btn-v200" id="homeProductSheetsDoneBtnV200" type="button"><span class="quick-icon">✅</span><span><strong>Fiches terminées</strong><span>Consulter les fiches produits complètes</span></span><span class="home-reception-badge" id="homeProductSheetsDoneBadgeV200">0</span></button></div>';
      grid.insertAdjacentElement('afterend',wrap);
    }
    var r=document.getElementById('homeReceptionBtn');
    var h=document.getElementById('homeReceptionHistoryBtn');
    var f=document.getElementById('homeProductSheetsBtnV174');
    if(wrap){
      wrap.style.setProperty('display','grid','important');
      wrap.style.setProperty('visibility','visible','important');
      wrap.style.setProperty('opacity','1','important');
    }
    if(r){
      r.style.setProperty('display','flex','important');
      r.onclick=function(){
        if(typeof openReceptionFromHome==='function')openReceptionFromHome();
        else alert('Réception chauffeur : moteur non chargé.');
      };
    }
    if(h){
      h.style.setProperty('display','flex','important');
      h.onclick=function(){
        if(typeof openReceptionHistoryFromHome==='function')openReceptionHistoryFromHome();
        else alert('Réceptions enregistrées : moteur non chargé.');
      };
    }
    if(f){
      f.style.setProperty('display','flex','important');
      f.onclick=function(){
        if(typeof openProductSheetsFromHomeV174==='function')openProductSheetsFromHomeV174();
        else if(typeof openProductSheets==='function')openProductSheets();
        else alert('Fiches produits : moteur non chargé.');
      };
    }
  }
  function clearOldAppCache(){
    try{
      if(window.caches&&caches.keys){
        caches.keys().then(function(keys){
          keys.forEach(function(k){
            if(String(k).indexOf('tests-culinaires')>=0)caches.delete(k);
          });
        }).catch(function(){});
      }
    }catch(e){}
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      ensureHomeTools(); clearOldAppCache();
      setTimeout(ensureHomeTools,300);
      setTimeout(ensureHomeTools,1500);
    });
  }else{
    ensureHomeTools(); clearOldAppCache();
    setTimeout(ensureHomeTools,300);
    setTimeout(ensureHomeTools,1500);
  }
})();
