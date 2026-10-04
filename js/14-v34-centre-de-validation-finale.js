/* --- V34 : centre de validation finale avant déploiement --- */
const RELEASE_VALIDATION_KEY='jm_test_culinaire_release_v34';

function releaseLoad(){
  try{return JSON.parse(localStorage.getItem(RELEASE_VALIDATION_KEY)||'{}')||{}}catch(e){return{}}
}
function releaseSave(data){
  localStorage.setItem(RELEASE_VALIDATION_KEY,JSON.stringify(data||{}))
}
function releaseMark(key,ok,detail=''){
  const r=releaseLoad();
  r[key]={ok:!!ok,at:new Date().toISOString(),detail};
  releaseSave(r)
}
function releaseServerCoreOk(d){
  if(!d)return false;
  const r=d.rls||{};
  return Number(d.version)===32&&d.authenticated&&r.sessions&&r.reponses&&r.memberships&&r.access_codes&&Number(d.legacy_anon_policy_count||0)===0&&d.public_config_guard&&d.public_config_has_supplier!==true
}
function releaseTwoPhoneManualOk(){
  try{
    const m=JSON.parse(localStorage.getItem(TWO_PHONE_CHECK_KEY)||'{}')||{};
    return ['opened','blind','adminBlocked','answer'].every(k=>m[k])
  }catch(e){return false}
}
async function buildReleaseChecklist(){
  const saved=releaseLoad();
  let pre=null;
  try{pre=await buildPreflightReport()}catch(e){}
  const preBad=pre?Number(pre.counts?.bad||0):999;
  const preWarn=pre?Number(pre.counts?.warn||0):999;
  const serverLive=(typeof serverSecurityDiagnosticV32!=='undefined')?serverSecurityDiagnosticV32:null;
  const serverOk=releaseServerCoreOk(serverLive)||!!saved.serverV32?.ok;
  const twoManual=releaseTwoPhoneManualOk();
  const twoPresence=typeof twoPhonePresence==='function'?twoPhonePresence():false;
  const twoAnswer=typeof twoPhoneHasAnswer==='function'?twoPhoneHasAnswer():false;
  const twoLive=serverOk&&twoManual&&twoPresence&&twoAnswer&&cloudReady&&cloudRole==='admin';
  const twoSaved=!!saved.twoPhone?.ok;
  const securityPin=typeof securityEnabled==='function'&&securityEnabled();
  const backupOk=typeof recoveryLoad==='function'&&recoveryLoad().length>0;
  const pwaCap='serviceWorker' in navigator;
  const pwaInfo=location.protocol==='https:'?(navigator.serviceWorker?.controller?'Service worker actif sur cette page.':'HTTPS actif ; le service worker sera contrôlé après rechargement/installation.'):'Le fichier est encore ouvert localement ; le PWA sera vérifié après mise en ligne.';
  const qrOk=!!window.QRCode;
  const reportFns=typeof openCurrentReport==='function'&&typeof openCurrentMinutes==='function'&&typeof openCurrentDossier==='function'&&typeof openCurrentSummary==='function';
  const jsVersionOk=/v\d+/i.test(document.title);

  if(serverLive&&releaseServerCoreOk(serverLive))releaseMark('serverV32',true,'Diagnostic serveur V32 conforme.');
  if(twoLive)releaseMark('twoPhone',true,'Test 2 téléphones conforme sur la session active.');
  if(pre&&preBad===0)releaseMark('preflight',true,preWarn?`Aucun blocage ; ${preWarn} avertissement(s).`:'Aucun blocage ni avertissement.');
  if(backupOk)releaseMark('backup',true,'Au moins un point de restauration local existe.');

  const fresh=releaseLoad();
  return[
    {key:'version',status:jsVersionOk?'ok':'bad',title:'Version candidate courante',detail:jsVersionOk?'La version candidate est correctement identifiée.':'La version de la page n’a pas pu être identifiée.'},
    {key:'pin',status:securityPin?'ok':'bad',title:'Sécurité administrateur',detail:securityPin?'PIN et jeton administrateur activés.':'La protection administrateur doit être activée.'},
    {key:'serverV32',status:(serverOk||fresh.serverV32?.ok)?'ok':'bad',title:'Sécurité serveur Supabase V32',detail:(serverOk||fresh.serverV32?.ok)?`Validée${fresh.serverV32?.at?` le ${new Date(fresh.serverV32.at).toLocaleString('fr-FR')}`:''}.`:'Exécutez le SQL V32 puis lancez le diagnostic dans Partage téléphones.'},
    {key:'preflight',status:preBad===0?'ok':'bad',title:'Contrôle avant jury',detail:pre?preBad===0?`Aucun point bloquant${preWarn?` ; ${preWarn} avertissement(s) à relire.`:'.'}`:`${preBad} point(s) bloquant(s) détecté(s).`:'Contrôle indisponible.'},
    {key:'twoPhone',status:(twoLive||twoSaved)?'ok':'bad',title:'Test sur 2 téléphones',detail:(twoLive||twoSaved)?`Administrateur / Testeur 1 validé${fresh.twoPhone?.at?` le ${new Date(fresh.twoPhone.at).toLocaleString('fr-FR')}`:''}.`:'Le test réel Administrateur + Testeur 1 n’est pas encore entièrement validé.'},
    {key:'backup',status:backupOk?'ok':'warn',title:'Sauvegarde de reprise',detail:backupOk?`${recoveryLoad().length} point(s) de restauration disponible(s).`:'Créez au moins une sauvegarde avant la mise en production.'},
    {key:'qr',status:qrOk?'ok':'warn',title:'QR codes',detail:qrOk?'La bibliothèque QR est chargée.':'La bibliothèque QR n’est pas chargée dans cette ouverture.'},
    {key:'documents',status:reportFns?'ok':'bad',title:'Documents finaux',detail:reportFns?'Rapport, PV, synthèse et dossier complet sont disponibles.':'Une fonction de document final manque.'},
    {key:'pwa',status:pwaCap?'info':'bad',title:'PWA / installation téléphone',detail:pwaCap?pwaInfo:'Ce navigateur ne prend pas en charge les service workers.'},
    {key:'github',status:'info',title:'GitHub',detail:'La version GitHub n’est pas modifiée par ce contrôle. Le déploiement restera une étape séparée et volontaire.'}
  ]
}
function releaseIcon(status){return status==='ok'?'✓':status==='bad'?'×':status==='warn'?'!':'i'}
function releaseBadge(status){return status==='ok'?'Validé':status==='bad'?'Bloquant':status==='warn'?'À vérifier':'Info'}
async function renderRelease(){
  updateHeader();showView('releaseView');$('#headerTitle').textContent='Validation finale';$('#headerSub').textContent='Version candidate '+currentAppVersion();
  const rows=await buildReleaseChecklist();
  const ok=rows.filter(x=>x.status==='ok').length,bad=rows.filter(x=>x.status==='bad').length,warn=rows.filter(x=>x.status==='warn').length;
  const essential=rows.filter(x=>x.status!=='info'),essentialOk=essential.filter(x=>x.status==='ok').length,pct=essential.length?Math.round(essentialOk/essential.length*100):0;
  $('#releaseOkCount').textContent=ok;$('#releaseBadCount').textContent=bad;$('#releaseWarnCount').textContent=warn;$('#releasePercent').textContent=`${pct} %`;$('#releaseProgressBar').style.width=`${pct}%`;
  const ready=bad===0;
  $('#releaseReadyBanner').classList.toggle('show',ready);
  $('#releaseBlockedBanner').classList.toggle('show',!ready);
  $('#releaseState').textContent=ready?'Prête pour déploiement':'Validation incomplète';
  $('#releaseStateDetail').textContent=ready?'Aucun contrôle bloquant restant. GitHub reste inchangé tant que vous ne lancez pas le déploiement.':`${bad} contrôle${bad>1?'s':''} bloquant${bad>1?'s':''} reste${bad>1?'nt':''}.`;

  $('#releaseChecklist').innerHTML=rows.map(r=>`<div class="release-row ${r.status}"><div class="ico">${releaseIcon(r.status)}</div><div><strong>${escapeHtml(r.title)}</strong><span>${escapeHtml(r.detail)}</span></div><span class="release-badge">${releaseBadge(r.status)}</span></div>`).join('');

  const saved=releaseLoad(),events=[];
  Object.entries(saved).forEach(([k,v])=>{
    if(v?.at)events.push({at:v.at,title:k==='serverV32'?'Sécurité serveur V32':k==='twoPhone'?'Test 2 téléphones':k==='preflight'?'Contrôle avant jury':k==='backup'?'Sauvegarde':'Validation',detail:v.detail||''})
  });
  events.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  $('#releaseTimeline').innerHTML=events.length?events.map(e=>`<div class="release-event"><time>${escapeHtml(new Date(e.at).toLocaleString('fr-FR'))}</time><div><strong>${escapeHtml(e.title)}</strong><span>${escapeHtml(e.detail)}</span></div></div>`).join(''):'<div style="font-size:9px;color:var(--muted)">Aucune validation enregistrée sur cet appareil.</div>';
}
async function releaseCopy(){
  const rows=await buildReleaseChecklist();
  const lines=[`VALIDATION FINALE ${currentAppVersion()} — ${state.config?.lotName||'Tests culinaires'}`,`Date : ${new Date().toLocaleString('fr-FR')}`,''];
  rows.forEach(r=>lines.push(`[${releaseBadge(r.status)}] ${r.title} — ${r.detail}`));
  await copyText(lines.join('\n'),'Bilan de validation copié')
}
function releasePrint(){window.print()}
$('#releaseHomeBtn').onclick=renderRelease;
$('#releaseRefreshBtn').onclick=renderRelease;
$('#releasePrintBtn').onclick=releasePrint;
$('#releaseCopyBtn').onclick=releaseCopy;
$('#releaseBackBtn').onclick=renderHome;

/* Les wrappers de validation sont installés tardivement par V36, après chargement de toutes les fonctions. */
