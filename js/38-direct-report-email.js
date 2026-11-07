/* Resolve a verified account token explicitly for SMTP calls.
 * Retry only a rejected authentication, never a network/SMTP failure.
 * The same requestId/body is retained; success still requires the server receipt. */
async function invokeReportMailV591(client,data){
  const reconnect='Votre connexion a expiré. Enregistrez votre jury, puis reconnectez-vous dans « Mon compte » avant de réessayer.';
  const connectionError=e=>Number(e?.status)===429?
    'La connexion est momentanément limitée. Attendez une minute avant de réessayer.':reconnect;
  let renewed=false;
  async function refresh(){
    if(renewed)throw Error(reconnect);
    renewed=true;
    const r=await client.auth.refreshSession();
    if(r.error||!r.data?.session?.access_token)throw Error(connectionError(r.error));
    return r.data.session;
  }
  let auth=await client.auth.getSession();
  if(auth.error)throw Error(connectionError(auth.error));
  let session=auth.data?.session;
  if(!session?.access_token)throw Error(reconnect);
  const expectedUser=session.user?.id;
  if(session.expires_at&&session.expires_at*1000<=Date.now()+60000)session=await refresh();
  async function verifiedToken(){
    let r=await client.auth.getUser(session.access_token);
    if(r.error&&Number(r.error.status)===401&&!renewed){
      session=await refresh();
      r=await client.auth.getUser(session.access_token);
    }
    if(r.error)throw Error(connectionError(r.error));
    const user=r.data?.user;
    if(!user?.id||user.is_anonymous||!user.email_confirmed_at||
      (expectedUser&&user.id!==expectedUser))throw Error(reconnect);
    return session.access_token;
  }
  let token=await verifiedToken();
  let result=await client.functions.invoke('send-jury-report',{body:data,headers:{Authorization:'Bearer '+token}});
  if(Number(result.error?.context?.status)===401){
    session=await refresh();
    token=await verifiedToken();
    result=await client.functions.invoke('send-jury-report',{body:data,headers:{Authorization:'Bearer '+token}});
  }
  if(Number(result.error?.context?.status)===401)throw Error(reconnect);
  return result;
}

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
  modal.innerHTML='<form><h2>Envoyer le rapport final</h2><p role="status" aria-live="polite" style="position:sticky;top:0;z-index:2;background:#edf5f8;border-radius:10px;padding:12px;color:#173f5c;font-weight:700">Création du PDF…</p><label>Destinataire<input name="recipient" type="email" required autocomplete="email" style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px"></label><label>Objet<input name="subject" required maxlength="200" style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px"></label><label>Message<textarea name="message" required maxlength="10000" rows="5" style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px"></textarea></label><button type="button" data-mail-send class="btn btn-primary" disabled>Envoyer le rapport</button> <button type="button" data-mail-close class="btn btn-secondary">Fermer</button></form>';
  document.body.appendChild(modal);modal.showModal();
  const form=modal.querySelector('form'), status=modal.querySelector('[role=status]'), send=form.querySelector('[data-mail-send]'), close=form.querySelector('[data-mail-close]');
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
      const result=await invokeReportMailV591(client,data);
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
  // School frames intentionally block native form submissions; use the authenticated JS action.
  send.onclick=form.onsubmit;
}

emailCurrentReport=openDirectFinalReportV415;
window.emailCurrentReport=openDirectFinalReportV415;

