/* --- V24 : préparation matérielle imprimable --- */
let prepReturnView='launchView';
let prepPrintMode='';

function prepParts(){
  return typeof lotDisplayParts==='function'?lotDisplayParts():{title:state.config?.lotName||'Jury',subtitle:state.config?.subtitle||''}
}
function prepAllSamples(){
  const rows=[];
  (state.config?.products||[]).forEach((p,pi)=>{
    (p.samples||[]).forEach((s,si)=>rows.push({
      productIndex:pi+1,productCode:p.code||'',productName:p.name||`Produit ${pi+1}`,
      sampleIndex:si+1,sampleId:s.id||'',supplier:s.supplier||''
    }))
  });
  return rows
}
function renderPrepView(from='launchView'){
  prepReturnView=from||prepReturnView||'launchView';
  updateHeader();showView('prepView');
  $('#headerTitle').textContent='Préparation matérielle';$('#headerSub').textContent=state.config.lotName||'Jury Marchés';
  const p=prepParts(),samples=prepAllSamples(),count=Number(state.config.testerCount||0);
  $('#prepJuryTitle').textContent=p.title||state.config.lotName||'Jury';
  $('#prepJuryDetail').textContent=`${state.config.products.length} produit${state.config.products.length>1?'s':''} · ${samples.length} échantillon${samples.length>1?'s':''} · ${count} testeur${count>1?'s':''}`;
  $('#prepAdminTitle').textContent=`Correspondance échantillons / fournisseurs — ${p.title||state.config.lotName||'Jury'}`;
  $('#prepAdminSub').textContent=p.subtitle||'Document confidentiel';
  $('#prepAdminMeta').innerHTML=`<span>${state.config.products.length} produit${state.config.products.length>1?'s':''}</span><span>${samples.length} échantillon${samples.length>1?'s':''}</span><span>Test à l’aveugle</span>`;
  renderPrepAdminTables();
  renderPrepTesters();
  renderPrepLabels();
}
function renderPrepAdminTables(){
  const box=$('#prepAdminTables');box.innerHTML='';
  (state.config.products||[]).forEach((p,pi)=>{
    const section=document.createElement('section');
    section.innerHTML=`<h4 class="prep-section-title">${escapeHtml(p.code?`${p.code} — `:'')}${escapeHtml(p.name||`Produit ${pi+1}`)}</h4>
    <table class="prep-table"><thead><tr><th>Échantillon</th><th>Fournisseur réel</th><th>Mis en place</th><th>Observation préparation</th></tr></thead><tbody>
    ${(p.samples||[]).map(s=>`<tr><td class="sample-no">${escapeHtml(s.id||'—')}</td><td><strong>${escapeHtml(s.supplier||'—')}</strong></td><td class="check"><span class="prep-check-box"></span></td><td></td></tr>`).join('')}
    </tbody></table>`;
    box.appendChild(section)
  })
}
function renderPrepTesters(){
  const p=prepParts(),count=Number(state.config.testerCount||0),grid=$('#prepTestersGrid');
  $('#prepTestersTitle').textContent=`Liste des membres — ${p.title||state.config.lotName||'Jury'}`;
  $('#prepTestersMeta').innerHTML=`<span>${count} membre${count>1?'s':''}</span><span>Feuille de présence</span>`;
  grid.innerHTML='';
  for(let i=1;i<=count;i++){
    const name=state.testers?.[i]?.name||state.config.testerNames?.[i-1]||`Testeur ${i}`;
    const d=document.createElement('div');d.className='tester-print-row';
    d.innerHTML=`<div class="tester-print-no">${i}</div><div><strong>${escapeHtml(name)}</strong><span>Accès Testeur ${i}</span></div><div><span>Signature</span><div class="tester-sign-line"></div></div>`;
    grid.appendChild(d)
  }
}
function renderPrepLabels(){
  const p=prepParts(),samples=prepAllSamples(),copies=Math.max(1,Math.min(4,Number($('#prepLabelCopies')?.value||2))),grid=$('#prepLabelsGrid');
  $('#prepLabelsTitle').textContent=`Étiquettes — ${p.title||state.config.lotName||'Jury'}`;
  $('#prepLabelsMeta').innerHTML=`<span>${samples.length} échantillon${samples.length>1?'s':''}</span><span>${copies} copie${copies>1?'s':''} / échantillon</span><span>Aucun fournisseur</span>`;
  grid.innerHTML='';
  samples.forEach(s=>{
    for(let c=1;c<=copies;c++){
      const d=document.createElement('div');d.className='sample-label';
      d.innerHTML=`<span class="cut">✂ découpe</span><small>ÉCHANTILLON</small><div class="number">${escapeHtml(s.sampleId||'—')}</div><strong>${escapeHtml(s.productName)}</strong><span>${escapeHtml(p.title||state.config.lotName||'Jury')}${copies>1?` · copie ${c}/${copies}`:''}</span>`;
      grid.appendChild(d)
    }
  })
}
function switchPrepTab(tab){
  document.querySelectorAll('.prep-tab').forEach(b=>b.classList.toggle('active',b.dataset.prepTab===tab));
  $('#prepAdminSheet').classList.toggle('active',tab==='admin');
  $('#prepTestersSheet').classList.toggle('active',tab==='testers');
  $('#prepLabelsSheet').classList.toggle('active',tab==='labels')
}
function printPrep(kind){
  prepPrintMode=kind;
  document.body.classList.remove('print-prep-admin','print-prep-testers','print-prep-labels');
  document.body.classList.add(`print-prep-${kind}`);
  setTimeout(()=>window.print(),80)
}
window.addEventListener('afterprint',()=>{
  if(prepPrintMode){
    document.body.classList.remove('print-prep-admin','print-prep-testers','print-prep-labels');
    prepPrintMode=''
  }
});
function backFromPrep(){
  if(prepReturnView==='juryView')renderJuryView();
  else if(prepReturnView==='homeView')renderHome();
  else renderLaunchView()
}
$('#launchPrepBtn').onclick=()=>renderPrepView('launchView');
$('#juryPrepBtn').onclick=()=>renderPrepView('juryView');
$('#prepBackBtn').onclick=backFromPrep;
$('#prepPrintAdminBtn').onclick=()=>printPrep('admin');
$('#prepPrintTestersBtn').onclick=()=>printPrep('testers');
$('#prepPrintLabelsBtn').onclick=()=>printPrep('labels');
$('#prepLabelCopies').onchange=renderPrepLabels;
document.querySelectorAll('.prep-tab').forEach(b=>b.onclick=()=>switchPrepTab(b.dataset.prepTab));
