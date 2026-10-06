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
    var data=dataFor(st),rows=rowsFor(st),bySupplier={};
    rows.forEach(function(r){
      var supplier=String(r.supplier||"Fournisseur");
      if(!bySupplier[supplier])bySupplier[supplier]={supplier:supplier,checked:0,total:0,target:5};
      bySupplier[supplier].total++;
      if(complete(data.items[r.key]))bySupplier[supplier].checked++;
    });
    var suppliers=Object.keys(bySupplier).sort(function(a,b){return a.localeCompare(b,"fr");}).map(function(k){return bySupplier[k];});
    var checked=rows.filter(function(r){return complete(data.items[r.key]);}).length;
    var required=suppliers.length*5;
    var credited=suppliers.reduce(function(n,x){return n+Math.min(x.checked,5);},0);
    var pct=required?Math.round(credited/required*1000)/10:0;
    var reached=suppliers.length>0&&suppliers.every(function(x){return x.checked>=5;});
    return{checked:checked,total:rows.length,required:required,credited:credited,pct:pct,reached:reached,suppliers:suppliers};
  }
  function capture(){
    var d=dataFor(state);
    document.querySelectorAll("[data-occena-row]").forEach(function(row){
      var key=row.getAttribute("data-occena-row");
      var rec=d.items[key]&&typeof d.items[key]==="object"?d.items[key]:{};
      rec.initialScore=String(row.querySelector("[data-occena-initial]")?.value||"").trim();
      var statusEl=row.querySelector("[data-occena-status]");
      rec.status=String(statusEl?(statusEl.value||statusEl.getAttribute("data-value")||"pending"):"pending");
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
  var occenaScrollLock={key:"",top:null,y:0,token:0};

  function rememberOccenaPosition(el){
    var row=el&&el.closest?el.closest("[data-occena-row]"):null;
    occenaScrollLock.key=row?String(row.getAttribute("data-occena-row")||""):"";
    occenaScrollLock.top=row?row.getBoundingClientRect().top:null;
    occenaScrollLock.y=window.scrollY||window.pageYOffset||0;
    occenaScrollLock.token++;
  }

  function restoreOccenaPosition(){
    var token=occenaScrollLock.token;
    var y=occenaScrollLock.y;
    var key=occenaScrollLock.key;
    var wantedTop=occenaScrollLock.top;

    /* V298 — restauration par ancre de ligne.
       Même si Android replace la page à 0 avant le clic, on retrouve la ligne
       OCCENA et on la remet exactement à la hauteur où elle était sous le doigt. */
    function restore(){
      if(token!==occenaScrollLock.token)return;

      var row=null;
      if(key){
        try{row=document.querySelector('[data-occena-row="'+CSS.escape(String(key))+'"]');}catch(e){}
      }

      if(row&&wantedTop!==null){
        var currentTop=row.getBoundingClientRect().top;
        var delta=currentTop-wantedTop;
        if(Math.abs(delta)>2){
          window.scrollBy(0,delta);
          return;
        }
      }

      var current=window.scrollY||window.pageYOffset||0;
      if(Math.abs(current-y)>2)window.scrollTo(0,y);
    }

    requestAnimationFrame(restore);
    setTimeout(restore,20);
    setTimeout(restore,60);
    setTimeout(restore,140);
    setTimeout(restore,300);
    setTimeout(restore,650);
  }

  function refreshWithoutRender(){
    var d=dataFor(state);
    var m=metrics(state);
    var badge=document.getElementById("occenaControlState");
    var copy=document.getElementById("occenaProgressCopy");
    var fill=document.getElementById("occenaProgressFill");
    var globalInput=document.getElementById("occenaGlobalScore");

    if(badge){
      badge.textContent=m.reached?"✓ 5 fiches par fournisseur":"Contrôle en cours";
      badge.classList.toggle("done",m.reached);
    }
    if(copy){
      copy.textContent=m.suppliers&&m.suppliers.length
        ?m.suppliers.map(function(x){return x.supplier+" "+Math.min(x.checked,5)+"/5";}).join(" · ")
        :"Aucun fournisseur à contrôler.";
    }
    if(fill)fill.style.width=Math.max(0,Math.min(100,m.pct))+"%";
    if(globalInput){
      globalInput.disabled=!m.reached;
      globalInput.title=m.reached?"Saisie manuelle du score OCCENA global":"Le score global se débloque lorsque chaque fournisseur possède 5 fiches contrôlées.";
    }

    document.querySelectorAll("[data-occena-row]").forEach(function(row){
      var key=row.getAttribute("data-occena-row");
      var rec=d.items[key]||{};
      var status=String(rec.status||"pending");
      var ok=complete(rec);
      row.classList.toggle("complete",ok);
      var corrected=row.querySelector("[data-occena-corrected]");
      if(corrected)corrected.disabled=status!=="corrige";
      var statusGroup=row.querySelector("[data-occena-status]");
      if(statusGroup){
        statusGroup.setAttribute("data-value",status);
        statusGroup.querySelectorAll("[data-occena-status-value]").forEach(function(b){
          b.classList.toggle("active",String(b.getAttribute("data-occena-status-value")||"")===status);
        });
      }
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
      badge.textContent=m.reached?"✓ 5 fiches par fournisseur":"Contrôle en cours";
      badge.classList.toggle("done",m.reached);
    }
    if(copy){
      copy.textContent=m.suppliers&&m.suppliers.length
        ?m.suppliers.map(function(x){return x.supplier+" "+Math.min(x.checked,5)+"/5";}).join(" · ")
        :"Aucun fournisseur à contrôler.";
    }
    if(fill)fill.style.width=Math.max(0,Math.min(100,m.pct))+"%";
    if(globalInput){
      globalInput.value=String(d.globalScore||"");
      globalInput.disabled=!m.reached;
      globalInput.title=m.reached?"Saisie manuelle du score OCCENA global":"Le score global se débloque lorsque chaque fournisseur possède 5 fiches contrôlées.";
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
          "<div class='occena-status-field'><span>Contrôle</span><div class='occena-status-buttons' data-occena-status data-value='"+esc(status)+"'>"+
            "<button type='button' data-occena-status-value='pending' class='"+(status==="pending"?"active":"")+"'>À contrôler</button>"+
            "<button type='button' data-occena-status-value='conforme' class='"+(status==="conforme"?"active":"")+"'>✓ Conforme</button>"+
            "<button type='button' data-occena-status-value='corrige' class='"+(status==="corrige"?"active":"")+"'>✎ Corrigé</button>"+
          "</div></div>"+
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

    box.querySelectorAll("[data-occena-status-value]").forEach(function(btn){
      btn.onpointerdown=function(){rememberOccenaPosition(btn);};
      btn.setAttribute("tabindex","-1");
      btn.onclick=function(e){
        if(e&&typeof e.preventDefault==="function")e.preventDefault();

        /* La position a été mémorisée au pointerdown, avant tout déplacement
           éventuel du navigateur. Ne jamais la réécrire ici. */
        var group=btn.closest("[data-occena-status]");
        var row=btn.closest("[data-occena-row]");
        var value=String(btn.getAttribute("data-occena-status-value")||"pending");
        if(group){
          group.setAttribute("data-value",value);
          group.querySelectorAll("[data-occena-status-value]").forEach(function(b){
            b.classList.toggle("active",b===btn);
          });
        }

        capture();
        if(typeof saveState==="function")saveState();
        refreshWithoutRender();

        var corrected=row?row.querySelector("[data-occena-corrected]"):null;
        if(corrected)corrected.disabled=value!=="corrige";

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
    s.textContent=".occena-control-card,.occena-control-card *{overflow-anchor:none}.occena-add-article-wrap{margin:14px 0 4px;padding:12px;border:1.5px dashed #9fb8c8;border-radius:11px;background:#fff;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.occena-add-article-wrap span{font-size:9px;color:#687e8c}.occena-delete-custom{display:block;margin-top:5px;border:0;background:transparent;color:#a04444;font-size:7.5px;font-weight:800;cursor:pointer;padding:0}.occena-row-status{align-self:center}.occena-status-field{display:flex;flex-direction:column;gap:6px}.occena-status-field>span{font-size:9px;font-weight:800;color:#526777}.occena-status-buttons{display:flex;gap:5px;flex-wrap:wrap}.occena-status-buttons button{border:1px solid #b8c8d2;background:#fff;color:#355366;border-radius:8px;padding:8px 9px;font:800 9px Arial,sans-serif;cursor:pointer;touch-action:manipulation}.occena-status-buttons button.active{background:#173f5c;color:#fff;border-color:#173f5c}.occena-status-buttons button:focus{outline:2px solid rgba(23,63,92,.22);outline-offset:1px}";
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
