/* --- V23 : mode Jour du jury --- */
const LIVE_ALERT_STORAGE_KEY='jm_test_culinaire_live_alert_minutes_v1';
let liveDayTimer=null;

function liveAlertMinutes(){
  return Number($('#liveAlertMinutes')?.value||localStorage.getItem(LIVE_ALERT_STORAGE_KEY)||10)
}
function liveElapsedText(at){
  if(!at)return 'Aucune activité';
  const d=new Date(at),ms=Date.now()-d.getTime();
  if(!Number.isFinite(ms))return '—';
  const min=Math.max(0,Math.floor(ms/60000));
  if(min<1)return 'À l’instant';
  if(min<60)return `Il y a ${min} min`;
  const h=Math.floor(min/60),m=min%60;
  return `Il y a ${h} h${m?` ${m} min`:''}`
}
function liveMinutesSince(at){
  if(!at)return null;
  const ms=Date.now()-new Date(at).getTime();
  return Number.isFinite(ms)?Math.max(0,ms/60000):null
}
function liveLastSampleLabel(t){
  const meta=testerActivityMeta?.[t];if(!meta?.productId||!meta?.sampleId)return '—';
  const p=state.config.products.find(x=>String(x.id)===String(meta.productId));
  return `${p?.name||'Produit'} · Éch. ${meta.sampleId}`
}
function liveTesterState(t,online){
  const total=totalSamples(),done=testerCompleted(t),validated=testerValidated(t),meta=testerActivityMeta?.[t]||{};
  const pct=total?Math.round(done/total*100):0;
  const mins=liveMinutesSince(meta.lastAt);
  const threshold=liveAlertMinutes();
  const stalled=online&&!validated&&done<total&&mins!==null&&mins>=threshold;
  let status='À démarrer',cls='';
  if(validated){status='Validé ✓';cls='validated'}
  else if(done>=total&&total>0){status='Test terminé · à valider';cls='done'}
  else if(done>0){status='En cours';cls=stalled?'alert':'online'}
  else if(online){status='Connecté · en attente';cls='online'}
  else status='Pas encore connecté';
  return{total,done,validated,pct,mins,stalled,status,cls,lastAt:meta.lastAt||'',online}
}
function renderLiveDay(){
  updateHeader();showView('liveDayView');
  $('#headerTitle').textContent='Mode jour du jury';$('#headerSub').textContent=state.config.lotName||'Jury Marchés';
  const p=lotDisplayParts();$('#liveDayTitle').textContent=p.title||state.config.lotName||'Jour du jury';$('#liveDaySubtitle').textContent=p.subtitle||'Suivi en direct des testeurs';
  const saved=localStorage.getItem(LIVE_ALERT_STORAGE_KEY)||'10';$('#liveAlertMinutes').value=saved;
  renderLiveDayCards();
  clearInterval(liveDayTimer);liveDayTimer=setInterval(()=>{if($('#liveDayView')?.classList.contains('active'))renderLiveDayCards()},10000)
}
function renderLiveDayCards(){
  const grid=$('#liveTesterGrid');if(!grid)return;
  const onlineSet=(typeof testerPresenceNumbers==='function')?testerPresenceNumbers():new Set();
  const count=Number(state.config.testerCount||0),states=[];
  for(let i=1;i<=count;i++)states.push({i,...liveTesterState(i,onlineSet.has(i))});
  const online=states.filter(x=>x.online).length;
  const running=states.filter(x=>!x.validated&&x.done>0&&x.done<x.total).length;
  const done=states.filter(x=>!x.validated&&x.total>0&&x.done>=x.total).length;
  const validated=states.filter(x=>x.validated).length;
  const alerts=states.filter(x=>x.stalled).length;
  $('#liveOnlineCount').textContent=online;$('#liveRunningCount').textContent=running;$('#liveDoneCount').textContent=done;$('#liveValidatedCount').textContent=validated;$('#liveAlertCount').textContent=alerts;
  $('#liveClock').textContent=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  $('#liveCloudState').textContent=cloudReady?`Session sécurisée · ${online}/${count} testeur${count>1?'s':''} connecté${online>1?'s':''}`:'Mode local · présence temps réel indisponible';
  grid.innerHTML='';
  states.forEach(s=>{
    const name=state.testers[s.i]?.name||`Testeur ${s.i}`;
    const presenceClass=s.stalled?'alert':s.online?'online':'';
    const card=document.createElement('article');card.className=`panel live-tester ${s.cls}`;
    card.innerHTML=`<div class="live-tester-top"><div class="live-person"><div class="live-avatar">${s.i}</div><div><h3>${escapeHtml(name)}</h3><p>${s.done}/${s.total} échantillon${s.total>1?'s':''} complet${s.done>1?'s':''}</p></div></div><span class="live-presence ${presenceClass}"><i class="live-dot"></i>${s.stalled?'Inactif':s.online?'Connecté':'Hors ligne'}</span></div>
      <div class="live-status-row"><span class="live-status">${escapeHtml(s.status)}</span><span class="live-percent">${s.pct}%</span></div>
      <div class="live-progress"><span style="width:${s.pct}%"></span></div>
      <div class="live-meta"><div><small>Dernière activité</small><strong>${escapeHtml(liveElapsedText(s.lastAt))}</strong></div><div><small>Dernier échantillon</small><strong title="${escapeHtml(liveLastSampleLabel(s.i))}">${escapeHtml(liveLastSampleLabel(s.i))}</strong></div></div>
      <div class="live-alert ${s.stalled?'':'hidden'}">⚠️ Aucun changement synchronisé depuis ${Math.floor(s.mins||0)} minutes. Vérifiez simplement que le testeur n’est pas bloqué.</div>`;
    grid.appendChild(card)
  })
}
async function refreshLiveDay(){
  if(cloudReady&&typeof reloadCloudAnswers==='function')await reloadCloudAnswers();
  renderLiveDayCards();toast('Suivi actualisé')
}
async function toggleLiveFullscreen(){
  try{
    if(!document.fullscreenElement){
      await document.documentElement.requestFullscreen();document.body.classList.add('live-fullscreen');$('#liveFullscreenBtn').textContent='⛶ Quitter plein écran'
    }else{
      await document.exitFullscreen()
    }
  }catch(e){toast('Plein écran non disponible sur cet appareil')}
}
document.addEventListener('fullscreenchange',()=>{
  const active=!!document.fullscreenElement;document.body.classList.toggle('live-fullscreen',active);
  const b=$('#liveFullscreenBtn');if(b)b.textContent=active?'⛶ Quitter plein écran':'⛶ Plein écran'
});
$('#juryLiveDayBtn').onclick=renderLiveDay;
$('#liveRefreshBtn').onclick=refreshLiveDay;
$('#liveFullscreenBtn').onclick=toggleLiveFullscreen;
$('#liveBackBtn').onclick=()=>{clearInterval(liveDayTimer);renderJuryView()};
$('#liveAlertMinutes').onchange=e=>{localStorage.setItem(LIVE_ALERT_STORAGE_KEY,e.target.value);renderLiveDayCards()};
