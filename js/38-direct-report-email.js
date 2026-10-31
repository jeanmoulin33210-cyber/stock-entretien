/* Direct report email through authenticated server-side Gmail SMTP. */
async function openDirectFinalReportV415(){
  if(window.__JURY_DEMO_ACTIVE&&!window.__JURY_DEMO_BOOT?.integrated)return alert('L’envoi réel est disponible dans l’espace établissement connecté.');
  if(state.config?._archive?.finalLocked)return alert('Ce jury est archivé et verrouillé.');
  if(!ensureProductSheetsComplete('envoyer le rapport final'))return;
  if(document.getElementById('directFinalReportV415'))return;
  const jury=state, lot=jury.config?.lotName||'Jury Marchés';
  const modal=document.createElement('dialog');
  modal.id='directFinalReportV415';
  modal.style.cssText='border:0;border-radius:18px;padding:24px;width:calc(100% - 32px);max-width:540px;max-height:calc(100dvh - 24px);overflow:auto;box-sizing:border-box';
  modal.innerHTML='<form><h2>Envoyer le rapport final</h2><p role="status" aria-live="polite" style="position:sticky;top:0;z-index:2;background:#edf5f8;border-radius:10px;padding:12px;color:#173f5c;font-weight:700">Création du PDF…</p><label>Destinataire<input name="recipient" type="email" required autocomplete="email" style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px"></label><label>Objet<input name="subject" required maxlength="200" style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px"></label><label>Message<textarea name="message" required maxlength="10000" rows="5" style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px"></textarea></label><button type="submit" class="btn btn-primary" disabled>Envoyer le rapport</button> <button type="button" class="btn btn-secondary">Fermer</button></form>';
  document.body.appendChild(modal);modal.showModal();
  const form=modal.querySelector('form'), status=modal.querySelector('[role=status]'), send=form.querySelector('[type=submit]'), close=form.querySelector('[type=button]');
  let busy=false;
  close.onclick=()=>{if(!busy)modal.remove()};
  modal.addEventListener('cancel',e=>{if(busy)e.preventDefault();else modal.remove()});
  form.elements.subject.value='Rapport final — '+lot;
  form.elements.message.value='Bonjour,\n\nVeuillez trouver en pièce jointe le rapport final du jury « '+lot+' ».\n\nCordialement';
  let pdf;
  try{
    pdf=await buildReportPdfBlob(jury);
    if(!pdf.blob?.size||pdf.blob.size>5000000)throw Error('Le PDF doit faire moins de 5 Mo.');
    status.textContent=pdf.filename+' · '+(pdf.blob.size/1000000).toFixed(2)+' Mo · pièce jointe automatique';
    send.disabled=false;
  }catch(e){status.textContent='Préparation impossible : '+e.message;return;}
  const requestId=crypto.randomUUID();
  form.onsubmit=async e=>{
    e.preventDefault();if(busy||!form.reportValidity())return;
    if(state!==jury){status.textContent='Le jury a changé. Fermez puis rouvrez cette fenêtre.';return;}
    busy=true;send.disabled=true;close.disabled=true;status.textContent='Envoi en cours…';
    try{
      const client=window.JuryAccountV385?.client;
      if(!client)throw Error('Connectez-vous à votre compte pour envoyer le rapport.');
      const data=new FormData();data.append('recipient',form.elements.recipient.value.trim());data.append('subject',form.elements.subject.value.trim());data.append('message',form.elements.message.value);data.append('requestId',requestId);if(window.__JURY_DEMO_BOOT?.integrated)data.append('school',window.__JURY_DEMO_BOOT.school);data.append('report',pdf.blob,pdf.filename);
      const result=await client.functions.invoke('send-jury-report',{body:data});
      if(result.error||!result.data?.id){
        let message=result.data?.error||'Envoi non confirmé. Réessayez après actualisation.';
        try{const detail=await result.error?.context?.json();if(detail?.error)message=detail.error;}catch(_){}
        throw Error(message);
      }
      jury.config._finalReportPreparedAt=new Date().toISOString();
      jury.config._finalReportSentAt=jury.config._finalReportPreparedAt;
      jury.config._finalReportEmailId=result.data.id;saveState();
      if(typeof syncSimpleResultsActions==='function')syncSimpleResultsActions();
      status.textContent='Envoi pris en charge ✓';send.disabled=true;send.textContent='Envoi pris en charge ✓';send.style.background='#23764e';
      form.querySelectorAll('input,textarea').forEach(el=>el.disabled=true);
      busy=false;close.disabled=false;
      modal.close();modal.remove();
      if(typeof openSimplifiedResults==='function')openSimplifiedResults();
      const archive=document.getElementById('confirmReportSentArchiveBtn');
      if(archive){
        archive.hidden=false;archive.disabled=false;
        archive.scrollIntoView({block:'center',behavior:'smooth'});
        archive.focus({preventScroll:true});
      }
      if(typeof toast==='function')toast('Rapport envoyé ✓ Vous pouvez maintenant archiver et verrouiller le jury.');
    }catch(error){status.textContent='Envoi impossible : '+error.message;status.scrollIntoView({block:'nearest'});busy=false;send.disabled=false;close.disabled=false;}
  };
}

emailCurrentReport=openDirectFinalReportV415;
window.emailCurrentReport=openDirectFinalReportV415;
