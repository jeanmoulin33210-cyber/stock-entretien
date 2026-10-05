/* --- V69 : navigation simple --- */


function openResultsArchiveHub(){
  updateHeader();
  showView('resultsArchiveHubView');
  $('#headerTitle').textContent='Résultats & archives';
  $('#headerSub').textContent='Choisissez une rubrique';
}


function loadReportNoteIntoForm(){
  const input=$('#reportNoteInput');
  const stateLabel=$('#reportNoteState');
  if(!input)return;
  input.value=state.config?.reportNote||'';
  if(stateLabel){
    stateLabel.textContent='Enregistré';
    stateLabel.classList.remove('changed');
  }
}
function saveReportNote(){
  const input=$('#reportNoteInput');
  if(!input)return;
  if(!state.config)state.config={};
  state.config.reportNote=String(input.value||'').trim();
  state.config.reportNoteUpdatedAt=new Date().toISOString();
  saveState();
  const stateLabel=$('#reportNoteState');
  if(stateLabel){
    stateLabel.textContent='Enregistré ✓';
    stateLabel.classList.remove('changed');
  }
  toast('Note enregistrée dans le rapport ✓');
}
function clearReportNote(){
  const input=$('#reportNoteInput');
  if(!input)return;
  input.value='';
  if(!state.config)state.config={};
  state.config.reportNote='';
  state.config.reportNoteUpdatedAt=new Date().toISOString();
  saveState();
  const stateLabel=$('#reportNoteState');
  if(stateLabel){
    stateLabel.textContent='Enregistré';
    stateLabel.classList.remove('changed');
  }
  toast('Note supprimée du rapport');
}