/* Article labels use the same authenticated mail service, without final-report lifecycle changes. */
async function openDirectArticleNumbersV573(){
  if(window.__JURY_DEMO_ACTIVE&&!window.__JURY_DEMO_BOOT?.integrated)return alert('L’envoi réel est disponible dans l’espace établissement connecté.');
  if(state.config?._archive?.finalLocked)return alert('Ce jury est archivé et verrouillé.');
  if(!draftConfig)return alert('Ouvrez d’abord la préparation du jury.');
  if(document.getElementById('directArticleNumbersV573'))return;
  const jury=state, selection=draftConfig, lot=selection.lotName||'Jury Marchés';
  const modal=document.createElement('dialog');
  modal.id='directArticleNumbersV573';
  modal.style.cssText='border:0;border-radius:18px;padding:24px;width:calc(100% - 32px);max-width:540px;max-height:calc(100dvh - 24px);overflow:auto;box-sizing:border-box';
  modal.innerHTML='<form><h2>Envoyer les numéros des articles</h2><p role="status" aria-live="polite" style="position:sticky;top:0;z-index:2;background:#edf5f8;border-radius:10px;padding:12px;color:#173f5c;font-weight:700">Création du PDF…</p><label>Destinataire<input name="recipient" type="email" required autocomplete="email" style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px"></label><label>Objet<input name="subject" required maxlength="200" style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px"></label><label>Message<textarea name="message" required maxlength="10000" rows="5" style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px"></textarea></label><button type="button" data-mail-send class="btn btn-primary" disabled>Envoyer le PDF</button> <button type="button" data-mail-close class="btn btn-secondary">Fermer</button></form>';
  document.body.appendChild(modal);modal.showModal();
  const form=modal.querySelector('form'), status=modal.querySelector('[role=status]'), send=form.querySelector('[data-mail-send]'), close=form.querySelector('[data-mail-close]');
  let busy=false;
  close.onclick=()=>{if(!busy)modal.remove()};
  modal.addEventListener('cancel',e=>{if(busy)e.preventDefault();else modal.remove()});
  form.elements.subject.value='Numéros des articles — '+lot;
  form.elements.message.value='Bonjour,\n\nVeuillez trouver en pièce jointe les numéros des articles à imprimer pour le jury « '+lot+' ».\n\nCordialement';
  let pdf,preparedSignature;
  try{
    pdf=await buildArticleNumbersPdf();
    preparedSignature=JSON.stringify(selection);
    if(!pdf.blob?.size||pdf.blob.size>5000000)throw Error('Le PDF doit faire moins de 5 Mo.');
    status.textContent=pdf.filename+' · '+(pdf.blob.size/1000000).toFixed(2)+' Mo · pièce jointe automatique';
    send.disabled=false;
  }catch(e){status.textContent='Préparation impossible : '+e.message;return;}
  const requestId=crypto.randomUUID();
  form.onsubmit=async e=>{
    e.preventDefault();if(busy||!form.reportValidity())return;
    if(state!==jury||draftConfig!==selection||JSON.stringify(selection)!==preparedSignature){status.textContent='Le jury a changé. Fermez puis rouvrez cette fenêtre.';return;}
    busy=true;send.disabled=true;close.disabled=true;status.textContent='Envoi en cours…';
    try{
      const client=window.JuryAccountV385?.client;
      if(!client)throw Error('Connectez-vous à votre compte pour envoyer le PDF.');
      const data=new FormData();data.append('recipient',form.elements.recipient.value.trim());data.append('subject',form.elements.subject.value.trim());data.append('message',form.elements.message.value);data.append('requestId',requestId);if(window.__JURY_DEMO_BOOT?.integrated)data.append('school',window.__JURY_DEMO_BOOT.school);data.append('report',pdf.blob,pdf.filename);
      const result=await invokeReportMailV591(client,data);
      if(result.error||!result.data?.id){
        let message=result.data?.error||'Envoi non confirmé. Réessayez après actualisation.';
        try{const detail=await result.error?.context?.json();if(detail?.error)message=detail.error;}catch(_){}
        throw Error(message);
      }
      busy=false;
      modal.close();modal.remove();
      const returnButton=document.getElementById('configEmailArticlesBtn');
      if(returnButton){
        returnButton.scrollIntoView({block:'center',behavior:'smooth'});
        returnButton.focus({preventScroll:true});
      }
      if(typeof toast==='function')toast('PDF des numéros d’articles envoyé ✓');

    }catch(error){status.textContent='Envoi impossible : '+error.message;status.scrollIntoView({block:'nearest'});busy=false;send.disabled=false;close.disabled=false;}
  };
  // School frames intentionally block native form submissions; use the authenticated JS action.
  send.onclick=form.onsubmit;
}

emailArticleNumbersPdf=openDirectArticleNumbersV573;
window.emailArticleNumbersPdf=openDirectArticleNumbersV573;
if(document.getElementById('configEmailArticlesBtn'))document.getElementById('configEmailArticlesBtn').onclick=openDirectArticleNumbersV573;
