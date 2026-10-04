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
function setCloudStatus(kind='local',text='● Local'){
  const els=[document.getElementById('cloudStatus'),document.getElementById('cloudPageStatus')].filter(Boolean);
  els.forEach(el=>{el.className='cloud-status'+(kind==='online'?' online':kind==='syncing'?' syncing':kind==='error'?' error':'');el.textContent=text});
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
function renderCloudPage(){
  showView('cloudView');$('#headerTitle').textContent='Partage téléphones';$('#headerSub').textContent='Synchronisation sécurisée des testeurs';
  $('#cloudUrl').value=cloudCfg.url||'';$('#cloudKey').value=cloudCfg.key||'';$('#cloudSession').value=cloudCfg.sessionId||'';
  if(cloudReady)serverSecurityStatus(`Sécurité serveur active · ${cloudRole==='admin'?'Administrateur':`Testeur ${cloudTesterNo||''}`}`,`Utilisateur Supabase authentifié. RLS limite les données accessibles à ce rôle.`,true);
  else serverSecurityStatus('Sécurité serveur V32','Supabase Auth + rôles + RLS. Le script SQL V20 doit avoir été exécuté et les connexions anonymes activées.',true);
  renderShareLinks()
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
function shareUrl(testerNo=null){
  const u=new URL(currentBaseUrl());
  u.searchParams.set('appBuild','220');
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
function cloudAuthStorageKey(){
  const project=String(cloudCfg.url||'').replace(/\W+/g,'-').slice(-28)||'project';
  const session=String(cloudCfg.sessionId||'local').replace(/\W+/g,'-').slice(-24)||'session';
  const wanted=requestedCloudIdentity();
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

function rebuildLocalFromCloud(config,rows=[]){
  updateTesterActivityFromRows(rows);
  const previous=state?.testers||{};
  state=makeInitialState(config);
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
        state.config.juryLaunch={openedAt,instanceId:instanceId||juryInstanceId(state.config)};
      }
      return
    }
    const k=sampleKey(r.product_id,r.sample_id);
    state.testers[t].answers[k]={choices:Array.isArray(r.choices)?r.choices:Array(QUESTIONS.length).fill(null),remarks:Array.isArray(r.remarks)?r.remarks:Array(QUESTIONS.length).fill('')}
  });
  originalSaveState();
  currentTester=cloudRole==='tester'?(cloudTesterNo||guestTester||1):(Math.min(currentTester,state.config.testerCount)||1);
  currentProduct=state.config.products[0]?.id||'';
  currentSample=state.config.products[0]?.samples[0]?.id||'';
  adminProduct=currentProduct;
  lastCloudConfigHash=hashJson(state.config);lastCloudAnswerHashes=new Map();
  for(let t=1;t<=state.config.testerCount;t++){
    Object.entries(state.testers[t]?.answers||{}).forEach(([k,a])=>lastCloudAnswerHashes.set(`${t}::${k}`,hashJson(a)));
    lastCloudAnswerHashes.set(`${t}::__validation__`,hashJson(state.testers[t]?.validatedAt||null))
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
  saveCloudCfg();$('#cloudSession').value=cloudCfg.sessionId;
  await subscribeCloud();setCloudStatus('online','● Partagé sécurisé');
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
async function reloadCloudAnswers(){if(testerPreviewMode)return;
  if(!cloudReady||cloudBusy)return;
  let q=cloudClient.from('test_culinaire_reponses').select('tester_no,product_id,sample_id,choices,remarks,updated_at').eq('session_id',cloudCfg.sessionId);
  if(cloudRole==='tester')q=q.eq('tester_no',cloudTesterNo);
  const {data,error}=await q;if(error)return;
  updateTesterActivityFromRows(data||[]);
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
        state.config.juryLaunch={openedAt,instanceId:instanceId||juryInstanceId(state.config)};
      }
      return
    }
    state.testers[t].answers[sampleKey(r.product_id,r.sample_id)]={choices:r.choices||Array(QUESTIONS.length).fill(null),remarks:r.remarks||Array(QUESTIONS.length).fill('')}
  });
  originalSaveState();lastCloudAnswerHashes=new Map();
  (data||[]).forEach(r=>{
    const t=Number(r.tester_no);
    if(r.product_id==='__meta__'&&r.sample_id==='__validation__')lastCloudAnswerHashes.set(`${t}::__validation__`,hashJson(Array.isArray(r.remarks)?(r.remarks[0]||null):null));
    else if(r.product_id==='__meta__'&&r.sample_id==='__launch__')return;
    else lastCloudAnswerHashes.set(`${t}::${sampleKey(r.product_id,r.sample_id)}`,hashJson({choices:r.choices||[],remarks:r.remarks||[]}))
  });
  if($('#adminView').classList.contains('active'))originalRenderAdmin();else if($('#liveDayView')?.classList.contains('active'))renderLiveDayCards();else if($('#launchView')?.classList.contains('active'))renderLaunchView();else if($('#juryView')?.classList.contains('active'))renderJuryView();else if($('#homeView').classList.contains('active'))originalRenderHome();else if($('#testerView').classList.contains('active'))renderSample()
}
async function reloadCloudConfig(){if(testerPreviewMode)return;
  if(!cloudReady||cloudBusy)return;
  if(cloudRole==='admin'){
    const {data,error}=await cloudClient.from('test_culinaire_sessions').select('config').eq('session_id',cloudCfg.sessionId).maybeSingle();if(error||!data?.config)return;
    if(hashJson(data.config)===hashJson(state.config))return;
    const oldAnswers={},oldValidations={};for(let t=1;t<=state.config.testerCount;t++){oldAnswers[t]=deepClone(state.testers[t]?.answers||{});oldValidations[t]=state.testers[t]?.validatedAt||null}
    const newState=makeInitialState(data.config);for(let t=1;t<=newState.config.testerCount;t++){newState.testers[t].answers=oldAnswers[t]||{};newState.testers[t].validatedAt=oldValidations[t]||null}
    state=newState;originalSaveState();lastCloudConfigHash=hashJson(state.config)
  }else{
    const {data,error}=await cloudClient.rpc('test_culinaire_get_public_session',{p_session_id:cloudCfg.sessionId});if(error)return;
    const row=Array.isArray(data)?data[0]:data;if(!row?.public_config)return;
    const old=deepClone(state.testers[cloudTesterNo]?.answers||{}),val=state.testers[cloudTesterNo]?.validatedAt||null;
    const ns=makeInitialState(row.public_config);if(ns.testers[cloudTesterNo]){ns.testers[cloudTesterNo].answers=old;ns.testers[cloudTesterNo].validatedAt=val}
    state=ns;originalSaveState();lastCloudConfigHash=hashJson(state.config)
  }
  if($('#adminView').classList.contains('active'))originalRenderAdmin();else if($('#launchView')?.classList.contains('active'))renderLaunchView();else if($('#juryView')?.classList.contains('active'))renderJuryView();else if($('#homeView').classList.contains('active'))originalRenderHome();else if($('#testerView').classList.contains('active')){renderTesterSelectors();renderSample()}
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
  if(!cloudReady||cloudBusy)return;cloudBusy=true;setCloudStatus('syncing','● Synchronisation sécurisée…');
  try{
    if(cloudRole==='admin'){
      const cfgHash=hashJson(state.config);
      if(cfgHash!==lastCloudConfigHash){
        ensureTesterCodes();
        const {error}=await cloudClient.from('test_culinaire_sessions').update({config:state.config,public_config:makePublicCloudConfig(state.config),updated_at:new Date().toISOString()}).eq('session_id',cloudCfg.sessionId);
        if(error)throw error;
        await syncAccessCodes();lastCloudConfigHash=hashJson(state.config)
      }
    }
    const rows=[];
    const testers=cloudRole==='admin'?Array.from({length:state.config.testerCount},(_,i)=>i+1):[cloudTesterNo];
    for(const t of testers){
      if(!t||!state.testers[t])continue;
      for(const [k,a] of Object.entries(state.testers[t]?.answers||{})){
        const hk=`${t}::${k}`,h=hashJson(a);if(lastCloudAnswerHashes.get(hk)===h)continue;
        const [product_id,sample_id]=k.split('__');
        rows.push({session_id:cloudCfg.sessionId,tester_no:t,product_id,sample_id,choices:a.choices,remarks:a.remarks,updated_at:new Date().toISOString()});
        lastCloudAnswerHashes.set(hk,h)
      }
      const v=state.testers[t]?.validatedAt||null,vk=`${t}::__validation__`,vh=hashJson(v);
      if(lastCloudAnswerHashes.get(vk)!==vh){
        rows.push({session_id:cloudCfg.sessionId,tester_no:t,product_id:'__meta__',sample_id:'__validation__',choices:[],remarks:[v],updated_at:new Date().toISOString()});
        lastCloudAnswerHashes.set(vk,vh)
      }
    }
    if(rows.length){const {error}=await cloudClient.from('test_culinaire_reponses').upsert(rows,{onConflict:'session_id,tester_no,product_id,sample_id'});if(error)throw error}
    setCloudStatus('online','● Partagé sécurisé')
  }catch(e){
    console.error(e);setCloudStatus('error','● Erreur cloud');
    const msg=String(e?.message||e);
    cloudMsg(/row-level security|policy/i.test(msg)?'Sécurité Supabase : cette opération n’est pas autorisée pour ce rôle.':`Synchronisation impossible : ${msg}`,'bad')
  }finally{cloudBusy=false}
}
function scheduleCloudSync(){if(!cloudReady)return;clearTimeout(cloudSyncTimer);cloudSyncTimer=setTimeout(syncDirtyToCloud,300)}
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
      buildCloudClient();setCloudStatus('syncing','● Authentification…');await ensureCloudAuth();await joinSecureSession();await fetchCloudState();cloudReady=true;saveCloudCfg();await subscribeCloud();setCloudStatus('online','● Partagé sécurisé');
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
/* V32 gère la création d'une nouvelle session avec un UUID neuf. */
$('#connectCloudBtn').onclick=async()=>{try{await connectCloud({create:false})}catch(e){setCloudStatus('error','● Erreur');cloudMsg(e.message||String(e),'bad');serverSecurityStatus('Sécurité serveur non prête',e.message||String(e),false)}};
$('#disconnectCloudBtn').onclick=disconnectCloud;
$('#copyAdminLinkBtn').onclick=()=>{if(!cloudReady)return alert('Connectez d’abord la session partagée.');if(cloudRole!=='admin')return alert('Lien administrateur réservé à l’administrateur.');copyText(shareUrl(null),'Lien administrateur copié')};
autoConnectFromUrl();
