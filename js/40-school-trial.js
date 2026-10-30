/* Authenticated establishment trial. Server RLS isolates school snapshots. */
(function(root){
  'use strict';
  const KEYS=['jm_test_culinaire_admin_token_v1','jm_test_culinaire_owner_token_v1','jm_test_culinaire_param_v2','jm_test_culinaire_archives_v1','jm_test_culinaire_custom_templates_v1','jm_test_culinaire_market2026_personal_v1','jm_tc_prepared_jurys_v97','jm_test_culinaire_prepared_v97','jm_test_culinaire_sample_master_v1','jm_test_culinaire_sample_master_meta_v1','jm_test_culinaire_sample_products_v1','jm_test_culinaire_sample_lot_history_v178'];
  const parse=(x,f)=>{try{return JSON.parse(x)||f;}catch(e){return f;}};
  const copy=x=>JSON.parse(JSON.stringify(x));
  function validPayload(payload){
    return !!payload&&typeof payload==='object'&&!Array.isArray(payload)&&
      Object.entries(payload).every(([k,v])=>KEYS.includes(k)&&typeof v==='string')&&JSON.stringify(payload).length<=10000000;
  }
  function seed(school){
    if(!/^S(?:[1-9]|1[0-2])$/.test(school))throw new Error('Établissement inconnu.');
    const number=String(100+Number(school.slice(1))),name='Produit fictif '+school.slice(1);
    const meta={lotNumber:number,lotTitle:'Essai du lycée '+school,supplierNames:['Fournisseur fictif '+school],supplierResponseCount:1,productName:name};
    const products=[{name,samples:[{id:'',supplier:''}]}];
    const cfg={_emptyAfterReset:true,_juryInstanceId:'demo-empty-'+school,lotName:'',lotNumber:'',lotTitle:'',subtitle:'',supplierNames:[],products:[],receptions:[],productSheets:{},testerCount:1,testerNames:['Testeur 1'],criteria:['couleur','texture','aspect','odeur','gout'].map(key=>({key,custom:''})),security:null};
    return {
      jm_test_culinaire_param_v2:JSON.stringify({version:4,config:cfg,testers:{1:{name:'Testeur 1',answers:{},validatedAt:null}},updatedAt:null}),
      jm_test_culinaire_archives_v1:'[]',
      jm_test_culinaire_prepared_v97:'[]',
      jm_test_culinaire_sample_master_meta_v1:JSON.stringify(meta),
      jm_test_culinaire_sample_products_v1:JSON.stringify(products),
      jm_test_culinaire_sample_master_v1:JSON.stringify([{id:'',supplier:''}]),
      jm_test_culinaire_sample_lot_history_v178:JSON.stringify([{id:'demo-sample-'+school,lotName:'Lot '+number+' — '+meta.lotTitle,meta,products,signature:'demo-seed-'+school,savedAt:'2026-10-29T00:00:00.000Z'}])
    };
  }
  function summary(payload){
    const rows=new Map(),key=c=>String(c?._preparedId||c?.lotName||'');
    for(const rec of parse(payload.jm_test_culinaire_sample_lot_history_v178,[])){
      if(rec?.lotName)rows.set('sample:'+rec.id,{name:rec.lotName,status:'Choix enregistrés',products:rec.products?.length||0,receipts:0});
    }
    const prepared=parse(payload.jm_test_culinaire_prepared_v97,[]);
    const active=parse(payload.jm_test_culinaire_param_v2,null);
    const states=prepared.map(r=>r.state);
    if(active?.config?.products?.length)states.push(active);
    const archives=parse(payload.jm_test_culinaire_archives_v1,[]);
    for(const rec of archives)states.push(rec.state);
    for(const st of states){
      const c=st?.config;if(!c?.products?.length||!c.lotName)continue;
      for(const [k,r]of rows)if(r.name===c.lotName)rows.delete(k);
      rows.set(key(c),{name:c.lotName,status:c._archive?.archivedAt?'Archivé':c.juryClose?.closedAt?'Terminé':c.juryLaunch?.openedAt?'En cours':'Préparé',products:c.products.length,receipts:(c.receptions||[]).filter(r=>r.validatedAt).length});
    }
    return Array.from(rows.values());
  }
  const API={KEYS,seed,summary,validPayload,schoolClient};
  if(typeof module==='object'&&module.exports){module.exports=API;return;}
  if(root.__JURY_DEMO_ACTIVE)return;
  root.JurySchoolTrialV452=API;
  let integrated=false,schoolAccount=false,target=null;
  let overlay=null,frame=null,school=null,nonce='',rows=[],pending=null,saving=null,flushWaiter=null,saveTimer=null,switching=false,mounted=false;
  const pendingKey=s=>'jm_tc_school_pending_v452:'+s+':'+(root.JuryAccountV385?.email||'');
  const pendingCopies=new Map();let backupTask=Promise.resolve();
  async function pendingDB(key,value,remove=false){
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('jm_tc_school_pending_v456',1);r.onupgradeneeded=()=>r.result.createObjectStore('copies',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    const get=()=>new Promise((resolve,reject)=>{const r=db.transaction('copies','readonly').objectStore('copies').get(key);r.onsuccess=()=>resolve(r.result?.value||null);r.onerror=()=>reject(r.error);});
    try{
      if(value===undefined&&!remove)return await get();
      await new Promise((resolve,reject)=>{const tx=db.transaction('copies','readwrite'),st=tx.objectStore('copies');if(remove)st.delete(key);else st.put({id:key,value});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Copie interrompue.'));});
      if(!remove&&JSON.stringify(await get())!==JSON.stringify(value))throw new Error('Copie de secours non vérifiée.');
    }finally{db.close();}
  }
  function backup(s,record){
    const key=pendingKey(s);if(record)pendingCopies.set(key,record);else pendingCopies.delete(key);
    backupTask=backupTask.catch(()=>{}).then(async()=>{
      if(!record){localStorage.removeItem(key);try{await pendingDB(key,undefined,true)}catch(e){};return;}
      try{localStorage.setItem(key,JSON.stringify(record));}
      catch(e){await pendingDB(key,record);localStorage.removeItem(key);}
    }).catch(e=>{console.warn('Copie locale différée ; envoi serveur maintenu',e);});
    return backupTask;
  }
  const el=id=>document.getElementById(id);
  function status(text,bad=false){const n=el('demoSaveV452');if(n){n.textContent=text;n.style.color=bad?'#a53131':'#285e53';}}
  function client(){const c=root.JuryAccountV385?.client;if(!c||root.JuryAccountV385?.signedOut)throw new Error('Connectez-vous avec votre compte de test.');return c;}
  function payloadFor(row){
    const queued=pendingCopies.get(pendingKey(row.school))||parse(localStorage.getItem(pendingKey(row.school)),null);
    if(queued&&queued.revision===row.revision&&validPayload(queued.payload))return queued.payload;
    if(validPayload(row.payload)&&Object.keys(row.payload).length)return row.payload;
    const initial=seed(row.school);
    if(integrated){initial.jm_test_culinaire_sample_lot_history_v178='[]';initial.jm_test_culinaire_sample_products_v1='[]';initial.jm_test_culinaire_sample_master_v1='[]';initial.jm_test_culinaire_sample_master_meta_v1=JSON.stringify({lotNumber:'',lotTitle:'',supplierNames:[],productName:''});}
    return initial;
  }
  async function loadRows(){
    const result=await client().from('jury_school_trials').select('school,label,payload,revision,enabled').order('school');
    if(result.error)throw result.error;
    if(!result.data?.length)throw new Error('Aucun établissement de test accessible pour ce compte.');
    rows=result.data;
    for(const row of rows){const key=pendingKey(row.school);try{const local=parse(localStorage.getItem(key),null),saved=local||await pendingDB(key);if(saved)pendingCopies.set(key,saved)}catch(e){}}
  }
  async function queue(s,payload){
    if(!validPayload(payload))throw new Error('Copie de démonstration invalide.');
    const row=rows.find(r=>r.school===s);if(!row)throw new Error('Établissement inconnu.');
    if(JSON.stringify(payload)===JSON.stringify(row.payload)&&!pending)return;
    pending={school:s,payload:copy(payload)};
    status('Enregistrement des dossiers en cours…');
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveNow().catch(showError),450);
    await backup(s,{revision:row.revision,payload});
  }
  async function saveNow(){
    if(saving)return saving;
    saving=(async()=>{
      while(pending){
        const attempt=pending,row=rows.find(r=>r.school===attempt.school);
        const result=await client().from('jury_school_trials').update({payload:attempt.payload,revision:row.revision+1,updated_at:new Date().toISOString()}).eq('school',row.school).eq('revision',row.revision).select('school,revision').maybeSingle();
        if(result.error)throw result.error;
        if(!result.data)throw new Error('Cet essai a été modifié sur un autre appareil. Votre copie reste conservée sur cet appareil ; ne fermez pas cette fenêtre.');
        row.payload=attempt.payload;row.revision=result.data.revision;
        if(pending===attempt){pending=null;await backup(row.school,null);}
        else await backup(row.school,{revision:row.revision,payload:pending.payload});
      }
      status(integrated?'Dossiers enregistrés sur le serveur.':'Dossiers de test enregistrés sur le serveur.');
    })();
    try{await saving;}finally{saving=null;}
  }
  function showError(e){status(e?.message||String(e),true);}
  async function flushChild(){
    if(frame&&mounted){
      await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>{flushWaiter=null;reject(new Error('La copie de l’essai n’est pas encore prête. Réessayez dans un instant.'));},3000);
        flushWaiter=error=>{clearTimeout(timeout);flushWaiter=null;error?reject(error):resolve();};
        frame.contentWindow.postMessage({kind:'jury-demo-flush',nonce},location.origin);
      });
    }
    clearTimeout(saveTimer);await saveNow();
  }
  function makeButton(text,click){const b=document.createElement('button');b.type='button';b.className='btn btn-secondary';b.textContent=text;b.onclick=click;return b;}
  async function overview(){
    if(switching)return;switching=true;
    try{
      await flushChild();
      if(frame){frame.remove();frame=null;}
      school=null;await loadRows();
      const box=el('demoContentV452');box.replaceChildren();
      const intro=document.createElement('p');
      intro.textContent='Les établissements autorisés pour votre compte sont affichés ci-dessous. Les comptes 1 et 2 sont ouverts pour le premier essai.';box.appendChild(intro);
      for(const row of rows){
        const card=document.createElement('section');card.className='demo-school-card';
        const title=document.createElement('h3');title.textContent=row.label;card.appendChild(title);
        const lots=summary(payloadFor(row));
        const count=document.createElement('p');count.textContent=lots.length+' lot(s) de démonstration';card.appendChild(count);
        for(const lot of lots){
          const item=document.createElement('p');item.className='demo-lot';
          item.textContent=lot.name+' · '+lot.status+' · '+lot.products+' produit(s) · '+lot.receipts+' réception(s)';
          card.appendChild(item);
        }
        if(!lots.length){const empty=document.createElement('p');empty.textContent='Aucun lot dans cet établissement fictif.';card.appendChild(empty);}
        if(row.enabled)card.appendChild(makeButton('Ouvrir '+row.label,()=>openSchool(row.school).catch(showError)));else {const note=document.createElement('p');note.textContent='En attente du premier essai avec les comptes 1 et 2.';card.appendChild(note);}
        box.appendChild(card);
      }
      el('demoRoleV452').textContent='Établissements accessibles à votre compte';
      status('Chaque compte d’établissement dispose de ses propres dossiers. Les administrateurs généraux peuvent suivre l’ensemble.');
    }catch(e){showError(e);}finally{switching=false;}
  }
  async function openSchool(next,request=null){
    if(switching)return;switching=true;
    try{
      await flushChild();if(frame){frame.remove();frame=null;}
      const row=rows.find(r=>r.school===next);if(!row?.enabled)throw new Error('Établissement inconnu.');
      school=next;target=request;mounted=false;nonce=crypto.randomUUID();
      let text=await fetch(new URL('tests-culinaires.html',location.href),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Écran d’essai indisponible.');return r.text();});
      const doc=new DOMParser().parseFromString(text,'text/html');
      doc.querySelectorAll('script[src*="39-establishment-demo"],script[src*="40-school-trial"],script[src*="33-owner-sync"],script[src*="35-owner-account"],script[src*="44-establishment-integration"],script[src*="19-v22-installation"],link[rel="manifest"]').forEach(n=>n.remove());
      const cloudScript=doc.querySelector('script[src*="06-v20-partage"]');
      const bridge=doc.createElement('script');bridge.src='js/43-school-phone-bridge.js?build=456';
      if(!cloudScript)throw new Error('Connexion du jury indisponible.');
      cloudScript.after(bridge);
      const base=doc.createElement('base');base.href=new URL('./',location.href).href;doc.head.prepend(base);
      const csp=doc.createElement('meta');csp.httpEquiv='Content-Security-Policy';csp.content="connect-src 'none'; form-action 'none'; object-src 'none'";base.after(csp);
      const boot=doc.createElement('script');
      boot.textContent='window.__JURY_DEMO_BOOT='+JSON.stringify({school:next,label:row.label,origin:location.origin,nonce,payload:payloadFor(row),target,integrated}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';';
      csp.after(boot);
      const isolate=doc.createElement('script');isolate.src='js/00-school-trial-sandbox.js?build=460-live-preparation';boot.after(isolate);
      frame=document.createElement('iframe');frame.title='Logiciel — '+row.label+' — essai';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-modals allow-downloads');
      frame.style.cssText='width:100%;height:calc(100dvh - 200px);min-height:400px;border:1px solid #bfd2de;border-radius:12px;background:#edf5f8';
      el('demoContentV452').replaceChildren(frame);
      frame.srcdoc='<!DOCTYPE html>'+doc.documentElement.outerHTML;
      el('demoRoleV452').textContent=row.label;
      if(integrated)el('schoolHeaderV456').textContent='Tests culinaires · '+row.label;
      status('Chargement du logiciel pour '+row.label+'…');
    }finally{switching=false;}
  }
  async function close(){
    if(switching)return;switching=true;
    try{
      await flushChild();
      frame?.remove();frame=null;overlay?.remove();overlay=null;school=null;return true;
    }catch(e){showError(e);return false;}finally{switching=false;}
  }
  async function open(options={}){
    if(overlay)return;
    client();integrated=!!options.integrated;schoolAccount=!!options.schoolAccount;
    overlay=document.createElement('section');overlay.id='establishmentDemoV452';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Établissements — essai');
    overlay.innerHTML='<div class="demo-header"><h2>Établissements — comptes de test</h2><p>Connexion personnelle et dossiers séparés. Utilisez uniquement des données fictives.</p><div class="demo-nav"><button type="button" id="demoOverviewV452">Mes établissements / Vue générale</button><button type="button" id="demoCloseV452">Fermer</button></div><strong id="demoRoleV452"></strong><p id="demoSaveV452" role="status" aria-live="polite"></p><p class="demo-limit">Premier essai : choix des échantillons, préparation, réception et fiches. La préparation des téléphones, les QR codes et les réponses des testeurs sont disponibles. Utilisez des données fictives. L’envoi de rapports par email reste désactivé dans cet essai.</p></div><div id="demoContentV452"></div>';
    if(integrated){
      overlay.classList.add('school-integrated-v456');
      overlay.innerHTML='<div class="demo-header"><h2 id="schoolHeaderV456">Tests culinaires</h2><div class="demo-nav"><button type="button" id="demoOverviewV452" hidden>Vue générale</button><button type="button" id="demoCloseV452"></button></div><strong id="demoRoleV452"></strong><p id="demoSaveV452" role="status" aria-live="polite"></p></div><div id="demoContentV452"></div>';
    }
    document.body.appendChild(overlay);
    el('demoOverviewV452').onclick=overview;el('demoCloseV452').onclick=schoolAccount?()=>root.JuryAccountV385.open():close;
    if(integrated){
      el('demoCloseV452').textContent=schoolAccount?'Mon compte':'← Retour à la vue générale';
      await loadRows();
    }else await overview();
  }
  root.addEventListener('message',event=>{
    if(!frame||event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.nonce!==nonce||event.data.school!==school)return;
    if(event.data.kind==='jury-demo-mounted'){mounted=true;status(integrated?'Dossiers de l’établissement ouverts.':'Mode essai — seuls les dossiers du lycée '+school+' sont affichés.');return;}
    if(event.data.kind==='jury-demo-unsaved'){flushWaiter?.(new Error('Enregistrez d’abord la fiche dans le logiciel, puis changez de rôle.'));return;}
    if(event.data.kind!=='jury-demo-state')return;
    Promise.resolve(queue(school,event.data.payload)).then(()=>flushWaiter?.()).catch(e=>{showError(e);flushWaiter?.(e);});
  });
  function mount(){
    const style=document.createElement('style');
    style.textContent='#establishmentDemoV452{position:fixed;inset:0;z-index:2000000;overflow:auto;background:#edf5f8;padding:14px;color:#173f5c}#establishmentDemoV452 .demo-header{max-width:1250px;margin:auto}#establishmentDemoV452 h2{margin:0 0 6px}#establishmentDemoV452 p{line-height:1.45;margin:8px 0}#establishmentDemoV452 .demo-nav{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}#establishmentDemoV452 button{padding:12px 16px;border:1px solid #9ab7c7;border-radius:12px;background:white;color:#173f5c;font:700 16px system-ui;cursor:pointer}#establishmentDemoV452 #demoContentV452{max-width:1250px;margin:14px auto}#establishmentDemoV452 .demo-school-card{background:white;border:1px solid #c4d8e3;border-radius:18px;padding:20px;margin:15px 0}#establishmentDemoV452 .demo-lot{background:#f0f6f9;padding:12px;border-radius:10px}#establishmentDemoV452 .demo-limit{font-size:13px;color:#5e7480}#establishmentDemoLauncherV452{margin-top:16px;padding:14px 20px;background:#fff3db;color:#62430c;border:1px solid #dfbc79;border-radius:14px;font:700 17px system-ui}#establishmentDemoLauncherV452[hidden]{display:none!important}';
    document.head.appendChild(style);
    const b=makeButton('Établissements — essai',()=>open().catch(showError));b.id='establishmentDemoLauncherV452';b.hidden=true;
    if(!document.getElementById('schoolPortal'))document.querySelector('#homeView .hero')?.appendChild(b);
    const refresh=()=>{b.hidden=!root.JuryAccountV385?.client||root.JuryAccountV385?.signedOut||!!root.__JURY_DEMO_ACTIVE;};
    refresh();setInterval(refresh,1000);
  }
  function schoolClient(c,schoolId){
    return new Proxy(c,{get(target,key){
      if(key==='rpc')return (name,args,options)=>name==='test_culinaire_create_secure_session'
        ?target.rpc('school_trial_create_secure_session',{...args,p_school:schoolId},options)
        :target.rpc(name,args,options);
      if(key==='auth')return new Proxy(target.auth,{get(auth,k){
        if(['signOut','signInAnonymously','signInWithPassword','signUp','updateUser'].includes(k))return async()=>{throw new Error('Utilisez la connexion de l’établissement hors du jury.');};
        const v=auth[k];return typeof v==='function'?v.bind(auth):v;
      }});
      const value=target[key];return typeof value==='function'?value.bind(target):value;
    }});
  }
  API.clientForSchool=(s,n)=>{
    if(!frame||s!==school||n!==nonce)throw new Error('Établissement non ouvert.');
    return schoolClient(client(),s);
  };
  API.openTarget=async(s,request,single)=>{
    if(overlay&&await close()===false)throw new Error('Enregistrez la fiche avant de changer de jury.');
    await open({integrated:true,schoolAccount:single});
    await openSchool(s,request);
  };
  API.open=open;API.close=close;API.flush=flushChild;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(typeof window==='undefined'?globalThis:window);



