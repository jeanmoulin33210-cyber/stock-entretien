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

  function supplierCommentsV287(st,p,sm){
    try{
      if(typeof reportSupplierComments==="function")return reportSupplierComments(st,p,sm);
    }catch(e){}
    return {positive:[],negative:[],manual:commentsForSample(st,p,sm)};
  }

  function reportCorrespondenceV287(st){
    var products=st&&st.config&&st.config.products||[];
    var suppliers=[];
    products.forEach(function(p){
      (p.samples||[]).forEach(function(sm){
        var s=String(sm.supplier||"Sans fournisseur");
        if(suppliers.indexOf(s)<0)suppliers.push(s);
      });
    });
    suppliers.sort(function(a,b){return a.localeCompare(b,"fr");});
    var heads=products.map(function(p){return "<th>"+esc(p.name||"Article")+"<br><span>N° échantillon</span></th>";}).join("");
    var rows=suppliers.map(function(supplier){
      var cells=products.map(function(p){
        var ids=(p.samples||[]).filter(function(sm){return String(sm.supplier||"Sans fournisseur")===supplier;})
          .map(function(sm){return String(sm.id||"—");});
        return "<td>"+esc(ids.length?ids.join(", "):"—")+"</td>";
      }).join("");
      return "<tr><td><strong>"+esc(supplier)+"</strong></td>"+cells+"</tr>";
    }).join("");
    return "<table class='correspondence-table'><thead><tr><th>Fournisseur</th>"+heads+"</tr></thead><tbody>"+(rows||"<tr><td colspan='2'>Aucune correspondance.</td></tr>")+"</tbody></table>";
  }

  function receptionSheets(st){
    var recs=Array.isArray(st&&st.config&&st.config.receptions)?st.config.receptions.filter(Boolean):[];
    if(!recs.length){
      return "<section class='report-page page-break reception-page'><div class='page-kicker'>Annexe · contrôle de réception</div><h2>Relevés de réception des échantillons</h2><div class='empty-box'>Aucune réception fournisseur enregistrée pour ce lot.</div></section>";
    }

    var pages=[];
    for(var offset=0;offset<recs.length;offset+=3){
      var group=recs.slice(offset,offset+3);
      var cards=group.map(function(r,idx){
        var lines=(r.lines||[]).filter(function(x){return x&&x.received!==false;});
        var body=lines.length?lines.map(function(x){
          return "<tr>"+
            "<td>"+esc(x.productName||"Produit")+"</td>"+
            "<td>"+esc(temp(r.vehicleTemp))+"</td>"+
            "<td>"+esc(temp(x.productTemp))+"</td>"+
            "<td>"+esc(temp(x.interiorTemp))+"</td>"+
            "<td>"+esc(x.dlc?dateFr(x.dlc):"—")+"</td>"+
            "<td>"+esc(yn(x.packaging))+"</td>"+
            "<td class='decision'>"+esc(x.decision==="refus"?"Refus":"Accepté")+"</td>"+
            "<td>"+esc(x.observations||"RAS")+"</td>"+
          "</tr>";
        }).join(""):"<tr><td colspan='8'>Aucun produit renseigné.</td></tr>";
        var sig=r.driverSignature?"<img class='sig-img compact' src='"+r.driverSignature+"' alt='Signature du livreur'>":"<span class='sig-missing'>Signature non enregistrée</span>";

        return "<article class='reception-card'>"+
          "<div class='reception-head'><div><strong>"+esc(r.supplier||"Fournisseur")+"</strong><span>Réception "+(offset+idx+1)+" / "+recs.length+"</span></div><b>"+esc(dateFr(r.date))+" · "+esc(r.time||"—")+"</b></div>"+
          "<div class='reception-meta'>"+
            "<div><small>Établissement</small><strong>"+esc(r.establishment||st.config.receptionEstablishment||"—")+"</strong></div>"+
            "<div><small>Lot</small><strong>"+esc(st.config.lotName||"—")+"</strong></div>"+
            "<div><small>Livreur</small><strong>"+esc(r.driverName||"—")+"</strong></div>"+
            "<div><small>Agent réceptionnaire</small><strong>"+esc(r.receiverName||"—")+"</strong></div>"+
          "</div>"+
          "<table class='reception-table'><thead><tr><th>Produit</th><th>T° véhicule</th><th>T° produit</th><th>T° intérieur</th><th>DLC / DDM</th><th>Emballage</th><th>Décision</th><th>Observations</th></tr></thead><tbody>"+body+"</tbody></table>"+
          "<div class='reception-sign'><strong>Signature du livreur</strong>"+sig+"</div>"+
        "</article>";
      }).join("");

      pages.push("<section class='report-page page-break reception-page reception-count-"+group.length+"'>"+
        "<div class='page-kicker'>Annexe · contrôle de réception</div>"+
        "<h2>Relevés de réception des échantillons</h2>"+
        "<p class='page-lead'>Les réceptions sont regroupées pour faciliter la lecture tout en conservant les informations saisies et les signatures.</p>"+
        "<div class='reception-stack'>"+cards+"</div>"+
      "</section>");
    }
    return pages.join("");
  }

  function productReports(st){
    var products=st&&st.config&&st.config.products||[];
    return products.map(function(p,pi){
      var rows=productRankingRows(st,p);
      var density=rows.length<=5?"normal":rows.length<=8?"compact":"dense";
      var body=rows.map(function(r){
        return "<tr><td class='rank'>"+r.rank+"</td><td><strong>"+esc(r.supplier)+"</strong></td><td>"+esc(r.sample)+"</td><td class='score'>"+n(r.total,0)+" / "+n(r.max,0)+"</td><td class='score note5-cell'>"+n(r.note5,2)+"</td></tr>";
      }).join("");

      var cards=rows.map(function(r){
        var sm=(p.samples||[]).find(function(x){return String(x.id)===String(r.sample)&&String(x.supplier||"Sans fournisseur")===String(r.supplier);})||
               (p.samples||[]).find(function(x){return String(x.id)===String(r.sample);});
        var groups=sm?supplierCommentsV287(st,p,sm):{positive:[],negative:[],manual:r.comments||[]};
        function list(items,empty){
          return items&&items.length?"<ul>"+items.map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ul>":"<span class='comment-empty'>"+empty+"</span>";
        }
        return "<article class='supplier-card'>"+
          "<div class='supplier-card-head'><strong>"+esc(r.supplier)+"</strong><span>Échantillon "+esc(r.sample)+" · "+n(r.note5,2)+" / 5</span></div>"+
          "<div class='comment-block positive'><h4>Arguments positifs</h4>"+list(groups.positive,"Aucun")+"</div>"+
          "<div class='comment-block negative'><h4>Arguments négatifs</h4>"+list(groups.negative,"Aucun")+"</div>"+
          "<div class='comment-block manual'><h4>Remarques libres</h4>"+list(groups.manual,"Aucune")+"</div>"+
        "</article>";
      }).join("");

      return "<section class='report-page page-break product-page density-"+density+"'>"+
        "<div class='page-kicker'>Article "+(pi+1)+" / "+products.length+"</div>"+
        "<h2>"+esc(p.name||("Produit "+(pi+1)))+"</h2>"+
        (p.code?"<div class='product-code'>Référence / code : "+esc(p.code)+"</div>":"")+
        "<table class='ranking-table'><thead><tr><th>Classement</th><th>Fournisseur</th><th>N° échantillon</th><th>Score</th><th>Note /5</th></tr></thead><tbody>"+body+"</tbody></table>"+
        "<div class='supplier-grid'>"+(cards||"<div class='empty-box'>Aucun commentaire enregistré.</div>")+"</div>"+
      "</section>";
    }).join("");
  }

  function occenaSupplierKeyV311Report(name){
    return String(name||"")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  }
  function occenaSupplierScoreV311Report(st,name){
    var data=st&&st.config&&st.config.occenaControl||{};
    var scores=data.supplierScores&&typeof data.supplierScores==="object"?data.supplierScores:{};
    return String(scores[occenaSupplierKeyV311Report(name)]||"").trim();
  }

  function lotReport(st){
    var products=st&&st.config&&st.config.products||[];
    var rows=lotSupplierRows(st);
    var heads=products.map(function(p){return "<th>"+esc(p.name||"Produit")+"</th>";}).join("");
    var body=rows.map(function(r){
      var cells=products.map(function(p,pi){
        var x=r.perProduct[pi];
        return "<td class='score'>"+(x?n(x.total,0):"—")+"</td>";
      }).join("");
      var occena=occenaSupplierScoreV311Report(st,r.supplier);
      return "<tr><td class='rank'>"+r.rank+"</td><td><strong>"+esc(r.supplier)+"</strong></td>"+cells+"<td class='score'>"+n(r.total,0)+" / "+n(r.max,0)+"</td><td class='score lot-note5'>"+n(r.note5,2)+"</td><td class='score'>"+(occena?esc(occena):"—")+"</td></tr>";
    }).join("");
    var note=String(st&&st.config&&st.config.reportNote||"").trim();
    var conclusion=String(st&&st.config&&st.config.juryConclusion||"").trim();
    var names=products.map(function(p){return p.name||"Produit";}).join(", ");

    return "<section class='report-page page-break lot-summary-page'>"+
      "<div class='page-kicker'>Synthèse du lot</div>"+
      "<h2>Résultats complets — "+esc(names)+"</h2>"+
      "<table class='lot-table'><thead><tr><th>Classement</th><th>Fournisseur</th>"+heads+"<th>Total</th><th>Note /5</th><th>OCCENA</th></tr></thead><tbody>"+body+"</tbody></table>"+
      "<p class='calculation-note'>La note sur 5 est calculée automatiquement : total obtenu ÷ total maximal × 5.</p>"+
      (conclusion?"<div class='jury-conclusion'><h3>Conclusion / rapport du jury</h3><div>"+esc(conclusion).replace(/\n/g,"<br>")+"</div></div>":"")+
      (note?"<div class='technical-note'><h3>Note explicative / conformité</h3><div>"+esc(note).replace(/\n/g,"<br>")+"</div></div>":"")+
    "</section>";
  }

  function closureSheet(st){
    var c=st&&st.config&&st.config.closure||{};
    var has=!!(c.date||c.place||c.chair||c.coSigner||c.notes||c.chairSignature||c.coSignature||(c.members||[]).length);
    if(!has)return "";
    var members=(c.members||[]).filter(function(m){return m.present!==false;});
    var memberText=members.length?members.map(function(m){return esc(m.name||"Testeur")+(m.role?" · "+esc(m.role):"");}).join("<br>"):"—";
    return "<section class='report-page page-break closure-page'>"+
      "<div class='page-kicker'>Clôture administrative</div>"+
      "<h2>Fiche de clôture du jury</h2>"+
      "<p class='page-lead'>Validation administrative et traçabilité du jury.</p>"+
      "<table class='closure-table'><tbody>"+
        "<tr><th>Date de dégustation</th><td>"+esc(dateFr(c.date))+"</td><th>Lieu</th><td>"+esc(c.place||"—")+"</td></tr>"+
        "<tr><th>Responsable du jury</th><td>"+esc(c.chair||"—")+"</td><th>Fonction</th><td>"+esc(c.chairRole||"—")+"</td></tr>"+
        "<tr><th>Second signataire</th><td>"+esc(c.coSigner||"—")+"</td><th>Fonction</th><td>"+esc(c.coSignerRole||"—")+"</td></tr>"+
        "<tr><th>Membres présents</th><td colspan='3'>"+memberText+"</td></tr>"+
        "<tr><th>Observations générales</th><td colspan='3'>"+(c.notes?esc(c.notes).replace(/\n/g,"<br>"):"Aucune observation générale.")+"</td></tr>"+
      "</tbody></table>"+
      "<div class='closure-signs'>"+
        "<div><strong>Responsable du jury</strong><span>"+esc(c.chair||"—")+"</span>"+(c.chairSignature?"<img src='"+c.chairSignature+"' alt='Signature du responsable'>":"<em>Signature non renseignée</em>")+"</div>"+
        "<div><strong>Second signataire</strong><span>"+esc(c.coSigner||"—")+"</span>"+(c.coSignature?"<img src='"+c.coSignature+"' alt='Signature du second signataire'>":"<em>Signature non renseignée</em>")+"</div>"+
      "</div>"+
    "</section>";
  }

  function sampleSheets(st){
    var pages=[];
    var products=st&&st.config&&st.config.products||[];

    products.forEach(function(p,pi){
      var samples=p.samples||[];
      for(var offset=0;offset<samples.length;offset+=3){
        var group=samples.slice(offset,offset+3);
        var cards=group.map(function(sm){
          var rec=typeof ensureProductSheetRecord==="function"?ensureProductSheetRecord(st,p,sm):{};
          var ss=typeof productSheetStats==="function"?productSheetStats(st,p,sm):{count:0,avg65:0,note5:0,criteria:[]};
          var comments=commentsForSample(st,p,sm);
          var criteria=(ss.criteria||[]).map(function(c){
            return esc(c.name)+" : "+(ss.count?n(c.avg,2)+"/"+n(c.max,0):"—");
          }).join(" · ");
          var reception=rec.receptionFound
            ?dateFr(rec.receptionDate)+" "+(rec.receptionTime||"")+" · T° véhicule "+temp(rec.receptionVehicleTemp)+" · T° produit "+temp(rec.deliveryTemp)+" · "+(rec.receptionDecision==="refus"?"Refus":"Acceptation")
            :"—";

          return "<article class='sample-card'>"+
            "<div class='sample-card-head'><div><strong>"+esc(sm.supplier||"Fournisseur")+"</strong><span>"+esc(p.name||("Produit "+(pi+1)))+" · Échantillon "+esc(sm.id||"—")+"</span></div><div class='sample-note'><small>Note /5</small><b>"+(ss.count?n(ss.note5,2):"—")+"</b></div></div>"+
            "<table class='sample-meta'><tbody>"+
              "<tr><th>Marque</th><td>"+esc(rec.brand||"—")+"</td><th>Poids / grammage</th><td>"+esc(rec.weight||"—")+"</td></tr>"+
              "<tr><th>Caractéristiques</th><td colspan='3'>"+esc(rec.characteristics||"—")+"</td></tr>"+
              "<tr><th>Étiquetage</th><td>"+esc(yn(rec.labeling))+"</td><th>N° lot fournisseur</th><td>"+esc(rec.supplierLot||"—")+"</td></tr>"+
              "<tr><th>Fiche technique</th><td>"+esc(yn(rec.technicalSheet))+"</td><th>T° livraison conforme</th><td>"+esc(yn(rec.deliveryTempConformity))+(String(rec.deliveryTemp||"").trim()?" · "+esc(temp(rec.deliveryTemp)):"")+"</td></tr>"+
              "<tr><th>Emballage</th><td>"+esc(yn(rec.packagingConformity))+"</td><th>Date fabrication</th><td>"+esc(rec.manufacturingDate?dateFr(rec.manufacturingDate):"—")+"</td></tr>"+
              "<tr><th>DDM</th><td>"+esc(rec.ddm?dateFr(rec.ddm):"—")+"</td><th>DLC</th><td>"+esc(rec.dlc?dateFr(rec.dlc):"—")+"</td></tr>"+
              "<tr><th>Observations</th><td colspan='3'>"+esc(rec.observations||"RAS")+"</td></tr>"+
              "<tr><th>Réception</th><td colspan='3'>"+esc(reception)+"</td></tr>"+
            "</tbody></table>"+
            "<div class='sample-sensory-line'><strong>Résultat sensoriel : "+(ss.count?n(ss.avg65,2)+" / 65":"—")+"</strong><span>"+esc(criteria||"—")+"</span></div>"+
            "<div class='sample-comments'><strong>Appréciations / remarques</strong>"+(comments.length?"<span>"+comments.map(esc).join(" · ")+"</span>":"<span>RAS</span>")+"</div>"+
          "</article>";
        }).join("");

        pages.push("<section class='report-page page-break sample-page'>"+
          "<div class='page-kicker'>Fiches d’évaluation des échantillons · "+(pi+1)+" / "+products.length+"</div>"+
          "<h2>"+esc(p.name||("Produit "+(pi+1)))+"</h2>"+
          "<p class='page-lead'>Trois fiches maximum par page. La note sur 5 est mise en évidence.</p>"+
          "<div class='sample-stack'>"+cards+"</div>"+
        "</section>");
      }
    });

    return pages.join("");
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
    return "<section class='report-page page-break attendance-page'>"+
      "<div class='page-kicker'>Émargement</div>"+
      "<h2>Émargement des testeurs</h2>"+
      "<p class='page-lead'>Feuille de présence et signatures des membres du jury.</p>"+
      "<table class='attendance-table'><thead><tr><th>N°</th><th>Nom</th><th>Fonction / établissement</th><th>Présence</th><th>Signature</th></tr></thead><tbody>"+body+"</tbody></table>"+
      "<div class='jury-signs'>"+
        "<div><strong>Responsable / président du jury</strong><span>"+esc(c.chair||"—")+"</span>"+(c.chairSignature?"<img src='"+c.chairSignature+"' alt='Signature responsable'>":"")+"</div>"+
        "<div><strong>Second signataire</strong><span>"+esc(c.coSigner||"—")+"</span>"+(c.coSignature?"<img src='"+c.coSignature+"' alt='Signature second signataire'>":"")+"</div>"+
      "</div>"+
    "</section>";
  }

  function occenaReportV290(st){
    var cfg=st&&st.config||{};
    var data=cfg.occenaControl&&typeof cfg.occenaControl==="object"?cfg.occenaControl:{items:{},globalScore:""};
    var items=data.items&&typeof data.items==="object"?data.items:{};
    var rows=[];
    (cfg.products||[]).forEach(function(p){
      (p.samples||[]).forEach(function(sm){
        var key=String(p.id||p.name||"produit")+"__"+String(sm.id||sm.supplier||"echantillon");
        var rec=items[key]||{},status=String(rec.status||"pending");
        var initial=String(rec.initialScore==null?"":rec.initialScore).trim();
        var corrected=String(rec.correctedScore==null?"":rec.correctedScore).trim();
        var complete=(status==="conforme"&&!!initial)||(status==="corrige"&&!!initial&&!!corrected);
        rows.push({product:String(p.name||"Article"),supplier:String(sm.supplier||"Fournisseur"),sample:String(sm.id||"—"),status:status,initial:initial,corrected:corrected,observation:String(rec.observation||""),complete:complete});
      });
    });
    (Array.isArray(data.customRows)?data.customRows:[]).forEach(function(r){
      if(!r||!r.id)return;
      var key="custom__"+String(r.id);
      var rec=items[key]||{},status=String(rec.status||"pending");
      var initial=String(rec.initialScore==null?"":rec.initialScore).trim();
      var corrected=String(rec.correctedScore==null?"":rec.correctedScore).trim();
      var complete=(status==="conforme"&&!!initial)||(status==="corrige"&&!!initial&&!!corrected);
      rows.push({
        product:String(r.productName||"Article ajouté"),
        supplier:String(r.supplier||"Fournisseur"),
        sample:String(r.sampleId||"Ajout manuel"),
        status:status,
        initial:initial,
        corrected:corrected,
        observation:String(rec.observation||""),
        complete:complete
      });
    });
    var checked=rows.filter(function(x){return x.complete;}).length,total=rows.length,bySupplier={};
    rows.forEach(function(r){
      if(!bySupplier[r.supplier])bySupplier[r.supplier]={supplier:r.supplier,checked:0};
      if(r.complete)bySupplier[r.supplier].checked++;
    });
    var supplierRows=Object.keys(bySupplier).sort(function(a,b){return a.localeCompare(b,"fr");}).map(function(k){return bySupplier[k];});
    var required=supplierRows.length*5;
    var credited=supplierRows.reduce(function(n,x){return n+Math.min(x.checked,5);},0);
    var pct=required?Math.round(credited/required*1000)/10:0,reached=supplierRows.length>0&&supplierRows.every(function(x){return x.checked>=5;});
    var supplierScores=data.supplierScores&&typeof data.supplierScores==="object"?data.supplierScores:{};
    var supplierScoreBody=supplierRows.map(function(x){
      var key=occenaSupplierKeyV311Report(x.supplier);
      var score=String(supplierScores[key]||"").trim();
      return "<tr><td><strong>"+esc(x.supplier)+"</strong></td><td class='score'>"+(score?esc(score):"—")+"</td></tr>";
    }).join("");
    var body=rows.map(function(r){
      var statusLabel=r.status==="conforme"?"Conforme":r.status==="corrige"?"Corrigé":"Non contrôlé";
      var retained=r.status==="corrige"?(r.corrected||"—"):(r.initial||"—");
      return "<tr class='"+(r.complete?"occena-checked":"")+"'><td>"+esc(r.product)+"</td><td><strong>"+esc(r.supplier)+"</strong><br><span>Éch. "+esc(r.sample)+"</span></td><td>"+esc(r.initial||"—")+"</td><td>"+esc(statusLabel)+"</td><td><strong>"+esc(retained)+"</strong></td><td>"+esc(r.observation||"—")+"</td></tr>";
    }).join("");
    return "<section class='report-page page-break occena-report-page'>"+
      "<div class='page-kicker'>Contrôle OCCENA</div><h2>Contrôle des scores OCCENA</h2>"+
      "<p class='page-lead'>Vérification de 5 fiches par fournisseur. Le score OCCENA est présenté à titre informatif et n’intervient dans aucun calcul de classement ou de note dans cette application.</p>"+
      "<div class='occena-report-summary'><div><small>Fiches contrôlées</small><strong>"+checked+"</strong></div><div><small>Fournisseurs</small><strong>"+supplierRows.length+"</strong></div><div><small>Règle</small><strong>5 fiches / fournisseur</strong></div><div class='"+(reached?"ok":"wait")+"'><small>Contrôle</small><strong>"+(reached?"Complet ✓":"À compléter")+"</strong></div></div>"+
      "<table class='occena-report-table'><thead><tr><th>Article</th><th>Fournisseur / échantillon</th><th>Score initial</th><th>Contrôle</th><th>Score retenu</th><th>Correction / observation</th></tr></thead><tbody>"+(body||"<tr><td colspan='6'>Aucun article enregistré.</td></tr>")+"</tbody></table>"+
      "<h3 style='margin:16px 0 6px;color:#173f5c'>Scores OCCENA par fournisseur</h3>"+
      "<table class='occena-report-table'><thead><tr><th>Fournisseur</th><th>Score OCCENA</th></tr></thead><tbody>"+(supplierScoreBody||"<tr><td colspan='2'>Aucun fournisseur.</td></tr>")+"</tbody></table>"+
      "<div class='occena-report-warning'><strong>Important :</strong> ces scores sont saisis manuellement et n’interviennent dans aucun calcul de classement ou de note.</div>"+
    "</section>";
  }

  function dossierHtml(st,sourceLabel){
    var cfg=st.config||{},cl=cfg.closure||{};
    var generated=new Date();
    var complete=typeof stateValidatedCount==="function"?stateValidatedCount(st):0;
    var final=!!(cfg.juryClose&&cfg.juryClose.closedAt)&&complete===Number(cfg.testerCount||0);
    var status=final?"Rapport définitif":"Rapport provisoire";
    var products=cfg.products||[];
    var productNames=products.map(function(p){return p.name||"Article";});
    var testerCount=Number(cfg.testerCount||0);

    var cover="<main class='report-page cover'>"+
      "<div class='cover-topline'><span>JURY MARCHÉS · TESTS CULINAIRES</span><span>"+esc(sourceLabel||"Jury")+"</span></div>"+
      "<div class='cover-center'>"+
        "<div class='cover-eyebrow'>DOSSIER RÉSULTATS</div>"+
        "<h1>Rapport sensoriel — "+esc(cfg.lotName||"Jury Marchés")+"</h1>"+
        "<h2>"+esc(productNames.join(" · "))+"</h2>"+
        "<div class='cover-rule'></div>"+
        "<div class='cover-intro'>"+
          "<p><strong>Organisation du test :</strong> "+testerCount+" testeur"+(testerCount>1?"s":"")+" évalue"+(testerCount>1?"nt":"")+" les "+products.length+" article"+(products.length>1?"s":"")+" du lot selon le même barème sensoriel.</p>"+
          "<p><strong>Barème :</strong> Couleur 10 · Texture 10 · Aspect visuel 10 · Odeur 10 · Goût 25.</p>"+
          "<p><strong>Validation du rapport :</strong> "+(final?"rapport définitif après validation de l’ensemble des testeurs.":"rapport provisoire tant que tous les testeurs n’ont pas terminé et validé leur test.")+"</p>"+
          (cfg.marketRef&&cfg.marketRef.lot?"<p><strong>Référence marché :</strong> lot "+esc(cfg.marketRef.lot)+(cfg.marketRef.family?" · "+esc(cfg.marketRef.family):"")+".</p>":"")+
        "</div>"+
        "<div class='correspondence-title'><span></span><strong>Tableau récapitulatif — Fournisseurs / numéros d’échantillons</strong><span></span></div>"+
        reportCorrespondenceV287(st)+
        "<p class='cover-note'>Les mêmes testeurs participent à l’ensemble des articles du lot afin de rendre la comparaison cohérente.</p>"+
      "</div>"+
      "<footer><span>"+esc(status)+"</span><span>Généré le "+esc(generated.toLocaleString("fr-FR"))+"</span></footer>"+
    "</main>";

    var css=
      "@page{size:A4 portrait;margin:10mm}"+
      "*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}"+
      "html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;background:#e9eef2;color:#223746;font-size:9px;line-height:1.35}"+
      ".toolbar{position:sticky;top:0;z-index:50;background:#173f5c;color:#fff;padding:9px 13px;display:flex;justify-content:space-between;align-items:center;gap:10px}.toolbar-actions{display:flex;gap:8px;align-items:center}.toolbar button{border:0;border-radius:8px;padding:8px 12px;font-weight:800;cursor:pointer}.toolbar .back-home{background:#eef4f7;color:#173f5c}.toolbar .print-dossier{background:#fff;color:#173f5c}"+
      ".report-page{max-width:190mm;min-height:267mm;margin:14px auto;background:#fff;padding:15mm 13mm 12mm;box-shadow:0 10px 30px rgba(20,47,67,.10);position:relative}"+
      ".page-break{break-before:page;page-break-before:always}"+
      ".page-kicker,.cover-eyebrow{font-size:8px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#2c6f93}"+
      ".report-page h2{font-size:25px;line-height:1.15;margin:7px 0 5px;color:#173f5c}.page-lead{margin:0 0 15px;color:#667b89;font-size:9px}"+
      ".cover{display:flex;flex-direction:column;justify-content:space-between;padding-top:13mm}.cover-topline{display:flex;justify-content:space-between;gap:12px;font-size:7.5px;font-weight:800;letter-spacing:.08em;color:#607786;border-bottom:2px solid #173f5c;padding-bottom:7px}.cover-center{padding-top:25mm}.cover-eyebrow{text-align:center}.cover h1{text-align:center;font-size:30px;line-height:1.15;color:#173f5c;margin:9px 0 8px}.cover h2{text-align:center;font-size:15px;font-weight:600;color:#526b7a;margin:0}.cover-rule{width:60mm;height:3px;background:#2c7ea8;margin:18px auto 23px}.cover-intro{max-width:160mm;margin:0 auto 22px;border:1.5px solid #9fb8c8;border-left:5px solid #2c7ea8;border-radius:8px;padding:11px 13px;color:#334f61}.cover-intro p{margin:4px 0}.cover-intro strong{color:#173f5c}.correspondence-title{display:flex;align-items:center;gap:10px;margin:18px 0 9px;text-align:center;color:#173f5c}.correspondence-title span{height:1px;background:#8da8b9;flex:1}.correspondence-title strong{font-size:10px}.cover-note{text-align:center;font-size:7.5px;color:#6c7f8a;margin-top:8px}.cover footer{display:flex;justify-content:space-between;border-top:1.5px solid #9fb8c8;padding-top:7px;color:#6d808d;font-size:7.5px}"+
      "table{width:100%;border-collapse:collapse}th,td{border:1.2px solid #9fb0bb;padding:5px 6px;vertical-align:middle}th{background:#dfe9ef;color:#173f5c;font-size:7px;text-transform:uppercase;font-weight:900}.correspondence-table{font-size:8px}.correspondence-table th{padding:7px}.correspondence-table th span{font-size:6.5px}.correspondence-table td{text-align:center}.correspondence-table td:first-child{text-align:left;color:#173f5c}"+
      ".ranking-table{margin-top:14px;font-size:8.2px}.ranking-table th{padding:7px 5px}.ranking-table td{padding:7px 5px;text-align:center}.ranking-table td:nth-child(2){text-align:left}.rank{font-weight:900;text-align:center}.score{font-weight:800;text-align:right}.note5-cell,.lot-note5{font-size:11px;color:#0d638f;font-weight:900}.product-code{font-size:8px;color:#718490;margin-bottom:8px}"+
      ".supplier-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px;align-items:start}.supplier-card{border:1.4px solid #aac0cf;border-radius:8px;overflow:hidden;background:#fff;break-inside:avoid;page-break-inside:avoid}.supplier-card-head{display:flex;justify-content:space-between;gap:8px;align-items:baseline;padding:7px 9px;background:#dfeaf0;border-bottom:1px solid #b7cbd8;color:#174f78}.supplier-card-head strong{font-size:10px}.supplier-card-head span{font-size:7.5px;color:#526f84}.comment-block{padding:6px 9px;border-top:1px solid #d4e0e7;min-height:30px}.comment-block:first-of-type{border-top:0}.comment-block h4{margin:0 0 3px;font-size:8px}.comment-block.positive h4{color:#257451}.comment-block.negative h4{color:#a53f3f}.comment-block.manual h4{color:#506a7c}.comment-block ul{margin:2px 0 0 14px;padding:0;font-size:7.5px}.comment-block li{margin:1px 0}.comment-empty{font-size:7px;color:#82919a;font-style:italic}.density-compact .supplier-grid{gap:7px}.density-compact .supplier-card-head{padding:5px 7px}.density-compact .comment-block{padding:4px 7px;min-height:24px}.density-compact .comment-block ul{font-size:6.8px}.density-dense .supplier-grid{gap:5px}.density-dense .supplier-card-head{padding:4px 6px}.density-dense .supplier-card-head strong{font-size:8.5px}.density-dense .comment-block{padding:3px 6px;min-height:20px}.density-dense .comment-block h4{font-size:7px}.density-dense .comment-block ul{font-size:6.1px;line-height:1.2}"+
      ".lot-summary-page{padding-top:19mm}.lot-table{font-size:7.5px;margin-top:16px}.lot-table th{padding:7px 4px}.lot-table td{padding:8px 4px}.calculation-note{font-size:7.5px;color:#6c7f8a;margin:8px 0 0}.jury-conclusion,.technical-note{margin-top:18px;border:1.5px solid #9fb8c8;border-radius:9px;padding:12px 14px;background:#f3f7f9}.jury-conclusion{border-left:5px solid #2c7ea8}.technical-note{border-left:5px solid #687f8e}.jury-conclusion h3,.technical-note h3{margin:0 0 7px;color:#173f5c;font-size:11px}.jury-conclusion div,.technical-note div{font-size:9px;line-height:1.5}"+
      ".closure-page{padding-top:20mm}.closure-table{font-size:9px;margin-top:18px}.closure-table th{width:19%;text-align:left;padding:8px}.closure-table td{text-align:left;padding:8px}.closure-signs{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}.closure-signs>div{border:1.5px solid #9fb8c8;border-radius:9px;padding:10px;min-height:38mm}.closure-signs strong,.closure-signs span{display:block}.closure-signs strong{color:#173f5c}.closure-signs span{color:#6d7e89;margin-top:3px}.closure-signs img{display:block;max-width:75mm;max-height:23mm;margin-top:6px}.closure-signs em{display:block;color:#8a989f;margin-top:8px}"+
      ".reception-page{padding-top:16mm}.reception-stack{display:grid;gap:9px}.reception-card{border:1.4px solid #9fb8c8;border-radius:8px;overflow:hidden;break-inside:avoid;page-break-inside:avoid}.reception-head{display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:6px 8px;background:#dfeaf0;border-bottom:1px solid #b7cbd8;color:#174f78}.reception-head strong{display:block;font-size:9.5px}.reception-head span{display:block;font-size:6.5px;color:#6c8190}.reception-head b{font-size:7px}.reception-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-bottom:1px solid #c6d5de}.reception-meta div{padding:4px 6px;border-right:1px solid #d2dfe6}.reception-meta div:last-child{border-right:0}.reception-meta small{display:block;font-size:5.8px;text-transform:uppercase;color:#748894}.reception-meta strong{display:block;font-size:6.8px;color:#334f61;margin-top:1px}.reception-table{font-size:5.9px}.reception-table th,.reception-table td{padding:3px 2px}.reception-table .decision{font-weight:800}.reception-sign{display:flex;align-items:center;gap:10px;min-height:22px;padding:3px 7px;border-top:1px solid #c6d5de}.reception-sign strong{font-size:6.5px;color:#526f84}.sig-img.compact{max-width:35mm;max-height:10mm}.sig-missing{font-size:6px;color:#89969e}.reception-count-3 .reception-stack{gap:6px}.reception-count-3 .reception-head{padding:4px 7px}.reception-count-3 .reception-meta div{padding:3px 5px}.reception-count-3 .reception-table{font-size:5.3px}"+
      ".sample-page{padding-top:13mm}.sample-stack{display:grid;gap:7px}.sample-card{border:1.4px solid #9fb8c8;border-radius:8px;overflow:hidden;break-inside:avoid;page-break-inside:avoid;background:#fff}.sample-card-head{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#dfeaf0;border-bottom:1px solid #b7cbd8;padding:5px 8px}.sample-card-head>div:first-child strong{display:block;color:#174f78;font-size:9px}.sample-card-head>div:first-child span{display:block;color:#637b8a;font-size:6.5px}.sample-note{min-width:26mm;text-align:center;border-left:1px solid #aac0cf}.sample-note small{display:block;font-size:6px;text-transform:uppercase;color:#617789}.sample-note b{display:block;font-size:17px;line-height:1.05;color:#0d638f}.sample-meta{font-size:5.9px}.sample-meta th,.sample-meta td{padding:2.7px 3px;text-align:left}.sample-meta th{width:19%;background:#edf3f6}.sample-sensory-line{padding:4px 7px;border-top:1px solid #c6d5de;background:#f5f8fa}.sample-sensory-line strong{display:block;font-size:6.8px;color:#173f5c}.sample-sensory-line span{display:block;font-size:5.8px;color:#607786;margin-top:1px}.sample-comments{padding:3px 7px;border-top:1px solid #d5e0e6;font-size:5.8px}.sample-comments strong{color:#526f84;margin-right:5px}.sample-comments span{color:#4d626f}"+
      ".attendance-page{padding-top:18mm}.attendance-table{margin-top:16px;font-size:8px}.attendance-table th{padding:7px}.attendance-table td{padding:7px}.member-sign-cell{height:17mm;min-width:35mm}.member-sign-img{display:block;max-width:32mm;max-height:14mm;margin:auto}.member-sign-blank{height:13mm}.jury-signs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.jury-signs>div{border:1.5px solid #9fb8c8;border-radius:8px;min-height:28mm;padding:8px}.jury-signs strong,.jury-signs span{display:block}.jury-signs img{display:block;max-width:65mm;max-height:20mm;margin-top:5px}.empty-box{border:1.5px solid #9fb8c8;border-radius:8px;padding:15px;color:#6c7f8a;margin-top:18px}"+      ".occena-report-page{padding-top:17mm}.occena-report-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:14px 0}.occena-report-summary>div{border:1.4px solid #9fb8c8;border-radius:8px;padding:8px;background:#f4f8fa}.occena-report-summary small{display:block;font-size:6.5px;text-transform:uppercase;color:#6b7f8b}.occena-report-summary strong{display:block;font-size:13px;color:#173f5c;margin-top:3px}.occena-report-summary .ok{border-color:#8dc3a5;background:#edf8f1}.occena-report-summary .ok strong{color:#137653}.occena-report-summary .wait{border-color:#d6b87e;background:#fff7e8}.occena-report-summary .wait strong{color:#8a5900}.occena-report-table{font-size:6.8px}.occena-report-table th{padding:5px 3px}.occena-report-table td{padding:5px 4px}.occena-report-table td span{font-size:5.8px;color:#6e818d}.occena-global-report{margin-top:16px;border:2px solid #9fb8c8;border-left:6px solid #2c7ea8;border-radius:9px;padding:11px 13px;display:flex;justify-content:space-between;align-items:center;gap:15px}.occena-global-report small{display:block;font-size:7px;text-transform:uppercase;color:#6c7f8a}.occena-global-report strong{display:block;font-size:24px;color:#0d638f;margin-top:2px}.occena-global-report p{margin:0;max-width:115mm;color:#526b7a;font-size:8px}.occena-global-report.disabled{border-left-color:#a9b4ba}.occena-global-report.disabled strong{color:#7e8c94}.occena-report-warning{margin-top:10px;padding:8px 10px;border:1px solid #d4dde2;border-radius:7px;background:#f7f9fa;color:#5b6c77;font-size:7px}"+
      "@media print{body{background:#fff}.toolbar{display:none!important}.report-page{max-width:none;min-height:277mm;margin:0;padding-left:10mm;padding-right:10mm;box-shadow:none;break-after:auto}.page-break{break-before:page;page-break-before:always}.cover{padding-top:12mm}.cover-center{padding-top:20mm}th,.supplier-card-head,.reception-head,.sample-card-head,.jury-conclusion,.technical-note,.sample-sensory-line{ -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}"+
      "}";

    return "<!doctype html><html lang='fr'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Dossier résultats — "+esc(cfg.lotName||"Jury")+"</title><style>"+css+"</style></head><body>"+
      "<div class='toolbar'><strong>Dossier résultats · NOUVELLE PRÉSENTATION v295 · "+esc(cfg.lotName||"Jury")+"</strong><div class='toolbar-actions'><button class='back-home' onclick='if(window.opener&&!window.opener.closed){window.opener.focus();window.close();}else{history.back();}'>← Retour à l’accueil</button><button class='print-dossier' onclick='window.print()'>Imprimer / Enregistrer tout le dossier en PDF</button></div></div>"+
      cover+
      productReports(st)+
      lotReport(st)+
      closureSheet(st)+
      receptionSheets(st)+
      sampleSheets(st)+
      attendance(st)+
      occenaReportV290(st)+
      "</body></html>";
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
    if(!st||!st.config||((st.config.products||[]).length===0)){
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

  function hardBindDossierButtonV288(id){
    var oldBtn=document.getElementById(id);
    if(!oldBtn)return;
    var btn=oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(btn,oldBtn);
    btn.onclick=function(e){
      if(e){e.preventDefault();e.stopPropagation();}
      openJuryDossier(state,"Jury actif");
      return false;
    };
    if(id==="simpleResultsPdfBtn")btn.textContent="📚 3. Dossier résultats";
  }

  function rebind(){
    var closure=document.getElementById("closureBtn");
    if(closure)closure.onclick=function(){renderClosure();};
    var simpleClosure=document.getElementById("simpleResultsClosureBtn");
    if(simpleClosure)simpleClosure.onclick=function(){renderClosure();};

    /* V288 — liaison dure : on supprime les anciens gestionnaires qui pouvaient
       encore ouvrir le générateur « Rapport final » au lieu du Dossier résultats. */
    hardBindDossierButtonV288("simpleResultsPdfBtn");
    hardBindDossierButtonV288("dossierBtn");

    if(document.getElementById("closureView")&&document.getElementById("closureView").classList.contains("active"))setTimeout(addMemberSignatures,40);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",rebind);
  else rebind();
  setTimeout(rebind,700);
})();