function openSimplifiedResults(){
  adminProduct='overall';
  selectedAdminSample='';
  renderAdmin();
  loadReportNoteIntoForm();
  const v=$('#adminView');
  if(v)v.classList.remove('show-results-details');
  syncSimpleResultsActions();
}
function syncSimpleResultsActions(){
  const hint=$('#simpleResultsHint');
  const title=$('#simpleResultsNextTitle');
  const closureBtn=$('#simpleResultsClosureBtn');
  const sheetsBtn=$('#productSheetsBtn');
  const reportBtn=$('#simpleResultsPdfBtn');
  const archiveBtn=$('#simpleResultsArchiveBtn');
  const moreBtn=$('#simpleResultsMoreBtn');
  if(!hint||!archiveBtn)return;

  const total=totalSamples();
  const done=totalCompleted();
  const max=state.config.testerCount*total;
  const complete=max>0&&done===max&&validatedCount()===state.config.testerCount;
  const closed=isJuryClosed();
  const closureReady=closureIsReady();
  const ps=(typeof productSheetsProgress==='function')?productSheetsProgress(state):{total:0,filled:0};
  const sheetsReady=ps.total>0&&ps.filled===ps.total;
  const archived=!!state.config?._archive?.archivedAt;

  const stepButtons=[closureBtn,sheetsBtn,reportBtn,archiveBtn].filter(Boolean);
  stepButtons.forEach(b=>{
    b.classList.remove('btn-primary','simple-results-next-btn');
    b.classList.add('btn-secondary');
  });

  if(closureBtn){
    closureBtn.disabled=!closed;
    closureBtn.textContent=closureReady?'✓ 1. Clôture':'✍️ 1. Clôture';
  }
  if(sheetsBtn){
    sheetsBtn.disabled=!complete;
    sheetsBtn.textContent=`📋 2. Fiches produits${ps.total?` (${ps.filled}/${ps.total})`:''}`;
  }
  if(reportBtn){
    reportBtn.disabled=!(complete&&closed&&closureReady&&sheetsReady);
    reportBtn.textContent='📄 3. Rapport final';
  }
  archiveBtn.disabled=!(complete&&closed&&closureReady&&sheetsReady);
  archiveBtn.textContent=archived?'✓ 4. Archivé':'📁 4. Archiver';

  const highlight=b=>{
    if(!b)return;
    b.classList.remove('btn-secondary');
    b.classList.add('btn-primary','simple-results-next-btn');
  };

  if(!complete){
    if(title)title.textContent='⏳ Jury encore en cours';
    hint.textContent='Attendez que tous les testeurs aient terminé et validé. Le classement ci-dessous reste provisoire.';
  }else if(!closed){
    if(title)title.textContent='✓ Tous les testeurs ont terminé';
    hint.textContent='Le jury se ferme automatiquement. Vous allez ensuite compléter la clôture.';
  }else if(!closureReady){
    if(title)title.textContent='👉 À faire maintenant : la clôture';
    hint.textContent='Cliquez sur « 1. Clôture », renseignez les informations et signez. Ensuite revenez ici.';
    highlight(closureBtn);
  }else if(!sheetsReady){
    if(title)title.textContent='👉 À faire maintenant : les fiches produits';
    hint.textContent=`La clôture est faite. Complétez maintenant les fiches produits (${ps.filled}/${ps.total}). Les données de réception déjà saisies sont reprises automatiquement.`;
    highlight(sheetsBtn);
  }else if(!archived){
    if(title)title.textContent='👉 Dernière étape : rapport puis archivage';
    hint.textContent='Tout est complet. Ouvrez le rapport final, puis archivez le jury.';
    highlight(reportBtn);
  }else{
    if(title)title.textContent='✓ Jury terminé et archivé';
    hint.textContent='Le dossier est terminé. Vous pouvez revoir le rapport ou consulter les archives.';
    highlight(reportBtn);
  }

  if(moreBtn){
    moreBtn.textContent=$('#adminView')?.classList.contains('show-results-details')
      ?'Masquer les détails'
      :'⚙️ Détails';
  }
}
function toggleSimpleResultsDetails(){
  const v=$('#adminView');
  if(!v)return;
  v.classList.toggle('show-results-details');
  syncSimpleResultsActions();
  if(v.classList.contains('show-results-details')){
    setTimeout(()=>$('#resultsWorkflow')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }
}
function toggleArchiveFilters(){
  const v=$('#archivesView');
  if(!v)return;
  v.classList.toggle('show-archive-filters');
  const b=$('#archiveMoreFiltersBtn');
  if(b)b.textContent=v.classList.contains('show-archive-filters')?'Masquer les filtres':'🔎 Filtres';
}

function openSimpleResultsHub(){
  const m=document.getElementById('simpleResultsModal');
  if(m)m.classList.add('show');
}
function closeSimpleResultsHub(){
  const m=document.getElementById('simpleResultsModal');
  if(m)m.classList.remove('show');
}

(function initResultsArchiveV138(){
  const bind=(id,fn)=>{
    const el=document.getElementById(id);
    if(el)el.onclick=fn;
  };

  bind('resultsBtn',()=>openSimplifiedResults());
  bind('hubResultsBtn',()=>openSimplifiedResults());
  bind('hubArchivesBtn',()=>renderArchives());
  bind('hubHomeBtn',()=>renderHome());

  bind('resultsBackHubBtn',()=>renderHome());
  bind('archivesBackHubBtn',()=>renderHome());

  bind('simpleResultsClosureBtn',()=>renderClosure());
  bind('simpleResultsPdfBtn',()=>openCurrentReport());
  bind('productSheetsBtn',()=>openProductSheets());
  bind('productSheetsBackBtn',()=>closeProductSheets());
  bind('saveProductSheetsBtn',()=>saveProductSheets());
  bind('simpleResultsEmailBtn',()=>emailCurrentReport());
  bind('simpleResultsArchiveBtn',()=>archiveCurrentJury());
  bind('simpleResultsMoreBtn',()=>toggleSimpleResultsDetails());

  bind('saveReportNoteBtn',()=>saveReportNote());
  bind('clearReportNoteBtn',()=>clearReportNote());
  bind('archiveMoreFiltersBtn',()=>toggleArchiveFilters());

  const note=document.getElementById('reportNoteInput');
  if(note){
    note.oninput=()=>{
      const s=document.getElementById('reportNoteState');
      if(s){
        s.textContent='À enregistrer';
        s.classList.add('changed');
      }
    };
  }
})();

(function initSimpleHomeV69(){
  const results=document.getElementById('resultsBtn');
  if(results)results.onclick=openSimplifiedResults;
  const current=document.getElementById('simpleCurrentResultsBtn');
  if(current)current.onclick=()=>{closeSimpleResultsHub();openSimplifiedResults()};
  const archives=document.getElementById('simpleArchivesBtn');
  if(archives)archives.onclick=()=>{closeSimpleResultsHub();renderArchives()};
  const stats=document.getElementById('simpleStatsBtn');
  if(stats)stats.onclick=()=>{closeSimpleResultsHub();renderStats()};
  const close=document.getElementById('simpleResultsCloseBtn');
  if(close)close.onclick=closeSimpleResultsHub;
  const modal=document.getElementById('simpleResultsModal');
  if(modal)modal.addEventListener('click',e=>{if(e.target===modal)closeSimpleResultsHub()});
})();


document.addEventListener('fullscreenchange',()=>{
  document.body.classList.toggle('projection-fullscreen',!!document.fullscreenElement);
});
