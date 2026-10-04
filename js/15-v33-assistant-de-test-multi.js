/* --- V33 : assistant de test multi-appareils --- */
const TWO_PHONE_CHECK_KEY='jm_test_culinaire_two_phone_check_v33';
let twoPhoneReturnView='cloudView';

function twoPhoneManualState(){
  try{return JSON.parse(localStorage.getItem(TWO_PHONE_CHECK_KEY)||'{}')||{}}catch(e){return{}}
}
function saveTwoPhoneManualState(){
  const out={};
  document.querySelectorAll('[data-two-manual]').forEach(c=>out[c.dataset.twoManual]=!!c.checked);
  localStorage.setItem(TWO_PHONE_CHECK_KEY,JSON.stringify(out))
}
function twoPhoneTestUrl(){
  if(!(cloudReady&&cloudRole==='admin'&&cloudCfg?.sessionId&&typeof shareUrl==='function'))return '';
  try{
    const u=new URL(shareUrl(1));
    u.searchParams.set('testMode','twoPhone');
    return u.toString()
  }catch(e){return shareUrl(1)+(shareUrl(1).includes('?')?'&':'?')+'testMode=twoPhone'}
}
function twoPhonePresence(){
  const set=typeof testerPresenceNumbers==='function'?testerPresenceNumbers():new Set();
  return set.has(1)
}
function twoPhoneHasAnswer(){
  const t=state.testers?.[1];if(!t)return false;
  return Object.values(t.answers||{}).some(a=>Array.isArray(a?.choices)&&a.choices.some(x=>x!==null&&x!==undefined))
}
function twoPhoneServerOk(){
  const d=(typeof serverSecurityDiagnosticV32!=='undefined')?serverSecurityDiagnosticV32:null;
  if(!d)return false;
  const r=d.rls||{};
  return Number(d.version)===32&&d.authenticated&&r.sessions&&r.reponses&&r.memberships&&r.access_codes&&Number(d.legacy_anon_policy_count||0)===0&&d.public_config_guard&&d.public_config_has_supplier!==true
}
function twoPhoneAutoData(){
  const link=twoPhoneTestUrl();
  return[
    {ok:twoPhoneServerOk(),warn:!serverSecurityDiagnosticV32,title:'Sécurité serveur V32',detail:serverSecurityDiagnosticV32?(twoPhoneServerOk()?'Diagnostic V32 conforme.':'Le diagnostic V32 contient un point à corriger.'):'Lancez « Vérifier sécurité V32 » avant le test.'},
    {ok:!!cloudReady&&cloudRole==='admin',warn:!cloudReady,title:'Téléphone A administrateur',detail:cloudReady?`Session ${cloudCfg.sessionId||'—'} · rôle ${cloudRole||'—'}.`:'Aucune session Supabase connectée.'},
    {ok:!!link,warn:!cloudReady,title:'Lien Testeur 1',detail:link?'Lien individuel sécurisé prêt.':'Créez ou connectez une session sécurisée pour générer le lien.'},
    {ok:twoPhonePresence(),warn:!twoPhonePresence(),title:'Téléphone B connecté',detail:twoPhonePresence()?'Testeur 1 détecté en présence temps réel.':'Ouvrez le lien Testeur 1 sur le second téléphone.'},
    {ok:twoPhoneHasAnswer(),warn:!twoPhoneHasAnswer(),title:'Réponse reçue depuis Testeur 1',detail:twoPhoneHasAnswer()?'Au moins une réponse du Testeur 1 est visible sur le téléphone A.':'Saisissez une réponse sur le téléphone B puis actualisez.'}
  ]
}
function renderTwoPhone(from){
  if(from)twoPhoneReturnView=from;
  updateHeader();showView('twoPhoneView');$('#headerTitle').textContent='Test 2 téléphones';$('#headerSub').textContent=state.config?.lotName||'Jury Marchés';
  const manual=twoPhoneManualState();
  document.querySelectorAll('[data-two-manual]').forEach(c=>c.checked=!!manual[c.dataset.twoManual]);
  renderTwoPhoneData()
}
function renderTwoPhoneData(){
  const data=twoPhoneAutoData(),box=$('#twoPhoneAutoSteps');
  box.innerHTML=data.map(x=>{
    const cls=x.ok?'ok':x.warn?'warn':'bad',ico=x.ok?'✓':x.warn?'!':'×',badge=x.ok?'Conforme':x.warn?'À vérifier':'À corriger';
    return `<div class="twophone-step ${cls}"><div class="ico">${ico}</div><div><strong>${escapeHtml(x.title)}</strong><span>${escapeHtml(x.detail)}</span></div><span class="twophone-badge">${badge}</span></div>`
  }).join('');

  const url=twoPhoneTestUrl(),urlEl=$('#twoPhoneUrl'),qr=$('#twoPhoneQr');
  urlEl.textContent=url||'Aucun lien disponible.';
  qr.innerHTML='';
  if(url&&window.QRCode){
    try{new QRCode(qr,{text:url,width:250,height:250,correctLevel:QRCode.CorrectLevel.M})}
    catch(e){qr.innerHTML='<span style="font-size:8px;color:#9c3036;text-align:center">QR indisponible</span>'}
  }else qr.innerHTML='<span style="font-size:8px;color:#6f808b;text-align:center;padding:8px">Le QR apparaîtra après connexion de la session sécurisée.</span>';

  const manual=twoPhoneManualState(),manualCount=['opened','blind','adminBlocked','answer'].filter(k=>manual[k]).length;
  const autoCount=data.filter(x=>x.ok).length;
  const total=data.length+4,done=autoCount+manualCount,pct=Math.round(done/total*100);
  $('#twoPhonePercent').textContent=`${pct} %`;$('#twoPhoneProgressBar').style.width=`${pct}%`;
  $('#twoPhoneStateText').textContent=done===total?'Tous les contrôles automatiques et manuels sont validés.':`${done}/${total} contrôles validés.`;
  const result=$('#twoPhoneResultBox');
  const finished=done===total;
  result.className=`rehearsal-check ${finished?'ok':'warn'}`;
  result.innerHTML=finished?'✓ <strong>Test 2 téléphones réussi.</strong> Le parcours administrateur / Testeur 1 est validé pour cette session.':'⚠️ <strong>Test incomplet.</strong> Terminez les contrôles automatiques et cochez les quatre vérifications manuelles.';
}
async function refreshTwoPhone(){
  if(cloudReady&&typeof reloadCloudAnswers==='function')await reloadCloudAnswers();
  renderTwoPhoneData();toast('Contrôles actualisés')
}
async function copyTwoPhoneLink(){
  const url=twoPhoneTestUrl();if(!url)return alert('Aucun lien Testeur 1 disponible.');
  await copyText(url,'Lien de test Testeur 1 copié')
}
async function shareTwoPhoneLink(){
  const url=twoPhoneTestUrl();if(!url)return alert('Aucun lien Testeur 1 disponible.');
  if(navigator.share){
    try{await navigator.share({title:'Test 2 téléphones — Testeur 1',text:'Ouvrez ce lien sur le second téléphone pour vérifier l’accès Testeur 1.',url});return}catch(e){if(e?.name==='AbortError')return}
  }
  await copyTwoPhoneLink()
}
function resetTwoPhoneChecklist(){
  localStorage.removeItem(TWO_PHONE_CHECK_KEY);
  document.querySelectorAll('[data-two-manual]').forEach(c=>c.checked=false);
  renderTwoPhoneData();toast('Cases manuelles réinitialisées')
}
function backTwoPhone(){
  if(twoPhoneReturnView==='homeView')renderHome();else renderCloudPage()
}
document.querySelectorAll('[data-two-manual]').forEach(c=>c.onchange=()=>{saveTwoPhoneManualState();renderTwoPhoneData()});
$('#twoPhoneTestBtn').onclick=()=>renderTwoPhone('cloudView');
$('#twoPhoneHomeBtn').onclick=()=>renderTwoPhone('homeView');
$('#twoPhoneRefreshBtn').onclick=refreshTwoPhone;
$('#twoPhoneSecurityBtn').onclick=async()=>{await checkServerSecurityV32();renderTwoPhoneData()};
$('#twoPhoneCopyBtn').onclick=copyTwoPhoneLink;
$('#twoPhoneShareBtn').onclick=shareTwoPhoneLink;
$('#twoPhoneResetChecklistBtn').onclick=resetTwoPhoneChecklist;
$('#twoPhoneBackBtn').onclick=backTwoPhone;

