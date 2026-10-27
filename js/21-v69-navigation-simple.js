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
function loadJuryConclusionIntoForm(){
  const input=$('#juryConclusionInput');
  const stateLabel=$('#juryConclusionState');
  if(!input)return;
  input.value=state.config?.juryConclusion||'';
  if(stateLabel){stateLabel.textContent='Enregistré';stateLabel.classList.remove('changed');}
}
function saveJuryConclusion(){
  const input=$('#juryConclusionInput');
  if(!input)return;
  if(!state.config)state.config={};
  state.config.juryConclusion=String(input.value||'').trim();
  state.config.juryConclusionUpdatedAt=new Date().toISOString();
  saveState();
  const stateLabel=$('#juryConclusionState');
  if(stateLabel){stateLabel.textContent='Enregistré ✓';stateLabel.classList.remove('changed');}
  toast('Conclusion enregistrée dans le rapport ✓');
}
function clearJuryConclusion(){
  const input=$('#juryConclusionInput');
  if(!input)return;
  input.value='';
  if(!state.config)state.config={};
  state.config.juryConclusion='';
  state.config.juryConclusionUpdatedAt=new Date().toISOString();
  saveState();
  const stateLabel=$('#juryConclusionState');
  if(stateLabel){stateLabel.textContent='Enregistré';stateLabel.classList.remove('changed');}
  toast('Conclusion supprimée du rapport');
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
  loadJuryConclusionIntoForm();
  const v=$('#adminView');
  if(v)v.classList.remove('show-results-details');
  syncSimpleResultsActions();
}
function syncSimpleResultsActions(){
  const hint=$('#simpleResultsHint');
  const title=$('#simpleResultsNextTitle');
  const closureBtn=$('#simpleResultsClosureBtn');
  const receptionBtn=$('#simpleResultsReceptionBtn');
  const sheetsBtn=$('#productSheetsBtn');
  const reportBtn=$('#simpleResultsPdfBtn');
  const archiveBtn=$('#simpleResultsArchiveBtn');
  const moreBtn=$('#simpleResultsMoreBtn');
  if(!hint)return;

  const total=totalSamples();
  const done=totalCompleted();
  const max=state.config.testerCount*total;
  const complete=max>0&&done===max&&validatedCount()===state.config.testerCount;
  const closed=isJuryClosed();
  const closureReady=closureIsReady();
  const ps=(typeof productSheetsProgress==='function')?productSheetsProgress(state):{total:0,filled:0};
  const sheetsReady=ps.total>0&&ps.filled===ps.total;
  const rs=(typeof receptionStatusForConfig==='function')?receptionStatusForConfig(state.config):{key:'pending',done:0,total:0};
  const receptionsReady=rs.key==='done'&&Number(rs.done||0)>0;
  const archived=!!state.config?._archive?.archivedAt;

  const stepButtons=[closureBtn,receptionBtn,sheetsBtn,reportBtn,archiveBtn].filter(Boolean);
  stepButtons.forEach(b=>{
    b.classList.remove('btn-primary','simple-results-next-btn','simple-results-complete-v305');
    b.classList.add('btn-secondary');
  });

  if(closureBtn){
    /* V321 — Clôture reste toujours accessible.
       Même lorsqu'elle est complète, on peut la rouvrir pour vérifier ou modifier. */
    closureBtn.disabled=false;
    closureBtn.textContent=closureReady?'✓ 1. Clôture — OK':'✍️ 1. Clôture';
    closureBtn.classList.toggle('simple-results-complete-v305',closureReady);
  }
  if(receptionBtn){
    receptionBtn.disabled=false;
    receptionBtn.textContent=receptionsReady
      ?'✓ Réceptions marchandises — OK'
      :`📦 Réceptions marchandises${Number(rs.total||0)>0?` (${Number(rs.done||0)}/${Number(rs.total||0)})`:''}`;
    receptionBtn.classList.toggle('simple-results-complete-v305',receptionsReady);
  }
  if(sheetsBtn){
    sheetsBtn.disabled=!complete;
    sheetsBtn.textContent=sheetsReady
      ?'✓ 2. Fiches produits — OK'
      :`📋 2. Fiches produits${ps.total?` (${ps.filled}/${ps.total})`:''}`;
    sheetsBtn.classList.toggle('simple-results-complete-v305',sheetsReady);
  }
  if(reportBtn){
    /* V324 — ne plus bloquer le dossier sur le drapeau technique juryClose.
       Les étapes visibles de fin de jury sont la référence. */
    reportBtn.disabled=!(complete&&closureReady&&sheetsReady);
    reportBtn.textContent='📚 4. Dossier résultats';
  }
  if(archiveBtn){
    archiveBtn.disabled=!(complete&&closed&&closureReady&&sheetsReady);
    archiveBtn.textContent=archived?'✓ 4. Archivé':'📁 4. Archiver';
  }

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

function openSimpleResultsReceptionV305(){
  if(typeof state==='undefined'||!state?.config)return;
  if(typeof receptionStatusForConfig!=='function'||typeof openReceptionView!=='function')return;

  draftConfig=null;
  const rs=receptionStatusForConfig(state.config);
  if(rs.key==='done'){
    const idx=(typeof latestValidatedReceptionIndex==='function')
      ?latestValidatedReceptionIndex(state.config)
      :-1;
    if(idx>=0){openReceptionView(idx);return;}
  }
  openReceptionView(-1);
}

function ensureSimpleResultsCompleteStyleV305(){
  if(document.getElementById('simpleResultsCompleteStyleV305'))return;
  const s=document.createElement('style');
  s.id='simpleResultsCompleteStyleV305';
  s.textContent='.simple-results-action-buttons .simple-results-complete-v305{display:inline-flex!important;background:#e8f6ef!important;border-color:#58a982!important;color:#176b4d!important;font-weight:850!important;box-shadow:0 0 0 2px rgba(72,167,122,.08)}';
  document.head.appendChild(s);
}
ensureSimpleResultsCompleteStyleV305();

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
  bind('simpleResultsReceptionBtn',()=>openSimpleResultsReceptionV305());
  bind('simpleResultsPdfBtn',()=>openCurrentReport());
  bind('productSheetsBtn',()=>openProductSheets());
  bind('productSheetsBackBtn',()=>closeProductSheets());
  bind('saveProductSheetsBtn',()=>saveProductSheets());
  bind('simpleResultsEmailBtn',()=>emailCurrentReport());
  bind('simpleResultsArchiveBtn',()=>archiveCurrentJury());
  bind('simpleResultsMoreBtn',()=>toggleSimpleResultsDetails());

  bind('saveReportNoteBtn',()=>saveReportNote());
  bind('clearReportNoteBtn',()=>clearReportNote());
  bind('saveJuryConclusionBtn',()=>saveJuryConclusion());
  bind('clearJuryConclusionBtn',()=>clearJuryConclusion());
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
  const conclusion=document.getElementById('juryConclusionInput');
  if(conclusion){
    conclusion.oninput=()=>{
      const s=document.getElementById('juryConclusionState');
      if(s){s.textContent='À enregistrer';s.classList.add('changed');}
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

/* V348 — choisir le lot avant de consulter ses résultats. */
async function openResultsLotChooserV348(){
  // Opening a read-only chooser must not depend on a storage write.
  // In particular, a browser quota error must not block access to results.
  let rows=loadPreparedJurys().filter(r=>r?.state?.config?.products?.length&&!r.state.config._archive?.archivedAt);
  const currentId=String(state?.config?._preparedId||'');
  if(state?.config?.products?.length&&!state.config._archive?.archivedAt&&
     !rows.some(r=>String(r.id)===currentId)){
    rows.unshift({id:currentId,name:state.config.lotName,state:deepClone(state),current:true});
  }
  if(cloudReady&&window.JuryOwnerSyncV357?.readResultsChoices){
    toast('Chargement des lots partagés…');
    try{rows=await window.JuryOwnerSyncV357.readResultsChoices();}
    catch(e){console.error('Résultats V388',e);toast('Liste partagée indisponible : copies locales affichées.');}
  }
  if(!rows.length)toast('Aucun résultat disponible. Vous pouvez rechercher la copie du lot D.');
  let modal=document.getElementById('resultsLotModalV348');
  if(!modal){
    modal=document.createElement('div');
    modal.id='resultsLotModalV348';
    modal.className='modal-backdrop';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','resultsLotTitleV348');
    modal.innerHTML='<div class="modal-card" style="width:min(620px,94vw);max-height:85vh;overflow:auto;background:white;color:#173f5c;border-radius:24px;padding:24px"><h2 id="resultsLotTitleV348">Quel lot voulez-vous consulter ?</h2><p>Choisissez le lot pour afficher ses résultats.</p><div id="resultsLotListV348"></div><div style="text-align:right;margin-top:18px"><button type="button" class="btn btn-secondary" data-results-cancel>Annuler</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('[data-results-cancel]').onclick=()=>modal.classList.remove('show');
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});
    modal.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('show')});
  }
  const list=modal.querySelector('#resultsLotListV348');
  list.innerHTML=rows.map((r,i)=>{
    const cfg=r.state.config,meta=preparedJuryMeta(r.state);
    const status=cfg.juryClose?.closedAt?'Jury terminé':cfg.juryLaunch?.openedAt?'Jury en cours':'Jury préparé';
    return '<button type="button" class="prepare-jury-choice" data-results-lot="'+i+'"><span><strong>'+escapeHtml(cfg.lotName||r.name||'Jury')+'</strong><span>'+meta.products+' produit(s) · '+meta.samples+' échantillon(s)</span><span class="prepare-jury-status">'+status+'</span></span><b>›</b></button>';
  }).join('');
  list.querySelectorAll('[data-results-lot]').forEach(btn=>btn.onclick=()=>{
    const rec=rows[Number(btn.dataset.resultsLot)];
    if(String(rec.id)!==String(state?.config?._preparedId||'')||hashJson(rec.state)!==hashJson(state)){
      saveState();
      state=deepClone(rec.state);
      if(rec.id)state.config._preparedId=rec.id;
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      currentTester=1;
      currentProduct=state.config.products?.[0]?.id||'';
      currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
    }
    draftConfig=null;
    modal.classList.remove('show');
    openSimplifiedResults();
  });
  let recovery=modal.querySelector('[data-recover-lot-d]');
  if(!recovery){recovery=document.createElement('button');recovery.type='button';recovery.className='btn btn-secondary';recovery.setAttribute('data-recover-lot-d','');recovery.textContent='Retrouver le lot 4 — D';recovery.onclick=openLotDRecoveryV389;list.after(recovery);}
  recovery.style.display=rows.some(r=>window.JuryOwnerSyncV357?.isLotDRecoveryV389(r.state?.config))?'none':'inline-flex';
  modal.classList.add('show');
  list.querySelector('button')?.focus();
}
document.getElementById('resultsBtn').onclick=openResultsLotChooserV348;
if(document.getElementById('hubResultsBtn'))document.getElementById('hubResultsBtn').onclick=openResultsLotChooserV348;

