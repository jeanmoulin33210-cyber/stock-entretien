/* --- V30 : répétition générale locale, sans écriture réelle --- */
let rehearsalState=null;
let rehearsalReturnView='homeView';

function makeRehearsalState(){
  const cfg=deepClone(state.config||{});
  delete cfg.juryLaunch;delete cfg.juryClose;delete cfg.closure;delete cfg._archive;
  const sim=makeInitialState(cfg);
  sim.config.juryLaunch={openedAt:new Date().toISOString(),mode:'demo',sessionId:''};
  for(let t=1;t<=Number(sim.config.testerCount||0);t++){
    sim.testers[t].answers={};sim.testers[t].validatedAt=null
  }
  return sim
}
function rehearsalAllSlots(sim){
  const rows=[];
  for(let t=1;t<=Number(sim.config.testerCount||0);t++)
    (sim.config.products||[]).forEach((p,pi)=>(p.samples||[]).forEach((sm,si)=>rows.push({t,p,sm,pi,si})));
  return rows
}
function rehearsalChoices(t,pi,si){
  const seed=t*17+(pi+1)*11+(si+1)*7;
  const regular=[2,3,3,3,4];
  const taste=[3,4,4,5,4];
  return[
    regular[(seed+0)%regular.length],
    regular[(seed+1)%regular.length],
    regular[(seed+2)%regular.length],
    regular[(seed+3)%regular.length],
    taste[(seed+4)%taste.length]
  ]
}
function rehearsalAnswer(t,pi,si){
  const choices=rehearsalChoices(t,pi,si);
  const remarks=Array(QUESTIONS.length).fill('');
  if((t+pi+si)%7===0)remarks[4]='Bon équilibre général, remarque fictive de démonstration.';
  if((t+pi+si)%11===0)remarks[1]='Texture à surveiller — remarque fictive.';
  return{choices,remarks}
}
function setRehearsalProgress(percent){
  if(!rehearsalState)rehearsalState=makeRehearsalState();
  const slots=rehearsalAllSlots(rehearsalState),target=Math.round(slots.length*Math.max(0,Math.min(100,percent))/100);
  for(let t=1;t<=Number(rehearsalState.config.testerCount||0);t++){rehearsalState.testers[t].answers={};rehearsalState.testers[t].validatedAt=null}
  slots.slice(0,target).forEach(x=>{
    rehearsalState.testers[x.t].answers[`${x.p.id}__${x.sm.id}`]=rehearsalAnswer(x.t,x.pi,x.si)
  });
  renderRehearsalData()
}
function rehearsalValidateAll(){
  if(!rehearsalState)rehearsalState=makeRehearsalState();
  const total=(rehearsalState.config.products||[]).reduce((n,p)=>n+(p.samples||[]).length,0);
  let incomplete=false;
  for(let t=1;t<=Number(rehearsalState.config.testerCount||0);t++){
    let done=0;
    for(const p of rehearsalState.config.products||[])for(const sm of p.samples||[]){
      if(stateCompleteAnswer(rehearsalState.testers[t]?.answers?.[`${p.id}__${sm.id}`]))done++
    }
    if(done<total)incomplete=true
  }
  if(incomplete){alert('Dans la simulation, tous les testeurs doivent d’abord être à 100 %. Cliquez sur « Simuler 100 % », puis validez.');return}
  const now=new Date().toISOString();
  for(let t=1;t<=Number(rehearsalState.config.testerCount||0);t++)rehearsalState.testers[t].validatedAt=now;
  renderRehearsalData()
}
function rehearsalOverallAvg(sim){
  let total=0,count=0;
  for(let t=1;t<=Number(sim.config.testerCount||0);t++)for(const p of sim.config.products||[])for(const sm of p.samples||[]){
    const a=sim.testers[t]?.answers?.[`${p.id}__${sm.id}`];
    if(stateCompleteAnswer(a)){total+=stateAnswerScore(a);count++}
  }
  return count?total/count:0
}
function rehearsalCriteria(sim){
  const sums=Array(QUESTIONS.length).fill(0),counts=Array(QUESTIONS.length).fill(0);
  for(let t=1;t<=Number(sim.config.testerCount||0);t++)for(const p of sim.config.products||[])for(const sm of p.samples||[]){
    const a=sim.testers[t]?.answers?.[`${p.id}__${sm.id}`];if(!stateCompleteAnswer(a))continue;
    a.choices.forEach((idx,qi)=>{sums[qi]+=QUESTIONS[qi].weights[idx];counts[qi]++})
  }
  const names=criterionShortsForConfig(sim?.config);return sums.map((v,i)=>({name:names[i]||`Critère ${i+1}`,avg:counts[i]?v/counts[i]:0,max:Math.max(...QUESTIONS[i].weights),count:counts[i]}))
}
function renderRehearsal(from){
  if(from)rehearsalReturnView=from;
  if(!rehearsalState)rehearsalState=makeRehearsalState();
  updateHeader();showView('rehearsalView');
  $('#headerTitle').textContent='Répétition générale';$('#headerSub').textContent=state.config?.lotName||'Jury Marchés';
  renderRehearsalData()
}
function renderRehearsalData(){
  const sim=rehearsalState;if(!sim)return;
  const samples=(sim.config.products||[]).reduce((n,p)=>n+(p.samples||[]).length,0),testerCount=Number(sim.config.testerCount||0),expected=samples*testerCount;
  const completed=stateCompletedCount(sim),validated=stateValidatedCount(sim),pct=expected?Math.round(completed/expected*100):0;
  $('#rehearsalState').textContent=`${pct} %`;
  $('#rehearsalStateDetail').textContent=validated===testerCount&&testerCount>0?'Tous les testeurs fictifs sont terminés et validés.':`${completed}/${expected} fiche${expected>1?'s':''} fictive${expected>1?'s':''} complète${completed>1?'s':''}.`;
  $('#rehearsalCompleted').textContent=`${completed}/${expected}`;
  $('#rehearsalValidated').textContent=`${validated}/${testerCount}`;
  $('#rehearsalProducts').textContent=sim.config.products?.length||0;
  $('#rehearsalSamples').textContent=samples;
  $('#rehearsalAvg').textContent=completed?`${fmt(rehearsalOverallAvg(sim))}/65`:'—';

  const testers=$('#rehearsalTesters');testers.innerHTML='';
  for(let t=1;t<=testerCount;t++){
    let done=0;
    for(const p of sim.config.products||[])for(const sm of p.samples||[])if(stateCompleteAnswer(sim.testers[t]?.answers?.[`${p.id}__${sm.id}`]))done++;
    const tp=samples?Math.round(done/samples*100):0,val=!!sim.testers[t]?.validatedAt,name=sim.testers[t]?.name||`Testeur ${t}`;
    const d=document.createElement('div');d.className='rehearsal-tester';
    d.innerHTML=`<div class="rehearsal-tester-top"><strong>${escapeHtml(name)}</strong><span>${val?'Validé ✓':done===samples&&samples?'À valider':done?'En cours':'À démarrer'} · ${done}/${samples}</span></div><div class="rehearsal-progress"><i style="width:${tp}%"></i></div>`;
    testers.appendChild(d)
  }

  const ranking=stateSupplierRanking(sim),rankBox=$('#rehearsalRanking');
  rankBox.innerHTML=ranking.length?ranking.slice(0,10).map((r,i)=>`<div class="rehearsal-rank"><div class="n">${i+1}</div><div><strong>${escapeHtml(r.supplier)}</strong><span>${r.count} évaluation${r.count>1?'s':''}</span></div><div class="rehearsal-score">${r.count?fmt(r.avg):'—'}/65</div></div>`).join(''):'<div style="font-size:10px;color:var(--muted)">Les résultats apparaîtront dès que des fiches fictives seront complétées.</div>';

  const criteria=rehearsalCriteria(sim);
  $('#rehearsalCriteria').innerHTML=criteria.map(c=>`<div class="rehearsal-criterion"><small>${escapeHtml(c.name)}</small><strong>${c.count?fmt(c.avg):'—'}</strong><span>/ ${fmt(c.max)}</span></div>`).join('');

  const closure=$('#rehearsalClosureCheck');
  const canClose=expected>0&&completed===expected&&validated===testerCount;
  closure.className=`rehearsal-check ${canClose?'ok':'warn'}`;
  closure.innerHTML=canClose?'✓ <strong>Test de fin de jury réussi :</strong> dans ce scénario, la fermeture officielle serait autorisée.':'⚠️ <strong>Fin de jury non prête :</strong> il faut que toutes les fiches soient complètes et que tous les testeurs aient validé.';
}
function resetRehearsal(){
  rehearsalState=makeRehearsalState();renderRehearsalData();toast('Simulation réinitialisée')
}
function backFromRehearsal(){
  rehearsalState=null;
  if(rehearsalReturnView==='launchView')renderLaunchView();else renderHome()
}

$('#rehearsalHomeBtn').onclick=()=>renderRehearsal('homeView');
$('#launchRehearsalBtn').onclick=()=>renderRehearsal('launchView');
document.querySelectorAll('[data-rehearsal-progress]').forEach(b=>b.onclick=()=>setRehearsalProgress(Number(b.dataset.rehearsalProgress)));
$('#rehearsalValidateBtn').onclick=rehearsalValidateAll;
$('#rehearsalResetBtn').onclick=resetRehearsal;
$('#rehearsalBackBtn').onclick=backFromRehearsal;
