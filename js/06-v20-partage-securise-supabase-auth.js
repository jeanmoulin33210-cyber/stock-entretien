/* --- V20 : partage sécurisé Supabase Auth + RLS --- */
const CLOUD_STORAGE_KEY='jm_test_culinaire_cloud_v1';
const CLOUD_ACCESS_STORAGE_KEY='jm_test_culinaire_access_v20';
/* V68 — paramètres publics Supabase préconfigurés.
   Le projet URL et la clé publishable peuvent être présents dans le frontend.
   Les identifiants de session, codes testeurs, jeton admin et PIN ne sont jamais préremplis ici. */
const DEFAULT_SUPABASE_URL='https://avhyoujlplwkuccvhnvz.supabase.co';
const DEFAULT_SUPABASE_KEY='sb_publishable_63ZJtw7uGovMEiZgX8V8zg_02TdkDGY';
let cloudCfg={url:DEFAULT_SUPABASE_URL,key:DEFAULT_SUPABASE_KEY,sessionId:'',accessCode:''};
let cloudClient=null,cloudReady=false,cloudChannel=null,cloudPresenceChannel=null,cloudSyncTimer=null;
let cloudPresenceState={},testerActivityMeta={};
let lastCloudConfigHash='',lastCloudAnswerHashes=new Map(),cloudBusy=false,guestTester=null;
/* V323 — aucune demande de synchro/rafraîchissement ne doit être perdue
   lorsqu'une opération cloud est déjà en cours. */
let cloudSyncPendingV323=false,cloudConfigReloadPendingV323=false,cloudAnswersReloadPendingV323=false;
let cloudRole=null,cloudTesterNo=null,cloudUserId=null,cloudSecure=true;
const originalSaveState=saveState;
const originalRenderHome=renderHome;
const originalRenderAdmin=renderAdmin;
const originalClearAnswers=clearAnswers;

function loadCloudCfg(){
  try{cloudCfg={...cloudCfg,...JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY)||'{}')}}catch(e){}
  if(!String(cloudCfg.url||'').trim())cloudCfg.url=DEFAULT_SUPABASE_URL;
  if(!String(cloudCfg.key||'').trim())cloudCfg.key=DEFAULT_SUPABASE_KEY;
  try{
    const a=JSON.parse(localStorage.getItem(CLOUD_ACCESS_STORAGE_KEY)||'{}');
    if(a?.sessionId===cloudCfg.sessionId&&a?.accessCode)cloudCfg.accessCode=a.accessCode
  }catch(e){}
  const q=new URLSearchParams(location.search);
  if(q.get('supabaseUrl')) cloudCfg.url=q.get('supabaseUrl');
  if(q.get('supabaseKey')) cloudCfg.key=q.get('supabaseKey');
  if(q.get('session')) cloudCfg.sessionId=q.get('session');

  /* V199 — le rôle demandé par le lien gagne TOUJOURS sur un ancien rôle local. */
  const forcedRole=window.__JM_REQUESTED_ROLE_V199||'';
  const ownerOrAdminLink=forcedRole==='admin'||!!(q.get('ownerToken')||q.get('adminToken'));
  if(ownerOrAdminLink){
    guestTester=null;
    cloudCfg.accessCode='';
  }else if(forcedRole.indexOf('tester:')===0||q.get('tester')){
    guestTester=forcedRole.indexOf('tester:')===0?Math.max(1,Number(forcedRole.split(':')[1])||1):Math.max(1,Number(q.get('tester'))||1);
    if(q.get('accessCode'))cloudCfg.accessCode=q.get('accessCode');
  }
}
function saveCloudCfg(){
  localStorage.setItem(CLOUD_STORAGE_KEY,JSON.stringify({url:cloudCfg.url,key:cloudCfg.key,sessionId:cloudCfg.sessionId}));
  if(cloudCfg.sessionId&&cloudCfg.accessCode)localStorage.setItem(CLOUD_ACCESS_STORAGE_KEY,JSON.stringify({sessionId:cloudCfg.sessionId,accessCode:cloudCfg.accessCode}));
}
function hashJson(v){try{return JSON.stringify(v)}catch(e){return String(Date.now())}}
function cloudSessionShortV327(){
  const sid=String(cloudCfg?.sessionId||state?.config?._shareSessionId||state?.config?.juryLaunch?.sessionId||'').trim();
  if(!sid)return '';
  return sid.replace(/[^a-zA-Z0-9]/g,'').slice(-4).toUpperCase();
}
function setCloudStatus(kind='local',text='● Local'){
  const els=[document.getElementById('cloudStatus'),document.getElementById('cloudPageStatus')].filter(Boolean);
  const code=(kind==='online'||kind==='syncing')?cloudSessionShortV327():'';
  const shown=code?text+' · '+code:text;
  els.forEach(el=>{
    el.className='cloud-status'+(kind==='online'?' online':kind==='syncing'?' syncing':kind==='error'?' error':'');
    el.textContent=shown;
    if(code)el.title='Session sécurisée '+code;
  });
}
function cloudMsg(text,kind='warn'){
  const el=document.getElementById('cloudMessage');if(!el)return;
  el.className=`connection-banner show ${kind}`;el.textContent=text;
}
function serverSecurityStatus(title,text,ok=true){
  const a=$('#serverSecurityTitle'),b=$('#serverSecurityText'),box=$('#serverSecurityBox');
  if(a)a.textContent=title;if(b)b.textContent=text;
  if(box){box.style.background=ok?'#f1faf6':'#fff5e8';box.style.borderColor=ok?'#c6e5d7':'#f0d7aa'}
}
function bindAdminSyncButtonsV330(){
  const push=(document.getElementById('forcePushAdminStateV328Btn')||document.getElementById('forcePushAdminStateV330Btn'));
  const pull=(document.getElementById('forceReloadAdminStateV328Btn')||document.getElementById('forceReloadAdminStateV330Btn'));

  if(push){
    push.type='button';
    push.onclick=function(e){
      return forcePushAdminStateV331(e);
    };
  }

  if(pull){
    pull.type='button';
    pull.onclick=async function(e){
      try{
        e?.preventDefault?.();
        e?.stopPropagation?.();
        await forceReloadAdminStateV328();
      }catch(err){
        console.error(err);
        alert('Impossible de lancer le rechargement depuis la session. '+(err?.message||err||''));
      }
    };
  }
}

