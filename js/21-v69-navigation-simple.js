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
  const archiveBtn=$('#simpleResultsArchiveBtn');
  const moreBtn=$('#simpleResultsMoreBtn');
  if(!hint||!archiveBtn)return;

  const total=totalSamples();
  const done=totalCompleted();
  const max=state.config.testerCount*total;
  const complete=max>0&&done===max&&validatedCount()===state.config.testerCount;
  const closed=isJuryClosed();
  const ready=closed&&closureIsReady();

  archiveBtn.disabled=!ready;

  if(ready){
    hint.textContent='Le jury est finalisé. Vous pouvez télécharger le PDF ou l’archiver.';
  }else if(!complete){
    hint.textContent='Les résultats sont encore provisoires : tous les testeurs n’ont pas terminé et validé.';
  }else if(!closed){
    hint.textContent='Tous les tests sont validés. Fermez d’abord le jury avant de pouvoir l’archiver.';
  }else{
    hint.textContent='Le jury est fermé. Complétez la fiche de clôture avant l’archivage.';
  }

  if(moreBtn){
    moreBtn.textContent=$('#adminView')?.classList.contains('show-results-details')
      ?'Masquer les détails'
      :'⚙️ Plus de détails';
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

  bind('resultsBtn',()=>openResultsArchiveHub());
  bind('hubResultsBtn',()=>openSimplifiedResults());
  bind('hubArchivesBtn',()=>renderArchives());
  bind('hubHomeBtn',()=>renderHome());

  bind('resultsBackHubBtn',()=>openResultsArchiveHub());
  bind('archivesBackHubBtn',()=>openResultsArchiveHub());

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
  if(results)results.onclick=openResultsArchiveHub;
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
