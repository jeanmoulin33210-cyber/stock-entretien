/* Establishment iframe only: use its verified account for ordinary jury RPCs.
 * The parent routes jury creation through the school-scoped server operation.
 * No auth token is copied into snapshot storage or tester links. */
(function(root){
 'use strict';
 function resolveTarget(target,prepared,history,archives,current){
  if(!target?.id)return null;
  const list=target.kind==='sampleLot'?history:target.kind==='archive'?archives:prepared;
  const rec=(list||[]).find(r=>String(r.id)===String(target.id))||(target.kind==='prepared'&&String(current?.config?._preparedId)===String(target.id)?{id:target.id,state:current}:null);
  if(!rec)throw new Error('Ce lot a changé ou a été retiré. Revenez à la vue générale et actualisez la liste.');
  return rec;
 }
 if(typeof module==='object'&&module.exports){module.exports={resolveTarget};return;}
 const boot=root.__JURY_DEMO_BOOT;
 if(!boot||!root.__JURY_SCHOOL_TRIAL_ACTIVE||root.parent===root)return;
 const c=root.parent.JurySchoolTrialV452.clientForSchool(boot.school,boot.nonce);
 root.JuryAccountV385={client:c,signedOut:false,
  async restore(){
   const target=boot.target;
   const selected=target?.id?resolveTarget(target,loadPreparedJurys(),loadSampleLotHistory(),loadArchives(),state):null;
   if(selected&&target.kind==='sampleLot'){
    if(!restoreSampleLotSnapshot(selected))throw new Error('Ce lot ne peut pas être ouvert.');
    startBlankJuryFromMaster();return true;
   }
   if(selected){
    state=deepClone(selected.state);draftConfig=null;
    if(target.kind==='prepared'&&!state.config._preparedId)state.config._preparedId=selected.id;
    currentTester=1;currentProduct=state.config.products?.[0]?.id||'';
    currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';adminProduct=currentProduct;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
   }
   // A reloaded jury resumes the same session and retrieves telephone answers.
   if(target?.kind!=='archive'&&target?.view!=='archives'&&!['reception','receptionHistory','sheetsPending','sheetsDone'].includes(target?.view)&&phoneSharePrepared(state.config)&&currentJuryShareSessionId()){
    await ensurePreparedShareConnected();
    await fetchCloudState();
   }
   if(selected){
    if(target.kind==='archive'||target.view==='archives')renderArchives();
    else if(target.view==='reception')openReceptionView(-1);
    else if(target.view==='receptionHistory'){
     const index=latestValidatedReceptionIndex(state.config);
     if(index<0)throw new Error('Aucune réception enregistrée pour ce lot.');
     openReceptionView(index);
    }
    else if(target.view==='sheetsPending'||target.view==='sheetsDone'){
     activeProductSheetId=target.view==='sheetsDone'?(state.config.products||[]).find(p=>(p.samples||[]).some(sm=>productSheetMissingFields(state,p,sm).length===0))?.id:firstIncompleteProductSheetId(state);
     openProductSheets(target.view==='sheetsDone');
    }
    else if(target.view==='results')openSimplifiedResults();
    else if(target.view==='launch'&&!state.config.juryLaunch?.openedAt)renderLaunchView();
    else if(state.config.juryLaunch?.openedAt)renderJuryView();
    else openConfig();
   }
   return true;
  },
  async signout(){throw new Error('Fermez le jury puis utilisez « Se déconnecter de cet essai ».');}
 };
 // The school snapshot service is the single workspace synchronizer here.
 // Keep the existing per-jury answer transport; disable the legacy owner mirror.
 ownerWorkspaceBusyV352=true;
 automaticOwnerWorkspaceV352=async function(){};
 cloudCfg.url=DEFAULT_SUPABASE_URL;
 cloudCfg.key=DEFAULT_SUPABASE_KEY;
 const originalStatus=setCloudStatus;
 setCloudStatus=function(kind,text){
  return originalStatus(kind,kind==='local'?'● Espace établissement':text);
 };
 const at=document.getElementById('cloudStatus');
 if(at&&/Local/.test(at.textContent))at.textContent='● Espace établissement';

 // One toolbar inside the app, with actions handled by the owning parent.
 if(boot.integrated){
  const paintSchoolHeader=()=>{
   const title=document.getElementById('headerTitle'),sub=document.getElementById('headerSub');
   const expected='Tests culinaires · '+boot.label;
   if(title&&title.textContent!==expected)title.textContent=expected;
   if(sub&&sub.textContent!=='Groupe Marchés Nouvelle-Aquitaine')sub.textContent='Groupe Marchés Nouvelle-Aquitaine';
  };
  const previousHeader=updateHeader;
  updateHeader=function(){const result=previousHeader.apply(this,arguments);paintSchoolHeader();return result;};
  const mountHeader=()=>{
   const bar=document.querySelector('header.topbar'),home=document.getElementById('homeBtn');
   if(!bar||!home)return;
   const navigate=async action=>{
    try{
     const parentApi=root.parent.JurySchoolTrialV452;
     if(typeof parentApi?.headerAction==='function')await parentApi.headerAction(action,boot.school,boot.nonce);
     else root.parent.postMessage({kind:'jury-school-header-action',school:boot.school,nonce:boot.nonce,action},boot.origin);
    }catch(e){
     const note=document.getElementById('schoolSaveStatusV496');if(note){note.textContent=e.message||String(e);note.style.color='#a53131';}
    }
   };
   home.onclick=()=>navigate('home');
   for(const [id,label,action]of [['schoolAccountV496','Mon compte','account'],['schoolRefreshV496','↻ Actualiser','refresh']]){
    const button=document.createElement('button');button.id=id;button.type='button';button.className='btn btn-secondary btn-small';button.textContent=label;
    button.onclick=()=>{
     if(action==='refresh'){
      button.textContent='↻ Actualisation…';
      const note=document.getElementById('schoolSaveStatusV496');
      if(note)note.textContent='Actualisation en cours…';
     }
     navigate(action);
    };
    bar.insertBefore(button,home);
   }
   const status=document.createElement('p');status.id='schoolSaveStatusV496';status.setAttribute('role','status');status.setAttribute('aria-live','polite');bar.after(status);
   const style=document.createElement('style');style.textContent='header.topbar{display:flex!important;flex-wrap:wrap!important;align-items:center;gap:8px!important;padding:10px 14px!important}header.topbar .topbar-title{flex:1 1 220px!important;min-width:0!important}header.topbar .topbar-title strong{font:600 15px/1.4 system-ui!important}header.topbar .topbar-title span{font-size:10px}header.topbar .btn{min-height:36px;padding:7px 10px;font-size:12px}#cloudStatus,#appBuildBadge{display:none!important}#schoolSaveStatusV496{margin:0;padding:3px 16px 5px;font:11px/1.4 system-ui;color:#537064;background:#f3f6ef}#schoolSaveStatusV496:empty{display:none}@media(max-width:600px){header.topbar .topbar-title{flex-basis:calc(100% - 54px)!important}header.topbar .topbar-title strong{font-size:14px!important}}';document.head.appendChild(style);
   // Legacy screen renderers rewrite the title after updateHeader returns.
   // Reapply the school label only when needed, avoiding observer loops.
   const titleNode=document.getElementById('headerTitle');
   if(titleNode)new MutationObserver(paintSchoolHeader).observe(titleNode,{childList:true,subtree:true,characterData:true});
   paintSchoolHeader();
   root.parent.postMessage({kind:'jury-school-header-ready',school:boot.school,nonce:boot.nonce},boot.origin);
  };
  // A refresh warning applies only while the unsaved form is open.
  function clearLeftFormWarningV605(){
   if(!document.querySelector('#homeView.active'))return;
   const note=document.getElementById('schoolSaveStatusV496');
   if(note?.textContent!=='Enregistrez d’abord la fiche dans le logiciel, puis changez de rôle.')return;
   note.textContent='';note.style.color='#537064';
   root.parent.postMessage({kind:'jury-school-clear-form-warning',school:boot.school,nonce:boot.nonce},boot.origin);
  }
  const warningObserverV605=new MutationObserver(clearLeftFormWarningV605);
  warningObserverV605.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
  root.addEventListener('message',event=>{
   if(event.source!==root.parent||event.origin!==boot.origin||event.data?.nonce!==boot.nonce)return;
   if(event.data.kind==='jury-school-refresh-result'){
    const button=document.getElementById('schoolRefreshV496');if(button)button.textContent='↻ Actualiser';
    const note=document.getElementById('schoolSaveStatusV496');if(note){note.textContent=event.data.error||'';note.style.color='#a53131';}
    return;
   }
   if(event.data.kind!=='jury-school-save-status')return;
   if(event.data.bad){const button=document.getElementById('schoolRefreshV496');if(button)button.textContent='↻ Actualiser';}
   const node=document.getElementById('schoolSaveStatusV496');if(node){node.textContent=event.data.text||'';node.style.color=event.data.bad?'#a53131':'#537064';}
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountHeader);else mountHeader();
 }

})(typeof window==='undefined'?globalThis:window);

