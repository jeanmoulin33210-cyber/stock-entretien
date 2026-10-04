/* --- V36 : stabilisation finale, wrappers tardifs et diagnostic technique --- */
const APP_VERSION_V36='V162';
let v36WrappersInstalled=false;

function currentAppVersion(){
  const m=String(document.title||'').match(/v(\d+)/i);
  return m?`V${m[1]}`:APP_VERSION_V36
}
function installV36LateWrappers(){
  if(v36WrappersInstalled)return;
  v36WrappersInstalled=true;

  /* V34 voulait mémoriser ces validations, mais les fonctions V32/V33
     sont chargées plus tard dans le fichier. V36 installe donc les wrappers
     ici, une fois toutes les fonctions réellement disponibles. */
  if(typeof checkServerSecurityV32==='function'&&!checkServerSecurityV32.__v36wrapped){
    const raw=checkServerSecurityV32;
    const wrapped=async function(...args){
      const r=await raw(...args);
      try{
        if(typeof releaseServerCoreOk==='function'&&releaseServerCoreOk(serverSecurityDiagnosticV32))
          releaseMark('serverV32',true,'Diagnostic serveur V32 conforme.');
      }catch(e){}
      return r
    };
    wrapped.__v36wrapped=true;
    checkServerSecurityV32=wrapped
  }
  if(typeof renderTwoPhoneData==='function'&&!renderTwoPhoneData.__v36wrapped){
    const raw=renderTwoPhoneData;
    const wrapped=function(...args){
      const r=raw(...args);
      try{
        const m=twoPhoneManualState();
        const manualOk=['opened','blind','adminBlocked','answer'].every(k=>m[k]);
        if(manualOk&&twoPhoneServerOk()&&twoPhonePresence()&&twoPhoneHasAnswer()&&cloudReady&&cloudRole==='admin')
          releaseMark('twoPhone',true,'Test 2 téléphones conforme sur la session active.')
      }catch(e){}
      return r
    };
    wrapped.__v36wrapped=true;
    renderTwoPhoneData=wrapped
  }
}
installV36LateWrappers();

