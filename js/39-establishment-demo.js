/* Fictitious A/B role exercise. Its snapshots never enter the live jury catalogue.
 * This is a supervised simulation for general administrators, not school account provisioning. */
(function(root){
  'use strict';
  const KEYS=['jm_test_culinaire_param_v2','jm_test_culinaire_archives_v1','jm_test_culinaire_custom_templates_v1','jm_test_culinaire_market2026_personal_v1','jm_tc_prepared_jurys_v97','jm_test_culinaire_prepared_v97','jm_test_culinaire_sample_master_v1','jm_test_culinaire_sample_master_meta_v1','jm_test_culinaire_sample_products_v1','jm_test_culinaire_sample_lot_history_v178'];
  const parse=(x,f)=>{try{return JSON.parse(x)||f;}catch(e){return f;}};
  const copy=x=>JSON.parse(JSON.stringify(x));
  function validPayload(payload){
    return !!payload&&typeof payload==='object'&&!Array.isArray(payload)&&
      Object.entries(payload).every(([k,v])=>KEYS.includes(k)&&typeof v==='string')&&JSON.stringify(payload).length<=10000000;
  }
  function seed(school){
    if(!['A','B'].includes(school))throw new Error('Établissement inconnu.');
    const number=school==='A'?'101':'202',name=school==='A'?'Carottes de démonstration':'Compote de démonstration';
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
  const API={KEYS,seed,summary,validPayload};
  if(typeof module==='object'&&module.exports){module.exports=API;return;}
  if(root.__JURY_DEMO_ACTIVE)return;
  root.JuryEstablishmentDemoV451=API;
  let overlay=null,frame=null,school=null,nonce='',rows=[],pending=null,saving=null,flushWaiter=null,saveTimer=null,switching=false,mounted=false;
  const pendingKey=s=>'jm_tc_demo_pending_v451:'+s;
  const el=id=>document.getElementById(id);
  function status(text,bad=false){const n=el('demoSaveV451');if(n){n.textContent=text;n.style.color=bad?'#a53131':'#285e53';}}
  function client(){const c=root.JuryAccountV385?.client;if(!c||root.JuryAccountV385?.signedOut)throw new Error('Connectez-vous avec un compte administrateur général.');return c;}
  function payloadFor(row){
    const queued=parse(localStorage.getItem(pendingKey(row.school)),null);
    if(queued&&queued.revision===row.revision&&validPayload(queued.payload))return queued.payload;
    return validPayload(row.payload)&&Object.keys(row.payload).length?row.payload:seed(row.school);
  }
  async function loadRows(){
    const result=await client().from('jury_demo_workspaces').select('school,label,payload,revision').order('school');
    if(result.error)throw result.error;
    if(result.data?.length!==2)throw new Error('Cet essai est réservé aux administrateurs généraux.');
    rows=result.data;
  }
  function queue(s,payload){
    if(!validPayload(payload))throw new Error('Copie de démonstration invalide.');
    const row=rows.find(r=>r.school===s);if(!row)throw new Error('Établissement inconnu.');
    if(JSON.stringify(payload)===JSON.stringify(row.payload)&&!pending)return;
    pending={school:s,payload:copy(payload)};
    localStorage.setItem(pendingKey(s),JSON.stringify({revision:row.revision,payload}));
    status('Modifications de l’essai à enregistrer…');
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveNow().catch(showError),450);
  }
  async function saveNow(){
    if(saving)return saving;
    saving=(async()=>{
      while(pending){
        const attempt=pending,row=rows.find(r=>r.school===attempt.school);
        const result=await client().from('jury_demo_workspaces').update({payload:attempt.payload,revision:row.revision+1,updated_at:new Date().toISOString()}).eq('school',row.school).eq('revision',row.revision).select('school,revision').maybeSingle();
        if(result.error)throw result.error;
        if(!result.data)throw new Error('Cet essai a été modifié sur un autre appareil. Votre copie reste conservée sur cet appareil ; ne fermez pas cette fenêtre.');
        row.payload=attempt.payload;row.revision=result.data.revision;
        if(pending===attempt){pending=null;localStorage.removeItem(pendingKey(row.school));}
        else localStorage.setItem(pendingKey(row.school),JSON.stringify({revision:row.revision,payload:pending.payload}));
      }
      status('Essai enregistré · vos vrais dossiers restent séparés.');
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
      const box=el('demoContentV451');box.replaceChildren();
      const intro=document.createElement('p');
      intro.textContent='Vue générale : les deux établissements fictifs sont visibles ici. Les boutons ci-dessous simulent le travail de chaque responsable.';box.appendChild(intro);
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
        card.appendChild(makeButton('Ouvrir comme responsable du lycée '+row.school,()=>openSchool(row.school).catch(showError)));
        box.appendChild(card);
      }
      el('demoRoleV451').textContent='Administrateur général — vue des deux lycées';
      status('Données d’essai partagées entre vos deux comptes administrateurs.');
    }catch(e){showError(e);}finally{switching=false;}
  }
  async function openSchool(next){
    if(switching)return;switching=true;
    try{
      await flushChild();if(frame){frame.remove();frame=null;}
      const row=rows.find(r=>r.school===next);if(!row)throw new Error('Établissement inconnu.');
      school=next;mounted=false;nonce=crypto.randomUUID();
      let text=await fetch(new URL('tests-culinaires.html',location.href),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Écran d’essai indisponible.');return r.text();});
      const doc=new DOMParser().parseFromString(text,'text/html');
      doc.querySelectorAll('script[src*="39-establishment-demo"],script[src*="19-v22-installation"],link[rel="manifest"]').forEach(n=>n.remove());
      const base=doc.createElement('base');base.href=new URL('./',location.href).href;doc.head.prepend(base);
      const csp=doc.createElement('meta');csp.httpEquiv='Content-Security-Policy';csp.content="connect-src 'none'; form-action 'none'; object-src 'none'";base.after(csp);
      const boot=doc.createElement('script');
      boot.textContent='window.__JURY_DEMO_BOOT='+JSON.stringify({school:next,origin:location.origin,nonce,payload:payloadFor(row)}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';';
      csp.after(boot);
      const isolate=doc.createElement('script');isolate.src='js/00-establishment-demo-sandbox.js?build=451';boot.after(isolate);
      frame=document.createElement('iframe');frame.title='Logiciel — '+row.label+' — essai';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-modals allow-downloads');
      frame.style.cssText='width:100%;height:calc(100dvh - 200px);min-height:400px;border:1px solid #bfd2de;border-radius:12px;background:#edf5f8';
      el('demoContentV451').replaceChildren(frame);
      frame.srcdoc='<!DOCTYPE html>'+doc.documentElement.outerHTML;
      el('demoRoleV451').textContent='Vous jouez le rôle du responsable du '+row.label.toLowerCase();
      status('Chargement du logiciel pour '+row.label+'…');
    }finally{switching=false;}
  }
  async function close(){
    if(switching)return;switching=true;
    try{
      await flushChild();
      frame?.remove();frame=null;overlay?.remove();overlay=null;school=null;
    }catch(e){showError(e);}finally{switching=false;}
  }
  async function open(){
    if(overlay)return;
    client();
    overlay=document.createElement('section');overlay.id='establishmentDemoV451';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Établissements — essai');
    overlay.innerHTML='<div class="demo-header"><h2>Établissements — essai</h2><p>Deux lycées fictifs, sans adresse email supplémentaire. Cet essai simule les rôles ; il ne crée pas encore les comptes réels des établissements.</p><div class="demo-nav"><button type="button" id="demoOverviewV451">Vue générale</button><button type="button" id="demoAV451">Lycée test A</button><button type="button" id="demoBV451">Lycée test B</button><button type="button" id="demoCloseV451">Fermer l’essai</button></div><strong id="demoRoleV451"></strong><p id="demoSaveV451" role="status" aria-live="polite"></p><p class="demo-limit">Vous pouvez essayer les lots, la préparation, les réceptions et les fiches. Le partage par QR code, le lancement connecté et l’envoi d’emails sont désactivés dans cet essai.</p></div><div id="demoContentV451"></div>';
    document.body.appendChild(overlay);
    el('demoOverviewV451').onclick=overview;el('demoAV451').onclick=()=>openSchool('A').catch(showError);el('demoBV451').onclick=()=>openSchool('B').catch(showError);el('demoCloseV451').onclick=close;
    await overview();
  }
  root.addEventListener('message',event=>{
    if(!frame||event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.nonce!==nonce||event.data.school!==school)return;
    if(event.data.kind==='jury-demo-mounted'){mounted=true;status('Mode essai — seuls les dossiers du lycée '+school+' sont affichés.');return;}
    if(event.data.kind==='jury-demo-unsaved'){flushWaiter?.(new Error('Enregistrez d’abord la fiche dans le logiciel, puis changez de rôle.'));return;}
    if(event.data.kind!=='jury-demo-state')return;
    try{queue(school,event.data.payload);flushWaiter?.();}catch(e){showError(e);}
  });
  function mount(){
    const style=document.createElement('style');
    style.textContent='#establishmentDemoV451{position:fixed;inset:0;z-index:2000000;overflow:auto;background:#edf5f8;padding:14px;color:#173f5c}#establishmentDemoV451 .demo-header{max-width:1250px;margin:auto}#establishmentDemoV451 h2{margin:0 0 6px}#establishmentDemoV451 p{line-height:1.45;margin:8px 0}#establishmentDemoV451 .demo-nav{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}#establishmentDemoV451 button{padding:12px 16px;border:1px solid #9ab7c7;border-radius:12px;background:white;color:#173f5c;font:700 16px system-ui;cursor:pointer}#establishmentDemoV451 #demoContentV451{max-width:1250px;margin:14px auto}#establishmentDemoV451 .demo-school-card{background:white;border:1px solid #c4d8e3;border-radius:18px;padding:20px;margin:15px 0}#establishmentDemoV451 .demo-lot{background:#f0f6f9;padding:12px;border-radius:10px}#establishmentDemoV451 .demo-limit{font-size:13px;color:#5e7480}#establishmentDemoLauncherV451{margin-top:16px;padding:14px 20px;background:#fff3db;color:#62430c;border:1px solid #dfbc79;border-radius:14px;font:700 17px system-ui}#establishmentDemoLauncherV451[hidden]{display:none!important}';
    document.head.appendChild(style);
    const b=makeButton('Établissements — essai',()=>open().catch(showError));b.id='establishmentDemoLauncherV451';b.hidden=true;
    document.querySelector('#homeView .hero')?.appendChild(b);
    const refresh=()=>{b.hidden=!root.JuryAccountV385?.client||root.JuryAccountV385?.signedOut||!!root.__JURY_DEMO_ACTIVE;};
    refresh();setInterval(refresh,1000);
  }
  API.open=open;API.close=close;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(typeof window==='undefined'?globalThis:window);
