/* v252 : compteurs fiches limités aux lots actifs (hors jurys fermés / archivés) */
(function(){
  function sheetLots(){
    if(localStorage.getItem('jm_tc_lots_clean_mode_v252'))return [];
    try{ if(typeof ensureCurrentPrepSaved==='function') ensureCurrentPrepSaved(); }catch(e){}

    /* v252 — même périmètre que « Réception chauffeur » :
       uniquement les lots encore actifs. Les anciens jurys fermés / archivés
       ne doivent plus gonfler le compteur « Fiches à compléter ». */
    var prepared=(typeof loadPreparedJurys==='function') ? loadPreparedJurys() : [];
    var active=[];

    if(typeof allReceptionLots==='function'){
      try{ active=allReceptionLots()||[]; }catch(e){ active=[]; }
    }

    /* Repli de sécurité si le moteur Réception n'est pas disponible. */
    if(!active.length){
      var base=(typeof productLotsV174==='function') ? productLotsV174() : [];
      active=base.filter(function(row){
        var st=null;
        if(row.current) st=state;
        else {
          var rec=prepared.find(function(x){ return String(x && x.id)===String(row.id); });
          st=rec && rec.state;
        }
        var cfg=st && st.config;
        return !!(cfg && cfg.products && cfg.products.length && !(cfg.juryClose&&cfg.juryClose.closedAt) && !(cfg._archive&&cfg._archive.archivedAt));
      }).map(function(row){
        return {
          id:row.id,
          kind:row.current?'current':'prepared',
          lotName:row.name,
          products:row.products,
          suppliers:new Array(Number(row.suppliers||0))
        };
      });
    }

    return active.map(function(item){
      var isCurrent=item.kind==='current' || String(item.id)===String(state&&state.config&&state.config._preparedId||'__current__');
      var st=null;
      if(isCurrent) st=state;
      else {
        var rec=prepared.find(function(x){ return String(x && x.id)===String(item.id); });
        st=rec && rec.state;
      }
      if(!st || !st.config || !Array.isArray(st.config.products) || !st.config.products.length) return null;

      var prog={total:0,filled:0};
      try{ if(typeof productSheetsProgress==='function') prog=productSheetsProgress(st); }catch(e){}
      var key=(prog.total>0 && prog.filled>=prog.total) ? 'done' : (prog.filled>0 ? 'partial' : 'pending');
      var supplierCount=Array.isArray(item.suppliers) ? item.suppliers.length : Number(item.suppliers||0);
      var firstIssue=null;
      try{
        var validation=(typeof productSheetsValidation==='function') ? productSheetsValidation(st) : null;
        firstIssue=validation&&validation.issues&&validation.issues.length ? validation.issues[0] : null;
      }catch(e){}

      return {
        id:String(item.id),
        current:isCurrent,
        name:item.lotName||st.config.lotName||'Lot préparé',
        products:Number(item.products||st.config.products.length||0),
        suppliers:supplierCount,
        sheetTotal:Number(prog.total||0),
        sheetFilled:Number(prog.filled||0),
        sheetMissing:Math.max(0,Number(prog.total||0)-Number(prog.filled||0)),
        firstProductId:firstIssue?String(firstIssue.productId||''):'',
        firstSampleId:firstIssue?String(firstIssue.sampleId||''):'',
        sheetStatus:key
      };
    }).filter(Boolean);
  }

  function pendingLots(){ return sheetLots().filter(function(x){ return x.sheetStatus!=='done'; }); }
  function doneLots(){ return sheetLots().filter(function(x){ return x.sheetStatus==='done'; }); }

  function renderBadges(){
    var pending=pendingLots(), done=doneLots();
    var missingCount=pending.reduce(function(sum,row){ return sum+Number(row.sheetMissing||0); },0);
    var doneCount=done.reduce(function(sum,row){ return sum+Number(row.sheetFilled||0); },0);
    var a=document.getElementById('homeProductSheetsPendingBadgeV252');
    var b=document.getElementById('homeProductSheetsDoneBadgeV252');
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
    if(row.sheetFilled>0) return row.sheetFilled+'/'+row.sheetTotal+' fiches complètes';
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
        var row=rows.find(function(r){return String(r.id)===String(btn.dataset.productLotV252);});
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

    /* V252 — s'il ne reste qu'une seule fiche, aller directement dessus. */
    if(missingCount===1){
      var row=rows.find(function(r){ return Number(r.sheetMissing||0)>0; })||rows[0];
      if(row && typeof openProductLotV174==='function'){
        openProductLotV174(row);
        return;
      }
    }

    showPicker(rows,'pending');
  };

  window.openProductSheetsDoneFromHomeV252=function(){
    var rows=doneLots();
    if(!rows.length){
      alert('Aucune fiche produit terminée pour le moment.');
      return;
    }
    showPicker(rows,'done');
  };

  window.renderProductSheetHomeBadgesV252=renderBadges;

  function bindButtons(){
    var pending=document.getElementById('homeProductSheetsBtnV174');
    var done=document.getElementById('homeProductSheetsDoneBtnV252');
    if(pending)pending.onclick=function(){window.openProductSheetsFromHomeV174();};
    if(done)done.onclick=function(){window.openProductSheetsDoneFromHomeV252();};
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
