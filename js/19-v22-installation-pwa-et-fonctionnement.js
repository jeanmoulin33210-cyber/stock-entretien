/* --- V22 : installation PWA et fonctionnement réseau instable --- */
let deferredPwaPrompt=null;

function isStandalonePwa(){
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone===true
}
function updatePwaUi(){
  const online=navigator.onLine!==false,installed=isStandalonePwa();
  document.body.classList.toggle('is-offline',!online);
  const st=$('#pwaStatus');
  if(st){
    st.className='pwa-status '+(installed?'installed':online?'online':'offline');
    st.textContent=installed?'✓ Installée':online?'● En ligne':'● Hors connexion'
  }
  const showInstall=!installed&&!!deferredPwaPrompt;
  const b=$('#installPwaBtn'),c=$('#pwaInstallCard'),cb=$('#pwaInstallCardBtn');
  if(b)b.style.display=showInstall?'inline-flex':'none';
  if(c)c.style.display=installed?'none':'flex';
  if(cb){
    cb.disabled=!showInstall;
    cb.textContent=showInstall?'Installer':'Disponible après mise en ligne';
  }
}
async function installPwa(){
  if(!deferredPwaPrompt){
    alert('L’installation directe sera disponible une fois cette version mise en ligne sur GitHub Pages. Sur Android, vous pourrez aussi utiliser le menu du navigateur puis « Ajouter à l’écran d’accueil » ou « Installer l’application ».');
    return
  }
  deferredPwaPrompt.prompt();
  try{await deferredPwaPrompt.userChoice}catch(e){}
  deferredPwaPrompt=null;updatePwaUi()
}
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredPwaPrompt=e;updatePwaUi()
});
window.addEventListener('appinstalled',()=>{
  deferredPwaPrompt=null;updatePwaUi();toast('Application installée sur le téléphone ✓')
});
window.addEventListener('online',()=>{
  updatePwaUi();toast('Connexion rétablie — synchronisation en cours');
  if(typeof scheduleCloudSync==='function')scheduleCloudSync();
  if(typeof reloadCloudAnswers==='function'&&cloudReady)setTimeout(()=>reloadCloudAnswers(),500)
});
window.addEventListener('offline',()=>{
  updatePwaUi();toast('Mode hors connexion — sauvegarde locale active')
});
$('#installPwaBtn').onclick=installPwa;
$('#pwaInstallCardBtn').onclick=installPwa;

if('serviceWorker' in navigator && location.protocol==='https:'){
  window.addEventListener('load',()=>{
    let reloaded=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(reloaded)return;
      reloaded=true;
      try{
        const k='jm_tc_sw_v338a_reloaded';
        if(!sessionStorage.getItem(k)){
          sessionStorage.setItem(k,'1');
          location.reload();
        }
      }catch(e){}
    });
    navigator.serviceWorker.register('./service-worker.js?v=338a',{updateViaCache:'none'}).then(reg=>{
      try{reg.update()}catch(e){}
      console.log('Service worker actif',reg.scope)
    }).catch(err=>console.warn('Service worker non installé',err))
  })
}
updatePwaUi();