function techRow(status,title,detail){
  const icon=status==='ok'?'✓':status==='bad'?'×':status==='warn'?'!':'i';
  const badge=status==='ok'?'Conforme':status==='bad'?'Erreur':status==='warn'?'À vérifier':'Info';
  return{status,title,detail,icon,badge}
}
function techDuplicateIds(){
  const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
  const count={};ids.forEach(id=>count[id]=(count[id]||0)+1);
  return Object.entries(count).filter(([,n])=>n>1).map(([id,n])=>`${id} (${n})`)
}
function techFunctionCheck(name,label){
  const ok=typeof window[name]==='function';
  return techRow(ok?'ok':'bad',label,ok?`${name}() est chargée.`:`${name}() est introuvable.`)
}
function techStorageWritable(){
  try{
    const k='__tc_v36_test__';localStorage.setItem(k,'1');localStorage.removeItem(k);return true
  }catch(e){return false}
}
function buildTechAudit(){
  const dup=techDuplicateIds(),core=[
    techFunctionCheck('renderHome','Accueil'),
    techFunctionCheck('renderJuryView','Jury en cours'),
    techFunctionCheck('renderAdmin','Résultats'),
    techFunctionCheck('renderArchives','Archives'),
    techFunctionCheck('openCurrentReport','Rapport'),
    techFunctionCheck('openCurrentMinutes','Procès-verbal'),
    techFunctionCheck('openCurrentSummary','Synthèse'),
    techFunctionCheck('openCurrentDossier','Dossier complet'),
    techFunctionCheck('renderFinish','Assistant de fin de jury'),
    techFunctionCheck('renderPreflight','Contrôle avant jury'),
    techFunctionCheck('renderTwoPhone','Test 2 téléphones'),
    techFunctionCheck('renderRecovery','Sauvegardes')
  ];
  core.unshift(techRow(dup.length?'bad':'ok','Identifiants HTML uniques',dup.length?`Doublons : ${dup.join(', ')}`:'Aucun identifiant HTML en double.'));

  const browser=[
    techRow(techStorageWritable()?'ok':'bad','Stockage local',techStorageWritable()?'localStorage est accessible en lecture/écriture.':'localStorage est indisponible ou bloqué.'),
    techRow(window.crypto?.subtle?'ok':'warn','Web Crypto',window.crypto?.subtle?'SHA-256 sécurisé disponible.':'Web Crypto indisponible ; un mode de secours peut être utilisé.'),
    techRow('serviceWorker' in navigator?'ok':'warn','Service Worker','serviceWorker' in navigator?'Pris en charge par ce navigateur.':'Non pris en charge.'),
    techRow(navigator.onLine?'ok':'warn','Réseau',navigator.onLine?'Le navigateur indique une connexion active.':'Le navigateur indique un mode hors connexion.'),
    techRow(location.protocol==='https:'?'ok':location.protocol==='file:'?'info':'warn','Contexte HTTPS',location.protocol==='https:'?'Page chargée en HTTPS.':location.protocol==='file:'?'Fichier local : HTTPS sera contrôlé après publication.':`Protocole : ${location.protocol}`),
    techRow(typeof window.open==='function'?'ok':'bad','Ouverture des documents',typeof window.open==='function'?'window.open disponible ; les popups peuvent néanmoins demander une autorisation.':'window.open indisponible.')
  ];

  const security=[
    techRow(typeof supabase!=='undefined'?'ok':'warn','Bibliothèque Supabase',typeof supabase!=='undefined'?'Supabase JS est chargé.':'Supabase JS n’est pas chargé dans cette ouverture.'),
    techRow(typeof QRCode!=='undefined'?'ok':'warn','Bibliothèque QR',typeof QRCode!=='undefined'?'QRCode est chargé.':'QRCode n’est pas chargé dans cette ouverture.'),
    techFunctionCheck('checkServerSecurityV32','Diagnostic serveur V32'),
    techFunctionCheck('createFreshSecureSessionV32','Création de session sécurisée'),
    techRow(v36WrappersInstalled?'ok':'bad','Correctif ordre de chargement V36',v36WrappersInstalled?'Wrappers tardifs installés après les fonctions V32/V33.':'Correctif V36 non installé.'),
    techRow(typeof securityEnabled==='function'?'ok':'bad','Sécurité administrateur','securityEnabled() '+(typeof securityEnabled==='function'?'est chargée.':'est introuvable.'))
  ];

  const all=[...core,...browser,...security];
  const counts={ok:0,warn:0,bad:0,info:0};all.forEach(x=>counts[x.status]++);
  return{
    version:currentAppVersion(),
    generatedAt:new Date().toISOString(),
    title:document.title,
    href:location.href,
    duplicateIds:dup,
    counts,
    core,browser,security
  }
}
function renderTechRows(sel,rows){
  $(sel).innerHTML=rows.map(r=>`<div class="tech-row ${r.status}"><div class="ico">${r.icon}</div><div><strong>${escapeHtml(r.title)}</strong><span>${escapeHtml(r.detail)}</span></div><span class="tech-badge">${r.badge}</span></div>`).join('')
}
function renderTechAudit(){
  updateHeader();showView('techAuditView');$('#headerTitle').textContent='Diagnostic technique';$('#headerSub').textContent='Stabilisation '+currentAppVersion();
  const a=buildTechAudit();renderTechRows('#techCoreList',a.core);renderTechRows('#techBrowserList',a.browser);renderTechRows('#techSecurityList',a.security);
  $('#techOk').textContent=a.counts.ok;$('#techWarn').textContent=a.counts.warn;$('#techBad').textContent=a.counts.bad;$('#techVersion').textContent=a.version;
  $('#techDetail').textContent=JSON.stringify({version:a.version,generatedAt:a.generatedAt,counts:a.counts,duplicateIds:a.duplicateIds,protocol:location.protocol,online:navigator.onLine,serviceWorkerControlled:!!navigator.serviceWorker?.controller,cloudReady:typeof cloudReady!=='undefined'?cloudReady:false,cloudRole:typeof cloudRole!=='undefined'?cloudRole:null},null,2);
  $('#techState').textContent=a.counts.bad?'Corrections nécessaires':a.counts.warn?'Fonctionnement chargé':'Diagnostic conforme';
  $('#techStateDetail').textContent=a.counts.bad?`${a.counts.bad} erreur(s) technique(s) détectée(s).`:a.counts.warn?`Aucune erreur bloquante ; ${a.counts.warn} avertissement(s) lié(s) surtout au contexte local/réseau.`:'Aucune erreur ou avertissement détecté sur cet appareil.';
  return a
}
async function copyTechAudit(){
  const a=buildTechAudit(),lines=[`DIAGNOSTIC TECHNIQUE ${a.version}`,`Généré : ${new Date(a.generatedAt).toLocaleString('fr-FR')}`,''];
  [...a.core,...a.browser,...a.security].forEach(r=>lines.push(`[${r.badge}] ${r.title} — ${r.detail}`));
  await copyText(lines.join('\n'),'Diagnostic technique copié')
}
$('#techAuditHomeBtn').onclick=renderTechAudit;
$('#techRunBtn').onclick=renderTechAudit;
$('#techCopyBtn').onclick=copyTechAudit;
$('#techBackBtn').onclick=renderHome;
