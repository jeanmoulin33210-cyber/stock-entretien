/* --- V32 : diagnostic sécurité Supabase final --- */
let serverSecurityDiagnosticV32=null;

function securityDiagRow(ok,title,detail,kind){
  const cls=kind||(ok?'ok':'bad');
  return `<div class="server-diag-row ${cls}"><i>${cls==='ok'?'✓':cls==='bad'?'×':'i'}</i><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div></div>`
}
async function checkServerSecurityV32(){
  const box=$('#serverSecurityDiagnostic'),grid=$('#serverSecurityDiagnosticGrid');
  box.classList.add('show');grid.innerHTML=securityDiagRow(true,'Diagnostic en cours','Authentification Supabase et contrôle des règles serveur…','info');
  try{
    cloudCfg.url=$('#cloudUrl')?.value.trim()||cloudCfg.url;
    cloudCfg.key=$('#cloudKey')?.value.trim()||cloudCfg.key;
    cloudCfg.sessionId=$('#cloudSession')?.value.trim()||cloudCfg.sessionId;
    if(!cloudCfg.url||!cloudCfg.key)throw new Error('Renseignez d’abord le Project URL et la clé publique Supabase.');
    saveCloudCfg();buildCloudClient();await ensureCloudAuth();
    const args={p_session_id:cloudCfg.sessionId||null};
    const {data,error}=await cloudClient.rpc('test_culinaire_security_status',args);
    if(error){
      if(rpcsMissing(error))throw new Error('Le SQL V32 n’est pas encore installé. Utilisez le fichier « installation_supabase_tests_culinaires_v32_securite.sql ».');
      throw error
    }
    const d=data||{};serverSecurityDiagnosticV32=d;
    const rls=d.rls||{};
    const versionOk=Number(d.version)===32;
    const rlsOk=!!rls.sessions&&!!rls.reponses&&!!rls.memberships&&!!rls.access_codes;
    const policiesOk=Number(d.legacy_anon_policy_count||0)===0;
    const guardOk=!!d.public_config_guard;
    const publicSafe=d.public_config_has_supplier!==true;
    const authOk=!!d.authenticated;
    const allCore=versionOk&&rlsOk&&policiesOk&&guardOk&&publicSafe&&authOk;
    grid.innerHTML=[
      securityDiagRow(versionOk,'Version SQL',versionOk?'V32 installée.':`Version reçue : ${d.version??'inconnue'}.`),
      securityDiagRow(authOk,'Supabase Auth',authOk?'Identité authentifiée sur cet appareil.':'Aucune identité Supabase authentifiée.'),
      securityDiagRow(rlsOk,'RLS sur les 4 tables',rlsOk?'Sessions, réponses, rôles et codes sont protégés par RLS.':'Au moins une table n’a pas RLS actif.'),
      securityDiagRow(policiesOk,'Anciennes politiques permissives',policiesOk?'Aucune politique anon héritée détectée.':`${d.legacy_anon_policy_count} politique(s) anon détectée(s).`),
      securityDiagRow(guardOk,'Masquage fournisseurs côté serveur',guardOk?'Le garde-fou public_config est actif.':'Le trigger de masquage automatique est absent.'),
      securityDiagRow(publicSafe,'Configuration publique',publicSafe?'Aucun champ fournisseur détecté dans la configuration publique de cette session.':'Attention : un champ fournisseur apparaît dans public_config.'),
      securityDiagRow(true,'Session',d.session_exists?`Session trouvée · rôle actuel : ${d.membership_role||'aucun'}.`:'Aucune session sélectionnée ; le contrôle global reste valable.','info')
    ].join('');
    serverSecurityStatus(allCore?'Sécurité serveur V32 vérifiée ✓':'Sécurité V32 à corriger',
      allCore?'RLS, authentification, suppression des anciennes politiques et masquage fournisseurs sont vérifiés côté serveur.':'Le diagnostic a trouvé au moins un point à corriger avant un vrai jury.',allCore);
    if(allCore)toast('Sécurité Supabase V32 vérifiée ✓')
  }catch(e){
    serverSecurityDiagnosticV32=null;
    grid.innerHTML=securityDiagRow(false,'Diagnostic impossible',e.message||String(e),'bad');
    serverSecurityStatus('Sécurité serveur V32 non vérifiée',e.message||String(e),false)
  }
}
let continueShareAfterSecurity=false;

