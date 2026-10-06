/* V274 — Dossier résultats 2025 : réception, produits, lot /5, fiches échantillons, émargement */
(function(){
  "use strict";
  if(window.__tcV274Loaded)return;
  window.__tcV274Loaded=true;

  function esc(v){
    if(typeof reportEsc==="function")return reportEsc(v);
    return String(v==null?"":v).replace(/[&<>'"]/g,function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c];
    });
  }
  function n(v,d){
    var x=Number(v||0);
    return Number.isFinite(x)?x.toFixed(d==null?2:d).replace(".",","):"0";
  }
  function dateFr(v){
    if(!v)return "—";
    try{
      var d=new Date(String(v).length<=10?String(v)+"T12:00:00":v);
      return d.toLocaleDateString("fr-FR");
    }catch(e){return String(v);}
  }
  function temp(v){
    if(v===null||v===undefined||String(v).trim()==="")return "—";
    var x=Number(v);
    return (Number.isFinite(x)&&x>0?"+":"")+String(v)+" °C";
  }
  function yn(v){
    if(v==="oui"||v==="conforme"||v===true)return "Oui";
    if(v==="non"||v==="non-conforme"||v===false)return "Non";
    return v||"—";
  }
  function maxSampleScore(st){return Number(st&&st.config&&st.config.testerCount||0)*65;}
  function note5(total,max){return max>0?(Number(total||0)/max*5):0;}
  function rankRows(rows,field){
    rows.sort(function(a,b){return Number(b[field]||0)-Number(a[field]||0)||String(a.supplier||"").localeCompare(String(b.supplier||""),"fr");});
    var last=null,rank=0;
    rows.forEach(function(r,i){
      var cur=Number(r[field]||0);
      if(last===null||Math.abs(cur-last)>0.0001)rank=i+1;
      r.rank=rank;last=cur;
    });
    return rows;
  }

  function commentsForSample(st,p,sm){
    var out=[];
    var count=Number(st&&st.config&&st.config.testerCount||0);
    for(var t=1;t<=count;t++){
      var a=st&&st.testers&&st.testers[t]&&st.testers[t].answers&&st.testers[t].answers[String(p.id)+"__"+String(sm.id)];
      if(!a)continue;
      for(var qi=0;qi<(typeof QUESTIONS!=="undefined"?QUESTIONS.length:5);qi++){
        try{
          if(typeof getQuickTags==="function"){
            (getQuickTags(a,qi)||[]).forEach(function(x){if(String(x||"").trim())out.push(String(x).trim());});
          }
        }catch(e){}
        try{
          var m=typeof manualRemarkText==="function"?manualRemarkText(a,qi):String(a.remarks&&a.remarks[qi]||"").trim();
          if(m)out.push(m);
        }catch(e){}
      }
    }
    var seen={};
    return out.filter(function(x){
      var k=String(x).trim().toLocaleLowerCase("fr");
      if(!k||seen[k])return false;
      seen[k]=1;return true;
    });
  }

  function productRankingRows(st,p){
    var max=maxSampleScore(st);
    var rows=(p.samples||[]).map(function(sm){
      var ss=typeof stateSampleStats==="function"?stateSampleStats(st,p,sm):{total:0,count:0,avg:0};
      return {
        supplier:sm.supplier||"Sans fournisseur",
        sample:sm.id||"—",
        total:Number(ss.total||0),
        max:max,
        note5:note5(ss.total,max),
        count:Number(ss.count||0),
        comments:commentsForSample(st,p,sm)
      };
    });
    return rankRows(rows,"note5");
  }

  function lotSupplierRows(st){
    var map={};
    var products=st&&st.config&&st.config.products||[];
    var perMax=maxSampleScore(st);
    products.forEach(function(p,pi){
      (p.samples||[]).forEach(function(sm){
        var supplier=sm.supplier||"Sans fournisseur";
        var ss=typeof stateSampleStats==="function"?stateSampleStats(st,p,sm):{total:0,count:0};
        if(!map[supplier])map[supplier]={supplier:supplier,total:0,max:0,perProduct:{}};
        var r=map[supplier];
        r.total+=Number(ss.total||0);
        r.max+=perMax;
        if(!r.perProduct[pi])r.perProduct[pi]={total:0,max:0};
        r.perProduct[pi].total+=Number(ss.total||0);
        r.perProduct[pi].max+=perMax;
      });
    });
    var rows=Object.keys(map).map(function(k){
      var r=map[k];r.note5=note5(r.total,r.max);return r;
    });
    return rankRows(rows,"note5");
  }

  function receptionSheets(st){
    var recs=Array.isArray(st&&st.config&&st.config.receptions)?st.config.receptions:[];
    if(!recs.length){
      return "<section class='section page-break'><div class='section-title'>1. Fiches de réception des fournisseurs</div><div class='empty'>Aucune réception fournisseur enregistrée pour ce lot.</div></section>";
    }
    return recs.map(function(r,ri){
      var lines=(r.lines||[]).filter(function(x){return x&&x.received!==false;});
      var lineRows=lines.length?lines.map(function(x){
        return "<tr><td>"+esc(x.productName||"Produit")+"</td><td>"+esc(temp(x.productTemp))+"</td><td>"+esc(temp(x.interiorTemp))+"</td><td>"+esc(x.dlc?dateFr(x.dlc):"—")+"</td><td>"+esc(yn(x.packaging))+"</td><td>"+esc(x.decision==="refus"?"Refus":x.decision==="acceptation"?"Acceptation":x.decision||"—")+"</td><td>"+esc(x.observations||"RAS")+"</td></tr>";
      }).join(""):"<tr><td colspan='7'>Aucun produit renseigné.</td></tr>";
      var sig=r.driverSignature?"<img class='sig-img' src='"+r.driverSignature+"' alt='Signature du livreur'>":"<div class='sig-blank'>Signature non enregistrée</div>";
      return "<section class='section reception-sheet "+(ri?"page-break":"page-break")+"'>"+
        "<div class='section-title'>1. Fiche de réception — "+esc(r.supplier||"Fournisseur")+"</div>"+
        "<div class='meta-grid'>"+
          "<div><small>Date</small><strong>"+esc(dateFr(r.date))+"</strong></div>"+
          "<div><small>Heure</small><strong>"+esc(r.time||"—")+"</strong></div>"+
          "<div><small>Établissement</small><strong>"+esc(r.establishment||st.config.receptionEstablishment||"—")+"</strong></div>"+
          "<div><small>T° véhicule</small><strong>"+esc(temp(r.vehicleTemp))+"</strong></div>"+
          "<div><small>Livreur</small><strong>"+esc(r.driverName||"—")+"</strong></div>"+
          "<div><small>Agent réceptionnaire</small><strong>"+esc(r.receiverName||"—")+"</strong></div>"+
        "</div>"+
        "<table><thead><tr><th>Produit</th><th>T° produit</th><th>T° intérieur</th><th>DLC</th><th>Emballage</th><th>Décision</th><th>Observations</th></tr></thead><tbody>"+lineRows+"</tbody></table>"+
        "<div class='signature-one'><strong>Signature du livreur</strong>"+sig+"</div>"+
      "</section>";
    }).join("");
  }

  function productReports(st){
    var products=st&&st.config&&st.config.products||[];
    return products.map(function(p,pi){
      var rows=productRankingRows(st,p);
      var body=rows.map(function(r){
        return "<tr><td class='rank'>"+r.rank+"</td><td>"+esc(r.supplier)+"</td><td><strong>"+esc(r.sample)+"</strong></td><td class='score'>"+n(r.total,0)+" / "+n(r.max,0)+"</td><td class='score'>"+n(r.note5,2)+" / 5</td></tr>";
      }).join("");
      var comments=[];
      rows.forEach(function(r){
        r.comments.forEach(function(c){comments.push("<li><strong>"+esc(r.supplier)+" — éch. "+esc(r.sample)+" :</strong> "+esc(c)+"</li>");});
      });
      return "<section class='section "+(pi===0?"page-break":"")+" page-break-avoid'>"+
        "<div class='section-title'>2. Rapport produit — "+esc(p.name||("Produit "+(pi+1)))+"</div>"+
        "<table><thead><tr><th>Rang</th><th>Fournisseur</th><th>Échantillon</th><th>Score</th><th>Note /5</th></tr></thead><tbody>"+body+"</tbody></table>"+
        "<div class='comments'><strong>Remarques du jury</strong>"+(comments.length?"<ul>"+comments.slice(0,20).join("")+"</ul>":"<p>Aucune remarque saisie.</p>")+"</div>"+
      "</section>";
    }).join("");
  }

  function lotReport(st){
    var products=st&&st.config&&st.config.products||[];
    var rows=lotSupplierRows(st);
    var heads=products.map(function(p){return "<th>"+esc(p.name||"Produit")+"</th>";}).join("");
    var body=rows.map(function(r){
      var cells=products.map(function(p,pi){
        var x=r.perProduct[pi];
        return "<td class='score'>"+(x?n(x.total,0)+" / "+n(x.max,0):"—")+"</td>";
      }).join("");
      return "<tr><td class='rank'>"+r.rank+"</td><td><strong>"+esc(r.supplier)+"</strong></td>"+cells+"<td class='score'>"+n(r.total,0)+" / "+n(r.max,0)+"</td><td class='score big-note'>"+n(r.note5,2)+" / 5</td></tr>";
    }).join("");
    var note=String(st&&st.config&&st.config.reportNote||"").trim();
    return "<section class='section page-break'>"+
      "<div class='section-title'>3. Rapport global du lot — classement et note sur 5</div>"+
      "<table class='lot-table'><thead><tr><th>Rang</th><th>Fournisseur</th>"+heads+"<th>Total</th><th>Note /5</th></tr></thead><tbody>"+body+"</tbody></table>"+
      (note?"<div class='technical-note'><strong>Note complémentaire / précision technique</strong><p>"+esc(note).replace(/\n/g,"<br>")+"</p></div>":"")+
      "<div class='note'>La note sur 5 est calculée automatiquement à partir du total des points du fournisseur par rapport au maximum possible sur le lot.</div>"+
    "</section>";
  }

  function sampleSheets(st){
    var out=[];
    var products=st&&st.config&&st.config.products||[];
    products.forEach(function(p,pi){
      (p.samples||[]).forEach(function(sm){
        var rec=typeof ensureProductSheetRecord==="function"?ensureProductSheetRecord(st,p,sm):{};
        var ss=typeof productSheetStats==="function"?productSheetStats(st,p,sm):{count:0,avg65:0,note5:0,criteria:[]};
        var comments=commentsForSample(st,p,sm);
        var criteria=(ss.criteria||[]).map(function(c){
          return "<tr><td>"+esc(c.name)+"</td><td class='score'>"+(ss.count?n(c.avg,2)+" / "+n(c.max,0):"—")+"</td></tr>";
        }).join("");
        var receptionLine="";
        if(rec.receptionFound){
          receptionLine="<tr><th>Réception</th><td colspan='3'>"+esc(dateFr(rec.receptionDate))+" "+esc(rec.receptionTime||"")+" · T° véhicule "+esc(temp(rec.receptionVehicleTemp))+" · T° produit "+esc(temp(rec.deliveryTemp))+" · "+esc(rec.receptionDecision==="refus"?"Refus":"Acceptation")+"</td></tr>";
        }
        out.push("<section class='section page-break sample-sheet'>"+
          "<div class='section-kicker'>4. FICHE D'ÉVALUATION DE L'ÉCHANTILLON</div>"+
          "<h2>"+esc(p.name||("Produit "+(pi+1)))+"</h2>"+
          "<div class='sample-head'><span>Fournisseur : <strong>"+esc(sm.supplier||"—")+"</strong></span><span>Échantillon : <strong>"+esc(sm.id||"—")+"</strong></span></div>"+
          "<table class='sample-meta'><tbody>"+
            "<tr><th>Marque</th><td>"+esc(rec.brand||"—")+"</td><th>Poids / grammage</th><td>"+esc(rec.weight||"—")+"</td></tr>"+
            "<tr><th>Caractéristiques</th><td colspan='3'>"+esc(rec.characteristics||"—")+"</td></tr>"+
            "<tr><th>Étiquetage</th><td>"+esc(yn(rec.labeling))+"</td><th>N° lot fournisseur</th><td>"+esc(rec.supplierLot||"—")+"</td></tr>"+
            "<tr><th>Conforme fiche technique</th><td>"+esc(yn(rec.technicalSheet))+"</td><th>Emballage</th><td>"+esc(yn(rec.packagingConformity))+"</td></tr>"+
            "<tr><th>DDM</th><td>"+esc(rec.ddm?dateFr(rec.ddm):"—")+"</td><th>DLC</th><td>"+esc(rec.dlc?dateFr(rec.dlc):"—")+"</td></tr>"+
            "<tr><th>Observations techniques</th><td colspan='3'>"+esc(rec.observations||"RAS")+"</td></tr>"+receptionLine+
          "</tbody></table>"+
          "<div class='sample-sensory'>"+
            "<div><h3>Évaluation sensorielle</h3><table><thead><tr><th>Critère</th><th>Moyenne</th></tr></thead><tbody>"+criteria+"</tbody></table></div>"+
            "<div class='sample-final'><small>Résultat du jury</small><strong>"+(ss.count?n(ss.avg65,2)+" / 65":"—")+"</strong><span>NOTE DÉFINITIVE</span><b>"+(ss.count?n(ss.note5,2)+" / 5":"—")+"</b></div>"+
          "</div>"+
          "<div class='comments'><strong>Appréciations / remarques</strong>"+(comments.length?"<ul>"+comments.slice(0,24).map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ul>":"<p>RAS</p>")+"</div>"+
        "</section>");
      });
    });
    return out.join("");
  }

  function attendance(st){
    var c=st&&st.config&&st.config.closure||{};
    var members=Array.isArray(c.members)&&c.members.length?c.members:Array.from({length:Number(st&&st.config&&st.config.testerCount||0)},function(_,i){
      return {testerNo:i+1,name:st.testers&&st.testers[i+1]?st.testers[i+1].name:("Testeur "+(i+1)),role:"",present:true,signature:""};
    });
    var body=members.map(function(m,i){
      var sig=m.signature?"<img class='member-sign-img' src='"+m.signature+"' alt='Signature'>":"<div class='member-sign-blank'></div>";
      return "<tr><td>"+(i+1)+"</td><td><strong>"+esc(m.name||("Testeur "+(i+1)))+"</strong></td><td>"+esc(m.role||"—")+"</td><td>"+(m.present===false?"Absent":"Présent")+"</td><td class='member-sign-cell'>"+sig+"</td></tr>";
    }).join("");
    return "<section class='section page-break attendance'>"+
      "<div class='section-title'>5. Émargement des testeurs</div>"+
      "<table><thead><tr><th>N°</th><th>Nom</th><th>Fonction / établissement</th><th>Présence</th><th>Signature</th></tr></thead><tbody>"+body+"</tbody></table>"+
      "<div class='jury-signs'>"+
        "<div><strong>Responsable / président du jury</strong><span>"+esc(c.chair||"—")+"</span>"+(c.chairSignature?"<img src='"+c.chairSignature+"' alt='Signature responsable'>":"")+"</div>"+
        "<div><strong>Second signataire</strong><span>"+esc(c.coSigner||"—")+"</span>"+(c.coSignature?"<img src='"+c.coSignature+"' alt='Signature second signataire'>":"")+"</div>"+
      "</div>"+
    "</section>";
  }

  function dossierHtml(st,sourceLabel){
    var cfg=st.config||{},c=cfg.closure||{};
    var generated=new Date();
    var complete=typeof stateValidatedCount==="function"?stateValidatedCount(st):0;
    var final=!!(cfg.juryClose&&cfg.juryClose.closedAt)&&complete===Number(cfg.testerCount||0);
    var status=final?"DOSSIER RÉSULTATS FINAL":"DOSSIER RÉSULTATS PROVISOIRE";
    var cover="<main class='page cover'><div><div class='kicker'>Jury Marchés · Tests culinaires · "+esc(sourceLabel||"Jury")+"</div><h1>"+status+"</h1><h2>"+esc(cfg.lotName||"Jury")+"</h2>"+
      "<p class='lead'>Dossier généré automatiquement par l'application.</p>"+
      "<div class='cover-grid'>"+
        "<div><small>Date du jury</small><strong>"+esc(dateFr(c.date))+"</strong></div>"+
        "<div><small>Lieu</small><strong>"+esc(c.place||"—")+"</strong></div>"+
        "<div><small>Responsable</small><strong>"+esc(c.chair||"—")+"</strong></div>"+
        "<div><small>Composition</small><strong>"+(cfg.products||[]).length+" produit(s) · "+Number(cfg.testerCount||0)+" testeur(s)</strong></div>"+
      "</div>"+
      "<div class='contents'><strong>Contenu du dossier</strong><ol><li>Fiches de réception des fournisseurs</li><li>Rapport sur les produits</li><li>Rapport global du lot et note sur 5</li><li>Toutes les fiches échantillons</li><li>Émargement des testeurs</li></ol></div>"+
      "<div class='no-occena'>Les anciennes fiches OCCENA ne sont pas reprises : les informations utiles sont intégrées directement aux fiches échantillons.</div>"+
      "</div><footer>Généré le "+esc(generated.toLocaleString("fr-FR"))+"</footer></main>";

    return "<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>"+esc(status)+" — "+esc(cfg.lotName||"Jury")+"</title><style>"+
      "@page{size:A4 portrait;margin:11mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#eef3f7;color:#223746;font-size:9px;line-height:1.35}.toolbar{position:sticky;top:0;z-index:50;background:#173f5c;color:#fff;padding:9px 13px;display:flex;justify-content:space-between;align-items:center}.toolbar button{border:0;border-radius:8px;padding:8px 12px;font-weight:800;cursor:pointer}.page{max-width:190mm;margin:14px auto;background:#fff;padding:13mm;box-shadow:0 10px 30px rgba(20,47,67,.10)}.cover{min-height:260mm;display:flex;flex-direction:column;justify-content:space-between}.kicker,.section-kicker{text-transform:uppercase;letter-spacing:.14em;font-weight:800;font-size:8px;color:#6f8290}.cover h1{font-size:27px;color:#173f5c;margin:8px 0 4px}.cover h2{font-size:16px;margin:0;color:#4b687a}.lead{color:#72828d}.cover-grid,.meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:18px 0}.cover-grid div,.meta-grid div{border:1px solid #dfe6eb;border-radius:8px;padding:8px}.cover-grid small,.meta-grid small{display:block;color:#7c8b95;text-transform:uppercase;font-size:7px}.cover-grid strong,.meta-grid strong{display:block;margin-top:3px;color:#234e68}.contents{border:1px solid #d6e3eb;background:#f7fafc;border-radius:10px;padding:12px;margin-top:18px}.contents li{margin:5px 0}.no-occena{margin-top:12px;padding:8px;border-left:4px solid #2c7ea8;background:#eef7fb;color:#496676}.cover footer{border-top:2px solid #2c7ea8;padding-top:7px;color:#71818b}.section{margin:10px 0}.section-title{font-size:13px;font-weight:800;color:#173f5c;border-left:4px solid #2c7ea8;background:#f4f8fa;padding:6px 8px;margin-bottom:8px}.page-break{break-before:page;page-break-before:always}.page-break-avoid{break-inside:avoid;page-break-inside:avoid}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d7e1e7;padding:5px 6px;vertical-align:top}th{background:#edf4f7;color:#526c7c;font-size:7px;text-transform:uppercase}.rank{text-align:center;font-weight:800}.score{text-align:right;font-weight:800}.big-note{color:#0d638f;font-size:10px}.comments,.technical-note{margin-top:8px;border:1px solid #dfe6eb;border-radius:8px;padding:8px;background:#fbfdfe}.comments ul{margin:6px 0 0 16px;padding:0}.comments li{margin:3px 0}.signature-one{margin-top:10px;border:1px solid #dfe6eb;border-radius:8px;padding:8px;max-width:90mm}.sig-img{max-width:75mm;max-height:24mm;display:block;margin-top:5px}.sig-blank{height:22mm;border-bottom:1px solid #b9c7d0;color:#8a989f;padding-top:5px}.sample-sheet h2{color:#173f5c;font-size:18px;margin:5px 0}.sample-head{display:flex;justify-content:space-between;background:#f5f8fa;border:1px solid #dfe6eb;padding:8px;margin:8px 0}.sample-meta th{width:24%}.sample-sensory{display:grid;grid-template-columns:1.5fr .8fr;gap:10px;margin-top:10px}.sample-final{border:2px solid #2c7ea8;border-radius:10px;padding:12px;text-align:center}.sample-final small,.sample-final span{display:block;color:#6e808d;text-transform:uppercase;font-size:7px}.sample-final strong{display:block;font-size:17px;color:#173f5c;margin:6px 0 12px}.sample-final b{display:block;font-size:24px;color:#0d638f;margin-top:4px}.member-sign-cell{height:23mm;min-width:42mm}.member-sign-img{display:block;max-width:38mm;max-height:18mm;margin:auto}.member-sign-blank{height:18mm}.jury-signs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.jury-signs>div{border:1px solid #dfe6eb;border-radius:8px;min-height:35mm;padding:8px}.jury-signs strong,.jury-signs span{display:block}.jury-signs img{display:block;max-width:70mm;max-height:24mm;margin-top:5px}.empty,.note{color:#6f818d;padding:8px}.lot-table{font-size:7.5px}"+
      "@media print{body{background:#fff}.toolbar{display:none}.page{max-width:none;margin:0;padding:0;box-shadow:none}.cover{min-height:272mm}}"+
      "</style></head><body><div class='toolbar'><strong>"+esc(status)+"</strong><button onclick='window.print()'>Imprimer / Enregistrer tout le dossier en PDF</button></div>"+
      cover+receptionSheets(st)+productReports(st)+lotReport(st)+sampleSheets(st)+attendance(st)+"</body></html>";
  }

  // Individual tester signatures on the Closure screen.
  var rawNormalize=typeof normalizeClosureMembers==="function"?normalizeClosureMembers:null;
  if(rawNormalize){
    normalizeClosureMembers=function(){
      var old=(state&&state.config&&state.config.closure&&state.config.closure.members)||[];
      var sigs={};
      old.forEach(function(m){sigs[String(m.testerNo||"")]=m.signature||"";});
      var c=rawNormalize();
      (c.members||[]).forEach(function(m){
        m.signature=m.signature||sigs[String(m.testerNo||"")]||"";
      });
      return c;
    };
    window.normalizeClosureMembers=normalizeClosureMembers;
  }

  var rawCapture=typeof captureClosureForm==="function"?captureClosureForm:null;
  if(rawCapture){
    captureClosureForm=function(){
      var c=rawCapture();
      (c.members||[]).forEach(function(m,i){
        var id="memberSignatureV274_"+i;
        var cv=document.getElementById(id);
        if(cv&&typeof signatureCanvasData==="function"){
          var data=signatureCanvasData(id);
          if(data)m.signature=data;
        }
      });
      if(state&&state.config)state.config.closure=c;
      return c;
    };
    window.captureClosureForm=captureClosureForm;
  }

  function addMemberSignatures(){
    var box=document.getElementById("closureMembers");
    if(!box)return;
    var c=state&&state.config&&state.config.closure||{};
    var members=Array.isArray(c.members)?c.members:[];
    if(!document.getElementById("memberSignatureStyleV274")){
      var style=document.createElement("style");
      style.id="memberSignatureStyleV274";
      style.textContent=".closure-member-sign-note-v274{margin:8px 0 12px;padding:9px 11px;border-radius:10px;background:#eef7fb;color:#315b71;font-size:10px}.closure-member-v274{grid-template-columns:auto minmax(120px,1fr) minmax(150px,1fr)!important;align-items:start!important}.member-signature-wrap-v274{grid-column:1/-1;margin-top:7px;padding-top:7px;border-top:1px dashed #d6e2e9}.member-signature-wrap-v274 label{display:block;font-size:9px;font-weight:800;color:#526c7c;margin-bottom:5px}.member-signature-pad-v274{width:100%;height:85px;display:block;border:1px solid #ccd9e1;border-radius:10px;background:#fff;touch-action:none}";
      document.head.appendChild(style);
    }
    if(!box.previousElementSibling||!box.previousElementSibling.classList.contains("closure-member-sign-note-v274")){
      var note=document.createElement("div");
      note.className="closure-member-sign-note-v274";
      note.textContent="Émargement : chaque testeur présent peut signer ici. Les signatures seront reprises automatiquement à la fin du dossier résultats.";
      box.parentNode.insertBefore(note,box);
    }
    Array.from(box.querySelectorAll(".closure-member")).forEach(function(row,i){
      row.classList.add("closure-member-v274");
      if(row.querySelector(".member-signature-wrap-v274"))return;
      var wrap=document.createElement("div");
      wrap.className="member-signature-wrap-v274";
      wrap.innerHTML="<label>Signature du testeur</label><canvas id='memberSignatureV274_"+i+"' class='signature-pad member-signature-pad-v274'></canvas>";
      row.appendChild(wrap);
      if(typeof setupSignatureCanvas==="function"){
        setupSignatureCanvas("memberSignatureV274_"+i,(members[i]&&members[i].signature)||"");
      }
    });
  }

  var rawRenderClosure=typeof renderClosure==="function"?renderClosure:null;
  if(rawRenderClosure){
    renderClosure=function(){
      rawRenderClosure();
      setTimeout(addMemberSignatures,40);
    };
    window.renderClosure=renderClosure;
  }

  // New dossier output.
  openJuryDossier=function(st,sourceLabel){
    if(!st||!st.config||(st.config.products||[]).length===0){
      alert("Aucun jury à présenter dans le dossier.");
      return;
    }
    var w=window.open("","_blank");
    if(!w){
      alert("Le navigateur a bloqué l’ouverture du dossier. Autorisez les fenêtres contextuelles pour cette page.");
      return;
    }
    var html=dossierHtml(st,sourceLabel||"Jury");
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  };
  window.openJuryDossier=openJuryDossier;

  // In Results, the final action now opens this complete dossier.
  var rawSync=typeof syncSimpleResultsActions==="function"?syncSimpleResultsActions:null;
  if(rawSync){
    syncSimpleResultsActions=function(){
      rawSync();
      var b=document.getElementById("simpleResultsPdfBtn");
      if(b)b.textContent="📚 3. Dossier résultats";
    };
    window.syncSimpleResultsActions=syncSimpleResultsActions;
  }

  function rebind(){
    var closure=document.getElementById("closureBtn");
    if(closure)closure.onclick=function(){renderClosure();};
    var simpleClosure=document.getElementById("simpleResultsClosureBtn");
    if(simpleClosure)simpleClosure.onclick=function(){renderClosure();};
    var dossier=document.getElementById("simpleResultsPdfBtn");
    if(dossier)dossier.onclick=function(){openCurrentDossier();};
    var mainDossier=document.getElementById("dossierBtn");
    if(mainDossier)mainDossier.onclick=function(){openCurrentDossier();};
    if(document.getElementById("closureView")&&document.getElementById("closureView").classList.contains("active"))setTimeout(addMemberSignatures,40);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",rebind);
  else rebind();
  setTimeout(rebind,700);
})();