function renderCloudPage(){
  showView('cloudView');$('#headerTitle').textContent='Partage téléphones';$('#headerSub').textContent='Synchronisation sécurisée des testeurs';
  $('#cloudUrl').value=cloudCfg.url||'';$('#cloudKey').value=cloudCfg.key||'';$('#cloudSession').value=cloudCfg.sessionId||'';
  if(cloudReady)serverSecurityStatus(`Sécurité serveur active · ${cloudRole==='admin'?'Administrateur':`Testeur ${cloudTesterNo||''}`}`,`Utilisateur Supabase authentifié. RLS limite les données accessibles à ce rôle.`,true);
  else serverSecurityStatus('Sécurité serveur V32','Supabase Auth + rôles + RLS. Le script SQL V20 doit avoir été exécuté et les connexions anonymes activées.',true);
  renderShareLinks();
  refreshAdminSyncLabelsV328();
  bindAdminSyncButtonsV330();
}
function currentBaseUrl(){
  const publicStableUrl='https://jeanmoulin33210-cyber.github.io/stock-entretien/tests-culinaires.html';
  try{
    const u=new URL(location.href);
    const isRealWeb=/^https?:$/.test(u.protocol)&&!/^(localhost|127\.0\.0\.1)$/i.test(u.hostname);
    if(!isRealWeb)return publicStableUrl;
    ['tester','session','supabaseUrl','supabaseKey','accessCode','adminToken','ownerToken','utm_source','utm_medium','utm_campaign'].forEach(k=>u.searchParams.delete(k));
    u.hash='';
    return u.toString()
  }catch(e){
    return publicStableUrl
  }
}
function getRawAdminTokenV20(){
  const q=new URLSearchParams(location.search);
  return q.get('adminToken')||localStorage.getItem('jm_test_culinaire_admin_token_v1')||''
}
function secureRandomCode(bytes=18){
  const arr=new Uint8Array(bytes);crypto.getRandomValues(arr);return [...arr].map(b=>b.toString(16).padStart(2,'0')).join('')
}
function ensureTesterCodes(){
  if(!state.config.security)state.config.security={};
  const s=state.config.security;
  if(!s.testerCodes||typeof s.testerCodes!=='object')s.testerCodes={};
  const keep={};
  for(let i=1;i<=Number(state.config.testerCount||0);i++)keep[i]=s.testerCodes[i]||s.testerCodes[String(i)]||secureRandomCode(18);
  s.testerCodes=keep;s.serverSecurityVersion=32;
  return keep
}
function testerAccessCode(no){
  const c=state.config?.security?.testerCodes||{};
  return c[no]||c[String(no)]||''
}
function makePublicCloudConfig(cfg){
  const products=(cfg.products||[]).map(p=>({
    id:p.id,code:p.code||'',name:p.name||'',color:p.color||'',
    samples:(p.samples||[]).map(s=>({id:s.id}))
  }));
  const instanceId=juryInstanceId(cfg);
  return{
    lotName:cfg.lotName||'',
    subtitle:cfg.subtitle||'',
    testerCount:Number(cfg.testerCount||0),
    testerNames:Array.isArray(cfg.testerNames)?cfg.testerNames:[],
    products,
    juryInstanceId:instanceId||'',
    juryLaunch:cfg.juryLaunch?.openedAt?{openedAt:cfg.juryLaunch.openedAt,instanceId:String(cfg.juryLaunch.instanceId||'')}:null,
    juryClose:cfg.juryClose?.closedAt?{closedAt:cfg.juryClose.closedAt}:null,
    marketRef:cfg.marketRef?{lot:cfg.marketRef.lot||'',family:cfg.marketRef.family||''}:null
  }
}
function currentShareBuildV279(){
  try{
    const badge=String(document.getElementById('appBuildBadge')?.textContent||'');
    const m=badge.match(/v(\d+)/i);
    if(m)return m[1];
  }catch(e){}
  return '279';
}
function shareUrl(testerNo=null){
  const u=new URL(currentBaseUrl());
  /* V279 — ne plus figer les téléphones sur une ancienne version (v268). */
  u.searchParams.set('appBuild',currentShareBuildV279());
  u.searchParams.set('session',cloudCfg.sessionId);
  u.searchParams.set('supabaseUrl',cloudCfg.url);
  u.searchParams.set('supabaseKey',cloudCfg.key);
  if(testerNo){
    const code=testerAccessCode(testerNo);
    u.searchParams.set('tester',testerNo);
    if(code)u.searchParams.set('accessCode',code)
  }
  return u.toString()
}
async function copyText(text,msg='Lien copié'){
  try{await navigator.clipboard.writeText(text);toast(msg)}catch(e){prompt('Copiez ce lien :',text)}
}
function renderShareLinks(){
  const box=$('#testerShareLinks');if(!box)return;box.innerHTML='';
  if(!cloudCfg.url||!cloudCfg.key||!cloudCfg.sessionId){box.innerHTML='<div class="empty" style="grid-column:1/-1">Connectez d’abord une session partagée.</div>';return}
  if(cloudRole!=='admin'&&cloudReady){box.innerHTML='<div class="empty" style="grid-column:1/-1">Les liens testeurs sont réservés à l’administrateur.</div>';return}
  ensureTesterCodes();
  for(let i=1;i<=state.config.testerCount;i++){
    const name=state.testers[i]?.name||`Testeur ${i}`,code=testerAccessCode(i);
    const d=document.createElement('div');d.className='share-card';
    d.innerHTML=`<strong>${escapeHtml(name)}</strong><span>Accès sécurisé testeur ${i}${code?' · code prêt':''}</span><button class="btn btn-primary btn-small">Copier le lien</button>`;
    d.querySelector('button').onclick=()=>copyText(shareUrl(i),`Lien ${name} copié`);box.appendChild(d)
  }
}
const RECOVERED_AUTH_MAP_KEY_V250='jm_tc_recovered_auth_map_v250';
function recoveredAuthStorageMapV250(){
  try{
    const raw=JSON.parse(localStorage.getItem(RECOVERED_AUTH_MAP_KEY_V250)||'{}');
    return raw&&typeof raw==='object'?raw:{};
  }catch(e){return{}}
}
function rememberRecoveredAuthStorageKeyV250(sessionId,storageKey){
  sessionId=String(sessionId||'').trim();
  storageKey=String(storageKey||'').trim();
  if(!sessionId||!storageKey)return;
  const map=recoveredAuthStorageMapV250();
  map[sessionId]=storageKey;
  try{localStorage.setItem(RECOVERED_AUTH_MAP_KEY_V250,JSON.stringify(map))}catch(e){}
}
function cloudAuthStorageKey(){
  const wanted=requestedCloudIdentity();

  /* V250 — lorsqu'une ancienne identité administrateur a été retrouvée,
     réutiliser exactement sa clé Supabase lors des prochains rechargements. */
  if(wanted?.role!=='tester'){
    try{
      const mapped=recoveredAuthStorageMapV250()[String(cloudCfg.sessionId||'').trim()];
      if(mapped)return String(mapped);
    }catch(e){}
  }

  const project=String(cloudCfg.url||'').replace(/\W+/g,'-').slice(-28)||'project';
  const session=String(cloudCfg.sessionId||'local').replace(/\W+/g,'-').slice(-24)||'session';
  const role=wanted?.role==='tester' ? `tester-${wanted.testerNo||1}` : wanted?.role==='admin' ? 'admin-owner' : 'neutral';
  return `jm-tc-auth-${project}-${session}-${role}`;
}
function buildCloudClient(){
  if(!cloudCfg.url||!cloudCfg.key)throw new Error('Renseignez le Project URL et la clé publique Supabase.');
  if(!window.supabase?.createClient)throw new Error('La bibliothèque Supabase n’a pas pu être chargée.');

  /* V198 — une identité Supabase distincte par session ET par rôle.
     Ainsi le même téléphone peut être T1, T2 puis Propriétaire sans effacer Chrome. */
  const storageKey=cloudAuthStorageKey();
  cloudClient=window.supabase.createClient(cloudCfg.url.trim(),cloudCfg.key.trim(),{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey}
  })
}
async function ensureCloudAuth(){
  let {data:{session},error}=await cloudClient.auth.getSession();if(error)throw error;
  if(!session?.user){
    const r=await cloudClient.auth.signInAnonymously();
    if(r.error){
      const msg=String(r.error.message||r.error);
      if(/anonymous|disabled|signup/i.test(msg))throw new Error('Supabase Auth : activez « Anonymous Sign-Ins » dans Authentication > Providers > Anonymous, puis réessayez.');
      throw r.error
    }
    session=r.data.session
  }
  cloudUserId=session?.user?.id||null;
  if(!cloudUserId)throw new Error('Impossible d’obtenir l’identité Supabase de cet appareil.');
  return cloudUserId
}
async function membershipForCurrentUser(){
  const {data,error}=await cloudClient.from('test_culinaire_memberships').select('role,tester_no').eq('session_id',cloudCfg.sessionId).maybeSingle();
  if(error)throw error;
  return data||null
}
function rpcsMissing(error){
  const s=String(error?.message||error||'');
  return /function .* does not exist|schema cache|PGRST202|42883/i.test(s)
}
function requestedCloudIdentity(){
  const forced=window.__JM_REQUESTED_ROLE_V199||'';
  if(forced.indexOf('tester:')===0)return {role:'tester',testerNo:Math.max(1,Number(forced.split(':')[1])||1)};
  if(forced==='admin')return {role:'admin',testerNo:null};
  const q=new URLSearchParams(location.search);
  if(q.get('tester'))return {role:'tester',testerNo:Math.max(1,Number(q.get('tester'))||1)};
  if(q.get('adminToken')||q.get('ownerToken'))return {role:'admin',testerNo:null};
  return null;
}
async function rotateAnonymousCloudIdentity(){
  try{await cloudClient.auth.signOut({scope:'local'})}catch(e){}
  const r=await cloudClient.auth.signInAnonymously();
  if(r.error)throw r.error;
  cloudUserId=r.data?.session?.user?.id||null;
  if(!cloudUserId)throw new Error('Impossible de créer une nouvelle identité sécurisée pour cet accès.');
  return cloudUserId;
}
function membershipMatchesRequestedIdentity(m,wanted){
  if(!m||!wanted)return true;
  if(wanted.role==='admin')return m.role==='admin';
  return m.role==='tester'&&Number(m.tester_no||0)===Number(wanted.testerNo||0);
}
async function joinSecureSession(){
  const wanted=requestedCloudIdentity();
  let m=await membershipForCurrentUser();

  /* V197 — le lien ouvert est prioritaire sur l'identité anonyme mémorisée.
     Un téléphone peut donc passer Propriétaire -> T1 -> T2 -> Propriétaire
     sans vider Chrome ni les données du site. Chaque changement de rôle crée
     automatiquement une nouvelle identité Supabase, puis vérifie le code du lien. */
  if(m&&wanted&&!membershipMatchesRequestedIdentity(m,wanted)){
    await rotateAnonymousCloudIdentity();
    m=null;
  }

  if(m){cloudRole=m.role;cloudTesterNo=m.tester_no||null;return m}
  if(guestTester){
    if(!cloudCfg.accessCode)throw new Error('Lien testeur incomplet : le code d’accès sécurisé est absent. Demandez un nouveau lien à l’administrateur.');
    const {data,error}=await cloudClient.rpc('test_culinaire_join_session',{p_session_id:cloudCfg.sessionId,p_code:cloudCfg.accessCode,p_tester_no:guestTester});
    if(error){if(rpcsMissing(error))throw new Error('Le script SQL de sécurité V32 n’est pas encore installé dans Supabase.');throw error}
    m=Array.isArray(data)?data[0]:data
  }else{
    const adminCode=getRawAdminTokenV20();
    if(!adminCode)throw new Error('Lien administrateur incomplet : autorisation administrateur absente.');
    let r=await cloudClient.rpc('test_culinaire_join_session',{p_session_id:cloudCfg.sessionId,p_code:adminCode,p_tester_no:null});
    if(r.error){
      if(rpcsMissing(r.error))throw new Error('Le script SQL de sécurité V32 n’est pas encore installé dans Supabase.');
      /* Migration d'une ancienne session : V32 exige une preuve administrateur V19.
         Une session plus ancienne, sans cette preuve, n'est jamais "revendiquée" automatiquement. */
      const up=await cloudClient.rpc('test_culinaire_upgrade_legacy_session',{p_session_id:cloudCfg.sessionId,p_admin_code:adminCode});
      if(up.error){
        const um=String(up.error.message||up.error);
        if(/legacy_session_has_no_admin_proof/i.test(um))
          throw new Error('Cette ancienne session ne contient pas de preuve administrateur vérifiable. Par sécurité, elle ne peut pas être convertie automatiquement. Conservez vos données locales et cliquez sur « Créer une nouvelle session sécurisée ».');
        if(/invalid_legacy_admin_proof/i.test(um))
          throw new Error('La preuve administrateur de cette ancienne session ne correspond pas à ce navigateur. Ne forcez pas la migration : créez une nouvelle session sécurisée depuis vos données locales.');
        if(/session_already_secured/i.test(um))
          throw new Error('Cette session est déjà sécurisée. Le lien administrateur utilisé n’est pas autorisé.');
        throw up.error
      }
      const codes=up.data?.tester_codes||up.data?.testerCodes||up.data||{};
      if(codes&&typeof codes==='object'){
        if(!state.config.security)state.config.security={};
        state.config.security.testerCodes={...codes};
        state.config.security.serverSecurityVersion=32;
        originalSaveState()
      }
      r=await cloudClient.rpc('test_culinaire_join_session',{p_session_id:cloudCfg.sessionId,p_code:adminCode,p_tester_no:null});
      if(r.error)throw r.error
    }
    m=Array.isArray(r.data)?r.data[0]:r.data
  }
  m=m||await membershipForCurrentUser();
  if(!m)throw new Error('Autorisation de session introuvable.');
  cloudRole=m.role;cloudTesterNo=m.tester_no||null;return m
}

function updateTesterActivityFromRows(rows=[]){
  const next={...testerActivityMeta};
  rows.forEach(r=>{
    const t=Number(r.tester_no);if(!t||!r.updated_at)return;
    const old=next[t]||{};
    const at=String(r.updated_at);
    const item={...old};
    if(!item.lastAt||at>item.lastAt)item.lastAt=at;
    if(r.product_id!=='__meta__'&&(!item.lastSampleAt||at>item.lastSampleAt)){
      item.lastSampleAt=at;item.productId=r.product_id;item.sampleId=r.sample_id
    }
    next[t]=item
  });
  testerActivityMeta=next
}
function testerPresenceNumbers(){
  const set=new Set();
  Object.values(cloudPresenceState||{}).flat().forEach(p=>{
    if(p&&p.role==='tester'&&Number(p.tester_no)>0)set.add(Number(p.tester_no))
  });
  return set
}
function refreshLiveDayIfOpen(){if(document.getElementById('liveDayView')?.classList.contains('active'))renderLiveDayCards()}

function productSheetRichnessV256(cfg){
  const store=cfg&&cfg.productSheets;
  if(!store||typeof store!=='object')return {filled:0,nonEmpty:0,total:0};

  const vals=Object.values(store);
  let filled=0,nonEmpty=0;
  for(const rec of vals){
    if(!rec||typeof rec!=='object')continue;

    const required=[
      'brand','characteristics','labeling','weight','technicalSheet',
      'deliveryTempConformity','packagingConformity','supplierLot','deliveryTemp'
    ];
    const complete=required.every(k=>String(rec[k]??'').trim()) &&
      !!(String(rec.ddm||'').trim()||String(rec.dlc||'').trim());

    if(complete)filled++;

    if(Object.keys(rec).some(k=>
      !['productId','sampleId','supplier'].includes(k) &&
      String(rec[k]??'').trim()
    ))nonEmpty++;
  }
  return {filled,nonEmpty,total:vals.length};
}

function preserveRicherAdminLocalDataV256(cfg,prev){
  if(!cfg||!prev)return cfg;

  try{
    const remote=productSheetRichnessV256(cfg);
    const local=productSheetRichnessV256(prev);

    if(
      local.filled>remote.filled ||
      (local.filled===remote.filled && local.nonEmpty>remote.nonEmpty)
    ){
      if(prev.productSheets&&typeof prev.productSheets==='object'){
        cfg.productSheets=deepClone(prev.productSheets);
      }
    }
  }catch(e){}

  try{
    const remoteRec=Array.isArray(cfg.receptions)?cfg.receptions:[];
    const localRec=Array.isArray(prev.receptions)?prev.receptions:[];
    if(localRec.length>remoteRec.length){
      cfg.receptions=deepClone(localRec);
    }
    if(!cfg.receptionEstablishment && prev.receptionEstablishment){
      cfg.receptionEstablishment=prev.receptionEstablishment;
    }
  }catch(e){}

  return cfg;
}

function preserveRicherAdminWorkflowV323(cfg,prev){
  if(!cfg||!prev)return cfg;

  function newer(localTs,remoteTs){
    localTs=String(localTs||'');remoteTs=String(remoteTs||'');
    return !!localTs&&(!remoteTs||localTs>remoteTs);
  }
  function closureScore(x){
    if(!x||typeof x!=='object')return 0;
    return ['date','place','chair','chairRole','coSigner','coSignerRole','notes','chairSignature','coSignature']
      .reduce((n,k)=>n+(String(x[k]||'').trim()?1:0),0);
  }
  function occenaScore(x){
    if(!x||typeof x!=='object')return 0;
    const items=x.items&&typeof x.items==='object'?Object.values(x.items):[];
    const done=items.filter(v=>v&&typeof v==='object'&&String(v.checkedAt||'').trim()).length;
    const scores=x.supplierScores&&typeof x.supplierScores==='object'
      ?Object.values(x.supplierScores).filter(v=>String(v||'').trim()).length:0;
    return done*10+scores;
  }

  try{
    const lc=prev.closure&&typeof prev.closure==='object'?prev.closure:null;
    const rc=cfg.closure&&typeof cfg.closure==='object'?cfg.closure:null;
    if(lc && (
      closureScore(lc)>closureScore(rc) ||
      newer(lc.updatedAt,rc&&rc.updatedAt)
    )){
      cfg.closure=deepClone(lc);
    }
  }catch(e){}

  try{
    const localConclusion=String(prev.juryConclusion||'').trim();
    const remoteConclusion=String(cfg.juryConclusion||'').trim();
    if(localConclusion && (
      !remoteConclusion ||
      newer(prev.juryConclusionUpdatedAt,cfg.juryConclusionUpdatedAt)
    )){
      cfg.juryConclusion=prev.juryConclusion;
      cfg.juryConclusionUpdatedAt=prev.juryConclusionUpdatedAt||cfg.juryConclusionUpdatedAt||'';
    }
  }catch(e){}

  try{
    const localNote=String(prev.reportNote||'').trim();
    const remoteNote=String(cfg.reportNote||'').trim();
    if(localNote && (
      !remoteNote ||
      newer(prev.reportNoteUpdatedAt,cfg.reportNoteUpdatedAt)
    )){
      cfg.reportNote=prev.reportNote;
      cfg.reportNoteUpdatedAt=prev.reportNoteUpdatedAt||cfg.reportNoteUpdatedAt||'';
    }
  }catch(e){}

  try{
    const lo=prev.occenaControl&&typeof prev.occenaControl==='object'?prev.occenaControl:null;
    const ro=cfg.occenaControl&&typeof cfg.occenaControl==='object'?cfg.occenaControl:null;
    if(lo && (
      occenaScore(lo)>occenaScore(ro) ||
      newer(lo.updatedAt,ro&&ro.updatedAt)
    )){
      cfg.occenaControl=deepClone(lo);
    }
  }catch(e){}

  try{
    if(prev.juryClose?.closedAt && !cfg.juryClose?.closedAt){
      cfg.juryClose=deepClone(prev.juryClose);
    }
  }catch(e){}

  return cfg;
}