async function ensurePhoneShareCredentials(){
  state.config=state.config||{};
  state.config.security=state.config.security||{};

  let token=getRawAdminTokenV20();
  if(!token){
    token=randomSecret(24);
    setStoredAdminToken(token);
  }

  const currentTokenHash=await secureHash('admin:'+token);
  const storedHash=String(state.config.security.adminTokenHash||'');
  const previousSessionId=String(currentJuryShareSessionId?.()||state.config?._shareSessionId||'');

  /* V239 — admin_token_mismatch :
     une ancienne fiche de jury peut conserver le hash d'un autre navigateur.
     Sans session cloud existante, le bon hash est celui du jeton admin local.
     Si une ancienne session existe mais que le jeton ne correspond plus,
     on détache uniquement cette ancienne session et on en recréera une neuve. */
  if(!storedHash || storedHash!==currentTokenHash){
    if(previousSessionId){
      try{
        if(cloudReady && cloudCfg?.sessionId===previousSessionId && typeof disconnectCloud==='function'){
          await disconnectCloud();
        }
      }catch(e){console.warn('Déconnexion ancienne session non bloquante',e)}
      delete state.config._shareSessionId;
      delete state.config._phoneShareSignature;
    }
    state.config.security.adminTokenHash=currentTokenHash;
    setStoredAdminToken(token);
  }

  ensureTesterCodes();
  state.config.security.serverSecurityVersion=32;
  state.config.security.updatedAt=new Date().toISOString();

  originalSaveState();

  if(typeof upsertPreparedJury==='function'&&currentJuryPhase()==='prep'){
    upsertPreparedJury(state);
  }
  return true;
}

async function recoverRunningShareFromCachedAuthV251(){
  const cfg=state?.config;
  if(!cfg||!cfg.juryLaunch?.openedAt)return false;
  if(!window.supabase?.createClient)return false;

  const authKeys=[];
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&k.startsWith('jm-tc-auth-'))authKeys.push(k);
    }
  }catch(e){}

  if(!authKeys.length)return false;

  const url=String(cloudCfg?.url||DEFAULT_SUPABASE_URL||'').trim();
  const key=String(cloudCfg?.key||DEFAULT_SUPABASE_KEY||'').trim();
  if(!url||!key)return false;

  for(const storageKey of authKeys){
    let tmp=null;
    try{
      tmp=window.supabase.createClient(url,key,{
        auth:{
          persistSession:true,
          autoRefreshToken:true,
          detectSessionInUrl:false,
          storageKey
        }
      });

      const {data:{session},error:sessionError}=await tmp.auth.getSession();
      if(sessionError||!session?.user)continue;

      /* Les règles RLS ne renvoient que les appartenances de cette identité. */
      const {data:memberships,error:membershipError}=await tmp
        .from('test_culinaire_memberships')
        .select('session_id,role,tester_no')
        .eq('role','admin');
      if(membershipError||!Array.isArray(memberships)||!memberships.length)continue;

      for(const membership of memberships){
        const sid=String(membership?.session_id||'').trim();
        if(!sid)continue;

        const {data:remote,error:remoteError}=await tmp
          .from('test_culinaire_sessions')
          .select('session_id,config')
          .eq('session_id',sid)
          .maybeSingle();
        if(remoteError||!remote?.config)continue;

        if(typeof shareRecoverySameJuryV251==='function' &&
           !shareRecoverySameJuryV251(cfg,remote.config))continue;

        if(typeof shareRecoveryMergeV251==='function'){
          shareRecoveryMergeV251(cfg,remote.config,sid);
        }else{
          cfg._shareSessionId=sid;
          if(cfg.juryLaunch?.openedAt)cfg.juryLaunch={...(cfg.juryLaunch||{}),sessionId:sid};
          cfg._phoneShareSignature=phoneShareSignature(cfg);
        }

        cloudCfg.url=url;
        cloudCfg.key=key;
        cloudCfg.sessionId=sid;
        cloudCfg.accessCode='';
        cloudClient=tmp;
        cloudUserId=session.user.id;
        cloudRole='admin';
        cloudTesterNo=null;
        cloudReady=true;

        try{
          if(typeof rememberRecoveredAuthStorageKeyV251==='function'){
            rememberRecoveredAuthStorageKeyV251(sid,storageKey);
          }
        }catch(e){}

        saveCloudCfg();
        await subscribeCloud();
        originalSaveState();

        try{
          if(typeof upsertPreparedJury==='function'&&!cfg?.juryClose?.closedAt){
            upsertPreparedJury(state);
          }
        }catch(e){}

        setCloudStatus('online','● Partagé sécurisé');
        toast('Session QR du jury retrouvée ✓');
        return true;
      }
    }catch(e){
      console.warn('Ancienne identité Supabase ignorée',storageKey,e);
    }
  }
  return false;
}

