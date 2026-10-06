(function(){
  "use strict";
  if(window.__tcV291OccenaNextLoaded)return;
  window.__tcV291OccenaNextLoaded=true;

  function keyFor(p,sm){
    return String(p&&((p.id||p.name))||"produit")+"__"+String(sm&&((sm.id||sm.supplier))||"echantillon");
  }
  function complete(rec){
    if(!rec)return false;
    var status=String(rec.status||"pending");
    var initial=String(rec.initialScore==null?"":rec.initialScore).trim();
    var corrected=String(rec.correctedScore==null?"":rec.correctedScore).trim();
    if(status==="conforme")return !!initial;
    if(status==="corrige")return !!initial&&!!corrected;
    return false;
  }
  function metrics(st){
    var cfg=st&&st.config||{};
    var d=cfg.occenaControl&&typeof cfg.occenaControl==="object"?cfg.occenaControl:{items:{},customRows:[]};
    var items=d.items&&typeof d.items==="object"?d.items:{};
    var rows=[];
    (cfg.products||[]).forEach(function(p){
      (p.samples||[]).forEach(function(sm){
        rows.push({key:keyFor(p,sm),supplier:String(sm.supplier||"Fournisseur")});
      });
    });
    (Array.isArray(d.customRows)?d.customRows:[]).forEach(function(r){
      if(r&&r.id)rows.push({key:"custom__"+String(r.id),supplier:String(r.supplier||"Fournisseur")});
    });
    var bySupplier={};
    rows.forEach(function(r){
      if(!bySupplier[r.supplier])bySupplier[r.supplier]={supplier:r.supplier,checked:0};
      if(complete(items[r.key]))bySupplier[r.supplier].checked++;
    });
    var suppliers=Object.keys(bySupplier).map(function(k){return bySupplier[k];});
    var required=suppliers.length*5;
    var credited=suppliers.reduce(function(n,x){return n+Math.min(x.checked,5);},0);
    return {
      checked:credited,
      total:rows.length,
      required:required,
      suppliers:suppliers,
      reached:suppliers.length>0&&suppliers.every(function(x){return x.checked>=5;})
    };
  }
  function highlight(btn){
    if(!btn)return;
    btn.classList.remove("btn-secondary");
    btn.classList.add("btn-primary","simple-results-next-btn");
  }
  function removeHighlight(btn){
    if(!btn)return;
    btn.classList.remove("btn-primary","simple-results-next-btn");
    btn.classList.add("btn-secondary");
  }
  function workflowReady(){
    var closed=typeof isJuryClosed==="function"?!!isJuryClosed():false;
    var closureReady=typeof closureIsReady==="function"?!!closureIsReady():false;
    var ps=typeof productSheetsProgress==="function"?productSheetsProgress(state):{total:0,filled:0};
    var sheetsReady=Number(ps.total||0)>0&&Number(ps.filled||0)===Number(ps.total||0);
    return {closed:closed,closureReady:closureReady,sheetsReady:sheetsReady};
  }
  function ensureButton(){
    var box=document.querySelector(".simple-results-action-buttons");
    if(!box)return null;
    var btn=document.getElementById("simpleResultsOccenaBtn");
    if(!btn){
      btn=document.createElement("button");
      btn.type="button";
      btn.className="btn btn-secondary";
      btn.id="simpleResultsOccenaBtn";
      var report=document.getElementById("simpleResultsPdfBtn");
      if(report)box.insertBefore(btn,report);
      else box.appendChild(btn);
    }
    if(!btn.__v291Bound){
      btn.__v291Bound=true;
      btn.onclick=function(){
        if(typeof showView==="function")showView("occenaView");
        var title=document.getElementById("headerTitle");
        var sub=document.getElementById("headerSub");
        if(title)title.textContent="Contrôle OCCENA";
        if(sub)sub.textContent=(typeof state!=="undefined"&&state&&state.config)?(state.config.lotName||"Jury Marchés"):"Jury Marchés";
        try{if(typeof window.renderOccenaControlV290==="function")window.renderOccenaControlV290();}catch(e){}
        if(window.matchMedia&&window.matchMedia("(max-width: 820px)").matches&&typeof window.openOccenaPhoneModeV300==="function"){
          window.openOccenaPhoneModeV300();
        }
      };
    }
    return btn;
  }
  function ensureStyle(){
    if(document.getElementById("occenaNextStyleV291"))return;
    var s=document.createElement("style");
    s.id="occenaNextStyleV291";
    s.textContent=".occena-control-card.occena-focus-v291{outline:3px solid rgba(13,99,143,.26);outline-offset:4px;transition:outline-color .35s ease}.occena-control-card.occena-complete-v304{border:2px solid #48a77a!important;background:#f1fbf6!important;box-shadow:0 0 0 3px rgba(72,167,122,.10)}.occena-control-card.occena-complete-v304 .occena-control-head strong{color:#176b4d}.occena-control-card.occena-complete-v304 .occena-progress-bar span{background:#48a77a!important}.simple-results-action-buttons .occena-step-complete-v304{display:inline-flex!important;background:#e8f6ef!important;border-color:#58a982!important;color:#176b4d!important;font-weight:850!important;box-shadow:0 0 0 2px rgba(72,167,122,.08)!important}";
    document.head.appendChild(s);
  }
  function ensureReceptionButtonV306(){
    var box=document.querySelector(".simple-results-action-buttons");
    if(!box)return null;
    var btn=document.getElementById("simpleResultsReceptionBtn");
    if(!btn){
      btn=document.createElement("button");
      btn.type="button";
      btn.className="btn btn-secondary";
      btn.id="simpleResultsReceptionBtn";
      var sheets=document.getElementById("productSheetsBtn");
      if(sheets)box.insertBefore(btn,sheets);
      else box.appendChild(btn);
    }
    if(!btn.__v306Bound){
      btn.__v306Bound=true;
      btn.onclick=function(){
        try{
          if(typeof draftConfig!=="undefined")draftConfig=null;
          var cfg=(typeof state!=="undefined"&&state)?state.config:null;
          if(!cfg)return;
          var rs=(typeof receptionStatusForConfig==="function")?receptionStatusForConfig(cfg):{key:"pending"};
          if(rs.key==="done"&&typeof latestValidatedReceptionIndex==="function"&&typeof openReceptionView==="function"){
            var idx=latestValidatedReceptionIndex(cfg);
            if(idx>=0){openReceptionView(idx);return;}
          }
          if(typeof openReceptionView==="function")openReceptionView(-1);
        }catch(e){}
      };
    }
    return btn;
  }

  function ensureConclusionButtonV307(){
    var box=document.querySelector(".simple-results-action-buttons");
    if(!box)return null;
    var btn=document.getElementById("simpleResultsConclusionBtn");
    if(!btn){
      btn=document.createElement("button");
      btn.type="button";
      btn.className="btn btn-secondary";
      btn.id="simpleResultsConclusionBtn";
      var occena=document.getElementById("simpleResultsOccenaBtn");
      if(occena)box.insertBefore(btn,occena);
      else box.appendChild(btn);
    }
    if(!btn.__v307Bound){
      btn.__v307Bound=true;
      btn.onclick=function(){
        if(typeof showView==="function"){
          showView("juryReportView");
          try{if(typeof loadJuryConclusionIntoForm==="function")loadJuryConclusionIntoForm();}catch(e){}
          try{if(typeof loadReportNoteIntoForm==="function")loadReportNoteIntoForm();}catch(e){}
          var title=document.getElementById("headerTitle");
          var sub=document.getElementById("headerSub");
          if(title)title.textContent="Conclusion / rapport jury";
          if(sub)sub.textContent=(typeof state!=="undefined"&&state&&state.config)?(state.config.lotName||"Jury Marchés"):"Jury Marchés";
        }
      };
    }
    return btn;
  }

  function updateConclusionStateV307(){
    if(typeof state==="undefined"||!state||!state.config)return;
    var btn=ensureConclusionButtonV307();
    if(!btn)return;
    var done=String(state.config.juryConclusion||"").trim().length>0;
    btn.style.display="";
    btn.disabled=false;
    btn.classList.remove("btn-primary","simple-results-next-btn");
    btn.classList.add("btn-secondary");
    btn.classList.toggle("occena-step-complete-v304",done);
    btn.textContent=done
      ?"✓ Conclusion / rapport jury — OK"
      :"📝 Conclusion / rapport jury";
  }

  function updateReceptionAndProductStatesV306(){
    if(typeof state==="undefined"||!state||!state.config)return;

    var receptionBtn=ensureReceptionButtonV306();
    var sheetsBtn=document.getElementById("productSheetsBtn");

    var rs={key:"pending",done:0,total:0};
    try{
      if(typeof receptionStatusForConfig==="function")rs=receptionStatusForConfig(state.config)||rs;
    }catch(e){}
    var receptionDone=rs.key==="done"&&Number(rs.done||0)>0;

    if(receptionBtn){
      receptionBtn.style.display="";
      receptionBtn.disabled=false;
      receptionBtn.classList.remove("btn-primary","simple-results-next-btn");
      receptionBtn.classList.add("btn-secondary");
      receptionBtn.classList.toggle("occena-step-complete-v304",receptionDone);
      receptionBtn.textContent=receptionDone
        ?"✓ Réceptions marchandises — OK"
        :("📦 Réceptions marchandises"+(Number(rs.total||0)>0?" ("+Number(rs.done||0)+"/"+Number(rs.total||0)+")":""));
    }

    var ps={total:0,filled:0};
    try{
      if(typeof productSheetsProgress==="function")ps=productSheetsProgress(state)||ps;
    }catch(e){}
    var sheetsDone=Number(ps.total||0)>0&&Number(ps.filled||0)===Number(ps.total||0);

    if(sheetsBtn){
      sheetsBtn.style.display="";
      sheetsBtn.classList.toggle("occena-step-complete-v304",sheetsDone);
      sheetsBtn.textContent=sheetsDone
        ?"✓ 2. Fiches produits — OK"
        :("📋 2. Fiches produits"+(Number(ps.total||0)>0?" ("+Number(ps.filled||0)+"/"+Number(ps.total||0)+")":""));
    }
  }

  function apply(){
    if(typeof state==="undefined"||!state||!state.config)return;
    ensureStyle();
    var btn=ensureButton();
    if(!btn)return;
    var report=document.getElementById("simpleResultsPdfBtn");
    var title=document.getElementById("simpleResultsNextTitle");
    var hint=document.getElementById("simpleResultsHint");
    var m=metrics(state);
    var wf=workflowReady();
    updateReceptionAndProductStatesV306();
    updateConclusionStateV307();

    var card=document.getElementById("occenaControlCard");
    if(card)card.classList.toggle("occena-complete-v304",m.reached);

    if(m.reached){
      /* V304 — l'étape OCCENA reste visible une fois terminée.
         Elle passe en vert au lieu de disparaître. */
      btn.style.display="";
      btn.disabled=false;
      removeHighlight(btn);
      btn.classList.add("occena-step-complete-v304");
      btn.textContent="✓ 3. Contrôle OCCENA — OK";
      if(report)report.textContent="📚 4. Dossier résultats";
      if(wf.closed&&wf.closureReady&&wf.sheetsReady){
        highlight(report);
        if(title)title.textContent="👉 À faire maintenant : dossier résultats";
        if(hint)hint.textContent="✓ Contrôle OCCENA terminé : 5 fiches validées par fournisseur. Vous pouvez maintenant ouvrir le dossier résultats.";
      }
    }else{
      btn.classList.remove("occena-step-complete-v304");
      btn.style.display="";
      btn.disabled=false;
      btn.textContent=m.required
        ?"🔎 3. Contrôle OCCENA ("+m.checked+"/"+m.required+" fiches)"
        :"🔎 3. Contrôle OCCENA";
      if(report)report.textContent="📚 4. Dossier résultats";
      if(wf.closed&&wf.closureReady&&wf.sheetsReady){
        removeHighlight(report);
        highlight(btn);
        if(title)title.textContent="👉 À faire maintenant : contrôle OCCENA";
        if(hint)hint.textContent=m.required
          ?"Validez 5 fiches pour chacun des "+m.suppliers.length+" fournisseur"+(m.suppliers.length>1?"s":"")+". Le dossier résultats deviendra ensuite l’étape suivante."
          :"Ajoutez les articles / fournisseurs à contrôler dans OCCENA.";
      }
    }
  }

  var rawSync=typeof syncSimpleResultsActions==="function"?syncSimpleResultsActions:null;
  if(rawSync){
    var wrapped=function(){
      rawSync();
      apply();
    };
    syncSimpleResultsActions=wrapped;
    window.syncSimpleResultsActions=wrapped;
  }

  function bind(){
    ensureStyle();
    ensureButton();
    ensureReceptionButtonV306();
    ensureConclusionButtonV307();
    apply();
    var badge=document.getElementById("occenaControlState");
    if(badge&&!badge.__v291Observed){
      badge.__v291Observed=true;
      new MutationObserver(function(){apply();}).observe(badge,{childList:true,subtree:true,characterData:true});
    }
    var save=document.getElementById("saveOccenaControlBtn");
    if(save&&!save.__v291Bound){
      save.__v291Bound=true;
      save.addEventListener("click",function(){setTimeout(apply,80);});
    }
    var conclusionSave=document.getElementById("saveJuryConclusionBtn");
    if(conclusionSave&&!conclusionSave.__v307Bound){
      conclusionSave.__v307Bound=true;
      conclusionSave.addEventListener("click",function(){setTimeout(apply,80);});
    }
    var conclusionClear=document.getElementById("clearJuryConclusionBtn");
    if(conclusionClear&&!conclusionClear.__v307Bound){
      conclusionClear.__v307Bound=true;
      conclusionClear.addEventListener("click",function(){setTimeout(apply,80);});
    }
    var reportBack=document.getElementById("juryReportBackBtn");
    if(reportBack&&!reportBack.__v308Bound){
      reportBack.__v308Bound=true;
      reportBack.onclick=function(){
        if(typeof openSimplifiedResults==="function")openSimplifiedResults();
        else if(typeof renderAdmin==="function")renderAdmin();
      };
    }
    var occenaBack=document.getElementById("occenaBackBtnV308");
    if(occenaBack&&!occenaBack.__v308Bound){
      occenaBack.__v308Bound=true;
      occenaBack.onclick=function(){
        if(typeof openSimplifiedResults==="function")openSimplifiedResults();
        else if(typeof renderAdmin==="function")renderAdmin();
      };
    }
  }

  window.syncOccenaNextStepV291=apply;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);
  else bind();
  setTimeout(bind,500);
  setTimeout(apply,1200);
})();