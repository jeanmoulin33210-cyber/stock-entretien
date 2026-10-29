/* Establishment iframe only: use its verified account for ordinary jury RPCs.
 * The parent routes jury creation through the school-scoped server operation.
 * No auth token is copied into snapshot storage or tester links. */
(function(root){
 'use strict';
 const boot=root.__JURY_DEMO_BOOT;
 if(!boot||!root.__JURY_SCHOOL_TRIAL_ACTIVE||root.parent===root)return;
 const c=root.parent.JurySchoolTrialV452.clientForSchool(boot.school,boot.nonce);
 root.JuryAccountV385={client:c,signedOut:false,
  async restore(){
   // A reloaded jury resumes the same session and retrieves telephone answers.
   if(phoneSharePrepared(state.config)&&currentJuryShareSessionId()){
    await ensurePreparedShareConnected();
    await fetchCloudState();
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
})(window);