/* --- V338 : installation universelle Android + iPad/iPhone --- */
function isAppleMobilePwaDeviceV338(){
  const ua=String(navigator.userAgent||'');
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
}
function isAndroidDeviceV338(){
  return /Android/i.test(String(navigator.userAgent||''));
}
function ensureInstallHelpV338(){
  if(document.getElementById('pwaInstallHelpV338'))return document.getElementById('pwaInstallHelpV338');
  const wrap=document.createElement('div');
  wrap.id='pwaInstallHelpV338';
  wrap.style.cssText='display:none;position:fixed;inset:0;z-index:100000;background:rgba(16,38,50,.62);padding:18px;align-items:center;justify-content:center';
  wrap.innerHTML='<div style="width:min(520px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 18px 55px rgba(0,0,0,.28);font-family:Arial,sans-serif">'+
    '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">'+
      '<div><div style="font-size:12px;font-weight:900;letter-spacing:.08em;color:#628091;text-transform:uppercase">Installation</div>'+
      '<h3 id="pwaInstallHelpTitleV338" style="margin:5px 0 6px;color:#173f5c;font-size:22px">Installer Tests culinaires</h3></div>'+
      '<button id="pwaInstallHelpCloseV338" type="button" style="border:0;background:#eef3f5;border-radius:999px;width:34px;height:34px;font-size:18px;cursor:pointer">×</button>'+
    '</div>'+
    '<div id="pwaInstallHelpBodyV338" style="color:#405861;line-height:1.55;font-size:15px"></div>'+
    '<div style="margin-top:18px;background:#eef6f8;border-radius:12px;padding:12px 14px;color:#315e74;font-size:13px"><strong>Une fois installée :</strong> l’application s’ouvre depuis l’écran d’accueil, en plein écran, comme une application classique.</div>'+
  '</div>';
  document.body.appendChild(wrap);
  const close=()=>{wrap.style.display='none'};
  wrap.onclick=e=>{if(e.target===wrap)close()};
  document.getElementById('pwaInstallHelpCloseV338').onclick=close;
  return wrap;
}
function showInstallHelpV338(){
  const m=ensureInstallHelpV338();
  const title=document.getElementById('pwaInstallHelpTitleV338');
  const body=document.getElementById('pwaInstallHelpBodyV338');
  if(isAppleMobilePwaDeviceV338()){
    title.textContent='Installer sur iPad / iPhone';
    body.innerHTML='<ol style="margin:12px 0 0;padding-left:22px">'+
      '<li style="margin:8px 0">Ouvrez cette page dans <strong>Safari</strong>.</li>'+
      '<li style="margin:8px 0">Touchez le bouton <strong>Partager</strong> (carré avec une flèche vers le haut).</li>'+
      '<li style="margin:8px 0">Choisissez <strong>Sur l’écran d’accueil</strong>.</li>'+
      '<li style="margin:8px 0">Touchez <strong>Ajouter</strong>.</li>'+
    '</ol>';
  }else if(isAndroidDeviceV338()){
    title.textContent='Installer sur Android';
    body.innerHTML='<ol style="margin:12px 0 0;padding-left:22px">'+
      '<li style="margin:8px 0">Ouvrez cette page dans <strong>Chrome</strong>.</li>'+
      '<li style="margin:8px 0">Touchez le menu <strong>⋮</strong>.</li>'+
      '<li style="margin:8px 0">Choisissez <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</li>'+
      '<li style="margin:8px 0">Confirmez l’installation.</li>'+
    '</ol>';
  }else{
    title.textContent='Installer l’application';
    body.innerHTML='<p>Utilisez le menu du navigateur puis choisissez <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</p>';
  }
  m.style.display='flex';
}

const updatePwaUiBeforeV338=updatePwaUi;
updatePwaUi=function(){
  const online=navigator.onLine!==false,installed=isStandalonePwa(),apple=isAppleMobilePwaDeviceV338();
  document.body.classList.toggle('is-offline',!online);
  const st=$('#pwaStatus');
  if(st){
    st.className='pwa-status '+(installed?'installed':online?'online':'offline');
    st.textContent=installed?'✓ Installée':online?'● En ligne':'● Hors connexion';
  }
  const b=$('#installPwaBtn'),card=$('#pwaInstallCard'),cb=$('#pwaInstallCardBtn');
  if(installed){
    if(b)b.style.display='none';
    if(card)card.style.display='none';
    return;
  }
  if(card)card.style.display='flex';
  if(b){
    b.style.display='inline-flex';
    b.textContent=apple?'📲 Installer sur iPad / iPhone':'📲 Installer l’application';
  }
  if(cb){
    cb.disabled=false;
    cb.textContent=apple?'Installer sur iPad / iPhone':'Installer';
  }
  const strong=card?.querySelector('.left strong');
  const span=card?.querySelector('.left span');
  if(strong)strong.textContent=apple?'Installer « Tests culinaires » sur l’iPad / iPhone':'Installer « Tests culinaires » sur l’appareil';
  if(span)span.textContent=apple
    ?'Ajoutez l’application à l’écran d’accueil de l’iPad ou de l’iPhone. Elle s’ouvrira ensuite comme une application classique.'
    :'Installation directe sur Android, ou ajout à l’écran d’accueil selon le navigateur.';
};

installPwa=async function(){
  if(isStandalonePwa())return;
  if(isAppleMobilePwaDeviceV338()){
    showInstallHelpV338();
    return;
  }
  if(deferredPwaPrompt){
    deferredPwaPrompt.prompt();
    try{await deferredPwaPrompt.userChoice}catch(e){}
    deferredPwaPrompt=null;
    updatePwaUi();
    return;
  }
  showInstallHelpV338();
};
window.installPwa=installPwa;
window.showInstallHelpV338=showInstallHelpV338;

setTimeout(()=>{
  const b=$('#installPwaBtn'),cb=$('#pwaInstallCardBtn');
  if(b)b.onclick=installPwa;
  if(cb)cb.onclick=installPwa;
  updatePwaUi();
},0);
