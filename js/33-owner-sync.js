/* Owner catalogue: one stable authenticated session, isolated jury records,
 * three-way field merges and compare-and-swap writes. No public/tester payload. */
(function(root){
  'use strict';
  const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
  function canonical(x){
    if(Array.isArray(x))return x.map(canonical);
    if(x&&typeof x==='object'){const o={};Object.keys(x).sort().forEach(k=>{if(x[k]!==undefined)o[k]=canonical(x[k]);});return o;}
    return x;
  }
  const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
  function snapshot(st){
    const c=clone(st);if(!c?.config)return null;
    delete c.updatedAt;delete c.config._ownerWorkspaceV351;delete c.config._ownerCatalogV357;
    return c;
  }
  const id=st=>String(st?.config?._preparedId||st?.config?._juryInstanceId||st?.config?.juryInstanceId||'');
  const retired=st=>{const name=String(st?.config?.lotName||'').trim().toLowerCase();return name==='moulik'||(/\blot\s*98\b/.test(name)&&/\blop\b/.test(name));};
  function merge(base,local,remote,path=''){
    if(equal(local,base))return clone(remote);
    if(equal(remote,base)||equal(local,remote))return clone(local);
    if(path.endsWith('.receptions')&&Array.isArray(local)&&Array.isArray(remote)){
      const rows=new Map(remote.map(r=>[String(r.id),clone(r)]));
      for(const r of local){
        const old=rows.get(String(r.id));
        if(old&&!equal(old,r)){
          if(old.validatedAt||r.validatedAt)throw new Error('Deux versions différentes d’une réception signée. Les copies sont conservées.');
        }
        if(!old)rows.set(String(r.id),clone(r));
      }
      return [...rows.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    }
    if(local&&remote&&typeof local==='object'&&typeof remote==='object'&&!Array.isArray(local)&&!Array.isArray(remote)){
      const out={};for(const key of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])){
        const value=merge(base?.[key],local[key],remote[key],path+'.'+key);if(value!==undefined)out[key]=value;
      }return out;
    }
    // Preserve both copies rather than silently choosing a conflicting edit.
    throw new Error('La même information a été modifiée sur deux appareils. Les copies sont conservées.');
  }
  function reconcile(catalog,locals,bases,removed){
    const out=clone(catalog||{version:1,records:{},removed:{}});
    out.version=1;out.records=out.records||{};out.removed={...(out.removed||{}),...removed};
    for(const [key,entry]of Object.entries(out.records))if(retired(entry.state))delete out.records[key];
    for(const [key,local]of Object.entries(locals)){
      if(retired(local)||out.removed[key])continue;
      const remote=out.records[key];const base=bases[key];
      if(!remote){
        if(base)continue; // absent remotely after a previous acknowledgement is not a new jury
        out.records[key]={state:clone(local),revision:1};continue;
      }
      let next;
      if(!base){
        // On first connection use the shared record. Local source migration is
        // performed separately, before the first baseline is recorded.
        next=remote.state;
      }else next=merge(base,local,remote.state);
      if(!equal(next,remote.state))out.records[key]={state:next,revision:Number(remote.revision||0)+1};
    }
    const archived=new Set(Object.values(out.records).filter(r=>r.state.config?._archive?.archivedAt).map(r=>id(r.state)));
    for(const key of Object.keys(out.records))if(out.removed[key]||(key.startsWith('prepared:')&&archived.has(id(out.records[key].state))))delete out.records[key];
    return out;
  }
  const API={clone,equal,snapshot,id,retired,merge,reconcile};
  if(typeof module==='object'&&module.exports){module.exports=API;return;}
  root.JuryOwnerSyncV357=API;
  let hub=null,descriptor=null,busy=false,applying=false,retryAt=0;
  const hubKey='jm_tc_owner_hub_v357';
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(e){return fallback;}}
  function status(text){
    let el=document.getElementById('ownerSyncStateV357');
    if(!el){el=document.createElement('div');el.id='ownerSyncStateV357';el.setAttribute('role','status');el.style.cssText='padding:5px 12px;font:12px system-ui;color:#31566a;background:#eff6fa';document.querySelector('header.topbar')?.after(el);}
    if(el.textContent!==text)el.textContent=text;
  }
  function rememberHub(){
    if(guestTester||cloudRole!=='admin'||!cloudReady||!cloudCfg.sessionId)return;
    if(!descriptor)descriptor=read(hubKey,null);
    if(!descriptor){descriptor={sessionId:cloudCfg.sessionId,url:cloudCfg.url,key:cloudCfg.key,storageKey:cloudClient.__jmStorageKeyV357||cloudAuthStorageKey()};localStorage.setItem(hubKey,JSON.stringify(descriptor));}
    if(cloudCfg.sessionId===descriptor.sessionId)hub=cloudClient;
  }
  async function client(){
    rememberHub();if(hub)return hub;
    descriptor=descriptor||read(hubKey,null);if(!descriptor)return null;
    hub=window.supabase.createClient(descriptor.url,descriptor.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:descriptor.storageKey}});
    const auth=await hub.auth.getSession();if(auth.error||!auth.data?.session){hub=null;throw new Error('Connexion propriétaire à reprendre.');}
    return hub;
  }
  function sampleSelectionSnapshotV370(rec){
    return {version:4,config:{_preparedId:String(rec.id),_catalogCreatedV357:true,lotNumber:rec.meta?.lotNumber,lotName:rec.lotName,products:clone(rec.products),_sampleSelectionV370:clone(rec)},testers:{}};
  }
  function collect(){
    const rows={};
    for(const rec of loadSampleLotHistory())if(rec?.id&&rec.meta&&rec.products?.length)rows['sample:'+rec.id]=sampleSelectionSnapshotV370(rec);
    for(const rec of loadPreparedJurys()){const st=snapshot(rec.state);if(st&&!retired(st)&&id(st)&&!st.config._archive?.archivedAt)rows['prepared:'+id(st)]=st;}
    const saved=read(STORAGE_KEY,state);
    if(saved.config?.products?.length&&!saved.config._emptyAfterReset&&!saved.config._archive?.archivedAt&&!retired(saved)&&id(saved))rows['prepared:'+id(saved)]=snapshot(saved);
    for(const rec of loadArchives()){const st=snapshot(rec.state);if(st&&!retired(st)&&rec.id)rows['archive:'+rec.id]=st;}
    return rows;
  }
  function seed(config,local){
    const records={};const old=config._ownerWorkspaceV351||{};
    for(const rec of old.prepared||[]){const st=snapshot(rec.state);if(st&&!retired(st)&&id(st))records['prepared:'+id(st)]={state:st,revision:1};}
    for(const rec of old.archives||[]){const st=snapshot(rec.state);if(st&&!retired(st)&&rec.id)records['archive:'+rec.id]={state:st,revision:1};}
    // Existing real lots from this session are initial migration candidates.
    // Unknown old/demo records do not enter the catalogue automatically.
    const approved=st=>/\blot\s*(55|66)\b/i.test(st.config.lotName||'')||st.config._catalogCreatedV357;
    for(const [key,st]of Object.entries(local))if(approved(st)&&!records[key])records[key]={state:st,revision:1};
    return {version:1,records,removed:{}};
  }
  function localScore(st){
    const cfg=st?.config||{};let n=(cfg.receptions||[]).filter(r=>r.validatedAt).length*1000;
    for(const row of Object.values(cfg.productSheets||{}))n+=Object.values(row||{}).filter(v=>v!==null&&v!==undefined&&String(v).trim()).length;
    return n;
  }
  function apply(catalog,bases,local){
    const before=collect();const prepared=loadPreparedJurys().filter(r=>!retired(r.state));const archives=loadArchives().filter(r=>!catalog.removed['archive:'+r.id]);
    let changed=archives.length!==loadArchives().length;
    const sampleBefore=loadSampleLotHistory();
    const samples=sampleBefore.filter(r=>!catalog.removed['sample:'+r.id]);
    for(const [key,entry]of Object.entries(catalog.records)){
      const st=entry.state;if(retired(st))continue;
      if(key.startsWith('sample:')){
        const rec=st.config?._sampleSelectionV370;if(!rec)continue;
        const index=samples.findIndex(r=>String(r.id)===String(rec.id));
        if(index<0)samples.push(clone(rec));else samples[index]=clone(rec);
        continue;
      }
      const list=key.startsWith('archive:')?archives:prepared;
      const rid=key.slice(key.indexOf(':')+1),index=list.findIndex(r=>String(r.id)===rid);
      if(index>=0&&equal(snapshot(list[index].state),st))continue;
      const row={...(list[index]||{}),id:rid,name:st.config.lotName||'Jury',state:clone(st),savedAt:new Date().toISOString()};
      if(key.startsWith('archive:'))row.archivedAt=st.config._archive?.archivedAt||row.archivedAt;
      if(index<0)list.push(row);else list[index]=row;changed=true;
    }
    const samplesChanged=!equal(sampleBefore,samples);
    if(samplesChanged)changed=true;
    const keep=prepared.filter(r=>!catalog.removed['prepared:'+r.id]&&!Object.values(catalog.records).some(e=>e.state.config._archive?.archivedAt&&id(e.state)===String(r.id)));
    if(keep.length!==prepared.length)changed=true;
    const currentKey='prepared:'+id(state),incoming=catalog.records[currentKey]?.state;
    const currentRemoved=!!catalog.removed[currentKey];
    const currentChanged=(incoming&&!equal(snapshot(state),incoming))||currentRemoved;
    if(changed||currentChanged){
      localStorage.setItem('jm_tc_stable_owner_recovery_v357',JSON.stringify({at:new Date().toISOString(),state:snapshot(state),prepared:loadPreparedJurys(),archives:loadArchives()}));
      applying=true;
      try{
        savePreparedJurys(keep);saveArchives(archives);
        if(samplesChanged)saveSampleLotHistory(samples);
        if(currentChanged){
          // Imported data never overwrites an unsaved form: tick only runs at home.
          const security=state.config.security;state=incoming?clone(incoming):(keep[0]?.state?clone(keep[0].state):blankActiveStateV238());
          if(!state.config.security&&security)state.config.security=security;
          localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
          currentProduct=state.config.products?.[0]?.id||'';currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';adminProduct=currentProduct;
        }
      }finally{applying=false;}
      if(!equal(before,collect()))originalRenderHome();
    }
  }

  const resetSeenKey='jm_tc_shared_reset_seen_v367';
  async function adoptResetV367(config,c){
    const epoch=config._ownerCatalogV357?.resetEpoch;
    if(!epoch||read(resetSeenKey,'')===epoch)return false;
    await verifyRecoveryValueV360('before-shared-reset-'+epoch,JSON.stringify({state,prepared:loadPreparedJurys(),archives:loadArchives()}));
    applying=true;
    try{
      savePreparedJurys([]);saveArchives([]);
      const security=state.config.security;
      state=blankActiveStateV238();state.config.security=security;
      state.config._emptyAfterReset=true;
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      localStorage.setItem('jm_tc_owner_removed_v357',JSON.stringify(config._ownerCatalogV357.removed||{}));
      localStorage.setItem('jm_tc_owner_baseline_v357_'+descriptor.sessionId,'{}');
      for(const k of [typeof SAMPLE_LOT_HISTORY_STORAGE_KEY!=='undefined'?SAMPLE_LOT_HISTORY_STORAGE_KEY:null,typeof SAMPLE_MASTER_STORAGE_KEY!=='undefined'?SAMPLE_MASTER_STORAGE_KEY:null,typeof SAMPLE_PRODUCTS_STORAGE_KEY!=='undefined'?SAMPLE_PRODUCTS_STORAGE_KEY:null])if(k)localStorage.removeItem(k);
      localStorage.setItem(resetSeenKey,JSON.stringify(epoch));
      clearTimeout(cloudSyncTimer);
      cloudCfg.sessionId=descriptor.sessionId;cloudClient=c;cloudReady=true;cloudRole='admin';
      lastCloudConfigHash=hashJson(state.config);lastCloudAnswerHashes=new Map();saveCloudCfg();
      currentProduct='';currentSample='';draftConfig=null;
    }finally{applying=false;}
    originalRenderHome();await subscribeCloud();
    status('Remise à zéro partagée prise en compte sur cet appareil.');
    return true;
  }
  API.checkReset=async function(){
    const c=await client();if(!c)return false;
    const result=await c.from('test_culinaire_sessions').select('config,updated_at').eq('session_id',descriptor.sessionId).maybeSingle();
    if(result.error||!result.data?.config)throw new Error('Vérification du partage impossible.');
    return adoptResetV367(result.data.config,c);
  };
  API.resetAll=async function(){
    if(busy||cloudBusy)throw new Error('Synchronisation en cours. Réessayez dans quelques secondes.');
    busy=true;cloudBusy=true;
    try{
      const c=await client();if(!c)throw new Error('Connexion propriétaire nécessaire pour effacer le partage.');
      const result=await c.from('test_culinaire_sessions').select('config,updated_at').eq('session_id',descriptor.sessionId).maybeSingle();
      if(result.error||!result.data?.config||!result.data.updated_at)throw new Error('Lecture du partage impossible. Rien n’a été effacé.');
      const old=result.data.config,previous=old._ownerCatalogV357||seed(old,collect());
      await verifyRecoveryValueV360('before-reset-all-shared',JSON.stringify({config:old,state,prepared:loadPreparedJurys(),archives:loadArchives()}));
      const epoch=crypto.randomUUID(),removed={...(previous.removed||{})};
      for(const k of new Set([...Object.keys(previous.records||{}),...Object.keys(collect())]))removed[k]=new Date().toISOString();
      const clean=blankActiveStateV238();clean.config.security=old.security||state.config.security;
      clean.config._emptyAfterReset=true;
      clean.config._ownerCatalogV357={version:1,records:{},removed,resetEpoch:epoch};
      const stamp=new Date(Math.max(Date.now(),Date.parse(result.data.updated_at)+1)).toISOString();
      const write=await c.from('test_culinaire_sessions').update({config:clean.config,updated_at:stamp}).eq('session_id',descriptor.sessionId).eq('updated_at',result.data.updated_at).select('session_id').maybeSingle();
      if(write.error||!write.data)throw new Error('Le partage a changé. Réessayez : aucun effacement local effectué.');
      await adoptResetV367(clean.config,c);
    }finally{busy=false;cloudBusy=false;}
  };

  async function tick(){
    if(busy||Date.now()<retryAt||guestTester||document.hidden)return;
    const active=document.querySelector('.view.active')?.id;
    if(!active||active==='testerView'||active==='adminGateView'||active==='adminDeniedView')return;
    const canApply=active==='homeView'&&!document.querySelector('.modal-backdrop.show')&&!document.activeElement?.matches('input,textarea,select');
    busy=true;
    try{
      const c=await client();if(!c)return;
      const sid=descriptor.sessionId,key='jm_tc_owner_baseline_v357_'+sid;
      const local=collect(),bases=read(key,{}),removed=read('jm_tc_owner_removed_v357',{});
      const result=await c.from('test_culinaire_sessions').select('config,updated_at').eq('session_id',sid).maybeSingle();
      if(result.error||!result.data?.config||!result.data.updated_at)throw new Error('Lecture du partage indisponible.');
      if(await adoptResetV367(result.data.config,c))return;
      const remote=result.data.config._ownerCatalogV357||seed(result.data.config,local);
      // Only registered catalogue entries or genuinely newly-created lots can be sent.
      const allowed={};for(const [k,v]of Object.entries(local))if(remote.records[k]||bases[k]||v.config._catalogCreatedV357)allowed[k]=v;
      // Initial migration keeps the fuller existing source, with a backup before import.
      const initial={...bases};for(const [k,v]of Object.entries(allowed))if(!initial[k]&&remote.records[k])initial[k]=localScore(v)>localScore(remote.records[k].state)?remote.records[k].state:v;
      const next=reconcile(remote,allowed,initial,removed);
      if(JSON.stringify(next).length>6000000)throw new Error('Dossier trop volumineux pour le partage.');
      if(!equal(next,result.data.config._ownerCatalogV357)){
        const stamp=new Date(Math.max(Date.now(),Date.parse(result.data.updated_at)+1)).toISOString();
        const write=await c.from('test_culinaire_sessions').update({config:{...result.data.config,_ownerCatalogV357:next},updated_at:stamp}).eq('session_id',sid).eq('updated_at',result.data.updated_at).select('session_id').maybeSingle();
        if(write.error)throw write.error;
        if(!write.data){retryAt=Date.now()+750;return;} // another device saved first: re-read, never overwrite it
      }
      // Recheck after the network request: the owner may have opened a form
      // or saved new data while the request was in flight.
      const currentLocal=collect();
      const stillSafe=canApply&&equal(local,currentLocal)&&document.querySelector('.view.active')?.id==='homeView'&&!document.querySelector('.modal-backdrop.show')&&!document.activeElement?.matches('input,textarea,select');
      if(stillSafe)apply(next,initial,local);
      const acknowledged={...bases};for(const [k,v]of Object.entries(next.records))if(stillSafe||equal(currentLocal[k],v.state))acknowledged[k]=v.state;
      localStorage.setItem(key,JSON.stringify(acknowledged));
      status('Données partagées vérifiées · '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}));
      retryAt=0;
    }catch(e){
      retryAt=Date.now()+10000;status('Données conservées sur cet appareil · partage en attente');console.warn('Owner sync v357',e);
    }finally{busy=false;}
  }
  const savePrepared=savePreparedJurys;
  savePreparedJurys=function(rows){
    if(!applying){
      const old=loadPreparedJurys(),ids=new Set(rows.map(r=>String(r.id))),removed=read('jm_tc_owner_removed_v357',{});
      for(const r of old)if(!ids.has(String(r.id)))removed['prepared:'+r.id]=new Date().toISOString();
      localStorage.setItem('jm_tc_owner_removed_v357',JSON.stringify(removed));
    }
    return savePrepared(rows);
  };
  const saveCloud=saveCloudCfg;
  saveCloudCfg=function(){saveCloud();rememberHub();};
  API.run=tick;
  rememberHub();setTimeout(tick,1800);setInterval(tick,5000);
  window.addEventListener('online',()=>{retryAt=0;tick();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});

  // Explicit reset of disposable tasting notes, with a fresh isolated session.
  function resetTestSnapshotV365(source,sessionId,instanceId){
    const next=snapshot(source);
    if(String(next?.config?.lotNumber)!=='55'||next.config._archive?.archivedAt)throw new Error('Sélectionnez le lot 55 non archivé.');
    delete next.config.juryClose;delete next.config.juryLaunch;
    delete next.config._validatedTestersV333;delete next.config._validatedTestersV333UpdatedAt;
    next.config._juryInstanceId=instanceId;next.config.juryInstanceId=instanceId;
    next.config._shareSessionId=sessionId;
    next.config._phoneShareSignature=phoneShareSignature(next.config);
    for(const tester of Object.values(next.testers||{})){tester.answers={};tester.validatedAt=null;}
    next.updatedAt=new Date().toISOString();
    return next;
  }
  API.resetTestSnapshot=resetTestSnapshotV365;
  async function resetTestLot55V365(){
    if(busy||cloudBusy)throw new Error('Synchronisation en cours. Réessayez dans quelques secondes.');
    if(guestTester||cloudRole!=='admin')throw new Error('Connexion propriétaire nécessaire.');
    busy=true;const previousCloudBusy=cloudBusy;cloudBusy=true;
    try{
      const c=await client();if(!c||!descriptor)throw new Error('Connexion propriétaire nécessaire.');
      await compactLocalJuryCopiesV360();
      const currentBefore=snapshot(state);
      const read=await c.from('test_culinaire_sessions').select('config,updated_at').eq('session_id',descriptor.sessionId).maybeSingle();
      if(read.error||!read.data?.config||!read.data.updated_at)throw new Error('Le partage ne peut pas être vérifié.');
      const catalog=clone(read.data.config._ownerCatalogV357);
      const matches=Object.entries(catalog?.records||{}).filter(([k,e])=>k.startsWith('prepared:')&&String(e?.state?.config?.lotNumber)==='55'&&!e.state.config._archive?.archivedAt&&!catalog.removed?.[k]);
      if(matches.length!==1)throw new Error(matches.length?'Plusieurs lots 55 existent : aucune modification effectuée.':'Le lot 55 est absent du dossier partagé. Aucune modification effectuée.');
      const [key,entry]=matches[0],before=clone(entry.state),rid=id(before);
      const local=loadPreparedJurys().find(r=>String(r.id)===rid);
      if((local&&!equal(snapshot(local.state),snapshot(before)))||(id(state)===rid&&!equal(currentBefore,snapshot(before))))throw new Error('Le lot 55 contient des modifications non synchronisées. Revenez à l’accueil avant de recommencer.');
      await verifyRecoveryValueV360('lot55-before-test-reset',JSON.stringify(before));
      const sid=crypto.randomUUID(),instance='jury_'+crypto.randomUUID();
      const next=resetTestSnapshotV365(before,sid,instance);
      const adminCode=getRawAdminTokenV20(),codes=next.config.security?.testerCodes;
      if(!adminCode||!codes)throw new Error('Les accès du jury ne sont pas prêts.');
      const created=await c.rpc('test_culinaire_create_secure_session',{
        p_session_id:sid,p_admin_config:next.config,p_public_config:makePublicCloudConfig(next.config),
        p_admin_code:adminCode,p_tester_codes:codes
      });
      if(created.error)throw created.error;
      if(!equal(snapshot(state),currentBefore))throw new Error('Le lot a changé pendant la préparation. Les anciennes données sont conservées.');
      catalog.records[key]={state:snapshot(next),revision:Number(entry.revision||0)+1};
      const stamp=new Date(Math.max(Date.now(),Date.parse(read.data.updated_at)+1)).toISOString();
      const write=await c.from('test_culinaire_sessions').update({config:{...read.data.config,_ownerCatalogV357:catalog},updated_at:stamp})
        .eq('session_id',descriptor.sessionId).eq('updated_at',read.data.updated_at).select('session_id').maybeSingle();
      if(write.error||!write.data)throw new Error('Le partage a changé : aucune réinitialisation locale effectuée.');
      applying=true;
      try{
        const rows=loadPreparedJurys(),index=rows.findIndex(r=>String(r.id)===rid);
        const row={...(rows[index]||{}),id:rid,name:next.config.lotName,state:clone(next),savedAt:stamp};
        if(index<0)rows.push(row);else rows[index]=row;
        savePreparedJurys(rows);state=next;
        localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
        const baseline=readBaselineV365();
        baseline[key]=snapshot(next);
        localStorage.setItem('jm_tc_owner_baseline_v357_'+descriptor.sessionId,JSON.stringify(baseline));
      }finally{applying=false;}
      clearTimeout(cloudSyncTimer);cloudCfg.sessionId=sid;
      cloudClient=c;cloudReady=true;cloudRole='admin';cloudTesterNo=null;
      lastCloudConfigHash=hashJson(state.config);lastCloudAnswerHashes=new Map();
      cloudUploadSucceededV339();saveCloudCfg();await subscribeCloud();
      setCloudStatus('online','● Partagé sécurisé');
      currentTester=1;currentProduct=state.config.products?.[0]?.id||'';currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
      draftConfig=null;originalRenderHome();
      alert('Lot 55 prêt pour un nouveau test. Notes et validations remises à zéro. Réceptions et fiches produits conservées. Utilisez les nouveaux liens testeurs.');
    }finally{cloudBusy=previousCloudBusy;busy=false;}
  }
  function readBaselineV365(){return read('jm_tc_owner_baseline_v357_'+descriptor.sessionId,{});}
  function installResetTestButtonV365(){
    const tools=document.querySelector('#advancedTools .advanced-tools-body');if(!tools||document.getElementById('resetTestLot55V365'))return;
    const button=document.createElement('button');button.id='resetTestLot55V365';button.type='button';button.className='btn btn-small';
    button.textContent='Remettre les notes d’essai du lot 55 à zéro';
    button.onclick=async()=>{button.disabled=true;try{await resetTestLot55V365()}catch(e){alert(String(e?.message||e))}finally{button.disabled=false}};
    tools.appendChild(button);
  }
  installResetTestButtonV365();
  document.addEventListener('DOMContentLoaded',installResetTestButtonV365);

  // Capture legacy reset clicks before older handlers can perform a local reset.
  let resetPromptV368=false;
  async function sharedResetCommandV368(){
    if(resetPromptV368)return;
    resetPromptV368=true;
    try{
      if(!confirm('Effacer tous les lots d’essai, livraisons, fiches, notes et archives sur tous les appareils connectés à ce partage ? Le PIN est conservé.'))return;
      if(typeof securityEnabled==='function'&&securityEnabled()){
        const pin=prompt('Code PIN administrateur :');if(pin===null)return;
        if(!(await verifyPin(String(pin).trim())))throw new Error('Code PIN incorrect. Rien n’a été effacé.');
      }
      await API.resetAll();
      alert('Remise à zéro PARTAGÉE terminée. Les autres appareils actualisés appliqueront cet effacement automatiquement.');
    }catch(e){alert(String(e?.message||e));}
    finally{resetPromptV368=false;}
  }
  function installSharedResetV368(){
    const parent=document.querySelector('#advancedTools .advanced-tools-body');
    if(!parent)return;
    for(const id of ['resetLotsBtnV207','restoreLotsBtnV207','resetTestLot55V365']){
      const el=document.getElementById(id);if(el)el.style.display='none';
    }
    if(document.getElementById('sharedResetV368'))return;
    const button=document.createElement('button');button.type='button';button.id='sharedResetV368';button.className='btn btn-small';
    button.textContent='🧹 Repartir à zéro sur tous les appareils';
    button.onclick=sharedResetCommandV368;parent.appendChild(button);
  }
  document.addEventListener('click',function(e){
    if(!e.target.closest?.('#resetLotsBtnV207'))return;
    e.preventDefault();e.stopImmediatePropagation();sharedResetCommandV368();
  },true);
  installSharedResetV368();
  document.addEventListener('DOMContentLoaded',installSharedResetV368);
  setTimeout(installSharedResetV368,700);

})(typeof window==='undefined'?globalThis:window);
