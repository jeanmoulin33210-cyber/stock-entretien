/* --- V29 : sauvegardes automatiques et reprise après incident --- */
const RECOVERY_STORAGE_KEY='jm_test_culinaire_recovery_v29';
const RECOVERY_MAX=8;
const RECOVERY_AUTO_MS=5*60*1000;
let recoveryBusy=false;
let lastRecoveryHash='';
let lastRecoveryAt=0;

function recoveryLoad(){
  try{
    const a=JSON.parse(localStorage.getItem(RECOVERY_STORAGE_KEY)||'[]');
    return Array.isArray(a)?a:[]
  }catch(e){return []}
}
function recoverySave(list){
  try{
    let rows=[...list].slice(0,RECOVERY_MAX);
    // Garde-fou pour éviter de saturer localStorage : environ 3,5 Mo max.
    while(rows.length>1&&JSON.stringify(rows).length>3500000)rows.pop();
    localStorage.setItem(RECOVERY_STORAGE_KEY,JSON.stringify(rows));
    return rows
  }catch(e){
    console.warn('Sauvegardes locales saturées',e);
    return recoveryLoad()
  }
}
function recoveryStateHash(st){
  try{
    const c=JSON.parse(JSON.stringify(st));
    if(c?.updatedAt)delete c.updatedAt;
    return JSON.stringify(c)
  }catch(e){return String(Date.now())}
}
function recoveryPhase(st){
  if(st?.config?.juryClose?.closedAt)return 'Jury fermé';
  if(st?.config?.juryLaunch?.openedAt)return 'Jury en cours';
  const any=Object.values(st?.testers||{}).some(t=>Object.keys(t?.answers||{}).length);
  return any?'Saisie commencée':'Préparation'
}
function recoveryMetrics(st){
  try{
    const total=(st?.config?.products||[]).reduce((n,p)=>n+(p.samples||[]).length,0);
    const testerCount=Number(st?.config?.testerCount||0);
    let completed=0,validated=0;
    for(let t=1;t<=testerCount;t++){
      for(const p of st.config.products||[])for(const s of p.samples||[]){
        const a=st.testers?.[t]?.answers?.[`${p.id}__${s.id}`];
        if(a&&Array.isArray(a.choices)&&a.choices.length===QUESTIONS.length&&a.choices.every(x=>x!==null&&x!==undefined))completed++
      }
      if(st.testers?.[t]?.validatedAt)validated++
    }
    return{samples:total,testerCount,completed,expected:total*testerCount,validated}
  }catch(e){return{samples:0,testerCount:0,completed:0,expected:0,validated:0}}
}
function createRecoverySnapshot(type='auto',label='',force=false){
  if(recoveryBusy||guestTester)return null;
  const now=Date.now(),hash=recoveryStateHash(state);
  if(!force&&type==='auto'){
    if(hash===lastRecoveryHash)return null;
    if(now-lastRecoveryAt<RECOVERY_AUTO_MS)return null
  }
  recoveryBusy=true;
  try{
    const list=recoveryLoad();
    const snap={
      id:`rec_${now}_${Math.random().toString(36).slice(2,7)}`,
      createdAt:new Date(now).toISOString(),
      type,
      label:label||(
        type==='manual'?'Sauvegarde manuelle':
        type==='milestone'?'Étape importante':'Sauvegarde automatique'
      ),
      lotName:state.config?.lotName||'Jury sans nom',
      phase:recoveryPhase(state),
      metrics:recoveryMetrics(state),
      state:deepClone(state)
    };
    const rows=recoverySave([snap,...list]);
    lastRecoveryHash=hash;lastRecoveryAt=now;
    if(document.getElementById('recoveryView')?.classList.contains('active'))renderRecovery();
    return rows[0]||snap
  }finally{recoveryBusy=false}
}
function recoveryMaybeAuto(){
  if(guestTester||recoveryBusy)return;
  createRecoverySnapshot('auto','Sauvegarde automatique',false)
}
function recoveryDate(v){
  try{return new Date(v).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return String(v||'')}
}
function recoveryAgo(v){
  const ms=Date.now()-new Date(v).getTime();if(!Number.isFinite(ms))return '';
  const m=Math.max(0,Math.floor(ms/60000));if(m<1)return 'à l’instant';if(m<60)return `il y a ${m} min`;
  const h=Math.floor(m/60);if(h<24)return `il y a ${h} h`;
  const d=Math.floor(h/24);return `il y a ${d} j`
}
function recoveryTypeLabel(t){return t==='manual'?'Manuelle':t==='milestone'?'Étape clé':'Automatique'}
function recoveryTypeClass(t){return t==='manual'?'manual':t==='milestone'?'milestone':'auto'}
function renderRecovery(){
  updateHeader();showView('recoveryView');$('#headerTitle').textContent='Sauvegardes';$('#headerSub').textContent='Reprise après incident';
  const list=recoveryLoad(),latest=list[0];
  $('#backupCount').textContent=list.length;
  $('#backupAutoCount').textContent=list.filter(x=>x.type==='auto').length;
  $('#backupMilestoneCount').textContent=list.filter(x=>x.type==='milestone').length;
  const bytes=new Blob([JSON.stringify(list)]).size;
  $('#backupSize').textContent=bytes<1024?`${bytes} o`:bytes<1048576?`${Math.round(bytes/1024)} Ko`:`${(bytes/1048576).toFixed(1)} Mo`;
  $('#backupLastTime').textContent=latest?recoveryDate(latest.createdAt):'Aucun';
  $('#backupLastDetail').textContent=latest?`${latest.label} · ${recoveryAgo(latest.createdAt)}`:'Créez votre premier point de restauration.';
  $('#backupCloudWarning').classList.toggle('show',!!cloudReady);
  const box=$('#backupList');box.innerHTML='';
  if(!list.length){
    box.innerHTML='<div class="panel backup-empty">Aucun point de restauration pour le moment.<br><small>Vous pouvez en créer un immédiatement avec le bouton ci-dessus.</small></div>';
    return
  }
  list.forEach(s=>{
    const m=s.metrics||{},row=document.createElement('article');row.className='panel backup-row';
    row.innerHTML=`<div><h3>${escapeHtml(s.label||'Sauvegarde')}</h3><p>${escapeHtml(s.lotName||'Jury')} · ${escapeHtml(recoveryDate(s.createdAt))} (${escapeHtml(recoveryAgo(s.createdAt))})</p>
      <div class="backup-meta"><span class="backup-chip ${recoveryTypeClass(s.type)}">${recoveryTypeLabel(s.type)}</span><span class="backup-chip">${escapeHtml(s.phase||'—')}</span><span class="backup-chip">${m.completed||0}/${m.expected||0} fiches</span><span class="backup-chip">${m.validated||0}/${m.testerCount||0} validations</span></div></div>
      <div class="backup-actions"><button class="btn btn-primary" data-rec-restore="${s.id}">Restaurer</button><button class="btn btn-secondary" data-rec-export="${s.id}">Exporter</button><button class="btn btn-danger" data-rec-delete="${s.id}">Supprimer</button></div>`;
    box.appendChild(row)
  });
  box.querySelectorAll('[data-rec-restore]').forEach(b=>b.onclick=()=>restoreRecovery(b.dataset.recRestore));
  box.querySelectorAll('[data-rec-export]').forEach(b=>b.onclick=()=>exportRecovery(b.dataset.recExport));
  box.querySelectorAll('[data-rec-delete]').forEach(b=>b.onclick=()=>deleteRecovery(b.dataset.recDelete))
}
function exportRecovery(id){
  const s=recoveryLoad().find(x=>x.id===id);if(!s)return alert('Sauvegarde introuvable.');
  const blob=new Blob([JSON.stringify({kind:'test-culinaire-recovery-v29',snapshot:s},null,2)],{type:'application/json'});
  const safe=String(s.lotName||'jury').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,50)||'jury';
  download(blob,`sauvegarde-${safe}-${String(s.createdAt).slice(0,10)}.json`);
  toast('Sauvegarde exportée ✓')
}
function exportLatestRecovery(){
  const s=recoveryLoad()[0];if(!s)return alert('Aucune sauvegarde disponible.');
  exportRecovery(s.id)
}
function deleteRecovery(id){
  const s=recoveryLoad().find(x=>x.id===id);if(!s)return;
  if(!confirm(`Supprimer ce point de restauration du ${recoveryDate(s.createdAt)} ?`))return;
  recoverySave(recoveryLoad().filter(x=>x.id!==id));renderRecovery();toast('Point de restauration supprimé')
}
function restoreRecovery(id){
  if(cloudReady){
    alert('Restauration bloquée pendant une connexion Supabase active. Déconnectez d’abord la session dans « Partage téléphones », puis revenez dans Sauvegardes. Cela évite d’écraser involontairement les données partagées.');
    return
  }
  const s=recoveryLoad().find(x=>x.id===id);if(!s?.state)return alert('Sauvegarde introuvable ou incomplète.');
  if(!confirm(`Restaurer le jury tel qu’il était le ${recoveryDate(s.createdAt)} ?\n\nLe jury actuel sera d’abord sauvegardé automatiquement.`))return;
  createRecoverySnapshot('milestone','Avant restauration',true);
  state=deepClone(s.state);
  originalSaveState();
  try{
    currentTester=1;
    currentProduct=state.config.products?.[0]?.id||'';
    currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
    adminProduct=currentProduct
  }catch(e){}
  lastRecoveryHash=recoveryStateHash(state);lastRecoveryAt=Date.now();
  toast('Sauvegarde restaurée ✓');
  renderHome()
}
function manualRecovery(){
  const s=createRecoverySnapshot('manual','Sauvegarde manuelle',true);
  if(s)toast('Sauvegarde manuelle créée ✓')
}

