/* --- V31 : assistant guidé de fin de jury --- */
let finishReturnView='adminView';

function finishData(){
  const totalSamplesCount=totalSamples(),testerCount=Number(state.config?.testerCount||0);
  const expected=totalSamplesCount*testerCount;
  const completed=testerCompletedCountAll();
  const validated=validatedCount();
  const closed=isJuryClosed();
  const closureReady=closureIsReady(state);
  const archived=!!state.config?._archive?.archivedAt;
  return{totalSamplesCount,testerCount,expected,completed,validated,closed,closureReady,archived}
}
function testerCompletedCountAll(){
  let n=0;
  for(let t=1;t<=Number(state.config?.testerCount||0);t++)n+=testerCompleted(t);
  return n
}
function finishStatusClass(done,available){
  return done?'done':available?'current':'blocked'
}
function finishStepHtml(no,title,detail,done,available,badge,actions=''){
  const cls=finishStatusClass(done,available);
  return `<article class="panel finish-step ${cls}">
    <div class="num">${done?'✓':no}</div>
    <div class="finish-copy"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>${actions?`<div class="finish-actions">${actions}</div>`:''}</div>
    <span class="finish-badge">${escapeHtml(badge)}</span>
  </article>`
}
function renderFinish(from){
  if(from)finishReturnView=from;
  updateHeader();showView('finishView');$('#headerTitle').textContent='Fin du jury';$('#headerSub').textContent=state.config?.lotName||'Jury Marchés';
  renderFinishSteps()
}
function renderFinishSteps(){
  const d=finishData();
  const answersDone=d.expected>0&&d.completed===d.expected;
  const validationsDone=d.testerCount>0&&d.validated===d.testerCount;
  const closedDone=d.closed;
  const closureDone=d.closureReady;
  const docsReady=closedDone&&closureDone&&validationsDone;
  const archiveDone=d.archived;

  const doneCount=[answersDone,validationsDone,closedDone,closureDone,docsReady,archiveDone].filter(Boolean).length;
  const pct=Math.round(doneCount/6*100);
  $('#finishPercent').textContent=`${pct} %`;$('#finishProgressBar').style.width=`${pct}%`;
  $('#finishCompleted').textContent=`${d.completed}/${d.expected}`;
  $('#finishValidated').textContent=`${d.validated}/${d.testerCount}`;
  $('#finishClosed').textContent=closedDone?'Oui ✓':'Non';
  $('#finishClosure').textContent=closureDone?'Complète ✓':'À faire';
  $('#finishStateText').textContent=archiveDone?'Jury finalisé et archivé.':docsReady?'Tous les documents finaux peuvent être générés.':answersDone&&validationsDone?'Le jury peut maintenant être fermé officiellement.':'Il reste des dégustations ou validations à terminer.';
  $('#finishCompleteBanner').classList.toggle('show',archiveDone);

  const steps=[];

  steps.push(finishStepHtml(
    1,'Terminer toutes les dégustations',
    answersDone?`Les ${d.expected} fiches d’échantillons sont complètes.`:`${d.completed}/${d.expected} fiches sont complètes. Il reste ${Math.max(0,d.expected-d.completed)} fiche(s).`,
    answersDone,true,answersDone?'Terminé':'En cours',
    `<button class="btn btn-secondary" data-finish-action="jury">Voir les testeurs</button><button class="btn btn-secondary" data-finish-action="live">Suivi en direct</button>`
  ));

  steps.push(finishStepHtml(
    2,'Faire valider chaque testeur',
    validationsDone?`Les ${d.testerCount} testeurs ont validé définitivement leur test.`:`${d.validated}/${d.testerCount} testeurs ont validé. Une validation verrouille la fiche du testeur.`,
    validationsDone,answersDone,validationsDone?'Terminé':answersDone?'À faire':'En attente',
    `<button class="btn btn-secondary" data-finish-action="results">Voir les validations</button>`
  ));

  steps.push(finishStepHtml(
    3,'Fermer officiellement le jury',
    closedDone?`Fermeture enregistrée le ${reportDate(state.config.juryClose.closedAt)}.`:'La fermeture bloque définitivement la saisie des testeurs.',
    closedDone,answersDone&&validationsDone,closedDone?'Fermé':answersDone&&validationsDone?'Prêt':'Bloqué',
    closedDone?'':`<button class="btn btn-primary" data-finish-action="close">Fermer le jury</button>`
  ));

  steps.push(finishStepHtml(
    4,'Compléter la fiche de clôture',
    closureDone?`Date, lieu et responsable sont renseignés${state.config?.closure?.chairSignature?' avec signature':''}.`:'Renseignez au minimum la date, le lieu et le responsable du jury.',
    closureDone,closedDone,closureDone?'Complète':closedDone?'À compléter':'En attente',
    `<button class="btn btn-secondary" data-finish-action="closure">Ouvrir la fiche de clôture</button>`
  ));

  steps.push(finishStepHtml(
    5,'Générer les documents finaux',
    docsReady?'PV, synthèse et dossier complet sont disponibles en version finale.':'Les documents restent provisoires tant que fermeture, validations et clôture ne sont pas terminées.',
    docsReady,closureDone&&closedDone,docsReady?'Final':'Provisoire',
    `<button class="btn btn-secondary" data-finish-action="minutes">Procès-verbal</button><button class="btn btn-secondary" data-finish-action="summary">Synthèse</button><button class="btn btn-primary" data-finish-action="dossier">Dossier complet</button>`
  ));

  const archiveAvailable=docsReady&&!archiveDone;
  steps.push(finishStepHtml(
    6,'Archiver le jury',
    archiveDone?`Jury archivé${state.config?._archive?.archivedAt?` le ${reportDate(state.config._archive.archivedAt)}`:''}.`:'L’archivage conserve définitivement ce jury dans l’historique et permet ensuite de préparer un nouveau jury.',
    archiveDone,archiveAvailable,archiveDone?'Archivé':archiveAvailable?'Prêt':'En attente',
    archiveDone?`<button class="btn btn-secondary" data-finish-action="archives">Voir les archives</button>`:`<button class="btn btn-primary" data-finish-action="archive"${archiveAvailable?'':' disabled'}>Archiver maintenant</button>`
  ));

  $('#finishSteps').innerHTML=steps.join('');
  document.querySelectorAll('[data-finish-action]').forEach(b=>b.onclick=()=>finishAction(b.dataset.finishAction))
}
async function finishAction(action){
  if(action==='jury')renderJuryView();
  else if(action==='live')renderLiveDay();
  else if(action==='results')renderAdmin();
  else if(action==='closure')renderClosure();
  else if(action==='minutes')openCurrentMinutes();
  else if(action==='summary')openCurrentSummary();
  else if(action==='dossier')openCurrentDossier();
  else if(action==='archives')renderArchives();
  else if(action==='close'){
    await closeJuryOfficially();
    renderFinishSteps()
  }else if(action==='archive'){
    archiveCurrentJury();
    // archiveCurrentJury peut changer l'état ; rafraîchir si l'assistant est encore visible.
    if($('#finishView')?.classList.contains('active'))renderFinishSteps()
  }
}
function backFromFinish(){
  if(finishReturnView==='juryView')renderJuryView();
  else if(finishReturnView==='homeView')renderHome();
  else renderAdmin()
}
$('#juryFinishBtn').onclick=()=>renderFinish('juryView');
$('#finishBtn').onclick=()=>renderFinish('adminView');
$('#finishBackBtn').onclick=backFromFinish;