/* V363: recognize a stationary touch on Results without depending on the
 * browser's synthetic click. Keep scrolling inert and report handler failures. */
(function(){
  const button=document.getElementById('resultsBtn');if(!button)return;
  let touch=null,lastTouch=0;
  function openResults(){
    try{
      if(typeof openResultsLotChooserV348!=='function')throw new Error('Le module de résultats n’est pas chargé.');
      openResultsLotChooserV348();
      const modal=document.getElementById('resultsLotModalV348');
      if(modal?.classList.contains('show'))modal.style.zIndex='10050';
    }catch(e){
      console.error('Results V363',e);
      alert('Résultats V363 : '+String(e?.message||e)+'\nLes données sont conservées.');
    }
  }
  button.onclick=function(e){
    e.preventDefault();
    if(Date.now()-lastTouch<700)return;
    openResults();
  };
  button.addEventListener('touchstart',e=>{
    const p=e.touches[0];touch=p&&e.touches.length===1?{x:p.clientX,y:p.clientY,moved:false}:null;
  },{passive:true});
  button.addEventListener('touchmove',e=>{
    if(!touch)return;
    const p=e.touches[0];
    if(!p||Math.hypot(p.clientX-touch.x,p.clientY-touch.y)>10)touch.moved=true;
  },{passive:true});
  button.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  button.addEventListener('touchend',e=>{
    const p=e.changedTouches[0],tap=touch&&p&&!touch.moved&&Math.hypot(p.clientX-touch.x,p.clientY-touch.y)<=10;
    touch=null;
    if(!tap)return;
    e.preventDefault();lastTouch=Date.now();openResults();
  },{passive:false});
  button.setAttribute('data-results-version','363');
})();