/* Création automatique au plus toutes les 5 minutes après une modification réelle. */
const rawSaveStateV29=saveState;
saveState=function(){
  rawSaveStateV29();
  setTimeout(recoveryMaybeAuto,0)
};

/* Points de restauration avant étapes sensibles. */
if(typeof clearAnswers==='function'){
  const rawClearAnswersV29=clearAnswers;
  clearAnswers=async function(...args){
    createRecoverySnapshot('milestone','Avant effacement des réponses',true);
    return await rawClearAnswersV29(...args)
  }
}
if(typeof closeJuryOfficially==='function'){
  const rawCloseJuryV29=closeJuryOfficially;
  closeJuryOfficially=async function(...args){
    createRecoverySnapshot('milestone','Avant fermeture officielle du jury',true);
    return await rawCloseJuryV29(...args)
  }
}
if(typeof archiveCurrentJury==='function'){
  const rawArchiveCurrentV29=archiveCurrentJury;
  archiveCurrentJury=function(...args){
    createRecoverySnapshot('milestone','Avant archivage du jury',true);
    return rawArchiveCurrentV29(...args)
  }
}
if(typeof officialLaunch==='function'){
  const rawOfficialLaunchV29=officialLaunch;
  officialLaunch=async function(...args){
    createRecoverySnapshot('milestone','Avant ouverture officielle du jury',true);
    return await rawOfficialLaunchV29(...args)
  }
}

$('#recoveryHomeBtn').onclick=renderRecovery;
$('#backupCreateNowBtn').onclick=manualRecovery;
$('#backupExportLatestBtn').onclick=exportLatestRecovery;
$('#backupBackBtn').onclick=renderHome;

/* Premier filet de sécurité : si aucun point n'existe encore, en créer un sans bruit. */
setTimeout(()=>{
  if(!guestTester&&!recoveryLoad().length)createRecoverySnapshot('auto','Point de départ',true)
},1200);