async function recoverRunningShareSessionFromCloudV251(){
  const cfg=state?.config;
  if(!cfg||!cfg.juryLaunch?.openedAt)return false;

  try{
    if(typeof recoverRunningPhoneShareLocalV251==='function'){
      const sid=recoverRunningPhoneShareLocalV251(cfg);
      if(sid&&phoneSharePrepared(cfg))return true;
    }
  }catch(e){}

  const candidates=[];
  const seen=new Set();
  const addSid=s=>{
    s=String(s||'').trim();
    if(!s||seen.has(s))return;
    seen.add(s);candidates.push(s);
  };

  try{addSid(cloudCfg?.sessionId)}catch(e){}
  try{
    const saved=JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY)||'{}');
    addSid(saved?.sessionId);
  }catch(e){}
  try{
    const reset=JSON.parse(localStorage.getItem('jm_tc_lots_reset_backup_v207')||'null');
    const raw=reset?.items?.[CLOUD_STORAGE_KEY];
    const saved=raw?JSON.parse(raw):null;
    addSid(saved?.sessionId);
  }catch(e){}
  try{addSid(new URLSearchParams(location.search).get('session'))}catch(e){}

  if(!candidates.length){
    return await recoverRunningShareFromCachedAuthV251();
  }

  const previousCloud={
    url:String(cloudCfg?.url||''),
    key:String(cloudCfg?.key||''),
    sessionId:String(cloudCfg?.sessionId||''),
    accessCode:String(cloudCfg?.accessCode||'')
  };

  for(const sid of candidates){
    try{
      cloudCfg.url=String(cloudCfg.url||DEFAULT_SUPABASE_URL).trim();
      cloudCfg.key=String(cloudCfg.key||DEFAULT_SUPABASE_KEY).trim();
      cloudCfg.sessionId=sid;
      cloudCfg.accessCode='';
      saveCloudCfg();

      buildCloudClient();
      setCloudStatus('syncing','● Recherche de la session QR…');
      await ensureCloudAuth();
      await joinSecureSession();
      if(cloudRole!=='admin')throw new Error('Session non administrateur');

      const {data,error}=await cloudClient
        .from('test_culinaire_sessions')
        .select('session_id,config')
        .eq('session_id',sid)
        .maybeSingle();
      if(error||!data?.config)throw (error||new Error('Session introuvable'));

      if(typeof shareRecoverySameJuryV251!=='function'||
         !shareRecoverySameJuryV251(cfg,data.config)){
        throw new Error('Cette session appartient à un autre jury');
      }

      if(typeof shareRecoveryMergeV251==='function'){
        shareRecoveryMergeV251(cfg,data.config,sid);
      }else{
        cfg._shareSessionId=sid;
        if(cfg.juryLaunch?.openedAt)cfg.juryLaunch={...(cfg.juryLaunch||{}),sessionId:sid};
        cfg._phoneShareSignature=phoneShareSignature(cfg);
      }

      cloudReady=true;
      saveCloudCfg();
      await subscribeCloud();
      originalSaveState();
      try{
        if(typeof upsertPreparedJury==='function'&&!cfg?.juryClose?.closedAt){
          upsertPreparedJury(state);
        }
      }catch(e){}
      setCloudStatus('online','● Partagé sécurisé');
      toast('Ancienne session QR retrouvée ✓');
      return true;
    }catch(e){
      console.warn('Session QR candidate ignorée',sid,e);
      try{
        if(cloudChannel&&cloudClient)await cloudClient.removeChannel(cloudChannel);
      }catch(err){}
      try{
        if(cloudPresenceChannel&&cloudClient)await cloudClient.removeChannel(cloudPresenceChannel);
      }catch(err){}
      cloudChannel=null;cloudPresenceChannel=null;cloudReady=false;cloudRole=null;cloudTesterNo=null;
    }
  }

  cloudCfg.url=previousCloud.url||DEFAULT_SUPABASE_URL;
  cloudCfg.key=previousCloud.key||DEFAULT_SUPABASE_KEY;
  cloudCfg.sessionId=previousCloud.sessionId;
  cloudCfg.accessCode=previousCloud.accessCode;
  saveCloudCfg();
  setCloudStatus('local','● Hors ligne');
  return await recoverRunningShareFromCachedAuthV251();
}