/* V389: recovery is a separate, explicit action. Merely opening Results
 * never restores a deleted jury or publishes a device backup. */
async function openLotDRecoveryV389(){
  if(guestTester)return;
  const api=window.JuryOwnerSyncV357;
  if(!api?.findLotDBackups){toast('Le module de récupération doit être actualisé.');return;}
  let modal=document.getElementById('lotDRecoveryV389');
  if(!modal){
    modal=document.createElement('div');modal.id='lotDRecoveryV389';modal.className='modal-backdrop';
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','lotDRecoveryTitleV389');
    modal.innerHTML='<div class="modal-card" style="width:min(680px,94vw);max-height:85vh;overflow:auto;background:white;color:#173f5c;border-radius:24px;padding:24px"><h2 id="lotDRecoveryTitleV389">Retrouver le lot 4 — D</h2><p data-recovery-status role="status"></p><div data-recovery-list></div><button type="button" class="btn btn-secondary" data-recovery-close>Fermer</button></div>';
    document.body.appendChild(modal);
    modal.querySelector('[data-recovery-close]').onclick=()=>modal.classList.remove('show');
    modal.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('show')});
  }
  document.getElementById('resultsLotModalV348')?.classList.remove('show');
  modal.style.zIndex='10060';modal.classList.add('show');
  const info=modal.querySelector('[data-recovery-status]'),list=modal.querySelector('[data-recovery-list]');
  list.innerHTML='';info.textContent='Recherche des copies de secours sur cet appareil…';
  try{
    const copies=await api.findLotDBackups();
    if(!copies.length){info.textContent='Aucune copie complète du lot D trouvée sur cet appareil. Essayez ce même bouton sur le S24, puis sur l’iPad et le PC. Ne recréez pas le lot pour l’instant.';return;}
    info.textContent='Copies trouvées. Vérifiez les produits, la date et le nombre de réponses avant de choisir. Les lots E et F seront conservés.';
    for(const copy of copies){
      const cfg=copy.state.config,answers=Object.values(copy.state.testers||{}).reduce((n,t)=>n+Object.values(t.answers||{}).reduce((m,a)=>m+(a.choices||[]).filter(v=>v!==null&&v!==undefined).length,0),0);
      const card=document.createElement('div');card.style.cssText='border:1px solid #ccdce3;border-radius:16px;padding:16px;margin:12px 0';
      const title=document.createElement('strong');title.textContent=[cfg.lotName,cfg.lotTitle||cfg.subtitle].filter(Boolean).join(' — ');card.appendChild(title);
      const detail=document.createElement('p');detail.textContent=cfg.products.map(p=>p.name||'Produit').join(' · ')+' — '+cfg.products.length+' produits, '+cfg.products.reduce((n,p)=>n+(p.samples||[]).length,0)+' échantillons, '+answers+' notes renseignées';card.appendChild(detail);
      const date=document.createElement('p');date.textContent=copy.stamp&&Number.isFinite(Date.parse(copy.stamp))?'Copie du '+new Date(copy.stamp).toLocaleString('fr-FR'):copy.source;card.appendChild(date);
      const button=document.createElement('button');button.type='button';button.className='btn btn-primary';button.textContent='Rétablir cette copie du lot D';
      button.onclick=async()=>{
        if(!confirm('Rétablir uniquement cette copie du lot 4 — D dans le partage ?\n\nLes lots E et F seront conservés. Cette copie contient '+answers+' notes renseignées.'))return;
        if(typeof securityEnabled==='function'&&securityEnabled()){
          const pin=prompt('Votre PIN propriétaire pour rétablir le lot D :');if(pin===null)return;
          if(!(await verifyPin(String(pin).trim()))){info.textContent='Code PIN incorrect. Rien n’a été changé.';return;}
        }
        list.querySelectorAll('button').forEach(b=>b.disabled=true);
        try{await api.restoreLotDBackup(copy.state);info.textContent='Lot D rétabli dans le partage. Fermez cette fenêtre, puis rouvrez Résultats.';}
        catch(e){info.textContent=e.message||String(e);list.querySelectorAll('button').forEach(b=>b.disabled=false);}
      };
      card.appendChild(button);list.appendChild(card);
    }
  }catch(e){info.textContent='Recherche impossible : '+(e.message||String(e))+'. Les copies sont conservées.';}
}
