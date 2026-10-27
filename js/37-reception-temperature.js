/* Reception controls: product limits are distinct from vehicle-air targets. */
(function(){
  'use strict';
  const rules={
    surgele:{label:'Surgelé',max:-18,tolerance:-15,help:'Produit : −18 °C ou plus froid. Entre −18 et −15 °C : seulement un écart bref de transport vérifié selon le PMS et le marché. Plus chaud que −15 °C : acceptation bloquée.'},
    glace:{label:'Glaces / crèmes glacées',max:-18,help:'Maximum −18 °C. Pas de tolérance automatique dans cette application.'},
    poissonCongele:{label:'Poisson congelé',max:-18,help:'Maximum −18 °C (hors poissons entiers en saumure destinés à la conserve).'},
    viandeCongelee:{label:'Viande hachée / préparation de viande congelée',max:-18,help:'Maximum −18 °C. Pas de tolérance automatique dans cette application.'},
    congele12:{label:'Autre denrée congelée : limite −12 °C',max:-12,help:'Seulement les catégories autorisées à −12 °C. Un produit étiqueté « surgelé » reste à −18 °C. Viandes hachées et préparations de viande congelées : choisir la limite −18 °C.'},
    refrigere2:{label:'Réfrigéré : limite +2 °C',max:2,help:'Exemples : viande hachée ; poissons frais (température de la glace fondante). Respecter une étiquette plus stricte.'},
    refrigere3:{label:'Réfrigéré : limite +3 °C',max:3,help:'Exemples : abats ; préparations culinaires élaborées à l’avance. Respecter une étiquette plus stricte.'},
    refrigere4:{label:'Réfrigéré : limite +4 °C',max:4,help:'Exemples : volaille, préparations de viande, viande en morceaux, denrées très périssables. Respecter une étiquette plus stricte.'},
    refrigere7:{label:'Carcasse / pièce de gros : limite +7 °C',max:7,help:'Viande d’ongulés domestiques ou gibier ongulé : carcasse entière ou pièce de gros uniquement. Morceaux de découpe : +4 °C.'},
    refrigere8:{label:'Autre denrée périssable : limite +8 °C',max:8,help:'Uniquement les denrées relevant de cette catégorie. Les denrées très périssables restent à +4 °C maximum.'},
    etiquette:{label:'Autre température indiquée sur l’étiquette',max:null,help:'Saisir la température maximale de l’étiquette. Elle ne peut pas assouplir un seuil réglementaire : sélectionner d’abord la catégorie réglementaire si elle existe.'},
    ambiant:{label:'Ambiant / épicerie sèche',max:null,help:'Pas de seuil de froid appliqué. Vérifier les conditions de conservation de l’étiquette.'}
  };
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function infer(cfg,line){return /\bsurgele(?:e|s|es)?\b/.test(norm([cfg?.lotName,cfg?.subtitle,cfg?.marketRef?.family,line?.productName].join(' ')))?'surgele':'';}
  function number(value){if(value==null||String(value).trim()==='')return null;const s=String(value).trim().replace(',','.');return /^[-+]?\d+(?:\.\d+)?$/.test(s)&&Number.isFinite(Number(s))?Number(s):NaN;}
  function evaluate(line,vehicleTemp,cfg={}){
    const category=String(line.temperatureCategory||''),rule=rules[category];
    if(!rule)return {level:'missing',message:'Choisissez la catégorie de conservation du produit.'};
    if(category==='ambiant')return infer(cfg,line)==='surgele'?{level:'danger',message:'Le lot ou le produit est indiqué surgelé : choisir une catégorie à −18 °C ou plus froid.'}:{level:'neutral',message:rule.help};
    const labelLimit=number(line.temperatureLabelMax);
    if(String(line.temperatureLabelMax??'').trim()&&(labelLimit===null||!Number.isFinite(labelLimit)||labelLimit< -40||labelLimit>10))return {level:'missing',message:'La limite de l’étiquette doit être un nombre entre −40 et +10 °C.'};
    if(category==='etiquette'&&labelLimit===null)return {level:'missing',message:'Indiquez la température maximale de l’étiquette.'};
    const limit=labelLimit===null?rule.max:rule.max===null?labelLimit:Math.min(rule.max,labelLimit);
    if(infer(cfg,line)==='surgele'&&limit> -18)return {level:'danger',message:'Le lot ou le produit est indiqué surgelé : maximum −18 °C. Cette catégorie ou cette étiquette ne peut pas assouplir le seuil.'};
    const values=[line.productTemp,line.interiorTemp].map(number);
    if(values.some(v=>v!==null&&(!Number.isFinite(v)||v< -60||v>100)))return {level:'missing',message:'Température mesurée invalide : saisir un nombre entre −60 et +100 °C.'};
    const measured=values.filter(v=>v!==null);
    if(!measured.length)return {level:'missing',message:'Renseignez au moins une température mesurée du produit.'};
    if(!['sonde-contact','sonde-coeur','infrarouge'].includes(line.temperatureMethod))return {level:'missing',message:'Précisez la méthode de mesure du produit.'};
    const warmest=Math.max(...measured),air=number(vehicleTemp);
    if(air===null||!Number.isFinite(air)||air< -60||air>100)return {level:'missing',message:'Renseignez une température valide de l’air du compartiment du camion.'};
    const base={limit,warmest,air};
    if(warmest>limit){
      const brief=category==='surgele'&&limit===-18&&warmest<=-15;
      return {...base,level:brief?'warning':'danger',message:brief?'Écart au seuil de −18 °C : contrôler à la sonde et vérifier que l’écart de transport est bref. Acceptation seulement si le PMS et le marché l’autorisent.':'Température supérieure au maximum de '+limit+' °C : acceptation bloquée. Contrôlez la mesure ; si elle est confirmée, enregistrez un refus.'};
    }
    if((category.startsWith('refrigere')||(category==='etiquette'&&limit>=0))&&Math.min(...measured)<0)return {...base,level:'warning',message:'Température négative pour une denrée déclarée réfrigérée : vérifiez la mesure et un éventuel début de congélation selon la nature du produit et le PMS.'};
    if(category==='surgele'&&air> -18)return {...base,level:'warning',airOnly:true,message:'Le produit respecte le seuil, mais l’air du camion dépasse −18 °C. Vérifiez le compartiment et l’historique du transport avant de décider.'};
    return {...base,level:'ok',message:'Température dans le seuil de '+limit+' °C. Vérifiez aussi l’emballage, les dates et l’état du produit.'};
  }
  function allowed(line,result){
    if(line.received===false||line.decision==='refus')return true;
    if(!['acceptation'].includes(line.decision))return false;
    if(['ok','neutral'].includes(result.level))return true;
    return result.level==='warning'&&line.temperatureDeviationVerified===true&&['sonde-contact','sonde-coeur'].includes(line.temperatureMethod)&&String(line.temperatureResponsible||'').trim().length>=2&&String(line.temperatureJustification||'').trim().length>=10;
  }
  function notes(line){const t=line.temperatureControl;if(!t)return '';return [rules[line.temperatureCategory]?.label,'limite '+(t.limit??'sans seuil de froid')+(t.limit==null?'':' °C'),line.temperatureMethod,t.level==='warning'?(line.temperatureDeviationVerified?'écart vérifié':'écart constaté'):t.level==='danger'?'hors seuil':t.level==='ok'?'dans le seuil':'',line.temperatureJustification?'Justification : '+line.temperatureJustification:'',line.temperatureResponsible?'Décision : '+line.temperatureResponsible:''].filter(Boolean).join(' · ');}
  function appendPdf(doc,st){
    const rows=(st.config?.receptions||[]).flatMap(rec=>(rec.lines||[]).filter(line=>line.received!==false&&line.temperatureControl).map(line=>({rec,line})));
    if(!rows.length)return;
    let y=280;
    function paragraph(text){for(const part of doc.splitTextToSize(String(text),180)){if(y>275){doc.addPage();y=22;doc.setFontSize(13);doc.text('Traçabilité des températures à réception',14,y);y+=10;doc.setFontSize(9);}doc.text(part,14,y);y+=5;}}
    for(const {rec,line} of rows){
      doc.setTextColor(30,55,75);doc.setFont('helvetica','normal');doc.setFontSize(9);
      paragraph((rec.date||'')+' · '+(rec.supplier||'')+' · '+(line.productName||''));
      paragraph('Air camion : '+(rec.vehicleTemp||'non mesuré')+' °C ; produit : '+(line.productTemp||'non mesuré')+' °C ; intérieur : '+(line.interiorTemp||'non mesuré')+' °C.');
      paragraph(notes(line));paragraph('Décision : '+(line.decision||'')+'. '+(line.temperatureControl.message||''));y+=7;
    }
  }
  const core={rules,infer,number,evaluate,allowed,notes};
  if(typeof module!=='undefined'&&module.exports){module.exports=core;return;}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const field=(i,key)=>document.querySelector('[data-rec-temperature-'+key+'="'+i+'"]');
  function capture(i){const val=k=>field(i,k)?.value||'';return {temperatureCategory:val('category'),temperatureLabelMax:val('label'),temperatureMethod:val('method'),temperatureDeviationVerified:!!field(i,'verified')?.checked,temperatureResponsible:val('responsible').trim(),temperatureJustification:val('reason').trim()};}
  function numeric(el){if(!el)return;const input=document.createElement('input');for(const a of el.attributes)if(a.name!=='type')input.setAttribute(a.name,a.value);input.type='number';input.step='0.1';input.min='-60';input.max='100';input.inputMode='decimal';input.value=el.value;el.replaceWith(input);}
  function render(cfg,rec,locked){
    const refreshers=[];
    const vehicle=document.getElementById('receptionVehicleTemp');if(vehicle?.tagName==='SELECT')numeric(vehicle);
    const v=document.getElementById('receptionVehicleTemp');
    let guide=document.getElementById('receptionVehicleGuideV395');
    if(v&&!guide){guide=document.createElement('div');guide.id='receptionVehicleGuideV395';guide.style.cssText='font-size:13px;background:#eef6fa;border:1px solid #cadae2;border-radius:10px;padding:10px;margin-top:8px';guide.textContent='Air du compartiment transportant ces denrées. Pour les surgelés : cible interne −20 °C ou plus froid, pas une obligation réglementaire générale. La mesure du camion ne remplace pas celle du produit. Camion multi-températures : relever le compartiment concerné.';v.after(guide);}
    rec.lines.forEach((line,i)=>{
      const card=document.querySelector('[data-reception-line="'+i+'"]');if(!card)return;
      card.querySelectorAll('[data-rec-product-temp],[data-rec-interior-temp]').forEach(numeric);
      const category=line.temperatureCategory||(locked?'':infer(cfg,line));
      const box=document.createElement('div');box.style.cssText='margin:12px 0;padding:12px;border:1px solid #cadae2;border-radius:12px;background:#f3f8fb;font-size:14px';
      box.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:12px"><label style="flex:1;min-width:200px">Conservation du produit <select data-rec-temperature-category="${i}"><option value="">— Choisir —</option>${Object.entries(rules).map(([key,r])=>`<option value="${key}">${esc(r.label)}</option>`).join('')}</select></label><label style="flex:1;min-width:180px">Maximum de l’étiquette (°C), si précisé<input type="number" step="0.1" min="-40" max="10" data-rec-temperature-label="${i}" value="${esc(line.temperatureLabelMax??'')}" placeholder="Facultatif, sauf catégorie étiquette"></label><label style="flex:1;min-width:180px">Méthode de mesure<select data-rec-temperature-method="${i}"><option value="">— Choisir —</option><option value="sonde-contact">Sonde entre emballages</option><option value="sonde-coeur">Sonde à cœur</option><option value="infrarouge">Infrarouge (dépistage)</option></select></label></div><p data-rec-temperature-help="${i}" style="margin:8px 0"></p><p role="status" aria-live="polite" data-rec-temperature-status="${i}" style="padding:8px;border-radius:8px"></p><div data-rec-temperature-deviation="${i}"><label><input type="checkbox" data-rec-temperature-verified="${i}"> J’ai vérifié les mesures et les conditions du transport ; le PMS et le marché permettent cette acceptation.</label><label>Responsable de la décision<input data-rec-temperature-responsible="${i}" value="${esc(line.temperatureResponsible||'')}"></label><label>Justification / action corrective<input data-rec-temperature-reason="${i}" value="${esc(line.temperatureJustification||'')}" placeholder="Durée de l’écart, contrôle à la sonde, vérification du transport…"></label></div><details><summary>Repères de température et sources</summary><p>Surgelés : maximum −18 °C ; une brève variation de transport jusqu’à −15 °C n’est pas une acceptation automatique. Réfrigérés : seuil selon la catégorie et l’étiquette. Une étiquette plus stricte reste prioritaire. −20 °C est plus froid que −18 °C.</p><p>Une mesure infrarouge sert au dépistage : confirmer tout écart à la sonde. Ne pas percer un emballage sans appliquer la procédure d’hygiène adaptée.</p><a href="https://agriculture.gouv.fr/securite-sanitaire-des-aliments-tout-sur-la-chaine-du-froid" target="_blank" rel="noopener">Tableau du ministère de l’Agriculture</a> · <a href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000676143" target="_blank" rel="noopener">Règles des surgelés</a></details>`;
      card.querySelector('.reception-line-grid').after(box);field(i,'category').value=category;field(i,'method').value=line.temperatureMethod||'';field(i,'verified').checked=!!line.temperatureDeviationVerified;
      function refresh(){
        const data={...line,...capture(i),productTemp:card.querySelector('[data-rec-product-temp]')?.value||'',interiorTemp:card.querySelector('[data-rec-interior-temp]')?.value||''};
        const r=evaluate(data,v?.value,cfg),status=field(i,'status');field(i,'help').textContent=rules[data.temperatureCategory]?.help||'Choisir la catégorie d’après le produit et son étiquette.';
        status.textContent=locked&&!line.temperatureControl?'Réception historique : aucun contrôle automatique enregistré à cette date.':r.message;
        status.style.background=({ok:'#e3f5e9',warning:'#fff0cd',danger:'#fde7e7',missing:'#fff0cd'})[r.level]||'#eaf0f4';
        field(i,'deviation').hidden=r.level!=='warning'&&!(locked&&line.temperatureJustification);
        const decision=card.querySelector('[data-rec-decision]'),accept=decision?.querySelector('option[value="acceptation"]');if(accept&&!locked)accept.disabled=!allowed({...data,decision:'acceptation'},r);
        if(!locked)status.textContent+=(r.level==='danger'?' Choisir « Refus » permet de conserver la température constatée.':r.level==='warning'&&!allowed({...data,decision:'acceptation'},r)?' Vérification, responsable et justification obligatoires pour accepter.':'');
      }
      card.addEventListener('input',refresh);card.addEventListener('change',refresh);refreshers.push(refresh);refresh();
    });
    if(v)v.oninput=()=>refreshers.forEach(refresh=>refresh());
  }
  function validate(rec,cfg={}){
    for(let i=0;i<rec.lines.length;i++){
      const line=rec.lines[i];if(line.received===false)continue;
      const result=evaluate(line,rec.vehicleTemp,cfg);line.temperatureControl={version:395,...result,checkedAt:new Date().toISOString()};
      if(!allowed(line,result))return {index:i,message:result.message+(result.level==='warning'?' Pour accepter : vérification à la sonde, responsable et justification d’au moins 10 caractères, selon le PMS et le marché.':'')};
    }return null;
  }
  window.ReceptionTemperatureV395={...core,render,capture,validate,appendPdf};
})();
