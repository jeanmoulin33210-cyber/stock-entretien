/* Unified login and general jury choosers. Foreign school snapshots are never
 * imported into the general owner's local catalogue. RLS remains authoritative. */
(function(root){
 'use strict';
 const PREF='jm_tc_account_v385';
 const parse=(s,f)=>{try{return JSON.parse(s)||f}catch(e){return f}};
 const schoolEmail=email=>/^jury-test(?:[1-9]|1[0-2])@mailo\.com$/.test(String(email||'').toLowerCase());
 const logical=(name,products)=>String(name||'').trim().toLowerCase()+'|'+(products||[]).map(p=>String(p.name||'').trim().toLowerCase()).sort().join('|');
 function entries(rows,view,receptionStatus){
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
   const occupied=new Set();
   for(const rec of byId.values()){
    const c=rec.state.config,key=logical(c.lotName,c.products);occupied.add(key);
    if((view==='prepare'||view==='launch')&&(rec.kind==='archive'||c._archive?.archivedAt||c.juryClose?.closedAt))continue;
    if(view==='reception'||view==='receptionHistory'){
     if(rec.kind==='archive'||c._archive?.archivedAt)continue;
     const rs=typeof receptionStatus==='function'?receptionStatus(c):null;
     if(view==='reception'&&rs?.key==='done')continue;
     if(view==='receptionHistory'&&!(c.receptions||[]).some(r=>r.validatedAt))continue;
    }
    out.push({school:row.school,label:row.label,id:String(rec.id),kind:rec.kind,lotName:c.lotName||rec.name||'Jury',products:c.products.length,status:rec.kind==='archive'||c._archive?.archivedAt?'Archivé':c.juryClose?.closedAt?'Jury terminé':c.juryLaunch?.openedAt?'Jury en cours':'Jury préparé'});
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
   if(!records.length)return;
   const section=document.createElement('section');section.dataset.schoolJurys='1';
   const heading=document.createElement('h3');heading.textContent='Jurys des établissements';section.appendChild(heading);
   for(const rec of records){
    const b=document.createElement('button');b.type='button';b.className='prepare-jury-choice';
    const span=document.createElement('span'),title=document.createElement('strong'),label=document.createElement('span'),status=document.createElement('span');
    title.textContent=rec.lotName;label.textContent=rec.label+' · '+rec.products+' produit(s)';status.textContent=rec.status;status.className='prepare-jury-status';
    span.append(title,label,status);b.appendChild(span);b.onclick=()=>{const modal={prepare:'prepareJuryModal',results:'resultsLotModalV348',reception:'receptionLotModal',receptionHistory:'receptionHistoryModal'}[view];if(modal)el(modal)?.classList.remove('show');openEntry(rec,view)};section.appendChild(b);
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

  const results=openResultsLotChooserV348;
  openResultsLotChooserV348=async function(){await results();await appendSchools('resultsLotListV348','results')};
  for(const id of ['resultsBtn','hubResultsBtn'])if(el(id))el(id).onclick=openResultsLotChooserV348;
  if(new URLSearchParams(location.search).has('schoolLogin'))root.JuryAccountV385.open();
 }
 API.refresh=refresh;
 mount();
})(typeof window==='undefined'?globalThis:window);

