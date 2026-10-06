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
          sampleId:String(sm.id||"")
        });
      });
    });
    return out;
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
    render();
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
          "<div class='occena-row-status'>"+(ok?"Contrôle validé":"À compléter")+"</div>"+
        "</div>";
      }).join("");
      return "<section class='occena-product-block'><h4>"+esc(productName)+"</h4>"+lines+"</section>";
    }).join("");

    box.querySelectorAll("[data-occena-status]").forEach(function(sel){
      sel.onchange=function(){capture();if(typeof saveState==="function")saveState();render();};
    });
    box.querySelectorAll("input").forEach(function(inp){
      inp.oninput=function(){var s=document.getElementById("occenaSaveState");if(s)s.textContent="À enregistrer";};
      inp.onchange=function(){capture();if(typeof saveState==="function")saveState();render();};
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

  function bind(){
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
