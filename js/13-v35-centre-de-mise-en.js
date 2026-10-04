/* --- V35 : centre de mise en production guidée --- */
const DEPLOY_MANUAL_KEY='jm_test_culinaire_deploy_manual_v35';

function deployManualLoad(){
  try{return JSON.parse(localStorage.getItem(DEPLOY_MANUAL_KEY)||'{}')||{}}catch(e){return{}}
}
function deployManualSave(){
  const out={};
  document.querySelectorAll('[data-deploy-manual]').forEach(c=>out[c.dataset.deployManual]=!!c.checked);
  localStorage.setItem(DEPLOY_MANUAL_KEY,JSON.stringify(out))
}
function deployServerOk(){
  const d=(typeof serverSecurityDiagnosticV32!=='undefined')?serverSecurityDiagnosticV32:null;
  if(!d)return false;
  return releaseServerCoreOk(d)
}
function deployTwoPhoneOk(){
  const saved=releaseLoad();
  return !!saved.twoPhone?.ok
}
function deployReleaseReady(){
  const saved=releaseLoad();
  return !!saved.serverV32?.ok && !!saved.twoPhone?.ok
}
async function deployRows(){
  const manual=deployManualLoad();
  let pre=null;try{pre=await buildPreflightReport()}catch(e){}
  const backupOk=typeof recoveryLoad==='function'&&recoveryLoad().length>0;
  const online=location.protocol==='https:';
  const githubHosted=/\.github\.io$/i.test(location.hostname||'');
  const swActive=!!navigator.serviceWorker?.controller;
  const server=deployServerOk()||!!releaseLoad().serverV32?.ok;
  const two=deployTwoPhoneOk();

  return[
    {n:1,status:backupOk?'ok':'warn',title:'Créer un point de restauration',detail:backupOk?`${recoveryLoad().length} sauvegarde(s) locale(s) disponible(s).`:'Créez une sauvegarde manuelle avant toute mise en production.',action:'backup'},
    {n:2,status:manual.sql&&server?'ok':manual.sql?'warn':'warn',title:'Installer le SQL Supabase V32',detail:manual.sql?(server?'SQL déclaré exécuté et diagnostic V32 conforme.':'SQL déclaré exécuté ; lancez encore le diagnostic V32.'):'Exécutez installation_supabase_tests_culinaires_v32_securite.sql dans Supabase SQL Editor.',action:'security'},
    {n:3,status:manual.anonymous?'ok':'warn',title:'Activer Anonymous Sign-Ins',detail:manual.anonymous?'Activation confirmée manuellement.':'Dans Supabase : Authentication → Providers → Anonymous → Enable.',action:'security'},
    {n:4,status:server?'ok':'bad',title:'Vérifier la sécurité serveur',detail:server?'Diagnostic V32 validé.':'Le diagnostic V32 n’est pas encore validé.',action:'security'},
    {n:5,status:two?'ok':'bad',title:'Valider le test sur 2 téléphones',detail:two?'Test Administrateur / Testeur 1 validé.':'Effectuez le test réel sur deux appareils.',action:'twophone'},
    {n:6,status:pre&&Number(pre.counts?.bad||0)===0?'ok':'bad',title:'Contrôle avant jury',detail:pre?Number(pre.counts?.bad||0)===0?'Aucun point bloquant détecté.':`${pre.counts.bad} blocage(s) détecté(s).`:'Contrôle indisponible.',action:'preflight'},
    {n:7,status:manual.github||githubHosted?'ok':'info',title:'Déposer les 5 fichiers sur GitHub',detail:githubHosted?'Cette page est déjà ouverte depuis github.io.':manual.github?'Dépôt GitHub confirmé manuellement.':'Étape future : remplacer tests-culinaires.html et ajouter manifest, service worker et icônes. Ne pas toucher à index.html.',action:''},
    {n:8,status:online?(swActive?'ok':'warn'):'info',title:'Contrôler HTTPS et le service worker',detail:online?(swActive?'HTTPS actif et service worker contrôlant cette page.':'HTTPS actif, mais le service worker ne contrôle pas encore cette page ; rechargez après publication.'):'Vérifiable uniquement après publication HTTPS.',action:''},
    {n:9,status:manual.pwa?'ok':'info',title:'Installer l’application sur un téléphone',detail:manual.pwa?'Installation PWA confirmée.':'Après publication : utiliser « Installer l’application » puis vérifier l’ouverture plein écran.',action:''}
  ]
}
function deployStatusLabel(s){return s==='ok'?'Validé':s==='bad'?'Bloquant':s==='warn'?'À faire':'Info'}
function deployIcon(s){return s==='ok'?'✓':s==='bad'?'×':s==='warn'?'!':'i'}
async function renderDeploy(){
  updateHeader();showView('deployView');$('#headerTitle').textContent='Mise en production';$('#headerSub').textContent='Version candidate V37';
  const manual=deployManualLoad();document.querySelectorAll('[data-deploy-manual]').forEach(c=>c.checked=!!manual[c.dataset.deployManual]);
  const rows=await deployRows(),ok=rows.filter(r=>r.status==='ok').length,bad=rows.filter(r=>r.status==='bad').length,todo=rows.filter(r=>r.status==='warn').length;
  const actionable=rows.filter(r=>r.status!=='info'),pct=actionable.length?Math.round(actionable.filter(r=>r.status==='ok').length/actionable.length*100):0;
  $('#deployOkCount').textContent=ok;$('#deployBadCount').textContent=bad;$('#deployTodoCount').textContent=todo;$('#deployPercent').textContent=`${pct} %`;$('#deployProgressBar').style.width=`${pct}%`;
  const online=location.protocol==='https:';$('#deployLocalBanner').style.display=online?'none':'block';$('#deployOnlineBanner').style.display=online?'block':'none';
  const ready=bad===0&&todo===0;
  $('#deployState').textContent=ready?'Prêt pour publication':bad?'Préparation incomplète':'Étapes restantes';
  $('#deployStateDetail').textContent=ready?'Les contrôles de préparation sont terminés. La publication GitHub reste une action manuelle.':bad?`${bad} point${bad>1?'s':''} bloquant${bad>1?'s':''} reste${bad>1?'nt':''}.`:`${todo} étape${todo>1?'s':''} reste${todo>1?'nt':''} à confirmer.`;

  $('#deploySteps').innerHTML=rows.map(r=>`<div class="deploy-step ${r.status}"><div class="num">${deployIcon(r.status)}</div><div><strong>${escapeHtml(r.n+'. '+r.title)}</strong><span>${escapeHtml(r.detail)}</span>${r.action?`<div class="mini-actions"><button class="btn btn-secondary" data-deploy-action="${r.action}">Ouvrir</button></div>`:''}</div><span class="deploy-badge">${deployStatusLabel(r.status)}</span></div>`).join('');
  document.querySelectorAll('[data-deploy-action]').forEach(b=>b.onclick=()=>deployAction(b.dataset.deployAction))
}
function deployAction(a){
  if(a==='backup')renderRecovery();
  else if(a==='security')renderCloudPage();
  else if(a==='twophone')renderTwoPhone('homeView');
  else if(a==='preflight')renderPreflight('homeView')
}
async function deployCopyPlan(){
  const rows=await deployRows();
  const lines=['MISE EN PRODUCTION — TESTS CULINAIRES V67','',...rows.map(r=>`${r.n}. [${deployStatusLabel(r.status)}] ${r.title} — ${r.detail}`),'','Fichiers GitHub :','- tests-culinaires.html','- manifest.webmanifest','- service-worker.js','- icon-192.png','- icon-512.png','','Ne pas remplacer index.html.','Le SQL V32 reste dans Supabase uniquement.'];
  await copyText(lines.join('\n'),'Plan de mise en production copié')
}
function deployPrint(){window.print()}
document.querySelectorAll('[data-deploy-manual]').forEach(c=>c.onchange=()=>{deployManualSave();renderDeploy()});
$('#deployHomeBtn').onclick=renderDeploy;
$('#deployRefreshBtn').onclick=renderDeploy;
$('#deployCopyPlanBtn').onclick=deployCopyPlan;
$('#deployPrintBtn').onclick=deployPrint;
$('#deployBackBtn').onclick=renderHome;