function restoreAdminShareMetadataV248(cfg,previousCfg=null){
  if(!cfg||typeof cfg!=='object'||cloudRole!=='admin')return cfg;

  const prev=previousCfg&&typeof previousCfg==='object'?previousCfg:{};

  /* V256 — ne jamais écraser une fiche produit locale plus complète
     par une configuration cloud moins riche. */
  preserveRicherAdminLocalDataV256(cfg,prev);
  preserveRicherAdminWorkflowV323(cfg,prev);

  const sid=String(
    cfg._shareSessionId||
    cfg.juryLaunch?.sessionId||
    prev._shareSessionId||
    prev.juryLaunch?.sessionId||
    cloudCfg?.sessionId||
    ''
  ).trim();

  if(!cfg._preparedId && prev._preparedId)cfg._preparedId=prev._preparedId;

  if(sid){
    cfg._shareSessionId=sid;
    if(cfg.juryLaunch?.openedAt){
      cfg.juryLaunch={...(cfg.juryLaunch||{}),sessionId:sid};
    }
    try{
      if(typeof phoneShareSignature==='function'){
        cfg._phoneShareSignature=phoneShareSignature(cfg);
      }
    }catch(e){}
  }
  return cfg;
}

function rebuildLocalFromCloud(config,rows=[]){
  updateTesterActivityFromRows(rows);
  const serverValidationV323={};
  rows.forEach(r=>{
    if(r.product_id==='__meta__'&&r.sample_id==='__validation__'){
      serverValidationV323[Number(r.tester_no)]=Array.isArray(r.remarks)?(r.remarks[0]||null):null;
    }
  });
  const previous=state?.testers||{};
  const previousCfg=deepClone(state?.config||{});
  const serverConfigHashV323=hashJson(config||{});
  const incoming=(cloudRole==='admin')
    ?restoreAdminShareMetadataV248(deepClone(config||{}),previousCfg)
    :config;
  state=makeInitialState(incoming);
  for(let i=1;i<=state.config.testerCount;i++){
    if(previous[i]?.name && !state.config.testerNames?.[i-1]) state.testers[i].name=previous[i].name
  }
  rows.forEach(r=>{
    const t=Number(r.tester_no);if(!state.testers[t])return;
    if(r.product_id==='__meta__'&&r.sample_id==='__validation__'){state.testers[t].validatedAt=Array.isArray(r.remarks)?(r.remarks[0]||null):null;return}
    if(r.product_id==='__meta__'&&r.sample_id==='__launch__'){
      const remarks=Array.isArray(r.remarks)?r.remarks:[];
      const openedAt=String(remarks[0]||r.updated_at||'');
      const instanceId=String(remarks[1]||state.config?.juryInstanceId||'').trim();
      if(openedAt){
        if(instanceId){state.config.juryInstanceId=instanceId;state.config._juryInstanceId=instanceId}
        state.config.juryLaunch={
          openedAt,
          instanceId:instanceId||juryInstanceId(state.config),
          sessionId:String(state.config?._shareSessionId||state.config?.juryLaunch?.sessionId||cloudCfg?.sessionId||'')
        };
      }
      return
    }
    const k=sampleKey(r.product_id,r.sample_id);
    state.testers[t].answers[k]={choices:Array.isArray(r.choices)?r.choices:Array(QUESTIONS.length).fill(null),remarks:Array.isArray(r.remarks)?r.remarks:Array(QUESTIONS.length).fill('')}
  });

  /* V323 — si le serveur ne possède pas encore une validation que cet
     administrateur a déjà localement, la conserver afin de la repousser. */
  if(cloudRole==='admin'){
    for(let t=1;t<=state.config.testerCount;t++){
      if(!state.testers[t]?.validatedAt && previous[t]?.validatedAt){
        state.testers[t].validatedAt=previous[t].validatedAt;
      }
    }
  }

  if(cloudRole==='admin'){
    restoreAdminShareMetadataV248(state.config,previousCfg);
    try{
      if(typeof upsertPreparedJury==='function'&&!state.config?.juryClose?.closedAt){
        upsertPreparedJury(state);
      }
    }catch(e){}
  }
  originalSaveState();
  currentTester=cloudRole==='tester'?(cloudTesterNo||guestTester||1):(Math.min(currentTester,state.config.testerCount)||1);
  currentProduct=state.config.products[0]?.id||'';
  currentSample=state.config.products[0]?.samples[0]?.id||'';
  adminProduct=currentProduct;
  /* V323 — mémoriser ce que le SERVEUR avait réellement. Si les données
     locales plus riches ont été conservées, le prochain sync les détectera. */
  lastCloudConfigHash=cloudRole==='admin'?serverConfigHashV323:hashJson(state.config);
  lastCloudAnswerHashes=new Map();
  for(let t=1;t<=state.config.testerCount;t++){
    Object.entries(state.testers[t]?.answers||{}).forEach(([k,a])=>lastCloudAnswerHashes.set(`${t}::${k}`,hashJson(a)));
    /* V323 — hash de la valeur réellement lue sur le serveur. Une validation
       locale conservée mais absente du serveur sera donc bien renvoyée. */
    lastCloudAnswerHashes.set(`${t}::__validation__`,hashJson(serverValidationV323[t]||null))
  }
}
async function fetchCloudState(){
  if(!cloudRole)await joinSecureSession();
  let config=null,answers=[];
  if(cloudRole==='admin'){
    const {data:session,error:e1}=await cloudClient.from('test_culinaire_sessions').select('session_id,config').eq('session_id',cloudCfg.sessionId).maybeSingle();
    if(e1)throw e1;if(!session)throw new Error('Session introuvable.');
    config=session.config;
    const {data,error:e2}=await cloudClient.from('test_culinaire_reponses').select('tester_no,product_id,sample_id,choices,remarks,updated_at').eq('session_id',cloudCfg.sessionId);
    if(e2)throw e2;answers=data||[]
  }else{
    const {data,error:e1}=await cloudClient.rpc('test_culinaire_get_public_session',{p_session_id:cloudCfg.sessionId});
    if(e1)throw e1;
    const row=Array.isArray(data)?data[0]:data;if(!row?.public_config)throw new Error('Configuration publique du jury introuvable.');
    config=row.public_config;
    cloudTesterNo=Number(row.tester_no||cloudTesterNo||guestTester||1);
    const {data:a,error:e2}=await cloudClient.from('test_culinaire_reponses').select('tester_no,product_id,sample_id,choices,remarks,updated_at').eq('session_id',cloudCfg.sessionId).eq('tester_no',cloudTesterNo);
    if(e2)throw e2;answers=a||[]
  }
  rebuildLocalFromCloud(config,answers)
}
async function createSecureCloudSession(){
  const adminCode=getRawAdminTokenV20();
  if(!adminCode)throw new Error('Clé administrateur de partage introuvable.');
  const codes=ensureTesterCodes();
  const {data,error}=await cloudClient.rpc('test_culinaire_create_secure_session',{
    p_session_id:cloudCfg.sessionId,
    p_admin_config:state.config,
    p_public_config:makePublicCloudConfig(state.config),
    p_admin_code:adminCode,
    p_tester_codes:codes
  });
  if(error){if(rpcsMissing(error))throw new Error('Le script SQL de sécurité V32 n’est pas encore installé dans Supabase.');throw error}
  cloudRole='admin';cloudTesterNo=null;
  return data
}
async function syncAccessCodes(){
  if(cloudRole!=='admin'||!cloudReady)return;
  const adminCode=getRawAdminTokenV20(),codes=ensureTesterCodes();
  if(!adminCode)return;
  const {error}=await cloudClient.rpc('test_culinaire_sync_access_codes',{p_session_id:cloudCfg.sessionId,p_admin_code:adminCode,p_tester_codes:codes});
  if(error)throw error
}
async function connectCloud({create=false}={}){
  cloudCfg.url=$('#cloudUrl')?.value.trim()||cloudCfg.url;cloudCfg.key=$('#cloudKey')?.value.trim()||cloudCfg.key;cloudCfg.sessionId=$('#cloudSession')?.value.trim()||cloudCfg.sessionId;
  if(create&&!cloudCfg.sessionId)cloudCfg.sessionId=crypto.randomUUID();
  if(!cloudCfg.sessionId)throw new Error('Indiquez un identifiant de session ou cliquez sur « Créer une session partagée ».');
  saveCloudCfg();buildCloudClient();setCloudStatus('syncing','● Authentification…');cloudMsg('Connexion sécurisée en cours…','warn');
  await ensureCloudAuth();
  if(create){
    await createSecureCloudSession();
    cloudReady=true;
    await pushAllAnswers();
    lastCloudConfigHash=hashJson(state.config)
  }else{
    await joinSecureSession();
    await fetchCloudState();
    cloudReady=true
  }
  if(cloudRole==='admin')scheduleCloudSync();
  saveCloudCfg();$('#cloudSession').value=cloudCfg.sessionId;
  await subscribeCloud();setCloudStatus('online','● Partagé sécurisé');refreshAdminSyncLabelsV328();bindAdminSyncButtonsV330();
  cloudMsg(`Session sécurisée connectée · ${cloudRole==='admin'?'administrateur':`testeur ${cloudTesterNo}`}.`,'ok');
  serverSecurityStatus('Sécurité serveur active ✓',`Supabase Auth connecté · rôle ${cloudRole==='admin'?'administrateur':`testeur ${cloudTesterNo}`}.`,true);
  renderShareLinks();
  if(guestTester||cloudRole==='tester'){
    document.body.classList.add('guest-mode');
    guestTester=cloudTesterNo||guestTester||1;currentTester=guestTester;openTester(guestTester);$('#testerSelect').disabled=true
  }else if($('#launchView')?.classList.contains('active'))renderLaunchView();else originalRenderHome()
}
async function subscribeCloud(){
  if(cloudChannel){try{await cloudClient.removeChannel(cloudChannel)}catch(e){}}
  if(cloudPresenceChannel){try{await cloudClient.removeChannel(cloudPresenceChannel)}catch(e){}}
  cloudChannel=cloudClient.channel(`test-culinaire-secure-${cloudCfg.sessionId}-${cloudUserId||'u'}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'test_culinaire_reponses',filter:`session_id=eq.${cloudCfg.sessionId}`},()=>reloadCloudAnswers());
  cloudChannel.on('postgres_changes',{event:'UPDATE',schema:'public',table:'test_culinaire_sessions',filter:`session_id=eq.${cloudCfg.sessionId}`},()=>{
    if(cloudRole==='tester'&&typeof refreshTesterLaunchState==='function')refreshTesterLaunchState();
    else reloadCloudConfig();
  });
  cloudChannel.subscribe();

  cloudPresenceChannel=cloudClient.channel(`test-culinaire-presence-${cloudCfg.sessionId}`,{config:{presence:{key:cloudUserId||crypto.randomUUID()}}})
    .on('presence',{event:'sync'},()=>{cloudPresenceState=cloudPresenceChannel.presenceState()||{};refreshLiveDayIfOpen()})
    .on('presence',{event:'join'},()=>{cloudPresenceState=cloudPresenceChannel.presenceState()||{};refreshLiveDayIfOpen()})
    .on('presence',{event:'leave'},()=>{cloudPresenceState=cloudPresenceChannel.presenceState()||{};refreshLiveDayIfOpen()})
    .subscribe(async status=>{
      if(status==='SUBSCRIBED'){
        try{
          await cloudPresenceChannel.track({
            role:cloudRole||'unknown',
            tester_no:cloudRole==='tester'?(cloudTesterNo||guestTester||null):null,
            online_at:new Date().toISOString()
          })
        }catch(e){}
      }
    })
}
/* V278 — validation testeur robuste.
   La validation est écrite immédiatement dans __validation__ et aussi recopiée
   dans une réponse ordinaire comme secours. Ainsi un événement temps réel ou
   un retard réseau ne peut plus faire disparaître le clic « Valider ». */
const TESTER_VALIDATION_FALLBACK_PREFIX_V278='__TC_VALIDATED_V278__:';

function validationFallbackFromRemarksV278(remarks){
  if(!Array.isArray(remarks))return null;
  for(const raw of remarks){
    const s=String(raw||'');
    if(s.startsWith(TESTER_VALIDATION_FALLBACK_PREFIX_V278)){
      const ts=s.slice(TESTER_VALIDATION_FALLBACK_PREFIX_V278.length).trim();
      if(ts)return ts;
    }
  }
  return null;
}

function setTesterValidationFallbackV278(t,validatedAt){
  const tester=state.testers?.[t];
  if(!tester)return false;
  const entries=Object.entries(tester.answers||{});
  if(!entries.length)return false;

  /* Utiliser la dernière fiche renseignée : cette ligne est autorisée exactement
     comme les autres réponses du testeur et sert uniquement de secours. */
  const pair=entries[entries.length-1];
  const a=pair[1];
  if(!a)return false;
  if(!Array.isArray(a.remarks))a.remarks=[];
  const idx=QUESTIONS.length+1;
  while(a.remarks.length<=idx)a.remarks.push('');
  a.remarks[idx]=validatedAt
    ?TESTER_VALIDATION_FALLBACK_PREFIX_V278+String(validatedAt)
    :'';
  return true;
}

function validationFallbackAnswerRowV280(t){
  const tester=state.testers?.[t];
  if(!tester)return null;
  const entries=Object.entries(tester.answers||{});
  for(let i=entries.length-1;i>=0;i--){
    const k=entries[i][0],a=entries[i][1];
    if(!a||!validationFallbackFromRemarksV278(a.remarks))continue;
    const parts=String(k).split('__');
    if(parts.length<2)continue;
    return {
      key:k,
      row:{
        session_id:cloudCfg.sessionId,
        tester_no:Number(t),
        product_id:parts[0],
        sample_id:parts.slice(1).join('__'),
        choices:Array.isArray(a.choices)?a.choices:[],
        remarks:Array.isArray(a.remarks)?a.remarks:[],
        updated_at:new Date().toISOString()
      },
      hash:hashJson(a)
    };
  }
  return null;
}

async function pushTesterValidationNowV278(t){
  if(!cloudReady||!cloudClient||!cloudCfg?.sessionId)return false;
  if(cloudRole==='tester'&&Number(cloudTesterNo)!==Number(t))return false;

  const v=state.testers?.[t]?.validatedAt||null;

  /* V280 — enregistrer D'ABORD la preuve de validation dans une réponse
     ordinaire. Cette ligne suit exactement le même chemin que les notes, qui
     remontent déjà correctement. */
  const fallback=validationFallbackAnswerRowV280(t);
  if(v&&fallback){
    const {error:fallbackError}=await cloudClient
      .from('test_culinaire_reponses')
      .upsert([fallback.row],{onConflict:'session_id,tester_no,product_id,sample_id'});
    if(fallbackError)throw fallbackError;
    lastCloudAnswerHashes.set(`${t}::${fallback.key}`,fallback.hash);
  }

  /* Le marqueur officiel reste utilisé quand le serveur l'accepte. S'il échoue,
     la preuve ci-dessus suffit pour que l'écran administrateur retrouve
     automatiquement l'état « Terminé ». */
  const row={
    session_id:cloudCfg.sessionId,
    tester_no:Number(t),
    product_id:'__meta__',
    sample_id:'__validation__',
    choices:[],
    remarks:[v],
    updated_at:new Date().toISOString()
  };
  const {error}=await cloudClient
    .from('test_culinaire_reponses')
    .upsert([row],{onConflict:'session_id,tester_no,product_id,sample_id'});
  if(error){
    console.warn('Marqueur officiel de validation non enregistré ; secours V280 actif',error);
    return true;
  }

  lastCloudAnswerHashes.set(`${t}::__validation__`,hashJson(v));
  return true;
}

const originalValidateTesterFinalV278=validateTesterFinal;
validateTesterFinal=function(t=currentTester){
  const before=testerValidated(t);
  const result=originalValidateTesterFinalV278(t);

  if(!before&&testerValidated(t)){
    const stamp=state.testers?.[t]?.validatedAt||new Date().toISOString();
    setTesterValidationFallbackV278(t,stamp);

    /* Sauvegarder une seconde fois pour envoyer aussi le marqueur de secours. */
    saveState();

    /* Et envoyer sans attendre les 300 ms de la synchro normale. */
    pushTesterValidationNowV278(t).catch(function(e){
      console.warn('Validation immédiate non confirmée, nouvelle tentative automatique',e);
      scheduleCloudSync();
    });
  }
  return result;
};
window.validateTesterFinal=validateTesterFinal;

const originalUnlockTesterV278=unlockTester;
unlockTester=function(t){
  const wasValidated=testerValidated(t);
  const result=originalUnlockTesterV278(t);
  if(wasValidated&&!testerValidated(t)){
    setTesterValidationFallbackV278(t,null);
    saveState();
    pushTesterValidationNowV278(t).catch(function(){scheduleCloudSync();});
  }
  return result;
};
window.unlockTester=unlockTester;

async function reloadCloudAnswers(){if(testerPreviewMode)return;
  if(!cloudReady)return;
  if(cloudBusy){cloudAnswersReloadPendingV323=true;return;}
  cloudAnswersReloadPendingV323=false;

  /* V325 — conserver toute validation locale encore absente du serveur,
     aussi bien pour un testeur que pour l'écran Propriétaire. */
  const pendingLocalValidation={};
  if(cloudRole==='tester'){
    const pt=Number(cloudTesterNo||guestTester||0);
    if(pt&&state.testers?.[pt]?.validatedAt)pendingLocalValidation[pt]=state.testers[pt].validatedAt;
  }else if(cloudRole==='admin'){
    for(let t=1;t<=Number(state.config?.testerCount||0);t++){
      if(state.testers?.[t]?.validatedAt)pendingLocalValidation[t]=state.testers[t].validatedAt;
    }
  }

  let q=cloudClient.from('test_culinaire_reponses').select('tester_no,product_id,sample_id,choices,remarks,updated_at').eq('session_id',cloudCfg.sessionId);
  if(cloudRole==='tester')q=q.eq('tester_no',cloudTesterNo);
  const {data,error}=await q;if(error)return;
  updateTesterActivityFromRows(data||[]);

  /* Relever l'état officiel de __validation__ et l'éventuel marqueur de secours.
     Si le secours est plus récent qu'un ancien marqueur nul, il correspond à un
     clic « Valider » qui n'avait pas encore réussi à mettre à jour __validation__. */
  const serverValidationV278={};
  const fallbackValidationV278={};
  (data||[]).forEach(function(r){
    const t=Number(r.tester_no);
    if(!t)return;
    if(r.product_id==='__meta__'&&r.sample_id==='__validation__'){
      serverValidationV278[t]={
        value:Array.isArray(r.remarks)?(r.remarks[0]||null):null,
        updatedAt:String(r.updated_at||'')
      };
      return;
    }
    const fb=validationFallbackFromRemarksV278(r.remarks);
    if(fb){
      const old=fallbackValidationV278[t];
      if(!old||String(fb)>String(old.value)){
        fallbackValidationV278[t]={value:fb,updatedAt:String(r.updated_at||fb)};
      }
    }
  });

  if(cloudRole==='admin'){
    for(let t=1;t<=state.config.testerCount;t++){state.testers[t].answers={};state.testers[t].validatedAt=null}
  }else{
    const t=cloudTesterNo;if(state.testers[t]){state.testers[t].answers={};state.testers[t].validatedAt=null}
  }
  (data||[]).forEach(r=>{
    const t=Number(r.tester_no);if(!state.testers[t])return;
    if(r.product_id==='__meta__'&&r.sample_id==='__validation__'){state.testers[t].validatedAt=Array.isArray(r.remarks)?(r.remarks[0]||null):null;return}
    if(r.product_id==='__meta__'&&r.sample_id==='__launch__'){
      const remarks=Array.isArray(r.remarks)?r.remarks:[];
      const openedAt=String(remarks[0]||r.updated_at||'');
      const instanceId=String(remarks[1]||state.config?.juryInstanceId||'').trim();
      if(openedAt){
        if(instanceId){state.config.juryInstanceId=instanceId;state.config._juryInstanceId=instanceId}
        state.config.juryLaunch={
          openedAt,
          instanceId:instanceId||juryInstanceId(state.config),
          sessionId:String(state.config?._shareSessionId||state.config?.juryLaunch?.sessionId||cloudCfg?.sessionId||'')
        };
      }
      return
    }
    state.testers[t].answers[sampleKey(r.product_id,r.sample_id)]={choices:r.choices||Array(QUESTIONS.length).fill(null),remarks:r.remarks||Array(QUESTIONS.length).fill('')}
  });

  /* Récupération serveur du marqueur de secours V278. */
  let recoveredValidationV278=false;
  Object.keys(fallbackValidationV278).forEach(function(k){
    const t=Number(k);
    if(!state.testers?.[t])return;
    const fb=fallbackValidationV278[t];
    const official=serverValidationV278[t];
    const officialTime=String(official?.updatedAt||'');
    const fallbackTime=String(fb?.updatedAt||fb?.value||'');

    if(!state.testers[t].validatedAt &&
       fb?.value &&
       (!official?.value) &&
       (!officialTime || !fallbackTime || fallbackTime>officialTime)){
      state.testers[t].validatedAt=fb.value;
      recoveredValidationV278=true;
    }
  });

  let pendingValidationNeedsPush=false;
  const pendingNos=cloudRole==='tester'
    ?[Number(cloudTesterNo||guestTester||0)]
    :Object.keys(pendingLocalValidation).map(Number);

  pendingNos.forEach(function(pt){
    const localPending=pendingLocalValidation[pt]||null;
    if(pt&&localPending&&state.testers?.[pt]&&!state.testers[pt].validatedAt){
      state.testers[pt].validatedAt=localPending;
      pendingValidationNeedsPush=true;
    }
  });

  originalSaveState();lastCloudAnswerHashes=new Map();
  (data||[]).forEach(r=>{
    const t=Number(r.tester_no);
    if(r.product_id==='__meta__'&&r.sample_id==='__validation__')lastCloudAnswerHashes.set(`${t}::__validation__`,hashJson(Array.isArray(r.remarks)?(r.remarks[0]||null):null));
    else if(r.product_id==='__meta__'&&r.sample_id==='__launch__')return;
    else lastCloudAnswerHashes.set(`${t}::${sampleKey(r.product_id,r.sample_id)}`,hashJson({choices:r.choices||[],remarks:r.remarks||[]}))
  });
  if(pendingValidationNeedsPush||recoveredValidationV278){
    /* Le hash vient d'être reconstruit depuis le serveur. Une nouvelle synchro
       consolide ensuite le marqueur officiel __validation__. */
    scheduleCloudSync();
  }

  if($('#adminView').classList.contains('active'))originalRenderAdmin();else if($('#liveDayView')?.classList.contains('active'))renderLiveDayCards();else if($('#launchView')?.classList.contains('active'))renderLaunchView();else if($('#juryView')?.classList.contains('active'))renderJuryView();else if($('#projectionView')?.classList.contains('active'))renderProjectionData();else if($('#homeView').classList.contains('active'))originalRenderHome();else if($('#testerView').classList.contains('active'))renderSample()
}
async function reloadCloudConfig(){if(testerPreviewMode)return;
  if(!cloudReady)return;
  if(cloudBusy){cloudConfigReloadPendingV323=true;return;}
  cloudConfigReloadPendingV323=false;

  if(cloudRole==='admin'){
    const {data,error}=await cloudClient
      .from('test_culinaire_sessions')
      .select('config')
      .eq('session_id',cloudCfg.sessionId)
      .maybeSingle();
    if(error||!data?.config)return;

    const serverCfg=deepClone(data.config||{});
    const serverHash=hashJson(serverCfg);
    const localHash=hashJson(state.config);
    if(serverHash===localHash){
      lastCloudConfigHash=serverHash;
      return;
    }

    const previousCfg=deepClone(state.config||{});
    const localDirty=localHash!==lastCloudConfigHash;
    let mergedCfg;

    if(localDirty){
      /* V325 — une modification locale générale reste prioritaire,
         MAIS les données de fin de jury plus riches présentes sur le serveur
         (clôture, OCCENA, conclusion, fiches/réceptions) sont fusionnées avant
         tout renvoi. Un ancien PC ne peut donc plus effacer le travail du S24. */
      mergedCfg=deepClone(previousCfg);
      preserveRicherAdminLocalDataV256(mergedCfg,serverCfg);
      preserveRicherAdminWorkflowV323(mergedCfg,serverCfg);
      restoreAdminShareMetadataV248(mergedCfg,serverCfg);
    }else{
      /* Pas de modification locale en attente : partir du serveur et conserver
         uniquement une donnée locale réellement plus riche. */
      mergedCfg=restoreAdminShareMetadataV248(deepClone(serverCfg),previousCfg);
    }

    const oldAnswers={},oldValidations={};
    for(let t=1;t<=state.config.testerCount;t++){
      oldAnswers[t]=deepClone(state.testers[t]?.answers||{});
      oldValidations[t]=state.testers[t]?.validatedAt||null;
    }

    const newState=makeInitialState(mergedCfg);
    for(let t=1;t<=newState.config.testerCount;t++){
      newState.testers[t].answers=oldAnswers[t]||{};
      newState.testers[t].validatedAt=oldValidations[t]||null;
    }
    state=newState;
    restoreAdminShareMetadataV248(state.config,previousCfg);
    try{
      if(typeof upsertPreparedJury==='function'&&!state.config?.juryClose?.closedAt)upsertPreparedJury(state);
    }catch(e){}

    originalSaveState();

    /* V326 — on mémorise l'état serveur sans relancer immédiatement un envoi.
       Cela évite le ping-pong serveur ↔ appareil. Une vraie sauvegarde locale
       ou la synchro unique de reconnexion pourra ensuite pousser le merge. */
    lastCloudConfigHash=serverHash;
  }else{
    const {data,error}=await cloudClient.rpc('test_culinaire_get_public_session',{p_session_id:cloudCfg.sessionId});
    if(error)return;
    const row=Array.isArray(data)?data[0]:data;
    if(!row?.public_config)return;
    const old=deepClone(state.testers[cloudTesterNo]?.answers||{});
    const val=state.testers[cloudTesterNo]?.validatedAt||null;
    const ns=makeInitialState(row.public_config);
    if(ns.testers[cloudTesterNo]){
      ns.testers[cloudTesterNo].answers=old;
      ns.testers[cloudTesterNo].validatedAt=val;
    }
    state=ns;
    originalSaveState();
    lastCloudConfigHash=hashJson(state.config);
  }

  if($('#adminView').classList.contains('active'))originalRenderAdmin();
  else if($('#launchView')?.classList.contains('active'))renderLaunchView();
  else if($('#juryView')?.classList.contains('active'))renderJuryView();
  else if($('#homeView').classList.contains('active'))originalRenderHome();
  else if($('#testerView').classList.contains('active')){renderTesterSelectors();renderSample();}
}

function answerRowsForTester(t){
  const rows=[];
  for(const [k,a] of Object.entries(state.testers[t]?.answers||{})){
    const [product_id,sample_id]=k.split('__');
    rows.push({session_id:cloudCfg.sessionId,tester_no:t,product_id,sample_id,choices:a.choices,remarks:a.remarks,updated_at:new Date().toISOString()})
  }
  rows.push({session_id:cloudCfg.sessionId,tester_no:t,product_id:'__meta__',sample_id:'__validation__',choices:[],remarks:[state.testers[t]?.validatedAt||null],updated_at:new Date().toISOString()});
  return rows
}
async function pushAllAnswers(){
  if(cloudRole!=='admin')return;
  const rows=[];for(let t=1;t<=state.config.testerCount;t++)rows.push(...answerRowsForTester(t));
  if(rows.length){const {error}=await cloudClient.from('test_culinaire_reponses').upsert(rows,{onConflict:'session_id,tester_no,product_id,sample_id'});if(error)throw error}
}
async function syncDirtyToCloud(){if(testerPreviewMode)return;
  if(!cloudReady)return;
  if(cloudBusy){cloudSyncPendingV323=true;return;}
  cloudSyncPendingV323=false;

  /* V326 — si aucune configuration et aucune réponse n'a changé, rester
     simplement sur « Partagé sécurisé » sans faire clignoter le bandeau. */
  let hasPendingV326=cloudRole==='admin'&&hashJson(state.config)!==lastCloudConfigHash;
  if(!hasPendingV326){
    const testersV326=cloudRole==='admin'
      ?Array.from({length:state.config.testerCount},(_,i)=>i+1)
      :[cloudTesterNo];
    outerV326:
    for(const t of testersV326){
      if(!t||!state.testers[t])continue;
      for(const [k,a] of Object.entries(state.testers[t]?.answers||{})){
        if(lastCloudAnswerHashes.get(`${t}::${k}`)!==hashJson(a)){
          hasPendingV326=true;break outerV326;
        }
      }
      const v=state.testers[t]?.validatedAt||null;
      if(lastCloudAnswerHashes.get(`${t}::__validation__`)!==hashJson(v)){
        hasPendingV326=true;break;
      }
    }
  }
  if(!hasPendingV326){
    setCloudStatus('online','● Partagé sécurisé');
    return;
  }

  cloudBusy=true;setCloudStatus('syncing','● Synchronisation sécurisée…');
  try{
    if(cloudRole==='admin'){
      const cfgHash=hashJson(state.config);
      if(cfgHash!==lastCloudConfigHash){
        ensureTesterCodes();

        /* V325 — juste avant d'écrire, relire la configuration serveur et
           protéger toute donnée finale plus complète qui aurait été enregistrée
           par un autre appareil. */
        let outgoing=deepClone(state.config);
        try{
          const {data:latest,error:latestError}=await cloudClient
            .from('test_culinaire_sessions')
            .select('config')
            .eq('session_id',cloudCfg.sessionId)
            .maybeSingle();
          if(!latestError&&latest?.config){
            preserveRicherAdminLocalDataV256(outgoing,latest.config);
            preserveRicherAdminWorkflowV323(outgoing,latest.config);
            restoreAdminShareMetadataV248(outgoing,latest.config);
          }
        }catch(e){}

        state.config=outgoing;
        originalSaveState();

        const {error}=await cloudClient
          .from('test_culinaire_sessions')
          .update({
            config:outgoing,
            public_config:makePublicCloudConfig(outgoing),
            updated_at:new Date().toISOString()
          })
          .eq('session_id',cloudCfg.sessionId);
        if(error)throw error;

        await syncAccessCodes();
        lastCloudConfigHash=hashJson(outgoing);
      }
    }

    const answerRows=[],answerHashes=[];
    const validationRows=[],validationHashes=[];
    const testers=cloudRole==='admin'?Array.from({length:state.config.testerCount},(_,i)=>i+1):[cloudTesterNo];

    for(const t of testers){
      if(!t||!state.testers[t])continue;

      for(const [k,a] of Object.entries(state.testers[t]?.answers||{})){
        const hk=`${t}::${k}`,h=hashJson(a);
        if(lastCloudAnswerHashes.get(hk)===h)continue;
        const parts=String(k).split('__');
        if(parts.length<2)continue;
        answerRows.push({
          session_id:cloudCfg.sessionId,
          tester_no:t,
          product_id:parts[0],
          sample_id:parts.slice(1).join('__'),
          choices:a.choices,
          remarks:a.remarks,
          updated_at:new Date().toISOString()
        });
        answerHashes.push([hk,h]);
      }

      const v=state.testers[t]?.validatedAt||null;
      const vk=`${t}::__validation__`,vh=hashJson(v);
      if(lastCloudAnswerHashes.get(vk)!==vh){
        validationRows.push({
          session_id:cloudCfg.sessionId,
          tester_no:t,
          product_id:'__meta__',
          sample_id:'__validation__',
          choices:[],
          remarks:[v],
          updated_at:new Date().toISOString()
        });
        validationHashes.push([vk,vh]);
      }
    }

    /* V280 : les réponses ordinaires (dont le secours de validation) sont
       envoyées séparément. Un problème sur __validation__ ne peut donc plus
       annuler l'enregistrement du secours. */
    if(answerRows.length){
      const {error}=await cloudClient
        .from('test_culinaire_reponses')
        .upsert(answerRows,{onConflict:'session_id,tester_no,product_id,sample_id'});
      if(error)throw error;
      answerHashes.forEach(([k,h])=>lastCloudAnswerHashes.set(k,h));
    }

    if(validationRows.length){
      const {error}=await cloudClient
        .from('test_culinaire_reponses')
        .upsert(validationRows,{onConflict:'session_id,tester_no,product_id,sample_id'});
      if(!error){
        validationHashes.forEach(([k,h])=>lastCloudAnswerHashes.set(k,h));
      }else{
        /* Ne pas considérer l'échec comme un échec des notes : le secours
           V280 vient d'être envoyé dans une réponse ordinaire. On garde le
           hash de validation non synchronisé pour retenter plus tard. */
        console.warn('Marqueur __validation__ non synchronisé ; secours V280 conservé',error);
      }
    }

    setCloudStatus('online','● Partagé sécurisé')
  }catch(e){
    console.error(e);setCloudStatus('error','● Erreur cloud');
    const msg=String(e?.message||e);
    cloudMsg(/row-level security|policy/i.test(msg)?'Sécurité Supabase : cette opération n’est pas autorisée pour ce rôle.':`Synchronisation impossible : ${msg}`,'bad')
  }finally{
    cloudBusy=false;

    /* V326 — pas de boucle automatique sur une simple différence de hash.
       On rejoue uniquement une vraie demande de sauvegarde arrivée pendant
       la synchro en cours. */
    if(cloudSyncPendingV323){
      cloudSyncPendingV323=false;
      clearTimeout(cloudSyncTimer);
      cloudSyncTimer=setTimeout(syncDirtyToCloud,220);
    }
    if(cloudAnswersReloadPendingV323){
      cloudAnswersReloadPendingV323=false;
      setTimeout(reloadCloudAnswers,260);
    }
    if(cloudConfigReloadPendingV323){
      cloudConfigReloadPendingV323=false;
      setTimeout(reloadCloudConfig,320);
    }
  }
}
function scheduleCloudSync(){
  if(!cloudReady)return;
  cloudSyncPendingV323=true;
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer=setTimeout(syncDirtyToCloud,300);
}
saveState=function(){if(testerPreviewMode)return;originalSaveState();scheduleCloudSync()};
renderHome=function(){originalRenderHome();if(cloudReady)setCloudStatus('online','● Partagé sécurisé');renderShareLinks()};
renderAdmin=function(){originalRenderAdmin();if(cloudReady)setCloudStatus('online','● Partagé sécurisé')};
clearAnswers=async function(){
  if(isJuryClosed()){alert('Le jury est fermé. Les réponses ne peuvent plus être effacées.');$('#resetModal').classList.remove('show');return}
  if(cloudRole!=='admin'&&cloudReady){alert('Seul l’administrateur peut effacer l’ensemble des réponses.');return}
  originalClearAnswers();
  if(cloudReady){
    const {error}=await cloudClient.from('test_culinaire_reponses').delete().eq('session_id',cloudCfg.sessionId);
    if(error){setCloudStatus('error','● Erreur cloud');cloudMsg(`Suppression cloud impossible : ${error.message}`,'bad')}
    else{lastCloudAnswerHashes=new Map();setCloudStatus('online','● Partagé sécurisé')}
  }
};
function adminSyncMessageV328(text,kind='warn'){
  const el=(document.getElementById('adminSyncMessageV328')||document.getElementById('adminSyncMessageV330'));
  if(!el)return;
  el.className='connection-banner show '+kind;
  el.textContent=text;
}

function refreshAdminSyncLabelsV328(){
  const code=cloudSessionShortV327();
  const push=(document.getElementById('forcePushAdminStateV328Btn')||document.getElementById('forcePushAdminStateV330Btn'));
  const pull=(document.getElementById('forceReloadAdminStateV328Btn')||document.getElementById('forceReloadAdminStateV330Btn'));
  const box=(document.getElementById('adminSyncBoxV328')||document.getElementById('adminSyncBoxV330'));
  if(box)box.style.display=(cloudReady&&cloudRole==='admin')?'':'none';
  if(push)push.textContent='📤 Envoyer cet état'+(code?' à '+code:' à la session');
  if(pull)pull.textContent='📥 Recharger depuis '+(code||'la session');
}

function setAnswerHashesFromLocalV328(){
  lastCloudAnswerHashes=new Map();
  for(let t=1;t<=Number(state.config?.testerCount||0);t++){
    Object.entries(state.testers?.[t]?.answers||{}).forEach(([k,a])=>{
      lastCloudAnswerHashes.set(`${t}::${k}`,hashJson(a));
    });
    lastCloudAnswerHashes.set(`${t}::__validation__`,hashJson(state.testers?.[t]?.validatedAt||null));
  }
}

let forcePushArmedUntilV331=0;

function resetForcePushArmV331(){
  forcePushArmedUntilV331=0;
  const btn=(document.getElementById('forcePushAdminStateV328Btn')||document.getElementById('forcePushAdminStateV330Btn'));
  if(btn)refreshAdminSyncLabelsV328();
}

function forcePushAdminStateV331(e){
  try{
    e?.preventDefault?.();
    e?.stopPropagation?.();
  }catch(_){}

  const btn=(document.getElementById('forcePushAdminStateV328Btn')||document.getElementById('forcePushAdminStateV330Btn'));
  const code=cloudSessionShortV327()||'session';
  const now=Date.now();

  if(now>forcePushArmedUntilV331){
    forcePushArmedUntilV331=now+8000;
    if(btn){
      btn.disabled=false;
      btn.textContent='✅ Confirmer l’envoi à '+code;
    }
    adminSyncMessageV328(
      'Appuyez une deuxième fois sur le bouton pour envoyer l’état de cet appareil vers '+code+'.',
      'warn'
    );
    setTimeout(()=>{
      if(Date.now()>forcePushArmedUntilV331)resetForcePushArmV331();
    },8200);
    return false;
  }

  forcePushArmedUntilV331=0;
  if(btn)btn.textContent='⏳ Envoi vers '+code+'…';

  Promise.resolve(forcePushAdminStateV328({skipConfirm:true}))
    .catch(err=>{
      console.error(err);
      alert('Impossible d’envoyer cet état à '+code+'. '+(err?.message||err||''));
    });
  return false;
}
window.forcePushAdminStateV331=forcePushAdminStateV331;

async function forcePushAdminStateV328(options={}){
  if(!cloudReady||cloudRole!=='admin'||!cloudClient||!cloudCfg?.sessionId){
    alert('La session sécurisée administrateur n’est pas connectée.');
    return;
  }

  const code=cloudSessionShortV327()||'session';
  if(!options?.skipConfirm){
    const ok=confirm(
      'Envoyer l’état de CET appareil vers '+code+' ?\n\n'+
      'Utilisez cette commande uniquement sur l’appareil qui affiche les bonnes données. '+
      'La configuration, la clôture, la conclusion, OCCENA et les validations de cet appareil deviendront la référence partagée.'
    );
    if(!ok)return;
  }

  const btn=(document.getElementById('forcePushAdminStateV328Btn')||document.getElementById('forcePushAdminStateV330Btn'));
  try{
    if(btn){btn.disabled=true;btn.textContent='⏳ Envoi vers '+code+'…';}
    setCloudStatus('syncing','● Synchronisation sécurisée…');
    adminSyncMessageV328('Envoi de l’état complet de cet appareil vers '+code+'…','warn');

    const outgoing=deepClone(state.config||{});
    outgoing._shareSessionId=cloudCfg.sessionId;
    if(outgoing.juryLaunch?.openedAt){
      outgoing.juryLaunch={...(outgoing.juryLaunch||{}),sessionId:cloudCfg.sessionId};
    }

    const {error}=await cloudClient
      .from('test_culinaire_sessions')
      .update({
        config:outgoing,
        public_config:makePublicCloudConfig(outgoing),
        updated_at:new Date().toISOString()
      })
      .eq('session_id',cloudCfg.sessionId);
    if(error)throw error;

    state.config=outgoing;
    originalSaveState();

    /* V329 — envoyer toutes les réponses puis chaque validation séparément,
       avec le marqueur de secours V278 dans une réponse ordinaire. */
    await pushAllAnswers();

    const expectedValidatedV329=[];
    for(let t=1;t<=Number(state.config?.testerCount||0);t++){
      const stamp=state.testers?.[t]?.validatedAt||null;
      if(!stamp)continue;
      expectedValidatedV329.push(t);
      try{setTesterValidationFallbackV278(t,stamp)}catch(e){}
      await pushTesterValidationNowV278(t);
    }

    /* Relire immédiatement la session pour vérifier combien de validations
       sont réellement récupérables côté serveur (officiel OU secours). */
    let verifiedValidatedV329=new Set();
    try{
      const {data:checkRows,error:checkError}=await cloudClient
        .from('test_culinaire_reponses')
        .select('tester_no,product_id,sample_id,remarks,updated_at')
        .eq('session_id',cloudCfg.sessionId);
      if(checkError)throw checkError;

      const official={},fallback={};
      (checkRows||[]).forEach(row=>{
        const t=Number(row.tester_no);
        if(!t)return;
        if(row.product_id==='__meta__'&&row.sample_id==='__validation__'){
          const v=Array.isArray(row.remarks)?(row.remarks[0]||null):null;
          if(v)official[t]=String(v);
          return;
        }
        const fb=validationFallbackFromRemarksV278(row.remarks);
        if(fb)fallback[t]=String(fb);
      });

      expectedValidatedV329.forEach(t=>{
        if(official[t]||fallback[t])verifiedValidatedV329.add(t);
      });
    }catch(e){
      console.warn('Vérification validations V329 impossible',e);
    }

    lastCloudConfigHash=hashJson(outgoing);
    setAnswerHashesFromLocalV328();

    setCloudStatus('online','● Partagé sécurisé');
    const totalExpected=expectedValidatedV329.length;
    const totalVerified=verifiedValidatedV329.size;
    const validationTxt=totalExpected
      ?(' · validations serveur '+totalVerified+'/'+totalExpected)
      :'';
    adminSyncMessageV328(
      '✓ État de cet appareil envoyé vers '+code+validationTxt+
      '. Vous pouvez maintenant recharger l’autre appareil depuis la session.',
      totalExpected&&totalVerified<totalExpected?'warn':'ok'
    );
    toast('État envoyé vers '+code+(totalExpected?' · '+totalVerified+'/'+totalExpected+' validations':'')+' ✓');
  }catch(e){
    console.error(e);
    setCloudStatus('error','● Erreur cloud');
    adminSyncMessageV328('Envoi impossible : '+(e?.message||e),'bad');
  }finally{
    if(btn){btn.disabled=false;refreshAdminSyncLabelsV328();}
  }
}

function applyServerAdminSnapshotV328(config,rows){
  const cfg=deepClone(config||{});
  cfg._shareSessionId=cloudCfg.sessionId;
  if(cfg.juryLaunch?.openedAt){
    cfg.juryLaunch={...(cfg.juryLaunch||{}),sessionId:cloudCfg.sessionId};
  }

  const fallbackValidationV329={};
  (rows||[]).forEach(r=>{
    const t=Number(r.tester_no);
    if(!t)return;
    if(r.product_id==='__meta__'&&r.sample_id==='__validation__')return;
    const fb=validationFallbackFromRemarksV278(r.remarks);
    if(fb){
      const old=fallbackValidationV329[t];
      if(!old||String(fb)>String(old))fallbackValidationV329[t]=String(fb);
    }
  });

  const newState=makeInitialState(cfg);
  (rows||[]).forEach(r=>{
    const t=Number(r.tester_no);
    if(!newState.testers?.[t])return;

    if(r.product_id==='__meta__'&&r.sample_id==='__validation__'){
      newState.testers[t].validatedAt=Array.isArray(r.remarks)?(r.remarks[0]||null):null;
      return;
    }
    if(r.product_id==='__meta__'&&r.sample_id==='__launch__'){
      const remarks=Array.isArray(r.remarks)?r.remarks:[];
      const openedAt=String(remarks[0]||r.updated_at||'');
      const instanceId=String(remarks[1]||newState.config?.juryInstanceId||'').trim();
      if(openedAt){
        if(instanceId){
          newState.config.juryInstanceId=instanceId;
          newState.config._juryInstanceId=instanceId;
        }
        newState.config.juryLaunch={
          openedAt,
          instanceId:instanceId||juryInstanceId(newState.config),
          sessionId:cloudCfg.sessionId
        };
      }
      return;
    }

    const k=sampleKey(r.product_id,r.sample_id);
    newState.testers[t].answers[k]={
      choices:Array.isArray(r.choices)?r.choices:Array(QUESTIONS.length).fill(null),
      remarks:Array.isArray(r.remarks)?r.remarks:Array(QUESTIONS.length).fill('')
    };
  });

  /* V329 — si le marqueur officiel manque, reprendre la preuve V278
     enregistrée dans une réponse ordinaire. */
  Object.keys(fallbackValidationV329).forEach(k=>{
    const t=Number(k);
    if(newState.testers?.[t]&&!newState.testers[t].validatedAt){
      newState.testers[t].validatedAt=fallbackValidationV329[t];
    }
  });

  state=newState;
  originalSaveState();
  lastCloudConfigHash=hashJson(state.config);
  setAnswerHashesFromLocalV328();

  currentTester=Math.min(currentTester,state.config.testerCount)||1;
  currentProduct=state.config.products[0]?.id||'';
  currentSample=state.config.products[0]?.samples[0]?.id||'';
  adminProduct=currentProduct;
}

async function forceReloadAdminStateV328(){
  if(!cloudReady||cloudRole!=='admin'||!cloudClient||!cloudCfg?.sessionId){
    alert('La session sécurisée administrateur n’est pas connectée.');
    return;
  }

  const code=cloudSessionShortV327()||'session';
  const ok=confirm(
    'Recharger CET appareil depuis '+code+' ?\n\n'+
    'Les données locales de cet appareil seront remplacées par l’état actuellement enregistré dans la session sécurisée.'
  );
  if(!ok)return;

  const btn=(document.getElementById('forceReloadAdminStateV328Btn')||document.getElementById('forceReloadAdminStateV330Btn'));
  try{
    if(btn){btn.disabled=true;btn.textContent='⏳ Rechargement '+code+'…';}
    setCloudStatus('syncing','● Synchronisation sécurisée…');
    adminSyncMessageV328('Lecture de '+code+'…','warn');

    const {data:session,error:e1}=await cloudClient
      .from('test_culinaire_sessions')
      .select('config')
      .eq('session_id',cloudCfg.sessionId)
      .maybeSingle();
    if(e1)throw e1;
    if(!session?.config)throw new Error('Configuration partagée introuvable.');

    const {data:rows,error:e2}=await cloudClient
      .from('test_culinaire_reponses')
      .select('tester_no,product_id,sample_id,choices,remarks,updated_at')
      .eq('session_id',cloudCfg.sessionId);
    if(e2)throw e2;

    applyServerAdminSnapshotV328(session.config,rows||[]);
    setCloudStatus('online','● Partagé sécurisé');
    const nValidatedV329=Array.from({length:Number(state.config?.testerCount||0)},(_,i)=>i+1)
      .filter(t=>!!state.testers?.[t]?.validatedAt).length;
    const totalV329=Number(state.config?.testerCount||0);
    adminSyncMessageV328(
      '✓ Cet appareil a été rechargé depuis '+code+
      (totalV329?' · validations '+nValidatedV329+'/'+totalV329:'')+'.',
      'ok'
    );
    toast('Données rechargées depuis '+code+(totalV329?' · '+nValidatedV329+'/'+totalV329+' validations':'')+' ✓');

    if(document.getElementById('adminView')?.classList.contains('active')){
      originalRenderAdmin();
    }else{
      originalRenderHome();
    }
  }catch(e){
    console.error(e);
    setCloudStatus('error','● Erreur cloud');
    adminSyncMessageV328('Rechargement impossible : '+(e?.message||e),'bad');
  }finally{
    if(btn){btn.disabled=false;refreshAdminSyncLabelsV328();}
  }
}

async function disconnectCloud(){
  cloudReady=false;cloudRole=null;cloudTesterNo=null;cloudUserId=null;
  if(cloudChannel&&cloudClient)try{await cloudClient.removeChannel(cloudChannel)}catch(e){}
  if(cloudPresenceChannel&&cloudClient)try{await cloudClient.removeChannel(cloudPresenceChannel)}catch(e){}
  cloudChannel=null;cloudPresenceChannel=null;cloudPresenceState={};
  if(cloudClient)try{await cloudClient.auth.signOut({scope:'local'})}catch(e){}
  cloudClient=null;cloudCfg.sessionId='';cloudCfg.accessCode='';saveCloudCfg();setCloudStatus('local','● Local');cloudMsg('Mode local activé.','warn');renderShareLinks()
}
async function autoConnectFromUrl(){
  loadCloudCfg();
  if(cloudCfg.url&&cloudCfg.key&&cloudCfg.sessionId){
    try{
      $('#cloudUrl').value=cloudCfg.url;$('#cloudKey').value=cloudCfg.key;$('#cloudSession').value=cloudCfg.sessionId;
      buildCloudClient();setCloudStatus('syncing','● Authentification…');await ensureCloudAuth();await joinSecureSession();await fetchCloudState();cloudReady=true;if(cloudRole==='admin')scheduleCloudSync();saveCloudCfg();await subscribeCloud();setCloudStatus('online','● Partagé sécurisé');refreshAdminSyncLabelsV328();
      if(guestTester||cloudRole==='tester'){document.body.classList.add('guest-mode');guestTester=cloudTesterNo||guestTester;currentTester=guestTester;openTester(guestTester);$('#testerSelect').disabled=true}
      else originalRenderHome()
    }catch(e){
      console.error(e);setCloudStatus('error','● Hors ligne');
      if(guestTester)alert(`Impossible de charger la session sécurisée. ${e.message||e}`);
      else cloudMsg(e.message||String(e),'bad')
    }
  }else setCloudStatus('local','● Local')
}
$('#cloudBtn').onclick=renderCloudPage;$('#cloudHomeBtn').onclick=renderHome;
bindAdminSyncButtonsV330();
/* V32 gère la création d'une nouvelle session avec un UUID neuf. */
$('#connectCloudBtn').onclick=async()=>{try{await connectCloud({create:false})}catch(e){setCloudStatus('error','● Erreur');cloudMsg(e.message||String(e),'bad');serverSecurityStatus('Sécurité serveur non prête',e.message||String(e),false)}};
$('#disconnectCloudBtn').onclick=disconnectCloud;
$('#copyAdminLinkBtn').onclick=()=>{if(!cloudReady)return alert('Connectez d’abord la session partagée.');if(cloudRole!=='admin')return alert('Lien administrateur réservé à l’administrateur.');copyText(shareUrl(null),'Lien administrateur copié')};
autoConnectFromUrl();


/* --- V332 : envoi autoritaire fiable S24 -> session partagée --- */
function waitCloudIdleV332(timeoutMs=6000){
  return new Promise(resolve=>{
    const started=Date.now();
    (function check(){
      if(!cloudBusy || Date.now()-started>=timeoutMs)return resolve(!cloudBusy);
      setTimeout(check,120);
    })();
  });
}

function authoritativeSnapshotV332(){
  const snap=deepClone(state);
  const testerCount=Number(snap.config?.testerCount||0);
  for(let t=1;t<=testerCount;t++){
    const tester=snap.testers?.[t];
    const stamp=tester?.validatedAt||null;
    if(!tester||!stamp)continue;
    const entries=Object.entries(tester.answers||{});
    if(!entries.length)continue;
    const a=entries[entries.length-1][1];
    if(!a)continue;
    if(!Array.isArray(a.remarks))a.remarks=[];
    const idx=QUESTIONS.length+1;
    while(a.remarks.length<=idx)a.remarks.push('');
    a.remarks[idx]=TESTER_VALIDATION_FALLBACK_PREFIX_V278+String(stamp);
  }
  return snap;
}

function answerRowsFromSnapshotV332(snap){
  const rows=[];
  const testerCount=Number(snap.config?.testerCount||0);
  for(let t=1;t<=testerCount;t++){
    for(const [k,a] of Object.entries(snap.testers?.[t]?.answers||{})){
      const parts=String(k).split('__');
      if(parts.length<2)continue;
      rows.push({
        session_id:cloudCfg.sessionId,
        tester_no:t,
        product_id:parts[0],
        sample_id:parts.slice(1).join('__'),
        choices:Array.isArray(a?.choices)?a.choices:[],
        remarks:Array.isArray(a?.remarks)?a.remarks:[],
        updated_at:new Date().toISOString()
      });
    }
  }
  return rows;
}

function validationRowsFromSnapshotV332(snap){
  const rows=[];
  const testerCount=Number(snap.config?.testerCount||0);
  for(let t=1;t<=testerCount;t++){
    const stamp=snap.testers?.[t]?.validatedAt||null;
    rows.push({
      session_id:cloudCfg.sessionId,
      tester_no:t,
      product_id:'__meta__',
      sample_id:'__validation__',
      choices:[],
      remarks:[stamp],
      updated_at:new Date().toISOString()
    });
  }
  return rows;
}

async function upsertRowsV332(rows){
  if(!rows.length)return;
  const size=150;
  for(let i=0;i<rows.length;i+=size){
    const chunk=rows.slice(i,i+size);
    const {error}=await cloudClient
      .from('test_culinaire_reponses')
      .upsert(chunk,{onConflict:'session_id,tester_no,product_id,sample_id'});
    if(error)throw error;
  }
}

forcePushAdminStateV328=async function(options={}){
  if(!cloudReady||cloudRole!=='admin'||!cloudClient||!cloudCfg?.sessionId){
    alert('La session sécurisée administrateur n’est pas connectée.');
    return false;
  }

  const code=cloudSessionShortV327()||'session';
  if(!options?.skipConfirm){
    const ok=confirm(
      'Envoyer l’état COMPLET de CET appareil vers '+code+' ?\n\n'+
      'Utilisez cette commande sur l’appareil qui affiche les bonnes données. '+
      'Les réponses et les validations de cet appareil deviendront la référence partagée.'
    );
    if(!ok)return false;
  }

  const btn=(document.getElementById('forcePushAdminStateV328Btn')||document.getElementById('forcePushAdminStateV330Btn'));
  if(cloudBusy){
    if(btn){btn.disabled=true;btn.textContent='⏳ Fin de synchro en cours…';}
    adminSyncMessageV328('Une synchronisation est déjà en cours. Je termine celle-ci puis j’envoie l’état du téléphone…','warn');
    await waitCloudIdleV332(7000);
  }
  if(cloudBusy){
    if(btn){btn.disabled=false;refreshAdminSyncLabelsV328();}
    adminSyncMessageV328('La synchronisation précédente ne s’est pas terminée. Réessayez dans quelques secondes.','bad');
    return false;
  }

  const snap=authoritativeSnapshotV332();
  const expectedValidated=[];
  for(let t=1;t<=Number(snap.config?.testerCount||0);t++){
    if(snap.testers?.[t]?.validatedAt)expectedValidated.push(t);
  }

  cloudBusy=true;
  try{
    if(btn){btn.disabled=true;btn.textContent='⏳ Envoi complet vers '+code+'…';}
    setCloudStatus('syncing','● Synchronisation sécurisée…');
    adminSyncMessageV328('Envoi de l’état complet de cet appareil vers '+code+'…','warn');

    const outgoing=deepClone(snap.config||{});
    outgoing._shareSessionId=cloudCfg.sessionId;
    if(outgoing.juryLaunch?.openedAt){
      outgoing.juryLaunch={...(outgoing.juryLaunch||{}),sessionId:cloudCfg.sessionId};
    }

    const {error:configError}=await cloudClient
      .from('test_culinaire_sessions')
      .update({
        config:outgoing,
        public_config:makePublicCloudConfig(outgoing),
        updated_at:new Date().toISOString()
      })
      .eq('session_id',cloudCfg.sessionId);
    if(configError)throw configError;

    await upsertRowsV332(answerRowsFromSnapshotV332(snap));

    const validationRows=validationRowsFromSnapshotV332(snap);
    const {error:validationError}=await cloudClient
      .from('test_culinaire_reponses')
      .upsert(validationRows,{onConflict:'session_id,tester_no,product_id,sample_id'});
    if(validationError){
      console.warn('V332 : marqueurs officiels de validation non tous enregistrés ; contrôle du secours',validationError);
    }

    const {data:checkRows,error:checkError}=await cloudClient
      .from('test_culinaire_reponses')
      .select('tester_no,product_id,sample_id,remarks,updated_at')
      .eq('session_id',cloudCfg.sessionId);
    if(checkError)throw checkError;

    const official={},fallback={};
    (checkRows||[]).forEach(row=>{
      const t=Number(row.tester_no);
      if(!t)return;
      if(row.product_id==='__meta__'&&row.sample_id==='__validation__'){
        const v=Array.isArray(row.remarks)?(row.remarks[0]||null):null;
        if(v)official[t]=String(v);
        return;
      }
      const fb=validationFallbackFromRemarksV278(row.remarks);
      if(fb)fallback[t]=String(fb);
    });

    const verified=expectedValidated.filter(t=>official[t]||fallback[t]);
    if(verified.length!==expectedValidated.length){
      throw new Error('Le serveur n’a confirmé que '+verified.length+'/'+expectedValidated.length+' validations. L’état local a été conservé.');
    }

    state.config=outgoing;
    state.testers=snap.testers;
    originalSaveState();
    lastCloudConfigHash=hashJson(outgoing);
    setAnswerHashesFromLocalV328();

    setCloudStatus('online','● Partagé sécurisé');
    adminSyncMessageV328(
      '✓ État envoyé vers '+code+' · validations serveur '+verified.length+'/'+expectedValidated.length+'. Vous pouvez recharger l’ordinateur depuis la session.',
      'ok'
    );
    toast('État envoyé vers '+code+' · '+verified.length+'/'+expectedValidated.length+' validations ✓');
    return true;
  }catch(e){
    console.error(e);
    setCloudStatus('error','● Erreur cloud');
    adminSyncMessageV328('Envoi impossible : '+(e?.message||e),'bad');
    return false;
  }finally{
    cloudBusy=false;
    if(btn){btn.disabled=false;refreshAdminSyncLabelsV328();}
    if(cloudAnswersReloadPendingV323){
      cloudAnswersReloadPendingV323=false;
      setTimeout(reloadCloudAnswers,260);
    }
    if(cloudConfigReloadPendingV323){
      cloudConfigReloadPendingV323=false;
      setTimeout(reloadCloudConfig,320);
    }
    if(cloudSyncPendingV323){
      cloudSyncPendingV323=false;
      clearTimeout(cloudSyncTimer);
      cloudSyncTimer=setTimeout(syncDirtyToCloud,360);
    }
  }
};

async function forcePushAdminStateV332(e){
  try{
    e?.preventDefault?.();
    e?.stopPropagation?.();
  }catch(_){}
  return forcePushAdminStateV328({skipConfirm:false});
}
window.forcePushAdminStateV332=forcePushAdminStateV332;
window.forcePushAdminStateV331=forcePushAdminStateV332;

bindAdminSyncButtonsV330=function(){
  const push=(document.getElementById('forcePushAdminStateV328Btn')||document.getElementById('forcePushAdminStateV330Btn'));
  const pull=(document.getElementById('forceReloadAdminStateV328Btn')||document.getElementById('forceReloadAdminStateV330Btn'));
  if(push){
    push.type='button';
    push.onclick=forcePushAdminStateV332;
  }
  if(pull){
    pull.type='button';
    pull.onclick=async function(e){
      try{
        e?.preventDefault?.();
        e?.stopPropagation?.();
        await forceReloadAdminStateV328();
      }catch(err){
        console.error(err);
        alert('Impossible de lancer le rechargement depuis la session. '+(err?.message||err||''));
      }
    };
  }
};
bindAdminSyncButtonsV330();


/* --- V333 : sauvegarde des validations dans la configuration partagée --- */
function validationBackupV333(sourceState=state){
  const out={};
  const count=Number(sourceState?.config?.testerCount||0);
  for(let t=1;t<=count;t++){
    const stamp=sourceState?.testers?.[t]?.validatedAt||null;
    if(stamp)out[String(t)]=String(stamp);
  }
  return out;
}

function applyValidationBackupV333(targetState,config){
  const backup=config?._validatedTestersV333;
  if(!backup||typeof backup!=='object')return 0;
  let restored=0;
  const count=Number(targetState?.config?.testerCount||0);
  for(let t=1;t<=count;t++){
    const stamp=backup[String(t)]||backup[t]||null;
    if(stamp&&targetState?.testers?.[t]&&!targetState.testers[t].validatedAt){
      targetState.testers[t].validatedAt=String(stamp);
      restored++;
    }
  }
  return restored;
}

/* Le rechargement manuel du PC doit aussi lire la copie de secours V333. */
const applyServerAdminSnapshotV328BeforeV333=applyServerAdminSnapshotV328;
applyServerAdminSnapshotV328=function(config,rows){
  applyServerAdminSnapshotV328BeforeV333(config,rows);
  applyValidationBackupV333(state,config||state.config||{});
  originalSaveState();
  setAnswerHashesFromLocalV328();
};

/* Après une actualisation temps réel des réponses, ne jamais reperdre une
   validation déjà certifiée dans la configuration partagée. */
const reloadCloudAnswersBeforeV333=reloadCloudAnswers;
reloadCloudAnswers=async function(){
  await reloadCloudAnswersBeforeV333();
  if(cloudRole==='admin'){
    const restored=applyValidationBackupV333(state,state.config||{});
    if(restored){
      originalSaveState();
      if(document.getElementById('adminView')?.classList.contains('active'))originalRenderAdmin();
      else if(document.getElementById('homeView')?.classList.contains('active'))originalRenderHome();
    }
  }
};
window.reloadCloudAnswers=reloadCloudAnswers;

/* V333 remplace l'envoi V332 : les validations sont envoyées deux fois,
   dans les réponses ET dans la configuration de session. */
const forcePushAdminStateV332BeforeV333=forcePushAdminStateV328;
forcePushAdminStateV328=async function(options={}){
  if(!cloudReady||cloudRole!=='admin'||!cloudClient||!cloudCfg?.sessionId){
    alert('La session sécurisée administrateur n’est pas connectée.');
    return false;
  }

  const code=cloudSessionShortV327()||'session';
  if(!options?.skipConfirm){
    const ok=confirm(
      'Envoyer l’état COMPLET de CET appareil vers '+code+' ?\n\n'+
      'Les réponses, la clôture et les validations de cet appareil deviendront la référence partagée.'
    );
    if(!ok)return false;
  }

  if(cloudBusy){
    adminSyncMessageV328('Une synchronisation est déjà en cours. Attendez quelques secondes puis réessayez.','warn');
    return false;
  }

  const snap=authoritativeSnapshotV332();
  const backup=validationBackupV333(snap);
  const expectedValidated=Object.keys(backup).map(Number);
  const btn=(document.getElementById('forcePushAdminStateV328Btn')||document.getElementById('forcePushAdminStateV330Btn'));

  cloudBusy=true;
  try{
    if(btn){btn.disabled=true;btn.textContent='⏳ Envoi complet vers '+code+'…';}
    setCloudStatus('syncing','● Synchronisation sécurisée…');
    adminSyncMessageV328('Envoi de l’état complet et des validations vers '+code+'…','warn');

    const outgoing=deepClone(snap.config||{});
    outgoing._shareSessionId=cloudCfg.sessionId;
    outgoing._validatedTestersV333=backup;
    outgoing._validatedTestersV333UpdatedAt=new Date().toISOString();
    if(outgoing.juryLaunch?.openedAt){
      outgoing.juryLaunch={...(outgoing.juryLaunch||{}),sessionId:cloudCfg.sessionId};
    }

    const {error:configError}=await cloudClient
      .from('test_culinaire_sessions')
      .update({
        config:outgoing,
        public_config:makePublicCloudConfig(outgoing),
        updated_at:new Date().toISOString()
      })
      .eq('session_id',cloudCfg.sessionId);
    if(configError)throw configError;

    await upsertRowsV332(answerRowsFromSnapshotV332(snap));

    const validationRows=validationRowsFromSnapshotV332(snap);
    const {error:validationError}=await cloudClient
      .from('test_culinaire_reponses')
      .upsert(validationRows,{onConflict:'session_id,tester_no,product_id,sample_id'});
    if(validationError)console.warn('V333 : validation meta partiellement refusée, secours config actif',validationError);

    const {data:serverSession,error:verifyConfigError}=await cloudClient
      .from('test_culinaire_sessions')
      .select('config')
      .eq('session_id',cloudCfg.sessionId)
      .maybeSingle();
    if(verifyConfigError)throw verifyConfigError;

    const serverBackup=serverSession?.config?._validatedTestersV333||{};
    const verified=expectedValidated.filter(t=>!!(serverBackup[String(t)]||serverBackup[t]));
    if(verified.length!==expectedValidated.length){
      throw new Error('La session n’a confirmé que '+verified.length+'/'+expectedValidated.length+' validations.');
    }

    state.config=outgoing;
    state.testers=snap.testers;
    originalSaveState();
    lastCloudConfigHash=hashJson(outgoing);
    setAnswerHashesFromLocalV328();

    setCloudStatus('online','● Partagé sécurisé');
    adminSyncMessageV328(
      '✓ État envoyé vers '+code+' · validations sauvegardées '+verified.length+'/'+expectedValidated.length+'. Recharger maintenant l’ordinateur depuis '+code+'.',
      'ok'
    );
    toast('Validations sauvegardées '+verified.length+'/'+expectedValidated.length+' ✓');
    return true;
  }catch(e){
    console.error(e);
    setCloudStatus('error','● Erreur cloud');
    adminSyncMessageV328('Envoi impossible : '+(e?.message||e),'bad');
    return false;
  }finally{
    cloudBusy=false;
    if(btn){btn.disabled=false;refreshAdminSyncLabelsV328();}
  }
};

async function forcePushAdminStateV333(e){
  try{e?.preventDefault?.();e?.stopPropagation?.();}catch(_){}
  return forcePushAdminStateV328({skipConfirm:false});
}
window.forcePushAdminStateV333=forcePushAdminStateV333;
window.forcePushAdminStateV332=forcePushAdminStateV333;
window.forcePushAdminStateV331=forcePushAdminStateV333;

bindAdminSyncButtonsV330=function(){
  const push=(document.getElementById('forcePushAdminStateV328Btn')||document.getElementById('forcePushAdminStateV330Btn'));
  const pull=(document.getElementById('forceReloadAdminStateV328Btn')||document.getElementById('forceReloadAdminStateV330Btn'));
  if(push){push.type='button';push.onclick=forcePushAdminStateV333;}
  if(pull){
    pull.type='button';
    pull.onclick=async function(e){
      try{
        e?.preventDefault?.();
        e?.stopPropagation?.();
        await forceReloadAdminStateV328();
      }catch(err){
        console.error(err);
        alert('Impossible de lancer le rechargement depuis la session. '+(err?.message||err||''));
      }
    };
  }
};
bindAdminSyncButtonsV330();


/* --- V334 : stabilisation multi-appareils, fin du clignotement de synchro --- */
function syncValidationBackupIntoConfigV334(){
  if(cloudRole!=='admin'||!state?.config)return false;
  const next=validationBackupV333(state);
  const prev=(state.config._validatedTestersV333&&typeof state.config._validatedTestersV333==='object')
    ?state.config._validatedTestersV333:{};
  if(hashJson(next)===hashJson(prev))return false;
  state.config._validatedTestersV333=next;
  state.config._validatedTestersV333UpdatedAt=new Date().toISOString();
  originalSaveState();
  return true;
}

/* Toute validation faite depuis le PC est maintenant aussi inscrite dans
   la configuration partagée, pas seulement dans la table des réponses. */
const syncDirtyToCloudBeforeV334=syncDirtyToCloud;
syncDirtyToCloud=async function(){
  try{syncValidationBackupIntoConfigV334()}catch(e){}
  return syncDirtyToCloudBeforeV334();
};

/* Quand la configuration V333 certifie une validation, elle devient la référence
   locale. On aligne aussi les hashes pour ne pas tenter de renvoyer la même
   validation en boucle si le marqueur __validation__ est absent/refusé côté serveur. */
const reloadCloudAnswersBeforeV334=reloadCloudAnswers;
reloadCloudAnswers=async function(){
  await reloadCloudAnswersBeforeV334();
  if(cloudRole==='admin'&&state?.config?._validatedTestersV333){
    applyValidationBackupV333(state,state.config);
    originalSaveState();
    setAnswerHashesFromLocalV328();
    setCloudStatus('online','● Partagé sécurisé');
    if(document.getElementById('juryView')?.classList.contains('active'))renderJuryView();
    else if(document.getElementById('adminView')?.classList.contains('active'))originalRenderAdmin();
  }
};
window.reloadCloudAnswers=reloadCloudAnswers;


/* --- V335 : synchronisation 100 % automatique entre testeurs, S24 et ordinateur --- */
let autoReconcileBusyV335=false;
let autoValidationPublishBusyV335=false;

function serverValidationBackupV335(cfg){
  const b=cfg?._validatedTestersV333;
  return b&&typeof b==='object'?b:{};
}

function mergeValidationBackupFromServerV335(serverCfg){
  if(cloudRole!=='admin'||!serverCfg||typeof serverCfg!=='object')return false;
  const remote=serverValidationBackupV335(serverCfg);
  if(!Object.keys(remote).length)return false;

  if(!state.config._validatedTestersV333||
     hashJson(state.config._validatedTestersV333)!==hashJson(remote)){
    state.config._validatedTestersV333=deepClone(remote);
    state.config._validatedTestersV333UpdatedAt=
      serverCfg._validatedTestersV333UpdatedAt||state.config._validatedTestersV333UpdatedAt||'';
  }

  const restored=applyValidationBackupV333(state,serverCfg);
  if(restored){
    originalSaveState();
    setAnswerHashesFromLocalV328();
  }
  return !!restored;
}

async function publishValidationBackupV335(){
  if(autoValidationPublishBusyV335)return false;
  if(!cloudReady||cloudRole!=='admin'||!cloudClient||!cloudCfg?.sessionId)return false;

  const desired=validationBackupV333(state);
  autoValidationPublishBusyV335=true;
  try{
    const {data:session,error:readError}=await cloudClient
      .from('test_culinaire_sessions')
      .select('config')
      .eq('session_id',cloudCfg.sessionId)
      .maybeSingle();
    if(readError)throw readError;
    if(!session?.config)return false;

    const remote=deepClone(session.config||{});
    const current=serverValidationBackupV335(remote);

    /* V335 : une validation acquise ne doit jamais disparaître simplement parce
       qu'un autre appareil avait encore un état plus ancien. On fait donc
       l'union des validations serveur + locales. Une suppression volontaire
       reste gérée par le mécanisme de déverrouillage/sauvegarde existant. */
    const target=deepClone(current);
    Object.keys(desired).forEach(k=>{
      if(desired[k])target[k]=desired[k];
    });

    if(hashJson(current)===hashJson(target)){
      state.config._validatedTestersV333=deepClone(target);
      state.config._validatedTestersV333UpdatedAt=
        remote._validatedTestersV333UpdatedAt||state.config._validatedTestersV333UpdatedAt||'';
      applyValidationBackupV333(state,{_validatedTestersV333:target});
      originalSaveState();
      setAnswerHashesFromLocalV328();
      return false;
    }

    /* Le serveur est la base ; on y ajoute seulement les données locales plus
       riches puis la liste certifiée des validations. Un appareil ancien ne
       peut donc pas effacer la fin de jury d'un autre appareil. */
    const merged=deepClone(remote);
    try{preserveRicherAdminLocalDataV256(merged,state.config||{})}catch(e){}
    try{preserveRicherAdminWorkflowV323(merged,state.config||{})}catch(e){}
    try{restoreAdminShareMetadataV248(merged,state.config||{})}catch(e){}

    merged._validatedTestersV333=deepClone(target);
    merged._validatedTestersV333UpdatedAt=new Date().toISOString();

    const {error:updateError}=await cloudClient
      .from('test_culinaire_sessions')
      .update({
        config:merged,
        public_config:makePublicCloudConfig(merged),
        updated_at:new Date().toISOString()
      })
      .eq('session_id',cloudCfg.sessionId);
    if(updateError)throw updateError;

    state.config=merged;
    originalSaveState();
    lastCloudConfigHash=hashJson(merged);
    setAnswerHashesFromLocalV328();
    return true;
  }catch(e){
    console.warn('V335 : sauvegarde automatique des validations différée',e);
    return false;
  }finally{
    autoValidationPublishBusyV335=false;
  }
}

async function automaticReconcileV335(){
  if(autoReconcileBusyV335||testerPreviewMode)return;
  if(!cloudReady||cloudRole!=='admin'||!cloudClient||!cloudCfg?.sessionId)return;
  if(cloudBusy)return;

  autoReconcileBusyV335=true;
  try{
    /* 1. Relire les réponses/validations des testeurs. */
    await reloadCloudAnswers();

    /* 2. Relire la copie de secours des validations dans la session. */
    const {data:session,error}=await cloudClient
      .from('test_culinaire_sessions')
      .select('config')
      .eq('session_id',cloudCfg.sessionId)
      .maybeSingle();
    if(!error&&session?.config){
      mergeValidationBackupFromServerV335(session.config);

      /* Récupérer aussi une fermeture effectuée automatiquement sur l'autre
         appareil, sans attendre une intervention manuelle. */
      if(session.config?.juryClose?.closedAt && !state.config?.juryClose?.closedAt){
        try{
          const localCfg=state.config;
          preserveRicherAdminWorkflowV323(localCfg,session.config);
          originalSaveState();
        }catch(e){}
      }
    }

    /* 3. Dès qu'un administrateur a vu une nouvelle validation, la recopier
       automatiquement dans la configuration partagée pour tous les appareils. */
    await publishValidationBackupV335();

    /* 4. Lorsque toutes les fiches sont complètes et validées, terminer le
       jury automatiquement, quel que soit l'écran affiché. */
    if(typeof juryReadyToClose==='function' &&
       typeof autoCloseJuryIfReady==='function' &&
       !isJuryClosed() &&
       juryReadyToClose()){
      await autoCloseJuryIfReady();
    }

    setCloudStatus('online','● Partagé sécurisé');
  }catch(e){
    console.warn('V335 : rapprochement automatique différé',e);
  }finally{
    autoReconcileBusyV335=false;
  }
}

/* Au démarrage/reconnexion, la copie de secours 4/4 est appliquée immédiatement. */
const rebuildLocalFromCloudBeforeV335=rebuildLocalFromCloud;
rebuildLocalFromCloud=function(config,rows=[]){
  rebuildLocalFromCloudBeforeV335(config,rows);
  if(cloudRole==='admin'){
    mergeValidationBackupFromServerV335(config||{});
    originalSaveState();
    setAnswerHashesFromLocalV328();
  }
};

/* Toute nouvelle réponse/validation reçue déclenche immédiatement le
   rapprochement complet, sans bouton "Recharger". */
const reloadCloudAnswersBeforeV335=reloadCloudAnswers;
reloadCloudAnswers=async function(){
  await reloadCloudAnswersBeforeV335();

  if(cloudRole==='admin'){
    try{
      await publishValidationBackupV335();
      if(typeof juryReadyToClose==='function' &&
         typeof autoCloseJuryIfReady==='function' &&
         !isJuryClosed() &&
         juryReadyToClose()){
        await autoCloseJuryIfReady();
      }
    }catch(e){}
    setCloudStatus('online','● Partagé sécurisé');
  }
};
window.reloadCloudAnswers=reloadCloudAnswers;

/* Toute mise à jour de configuration reçue (S24 ou ordinateur) récupère aussi
   automatiquement les validations certifiées et la fin de jury. */
const reloadCloudConfigBeforeV335=reloadCloudConfig;
reloadCloudConfig=async function(){
  await reloadCloudConfigBeforeV335();
  if(cloudRole==='admin'){
    mergeValidationBackupFromServerV335(state.config||{});
    try{
      if(typeof juryReadyToClose==='function' &&
         typeof autoCloseJuryIfReady==='function' &&
         !isJuryClosed() &&
         juryReadyToClose()){
        await autoCloseJuryIfReady();
      }
    }catch(e){}
    setCloudStatus('online','● Partagé sécurisé');
  }
};
window.reloadCloudConfig=reloadCloudConfig;

/* Filet de sécurité : si un événement temps réel est raté (Wi-Fi, veille,
   changement de réseau), un contrôle discret toutes les 4 secondes remet
   automatiquement les appareils au même état. Aucun clignotement du bandeau. */
setInterval(function(){
  try{
    if(!cloudReady||cloudRole!=='admin'||cloudBusy||autoReconcileBusyV335)return;
    if(typeof isJuryOfficiallyOpen==='function' &&
       typeof isJuryClosed==='function' &&
       isJuryOfficiallyOpen() &&
       !isJuryClosed()){
      automaticReconcileV335();
    }
  }catch(e){}
},4000);

window.addEventListener('online',function(){
  setTimeout(function(){try{automaticReconcileV335()}catch(e){}},500);
});

/* Un premier rapprochement est lancé après l'ouverture de l'application. */
setTimeout(function(){try{automaticReconcileV335()}catch(e){}},1800);