async function createReplacementRunningQrSessionV251(){
  if(!state?.config?.juryLaunch?.openedAt){
    throw new Error('Ce jury n’est pas marqué comme étant en cours.');
  }

  const backupKey='jm_tc_qr_repair_backup_v251';
  const stateBackup=deepClone(state);
  const cloudBackup={
    url:String(cloudCfg?.url||''),
    key:String(cloudCfg?.key||''),
    sessionId:String(cloudCfg?.sessionId||''),
    accessCode:String(cloudCfg?.accessCode||'')
  };

  try{
    localStorage.setItem(backupKey,JSON.stringify({
      createdAt:new Date().toISOString(),
      state:stateBackup,
      cloud:cloudBackup
    }));
  }catch(e){}

  const originalOpenedAt=String(state.config.juryLaunch.openedAt||'');
  const originalInstanceId=String(
    state.config.juryLaunch.instanceId||
    state.config._juryInstanceId||
    state.config.juryInstanceId||
    ''
  ).trim()||ensureJuryInstanceId(state.config);

  try{
    /* Préparer les preuves de sécurité administrateur et les codes testeurs. */
    await ensurePhoneShareCredentials();

    if(cloudReady && typeof disconnectCloud==='function'){
      try{await disconnectCloud()}catch(e){}
    }

    cloudCfg.url=String(cloudCfg.url||cloudBackup.url||DEFAULT_SUPABASE_URL).trim();
    cloudCfg.key=String(cloudCfg.key||cloudBackup.key||DEFAULT_SUPABASE_KEY).trim();
    cloudCfg.sessionId=crypto.randomUUID();
    cloudCfg.accessCode='';

    const sid=cloudCfg.sessionId;

    state.config._shareSessionId=sid;
    state.config._juryInstanceId=originalInstanceId;
    state.config.juryInstanceId=originalInstanceId;
    state.config.juryLaunch={
      ...(state.config.juryLaunch||{}),
      openedAt:originalOpenedAt,
      instanceId:originalInstanceId,
      sessionId:sid,
      mode:'shared'
    };

    ensureTesterCodes();
    originalSaveState();
    saveCloudCfg();

    buildCloudClient();
    setCloudStatus('syncing','● Création des nouveaux QR codes…');
    await ensureCloudAuth();
    await createSecureCloudSession();

    cloudReady=true;
    cloudRole='admin';
    cloudTesterNo=null;

    /* Recopier toutes les réponses et validations actuellement présentes. */
    lastCloudAnswerHashes=new Map();
    await pushAllAnswers();

    saveCloudCfg();
    await subscribeCloud();

    state.config._phoneShareSignature=phoneShareSignature(state.config);
    originalSaveState();

    /* Republier le jury comme déjà lancé avec la date et l'identité d'origine. */
    await publishOfficialLaunchToCloud();

    try{
      if(typeof upsertPreparedJury==='function'&&!state.config?.juryClose?.closedAt){
        upsertPreparedJury(state);
      }
    }catch(e){}

    if(typeof syncDirtyToCloud==='function'){
      try{
        lastCloudConfigHash='';
        await syncDirtyToCloud();
      }catch(e){}
    }

    setCloudStatus('online','● Partagé sécurisé');
    toast('Nouveaux QR codes créés — réponses conservées ✓');
    return true;
  }catch(e){
    console.error('Création de la session QR de remplacement impossible',e);

    /* Restaurer strictement l'état local antérieur si la réparation échoue. */
    state=deepClone(stateBackup);
    try{originalSaveState()}catch(err){}

    cloudReady=false;
    cloudRole=null;
    cloudTesterNo=null;
    cloudCfg.url=cloudBackup.url||DEFAULT_SUPABASE_URL;
    cloudCfg.key=cloudBackup.key||DEFAULT_SUPABASE_KEY;
    cloudCfg.sessionId=cloudBackup.sessionId;
    cloudCfg.accessCode=cloudBackup.accessCode;
    try{saveCloudCfg()}catch(err){}
    setCloudStatus('local','● Hors ligne');

    throw new Error(
      'Impossible de créer les nouveaux QR codes. '+
      (e?.message||e)
    );
  }
}

