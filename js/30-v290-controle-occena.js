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
    ensurePhoneModeButton();

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


  /* V301 — mode téléphone OCCENA plein écran.
     La page Résultats est figée pendant la saisie : aucune remontée de page
     ne peut obliger l'utilisateur à redescendre dans une longue liste. */
  var occenaPhoneIndex=0;
  var occenaPhoneScrollY=0;

  function occenaPhoneRows(){
    var rows=rowsFor(state).slice();

    function norm(v){
      return String(v||"")
        .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
        .toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
    }
    function supplierPriority(name){
      var n=norm(name);
      /* Ordre demandé pour le contrôle téléphone :
         1. PASSIONFROID
         2. BERTRAND (quel que soit le préfixe exact saisi)
         3. autres fournisseurs */
      if(n.indexOf("passionfroid")>=0 || (n.indexOf("passion")>=0&&n.indexOf("froid")>=0))return 0;
      if(n.indexOf("bertrand")>=0)return 1;
      return 10;
    }

    rows.forEach(function(r,i){r.__phoneOrder=i;});
    rows.sort(function(a,b){
      var pa=supplierPriority(a.supplier),pb=supplierPriority(b.supplier);
      if(pa!==pb)return pa-pb;
      var sa=norm(a.supplier),sb=norm(b.supplier);
      if(sa!==sb)return sa.localeCompare(sb,"fr");
      return a.__phoneOrder-b.__phoneOrder;
    });
    rows.forEach(function(r){delete r.__phoneOrder;});
    return rows;
  }

  function ensureOccenaPhoneOverlay(){
    var modal=document.getElementById("occenaPhoneModalV300");
    if(modal)return modal;

    modal=document.createElement("div");
    modal.id="occenaPhoneModalV300";
    modal.className="occena-phone-modal-v300";
    modal.innerHTML=
      "<div class='occena-phone-shell-v300'>"+
        "<div class='occena-phone-head-v300'>"+
          "<div><strong>Contrôle OCCENA</strong><span id='occenaPhoneProgressV300'>Fiche 1/1</span></div>"+
          "<button type='button' id='occenaPhoneCloseV300'>✕</button>"+
        "</div>"+
        "<div class='occena-phone-summary-v300' id='occenaPhoneSummaryV300'></div>"+
        "<div class='occena-phone-tools-v301'><button type='button' id='occenaPhoneAddSheetV301'>＋ Ajouter une fiche</button></div>"+
        "<div class='occena-phone-card-v300' id='occenaPhoneCardV300'></div>"+
        "<div class='occena-phone-nav-v300'>"+
          "<button type='button' id='occenaPhonePrevV300'>← Précédent</button>"+
          "<button type='button' id='occenaPhoneNextV300'>Suivant →</button>"+
        "</div>"+
      "</div>";
    document.body.appendChild(modal);

    document.getElementById("occenaPhoneCloseV300").onclick=closeOccenaPhoneMode;
    document.getElementById("occenaPhoneAddSheetV301").onclick=addOccenaPhoneSheetV301;
    document.getElementById("occenaPhonePrevV300").onclick=function(){
      saveOccenaPhoneCard();
      if(occenaPhoneIndex>0)occenaPhoneIndex--;
      renderOccenaPhoneCard();
    };
    document.getElementById("occenaPhoneNextV300").onclick=function(){
      saveOccenaPhoneCard();
      var rows=occenaPhoneRows();
      if(occenaPhoneIndex<rows.length-1)occenaPhoneIndex++;
      renderOccenaPhoneCard();
    };
    return modal;
  }

  function findFirstOccenaIncompleteIndex(rows,d){
    for(var i=0;i<rows.length;i++){
      if(!complete(d.items[rows[i].key]))return i;
    }
    return 0;
  }

  function openOccenaPhoneMode(startKey){
    if(typeof state==="undefined"||!state||!state.config)return;
    var rows=occenaPhoneRows();
    if(!rows.length){
      if(typeof toast==="function")toast("Aucune fiche OCCENA à contrôler.");
      return;
    }

    var d=dataFor(state);
    var byKey=startKey?rows.findIndex(function(r){return String(r.key)===String(startKey);}):-1;
    occenaPhoneIndex=byKey>=0?byKey:findFirstOccenaIncompleteIndex(rows,d);

    occenaPhoneScrollY=window.scrollY||window.pageYOffset||0;
    document.documentElement.classList.add("occena-phone-open-v300");
    document.body.classList.add("occena-phone-open-v300");
    document.body.style.position="fixed";
    document.body.style.top=(-occenaPhoneScrollY)+"px";
    document.body.style.left="0";
    document.body.style.right="0";
    document.body.style.width="100%";

    var modal=ensureOccenaPhoneOverlay();
    modal.classList.add("open");
    renderOccenaPhoneCard();
  }

  function closeOccenaPhoneMode(){
    saveOccenaPhoneCard();
    var modal=document.getElementById("occenaPhoneModalV300");
    if(modal)modal.classList.remove("open");

    document.documentElement.classList.remove("occena-phone-open-v300");
    document.body.classList.remove("occena-phone-open-v300");
    document.body.style.position="";
    document.body.style.top="";
    document.body.style.left="";
    document.body.style.right="";
    document.body.style.width="";
    window.scrollTo(0,occenaPhoneScrollY);

    refreshWithoutRender();
  }

  function saveOccenaPhoneCard(){
    var card=document.getElementById("occenaPhoneCardV300");
    if(!card||!card.getAttribute("data-occena-phone-key"))return;
    var key=card.getAttribute("data-occena-phone-key");
    var d=dataFor(state);
    var rec=d.items[key]&&typeof d.items[key]==="object"?d.items[key]:{};
    rec.initialScore=String(card.querySelector("[data-phone-initial]")?.value||"").trim();
    var group=card.querySelector("[data-phone-status]");
    rec.status=String(group?.getAttribute("data-value")||"pending");
    rec.correctedScore=String(card.querySelector("[data-phone-corrected]")?.value||"").trim();
    rec.observation=String(card.querySelector("[data-phone-observation]")?.value||"").trim();
    rec.checkedAt=complete(rec)?(rec.checkedAt||new Date().toISOString()):"";
    d.items[key]=rec;
    d.updatedAt=new Date().toISOString();
    if(typeof saveState==="function")saveState();
  }

  function addOccenaPhoneSheetV301(){
    saveOccenaPhoneCard();

    var rows=occenaPhoneRows();
    var current=rows[occenaPhoneIndex]||{};
    var supplier=prompt("Fournisseur de la nouvelle fiche :",String(current.supplier||""));
    supplier=String(supplier||"").trim();
    if(!supplier)return;

    /* V302 — le nouvel article doit toujours partir d'un champ vide.
       Le numéro d'échantillon n'est pas demandé pour une fiche OCCENA ajoutée. */
    var productName=prompt("Article / produit :","");
    productName=String(productName||"").trim();
    if(!productName)return;

    var d=dataFor(state);
    var id=(typeof uid==="function"?uid("occena"):"occena_"+Date.now()+"_"+Math.random().toString(36).slice(2,8));
    d.customRows.push({
      id:id,
      productName:productName,
      supplier:supplier,
      sampleId:""
    });
    d.updatedAt=new Date().toISOString();
    if(typeof saveState==="function")saveState();

    var nextRows=occenaPhoneRows();
    var key="custom__"+String(id);
    var index=nextRows.findIndex(function(r){return String(r.key)===key;});
    if(index>=0)occenaPhoneIndex=index;
    renderOccenaPhoneCard();

    if(typeof toast==="function")toast("Fiche OCCENA ajoutée ✓");
  }

  function deleteOccenaPhoneSheetV303(id){
    id=String(id||"");
    if(!id)return;

    var d=dataFor(state);
    var row=(d.customRows||[]).find(function(x){return String(x.id)===id;});
    if(!row)return;

    var label=(row.productName||"Fiche")+" · "+(row.supplier||"Fournisseur");
    if(!confirm("Supprimer cette fiche OCCENA ?\n\n"+label))return;

    d.customRows=(d.customRows||[]).filter(function(x){return String(x.id)!==id;});
    delete d.items["custom__"+id];
    d.updatedAt=new Date().toISOString();
    if(typeof saveState==="function")saveState();

    var rows=occenaPhoneRows();
    if(!rows.length){
      closeOccenaPhoneMode();
      return;
    }
    occenaPhoneIndex=Math.max(0,Math.min(occenaPhoneIndex,rows.length-1));
    renderOccenaPhoneCard();
    refreshWithoutRender();
    if(typeof toast==="function")toast("Fiche OCCENA supprimée ✓");
  }

  function renderOccenaPhoneCard(){
    var rows=occenaPhoneRows();
    var card=document.getElementById("occenaPhoneCardV300");
    if(!card||!rows.length)return;

    occenaPhoneIndex=Math.max(0,Math.min(rows.length-1,occenaPhoneIndex));
    var r=rows[occenaPhoneIndex];
    var d=dataFor(state);
    var rec=d.items[r.key]||{};
    var status=String(rec.status||"pending");
    var m=metrics(state);

    card.setAttribute("data-occena-phone-key",r.key);
    card.innerHTML=
      "<div class='occena-phone-product-v300'>"+esc(r.productName)+"</div>"+
      "<h3>"+esc(r.supplier)+"</h3>"+
      "<div class='occena-phone-sample-v300'>Échantillon "+esc(r.sampleId||"—")+"</div>"+
      "<label><span>Score OCCENA initial</span><input type='text' inputmode='decimal' data-phone-initial value='"+esc(String(rec.initialScore==null?"":rec.initialScore))+"' placeholder='Score'></label>"+
      "<div class='occena-phone-control-v300'><span>Contrôle</span><div data-phone-status data-value='"+esc(status)+"'>"+
        "<button type='button' data-phone-status-value='pending' class='"+(status==="pending"?"active":"")+"'>À contrôler</button>"+
        "<button type='button' data-phone-status-value='conforme' class='"+(status==="conforme"?"active":"")+"'>✓ Conforme</button>"+
        "<button type='button' data-phone-status-value='corrige' class='"+(status==="corrige"?"active":"")+"'>✎ Corrigé</button>"+
      "</div></div>"+
      "<label><span>Score corrigé</span><input type='text' inputmode='decimal' data-phone-corrected value='"+esc(String(rec.correctedScore==null?"":rec.correctedScore))+"' placeholder='Nouveau score' "+(status==="corrige"?"":"disabled")+"></label>"+
      "<label><span>Correction / observation</span><textarea data-phone-observation rows='3' placeholder='Observation'>"+esc(String(rec.observation||""))+"</textarea></label>"+
      (r.custom?"<button type='button' class='occena-phone-delete-v303' data-phone-delete-sheet='"+esc(r.customId)+"'>🗑 Supprimer cette fiche</button>":"");

    var deleteBtn=card.querySelector("[data-phone-delete-sheet]");
    if(deleteBtn){
      deleteBtn.onclick=function(){
        deleteOccenaPhoneSheetV303(deleteBtn.getAttribute("data-phone-delete-sheet"));
      };
    }

    card.querySelectorAll("[data-phone-status-value]").forEach(function(btn){
      btn.onclick=function(){
        var group=btn.closest("[data-phone-status]");
        var value=String(btn.getAttribute("data-phone-status-value")||"pending");
        group.setAttribute("data-value",value);
        group.querySelectorAll("[data-phone-status-value]").forEach(function(b){
          b.classList.toggle("active",b===btn);
        });
        var corrected=card.querySelector("[data-phone-corrected]");
        if(corrected)corrected.disabled=value!=="corrige";
        saveOccenaPhoneCard();
        updateOccenaPhoneSummary();
      };
    });

    card.querySelectorAll("input,textarea").forEach(function(inp){
      inp.onchange=function(){
        saveOccenaPhoneCard();
        updateOccenaPhoneSummary();
      };
    });

    var progress=document.getElementById("occenaPhoneProgressV300");
    if(progress)progress.textContent="Fiche "+(occenaPhoneIndex+1)+" / "+rows.length;

    var prev=document.getElementById("occenaPhonePrevV300");
    var next=document.getElementById("occenaPhoneNextV300");
    if(prev)prev.disabled=occenaPhoneIndex<=0;
    if(next){
      next.disabled=occenaPhoneIndex>=rows.length-1;
      next.textContent=occenaPhoneIndex>=rows.length-1?"Dernière fiche":"Suivant →";
    }

    updateOccenaPhoneSummary(m);
  }

  function updateOccenaPhoneSummary(m){
    m=m||metrics(state);
    var box=document.getElementById("occenaPhoneSummaryV300");
    if(!box)return;
    box.innerHTML=(m.suppliers||[]).map(function(x){
      var n=Math.min(x.checked,5);
      return "<span class='"+(n>=5?"done":"")+"'>"+esc(x.supplier)+" <strong>"+n+"/5</strong></span>";
    }).join("");
  }

  function ensurePhoneModeButton(){
    var actions=document.querySelector("#occenaControlCard .occena-actions");
    if(!actions)return;
    var btn=document.getElementById("occenaPhoneModeBtnV300");
    if(!btn){
      btn=document.createElement("button");
      btn.type="button";
      btn.id="occenaPhoneModeBtnV300";
      btn.className="btn btn-primary";
      btn.textContent="📱 Mode téléphone";
      actions.insertBefore(btn,actions.firstChild);
    }
    btn.onclick=function(){openOccenaPhoneMode();};
  }

  window.openOccenaPhoneModeV300=openOccenaPhoneMode;
  window.closeOccenaPhoneModeV300=closeOccenaPhoneMode;

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
    s.textContent=".occena-control-card,.occena-control-card *{overflow-anchor:none}.occena-add-article-wrap{margin:14px 0 4px;padding:12px;border:1.5px dashed #9fb8c8;border-radius:11px;background:#fff;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.occena-add-article-wrap span{font-size:9px;color:#687e8c}.occena-delete-custom{display:block;margin-top:5px;border:0;background:transparent;color:#a04444;font-size:7.5px;font-weight:800;cursor:pointer;padding:0}.occena-row-status{align-self:center}.occena-status-field{display:flex;flex-direction:column;gap:6px}.occena-status-field>span{font-size:9px;font-weight:800;color:#526777}.occena-status-buttons{display:flex;gap:5px;flex-wrap:wrap}.occena-status-buttons button{border:1px solid #b8c8d2;background:#fff;color:#355366;border-radius:8px;padding:8px 9px;font:800 9px Arial,sans-serif;cursor:pointer;touch-action:manipulation}.occena-status-buttons button.active{background:#173f5c;color:#fff;border-color:#173f5c}.occena-status-buttons button:focus{outline:2px solid rgba(23,63,92,.22);outline-offset:1px}.occena-phone-modal-v300{display:none;position:fixed;inset:0;z-index:2147483000;background:#eef3f6}.occena-phone-modal-v300.open{display:block}.occena-phone-shell-v300{height:100dvh;display:flex;flex-direction:column;overflow:hidden;background:#eef3f6}.occena-phone-head-v300{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#173f5c;color:#fff}.occena-phone-head-v300>div{display:flex;flex-direction:column;gap:2px}.occena-phone-head-v300 strong{font-size:16px}.occena-phone-head-v300 span{font-size:11px;opacity:.8}.occena-phone-head-v300 button{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:10px;width:38px;height:38px;font-size:18px}.occena-phone-summary-v300{flex:0 0 auto;display:flex;gap:6px;overflow-x:auto;padding:8px 10px;background:#fff;border-bottom:1px solid #dce5ea}.occena-phone-summary-v300 span{white-space:nowrap;border:1px solid #d8e2e8;border-radius:999px;padding:5px 8px;font-size:10px;color:#516b7b}.occena-phone-summary-v300 span.done{background:#e8f6ef;color:#176c50;border-color:#bfe4d2}.occena-phone-tools-v301{flex:0 0 auto;padding:8px 10px;background:#eef3f6;border-bottom:1px solid #dce5ea}.occena-phone-tools-v301 button{width:100%;min-height:40px;border:1px dashed #8faebe;border-radius:10px;background:#fff;color:#173f5c;font-size:12px;font-weight:850;touch-action:manipulation}.occena-phone-card-v300{flex:1 1 auto;overflow:auto;padding:16px 14px 18px;-webkit-overflow-scrolling:touch}.occena-phone-product-v300{font-size:11px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#6b7d89}.occena-phone-card-v300 h3{font-size:22px;color:#173f5c;margin:6px 0 2px}.occena-phone-sample-v300{font-size:12px;color:#71818b;margin-bottom:16px}.occena-phone-card-v300 label{display:block;margin:0 0 14px}.occena-phone-card-v300 label>span,.occena-phone-control-v300>span{display:block;font-size:11px;font-weight:800;color:#526777;margin-bottom:6px}.occena-phone-card-v300 input,.occena-phone-card-v300 textarea{width:100%;font-size:16px;border:1px solid #b9c9d3;border-radius:10px;padding:12px;background:#fff;color:#213d50}.occena-phone-control-v300{margin-bottom:14px}.occena-phone-control-v300>div{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}.occena-phone-control-v300 button{min-height:46px;border:1px solid #b7c7d1;border-radius:10px;background:#fff;color:#355366;font-weight:850;font-size:12px;touch-action:manipulation}.occena-phone-control-v300 button.active{background:#173f5c;color:#fff;border-color:#173f5c}.occena-phone-delete-v303{width:100%;min-height:42px;margin-top:4px;border:1px solid #d8a7a7;border-radius:10px;background:#fff6f6;color:#9b3030;font-size:12px;font-weight:850;touch-action:manipulation}.occena-phone-nav-v300{flex:0 0 auto;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #dce5ea}.occena-phone-nav-v300 button{min-height:48px;border:0;border-radius:10px;background:#173f5c;color:#fff;font-size:14px;font-weight:850}.occena-phone-nav-v300 button:disabled{opacity:.38}.occena-phone-open-v300{overscroll-behavior:none}";
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
