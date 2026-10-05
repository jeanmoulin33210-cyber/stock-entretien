/* --- V19 : protection administrateur par jeton + PIN --- */
const ADMIN_TOKEN_STORAGE_KEY='jm_test_culinaire_admin_token_v1';
const ADMIN_UNLOCK_SESSION_KEY='jm_test_culinaire_admin_unlocked_v1';
const OWNER_TOKEN_STORAGE_KEY='jm_test_culinaire_owner_token_v1';
let adminSecurityAuthorized=false;
let adminSecurityChecking=false;
let securityOwnerAuthorized=false;
let adminRequestedView='homeView';
const rawShowView=showView;
const rawCurrentBaseUrl=currentBaseUrl;

function securityConfig(){return state?.config?.security||null}
function securityEnabled(){const s=securityConfig();return !!(s?.adminTokenHash&&s?.pinHash&&s?.pinSalt)}
function bytesToHex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('')}
function randomSecret(bytes=24){
  const arr=new Uint8Array(bytes);
  if(window.crypto?.getRandomValues)crypto.getRandomValues(arr);
  else for(let i=0;i<arr.length;i++)arr[i]=Math.floor(Math.random()*256);
  return bytesToHex(arr)
}
function fallbackHash(str){
  let h1=0x811c9dc5,h2=0x9e3779b9;
  for(let i=0;i<str.length;i++){h1^=str.charCodeAt(i);h1=Math.imul(h1,0x01000193);h2^=(str.charCodeAt(i)+i);h2=Math.imul(h2,0x85ebca6b)}
  return (h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0')
}
async function secureHash(str){
  try{
    if(window.crypto?.subtle){
      const data=new TextEncoder().encode(str);
      const digest=await crypto.subtle.digest('SHA-256',data);
      return bytesToHex(new Uint8Array(digest))
    }
  }catch(e){}
  return fallbackHash(str)
}
function storedAdminToken(){
  const q=new URLSearchParams(location.search);
  return q.get('adminToken')||localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)||''
}
function setStoredAdminToken(token){if(token)localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY,token)}
function storedOwnerToken(){
  const q=new URLSearchParams(location.search);
  return q.get('ownerToken')||localStorage.getItem(OWNER_TOKEN_STORAGE_KEY)||''
}

function setStoredOwnerToken(token){if(token)localStorage.setItem(OWNER_TOKEN_STORAGE_KEY,token)}

function ownerDeviceShareUrl(){
  if(!isSecurityOwner())throw new Error('Cet appareil n’est pas reconnu comme propriétaire.');
  if(!securityEnabled())throw new Error('Activez d’abord le PIN propriétaire.');
  if(!cloudCfg?.sessionId||!cloudCfg?.url||!cloudCfg?.key)
    throw new Error('Aucune session partagée active. Préparez d’abord les téléphones ou connectez la session Supabase.');

  const adminToken=storedAdminToken();
  const ownerToken=storedOwnerToken();
  if(!adminToken)throw new Error('Jeton administrateur introuvable sur cet appareil.');
  if(!ownerToken)throw new Error('Jeton propriétaire introuvable sur cet appareil.');

  const u=new URL(currentBaseUrl());
  u.searchParams.delete('tester');
  u.searchParams.delete('accessCode');
  u.searchParams.delete('adminToken');
  u.searchParams.delete('ownerToken');
  u.searchParams.delete('appBuild');

  u.searchParams.set('appBuild','240');
  u.searchParams.set('session',cloudCfg.sessionId);
  u.searchParams.set('supabaseUrl',cloudCfg.url);
  u.searchParams.set('supabaseKey',cloudCfg.key);
  u.searchParams.set('adminToken',adminToken);
  u.searchParams.set('ownerToken',ownerToken);
  return u.toString();
}
function closeOwnerDeviceModal(){
  $('#ownerDeviceModal')?.classList.remove('show');
}
async function openOwnerDeviceModal(){
  if(!securityEnabled()){
    alert('Activez d’abord la sécurité et votre PIN propriétaire.');
    return;
  }
  if(!isSecurityOwner()){
    await refreshOwnerAuthorization();
  }
  if(!isSecurityOwner()){
    alert('Cette fonction est réservée à l’appareil propriétaire.');
    return;
  }

  let link='';
  try{
    link=ownerDeviceShareUrl();
  }catch(e){
    alert(e.message||String(e));
    return;
  }

  const modal=$('#ownerDeviceModal');
  const qr=$('#ownerDeviceQr');
  const status=$('#ownerDeviceStatus');
  if(!modal||!qr)return;

  qr.innerHTML='';
  if(window.QRCode){
    try{
      new QRCode(qr,{
        text:link,
        width:240,
        height:240,
        correctLevel:QRCode.CorrectLevel.M
      });
      if(status)status.textContent='Scannez ce QR code avec le nouvel appareil. Il rejoindra la même session comme propriétaire.';
    }catch(e){
      if(status)status.textContent='Le QR code n’a pas pu être généré. Utilisez « Copier le lien propriétaire ».';
    }
  }else{
    if(status)status.textContent='Bibliothèque QR indisponible. Utilisez « Copier le lien propriétaire ».';
  }

  $('#ownerDeviceCopyBtn').onclick=()=>copyText(link,'Lien propriétaire copié ✓');
  modal.classList.add('show');
}

