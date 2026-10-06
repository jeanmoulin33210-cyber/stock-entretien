(function(){
  "use strict";

  function esc(v){
    if(typeof escapeHtml==="function")return escapeHtml(String(v??""));
    return String(v??"").replace(/[&<>"']/g,function(ch){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[ch];});
  }
  function keyFor(p,sm){
    return String(p&&((p.id||p.name))||"produit")+"__"+String(sm&&((sm.id||sm.supplier))||"echantillon");
  }
  function dataFor(st){
    if(!st.config)st.config={};
    if(!st.config.occenaControl||typeof st.config.occenaControl!=="object"){
      st.config.occenaControl={items:{},globalScore:"",updatedAt:""};
    }
    if(!st.config.occenaControl.items||typeof st.config.occenaControl.items!=="object"){
      st.config.occenaControl.items={};
    }
    if(st.config.occenaControl.globalScore==null)st.config.occenaControl.globalScore="";
    if(!Array.isArray(st.config.occenaControl.customRows))st.config.occenaControl.customRows=[];
    return st.config.occenaControl;
  }
  function rowsFor(st){
    var out=[];
    (st&&st.config&&st.config.products||[]).forEach(function(p){
      (p.samples||[]).forEach(function(sm){
        out.push({
          key:keyFor(p,sm),
          productName:String(p.name||"Article"),
          supplier:String(sm.supplier||"Fournisseur"),
          sampleId:String(sm.id||""),
          custom:false
        });
      });
    });
    var d=dataFor(st);
    (d.customRows||[]).forEach(function(r){
      if(!r||!r.id)return;
      out.push({
        key:"custom__"+String(r.id),
        productName:String(r.productName||"Article ajouté"),
        supplier:String(r.supplier||"Fournisseur"),
        sampleId:String(r.sampleId||""),
        custom:true,
        customId:String(r.id)
      });
    });
    return out;
  }

  function addCustomArticle(){
    var name=prompt("Nom de l’article à ajouter :","");
    name=String(name||"").trim();
    if(!name)return;
    var supplier=prompt("Fournisseur de cet article :","");
    supplier=String(supplier||"").trim();
    if(!supplier)return;
    var d=dataFor(state);
    var id=(typeof uid==="function"?uid("occena"):"occena_"+Date.now()+"_"+Math.random().toString(36).slice(2,8));
    d.customRows.push({id:id,productName:name,supplier:supplier,sampleId:""});
    d.updatedAt=new Date().toISOString();
    if(typeof saveState==="function")saveState();
    render();
    setTimeout(function(){
      var el=document.querySelector('[data-occena-row="custom__'+CSS.escape(String(id))+'"]');
      if(el)el.scrollIntoView({behavior:"smooth",block:"center"});
    },40);
  }

  function deleteCustomArticle(id){
    var d=dataFor(state);
    var row=(d.customRows||[]).find(function(r){return String(r.id)===String(id);});
    var label=row?(row.productName+" · "+row.supplier):"cet article";
    if(!confirm("Supprimer "+label+" du contrôle OCCENA ?"))return;
    d.customRows=(d.customRows||[]).filter(function(r){return String(r.id)!==String(id);});
    delete d.items["custom__"+String(id)];
    d.updatedAt=new Date().toISOString();
    if(typeof saveState==="function")saveState();
    render();
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
    var data=dataFor(st),rows=rowsFor(st),checked=0;
    rows.forEach(function(r){if(complete(data.items[r.key]))checked++;});
    var total=rows.length;
    var required=total?Math.ceil(total*.30):0;
    var pct=total?Math.round(checked/total*1000)/10:0;
    return{checked:checked,total:total,required:required,pct:pct,reached:total>0&&checked>=required};
  }
  function capture(){
    var d=dataFor(state);
    document.querySelectorAll("[data-occena-row]").forEach(function(row){
      var key=row.getAttribute("data-occena-row");
      var rec=d.items[key]&&typeof d.items[key]==="object"?d.items[key]:{};
      rec.initialScore=String(row.querySelector("[data-occena-initial]")?.value||"").trim();
      rec.status=String(row.querySelector("[data-occena-status]")?.value||"pending");
      rec.correctedScore=String(row.querySelector("[data-occena-corrected]")?.value||"").trim();
      rec.observation=String(row.querySelector("[data-occena-observation]")?.value||"").trim();
      rec.checkedAt=complete(rec)?(rec.checkedAt||new Date().toISOString()):"";
      d.items[key]=rec;
    });
    var g=document.getElementById("occenaGlobalScore");
    if(g)d.globalScore=String(g.value||"").trim();
    d.updatedAt=new Date().toISOString();
    return d;
  }
  async function persist(showToast){
    capture();
    if(typeof saveState==="function")saveState();
    var s=document.getElementById("occenaSaveState");
    if(s)s.textContent="✓ Enregistré";
    if(typeof syncDirtyToCloud==="function"){
      try{await syncDirtyToCloud();}catch(e){}
    }
    if(showToast!==false&&typeof toast==="function")toast("Contrôle OCCENA enregistré ✓");
    restoreOccenaPosition();
  }
  var occenaScrollLock={key:"",top:null,y:0};

  function rememberOccenaPosition(el){
    var row=el&&el.closest?el.closest("[data-occena-row]"):null;
    occenaScrollLock.key=row?String(row.getAttribute("data-occena-row")||""):"";
    occenaScrollLock.top=row?row.getBoundingClientRect().top:null;
    occenaScrollLock.y=window.scrollY||window.pageYOffset||0;
  }

  function restoreOccenaPosition(){
    var key=occenaScrollLock.key;
    var top=occenaScrollLock.top;
    var y=occenaScrollLock.y;
    function restore(){
      var row=key?document.querySelector('[data-occena-row="'+CSS.escape(String(key))+'"]'):null;
      if(row&&top!==null){
        var delta=row.getBoundingClientRect().top-top;
        if(Math.abs(delta)>1)window.scrollBy(0,delta);
      }else if(Math.abs((window.scrollY||window.pageYOffset||0)-y)>2){
        window.scrollTo(0,y);
      }
    }
    requestAnimationFrame(restore);
    setTimeout(restore,60);
    setTimeout(restore,180);
  }

  function refreshWithoutRender(){
    var d=dataFor(state);
    var m=metrics(state);
    var badge=document.getElementById("occenaControlState");
    var copy=document.getElementById("occenaProgressCopy");
    var fill=document.getElementById("occenaProgressFill");
    var globalInput=document.getElementById("occenaGlobalScore");

    if(badge){
      badge.textContent=m.reached?"✓ Seuil de 30 % atteint":m.pct+" % contrôlé";
      badge.classList.toggle("done",m.reached);
    }
    if(copy){
      copy.textContent=m.total
        ?m.checked+" article"+(m.checked>1?"s":"")+" contrôlé"+(m.checked>1?"s":"")+" sur "+m.total+" · minimum demandé : "+m.required+"."
        :"Aucun article à contrôler.";
    }
    if(fill)fill.style.width=Math.max(0,Math.min(100,m.pct))+"%";
    if(globalInput){
      globalInput.disabled=!m.reached;
      globalInput.title=m.reached?"Saisie manuelle du score OCCENA global":"Le score global se débloque à partir de 30 % d’articles contrôlés.";
    }

    document.querySelectorAll("[data-occena-row]").forEach(function(row){
      var key=row.getAttribute("data-occena-row");
      var rec=d.items[key]||{};
      var status=String(rec.status||"pending");
      var ok=complete(rec);
      row.classList.toggle("complete",ok);
      var corrected=row.querySelector("[data-occena-corrected]");
      if(corrected)corrected.disabled=status!=="corrige";
      var statusBox=row.querySelector(".occena-row-status");
      if(statusBox){
        var del=statusBox.querySelector("[data-occena-delete]");
        var delHtml=del?del.outerHTML:"";
        statusBox.innerHTML=(ok?"Contrôle validé":"À compléter")+delHtml;
        var newDel=statusBox.querySelector("[data-occena-delete]");
        if(newDel)newDel.onclick=function(){deleteCustomArticle(newDel.getAttribute("data-occena-delete"));};
      }
    });

    if(typeof window.syncOccenaNextStepV291==="function"){
      try{window.syncOccenaNextStepV291();}catch(e){}
    }
  }

  function renderKeepPosition(rowKey){
    var savedY=window.scrollY||window.pageYOffset||0;
    var oldRow=rowKey?document.querySelector('[data-occena-row="'+CSS.escape(String(rowKey))+'"]'):null;
    var oldTop=oldRow?oldRow.getBoundingClientRect().top:null;
    render();
    requestAnimationFrame(function(){
      var nextRow=rowKey?document.querySelector('[data-occena-row="'+CSS.escape(String(rowKey))+'"]'):null;
      if(nextRow&&oldTop!==null){
        var delta=nextRow.getBoundingClientRect().top-oldTop;
        if(Math.abs(delta)>1)window.scrollBy(0,delta);
      }else{
        window.scrollTo(0,savedY);
      }
    });
  }

  function render(){
    var box=document.getElementById("occenaControlContent");
    if(!box||typeof state==="undefined"||!state||!state.config)return;

    var d=dataFor(state),rows=rowsFor(state),m=metrics(state);
    var badge=document.getElementById("occenaControlState");
    var copy=document.getElementById("occenaProgressCopy");
    var fill=document.getElementById("occenaProgressFill");
    var globalInput=document.getElementById("occenaGlobalScore");
    var saveLabel=document.getElementById("occenaSaveState");

    if(badge){
      badge.textContent=m.reached?"✓ Seuil de 30 % atteint":m.pct+" % contrôlé";
      badge.classList.toggle("done",m.reached);
    }
    if(copy){
      copy.textContent=m.total
        ?m.checked+" article"+(m.checked>1?"s":"")+" contrôlé"+(m.checked>1?"s":"")+" sur "+m.total+" · minimum demandé : "+m.required+"."
        :"Aucun article à contrôler.";
    }
    if(fill)fill.style.width=Math.max(0,Math.min(100,m.pct))+"%";
    if(globalInput){
      globalInput.value=String(d.globalScore||"");
      globalInput.disabled=!m.reached;
      globalInput.title=m.reached?"Saisie manuelle du score OCCENA global":"Le score global se débloque à partir de 30 % d’articles contrôlés.";
    }
    if(saveLabel)saveLabel.textContent="Enregistré";

    if(!rows.length){
      box.innerHTML="<div class='occena-empty'>Aucun article / fournisseur dans ce jury.</div>";
      return;
    }

    var groups={};
    rows.forEach(function(r){(groups[r.productName]||(groups[r.productName]=[])).push(r);});

    box.innerHTML=Object.keys(groups).map(function(productName){
      var lines=groups[productName].map(function(r){
        var rec=d.items[r.key]||{};
        var status=String(rec.status||"pending");
        var ok=complete(rec);
        return "<div class='occena-row "+(ok?"complete":"")+"' data-occena-row='"+esc(r.key)+"'>"+
          "<div class='occena-row-id'><strong>"+esc(r.supplier)+"</strong><span>Échantillon "+esc(r.sampleId||"—")+"</span></div>"+
          "<label><span>Score OCCENA initial</span><input type='text' inputmode='decimal' data-occena-initial value='"+esc(String(rec.initialScore==null?"":rec.initialScore))+"' placeholder='Score'></label>"+
          "<label><span>Contrôle</span><select data-occena-status>"+
            "<option value='pending' "+(status==="pending"?"selected":"")+">À contrôler</option>"+
            "<option value='conforme' "+(status==="conforme"?"selected":"")+">✓ Conforme</option>"+
            "<option value='corrige' "+(status==="corrige"?"selected":"")+">✎ Corrigé</option>"+
          "</select></label>"+
          "<label><span>Score corrigé</span><input type='text' inputmode='decimal' data-occena-corrected value='"+esc(String(rec.correctedScore==null?"":rec.correctedScore))+"' placeholder='Nouveau score' "+(status==="corrige"?"":"disabled")+"></label>"+
          "<label class='occena-observation'><span>Correction / observation</span><input type='text' data-occena-observation value='"+esc(String(rec.observation||""))+"' placeholder='Ex. : additif non renseigné'></label>"+
          "<div class='occena-row-status'>"+(ok?"Contrôle validé":"À compléter")+
            (r.custom?"<button type='button' class='occena-delete-custom' data-occena-delete='"+esc(r.customId)+"'>Supprimer</button>":"")+
          "</div>"+
        "</div>";
      }).join("");
      return "<section class='occena-product-block'><h4>"+esc(productName)+"</h4>"+lines+"</section>";
    }).join("")+
    "<div class='occena-add-article-wrap'><button type='button' class='btn btn-secondary' id='occenaAddArticleBtn'>＋ Ajouter un article</button><span>Ajoutez ici un article / fournisseur qui n’est pas déjà dans le jury.</span></div>";

    var addBtn=document.getElementById("occenaAddArticleBtn");
    if(addBtn)addBtn.onclick=addCustomArticle;
    box.querySelectorAll("[data-occena-delete]").forEach(function(btn){
      btn.onclick=function(){deleteCustomArticle(btn.getAttribute("data-occena-delete"));};
    });

    box.querySelectorAll("[data-occena-status]").forEach(function(sel){
      sel.onfocus=function(){rememberOccenaPosition(sel);};
      sel.onpointerdown=function(){rememberOccenaPosition(sel);};
      sel.onchange=function(){
        rememberOccenaPosition(sel);
        capture();
        if(typeof saveState==="function")saveState();
        var row=sel.closest("[data-occena-row]");
        var corrected=row?row.querySelector("[data-occena-corrected]"):null;
        if(corrected)corrected.disabled=String(sel.value||"pending")!=="corrige";
        restoreOccenaPosition();
      };
    });
    box.querySelectorAll("input").forEach(function(inp){
      inp.onfocus=function(){rememberOccenaPosition(inp);};
      inp.onpointerdown=function(){rememberOccenaPosition(inp);};
      inp.oninput=function(){var s=document.getElementById("occenaSaveState");if(s)s.textContent="À enregistrer";};
      inp.onchange=function(){
        rememberOccenaPosition(inp);
        capture();
        if(typeof saveState==="function")saveState();
        restoreOccenaPosition();
      };
    });
    if(globalInput){
      globalInput.oninput=function(){var s=document.getElementById("occenaSaveState");if(s)s.textContent="À enregistrer";};
      globalInput.onchange=function(){capture();if(typeof saveState==="function")saveState();};
    }
  }

  var rawRenderAdmin=typeof renderAdmin==="function"?renderAdmin:null;
  if(rawRenderAdmin){
    renderAdmin=function(){
      rawRenderAdmin();
      setTimeout(render,0);
    };
    window.renderAdmin=renderAdmin;
  }

  function ensureStyle(){
    if(document.getElementById("occenaCustomStyleV290"))return;
    var s=document.createElement("style");
    s.id="occenaCustomStyleV290";
    s.textContent=".occena-control-card,.occena-control-card *{overflow-anchor:none}.occena-add-article-wrap{margin:14px 0 4px;padding:12px;border:1.5px dashed #9fb8c8;border-radius:11px;background:#fff;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.occena-add-article-wrap span{font-size:9px;color:#687e8c}.occena-delete-custom{display:block;margin-top:5px;border:0;background:transparent;color:#a04444;font-size:7.5px;font-weight:800;cursor:pointer;padding:0}.occena-row-status{align-self:center}";
    document.head.appendChild(s);
  }

  function bind(){
    ensureStyle();
    var b=document.getElementById("saveOccenaControlBtn");
    if(b)b.onclick=function(){persist(true);};
    if(document.getElementById("adminView")&&document.getElementById("adminView").classList.contains("active"))render();
  }

  window.renderOccenaControlV290=render;
  window.saveOccenaControlV290=persist;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);
  else bind();
  setTimeout(bind,700);
})();
