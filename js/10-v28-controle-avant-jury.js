/* --- V28 : contrôle avant jury --- */
let preflightReturnView='launchView';
let lastPreflightReport=null;

function preflightItem(group,key,status,title,detail,meta={}){
  return{group,key,status,title,detail,...meta}
}
function duplicateValues(arr){
  const seen=new Set(),dups=new Set();
  arr.forEach(v=>{const k=String(v||'').trim();if(!k)return;if(seen.has(k))dups.add(k);seen.add(k)});
  return [...dups]
}
async function buildPreflightReport(){
  const cfg=state.config||{},items=[];
  const products=cfg.products||[],testerCount=Number(cfg.testerCount||0);
  const testers=Array.from({length:testerCount},(_,i)=>state.testers?.[i+1]?.name||cfg.testerNames?.[i]||`Testeur ${i+1}`);
  const samples=products.flatMap(p=>(p.samples||[]).map(s=>({product:p,sample:s})));

  // Configuration
  items.push(preflightItem('config','lot',cfg.lotName&&cfg.lotName.trim()?'ok':'bad','Intitulé du jury',cfg.lotName?.trim()?cfg.lotName:'Aucun intitulé renseigné.'));
  items.push(preflightItem('config','products',products.length?'ok':'bad','Produits à tester',products.length?`${products.length} produit${products.length>1?'s':''} configuré${products.length>1?'s':''}.`:'Aucun produit configuré.'));
  const unnamedProducts=products.filter(p=>!String(p.name||'').trim());
  items.push(preflightItem('config','productNames',unnamedProducts.length?'bad':'ok','Nom des produits',unnamedProducts.length?`${unnamedProducts.length} produit(s) sans nom.`:'Tous les produits sont nommés.'));
  items.push(preflightItem('config','samples',samples.length?'ok':'bad','Échantillons',samples.length?`${samples.length} échantillon${samples.length>1?'s':''} configuré${samples.length>1?'s':''}.`:'Aucun échantillon configuré.'));
  items.push(preflightItem('config','testerCount',testerCount>0?'ok':'bad','Nombre de testeurs',testerCount>0?`${testerCount} testeur${testerCount>1?'s':''}.`:'Aucun testeur.'));
  const genericNames=testers.filter((n,i)=>!n||n===`Testeur ${i+1}`).length;
  items.push(preflightItem('config','testerNames',genericNames?'warn':'ok','Noms des testeurs',genericNames?`${genericNames} nom(s) restent génériques. Le jury peut fonctionner ainsi.`:'Tous les testeurs ont un nom personnalisé.'));

  // Blind test
  const missingSampleIds=samples.filter(x=>!String(x.sample.id||'').trim());
  items.push(preflightItem('blind','sampleIds',missingSampleIds.length?'bad':'ok','Numéros d’échantillons',missingSampleIds.length?`${missingSampleIds.length} échantillon(s) sans numéro.`:'Tous les échantillons ont un numéro.'));
  const missingSuppliers=samples.filter(x=>!String(x.sample.supplier||'').trim());
  items.push(preflightItem('blind','suppliers',missingSuppliers.length?'bad':'ok','Correspondance fournisseurs',missingSuppliers.length?`${missingSuppliers.length} échantillon(s) sans fournisseur réel.`:'Chaque échantillon est relié à un fournisseur.'));
  let dupDetails=[];
  products.forEach(p=>{
    const d=duplicateValues((p.samples||[]).map(s=>s.id));
    if(d.length)dupDetails.push(`${p.name||'Produit'} : ${d.join(', ')}`)
  });
  items.push(preflightItem('blind','duplicates',dupDetails.length?'bad':'ok','Numéros uniques par produit',dupDetails.length?`Doublons détectés — ${dupDetails.join(' · ')}`:'Aucun doublon de numéro dans un même produit.'));
  let blindLeak=false,leakText='';
  try{
    if(typeof makePublicCloudConfig==='function'){
      const pub=makePublicCloudConfig(cfg);
      blindLeak=JSON.stringify(pub).includes('"supplier"');
      if(blindLeak)leakText='La configuration publique contient encore un champ fournisseur.';
    }
  }catch(e){}
  items.push(preflightItem('blind','publicConfig',blindLeak?'bad':'ok','Fournisseurs masqués côté testeur',blindLeak?leakText:'La configuration publique ne contient pas les noms des fournisseurs.'));
  if(typeof shareUrl==='function'&&cloudCfg?.sessionId){
    let leak=false;
    for(let i=1;i<=testerCount;i++){try{if(new URL(shareUrl(i)).searchParams.has('adminToken'))leak=true}catch(e){}}
    items.push(preflightItem('blind','links',leak?'bad':'ok','Liens testeurs séparés de l’administration',leak?'Au moins un lien testeur contient une autorisation administrateur.':'Aucun lien testeur ne contient le jeton administrateur.'));
  }else{
    items.push(preflightItem('blind','links','info','Liens testeurs','Ils seront vérifiés après création de la session partagée.'));
  }

  // Security/cloud
  const sec=typeof securityEnabled==='function'&&securityEnabled();
  items.push(preflightItem('security','pin',sec?'ok':'bad','PIN administrateur',sec?'Protection administrateur activée.':'Activez la sécurité administrateur avant le partage.'));
  let codeCount=0;
  if(typeof testerAccessCode==='function')for(let i=1;i<=testerCount;i++)if(testerAccessCode(i))codeCount++;
  items.push(preflightItem('security','testerCodes',codeCount===testerCount&&testerCount>0?'ok':'warn','Codes individuels des testeurs',codeCount===testerCount&&testerCount>0?`${codeCount}/${testerCount} codes prêts.`:`${codeCount}/${testerCount} codes disponibles. Ils sont générés lors de la préparation du partage.`));
  items.push(preflightItem('security','cloud',cloudReady?'ok':'warn','Session Supabase',cloudReady?`Session connectée · rôle ${cloudRole||'—'}.`:'Aucune session partagée active sur cet appareil.'));
  items.push(preflightItem('security','adminRole',!cloudReady?'info':cloudRole==='admin'?'ok':'bad','Rôle de cet appareil',!cloudReady?'À vérifier une fois Supabase connecté.':cloudRole==='admin'?'Cet appareil est administrateur.':`Rôle actuel : ${cloudRole||'inconnu'}.`));
  let authOk=false;
  try{authOk=!!cloudClient&&!!cloudUserId}catch(e){}
  items.push(preflightItem('security','auth',!cloudReady?'info':authOk?'ok':'bad','Supabase Auth',!cloudReady?'Vérifiable après connexion à la session.':authOk?'Identité Supabase active sur cet appareil.':'Identité Supabase non détectée.'));
  const testerLinkCount=cloudReady&&cloudRole==='admin'&&typeof shareUrl==='function'?testerCount:0;
  items.push(preflightItem('security','shareLinks',testerLinkCount===testerCount&&testerCount>0?'ok':cloudReady?'warn':'info','Liens de partage',testerLinkCount===testerCount&&testerCount>0?`${testerLinkCount} lien${testerLinkCount>1?'s':''} testeur prêt${testerLinkCount>1?'s':''}.`:'Ils seront disponibles lorsque la session sécurisée sera connectée comme administrateur.'));
  const sd=(typeof serverSecurityDiagnosticV32!=='undefined')?serverSecurityDiagnosticV32:null;
  if(sd){
    const rls=sd.rls||{},core=Number(sd.version)===32&&sd.authenticated&&rls.sessions&&rls.reponses&&rls.memberships&&rls.access_codes&&Number(sd.legacy_anon_policy_count||0)===0&&sd.public_config_guard&&sd.public_config_has_supplier!==true;
    items.push(preflightItem('security','serverV32',core?'ok':'bad','Diagnostic serveur V32',core?'RLS, Auth, politiques et masquage fournisseurs vérifiés.':'Le dernier diagnostic serveur contient un point à corriger.'));
  }else items.push(preflightItem('security','serverV32','info','Diagnostic serveur V32','Dans « Partage téléphones », cliquez sur « Vérifier sécurité V32 » avant le premier vrai jury.'));

  // Device/day J
  items.push(preflightItem('device','network',navigator.onLine?'ok':'warn','Connexion réseau',navigator.onLine?'Le navigateur indique une connexion active.':'Le navigateur est hors connexion.'));
  items.push(preflightItem('device','https',location.protocol==='https:'?'ok':location.protocol==='file:'?'info':'warn','HTTPS / hébergement',location.protocol==='https:'?'Page chargée en HTTPS.':location.protocol==='file:'?'Vous testez le fichier localement. Le HTTPS sera vérifiable sur GitHub Pages.':`Protocole actuel : ${location.protocol}`));
  const swCap='serviceWorker' in navigator;
  let swActive=false;
  try{swActive=!!navigator.serviceWorker?.controller}catch(e){}
  items.push(preflightItem('device','sw',!swCap?'bad':swActive?'ok':'info','Mode PWA / service worker',!swCap?'Ce navigateur ne prend pas en charge les service workers.':swActive?'Service worker actif.':'Disponible après mise en ligne et installation/chargement en HTTPS.'));
  items.push(preflightItem('device','qr',window.QRCode?'ok':'warn','Génération des QR codes',window.QRCode?'Bibliothèque QR chargée.':'La bibliothèque QR n’est pas chargée sur cette page.'));
  const popupTest='open' in window;
  items.push(preflightItem('device','reports',popupTest?'ok':'warn','Rapports / PDF',popupTest?'Fonction d’ouverture des rapports disponible. Le navigateur peut demander l’autorisation des fenêtres contextuelles.':'Ouverture de nouvelles fenêtres indisponible.'));
  items.push(preflightItem('device','backup','ok','Sauvegarde locale',`Copie locale active dans ce navigateur (${STORAGE_KEY}).`));
  const launched=isJuryOfficiallyOpen();
  items.push(preflightItem('device','launch',launched?'info':'ok','État du jury',launched?'Le jury est déjà officiellement ouvert. Le contrôle reste consultable.':'Le jury n’est pas encore officiellement ouvert.'));

  const counts={ok:0,warn:0,bad:0,info:0};
  items.forEach(x=>counts[x.status]++);
  return{
    generatedAt:new Date().toISOString(),
    lotName:cfg.lotName||'',
    testerCount,
    products:products.length,
    samples:samples.length,
    cloudReady:!!cloudReady,
    cloudRole:cloudRole||null,
    counts,
    items
  }
}
function preflightIcon(status){return status==='ok'?'✓':status==='warn'?'!':status==='bad'?'×':'i'}
function preflightStateLabel(status){return status==='ok'?'Conforme':status==='warn'?'À vérifier':status==='bad'?'À corriger':'Info'}
function renderPreflightGroup(id,group,report){
  const box=$(id);if(!box)return;
  const rows=report.items.filter(x=>x.group===group);
  box.innerHTML=rows.map(x=>`<div class="check-row ${x.status}"><div class="check-icon">${preflightIcon(x.status)}</div><div class="check-copy"><strong>${escapeHtml(x.title)}</strong><span>${escapeHtml(x.detail)}</span></div><span class="check-state">${preflightStateLabel(x.status)}</span></div>`).join('')
}
async function renderPreflight(from='launchView'){
  preflightReturnView=from||preflightReturnView;
  updateHeader();showView('preflightView');
  $('#headerTitle').textContent='Contrôle avant jury';$('#headerSub').textContent=state.config?.lotName||'Jury Marchés';
  const report=await buildPreflightReport();lastPreflightReport=report;
  renderPreflightGroup('#preflightConfig','config',report);
  renderPreflightGroup('#preflightBlind','blind',report);
  renderPreflightGroup('#preflightSecurity','security',report);
  renderPreflightGroup('#preflightDevice','device',report);
  $('#preflightOk').textContent=report.counts.ok;$('#preflightWarn').textContent=report.counts.warn;$('#preflightBad').textContent=report.counts.bad;$('#preflightInfo').textContent=report.counts.info;
  const stateEl=$('#preflightState'),detail=$('#preflightStateDetail');
  if(report.counts.bad>0){stateEl.textContent='Corrections nécessaires';detail.textContent=`${report.counts.bad} point${report.counts.bad>1?'s':''} à corriger avant l’ouverture du jury.`}
  else if(report.counts.warn>0){stateEl.textContent='Vérifications restantes';detail.textContent=`Aucun blocage détecté ; ${report.counts.warn} point${report.counts.warn>1?'s':''} mérite${report.counts.warn>1?'nt':''} une vérification.`}
  else{stateEl.textContent='Contrôle terminé';detail.textContent='Aucun point bloquant ou avertissement détecté par ce contrôle.'}
  $('#preflightJson').textContent=JSON.stringify(report,null,2)
}
function preflightTextReport(report){
  const lines=[`CONTRÔLE AVANT JURY — ${report.lotName||'Jury'}`,`Généré : ${new Date(report.generatedAt).toLocaleString('fr-FR')}`,`Produits : ${report.products} · Échantillons : ${report.samples} · Testeurs : ${report.testerCount}`,''];
  const names={config:'CONFIGURATION',blind:'TEST À L’AVEUGLE',security:'SÉCURITÉ & PARTAGE',device:'APPAREIL & JOUR J'};
  ['config','blind','security','device'].forEach(g=>{
    lines.push(names[g]);
    report.items.filter(x=>x.group===g).forEach(x=>lines.push(`[${preflightStateLabel(x.status)}] ${x.title} — ${x.detail}`));
    lines.push('')
  });
  return lines.join('\n')
}
async function copyPreflight(){
  if(!lastPreflightReport)await renderPreflight(preflightReturnView);
  await copyText(preflightTextReport(lastPreflightReport),'Diagnostic copié')
}
function togglePreflightJson(){
  const e=$('#preflightJson');e.classList.toggle('show');$('#preflightJsonBtn').textContent=e.classList.contains('show')?'Masquer le détail technique':'Voir le détail technique'
}
function backPreflight(){
  if(preflightReturnView==='homeView')renderHome();else renderLaunchView()
}
$('#launchPreflightBtn').onclick=()=>renderPreflight('launchView');
$('#preflightHomeBtn').onclick=()=>renderPreflight('homeView');
$('#preflightRunBtn').onclick=()=>renderPreflight(preflightReturnView);
$('#preflightCopyBtn').onclick=copyPreflight;
$('#preflightJsonBtn').onclick=togglePreflightJson;
$('#preflightBackBtn').onclick=backPreflight;
