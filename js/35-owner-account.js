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
  function resetPasswordVisibility(){
    el('accountModalV385').querySelectorAll('[data-password-toggle]').forEach(button=>{
      const input=el(button.dataset.passwordToggle);if(!input)return;
      input.type='password';button.setAttribute('aria-pressed','false');
      button.setAttribute('aria-label','Afficher le mot de passe');button.title='Afficher le mot de passe';
      button.querySelector('[data-eye-slash]').style.display='none';
    });
  }
  function setMode(next){
    mode=next;pending=false;
    resetPasswordVisibility();
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
    el('accountTitleV385').textContent=root.JuryLoginGateV457?.locked?'Bienvenue':'Mon compte';
    if(root.JuryLoginGateV457?.locked&&next==='login')el('accountIntroV385').textContent='Connectez-vous pour retrouver votre espace.';
    el('accountFooterV458').textContent=root.JuryLoginGateV457?.locked?'Votre compte vous donne accès à votre espace et à vos jurys.':'Le compte retrouve votre espace partagé. Le PIN reste demandé pour les actions protégées. En cas de mot de passe oublié, conservez un appareil déjà propriétaire pour rétablir l’accès.';
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
          if(!/^jury-test[12]@mailo\.com$/i.test(email))throw new Error('Les comptes 1 et 2 sont ouverts pour ce premier essai.');
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
    box.innerHTML=`<aside class="login-welcome-story" aria-label="Tests culinaires">
<div class="login-welcome-brand"><span class="login-welcome-logo" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><circle cx="22" cy="22" r="11" stroke="currentColor" stroke-width="1.6"/><circle cx="22" cy="22" r="7.5" stroke="currentColor" stroke-width=".7" opacity=".6"/><path d="M6 7v9m-3-9v5c0 3 6 3 6 0V7M6 16v17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M23 18c-1-5 4-7 6-5-1 4-3 6-6 5Z" fill="#d8dfb1"/></svg></span><span>Tests culinaires</span></div>
<p class="login-welcome-kicker">Jury marchés · Nouvelle-Aquitaine</p>
<h1>Le goût du<br><em>bon choix.</em></h1>
<p class="login-welcome-description">Préparer, déguster et choisir ensemble.<br>Vos jurys se retrouvent ici.</p>
<svg class="login-welcome-art" viewBox="0 0 500 290" fill="none" aria-hidden="true">
<path d="M85 166C41 95 132 43 216 52c83 9 140-43 194 13 62 64 25 153-70 163-99 11-197 30-255-62Z" fill="#e1e8d5"/>
<ellipse cx="256" cy="240" rx="130" ry="16" fill="#c7d1bd" opacity=".35"/>
<circle cx="254" cy="143" r="107" fill="#fffdf6"/><circle cx="254" cy="143" r="94" stroke="#e8e4d6" stroke-width="1.6"/><circle cx="254" cy="143" r="77" fill="#f5f1e5" stroke="#eee9da"/>
<path d="M70 79v29m-10-29v17c0 15 20 15 20 0V79M70 110v104" stroke="#8e9a82" stroke-width="5" stroke-linecap="round"/><path d="M420 83c-16 0-18 34-4 39v92m4-131c16 0 18 34 4 39" stroke="#8e9a82" stroke-width="5" stroke-linecap="round"/>
<path d="M205 135c-19-24-9-46 12-44 20 10 13 34-12 44Z" fill="#779160"/><path d="M213 137c0-29 18-43 33-30 9 20-7 34-33 30Z" fill="#9cb17a"/><path d="M208 139c-29 5-46-10-35-27 17-12 36 1 35 27Z" fill="#52764f"/><path d="m203 144 18-38m-15 34 23-23m-26 24-19-19" stroke="#dce3bf" stroke-width="1.4" stroke-linecap="round"/>
<path d="M231 160c-4-29 12-43 27-29 12 21-4 38-27 29Z" fill="#638452"/><path d="M235 162c8-25 30-31 39-15 2 20-16 26-39 15Z" fill="#90a569"/><path d="m232 165 17-22" stroke="#dce3bf" stroke-width="1.4" stroke-linecap="round"/>
<circle cx="284" cy="122" r="20" fill="#c77351"/><path d="m282 105 4 9 9-6-5 9 8 3-11 1-4 9-1-10-10-3 10-2Z" fill="#5a7a49"/><path d="M272 122c-2 7 2 13 7 14" stroke="#e4a182" stroke-width="2" stroke-linecap="round"/>
<circle cx="294" cy="172" r="17" fill="#d4865c"/><circle cx="294" cy="172" r="12" stroke="#efc39a" stroke-width="1.5"/><path d="m294 163-2 6m9 1-5 3m-7 5 5-3" stroke="#f2d2a9" stroke-width="2.5" stroke-linecap="round"/>
<circle cx="271" cy="185" r="12" fill="#deb37c"/><circle cx="271" cy="185" r="7" stroke="#f5dec0" stroke-width="1.3"/>
<path d="m158 243 42-28" stroke="#718664" stroke-width="2" stroke-linecap="round"/><path d="M166 238c-18-2-24-14-17-21 12-1 18 8 17 21Zm10-6c-1-18 10-25 18-18 2 10-6 16-18 18Zm-4 1c-18 2-25-5-20-13 12-4 18 2 20 13Z" fill="#a1b58b"/>
<path d="m329 57 26-17" stroke="#718664" stroke-width="1.6"/><path d="M336 52c-9-4-9-13-3-15 7 2 8 8 3 15Zm7-4c3-11 11-12 14-6-1 6-7 9-14 6Z" fill="#8fa77c"/>
<ellipse cx="249" cy="111" rx="3" ry="1.5" transform="rotate(-22 249 111)" fill="#c29c62"/><ellipse cx="316" cy="143" rx="3" ry="1.5" transform="rotate(35 316 143)" fill="#c29c62"/><ellipse cx="222" cy="187" rx="3" ry="1.5" transform="rotate(-30 222 187)" fill="#c29c62"/>
</svg>
<p class="login-welcome-signature">Groupe Marchés Nouvelle-Aquitaine</p>
</aside><section class="modal" role="dialog" aria-modal="true" aria-labelledby="accountTitleV385" style="max-width:560px;max-height:90vh;overflow:auto"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h2 id="accountTitleV385">Mon compte</h2><button type="button" class="btn btn-ghost btn-small" id="accountCloseV385" aria-label="Fermer">✕</button></div><p id="accountIntroV385"></p><div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0"><button type="button" class="btn btn-secondary" id="accountLoginTabV385">Se connecter</button><button type="button" class="btn btn-ghost" id="accountSetupTabV385">Première activation</button><button type="button" class="btn btn-secondary" id="accountExtraTabV449" hidden>Ajouter un second administrateur</button></div><form id="accountFormV385"><div class="field"><label for="accountEmailV385">Adresse e-mail</label><input id="accountEmailV385" type="email" autocomplete="username" required autocapitalize="none" spellcheck="false"></div><div class="field"><label for="accountPasswordV385">Mot de passe</label><div style="position:relative"><input id="accountPasswordV385" type="password" style="padding-right:54px" autocomplete="current-password" aria-describedby="accountPasswordHelpV450" required><button type="button" data-password-toggle="accountPasswordV385" aria-controls="accountPasswordV385" aria-label="Afficher le mot de passe" aria-pressed="false" title="Afficher le mot de passe" style="position:absolute;right:4px;top:50%;transform:translateY(-50%);width:44px;height:44px;display:grid;place-items:center;background:transparent;border:0;border-radius:10px;color:#2e594a;cursor:pointer;padding:0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path data-eye-slash d="m3 3 18 18" style="display:none"/></svg></button></div><p id="accountPasswordHelpV450" hidden style="font-size:13px;margin:6px 0 0">8 caractères minimum, dont une majuscule et un chiffre.</p></div><div class="field" id="accountConfirmWrapV385" hidden><label for="accountConfirmV385">Confirmer le mot de passe</label><div style="position:relative"><input id="accountConfirmV385" type="password" style="padding-right:54px" autocomplete="new-password"><button type="button" data-password-toggle="accountConfirmV385" aria-controls="accountConfirmV385" aria-label="Afficher le mot de passe" aria-pressed="false" title="Afficher le mot de passe" style="position:absolute;right:4px;top:50%;transform:translateY(-50%);width:44px;height:44px;display:grid;place-items:center;background:transparent;border:0;border-radius:10px;color:#2e594a;cursor:pointer;padding:0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path data-eye-slash d="m3 3 18 18" style="display:none"/></svg></button></div></div><div class="field" id="accountPinWrapV385" hidden><label for="accountPinV385">PIN propriétaire actuel</label><input id="accountPinV385" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></div><label id="accountRememberWrapV449" style="display:flex;align-items:center;gap:10px;margin:18px 0"><input id="accountRememberV385" type="checkbox" checked style="width:20px;height:20px"> Rester connecté sur cet appareil</label><div id="accountConfirmationV385" hidden><p>Confirmez votre adresse dans votre messagerie, puis revenez terminer ici. Si le lien ne s’ouvre pas correctement, vous pouvez le copier ci-dessous.</p><div class="field"><label for="accountEmailProofV385">Code ou lien de confirmation reçu (facultatif)</label><input id="accountEmailProofV385" type="text" autocomplete="one-time-code" spellcheck="false"></div></div><p id="accountMessageV385" role="status" aria-live="polite" style="min-height:1.5em;line-height:1.5"></p><button class="btn btn-primary" id="accountSubmitV385" type="submit" style="width:100%">Se connecter</button></form><button id="accountSignoutV385" class="btn btn-ghost" type="button" hidden style="margin-top:16px">Se déconnecter de cet appareil</button><p id="accountFooterV458" style="font-size:13px;line-height:1.5;color:#607684">Le compte retrouve votre espace partagé. Le PIN reste demandé pour les actions protégées. En cas de mot de passe oublié, conservez un appareil déjà propriétaire pour rétablir l’accès.</p></section>`;
    document.body.appendChild(box);
    box.querySelectorAll('[data-password-toggle]').forEach(button=>{
      button.onclick=()=>{
        const input=el(button.dataset.passwordToggle),visible=input.type==='password';
        input.type=visible?'text':'password';
        const label=visible?'Masquer le mot de passe':'Afficher le mot de passe';
        button.setAttribute('aria-label',label);button.title=label;
        button.setAttribute('aria-pressed',String(visible));
        button.querySelector('[data-eye-slash]').style.display=visible?'':'none';
      };
    });
    box.addEventListener('focusout',()=>{if(!box.contains(document.activeElement))resetPasswordVisibility();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)resetPasswordVisibility();});
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



