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
        if(window.matchMedia&&window.matchMedia("(max-width: 820px)").matches&&typeof window.openOccenaPhoneModeV300==="function"){
          window.openOccenaPhoneModeV300();
          return;
        }
        var card=document.getElementById("occenaControlCard");
        if(!card)return;
        card.scrollIntoView({behavior:"smooth",block:"start"});
        card.classList.add("occena-focus-v291");
        setTimeout(function(){card.classList.remove("occena-focus-v291");},1400);
      };
    }
    return btn;
  }
  function ensureStyle(){
    if(document.getElementById("occenaNextStyleV291"))return;
    var s=document.createElement("style");
    s.id="occenaNextStyleV291";
    s.textContent=".occena-control-card.occena-focus-v291{outline:3px solid rgba(13,99,143,.26);outline-offset:4px;transition:outline-color .35s ease}.occena-control-card.occena-complete-v304{border:2px solid #48a77a!important;background:#f1fbf6!important;box-shadow:0 0 0 3px rgba(72,167,122,.10)}.occena-control-card.occena-complete-v304 .occena-control-head strong{color:#176b4d}.occena-control-card.occena-complete-v304 .occena-progress-bar span{background:#48a77a!important}#simpleResultsOccenaBtn.occena-step-complete-v304{display:inline-flex!important;background:#e8f6ef!important;border-color:#58a982!important;color:#176b4d!important;font-weight:850!important}";
    document.head.appendChild(s);
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
  }

  window.syncOccenaNextStepV291=apply;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);
  else bind();
  setTimeout(bind,500);
  setTimeout(apply,1200);
})();