async function ensurePreparedShareConnected(){
  /* V251 — un jury déjà lancé peut être repris après rechargement sans perdre
     sa session QR. On restaure d'abord les métadonnées connues. */
  try{
    if(typeof repairRunningPhoneShareMetadataV251==='function'){
      repairRunningPhoneShareMetadataV251(state.config);
    }
  }catch(e){}

  const expected=currentJuryShareSessionId();
  if(!phoneSharePrepared(state.config)||!expected){
    throw new Error('La session QR de ce jury ne peut pas être retrouvée automatiquement.')
  }
  if(launchShareReady())return true;

  if(cloudReady && cloudCfg?.sessionId!==expected){
    await disconnectCloud();
  }

  cloudCfg.url=String(cloudCfg.url||DEFAULT_SUPABASE_URL).trim();
  cloudCfg.key=String(cloudCfg.key||DEFAULT_SUPABASE_KEY).trim();
  cloudCfg.sessionId=expected;
  cloudCfg.accessCode='';
  saveCloudCfg();

  buildCloudClient();
  setCloudStatus('syncing','● Connexion sécurisée…');
  await ensureCloudAuth();
  await joinSecureSession();
  cloudReady=true;
  saveCloudCfg();
  await subscribeCloud();

  state.config._shareSessionId=expected;
  if(state.config?.juryLaunch?.openedAt){
    state.config.juryLaunch={...(state.config.juryLaunch||{}),sessionId:expected};
  }
  state.config._phoneShareSignature=phoneShareSignature(state.config);
  originalSaveState();
  try{
    if(typeof upsertPreparedJury==='function'&&!state.config?.juryClose?.closedAt){
      upsertPreparedJury(state);
    }
  }catch(e){}

  if(typeof syncDirtyToCloud==='function'){
    lastCloudConfigHash='';
    await syncDirtyToCloud();
  }

  setCloudStatus('online','● Partagé sécurisé');
  return true
}


function rememberConfigPhonePosition(){
  const step=$('#configPhonesStep');
  return{
    scrollY:window.scrollY||window.pageYOffset||0,
    viewportTop:step?step.getBoundingClientRect().top:null
  };
}
function restoreConfigPhonePosition(pos){
  if(!pos)return;
  const restore=()=>{
    const step=$('#configPhonesStep');
    if(step && Number.isFinite(pos.viewportTop)){
      const delta=step.getBoundingClientRect().top-pos.viewportTop;
      if(Math.abs(delta)>1)window.scrollBy(0,delta);
    }else{
      window.scrollTo(0,Number(pos.scrollY)||0);
    }
  };
  // Safari/iPad may finish layout one frame later.
  requestAnimationFrame(()=>{
    restore();
    setTimeout(restore,80);
  });
}

