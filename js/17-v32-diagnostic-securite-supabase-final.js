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
      delete state.config.juryLaunch;
      delete state.config.juryClose;
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

async function ensurePreparedShareConnected(){
  const expected=currentJuryShareSessionId();
  if(!phoneSharePrepared(state.config)||!expected){
    throw new Error('Les téléphones n’ont pas encore été préparés pour ce jury.')
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
