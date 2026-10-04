(function(){
  function repairAfterLotsResetV207(){
    var CLEAN_KEY='jm_tc_lots_clean_mode_v207';
    if(!localStorage.getItem(CLEAN_KEY))return false;

    /* V209 : le bouton Réinitialiser efface déjà les lots AVANT le rechargement.
       Le marqueur sert seulement à signaler que cette opération vient d'avoir lieu.
       Il ne faut surtout pas ré-effacer les données au chargement suivant, sinon
       un nouveau lot créé après la remise à zéro disparaît au prochain Ctrl+F5. */
    try{localStorage.removeItem(CLEAN_KEY);}catch(e){}
    return false;
  }

  function ensureHomeTools(){
    var home=document.getElementById('homeView');
    if(!home)return;
    var grid=home.querySelector('.home-command-grid');
    var wrap=home.querySelector('.home-quick-tools-v174');
    if(!wrap && grid){
      wrap=document.createElement('div');
      wrap.className='home-quick-tools-v174';
      wrap.innerHTML='<div class="home-quick-reception"><button class="home-reception-btn" id="homeReceptionBtn" type="button"><span class="quick-icon">🚚</span><span><strong>Réception chauffeur</strong><span>À réceptionner · réceptions partielles</span></span><span class="home-reception-badge" id="homeReceptionBadge">0</span></button><button class="home-reception-btn reception-history-btn" id="homeReceptionHistoryBtn" type="button"><span class="quick-icon">✅</span><span><strong>Réceptions enregistrées</strong><span>Consulter les réceptions terminées</span></span><span class="home-reception-badge" id="homeReceptionHistoryBadge">0</span></button></div><div class="home-quick-reception home-quick-products-v200"><button class="home-product-btn-v174" id="homeProductSheetsBtnV174" type="button"><span class="quick-icon">📋</span><span><strong>Fiches à compléter</strong><span>Traçabilité · conformité · annexes</span></span><span class="home-reception-badge" id="homeProductSheetsPendingBadgeV200">0</span></button><button class="home-product-btn-v174 product-history-btn-v200" id="homeProductSheetsDoneBtnV200" type="button"><span class="quick-icon">✅</span><span><strong>Fiches terminées</strong><span>Consulter les fiches produits complètes</span></span><span class="home-reception-badge" id="homeProductSheetsDoneBadgeV200">0</span></button></div>';
      grid.insertAdjacentElement('afterend',wrap);
    }
    var r=document.getElementById('homeReceptionBtn');
    var h=document.getElementById('homeReceptionHistoryBtn');
    var f=document.getElementById('homeProductSheetsBtnV174');
    if(wrap){
      wrap.style.setProperty('display','grid','important');
      wrap.style.setProperty('visibility','visible','important');
      wrap.style.setProperty('opacity','1','important');
    }
    if(r){
      r.style.setProperty('display','flex','important');
      r.onclick=function(){
        if(typeof openReceptionFromHome==='function')openReceptionFromHome();
        else alert('Réception chauffeur : moteur non chargé.');
      };
    }
    if(h){
      h.style.setProperty('display','flex','important');
      h.onclick=function(){
        if(typeof openReceptionHistoryFromHome==='function')openReceptionHistoryFromHome();
        else alert('Réceptions enregistrées : moteur non chargé.');
      };
    }
    if(f){
      f.style.setProperty('display','flex','important');
      f.onclick=function(){
        if(typeof openProductSheetsFromHomeV174==='function')openProductSheetsFromHomeV174();
        else if(typeof openProductSheets==='function')openProductSheets();
        else alert('Fiches produits : moteur non chargé.');
      };
    }
  }
  function ensureResetLotsToolV207(){
    var body=document.querySelector('#advancedTools .advanced-tools-body');
    if(!body)return;

    var reset=document.getElementById('resetLotsBtnV207');
    if(!reset){
      reset=document.createElement('button');
      reset.className='btn btn-small';
      reset.id='resetLotsBtnV207';
      reset.type='button';
      reset.textContent='🧹 Réinitialiser les lots';
      var fileInput=document.getElementById('restoreFile');
      if(fileInput)body.insertBefore(reset,fileInput); else body.appendChild(reset);
    }

    var restore=document.getElementById('restoreLotsBtnV207');
    if(!restore){
      restore=document.createElement('button');
      restore.className='btn btn-small';
      restore.id='restoreLotsBtnV207';
      restore.type='button';
      restore.textContent='↩️ Restaurer les anciens lots';
      restore.style.display='none';
      var fileInput2=document.getElementById('restoreFile');
      if(fileInput2)body.insertBefore(restore,fileInput2); else body.appendChild(restore);
    }

    var BACKUP_KEY='jm_tc_lots_reset_backup_v207';
    var CLEAN_KEY='jm_tc_lots_clean_mode_v207';

    function lotKeys(){
      return [
        (typeof PREPARED_JURY_STORAGE_KEY!=='undefined'?PREPARED_JURY_STORAGE_KEY:'jm_test_culinaire_prepared_v97'),
        (typeof SAMPLE_LOT_HISTORY_STORAGE_KEY!=='undefined'?SAMPLE_LOT_HISTORY_STORAGE_KEY:'jm_test_culinaire_sample_lot_history_v178'),
        (typeof SAMPLE_MASTER_STORAGE_KEY!=='undefined'?SAMPLE_MASTER_STORAGE_KEY:'jm_test_culinaire_sample_master_v1'),
        (typeof SAMPLE_MASTER_META_STORAGE_KEY!=='undefined'?SAMPLE_MASTER_META_STORAGE_KEY:'jm_test_culinaire_sample_master_meta_v1'),
        (typeof SAMPLE_PRODUCTS_STORAGE_KEY!=='undefined'?SAMPLE_PRODUCTS_STORAGE_KEY:'jm_test_culinaire_sample_products_v1'),
        (typeof RECOVERY_STORAGE_KEY!=='undefined'?RECOVERY_STORAGE_KEY:'jm_test_culinaire_recovery_v29')
      ];
    }
    function copy(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return null;}}
    function security(){
      try{if(state&&state.config&&state.config.security)return copy(state.config.security);}catch(e){}
      return null;
    }
    function blankState(sec){
      var count=6;
      var cfg={
        _emptyAfterReset:true,
        _juryInstanceId:(typeof uid==='function'?uid('jury'):'jury_reset_'+Date.now()),
        lotName:'',lotNumber:'',lotTitle:'',subtitle:'',
        supplierNames:[],supplierResponseCount:0,receptions:[],receptionEstablishment:'',
        criteria:(typeof defaultCriteria==='function'?defaultCriteria():[]),
        testerCount:count,
        testerNames:Array.from({length:count},function(_,i){return 'Testeur '+(i+1);}),
        products:[],
        security:sec||null
      };
      if(typeof makeInitialState==='function')return makeInitialState(cfg);
      var testers={};
      for(var i=1;i<=count;i++)testers[i]={name:'Testeur '+i,answers:{},validatedAt:null};
      return {version:4,config:cfg,testers:testers,updatedAt:null};
    }
    async function pinOk(){
      if(typeof securityEnabled!=='function'||!securityEnabled())return true;
      var pin=prompt('Saisissez votre code PIN administrateur pour confirmer.');
      if(pin===null)return false;
      var ok=(typeof verifyPin==='function')?await verifyPin(String(pin).trim()):false;
      if(!ok)alert('Code PIN incorrect. Aucun lot n’a été supprimé.');
      return ok;
    }
    function saveBackup(){
      var stateKey=(typeof STORAGE_KEY!=='undefined'?STORAGE_KEY:'jm_test_culinaire_param_v2');
      var items={};
      items[stateKey]=localStorage.getItem(stateKey);
      lotKeys().forEach(function(k){items[k]=localStorage.getItem(k);});
      localStorage.setItem(BACKUP_KEY,JSON.stringify({createdAt:new Date().toISOString(),items:items}));
    }
    function updateRestore(){
      restore.style.display=localStorage.getItem(BACKUP_KEY)?'inline-flex':'none';
    }
    async function resetLots(){
      if(!confirm('Réinitialiser tous les lots actifs ?\n\nLes jurys préparés, réceptions, fiches produits et sauvegardes de reprise seront vidés.\n\nLe PIN, la sécurité et les archives seront conservés.'))return;
      if(!(await pinOk()))return;
      if(!confirm('Dernière confirmation : repartir de zéro pour les lots ?\n\nUne sauvegarde locale sera créée automatiquement.'))return;

      try{
        saveBackup();
        var sec=security();
        lotKeys().forEach(function(k){localStorage.removeItem(k);});

        var stateKey=(typeof STORAGE_KEY!=='undefined'?STORAGE_KEY:'jm_test_culinaire_param_v2');
        var clean=blankState(sec);
        localStorage.setItem(stateKey,JSON.stringify(clean));
        localStorage.setItem(CLEAN_KEY,new Date().toISOString());

        try{
          var cloudKey=(typeof CLOUD_STORAGE_KEY!=='undefined'?CLOUD_STORAGE_KEY:'jm_test_culinaire_cloud_v1');
          var cc=JSON.parse(localStorage.getItem(cloudKey)||'{}');
          cc.sessionId='';localStorage.setItem(cloudKey,JSON.stringify(cc));
        }catch(e){}
        try{
          var accessKey=(typeof CLOUD_ACCESS_STORAGE_KEY!=='undefined'?CLOUD_ACCESS_STORAGE_KEY:'jm_test_culinaire_access_v20');
          localStorage.removeItem(accessKey);
        }catch(e){}

        alert('Les lots ont été remis à zéro.\n\nLe PIN et les archives sont conservés. Vous pourrez restaurer les anciens lots depuis Outils avancés.');
        var u=new URL(location.href);
        ['session','tester','accessCode','supabaseUrl','supabaseKey','adminToken','ownerToken','appBuild'].forEach(function(k){u.searchParams.delete(k);});
        u.searchParams.set('lotsReset','1');
        location.replace(u.toString());
      }catch(e){
        console.error(e);
        alert('La réinitialisation a échoué. Aucun effacement supplémentaire n’a été effectué.');
      }
    }
    async function restoreLots(){
      var raw=localStorage.getItem(BACKUP_KEY);
      if(!raw){alert('Aucune sauvegarde des anciens lots n’est disponible.');updateRestore();return;}
      if(!(await pinOk()))return;
      if(!confirm('Restaurer les lots tels qu’ils étaient juste avant la remise à zéro ?'))return;
      try{
        var data=JSON.parse(raw),items=data&&data.items||{};
        Object.keys(items).forEach(function(k){
          var v=items[k];
          if(v===null||v===undefined)localStorage.removeItem(k); else localStorage.setItem(k,v);
        });
        localStorage.removeItem(CLEAN_KEY);
        alert('Les anciens lots ont été restaurés. La page va se recharger.');
        location.reload();
      }catch(e){
        console.error(e);
        alert('La sauvegarde des lots est illisible.');
      }
    }

    reset.onclick=resetLots;
    restore.onclick=restoreLots;
    updateRestore();
  }

  function forceZeroBadgesAfterResetV207(){
    if(!localStorage.getItem('jm_tc_lots_clean_mode_v207'))return;
    [
      'homeReceptionBadge',
      'homeReceptionHistoryBadge',
      'homeProductSheetsPendingBadgeV200',
      'homeProductSheetsDoneBadgeV200'
    ].forEach(function(id){
      var el=document.getElementById(id);
      if(el)el.textContent='0';
    });
  }

  function clearOldAppCache(){
    try{
      if(window.caches&&caches.keys){
        caches.keys().then(function(keys){
          keys.forEach(function(k){
            if(String(k).indexOf('tests-culinaires')>=0)caches.delete(k);
          });
        }).catch(function(){});
      }
    }catch(e){}
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      var repaired=repairAfterLotsResetV207(); ensureHomeTools(); ensureResetLotsToolV207(); forceZeroBadgesAfterResetV207(); clearOldAppCache(); if(repaired){try{renderHome();}catch(e){}}
      setTimeout(function(){var repaired=repairAfterLotsResetV207();ensureHomeTools();ensureResetLotsToolV207();if(repaired){try{renderHome();}catch(e){}}},300);
      setTimeout(function(){var repaired=repairAfterLotsResetV207();ensureHomeTools();ensureResetLotsToolV207();if(repaired){try{renderHome();}catch(e){}}},1500);
    });
  }else{
    var repaired=repairAfterLotsResetV207(); ensureHomeTools(); ensureResetLotsToolV207(); forceZeroBadgesAfterResetV207(); clearOldAppCache(); if(repaired){try{renderHome();}catch(e){}}
    setTimeout(function(){ensureHomeTools();ensureResetLotsToolV207();},300);
    setTimeout(function(){ensureHomeTools();ensureResetLotsToolV207();},1500);
  }
})();
