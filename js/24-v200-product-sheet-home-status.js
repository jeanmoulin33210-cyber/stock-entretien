/* v254 : compteurs fiches limités aux lots actifs (hors jurys fermés / archivés) */
(function(){
  function sheetLots(){
    /* V254 — les compteurs Fiches produits sont calculés directement depuis
       l'état courant et les jurys actifs sauvegardés. Ils ne dépendent plus
       de la liste Réception chauffeur. */
    var candidates=[];
    var seen=new Set();

    function activeState(st){
      var cfg=st&&st.config;
      return !!(cfg&&Array.isArray(cfg.products)&&cfg.products.length&&
        !(cfg.juryClose&&cfg.juryClose.closedAt)&&
        !(cfg._archive&&cfg._archive.archivedAt));
    }
    function stateKey(st,fallback){
      var cfg=st&&st.config||{};
      return String(
        cfg._preparedId||
        cfg._juryInstanceId||
        cfg.juryInstanceId||
        cfg.juryLaunch&&cfg.juryLaunch.instanceId||
        fallback||
        cfg.lotName||
        ''
      );
    }
    function addCandidate(st,meta){
      if(!activeState(st))return;
      var key=stateKey(st,meta&&meta.id);
      if(!key||seen.has(key))return;
      seen.add(key);
      candidates.push({
        state:st,
        id:String((meta&&meta.id)||st.config._preparedId||key),
        current:!!(meta&&meta.current),
        source:(meta&&meta.source)||'prepared',
        name:(meta&&meta.name)||st.config.lotName||'Lot préparé'
      });
    }

    /* 1) État réellement ouvert sur l'appareil. */
    try{ addCandidate(state,{id:state&&state.config&&state.config._preparedId||'__current__',current:true,source:'current'}); }catch(e){}

    /* 2) Tous les jurys actifs sauvegardés. */
    var prepared=[];
    try{ prepared=(typeof loadPreparedJurys==='function')?(loadPreparedJurys()||[]):[]; }catch(e){ prepared=[]; }
    prepared.forEach(function(rec){
      addCandidate(rec&&rec.state,{
        id:rec&&rec.id,
        current:String(rec&&rec.id)===String(state&&state.config&&state.config._preparedId||''),
        source:'prepared',
        name:rec&&rec.name
      });
    });

    /* 3) Secours très ciblé : la sauvegarde créée juste avant une réparation QR.
       On ne l'utilise que si aucun jury actif normal n'est visible. */
    if(!candidates.length){
      try{
        var qrBackup=JSON.parse(localStorage.getItem('jm_tc_qr_repair_backup_v251')||'null');
        if(activeState(qrBackup&&qrBackup.state)){
          addCandidate(qrBackup.state,{
            id:'__qr_backup_v251__',
            current:false,
            source:'qrBackup',
            name:qrBackup.state.config.lotName||'Jury sauvegardé'
          });
        }
      }catch(e){}
    }

    /* Un ancien marqueur "lots remis à zéro" ne doit plus masquer un jury
       effectivement retrouvé ci-dessus. */
    if(candidates.length){
      try{ localStorage.removeItem('jm_tc_lots_clean_mode_v207'); }catch(e){}
    }

    return candidates.map(function(item){
      var st=item.state;
      var cfg=st.config||{};
      var prog={total:0,filled:0};
      try{ if(typeof productSheetsProgress==='function') prog=productSheetsProgress(st); }catch(e){}

      var firstIssue=null;
      try{
        var validation=(typeof productSheetsValidation==='function') ? productSheetsValidation(st) : null;
        firstIssue=validation&&validation.issues&&validation.issues.length ? validation.issues[0] : null;
      }catch(e){}

      var names=[];
      try{
        if(typeof supplierNamesFromConfigV254==='function')names=supplierNamesFromConfigV254(cfg)||[];
        else if(typeof supplierNamesFromConfigV252==='function')names=supplierNamesFromConfigV252(cfg)||[];
        else names=(cfg.supplierNames||[]).filter(function(x){return String(x||'').trim();});
      }catch(e){ names=(cfg.supplierNames||[]).filter(function(x){return String(x||'').trim();}); }

      var total=Number(prog.total||0),filled=Number(prog.filled||0);
      var key=(total>0&&filled>=total)?'done':(filled>0?'partial':'pending');

      return {
        id:item.id,
        current:item.current,
        source:item.source,
        name:item.name||cfg.lotName||'Lot préparé',
        products:Array.isArray(cfg.products)?cfg.products.length:0,
        suppliers:names.length,
        sheetTotal:total,
        sheetFilled:filled,
        sheetMissing:Math.max(0,total-filled),
        firstProductId:firstIssue?String(firstIssue.productId||''):'',
        firstSampleId:firstIssue?String(firstIssue.sampleId||''):'',
        sheetStatus:key
      };
    });
  }

  function pendingLots(){ return sheetLots().filter(function(x){ return x.sheetStatus!=='done'; }); }
  function doneLots(){ return sheetLots().filter(function(x){ return Number(x.sheetFilled||0)>0; }); }

  function renderBadges(){
    var all=sheetLots(), pending=all.filter(function(x){ return x.sheetStatus!=='done'; }), done=all.filter(function(x){ return x.sheetStatus==='done'; });
    var missingCount=all.reduce(function(sum,row){ return sum+Number(row.sheetMissing||0); },0);
    var doneCount=all.reduce(function(sum,row){ return sum+Number(row.sheetFilled||0); },0);
    var a=document.getElementById('homeProductSheetsPendingBadgeV200');
    var b=document.getElementById('homeProductSheetsDoneBadgeV200');
    if(a){
      a.textContent=String(missingCount);
      a.title=missingCount ? missingCount+' fiche'+(missingCount>1?'s':'')+' produit à compléter' : 'Aucune fiche produit à compléter';
    }
    if(b){
      b.textContent=String(doneCount);
      b.title=doneCount ? doneCount+' fiche'+(doneCount>1?'s':'')+' produit terminée'+(doneCount>1?'s':'') : 'Aucune fiche produit terminée';
    }
  }

  function statusText(row){
    if(row.sheetStatus==='done') return '✓ Toutes les fiches produits sont complètes';
    if(!row.sheetTotal) return 'Fiches à compléter';
    if(row.sheetFilled>0) return row.sheetFilled+'/'+row.sheetTotal+' fiches complètes · '+row.sheetMissing+' à compléter';
    return 'À compléter · 0/'+row.sheetTotal+' fiche'+(row.sheetTotal>1?'s':'')+' complète'+(row.sheetTotal>1?'s':'');
  }

  function showPicker(rows,mode){
    var modal=document.getElementById('productLotModalV174');
    var list=document.getElementById('productLotListV174');
    if(!modal||!list)return;
    var h=modal.querySelector('h3');
    var p=modal.querySelector('p');
    var cancel=document.getElementById('productLotCancelV174');
    if(mode==='done'){
      if(h)h.textContent='✅ Fiches produits terminées';
      if(p)p.textContent=rows.length>1 ? rows.length+' lots ont toutes leurs fiches produits terminées. Touchez un lot pour les consulter.' : '1 lot a toutes ses fiches produits terminées. Touchez-le pour consulter ses fiches.';
      if(cancel)cancel.textContent='Fermer';
    }else{
      if(h)h.textContent='📋 Fiches produits à compléter';
      if(p)p.textContent=rows.length>1 ? rows.length+' lots ont encore des fiches à compléter. Sélectionnez le lot à continuer.' : '1 lot a encore des fiches à compléter. Touchez-le pour continuer.';
      if(cancel)cancel.textContent='Annuler';
    }
    list.innerHTML=rows.map(function(r){
      var products=r.products+' produit'+(r.products>1?'s':'');
      var suppliers=r.suppliers+' fournisseur'+(r.suppliers>1?'s':'');
      var cls=r.sheetStatus==='done'?'done':(r.sheetStatus==='partial'?'partial':'pending');
      return '<button type="button" class="product-lot-choice-v174" data-product-lot-v200="'+escapeHtml(String(r.id))+'">'+
        '<span><strong>'+escapeHtml(r.name)+'</strong><span>'+products+' · '+suppliers+(r.current?' · lot actuellement ouvert':'')+'</span><span class="v200-sheet-status '+cls+'">'+escapeHtml(statusText(r))+'</span></span><span style="font-size:18px;color:#4e819d">›</span></button>';
    }).join('');
    list.querySelectorAll('[data-product-lot-v200]').forEach(function(btn){
      btn.onclick=function(){
        var row=rows.find(function(r){return String(r.id)===String(btn.dataset.productLotV200);});
        if(row && row.source==='qrBackup'){
          try{
            var b=JSON.parse(localStorage.getItem('jm_tc_qr_repair_backup_v251')||'null');
            if(b&&b.state){
              state=deepClone(b.state);
              if(typeof upsertPreparedJury==='function')upsertPreparedJury(state);
              localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
              row.current=true;
              row.id=String(state.config&&state.config._preparedId||row.id);
            }
          }catch(e){}
        }
        if(row && typeof openProductLotV174==='function') openProductLotV174(row);
      };
    });
    modal.classList.add('show');
  }

  window.openProductSheetsFromHomeV174=function(){
    var rows=pendingLots();
    if(!rows.length){
      alert('Aucune fiche produit à compléter. Consultez « Fiches terminées » pour les fiches complètes.');
      return;
    }

    var missingCount=rows.reduce(function(sum,row){ return sum+Number(row.sheetMissing||0); },0);

    /* V254 — s'il ne reste qu'une seule fiche, aller directement dessus. */
    if(missingCount===1){
      var row=rows.find(function(r){ return Number(r.sheetMissing||0)>0; })||rows[0];
      if(row && row.source==='qrBackup'){
        try{
          var b=JSON.parse(localStorage.getItem('jm_tc_qr_repair_backup_v251')||'null');
          if(b&&b.state){
            state=deepClone(b.state);
            if(typeof upsertPreparedJury==='function')upsertPreparedJury(state);
            localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
            row.current=true;
            row.id=String(state.config&&state.config._preparedId||row.id);
          }
        }catch(e){}
      }
      if(row && typeof openProductLotV174==='function'){
        openProductLotV174(row);
        return;
      }
    }

    showPicker(rows,'pending');
  };

  window.openProductSheetsDoneFromHomeV200=function(){
    var rows=doneLots();
    if(!rows.length){
      alert('Aucune fiche produit terminée pour le moment.');
      return;
    }
    showPicker(rows,'done');
  };

  window.renderProductSheetHomeBadgesV200=renderBadges;

  function bindButtons(){
    var pending=document.getElementById('homeProductSheetsBtnV174');
    var done=document.getElementById('homeProductSheetsDoneBtnV200');
    if(pending)pending.onclick=function(){window.openProductSheetsFromHomeV174();};
    if(done)done.onclick=function(){window.openProductSheetsDoneFromHomeV200();};
  }

  try{
    if(typeof window.renderHome==='function'){
      var oldRenderHome=window.renderHome;
      window.renderHome=function(){
        var out=oldRenderHome.apply(this,arguments);
        try{ bindButtons(); renderBadges(); }catch(e){}
        return out;
      };
    }
  }catch(e){}

  try{
    if(typeof window.saveProductSheets==='function'){
      var oldSaveProductSheets=window.saveProductSheets;
      window.saveProductSheets=async function(){
        var out=await oldSaveProductSheets.apply(this,arguments);
        try{ renderBadges(); }catch(e){}
        return out;
      };
    }
  }catch(e){}

  bindButtons();
  renderBadges();
  setTimeout(function(){bindButtons();renderBadges();},400);
  setTimeout(function(){bindButtons();renderBadges();},1700);
})();
