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
    var keys=[];
    (cfg.products||[]).forEach(function(p){
      (p.samples||[]).forEach(function(sm){keys.push(keyFor(p,sm));});
    });
    (Array.isArray(d.customRows)?d.customRows:[]).forEach(function(r){
      if(r&&r.id)keys.push("custom__"+String(r.id));
    });
    var checked=keys.filter(function(k){return complete(items[k]);}).length;
    var total=keys.length;
    var required=total?Math.ceil(total*.30):0;
    return {
      checked:checked,
      total:total,
      required:required,
      reached:total>0&&checked>=required
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
    s.textContent=".occena-control-card.occena-focus-v291{outline:3px solid rgba(13,99,143,.26);outline-offset:4px;transition:outline-color .35s ease}";
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

    if(m.reached){
      btn.style.display="none";
      btn.disabled=false;
      if(report)report.textContent="📚 3. Dossier résultats";
      if(wf.closed&&wf.closureReady&&wf.sheetsReady){
        removeHighlight(btn);
        highlight(report);
        if(title)title.textContent="👉 À faire maintenant : dossier résultats";
        if(hint)hint.textContent="Le contrôle OCCENA a atteint le seuil de 30 %. Vous pouvez maintenant ouvrir le dossier résultats.";
      }
    }else{
      btn.style.display="";
      btn.disabled=false;
      btn.textContent=m.total
        ?"🔎 3. Contrôle OCCENA ("+m.checked+"/"+m.required+" min.)"
        :"🔎 3. Contrôle OCCENA";
      if(report)report.textContent="📚 4. Dossier résultats";
      if(wf.closed&&wf.closureReady&&wf.sheetsReady){
        removeHighlight(report);
        highlight(btn);
        if(title)title.textContent="👉 À faire maintenant : contrôle OCCENA";
        if(hint)hint.textContent=m.total
          ?"Contrôlez au moins "+m.required+" article"+(m.required>1?"s":"")+" sur "+m.total+" pour atteindre les 30 %, puis le dossier résultats deviendra l’étape suivante."
          :"Ajoutez les articles à contrôler dans OCCENA.";
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