async function quickSharePhones(origin='launch'){
  const fromConfig=origin==='config';
  const configPhonePosition=fromConfig?rememberConfigPhonePosition():null;
  ensureJuryInstanceId(state.config);
  if(state.config?.juryLaunch?.openedAt && String(state.config.juryLaunch.instanceId||'')!==juryInstanceId(state.config)){
    delete state.config.juryLaunch;
    delete state.config.juryClose;
    originalSaveState();
  }
  const btn=fromConfig?$('#configPreparePhonesBtn'):$('#launchCloudBtn');
  if(launchShareReady()&&phoneSharePrepared(state.config)){
    if(fromConfig){
      draftConfig=deepClone(state.config);
      renderConfigPhoneShare();
      restoreConfigPhonePosition(configPhonePosition);
    }else{
      renderLaunchView();
    }
    return;
  }

  const blocking=launchBlockingError();
  if(blocking){
    alert(`Corrigez d’abord : ${blocking}.`);
    return;
  }

  await ensurePhoneShareCredentials();

  const previousSessionId=currentJuryShareSessionId();
  let createdNew=false;

  try{
    if(btn){
      btn.disabled=true;
      btn.textContent='⏳ Préparation des téléphones…';
    }
    const shareState=fromConfig?$('#configPhoneDetail'):$('#launchShareState');
    if(shareState)shareState.textContent='Préparation en cours…';

    /* Si une autre session est encore connectée, on la quitte sans changer de page. */
    if(cloudReady && (!previousSessionId || cloudCfg.sessionId!==previousSessionId)){
      await disconnectCloud();
    }

    cloudCfg.url=String(cloudCfg.url||DEFAULT_SUPABASE_URL).trim();
    cloudCfg.key=String(cloudCfg.key||DEFAULT_SUPABASE_KEY).trim();

    if(previousSessionId){
      /* Reconnexion silencieuse à la session déjà créée pour ce jury. */
      cloudCfg.sessionId=previousSessionId;
      cloudCfg.accessCode='';
      saveCloudCfg();
      buildCloudClient();
      setCloudStatus('syncing','● Connexion sécurisée…');
      await ensureCloudAuth();
      await joinSecureSession();
      cloudReady=true;
      saveCloudCfg();
      await subscribeCloud();
      lastCloudConfigHash='';
      await syncDirtyToCloud();
    }else{
      /* Première préparation de ce jury : création automatique d'une session neuve. */
      cloudCfg.sessionId=crypto.randomUUID();
      cloudCfg.accessCode='';
      state.config._shareSessionId=cloudCfg.sessionId;
      originalSaveState();
      createdNew=true;

      saveCloudCfg();
      buildCloudClient();
      setCloudStatus('syncing','● Préparation des téléphones…');
      await ensureCloudAuth();
      await createSecureCloudSession();
      cloudReady=true;
      await pushAllAnswers();
      saveCloudCfg();
      await subscribeCloud();
      lastCloudConfigHash=hashJson(state.config);
    }

    state.config._shareSessionId=cloudCfg.sessionId;
    state.config._phoneShareSignature=phoneShareSignature(state.config);
    originalSaveState();

    if(typeof upsertPreparedJury==='function'&&currentJuryPhase()==='prep'){
      upsertPreparedJury(state);
    }

    if(typeof syncDirtyToCloud==='function'){
      try{
        lastCloudConfigHash='';
        await syncDirtyToCloud();
      }catch(e){}
    }

    setCloudStatus('online','● Partagé sécurisé');
    if(fromConfig){
      draftConfig=deepClone(state.config);
      renderConfig();
      restoreConfigPhonePosition(configPhonePosition);
    }else{
      renderLaunchView();
    }
    toast('Téléphones prêts ✓');
  }catch(e){
    console.error(e);

    if(createdNew && state.config?._shareSessionId===cloudCfg.sessionId){
      delete state.config._shareSessionId;
      originalSaveState();
      if(typeof upsertPreparedJury==='function'&&currentJuryPhase()==='prep'){
        upsertPreparedJury(state);
      }
    }

    cloudReady=false;
    setCloudStatus('error','● Erreur de partage');
    if(fromConfig){
      draftConfig=deepClone(state.config);
      renderConfig();
      restoreConfigPhonePosition(configPhonePosition);
    }else{
      renderLaunchView();
    }
    {
      const raw=String(e?.message||e||'');
      const friendly=/admin_token_mismatch/i.test(raw)
        ?'L’ancienne autorisation administrateur de ce jury ne correspondait plus à cet appareil. Rechargez la page puis relancez « Préparer les téléphones » : une nouvelle session sécurisée sera créée automatiquement.'
        :raw;
      alert(`Le partage n’a pas pu être préparé. ${friendly}`);
    }
  }
}

async function createFreshSecureSessionV32(){
  if(cloudReady&&!confirm('Créer une nouvelle session partagée à partir du jury actuellement affiché ? La session déjà connectée ne sera pas supprimée.'))return;
  cloudCfg.url=$('#cloudUrl')?.value.trim()||cloudCfg.url;
  cloudCfg.key=$('#cloudKey')?.value.trim()||cloudCfg.key;
  if(!cloudCfg.url||!cloudCfg.key){alert('Renseignez d’abord le Project URL et la clé publique Supabase.');return}
  cloudCfg.sessionId=crypto.randomUUID();cloudCfg.accessCode='';
  $('#cloudSession').value=cloudCfg.sessionId;saveCloudCfg();
  try{await connectCloud({create:true})}
  catch(e){setCloudStatus('error','● Erreur');cloudMsg(e.message||String(e),'bad');serverSecurityStatus('Sécurité serveur non prête',e.message||String(e),false)}
}
$('#checkServerSecurityBtn').onclick=checkServerSecurityV32;
/* En V32, "Créer" signifie toujours créer un nouvel identifiant de session.
   La connexion à une session existante reste le bouton voisin. */
$('#createCloudSessionBtn').onclick=createFreshSecureSessionV32;