async function verifyOwnerToken(token=storedOwnerToken()){
  const s=securityConfig();
  if(!s?.ownerTokenHash||!token)return false;
  const h=await secureHash('owner:'+token);
  return h===s.ownerTokenHash
}
async function refreshOwnerAuthorization(){
  const tok=storedOwnerToken();
  securityOwnerAuthorized=await verifyOwnerToken(tok);
  if(securityOwnerAuthorized&&tok)setStoredOwnerToken(tok);
  updateSecurityButtons();
  return securityOwnerAuthorized
}
async function ensureOwnerIdentity(){
  if(!securityEnabled())return false;
  const s=securityConfig();
  if(s?.ownerTokenHash)return refreshOwnerAuthorization();
  const adminOk=adminSecurityAuthorized||await verifyAdminToken();
  if(!adminOk)return false;
  let ownerToken=storedOwnerToken();
  if(!ownerToken)ownerToken=randomSecret(24);
  const ownerTokenHash=await secureHash('owner:'+ownerToken);
  state.config.security={...s,ownerTokenHash,ownerSecurityVersion:1,ownerEnabledAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  setStoredOwnerToken(ownerToken);
  securityOwnerAuthorized=true;
  saveState();
  if(typeof syncDirtyToCloud==='function'&&cloudReady){try{await syncDirtyToCloud()}catch(e){}}
  updateSecurityButtons();
  return true
}
function isSecurityOwner(){return !!securityOwnerAuthorized}
function isAdminSessionUnlocked(){return sessionStorage.getItem(ADMIN_UNLOCK_SESSION_KEY)==='1'}
function setAdminSessionUnlocked(v){if(v)sessionStorage.setItem(ADMIN_UNLOCK_SESSION_KEY,'1');else sessionStorage.removeItem(ADMIN_UNLOCK_SESSION_KEY)}
async function verifyAdminToken(token=storedAdminToken()){
  if(!securityEnabled())return true;
  if(!token)return false;
  const h=await secureHash('admin:'+token);
  return h===securityConfig().adminTokenHash
}
async function verifyPin(pin){
  const s=securityConfig();if(!s?.pinHash||!s?.pinSalt)return false;
  const h=await secureHash('pin:'+s.pinSalt+':'+pin);
  return h===s.pinHash
}
function adminAccessState(){
  if(guestTester)return 'guest';
  if(!securityEnabled())return 'unprotected';
  if(adminSecurityChecking)return 'checking';
  /* Sur l'appareil propriétaire, le PIN doit toujours pouvoir ouvrir l'administration.
     L'absence d'un ancien jeton admin ne doit pas masquer le clavier PIN. */
  if(!adminSecurityAuthorized)return 'locked';
  if(!isAdminSessionUnlocked())return 'locked';
  return 'unlocked'
}
function sensitiveAdminView(id){return !['testerView','adminGateView','adminDeniedView'].includes(id)}
function renderAdminGate(){
  const title=$('#adminGateTitle'),txt=$('#adminGateText'),pinBox=$('#adminPinBox'),note=$('#adminGateNote'),icon=$('#adminGateIcon');
  if(!title)return;
  const access=adminAccessState();
  if(access==='checking'){
    icon.textContent='⏳';title.textContent='Vérification de l’accès';
    txt.textContent='L’application vérifie le lien administrateur et charge la session partagée.';
    pinBox.style.display='none';note.textContent='Quelques secondes peuvent être nécessaires lors de la première ouverture sur un nouvel appareil.'
  }else if(access==='denied'){
    icon.textContent='🛡️';title.textContent='Accès administrateur requis';
    txt.textContent='Ce navigateur ne possède pas le jeton administrateur de ce jury.';
    pinBox.style.display='none';note.textContent='Utilisez le lien administrateur. Les liens testeurs ne contiennent pas cette autorisation.'
  }else{
    icon.textContent='🔒';title.textContent='Administration verrouillée';
    txt.textContent='Saisissez le code PIN pour accéder aux fournisseurs, résultats, archives et réglages.';
    pinBox.style.display='block';note.textContent='Le déverrouillage reste actif uniquement pendant cette session du navigateur.';
    setTimeout(()=>$('#adminPinInput')?.focus(),50)
  }
  updateSecurityButtons()
}
showView=function(id){
  const access=adminAccessState();
  if(guestTester&&id!=='testerView')return rawShowView('testerView');
  if(sensitiveAdminView(id)&&securityEnabled()){
    adminRequestedView=id;
    if(access==='checking'||access==='locked'){document.body.classList.add('admin-locked');document.body.classList.remove('admin-denied');renderAdminGate();return rawShowView('adminGateView')}
    if(access==='denied'){document.body.classList.add('admin-denied');document.body.classList.remove('admin-locked');return rawShowView('adminDeniedView')}
  }
  document.body.classList.remove('admin-locked','admin-denied');
  return rawShowView(id)
}
async function refreshAdminAuthorization({forceGate=false}={}){
  if(guestTester){adminSecurityAuthorized=false;adminSecurityChecking=false;return false}
  if(!securityEnabled()){
    adminSecurityAuthorized=true;adminSecurityChecking=false;
    document.body.classList.remove('admin-locked','admin-denied');updateSecurityButtons();return true
  }

  /* Une fois le bon PIN saisi, une synchronisation cloud ne doit plus
     reverrouiller immédiatement l'application. */
  if(isAdminSessionUnlocked()){
    adminSecurityAuthorized=true;
    adminSecurityChecking=false;
    document.body.classList.remove('admin-locked','admin-denied');
    try{
      if(securityConfig()?.ownerTokenHash)await refreshOwnerAuthorization();
    }catch(e){}
    updateSecurityButtons();
    if(forceGate)showView(adminRequestedView||'homeView');
    return true
  }

  adminSecurityChecking=true;renderAdminGate();
  adminSecurityAuthorized=await verifyAdminToken();
  adminSecurityChecking=false;
  if(adminSecurityAuthorized){
    const tok=storedAdminToken();if(tok)setStoredAdminToken(tok)
    if(securityConfig()?.ownerTokenHash)await refreshOwnerAuthorization();
  }
  updateSecurityButtons();
  showView(adminRequestedView||'homeView');
  return adminSecurityAuthorized
}
function updateSecurityButtons(){
  const top=$('#adminLockBtn'),home=$('#adminSecurityBtn');
  const enabled=securityEnabled(),access=adminAccessState();
  if(top){
    top.classList.remove('secure','locked');
    if(!enabled)top.textContent='🔐 Activer PIN';
    else if(access==='unlocked'){
      top.textContent=isSecurityOwner()?'🔓 Propriétaire':'🔓 Admin';
      top.classList.add('secure')
    }else{
      top.textContent=isSecurityOwner()?'🔒 Propriétaire':'🔒 Admin';
      top.classList.add('locked')
    }
    top.style.display=guestTester?'none':'inline-flex'
  }
  if(home){
    home.textContent=enabled?'🔐 Modifier mon PIN':'🔐 Activer la sécurité administrateur';
    home.style.display=guestTester||enabled&&!isSecurityOwner()?'none':'inline-flex'
  }
  const ownerBtn=$('#ownerNewDeviceBtn');
  if(ownerBtn)ownerBtn.style.display=(!guestTester&&enabled&&isSecurityOwner())?'inline-flex':'none';
}
async function openSecurityModal(){
  if(guestTester)return;
  if(securityEnabled()&&adminAccessState()!=='unlocked'){adminRequestedView='homeView';showView('homeView');return}
  const enabled=securityEnabled();
  if(enabled&&!securityOwnerAuthorized)await refreshOwnerAuthorization();
  if(enabled&&!isSecurityOwner()){
    alert('Le code PIN est réservé au propriétaire de l’application. Vous pouvez utiliser l’administration, mais vous ne pouvez pas modifier le PIN.');
    return
  }
  $('#securityStatusTitle').textContent=enabled?'Modifier votre PIN propriétaire':'Choisissez votre PIN administrateur';
  $('#securityStatusText').textContent=enabled
    ?'Seul le propriétaire de l’application peut modifier ce code.'
    :'Ce PIN protège uniquement l’espace administrateur. Les testeurs n’en ont pas besoin.';
  $('#securityPin1').value='';$('#securityPin2').value='';
  $('#securityLockNowBtn').style.display=enabled?'inline-flex':'none';
  $('#securitySaveBtn').textContent=enabled?'Changer mon PIN':'Continuer';
  const ownerBtn=$('#ownerNewDeviceBtn');
  if(ownerBtn)ownerBtn.style.display=enabled&&isSecurityOwner()?'inline-flex':'none';
  $('#securityModal').classList.add('show');
  setTimeout(()=>$('#securityPin1')?.focus(),50)
}
async function saveAdminSecurity(){
  const alreadyEnabled=securityEnabled();
  if(alreadyEnabled&&!securityOwnerAuthorized)await refreshOwnerAuthorization();
  if(alreadyEnabled&&!isSecurityOwner()){
    alert('Seul le propriétaire de l’application peut modifier le code PIN.');
    return
  }
  const p1=($('#securityPin1').value||'').trim(),p2=($('#securityPin2').value||'').trim();
  if(!/^\d{4,8}$/.test(p1)){alert('Choisissez un code PIN de 4 à 8 chiffres.');return}
  if(p1!==p2){alert('Les deux codes PIN ne sont pas identiques.');return}
  let token=storedAdminToken();
  if(!token)token=randomSecret(24);
  let ownerToken=storedOwnerToken();
  if(!ownerToken)ownerToken=randomSecret(24);
  const salt=randomSecret(12);
  const tokenHash=await secureHash('admin:'+token);
  const ownerTokenHash=alreadyEnabled&&securityConfig()?.ownerTokenHash
    ?securityConfig().ownerTokenHash
    :await secureHash('owner:'+ownerToken);
  const pinHash=await secureHash('pin:'+salt+':'+p1);
  const previousCodes=state.config?.security?.testerCodes||{};
  const previous=securityConfig()||{};
  state.config.security={
    ...previous,
    version:2,
    adminTokenHash:tokenHash,
    ownerTokenHash,
    ownerSecurityVersion:1,
    pinSalt:salt,
    pinHash,
    testerCodes:previousCodes,
    serverSecurityVersion:32,
    enabledAt:previous.enabledAt||new Date().toISOString(),
    ownerEnabledAt:previous.ownerEnabledAt||new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  if(typeof ensureTesterCodes==='function')ensureTesterCodes();
  setStoredAdminToken(token);
  setStoredOwnerToken(ownerToken);
  adminSecurityAuthorized=true;
  securityOwnerAuthorized=true;
  setAdminSessionUnlocked(true);
  saveState();
  $('#securityModal').classList.remove('show');
  updateSecurityButtons();
  toast(alreadyEnabled?'PIN propriétaire modifié ✓':'Sécurité administrateur activée ✓');
  if(typeof syncDirtyToCloud==='function'&&cloudReady){try{await syncDirtyToCloud()}catch(e){}}
  if(continueShareAfterSecurity){
    continueShareAfterSecurity=false;
    setTimeout(()=>quickSharePhones(),120);
  }
}
function lockAdminNow(){
  if(!securityEnabled()){openSecurityModal();return}
  setAdminSessionUnlocked(false);$('#securityModal').classList.remove('show');
  adminRequestedView='homeView';updateSecurityButtons();showView('homeView')
}
async function unlockAdmin(){
  const pin=($('#adminPinInput').value||'').trim();
  if(!pin){toast('Saisissez votre code PIN');return}
  const ok=await verifyPin(pin);
  if(!ok){$('#adminPinInput').value='';$('#adminPinInput').focus();toast('Code PIN incorrect');return}
  /* Un PIN valide réautorise l'administration locale. */
  adminSecurityAuthorized=true;
  setAdminSessionUnlocked(true);document.body.classList.remove('admin-locked','admin-denied');$('#adminPinInput').value='';updateSecurityButtons();
  const target=adminRequestedView||'homeView';
  if(target==='homeView')renderHome();
  else if(target==='adminView')renderAdmin();
  else if(target==='archivesView')renderArchives();
  else if(target==='statsView')renderStats();
  else if(target==='closureView')renderClosure();
  else if(target==='juryView')renderJuryView();
  else if(target==='launchView')renderLaunchView();
  else if(target==='cloudView')renderCloudPage();
  else if(target==='configView')openConfig();
  else rawShowView(target);
  toast('Administration déverrouillée ✓')
}
currentBaseUrl=function(){
  const u=new URL(rawCurrentBaseUrl());
  u.searchParams.delete('adminToken');
  u.searchParams.delete('ownerToken');
  return u.toString()
}
shareUrl=function(testerNo=null){
  const u=new URL(currentBaseUrl());
  u.searchParams.set('appBuild','240');
  u.searchParams.set('session',cloudCfg.sessionId);
  u.searchParams.set('supabaseUrl',cloudCfg.url);
  u.searchParams.set('supabaseKey',cloudCfg.key);
  if(testerNo){
    const code=(typeof testerAccessCode==='function')?testerAccessCode(testerNo):'';
    u.searchParams.set('tester',testerNo);
    if(code)u.searchParams.set('accessCode',code);
    u.searchParams.delete('adminToken');u.searchParams.delete('ownerToken')
  }else{
    const tok=storedAdminToken();
    u.searchParams.delete('ownerToken');
    if(securityEnabled()&&tok)u.searchParams.set('adminToken',tok)
  }
  return u.toString()
}

/* Réévaluer l'autorisation quand une configuration sécurité arrive du cloud. */
const rawReloadCloudConfigV19=reloadCloudConfig;
reloadCloudConfig=async function(){
  await rawReloadCloudConfigV19();
  await refreshAdminAuthorization({forceGate:true})
};
const rawFetchCloudStateV19=fetchCloudState;
fetchCloudState=async function(...args){
  const r=await rawFetchCloudStateV19(...args);
  await refreshAdminAuthorization({forceGate:true});
  return r
};

$('#adminSecurityBtn').onclick=openSecurityModal;
$('#ownerNewDeviceBtn').onclick=openOwnerDeviceModal;
$('#ownerDeviceCloseBtn').onclick=closeOwnerDeviceModal;
$('#ownerDeviceModal').onclick=e=>{if(e.target.id==='ownerDeviceModal')closeOwnerDeviceModal()};
$('#adminLockBtn').onclick=()=>{
  if(!securityEnabled())openSecurityModal();
  else if(adminAccessState()==='unlocked')lockAdminNow();
  else showView('homeView')
};
$('#securityCancelBtn').onclick=()=>{continueShareAfterSecurity=false;$('#securityModal').classList.remove('show')};
$('#securityLockNowBtn').onclick=lockAdminNow;
$('#securitySaveBtn').onclick=saveAdminSecurity;
$('#securityModal').onclick=e=>{if(e.target.id==='securityModal'){continueShareAfterSecurity=false;$('#securityModal').classList.remove('show')}};
$('#adminUnlockBtn').onclick=unlockAdmin;
$('#adminPinInput').addEventListener('keydown',e=>{if(e.key==='Enter')unlockAdmin()});

(async function initAdminSecurityV19(){
  if(guestTester){
    document.body.classList.add('guest-mode');updateSecurityButtons();return
  }
  const q=new URLSearchParams(location.search);
  const hasSession=q.has('session'),hasAdminParam=q.has('adminToken');
  if(securityEnabled()){
    await refreshAdminAuthorization({forceGate:true});
    if(adminSecurityAuthorized&&!securityConfig()?.ownerTokenHash)await ensureOwnerIdentity();
    else if(securityConfig()?.ownerTokenHash)await refreshOwnerAuthorization();
    return
  }
  if(hasSession){
    /* Sur un lien partagé, ne jamais considérer l'utilisateur administrateur avant d'avoir chargé la vraie configuration. */
    adminSecurityAuthorized=false;adminSecurityChecking=true;adminRequestedView='homeView';renderAdminGate();rawShowView('adminGateView');
    let attempts=0;
    const timer=setInterval(async()=>{
      attempts++;
      if(securityEnabled()||cloudReady||attempts>25){
        clearInterval(timer);adminSecurityChecking=false;
        if(securityEnabled())await refreshAdminAuthorization({forceGate:true});
        else{
          /* Ancienne session non protégée : seulement le lien explicitement administrateur peut continuer. */
          adminSecurityAuthorized=!!hasAdminParam;
          if(adminSecurityAuthorized){setAdminSessionUnlocked(true);renderHome()}
          else{document.body.classList.add('admin-denied');rawShowView('adminDeniedView')}
        }
      }
    },300);
    return
  }
  /* Installation locale / première configuration avant partage. */
  adminSecurityAuthorized=true;updateSecurityButtons()
})();
