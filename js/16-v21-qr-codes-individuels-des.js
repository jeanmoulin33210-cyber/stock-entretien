/* --- V21 : QR codes individuels des testeurs --- */
let qrReturnView='cloudView';
function qrTesterCount(){return Number(state?.config?.testerCount||0)}
function qrCanRender(){
  return !!(cloudCfg?.sessionId&&cloudCfg?.url&&cloudCfg?.key&&cloudRole==='admin')
}
function renderQrCodes(returnView='cloudView'){
  qrReturnView=returnView||'cloudView';
  showView('qrView');
  $('#headerTitle').textContent='QR codes des testeurs';
  $('#headerSub').textContent=state.config?.lotName||'Jury Marchés';
  const backBtn=$('#qrBackBtn');
  if(backBtn)backBtn.textContent=
    qrReturnView==='juryView'?'← Retour au jury':
    qrReturnView==='configView'?'← Retour à la création':
    qrReturnView==='launchView'?'← Retour au lancement':
    '← Retour au partage';
  const parts=typeof lotDisplayParts==='function'?lotDisplayParts():{title:state.config?.lotName||'Jury',subtitle:state.config?.subtitle||''};
  $('#qrJuryTitle').textContent=parts.title||state.config?.lotName||'Jury';
  $('#qrJuryDetail').textContent=`${qrTesterCount()} accès individuel${qrTesterCount()>1?'s':''} sécurisé${qrTesterCount()>1?'s':''}`;
  $('#qrPrintTitle').textContent=`Accès testeurs — ${parts.title||state.config?.lotName||'Jury'}`;
  $('#qrPrintSubtitle').textContent=parts.subtitle?`${parts.subtitle} · Scannez uniquement votre carte.`:'Scannez uniquement la carte correspondant à votre numéro de testeur.';
  const grid=$('#qrGrid');grid.innerHTML='';
  if(!qrCanRender()){
    grid.innerHTML='<div class="panel qr-empty" style="grid-column:1/-1">Connectez d’abord la session partagée sécurisée depuis « Partage téléphones ».</div>';
    $('#qrPrintBtn').disabled=true;return
  }
  if(typeof ensureTesterCodes==='function')ensureTesterCodes();
  $('#qrPrintBtn').disabled=false;
  for(let i=1;i<=qrTesterCount();i++){
    const name=state.testers?.[i]?.name||state.config?.testerNames?.[i-1]||`Testeur ${i}`;
    const link=shareUrl(i);
    const card=document.createElement('article');card.className='panel qr-card';card.dataset.qrCard=String(i);
    const codeId=`qr-code-${i}`;
    card.innerHTML=`<div class="qr-print-person">Testeur ${i}</div><div class="qr-left"><div class="qr-code" id="${codeId}"></div><button class="btn btn-secondary btn-small qr-pdf-btn" data-qr-pdf="${i}">PDF</button></div><div><div class="eyebrow">Accès individuel · Testeur ${i}</div><h3>${escapeHtml(name)}</h3><p>Scannez ce QR code avec l’appareil photo du téléphone. Vous arriverez directement sur votre fiche de dégustation.</p><div class="qr-meta"><span>Testeur ${i}</span><span>Accès sécurisé</span><span>Fournisseurs masqués</span></div><div class="qr-actions"><button class="btn btn-primary" data-qr-copy="${i}">Copier le lien</button></div></div>`;
    grid.appendChild(card);
    const target=document.getElementById(codeId);
    if(window.QRCode){
      try{
        new QRCode(target,{text:link,width:240,height:240,correctLevel:QRCode.CorrectLevel.M});
      }catch(e){target.innerHTML='<span style="font-size:9px;color:#b3261e;text-align:center">QR indisponible</span>'}
    }else{
      target.innerHTML='<span style="font-size:9px;color:#8b5b00;text-align:center;padding:8px">Bibliothèque QR non chargée.<br>Le lien reste copiable.</span>'
    }
  }
  grid.querySelectorAll('[data-qr-copy]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.qrCopy);copyText(shareUrl(i),`Lien Testeur ${i} copié`)});
  grid.querySelectorAll('[data-qr-pdf]').forEach(b=>b.onclick=()=>printSingleQrCard(Number(b.dataset.qrPdf)))
}

function qrImageDataForTester(i){
  const box=document.getElementById(`qr-code-${i}`);
  if(!box)return '';
  const img=box.querySelector('img');
  if(img&&img.src)return img.src;
  const canvas=box.querySelector('canvas');
  if(canvas){
    try{return canvas.toDataURL('image/png')}catch(e){return ''}
  }
  return ''
}
function printSingleQrCard(i){
  if(!qrCanRender()){
    alert('Préparez d’abord les accès des testeurs.');
    return
  }
  const card=document.querySelector(`[data-qr-card="${i}"]`);
  if(!card){
    alert('La carte QR du testeur est introuvable.');
    return
  }

  document.body.classList.remove('print-qr-all');
  document.body.classList.add('print-single-qr');
  document.querySelectorAll('#qrGrid .qr-card').forEach(c=>c.classList.remove('print-target'));
  card.classList.add('print-target');

  setTimeout(()=>{
    try{window.print()}
    catch(e){
      alert('Impossible d’ouvrir l’impression sur cet appareil.')
    }
  },150);
}

async function copyAllQrLinks(){
  if(!qrCanRender()){alert('Connectez d’abord la session partagée sécurisée.');return}
  const lines=[];
  for(let i=1;i<=qrTesterCount();i++)lines.push(`${state.testers?.[i]?.name||`Testeur ${i}`} : ${shareUrl(i)}`);
  await copyText(lines.join('\n'),'Tous les liens testeurs ont été copiés')
}
function printQrCards(){
  if(!qrCanRender()){alert('Préparez d’abord les accès des testeurs.');return}

  document.body.classList.remove('print-single-qr');
  document.body.classList.add('print-qr-all');
  document.querySelectorAll('#qrGrid .qr-card').forEach(c=>c.classList.remove('print-target'));

  setTimeout(()=>{
    try{window.print()}
    catch(e){
      alert('Impossible d’ouvrir l’impression sur cet appareil.')
    }
  },150);
}
$('#showQrCodesBtn').onclick=()=>renderQrCodes('cloudView');
$('#qrBackBtn').onclick=()=>{
  if(qrReturnView==='juryView')renderJuryView();
  else if(qrReturnView==='configView')openConfig();
  else if(qrReturnView==='launchView')renderLaunchView();
  else renderCloudPage();
};
$('#qrPrintBtn').onclick=printQrCards;
