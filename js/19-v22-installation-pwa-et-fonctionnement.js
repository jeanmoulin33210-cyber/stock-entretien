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
        const k='jm_tc_sw_v325a_reloaded';
        if(!sessionStorage.getItem(k)){
          sessionStorage.setItem(k,'1');
          location.reload();
        }
      }catch(e){}
    });
    navigator.serviceWorker.register('./service-worker.js?v=325a',{updateViaCache:'none'}).then(reg=>{
      try{reg.update()}catch(e){}
      console.log('Service worker actif',reg.scope)
    }).catch(err=>console.warn('Service worker non installé',err))
  })
}
updatePwaUi();
