(function(root){
 'use strict';
 const URL='https://avhyoujlplwkuccvhnvz.supabase.co',KEY='sb_publishable_63ZJtw7uGovMEiZgX8V8zg_02TdkDGY';
 const allowed=email=>/^jury-test[12]@mailo\.com$/.test(email);
 const passwordOK=p=>p.length>=8&&/\p{Lu}/u.test(p)&&/[0-9]/.test(p);
 if(typeof module==='object'&&module.exports){module.exports={allowed,passwordOK};return;}
 const el=id=>document.getElementById(id);
 const c=root.supabase.createClient(URL,KEY,{auth:{storageKey:'jm-school-trial-auth-v452',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 let setup=false,working=false;
 const message=t=>{el('message').textContent=t;};
 function busy(b){working=b;document.querySelectorAll('#schoolPortal input,#schoolPortal button').forEach(n=>n.disabled=b);}
 function friendly(e){const t=String(e?.message||e);if(/Invalid login credentials/i.test(t))return 'Adresse ou mot de passe incorrect. Pour un nouveau compte, utilisez Première activation.';if(/Email not confirmed/i.test(t))return 'Confirmez votre adresse dans Mailo, puis revenez ici et connectez-vous.';if(/rate.limit|too many/i.test(t))return 'Demandes trop rapprochées. Attendez avant de réessayer.';return t;}
 async function connect(){
  const r=await c.auth.getUser();if(r.error)throw r.error;
  const user=r.data.user;if(!user?.email_confirmed_at||user.is_anonymous)throw new Error('Confirmez votre adresse email dans Mailo.');
  const access=await c.from('jury_school_trials').select('school').limit(1);
  if(access.error)throw access.error;if(!access.data?.length)throw new Error('Ce compte ne dispose pas encore d’un établissement de test activé. Aucun accès aux vrais dossiers n’a été ajouté.');
  root.JuryAccountV385={client:c,email:user.email,signedOut:false};
  el('login').hidden=true;el('connected').hidden=false;el('identity').textContent='Connecté : '+user.email;
  el('password').value='';el('passwordConfirm').value='';message('Connexion établie.');
  await root.JurySchoolTrialV452.open();
 }
 el('setup').onclick=()=>{setup=!setup;el('confirmWrap').hidden=!setup;el('passwordConfirm').required=setup;el('password').autocomplete=setup?'new-password':'current-password';el('submit').textContent=setup?'Créer mon compte de test':'Se connecter';el('setup').textContent=setup?'J’ai déjà un compte':'Première activation d’un compte test';message('');};
 el('login').onsubmit=async e=>{e.preventDefault();if(working)return;busy(true);
  try{
   const email=el('email').value.trim().toLowerCase(),password=el('password').value;
   if(setup){
    if(!allowed(email))throw new Error('Pour ce premier essai, activez jury-test1@mailo.com ou jury-test2@mailo.com.');
    if(!passwordOK(password))throw new Error('Choisissez au moins 8 caractères, une majuscule et un chiffre.');
    if(password!==el('passwordConfirm').value)throw new Error('Les deux mots de passe sont différents.');
    const r=await c.auth.signUp({email,password});if(r.error)throw r.error;
    if(!r.data.session){message('Ouvrez Mailo, confirmez cette adresse avec le message reçu, puis revenez sur cette page. Appuyez sur « J’ai déjà un compte » et connectez-vous. Si le lien affiche localhost, revenez simplement ici après confirmation.');return;}
   }else{const r=await c.auth.signInWithPassword({email,password});if(r.error)throw r.error;}
   await connect();
  }catch(e){message(friendly(e));}finally{busy(false);}
 };
 el('open').onclick=()=>root.JurySchoolTrialV452.open().catch(e=>message(friendly(e)));
 el('logout').onclick=async()=>{if(working)return;busy(true);try{await root.JurySchoolTrialV452.flush();await root.JurySchoolTrialV452.close();const r=await c.auth.signOut({scope:'local'});if(r.error)throw r.error;root.JuryAccountV385=null;el('login').hidden=false;el('connected').hidden=true;message('Essai déconnecté. Votre compte principal reste inchangé.');}catch(e){message(friendly(e));}finally{busy(false);}};
 c.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){root.JuryAccountV385=null;const overlay=document.getElementById('establishmentDemoV452');if(overlay)overlay.remove();el('login').hidden=false;el('connected').hidden=true;}});
 (async()=>{const r=await c.auth.getSession();if(r.data?.session)try{await connect();}catch(e){message(friendly(e));}})();
})(typeof window==='undefined'?globalThis:window);