/* Diagnostic visible uniquement sur le second téléphone lorsqu'il ouvre le lien testMode=twoPhone. */
function renderTestPhoneBanner(){
  let mode='';
  try{mode=new URL(location.href).searchParams.get('testMode')||''}catch(e){}
  if(mode!=='twoPhone')return;
  const b=$('#testPhoneBanner');if(!b)return;
  const supplierLeak=JSON.stringify(state?.config||{}).includes('"supplier"');
  const testerOk=Number(guestTester||cloudTesterNo||0)===1;
  const roleOk=cloudRole==='tester';
  const ok=testerOk&&roleOk&&!supplierLeak;
  b.className=`testphone-banner show ${ok?'ok':'bad'}`;
  b.innerHTML=`<strong>${ok?'✓ Test téléphone B conforme':'⚠ Test téléphone B à vérifier'}</strong>${testerOk?'Testeur 1 reconnu':'Testeur 1 non reconnu'} · ${roleOk?'rôle testeur':'rôle non confirmé'} · ${supplierLeak?'un champ fournisseur est présent':'aucun fournisseur dans la configuration reçue'}.`;
}
setInterval(()=>{
  let mode='';try{mode=new URL(location.href).searchParams.get('testMode')||''}catch(e){}
  if(mode==='twoPhone')renderTestPhoneBanner()
},1800);
