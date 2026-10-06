/* V207 — Réinitialisation complète et réversible des lots actifs.
   Conserve le PIN, la sécurité, les archives et les modèles.
   Une sauvegarde locale est créée automatiquement avant toute suppression. */
(function(){
  'use strict';

  const BACKUP_KEY='jm_tc_lots_reset_backup_v207';
  const CLEAN_KEY='jm_tc_lots_clean_mode_v207';

  function storageKeysToReset(){
    return [
      (typeof PREPARED_JURY_STORAGE_KEY!=='undefined'?PREPARED_JURY_STORAGE_KEY:'jm_test_culinaire_prepared_v97'),
      (typeof ARCHIVE_STORAGE_KEY!=='undefined'?ARCHIVE_STORAGE_KEY:'jm_test_culinaire_archives_v1'),
      (typeof SAMPLE_LOT_HISTORY_STORAGE_KEY!=='undefined'?SAMPLE_LOT_HISTORY_STORAGE_KEY:'jm_test_culinaire_sample_lot_history_v178'),
      (typeof SAMPLE_MASTER_STORAGE_KEY!=='undefined'?SAMPLE_MASTER_STORAGE_KEY:'jm_test_culinaire_sample_master_v1'),
      (typeof SAMPLE_MASTER_META_STORAGE_KEY!=='undefined'?SAMPLE_MASTER_META_STORAGE_KEY:'jm_test_culinaire_sample_master_meta_v1'),
      (typeof SAMPLE_PRODUCTS_STORAGE_KEY!=='undefined'?SAMPLE_PRODUCTS_STORAGE_KEY:'jm_test_culinaire_sample_products_v1'),
      (typeof RECOVERY_STORAGE_KEY!=='undefined'?RECOVERY_STORAGE_KEY:'jm_test_culinaire_recovery_v29'),
      (typeof CLOUD_STORAGE_KEY!=='undefined'?CLOUD_STORAGE_KEY:'jm_test_culinaire_cloud_v1'),
      (typeof CLOUD_ACCESS_STORAGE_KEY!=='undefined'?CLOUD_ACCESS_STORAGE_KEY:'jm_test_culinaire_access_v20'),
      BACKUP_KEY,
      'jm_tc_active_juries_backup_v238',
      'jm_tc_prepared_dedupe_backup_v238',
      'jm_tc_qr_repair_backup_v251',
      'jm_tc_product_sheets_repair_v256'
    ];
  }

  function deepCopy(v){
    try{return JSON.parse(JSON.stringify(v));}catch(e){return null;}
  }

  function currentSecurity(){
    try{
      if(state?.config?.security)return deepCopy(state.config.security);
    }catch(e){}
    try{
      const key=(typeof PREPARED_JURY_STORAGE_KEY!=='undefined'?PREPARED_JURY_STORAGE_KEY:'jm_test_culinaire_prepared_v97');
      const rows=JSON.parse(localStorage.getItem(key)||'[]');
      for(const r of (Array.isArray(rows)?rows:[])){
        if(r?.state?.config?.security)return deepCopy(r.state.config.security);
      }
    }catch(e){}
    return null;
  }

  function blankState(security){
    const testerCount=6;
    const cfg={
      _emptyAfterReset:true,
      _juryInstanceId:(typeof uid==='function'?uid('jury'):'jury_reset_'+Date.now()),
      lotName:'',
      lotNumber:'',
      lotTitle:'',
      subtitle:'',
      supplierNames:[],
      supplierResponseCount:0,
      receptions:[],
      receptionEstablishment:'',
      criteria:(typeof defaultCriteria==='function'?defaultCriteria():[]),
      testerCount,
      testerNames:Array.from({length:testerCount},(_,i)=>'Testeur '+(i+1)),
      products:[],
      security:security||null
    };
    if(typeof makeInitialState==='function')return makeInitialState(cfg);
    const testers={};
    for(let i=1;i<=testerCount;i++)testers[i]={name:'Testeur '+i,answers:{},validatedAt:null};
    return {version:4,config:cfg,testers,updatedAt:null};
  }

  async function checkPin(){
    if(typeof securityEnabled!=='function'||!securityEnabled())return true;
    const pin=prompt('Saisissez votre code PIN administrateur pour confirmer.');
    if(pin===null)return false;
    const ok=(typeof verifyPin==='function')?await verifyPin(String(pin).trim()):false;
    if(!ok)alert('Code PIN incorrect. Aucun lot n’a été supprimé.');
    return ok;
  }

  function saveBackup(){
    const items={};
    const stateKey=(typeof STORAGE_KEY!=='undefined'?STORAGE_KEY:'jm_test_culinaire_param_v2');
    items[stateKey]=localStorage.getItem(stateKey);
    for(const k of storageKeysToReset())items[k]=localStorage.getItem(k);

    const cloudKey=(typeof CLOUD_STORAGE_KEY!=='undefined'?CLOUD_STORAGE_KEY:'jm_test_culinaire_cloud_v1');
    const accessKey=(typeof CLOUD_ACCESS_STORAGE_KEY!=='undefined'?CLOUD_ACCESS_STORAGE_KEY:'jm_test_culinaire_access_v20');
    items[cloudKey]=localStorage.getItem(cloudKey);
    items[accessKey]=localStorage.getItem(accessKey);

    localStorage.setItem(BACKUP_KEY,JSON.stringify({
      createdAt:new Date().toISOString(),
      items
    }));
  }

  async function detachCurrentJuryCloud(){
    try{
      if(typeof cloudSyncTimer!=='undefined'&&cloudSyncTimer){
        clearTimeout(cloudSyncTimer);cloudSyncTimer=null;
      }
    }catch(e){}
    try{
      if(typeof cloudChannel!=='undefined'&&cloudChannel&&cloudClient)await cloudClient.removeChannel(cloudChannel);
    }catch(e){}
    try{
      if(typeof cloudPresenceChannel!=='undefined'&&cloudPresenceChannel&&cloudClient)await cloudClient.removeChannel(cloudPresenceChannel);
    }catch(e){}
    try{if(typeof cloudReady!=='undefined')cloudReady=false;}catch(e){}
    try{if(typeof cloudRole!=='undefined')cloudRole=null;}catch(e){}
    try{if(typeof cloudTesterNo!=='undefined')cloudTesterNo=null;}catch(e){}

    try{
      const cloudKey=(typeof CLOUD_STORAGE_KEY!=='undefined'?CLOUD_STORAGE_KEY:'jm_test_culinaire_cloud_v1');
      const old=JSON.parse(localStorage.getItem(cloudKey)||'{}');
      old.sessionId='';
      localStorage.setItem(cloudKey,JSON.stringify(old));
    }catch(e){}
    try{
      const accessKey=(typeof CLOUD_ACCESS_STORAGE_KEY!=='undefined'?CLOUD_ACCESS_STORAGE_KEY:'jm_test_culinaire_access_v20');
      localStorage.removeItem(accessKey);
    }catch(e){}
  }

  function updateRestoreButton(){
    const b=document.getElementById('restoreLotsBtnV207');
    if(b)b.style.display='none';
  }

  async function resetLots(){
    const first=confirm(
      'Réinitialiser tous les lots actifs ?\n\n'+
      'Tous les anciens essais seront supprimés : jurys, réceptions, fiches produits, résultats, archives et sauvegardes de reprise.\n\n'+
      'Le PIN, la sécurité et les modèles seront conservés.'
    );
    if(!first)return;

    if(!(await checkPin()))return;

    const second=confirm(
      'Dernière confirmation : repartir vraiment de zéro ?\n\n'+
      'Cette remise à zéro supprimera aussi les archives et les anciennes sauvegardes. Il n’y aura pas de restauration des anciens essais.'
    );
    if(!second)return;

    try{
      const security=currentSecurity();
      await detachCurrentJuryCloud();

      for(const k of storageKeysToReset())localStorage.removeItem(k);

      const stateKey=(typeof STORAGE_KEY!=='undefined'?STORAGE_KEY:'jm_test_culinaire_param_v2');
      const clean=blankState(security);
      localStorage.setItem(stateKey,JSON.stringify(clean));
      localStorage.setItem(CLEAN_KEY,new Date().toISOString());

      alert(
        'Remise à zéro terminée.\n\n'+
        'Tous les anciens lots, résultats, archives, réceptions et fiches produits ont été supprimés.\n'+
        'Votre PIN et votre sécurité sont conservés. Vous pouvez maintenant faire un vrai test.'
      );

      /* Recharger sans les paramètres session/testeur de l'ancien jury,
         sinon Supabase pourrait le recharger immédiatement. */
      const u=new URL(location.href);
      ['session','tester','accessCode','supabaseUrl','supabaseKey','adminToken','ownerToken','appBuild'].forEach(k=>u.searchParams.delete(k));
      u.searchParams.set('lotsReset','1');
      location.replace(u.toString());
    }catch(e){
      console.error(e);
      alert('La réinitialisation n’a pas pu être terminée. Aucune sauvegarde n’a été volontairement supprimée.\n\n'+(e?.message||e));
    }
  }

  async function restoreLots(){
    const raw=localStorage.getItem(BACKUP_KEY);
    if(!raw){
      alert('Aucune sauvegarde des anciens lots n’est disponible.');
      updateRestoreButton();
      return;
    }
    if(!(await checkPin()))return;
    if(!confirm('Restaurer tous les lots tels qu’ils étaient juste avant la dernière réinitialisation ?'))return;

    try{
      const data=JSON.parse(raw);
      const items=data?.items||{};
      for(const [k,v] of Object.entries(items)){
        if(v===null||v===undefined)localStorage.removeItem(k);
        else localStorage.setItem(k,v);
      }
      localStorage.removeItem(CLEAN_KEY);
      alert('Les anciens lots ont été restaurés. L’application va se recharger.');
      const u=new URL(location.href);
      u.searchParams.delete('lotsReset');
      location.replace(u.toString());
    }catch(e){
      console.error(e);
      alert('La sauvegarde des anciens lots est illisible. Rien n’a été restauré.');
    }
  }

  function bind(){
    const reset=document.getElementById('resetLotsBtnV207');
    const restore=document.getElementById('restoreLotsBtnV207');
    if(reset){reset.textContent='🧹 Repartir vraiment de zéro';reset.onclick=resetLots;}
    if(restore)restore.onclick=restoreLots;
    updateRestoreButton();
  }

  window.resetLotsV207=resetLots;
  window.restoreLotsV207=restoreLots;

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
  setTimeout(bind,500);
})();