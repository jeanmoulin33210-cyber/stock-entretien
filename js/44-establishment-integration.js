/* Unified login and general jury choosers. Foreign school snapshots are never
 * imported into the general owner's local catalogue. RLS remains authoritative. */
(function(root){
 'use strict';
 const PREF='jm_tc_account_v385';
 const parse=(s,f)=>{try{return JSON.parse(s)||f}catch(e){return f}};
 const schoolEmail=email=>/^jury-test(?:[1-9]|1[0-2])@mailo\.com$/.test(String(email||'').toLowerCase());
 const logical=(name,products)=>String(name||'').trim().toLowerCase()+'|'+(products||[]).map(p=>String(p.name||'').trim().toLowerCase()).sort().join('|');
 function sheetProgress(st){
  const c=st.config||{};
  const prog=typeof productSheetsProgress==='function'?productSheetsProgress(st):{total:0,filled:0};
  const names=typeof supplierNamesFromConfigV256==='function'?supplierNamesFromConfigV256(c):typeof supplierNamesFromConfigV252==='function'?supplierNamesFromConfigV252(c):(c.supplierNames||[]).filter(n=>String(n||'').trim());
  const expected=(c.products||[]).reduce((sum,p)=>{const samples=p.samples||[];return sum+(!samples.length||samples.some(sm=>!String(sm.id||'').trim())?Math.max(samples.length,names.length):samples.length)},0);
  return {total:Math.max(Number(prog.total||0),expected),filled:Number(prog.filled||0)};
 }
 function entries(rows,view,receptionStatus,progress=sheetProgress){
  const out=[];
  for(const row of rows||[]){
   if(!row.enabled)continue;
   const p=row.payload||{},byId=new Map();
   const archives=parse(p.jm_test_culinaire_archives_v1,[]);
   const prepared=parse(p.jm_test_culinaire_prepared_v97,[]);
   const current=parse(p.jm_test_culinaire_param_v2,null);
   for(const rec of prepared)if(rec?.id&&rec.state?.config?.products?.length)byId.set(String(rec.id),{...rec,kind:'prepared'});
   if(current?.config?._preparedId&&current.config.products?.length&&!current.config._emptyAfterReset&&!current.config._archive?.archivedAt)byId.set(String(current.config._preparedId),{id:current.config._preparedId,state:current,kind:'prepared'});
   for(const rec of archives)if(rec?.id&&rec.state?.config?.products?.length)byId.set('archive:'+rec.id,{...rec,kind:'archive'});
   const archivedIds=new Set(archives.flatMap(rec=>[rec.state?.config?._preparedId,rec.state?.config?._juryInstanceId,rec.state?.config?.juryInstanceId,rec.state?.config?._shareSessionId].filter(Boolean).map(String)));
   const occupied=new Set();
   for(const rec of byId.values()){
    const c=rec.state.config,key=logical(c.lotName,c.products);occupied.add(key);
    if(view==='archives'&&!(rec.kind==='archive'||c._archive?.archivedAt||c._archive?.finalLocked))continue;
    if(view==='results'&&(rec.kind==='archive'||c._archive?.archivedAt||c._archive?.finalLocked||[rec.id,c._preparedId,c._juryInstanceId,c.juryInstanceId,c._shareSessionId].filter(Boolean).some(id=>archivedIds.has(String(id)))))continue;
    if((view==='prepare'||view==='launch')&&(rec.kind==='archive'||c._archive?.archivedAt||c.juryClose?.closedAt))continue;
    if(view==='reception'||view==='receptionHistory'){
     if(rec.kind==='archive'||c._archive?.archivedAt)continue;
     const rs=typeof receptionStatus==='function'?receptionStatus(c):null;
     if(view==='reception'&&rs?.key==='done')continue;
     if(view==='receptionHistory'&&!(c.receptions||[]).some(r=>r.validatedAt))continue;
    }
    const sheets=progress(rec.state);
    if(view==='sheetsPending'||view==='sheetsDone'){
     if(rec.kind==='archive'||c._archive?.archivedAt)continue;
     if(view==='sheetsPending'&&sheets.total>0&&sheets.filled>=sheets.total)continue;
     if(view==='sheetsDone'&&sheets.filled<=0)continue;
    }
    out.push({school:row.school,label:row.label,id:String(rec.id),kind:rec.kind,lotName:c.lotName||rec.name||'Jury',products:c.products.length,sheets,receptionStatus:typeof receptionStatus==='function'?receptionStatus(c):null,status:rec.kind==='archive'||c._archive?.archivedAt?'Archivé':c.juryClose?.closedAt?'Jury terminé':c.juryLaunch?.openedAt?'Jury en cours':'Jury préparé'});
   }
   if(view==='prepare')for(const rec of parse(p.jm_test_culinaire_sample_lot_history_v178,[])){
    if(!rec?.id||!rec.lotName||!rec.products?.length||occupied.has(logical(rec.lotName,rec.products)))continue;
    out.push({school:row.school,label:row.label,id:String(rec.id),kind:'sampleLot',lotName:rec.lotName,products:rec.products.length,status:'Lot enregistré — à préparer'});
   }
  }
  return out;
 }
 const API={entries,isSchoolEmail:schoolEmail};
 if(typeof module==='object'&&module.exports){module.exports=API;return;}
 if(root.__JURY_DEMO_ACTIVE)return;
 root.JuryEstablishmentsV456=API;
 const el=id=>document.getElementById(id);
 let schoolRows=[],loading=null;
 async function refresh(){
  const a=root.JuryAccountV385;
  if(!a?.client||a.signedOut||a.schoolMode)return [];
  if(loading)return loading;
  loading=(async()=>{
   const r=await a.client.from('jury_school_trials').select('school,label,enabled,payload').order('school');
   if(r.error)throw r.error;schoolRows=r.data||[];return schoolRows;
  })();
  try{return await loading}finally{loading=null}
 }
 function notice(message){if(typeof toast==='function')toast(message);else alert(message)}
 async function openEntry(rec,view){
  try{await root.JurySchoolTrialV452.openTarget(rec.school,{id:rec.id,kind:rec.kind,view,label:rec.label},false)}
  catch(e){notice('Impossible d’ouvrir ce jury : '+(e.message||e))}
 }
 async function appendSchools(listId,view){
  try{
   const rows=await refresh(),list=el(listId);if(!list)return;
   const records=entries(rows,view,typeof receptionStatusForConfig==='function'?receptionStatusForConfig:null);list.querySelector('[data-school-jurys]')?.remove();
   if(!records.length){
    if(view==='reception'){
     const intro=el('receptionLotModal')?.querySelector('p');
     if(intro)intro.textContent='Aucune réception en attente.';
     const saved=entries(rows,'receptionHistory',typeof receptionStatusForConfig==='function'?receptionStatusForConfig:null);
     if(saved.length&&!list.querySelector('[data-open-saved-receptions]')){
      const b=document.createElement('button');b.type='button';b.className='reception-lot-choice';b.dataset.openSavedReceptions='1';
      b.textContent='Consulter les réceptions enregistrées';
      b.onclick=()=>{el('receptionLotModal')?.classList.remove('show');openReceptionHistoryFromHome()};list.appendChild(b);
     }
    }
    return;
   }
   const section=document.createElement('section');section.dataset.schoolJurys='1';
   const heading=document.createElement('h3');heading.textContent=view==='archives'?'Archives des établissements':'Jurys des établissements';section.appendChild(heading);
   for(const rec of records){
    const b=document.createElement('button');b.type='button';b.className='prepare-jury-choice';
    const span=document.createElement('span'),title=document.createElement('strong'),label=document.createElement('span'),status=document.createElement('span');
    title.textContent=rec.lotName;label.textContent=rec.label+' · '+rec.products+' produit(s)';status.textContent=view==='sheetsPending'||view==='sheetsDone'?rec.sheets.filled+'/'+rec.sheets.total+' fiche(s) complète(s) · '+rec.status:rec.status;status.className='prepare-jury-status';
    span.append(title,label,status);b.appendChild(span);b.onclick=()=>{const modal={prepare:'prepareJuryModal',results:'resultsLotModalV348',reception:'receptionLotModal',receptionHistory:'receptionHistoryModal',sheetsPending:'productLotModalV174',sheetsDone:'productLotModalV174'}[view];if(modal)el(modal)?.classList.remove('show');openEntry(rec,view)};section.appendChild(b);
   }
   list.appendChild(section);
   if(view==='launch')list.querySelector('.empty')?.remove();
   if(view==='reception'||view==='receptionHistory'){
    list.querySelector('.reception-lot-empty')?.remove();
    const intro=el(view==='reception'?'receptionLotModal':'receptionHistoryModal')?.querySelector('p');
    if(intro)intro.textContent=view==='reception'?'Choisissez le lot de votre espace ou d’un établissement.':'Choisissez un lot pour consulter ses réceptions enregistrées.';
   }
   if(view==='prepare'){
    list.querySelector('.prepare-jury-empty-v180')?.remove();
    const intro=el('prepareJuryModalText');if(intro)intro.textContent='Choisissez votre jury ou celui d’un établissement.';
   }
  }catch(e){notice('Les jurys des établissements ne peuvent pas être chargés. Réessayez avec une connexion Internet.');console.warn(e)}
 }
 API.activate=async(c,user,remember)=>{
  if(!user?.email_confirmed_at||user.is_anonymous||!schoolEmail(user.email))throw new Error('Ce compte ne dispose pas d’un espace établissement activé.');
  const r=await c.from('jury_school_trials').select('school,label,email,enabled');
  if(r.error)throw r.error;
  const row=r.data?.find(x=>x.enabled&&x.email===user.email.toLowerCase());
  if(!row)throw new Error('Cet établissement n’est pas encore activé.');
  clearTimeout(cloudSyncTimer);cloudReady=false;cloudRole=null;
  await root.JuryOwnerSyncV357?.pauseAccount();
  for(const channel of [cloudChannel,cloudPresenceChannel])if(channel&&cloudClient)try{await cloudClient.removeChannel(channel)}catch(e){}
  cloudChannel=null;cloudPresenceChannel=null;
  const a=root.JuryAccountV385;a.client=c;a.signedOut=false;a.email=user.email;a.schoolMode=true;
  localStorage.setItem(PREF,JSON.stringify({enabled:true,remember,email:user.email,schoolMode:true,signedOut:false}));
  document.body.classList.add('establishment-account-v456');
  const url=new URL(location.href);url.searchParams.delete('schoolLogin');history.replaceState(null,'',url.toString());
  el('accountModalV385')?.classList.remove('show');
  el('accountPasswordV385').value='';el('accountConfirmV385').value='';
  try{await root.JurySchoolTrialV452.openTarget(row.school,{view:'home',label:row.label},true);root.JuryLoginGateV457?.release()}catch(e){el('accountModalV385')?.classList.add('show');throw e;}
 };
 API.signout=async()=>{
  const a=root.JuryAccountV385;
  await root.JurySchoolTrialV452.flush();await root.JurySchoolTrialV452.close();
  const r=await a.client.auth.signOut({scope:'local'});if(r.error)throw r.error;
  a.client=null;a.signedOut=true;root.JuryLoginGateV457?.lock();
  const pref=parse(localStorage.getItem(PREF),{});localStorage.setItem(PREF,JSON.stringify({...pref,signedOut:true}));
  a.open();
 };
 function mount(){
  const style=document.createElement('style');style.textContent='body.establishment-account-v456 > :not(#establishmentDemoV452):not(#accountModalV385):not(style):not(script){display:none!important}body.establishment-account-v456 #accountModalV385{z-index:2000010!important}.school-integrated-v456 .demo-header>p.demo-limit,.school-integrated-v456 .demo-header>strong{display:none!important}.school-integrated-v456 iframe{height:calc(100dvh - 140px)!important}.school-integrated-v456 .demo-nav{margin:4px 0!important}#establishmentDemoLauncherV452,#schoolAccountsLinkV452,#establishmentDemoLauncherV451{display:none!important}';document.head.appendChild(style);
  const pref=parse(localStorage.getItem(PREF),{});
  if(pref.schoolMode)document.body.classList.add('establishment-account-v456');
  const prepare=prepareJuryFromHomeV180;
  let preparing=false;
  prepareJuryFromHomeV180=function(event){
   prepare(event);
   if(preparing)return false;
   preparing=true;
   (async()=>{
    try{
     // The chooser must read shared sample selections before rebuilding its local list.
     await root.JuryOwnerSyncV357?.run({prepareChooser:true});
     if(!el('prepareJuryModal')?.classList.contains('show'))return;
     prepare(null);
     await new Promise(resolve=>setTimeout(resolve,20));
     if(el('prepareJuryModal')?.classList.contains('show'))await appendSchools('prepareJuryList','prepare');
    }finally{preparing=false}
   })().catch(e=>console.warn('Actualisation des jurys',e));
   return false;
  };
  // A school may save while an administrator already has the chooser open.
  let refreshingSchools=false;
  setInterval(async()=>{
   if(document.hidden||refreshingSchools||!el('prepareJuryModal')?.classList.contains('show'))return;
   refreshingSchools=true;
   try{await appendSchools('prepareJuryList','prepare')}finally{refreshingSchools=false}
  },5000);

  const launchChooser=renderJuryChooser,launchFlow=openJuryFlow;
  renderJuryChooser=function(){
   launchChooser();
   appendSchools('juryChooserList','launch');
  };
  openJuryFlow=async function(){
   try{
    await root.JuryOwnerSyncV357?.run();
    const rows=await refresh();
    if(entries(rows,'launch').length){renderJuryChooser();return;}
    launchFlow();
   }catch(e){notice('Impossible de charger les jurys des établissements. Réessayez avec une connexion Internet.');console.warn(e);}
  };
  if(el('juryBtn'))el('juryBtn').onclick=openJuryFlow;


  openReceptionFromHome=async function(){
   draftConfig=null;
   showReceptionLotPicker(availableReceptionLots());
   await appendSchools('receptionLotList','reception');
  };
  openReceptionHistoryFromHome=async function(){
   draftConfig=null;
   showReceptionHistoryPicker(receptionHistoryLots());
   await appendSchools('receptionHistoryList','receptionHistory');
  };
  if(el('homeReceptionBtn'))el('homeReceptionBtn').onclick=openReceptionFromHome;
  if(el('homeReceptionHistoryBtn'))el('homeReceptionHistoryBtn').onclick=openReceptionHistoryFromHome;

  async function openSchoolSheets(mode){
   const tools=root.JuryProductSheetsV467;if(!tools)return;
   const local=tools.lots().filter(r=>mode==='done'?r.sheetFilled>0:r.sheetStatus!=='done');
   tools.showPicker(local,mode);
   const intro=el('productLotModalV174')?.querySelector('p');
   if(intro)intro.textContent=mode==='done'?'Choisissez un lot pour consulter ses fiches terminées.':'Choisissez un lot pour compléter ses fiches produits.';
   await appendSchools('productLotListV174',mode==='done'?'sheetsDone':'sheetsPending');
   if(!el('productLotListV174')?.children.length&&intro)intro.textContent=mode==='done'?'Aucune fiche produit terminée pour le moment.':'Aucune fiche produit à compléter. Consultez « Fiches terminées » pour les fiches complètes.';
  }
  root.openProductSheetsFromHomeV174=()=>openSchoolSheets('pending');
  root.openProductSheetsDoneFromHomeV200=()=>openSchoolSheets('done');
  for(const [id,mode]of [['homeProductSheetsBtnV174','pending'],['homeProductSheetsDoneBtnV200','done']])if(el(id))el(id).onclick=()=>openSchoolSheets(mode);
  API.productBadges=function(local){
   const records=entries(schoolRows,'results').filter(r=>r.kind!=='archive'&&r.status!=='Archivé');
   const totals=records.map(r=>r.sheets).concat(local.map(r=>({total:r.sheetTotal,filled:r.sheetFilled}))).reduce((a,r)=>({total:a.total+Number(r.total||0),filled:a.filled+Number(r.filled||0)}),{total:0,filled:0});
   const pending=el('homeProductSheetsPendingBadgeV200'),done=el('homeProductSheetsDoneBadgeV200');
   if(pending){pending.textContent=totals.total?totals.filled+'/'+totals.total:'0';pending.title=totals.filled+' fiche(s) complétée(s) sur '+totals.total;}
   if(done){done.textContent=String(totals.filled);done.title=totals.filled+' fiche(s) produit terminée(s)';}
  };

  const localReceptionBadges=renderHomeReceptionBadge;
  function schoolReceptionBadges(){
   localReceptionBadges();
   const records=entries(schoolRows,'results',typeof receptionStatusForConfig==='function'?receptionStatusForConfig:null).filter(r=>r.kind!=='archive'&&r.status!=='Archivé');
   if(!records.length)return;
   const local=allReceptionLots();
   const totals=local.map(r=>r.receptionStatus).concat(records.map(r=>r.receptionStatus)).reduce((a,r)=>({done:a.done+Number(r?.done||0),total:a.total+Number(r?.total||0)}),{done:0,total:0});
   const pending=el('homeReceptionBadge'),done=el('homeReceptionHistoryBadge');
   if(pending){pending.textContent=totals.total?totals.done+'/'+totals.total:'0';pending.title='Réceptions de votre espace et des établissements';}
   if(done){done.textContent=String(totals.done);done.title='Réceptions enregistrées dans votre espace et les établissements';}
  }
  renderHomeReceptionBadge=schoolReceptionBadges;
  let refreshingReception=false;
  async function refreshReceptionBadges(){
   if(document.hidden||refreshingReception||!root.JuryAccountV385?.client||root.JuryAccountV385?.signedOut||root.JuryAccountV385?.schoolMode)return;
   refreshingReception=true;
   try{await refresh();schoolReceptionBadges();root.renderProductSheetHomeBadgesV200?.()}catch(e){console.warn('Actualisation des réceptions',e)}finally{refreshingReception=false}
  }
  refreshReceptionBadges();
  setInterval(refreshReceptionBadges,5000);

  const localArchives=renderArchives;
  renderArchives=function(){
   localArchives();
   appendSchools('archiveList','archives').then(()=>{
    if(el('archiveList')?.querySelector('[data-school-jurys]'))el('archiveList')?.querySelector('.archive-empty')?.remove();
   });
  };

  const results=openResultsLotChooserV348;
  openResultsLotChooserV348=async function(){await results();await appendSchools('resultsLotListV348','results')};
  for(const id of ['resultsBtn','hubResultsBtn'])if(el(id))el(id).onclick=openResultsLotChooserV348;
  if(new URLSearchParams(location.search).has('schoolLogin'))root.JuryAccountV385.open();
 }
 API.refresh=refresh;
 mount();
})(typeof window==='undefined'?globalThis:window);

