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
   if(phoneSharePrepared(state.config)&&currentJuryShareSessionId()){
    await ensurePreparedShareConnected();
    await fetchCloudState();
   }
   if(selected){
    if(target.view==='results')openSimplifiedResults();
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
})(typeof window==='undefined'?globalThis:window);

