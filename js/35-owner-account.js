/* Owner e-mail account. Workspace authorization remains enforced by server
 * memberships and the existing owner proof. No password is saved by the app. */
(function(root){
  'use strict';
  const FIELD='jm_tc_owner_v385',PREF='jm_tc_account_v385',SPACE='jm_tc_account_space_v385';
  const ITERATIONS=600000;
  const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
  async function keyFor(password,salt){
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:ITERATIONS},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  async function seal(value,password){
    const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
    const key=await keyFor(password,salt);
    const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(FIELD)},key,new TextEncoder().encode(JSON.stringify(value)));
    return {v:1,salt:b64(salt),iv:b64(iv),ciphertext:b64(ciphertext)};
  }
  async function unseal(value,password){
    if(value?.v!==1||typeof value.ciphertext!=='string'||value.ciphertext.length>16000)throw new Error('Ce compte ne contient pas encore votre espace. Activez-le depuis un appareil propriétaire.');
    try{
      const salt=bytes(value.salt),iv=bytes(value.iv);
      if(salt.length!==16||iv.length!==12)throw new Error('Format');
      const key=await keyFor(password,salt);
      const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(FIELD)},key,bytes(value.ciphertext));
      return JSON.parse(new TextDecoder().decode(raw));
    }catch(e){throw new Error('L’accès à cet espace ne peut pas être déverrouillé avec ce mot de passe. Utilisez votre appareil déjà propriétaire pour rétablir le compte.');}
  }
  function validWorkspace(value,projectUrl){
    if(value?.v!==1||value.hub?.url!==projectUrl||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(projectUrl)||
       !/^[0-9a-f-]{36}$/i.test(value.hub?.sessionId||'')||
       !/^[0-9a-f]{32,256}$/i.test(value.adminToken||'')||!/^[0-9a-f]{32,256}$/i.test(value.ownerToken||'')){
      throw new Error('L’autorisation de cet espace est invalide. Aucun dossier n’a été modifié.');
    }
    return value;
  }
  function validAccountPassword(value){
    return typeof value==='string'&&value.length>=8&&/\p{Lu}/u.test(value)&&/[0-9]/.test(value);
  }
  const API={seal,unseal,validWorkspace,validAccountPassword,client:null,signedOut:false};
  if(typeof module==='object'&&module.exports){module.exports=API;return;}
  root.JuryAccountV385=API;
  let working=false,mode='login',candidate=null,candidateRemember=true,pending=false,extraCandidate=null;
  const el=id=>document.getElementById(id);
  function read(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(e){return fallback;}}
  const tester=()=>!!guestTester||!!new URLSearchParams(location.search).get('tester')||String(root.__JM_REQUESTED_ROLE_V199||'').startsWith('tester:');
  function message(text,bad=false){const box=el('accountMessageV385');box.textContent=text;box.style.color=bad?'#a22d36':'#245b6a';}
  function preference(){return read(PREF,{remember:true,enabled:false});}
  function accountClient(remember=true){
    if(candidate&&candidateRemember===remember)return candidate;
    if(candidate&&candidate!==API.client)candidate.auth.stopAutoRefresh();
    candidateRemember=remember;
    const storageKey='jm-tc-owner-account-v385'+(remember?'-persistent':'-tab');
    candidate=window.supabase.createClient(DEFAULT_SUPABASE_URL,DEFAULT_SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey,storage:remember?localStorage:sessionStorage}});
    candidate.__jmStorageKeyV357=storageKey;
    return candidate;
  }
  function extraAccountClient(){
    if(!extraCandidate)extraCandidate=window.supabase.createClient(DEFAULT_SUPABASE_URL,DEFAULT_SUPABASE_KEY,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'jm-tc-extra-admin-v449'}
    });
    return extraCandidate;
  }
  function busy(value){working=value;el('accountFormV385').querySelectorAll('button,input').forEach(n=>n.disabled=value);for(const id of ['accountCloseV385','accountLoginTabV385','accountSetupTabV385','accountExtraTabV449','accountSignoutV385'])el(id).disabled=value;}
  function setMode(next){
    mode=next;pending=false;
    const setup=next==='setup'||next==='extra';
    el('accountConfirmWrapV385').hidden=!setup;
    el('accountPinWrapV385').hidden=!setup||(next==='setup'&&!!root.JuryEstablishmentsV456?.isSchoolEmail(el('accountEmailV385').value.trim()));
    el('accountRememberWrapV449').hidden=next==='extra';
    el('accountSubmitV385').textContent=next==='extra'?'Créer le second accès administrateur':
      next==='setup'?(API.client?'Mettre à jour mon mot de passe':'Créer mon accès à cet espace'):'Se connecter';
    el('accountPasswordV385').autocomplete=setup?'new-password':'current-password';
    el('accountPasswordV385').minLength=setup?8:0;
    el('accountPasswordHelpV450').hidden=!setup;
    el('accountIntroV385').textContent=next==='extra'
      ?'Créez un autre compte avec accès total au même espace partagé. Votre compte actuel restera connecté. Choisissez une autre adresse et un mot de passe distinct ; votre PIN propriétaire autorisera la création.'
      :next==='setup'
      ?(API.client?'Choisissez votre nouveau mot de passe. Le PIN propriétaire sera demandé pour confirmer.':'À faire une seule fois sur un appareil déjà propriétaire. Vos lots et votre PIN sont conservés.')
      :'Retrouvez le même espace sur votre téléphone, votre iPad et votre ordinateur.';
    el('accountConfirmationV385').hidden=true;message('');
  }
  function open(next='login'){
    if(tester())return;
    setMode(next);
    el('accountTitleV385').textContent=root.JuryLoginGateV457?.locked?'Connexion à Tests culinaires':'Mon compte';
    el('accountModalV385').classList.add('show');
    el('accountRememberV385').checked=preference().remember!==false;
    el('accountSignoutV385').hidden=!API.client;
    el('accountExtraTabV449').hidden=!API.client||!!API.schoolMode;
    el('accountEmailV385').value=API.email||read(PREF,{email:''}).email||'';
    root.JuryLoginGateV457?.formReady();
    setTimeout(()=>el('accountEmailV385').focus(),50);
  }
  function close(){
    if(working||root.JuryLoginGateV457?.locked)return;
    el('accountModalV385').classList.remove('show');
    el('accountPasswordV385').value='';el('accountConfirmV385').value='';
    el('accountPinV385').value='';
  }
  async function verifiedConfig(c,value){
    validWorkspace(value,DEFAULT_SUPABASE_URL);
    const sid=value.hub.sessionId;
    let membership=await c.from('test_culinaire_memberships').select('role').eq('session_id',sid).maybeSingle();
    if(membership.error)throw membership.error;
    if(membership.data?.role!=='admin'){
      const joined=await c.rpc('test_culinaire_join_session',{p_session_id:sid,p_code:value.adminToken,p_tester_no:null});
      if(joined.error)throw new Error('Ce compte n’a pas accès à votre espace propriétaire. Les données existantes sont conservées.');
      membership=await c.from('test_culinaire_memberships').select('role').eq('session_id',sid).maybeSingle();
      if(membership.error||membership.data?.role!=='admin')throw new Error('Accès administrateur non confirmé.');
    }
    const result=await c.from('test_culinaire_sessions').select('config').eq('session_id',sid).maybeSingle();
    if(result.error||!result.data?.config)throw new Error('Impossible de charger votre espace. Réessayez avec une connexion Internet.');
    const security=result.data.config.security;
    if(!security?.ownerTokenHash||await secureHash('owner:'+value.ownerToken)!==security.ownerTokenHash||
       await secureHash('admin:'+value.adminToken)!==security.adminTokenHash)throw new Error('L’autorisation propriétaire de cet espace doit être rétablie depuis l’appareil d’origine.');
    return result.data.config;
  }
  async function activate(c,user,value,remember){
    if(tester())throw new Error('Un accès testeur ne peut pas ouvrir un compte propriétaire.');
    await verifiedConfig(c,value);
    API.schoolMode=false;document.body.classList.remove('establishment-account-v456');
    const old=read('jm_tc_owner_hub_v357');
    if(old&&old.sessionId!==value.hub.sessionId&&(loadPreparedJurys().length||loadSampleLotHistory().length||loadArchives().length)){
      throw new Error('Cet appareil contient un autre espace. Ses données sont conservées ; utilisez un autre profil de navigateur pour ouvrir ce compte.');
    }
    await verifyRecoveryValueV360('before-owner-account-v385',JSON.stringify({state,prepared:loadPreparedJurys(),archives:loadArchives(),samples:loadSampleLotHistory()}));
    const was=API.client;
    API.client=c;API.signedOut=false;API.email=user.email||'';
    try{
      await window.JuryOwnerSyncV357.bindAccount(c,value.hub);
      setStoredAdminToken(value.adminToken);setStoredOwnerToken(value.ownerToken);
      localStorage.removeItem('jm_tc_owner_disconnected_v353');
      root.__JM_REQUESTED_ROLE_V199='admin';
      localStorage.setItem('jm_tc_last_requested_role_v199','admin');
      const u=new URL(location.href);
      for(const k of ['session','adminToken','ownerToken','accessCode','supabaseUrl','supabaseKey','schoolLogin'])u.searchParams.delete(k);
      history.replaceState(null,'',u.toString());
      cloudCfg={url:DEFAULT_SUPABASE_URL,key:DEFAULT_SUPABASE_KEY,sessionId:value.hub.sessionId,accessCode:''};
      for(const [id,val]of [['cloudUrl',cloudCfg.url],['cloudKey',cloudCfg.key],['cloudSession',cloudCfg.sessionId]])if(el(id))el(id).value=val;
      guestTester=null;cloudClient=c;cloudRole='admin';cloudReady=true;cloudUserId=user.id;
      saveCloudCfg();
      await connectCloud({create:false});
      await refreshAdminAuthorization();await refreshOwnerAuthorization();
      setAdminSessionUnlocked(true);adminSecurityAuthorized=true;updateSecurityButtons();
      localStorage.setItem(PREF,JSON.stringify({enabled:true,remember,email:user.email||'',signedOut:false}));
      (remember?localStorage:sessionStorage).setItem(SPACE,JSON.stringify({v:1,hub:value.hub}));
      el('ownerAccountBtnV385').textContent='👤 Mon compte';
      el('accountModalV385').classList.remove('show');
      renderHome();
      try{await window.JuryOwnerSyncV357.loadAccount();}
      catch(e){el('accountModalV385').classList.add('show');throw e;}
      renderHome();
      root.JuryLoginGateV457?.release();
    }catch(e){if(!preference().enabled)API.client=was;throw e;}
  }
  async function finish(c,password,remember){
    const verified=await c.auth.getUser();
    if(verified.error||!verified.data?.user||!verified.data.user.email_confirmed_at)throw new Error('Confirmez d’abord votre adresse avec l’e-mail reçu, puis réessayez.');
    if(!verified.data.user.user_metadata?.[FIELD]&&root.JuryEstablishmentsV456){
      await root.JuryEstablishmentsV456.activate(c,verified.data.user,remember);
      return;
    }
    const value=await unseal(verified.data.user.user_metadata?.[FIELD],password);
    await activate(c,verified.data.user,value,remember);
    message('Connexion établie. Votre espace est disponible.');
    el('accountPasswordV385').value='';el('accountConfirmV385').value='';
    el('accountModalV385').classList.remove('show');
  }
  async function finishExtra(c,password){
    if(c===API.client)throw new Error('Le second accès doit utiliser une connexion séparée.');
    const verified=await c.auth.getUser();
    const user=verified.data?.user;
    if(verified.error||!user?.email_confirmed_at)throw new Error('Confirmez d’abord la seconde adresse dans votre messagerie.');
    const value=await unseal(user.user_metadata?.[FIELD],password);
    await verifiedConfig(c,value);
    const email=user.email;
    await c.auth.signOut({scope:'local'});
    extraCandidate=null;
    setMode('login');
    el('accountEmailV385').value=API.email||'';
    el('accountPasswordV385').value='';el('accountConfirmV385').value='';
    message('Second accès activé pour '+email+'. Il peut se connecter au même espace avec ses propres identifiants. Votre compte actuel est resté connecté.');
  }
  async function setupValue(){
    if(!isSecurityOwner())await refreshOwnerAuthorization();
    if(!isSecurityOwner())throw new Error('Activez le compte depuis un appareil déjà propriétaire et connecté au partage.');
    const ctx=await window.JuryOwnerSyncV357.accountContext();
    const value={v:1,hub:{url:ctx.descriptor.url,sessionId:ctx.descriptor.sessionId},adminToken:storedAdminToken(),ownerToken:storedOwnerToken()};
    await verifiedConfig(ctx.client,value);
    return value;
  }
  function friendly(e){
    const text=String(e?.message||e),code=String(e?.code||'');
    if(/Invalid login credentials/i.test(text))return 'Adresse e-mail ou mot de passe incorrect.';
    if(/Email not confirmed/i.test(text))return 'Confirmez votre adresse avec l’e-mail reçu, puis appuyez sur Se connecter.';
    if(/rate.limit|too many|over_email_send_rate_limit/i.test(text))return 'Trop de demandes rapprochées. Attendez avant de réessayer.';
    if(/email_address_not_authorized|Email address not authorized|only send|SMTP|Error sending confirmation/i.test(text+' '+code))return 'L’envoi des e-mails doit être configuré dans Supabase. Aucun lot n’a été supprimé.';
    if(/Failed to fetch|NetworkError|Load failed/i.test(text))return 'Connexion au serveur indisponible. Vos données sont conservées ; réessayez.';
    return text;
  }
  async function submit(e){
    e.preventDefault();if(working)return;busy(true);
    try{
      const email=el('accountEmailV385').value.trim(),password=el('accountPasswordV385').value,remember=el('accountRememberV385').checked;
      if(!email||!password)throw new Error('Saisissez votre adresse e-mail et votre mot de passe.');
      const c=mode==='extra'?extraAccountClient():accountClient(remember);
      message('Connexion en cours…');
      if((mode==='setup'||mode==='extra')&&!pending){
        if(mode==='extra'&&(!API.client||email.toLowerCase()===String(API.email||'').toLowerCase()))throw new Error('Utilisez une autre adresse e-mail pour le second accès.');
        if(!validAccountPassword(password))throw new Error('Choisissez un mot de passe d’au moins 8 caractères, avec une majuscule et un chiffre.');
        if(password!==el('accountConfirmV385').value)throw new Error('Les deux mots de passe sont différents.');
        if(mode==='setup'&&root.JuryEstablishmentsV456?.isSchoolEmail(email)){
          if(!/^jury-test[12]@mailo\\.com$/i.test(email))throw new Error('Les comptes 1 et 2 sont ouverts pour ce premier essai.');
          const r=await c.auth.signUp({email,password});if(r.error)throw r.error;
          if(!r.data?.session){
            pending=true;el('accountConfirmationV385').hidden=false;
            el('accountSubmitV385').textContent='J’ai confirmé mon adresse — terminer';
            message('Confirmez votre adresse dans votre messagerie, puis revenez ici pour vous connecter.');
            return;
          }
          await finish(c,password,remember);return;
        }
        const pin=el('accountPinV385').value.trim();
        if(!pin||!(await verifyPin(pin)))throw new Error('Saisissez votre PIN propriétaire actuel pour autoriser ce compte.');
        el('accountPinV385').value='';
        const value=await setupValue();
        const encrypted=await seal(value,password);
        let result;
        if(API.client===c){
          const current=await c.auth.getUser();if(current.error)throw current.error;
          if(current.data?.user?.email?.toLowerCase()!==email.toLowerCase())throw new Error('Conservez l’adresse de votre compte pour modifier son mot de passe.');
          result=await c.auth.updateUser({password,data:{[FIELD]:encrypted}});
          if(result.error)throw result.error;
          await finish(c,password,remember);return;
        }
        result=await c.auth.signUp({email,password,options:{data:{[FIELD]:encrypted}}});
        if(result.error)throw result.error;
        if(!result.data?.session){
          pending=true;el('accountConfirmationV385').hidden=false;
          el('accountSubmitV385').textContent='J’ai confirmé mon adresse — terminer';
          message('Ouvrez l’e-mail de confirmation, confirmez votre adresse, puis revenez ici. Si le compte existe déjà, utilisez Se connecter.');
          return;
        }
      }else{
        const confirmation=pending?el('accountEmailProofV385').value.trim():'';
        if(confirmation){
          let args;
          if(/^\d{6,10}$/.test(confirmation))args={email,token:confirmation,type:'signup'};
          else{
            let link;try{link=new URL(confirmation)}catch(e){throw new Error('Collez le lien de confirmation complet reçu dans votre messagerie.');}
            if(link.origin!==DEFAULT_SUPABASE_URL||!link.pathname.endsWith('/auth/v1/verify'))throw new Error('Ce lien de confirmation ne correspond pas à Tests culinaires.');
            const token=link.searchParams.get('token_hash')||link.searchParams.get('token');
            if(!token)throw new Error('Le lien de confirmation est incomplet.');
            args={token_hash:token,type:'signup'};
          }
          const result=await c.auth.verifyOtp(args);if(result.error)throw result.error;
          el('accountEmailProofV385').value='';
        }else{
          const result=await c.auth.signInWithPassword({email,password});if(result.error)throw result.error;
        }
      }
      if(mode==='extra')await finishExtra(c,password);
      else await finish(c,password,remember);
    }catch(e){message(friendly(e),true);}finally{busy(false);}
  }
  API.restore=async function(){
    if(tester())return false;
    root.JuryLoginGateV457?.lock();
    if(new URLSearchParams(location.search).has('schoolLogin')){
      API.schoolMode=true;document.body.classList.add('establishment-account-v456');
      open();
      const hint=sessionStorage.getItem('jm-school-login-hint-v456');if(hint)el('accountEmailV385').value=hint;
      message('Connectez-vous avec le compte de votre établissement.');
      return true;
    }
    const pref=preference();if(!pref.enabled){open();message('Identifiez-vous pour accéder à Tests culinaires.');return true;}
    if(pref.signedOut){API.signedOut=true;API.schoolMode=!!pref.schoolMode;open();return true;}
    const c=accountClient(pref.remember!==false);
    try{
      const auth=await c.auth.getSession();
      if(auth.error)throw auth.error;
      if(!auth.data?.session){open();message('Connectez-vous pour retrouver votre espace.');return true;}
      const verified=await c.auth.getUser();if(verified.error)throw verified.error;
      const user=verified.data?.user;
      if(!user?.email_confirmed_at)throw new Error('Confirmez votre adresse e-mail pour continuer.');
      if(pref.schoolMode&&root.JuryEstablishmentsV456){
        await root.JuryEstablishmentsV456.activate(c,user,pref.remember!==false);return true;
      }
      const pointer=JSON.parse((pref.remember===false?sessionStorage:localStorage).getItem(SPACE)||'null');
      if(!pointer||!storedAdminToken()||!storedOwnerToken()){open();message('Saisissez votre mot de passe pour retrouver votre espace.');return true;}
      await activate(c,user,{...pointer,adminToken:storedAdminToken(),ownerToken:storedOwnerToken()},pref.remember!==false);
      return true;
    }catch(e){open();message(friendly(e),true);return true;}
  };
  async function signout(){
    if(working||!API.client)return;
    if(!confirm('Déconnecter ce compte sur cet appareil ? Les données partagées ne seront pas supprimées.'))return;
    busy(true);
    try{
      if(API.schoolMode){await root.JuryEstablishmentsV456.signout();return;}
      const result=await API.client.auth.signOut({scope:'local'});if(result.error)throw result.error;
      API.client=null;API.signedOut=true;candidate=null;root.JuryLoginGateV457?.lock();
      const pref=preference();localStorage.setItem(PREF,JSON.stringify({...pref,signedOut:true}));
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);localStorage.removeItem(OWNER_TOKEN_STORAGE_KEY);
      localStorage.removeItem('jm_tc_owner_connection_v353');localStorage.setItem('jm_tc_owner_disconnected_v353','1');
      clearTimeout(cloudSyncTimer);cloudReady=false;cloudRole=null;
      await window.JuryOwnerSyncV357.pauseAccount();
      setAdminSessionUnlocked(false);adminSecurityAuthorized=false;securityOwnerAuthorized=false;
      updateSecurityButtons();setCloudStatus('local','● Compte déconnecté');
      document.body.classList.add('admin-denied');rawShowView('adminDeniedView');
      el('ownerAccountBtnV385').textContent='👤 Se connecter';
      el('accountSignoutV385').hidden=true;el('accountExtraTabV449').hidden=true;message('Compte déconnecté sur cet appareil.');
    }catch(e){message(friendly(e),true);}finally{busy(false);}
  }
  function mount(){
    if(tester())return;
    const style=document.createElement('style');style.textContent='#accountModalV385 [hidden]{display:none!important}#accountModalV385 .field input{box-sizing:border-box;max-width:100%}#accountModalV385 h2{margin:0;font-size:1.4rem}';document.head.appendChild(style);
    const button=document.createElement('button');button.type='button';button.id='ownerAccountBtnV385';button.className='btn btn-secondary btn-small';button.textContent='👤 Se connecter';button.onclick=()=>open();
    document.querySelector('header.topbar')?.insertBefore(button,el('homeBtn'));
    const box=document.createElement('div');box.className='modal-backdrop';box.id='accountModalV385';
    box.innerHTML=`<section class="modal" role="dialog" aria-modal="true" aria-labelledby="accountTitleV385" style="max-width:560px;max-height:90vh;overflow:auto"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h2 id="accountTitleV385">Mon compte</h2><button type="button" class="btn btn-ghost btn-small" id="accountCloseV385" aria-label="Fermer">✕</button></div><p id="accountIntroV385"></p><div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0"><button type="button" class="btn btn-secondary" id="accountLoginTabV385">Se connecter</button><button type="button" class="btn btn-ghost" id="accountSetupTabV385">Première activation</button><button type="button" class="btn btn-secondary" id="accountExtraTabV449" hidden>Ajouter un second administrateur</button></div><form id="accountFormV385"><div class="field"><label for="accountEmailV385">Adresse e-mail</label><input id="accountEmailV385" type="email" autocomplete="username" required autocapitalize="none" spellcheck="false"></div><div class="field"><label for="accountPasswordV385">Mot de passe</label><input id="accountPasswordV385" type="password" autocomplete="current-password" aria-describedby="accountPasswordHelpV450" required><p id="accountPasswordHelpV450" hidden style="font-size:13px;margin:6px 0 0">8 caractères minimum, dont une majuscule et un chiffre.</p></div><div class="field" id="accountConfirmWrapV385" hidden><label for="accountConfirmV385">Confirmer le mot de passe</label><input id="accountConfirmV385" type="password" autocomplete="new-password"></div><div class="field" id="accountPinWrapV385" hidden><label for="accountPinV385">PIN propriétaire actuel</label><input id="accountPinV385" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></div><label id="accountRememberWrapV449" style="display:flex;align-items:center;gap:10px;margin:18px 0"><input id="accountRememberV385" type="checkbox" checked style="width:20px;height:20px"> Rester connecté sur cet appareil</label><div id="accountConfirmationV385" hidden><p>Confirmez votre adresse dans votre messagerie, puis revenez terminer ici. Si le lien ne s’ouvre pas correctement, vous pouvez le copier ci-dessous.</p><div class="field"><label for="accountEmailProofV385">Code ou lien de confirmation reçu (facultatif)</label><input id="accountEmailProofV385" type="text" autocomplete="one-time-code" spellcheck="false"></div></div><p id="accountMessageV385" role="status" aria-live="polite" style="min-height:1.5em;line-height:1.5"></p><button class="btn btn-primary" id="accountSubmitV385" type="submit" style="width:100%">Se connecter</button></form><button id="accountSignoutV385" class="btn btn-ghost" type="button" hidden style="margin-top:16px">Se déconnecter de cet appareil</button><p style="font-size:13px;line-height:1.5;color:#607684">Le compte retrouve votre espace partagé. Le PIN reste demandé pour les actions protégées. En cas de mot de passe oublié, conservez un appareil déjà propriétaire pour rétablir l’accès.</p></section>`;
    document.body.appendChild(box);
    el('accountLoginTabV385').onclick=()=>setMode('login');el('accountSetupTabV385').onclick=()=>setMode('setup');
    el('accountExtraTabV449').onclick=()=>{
      if(!API.client)return;
      setMode('extra');el('accountEmailV385').value='';el('accountPasswordV385').value='';el('accountConfirmV385').value='';el('accountEmailProofV385').value='';el('accountEmailV385').focus();
    };
    el('accountCloseV385').onclick=close;el('accountFormV385').onsubmit=submit;el('accountSignoutV385').onclick=signout;
    box.onclick=e=>{if(e.target===box)close();};
    box.addEventListener('keydown',e=>{
      if(e.key==='Escape')close();
      if(e.key==='Tab'){
        const nodes=[...box.querySelectorAll('button,input')].filter(n=>!n.disabled&&!n.hidden&&!n.closest('[hidden]'));
        const first=nodes[0],last=nodes[nodes.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    });
    el('accountEmailV385').addEventListener('input',()=>{if(mode==='setup')el('accountPinWrapV385').hidden=!!root.JuryEstablishmentsV456?.isSchoolEmail(el('accountEmailV385').value.trim());});
    setMode('login');
  }
  API.open=open;API.signout=signout;API.verifiedConfig=verifiedConfig;
  mount();
})(typeof window==='undefined'?globalThis:window);


