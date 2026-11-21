/* Signature carried by the tester's protected answer rows, never public configuration. */
(function(){
  'use strict';
  const PREFIX='__TC_SIGNATURE_V393__:';
  function identity(st){return String(st.config?._juryInstanceId||st.config?.juryInstanceId||st.config?._preparedId||st.config?._shareSessionId||st.config?.juryLaunch?.sessionId||'');}
  function read(st,no){
    const tester=st.testers?.[no];if(!tester?.validatedAt)return null;
    for(const a of Object.values(tester.answers||{}))for(const value of a.remarks||[]){
      if(typeof value!=='string'||!value.startsWith(PREFIX))continue;
      try{const s=JSON.parse(value.slice(PREFIX.length));if(s.testerNo===Number(no)&&s.jury===identity(st)&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s.image)&&s.image.length<=160000&&Number.isFinite(Date.parse(s.signedAt)))return s;}catch(_){}
    }return null;
  }
  function clear(st,no){for(const a of Object.values(st.testers?.[no]?.answers||{}))a.remarks=(a.remarks||[]).map(v=>typeof v==='string'&&v.startsWith(PREFIX)?'':v);}
  function attach(st,no,s,slot){const answers=Object.values(st.testers?.[no]?.answers||{});if(!answers.length)throw Error('Aucune réponse à signer.');clear(st,no);const a=answers[answers.length-1];a.remarks=a.remarks||[];a.remarks[slot]=PREFIX+JSON.stringify({...s,testerNo:Number(no),jury:identity(st)});}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const signedClosureReceiptsV648=new Map();
  const signedClosureKeyV648=(st,no)=>identity(st)+'|'+Number(no);
  function list(st){
    const members=st.config?.closure?.members||[],numbers=new Set([...Object.keys(st.testers||{}),...members.map(m=>String(m.testerNo))]);
    return [...numbers].map(no=>{
      const member=members.find(m=>Number(m.testerNo)===Number(no))||{},
        signed=read(st,no)||signedClosureReceiptsV648.get(signedClosureKeyV648(st,no))||null;
      // Preserve historical attendance signatures; a phone signature takes precedence.
      const legacy=!signed&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(member.signature||'')&&member.signature.length<=160000?{testerNo:Number(no),name:member.name,image:member.signature,signedAt:member.signedAt||'',legacy:true}:null;
      const s=signed||legacy;return s?{...s,name:s.name||st.testers?.[no]?.name||member.name||'Testeur '+no,function:s.function||member.role||'',establishment:s.establishment||member.establishment||''}:null;
    }).filter(Boolean);
  }
  function html(st){const cards=list(st).map(s=>`<div style="break-inside:avoid;border:1px solid #ccd9df;border-radius:12px;padding:12px;margin:8px 0"><strong>${esc(s.name)}</strong>${s.function?`<div>Fonction : ${esc(s.function)}</div>`:''}${s.establishment?`<div>Établissement : ${esc(s.establishment)}</div>`:''}${s.signedAt?`<div>Signé le ${esc(new Date(s.signedAt).toLocaleString('fr-FR'))}</div>`:'<div>Signature déjà enregistrée dans la clôture</div>'}<img src="${s.image}" alt="Signature du testeur ${esc(s.testerNo)}" style="display:block;max-width:100%;width:300px;height:110px;object-fit:contain"></div>`).join('');return cards?'<section><h3>Signatures des testeurs</h3>'+cards+'</section>':'';}
  /* V646 — The phone must receive a server receipt before it may say "Merci".
     Signed, incomplete uploads are saved to a per-jury IndexedDB outbox. This
     does not read or change the administrator's (isolated) browser storage. */
  const OUTBOX='jm-tc-tester-outbox-v646';
  let pendingReceipt=null;
  const nap=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function receiptVerified(rows,receipt){
    if(!Array.isArray(rows)||!receipt?.stamp||!receipt?.signature||
       !Array.isArray(receipt.answers)||!receipt.answers.length)return false;
    const official=rows.find(row=>row.product_id==='__meta__'&&row.sample_id==='__validation__');
    if(!Array.isArray(official?.remarks)||official.remarks[0]!==receipt.stamp)return false;
    let signatureFound=false;
    for(const expected of receipt.answers){
      const row=rows.find(r=>r.product_id===expected.product_id&&r.sample_id===expected.sample_id);
      if(!row||
         JSON.stringify(row.choices||[])!==JSON.stringify(expected.choices||[])||
         JSON.stringify(row.remarks||[])!==JSON.stringify(expected.remarks||[]))return false;
      if(row.remarks.includes(receipt.signature))signatureFound=true;
    }
    return signatureFound;
  }
  function receiptKey(sid,jury,no){return String(sid)+'|'+String(jury)+'|'+Number(no);}
  function buildReceipt(no){
    const tester=state.testers?.[no],jury=identity(state);
    if(!tester?.validatedAt||!read(state,no))throw Error('Signature locale introuvable : conservez cette page ouverte.');
    const sid=String((typeof cloudCfg!=='undefined'&&cloudCfg?.sessionId)||
      (typeof location!=='undefined'&&new URLSearchParams(location.search).get('session'))||'');
    if(!jury)throw Error('Identité du jury introuvable : conservez cette page ouverte.');
    const answers=[];
    for(const product of state.config.products||[])for(const sample of product.samples||[]){
      const answer=tester.answers?.[sampleKey(product.id,sample.id)];
      if(!answer)throw Error('Une fiche locale manque : conservez cette page ouverte.');
      answers.push({
        product_id:String(product.id),sample_id:String(sample.id),
        choices:JSON.parse(JSON.stringify(answer.choices||[])),
        remarks:JSON.parse(JSON.stringify(answer.remarks||[]))
      });
    }
    const signature=answers.flatMap(a=>a.remarks).find(v=>typeof v==='string'&&v.startsWith(PREFIX));
    if(!signature)throw Error('Signature locale introuvable : conservez cette page ouverte.');
    return {key:receiptKey(sid,jury,no),sid,jury,no:Number(no),
      stamp:String(tester.validatedAt),signature,answers};
  }
  function outbox(action,receipt){
    return new Promise((resolve,reject)=>{
      if(typeof indexedDB==='undefined'){resolve(null);return;}
      let db;
      const opened=indexedDB.open(OUTBOX,1);
      opened.onupgradeneeded=()=>{if(!opened.result.objectStoreNames.contains('pending'))opened.result.createObjectStore('pending',{keyPath:'key'});};
      opened.onerror=()=>reject(opened.error||Error('Stockage local indisponible'));
      opened.onsuccess=()=>{
        db=opened.result;
        let result=null,tx;
        try{
          tx=db.transaction('pending',action==='get'?'readonly':'readwrite');
          const store=tx.objectStore('pending');
          const req=action==='get'?store.get(receipt.key):
                    action==='put'?store.put({...receipt,inProgress:false,failure:''}):store.delete(receipt.key);
          req.onsuccess=()=>{result=req.result??null;};
          tx.oncomplete=()=>{db.close();resolve(result);};
          tx.onerror=()=>{db.close();reject(tx.error||Error('Sauvegarde locale impossible'));};
          tx.onabort=()=>{db.close();reject(tx.error||Error('Sauvegarde locale interrompue'));};
        }catch(e){db?.close();reject(e);}
      };
    });
  }
  function receiptStillCurrent(receipt){
    return identity(state)===receipt.jury &&
      Number(currentTester)===receipt.no &&
      String(state.testers?.[receipt.no]?.validatedAt||'')===receipt.stamp;
  }
  async function sendReceipt(receipt){
    if(!receiptStillCurrent(receipt))throw Error('Le jury ou le testeur a changé. Les données locales ont été conservées.');
    if(typeof navigator!=='undefined'&&navigator.onLine===false)
      throw Error('Le téléphone est hors connexion.');
    if(typeof cloudReady==='undefined'||!cloudReady||
       typeof cloudRole==='undefined'||cloudRole!=='tester'||
       Number(cloudTesterNo)!==receipt.no||
       String(cloudCfg?.sessionId||'')!==receipt.sid||
       !cloudClient)throw Error('Le partage sécurisé avec le jury n’est pas connecté.');
    /* Wait for an ordinary answer upload that might have begun just before signing.
       Never send an older snapshot over the final signature. */
    for(let i=0;i<24&&cloudBusy;i++)await nap(250);
    if(cloudBusy)throw Error('Synchronisation précédente toujours en cours.');
    if(!receiptStillCurrent(receipt))throw Error('Le jury a changé pendant l’enregistrement.');
    const now=new Date().toISOString();
    const rows=receipt.answers.map(a=>({
      session_id:receipt.sid,tester_no:receipt.no,
      product_id:a.product_id,sample_id:a.sample_id,
      choices:a.choices,remarks:a.remarks,updated_at:now
    }));
    const sent=await cloudClient.from('test_culinaire_reponses')
      .upsert(rows,{onConflict:'session_id,tester_no,product_id,sample_id'});
    if(sent.error)throw sent.error;
    const validated=await cloudClient.from('test_culinaire_reponses')
      .upsert([{session_id:receipt.sid,tester_no:receipt.no,
        product_id:'__meta__',sample_id:'__validation__',choices:[],
        remarks:[receipt.stamp],updated_at:new Date().toISOString()}],
        {onConflict:'session_id,tester_no,product_id,sample_id'});
    if(validated.error)throw validated.error;
    const checked=await cloudClient.from('test_culinaire_reponses')
      .select('product_id,sample_id,choices,remarks')
      .eq('session_id',receipt.sid).eq('tester_no',receipt.no);
    if(checked.error)throw checked.error;
    if(!receiptVerified(checked.data,receipt))
      throw Error('Le serveur n’a pas encore confirmé toutes les notes, la signature et la validation.');
    return true;
  }
  function showPendingReceipt(panel,receipt){
    const failed=!!receipt.failure;
    panel.className='panel tester-thank-you';
    panel.innerHTML='<div role="status" aria-live="polite" style="text-align:center;padding:30px 16px;line-height:1.65">'+
      '<div aria-hidden="true" style="font-size:48px">'+(failed?'⚠️':'⏳')+'</div>'+
      '<h2 style="font-size:25px;color:#176b48">'+
        (failed?'Enregistrement à confirmer':'Enregistrement en cours…')+'</h2>'+
      '<p>'+(failed?
        'Le serveur n’a pas confirmé la réception complète. Vos réponses et votre signature restent sur ce téléphone.':
        'Transmission et vérification des notes, de votre signature et de la validation sur le serveur…')+'</p>'+
      (failed?'<p style="color:#9b3833">'+esc(receipt.failure)+'</p>':'')+
      '<p><strong>Ne fermez pas cette page avant le message de confirmation.</strong></p>'+
      (failed?'<button type="button" class="btn btn-primary" id="retryTesterDeliveryV646" style="min-height:50px">Réessayer l’enregistrement</button>':'')+
      '</div>';
    const retry=panel.querySelector('#retryTesterDeliveryV646');
    if(retry)retry.onclick=()=>startReceiptDelivery(receipt);
  }
  async function startReceiptDelivery(receipt){
    if(receipt.inProgress)return;
    receipt.inProgress=true;receipt.failure='';
    if(pendingReceipt===receipt)renderSample();
    try{
      /* An interrupted connection can never expose "Merci" until the server
         has been queried and all fields compared. */
      await outbox('put',receipt);
      await Promise.race([
        sendReceipt(receipt),
        new Promise((_,reject)=>setTimeout(()=>reject(Error('La confirmation du serveur prend trop de temps.')),15000))
      ]);
      if(!receiptStillCurrent(receipt))throw Error('Le jury a changé avant la confirmation.');
      try{await outbox('delete',receipt);}catch(e){console.warn('Copie de secours locale conservée',e);}
      if(pendingReceipt===receipt){pendingReceipt=null;renderSample();}
    }catch(e){
      receipt.failure=String(e?.message||e||'Connexion interrompue. Réessayez.');
      if(pendingReceipt===receipt)renderSample();
    }finally{receipt.inProgress=false;}
  }
  async function recoverPendingReceipt(){
    if(typeof URLSearchParams==='undefined'||typeof location==='undefined'||
       !/^[1-9][0-9]*$/.test(new URLSearchParams(location.search).get('tester')||''))return;
    for(let i=0;i<40;i++){
      if(typeof cloudReady!=='undefined'&&cloudReady&&
         typeof cloudRole!=='undefined'&&cloudRole==='tester'&&
         state?.config?.products?.length)break;
      await nap(400);
    }
    if(typeof cloudReady==='undefined'||!cloudReady||cloudRole!=='tester')return;
    const no=Number(cloudTesterNo),sid=String(cloudCfg?.sessionId||'');
    const old=await outbox('get',{key:receiptKey(sid,identity(state),no)});
    if(!old||old.no!==no||old.sid!==sid||old.jury!==identity(state)||
       !Array.isArray(old.answers)||!old.answers.length||pendingReceipt)return;
    const expected=(state.config.products||[]).flatMap(p=>(p.samples||[]).map(sm=>String(p.id)+'|'+String(sm.id)));
    if(expected.length!==old.answers.length||
       old.answers.some(a=>!expected.includes(a.product_id+'|'+a.sample_id))||
       !state.testers?.[no])return;
    for(const a of old.answers){
      state.testers[no].answers[sampleKey(a.product_id,a.sample_id)]=
        {choices:a.choices,remarks:a.remarks};
    }
    state.testers[no].validatedAt=old.stamp;
    pendingReceipt={...old,inProgress:false,failure:''};
    saveState();renderSample();startReceiptDelivery(pendingReceipt);
  }
  /* V648 — Loading a prepared lot from the authenticated owner's catalogue
     does not include its protected tester answer rows. Restore only verified
     signed profiles from the matching secure jury session, without overwriting
     a single editable closure field or publishing signatures in public_config. */
  const pendingClosureRecoveryV648=new Map();
  function closureSignatureRowV648(rows,st,no){
    if(!Array.isArray(rows)||!st?.config||!Number.isInteger(Number(no)))return null;
    const n=Number(no);
    const official=rows.find(row=>Number(row.tester_no)===n&&
      row.product_id==='__meta__'&&row.sample_id==='__validation__');
    const validated=String(official?.remarks?.[0]||'');
    if(!validated||!Number.isFinite(Date.parse(validated)))return null;
    const expectedSamples=new Set((st.config.products||[]).flatMap(p=>
      (p.samples||[]).map(sample=>String(p.id)+'|'+String(sample.id))));
    const jury=identity(st);
    if(!jury||!expectedSamples.size)return null;
    for(const row of rows){
      if(Number(row.tester_no)!==n||
         !expectedSamples.has(String(row.product_id)+'|'+String(row.sample_id)))continue;
      for(const remark of row.remarks||[]){
        if(typeof remark!=='string'||!remark.startsWith(PREFIX))continue;
        try{
          const signed=JSON.parse(remark.slice(PREFIX.length));
          if(Number(signed.testerNo)!==n||signed.jury!==jury||
             !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signed.image||'')||
             signed.image.length>160000||
             !Number.isFinite(Date.parse(signed.signedAt||'')))continue;
          return signed;
        }catch(_){}
      }
    }
    return null;
  }
  function sameClosureJuryV648(local,remote,sid){
    if(!local||!remote)return false;
    const id=cfg=>String(cfg._juryInstanceId||cfg.juryInstanceId||'');
    const localId=id(local),remoteId=id(remote);
    if(!localId||localId!==remoteId)return false;
    if(String(local._preparedId||'')!==String(remote._preparedId||''))return false;
    if(String(local.lotNumber||'')!==String(remote.lotNumber||''))return false;
    if(String(local.lotName||'')!==String(remote.lotName||''))return false;
    const remoteSid=String(remote._shareSessionId||remote.juryLaunch?.sessionId||'');
    return remoteSid===String(sid);
  }
  function paintClosureSignaturesV648(st){
    if(typeof document==='undefined'||state!==st)return;
    const view=document.getElementById('closureView');
    const host=document.getElementById('closureTesterSignaturesV393');
    if(!host||view?.classList.contains('active')===false)return;
    host.innerHTML=html(st);
    for(const signed of list(st)){
      const i=Number(signed.testerNo)-1;
      if(!Number.isInteger(i)||i<0||i>=Number(st.config.testerCount||0))continue;
      const field=document.querySelector('[data-cl-role="'+i+'"]');
      if(!field||field===document.activeElement||String(field.value||'').trim())continue;
      const parts=[signed.function,signed.establishment].filter(Boolean);
      if(parts.length){
        field.value=parts.join(' — ');
        /* This visible suggestion is not silently recorded in the closure.
           The administrator's normal Save action records it. */
        if(typeof scheduleClosureAutosave==='function')scheduleClosureAutosave();
      }
    }
  }
  async function recoverClosureSignaturesV648(){
    if(typeof cloudClient==='undefined'||!cloudClient||
       typeof cloudRole==='undefined'||cloudRole!=='admin')return false;
    const st=state,cfg=st?.config;
    if(!cfg||!Number(cfg.testerCount))return false;
    const sid=String(cfg._shareSessionId||cfg.juryLaunch?.sessionId||'');
    const jury=identity(st),key=sid+'|'+jury;
    if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(sid)||!jury)return false;
    if(Array.from({length:cfg.testerCount},(_,i)=>i+1).every(
      no=>!!read(st,no)||signedClosureReceiptsV648.has(signedClosureKeyV648(st,no)))){
      paintClosureSignaturesV648(st);return true;
    }
    if(pendingClosureRecoveryV648.has(key))return pendingClosureRecoveryV648.get(key);
    const job=(async()=>{
      const querySession=()=>cloudClient.from('test_culinaire_sessions')
        .select('config').eq('session_id',sid).maybeSingle();
      let {data:session,error:sessionError}=await querySession();
      if(sessionError||!session?.config){
        /* Only the real jury administrator, proving the original admin code,
           may attach this account to its protected results. Never rotate
           the connected account's authentication identity. */
        const adminCode=typeof getRawAdminTokenV20==='function'?getRawAdminTokenV20():'';
        if(!adminCode)return false;
        const joined=await cloudClient.rpc('test_culinaire_join_session',
          {p_session_id:sid,p_code:adminCode,p_tester_no:null});
        if(joined.error)return false;
        const membership=Array.isArray(joined.data)?joined.data[0]:joined.data;
        if(membership?.role!=='admin')return false;
        const retry=await querySession();session=retry.data;sessionError=retry.error;
      }
      if(sessionError||!session?.config||!sameClosureJuryV648(cfg,session.config,sid))return false;
      const fetched=await cloudClient.from('test_culinaire_reponses')
        .select('tester_no,product_id,sample_id,remarks').eq('session_id',sid);
      if(fetched.error||!Array.isArray(fetched.data))return false;
      if(state!==st||identity(state)!==jury||
         String(state.config?._shareSessionId||state.config?.juryLaunch?.sessionId||'')!==sid)return false;
      let found=0;
      for(let no=1;no<=Number(cfg.testerCount);no++){
        const signature=closureSignatureRowV648(fetched.data,st,no);
        if(signature){
          signedClosureReceiptsV648.set(signedClosureKeyV648(st,no),signature);
          found++;
        }
      }
      if(found)paintClosureSignaturesV648(st);
      return found>0;
    })().catch(err=>{console.warn('Affichage des signatures de clôture différé',err);return false;})
      .finally(()=>pendingClosureRecoveryV648.delete(key));
    pendingClosureRecoveryV648.set(key,job);
    return job;
  }
  if(typeof module!=='undefined'&&module.exports){module.exports={read,attach,clear,html,list,receiptVerified,closureSignatureRowV648,sameClosureJuryV648};return;}
  window.testerSignaturesHtmlV393=html;
  window.testerSignaturesV393=list;
  window.recoverClosureSignaturesV648=recoverClosureSignaturesV648;
  if(typeof window.addEventListener==='function'){
    window.addEventListener('load',()=>recoverPendingReceipt().catch(e=>console.warn('Reprise des réponses différée',e)));
    window.addEventListener('online',()=>{
      if(pendingReceipt?.failure&&!pendingReceipt.inProgress)startReceiptDelivery(pendingReceipt);
    });
  }
  const original=validateTesterFinal;
  validateTesterFinal=function(no=currentTester){
    if(testerValidated(no)||testerMustWaitForLaunch()||isJuryClosed()||!totalSamples()||testerCompleted(no)!==totalSamples())return original(no);
    if(document.getElementById('testerSignatureDialog'))return;
    const jury=identity(state),tester=state.testers[no],dialog=document.createElement('dialog');dialog.id='testerSignatureDialog';
    dialog.style.cssText='border:0;border-radius:20px;padding:22px;width:min(94vw,620px);max-height:94vh;overflow:auto;color:#19384d';
    dialog.innerHTML='<h2>Signer et terminer mon test</h2><p>Je confirme avoir terminé ma dégustation. Ma signature sera reprise dans la fiche de clôture du jury.</p><p><strong>'+esc(tester.name||'Testeur '+no)+'</strong></p><canvas width="600" height="220" aria-label="Dessinez votre signature" style="width:100%;height:180px;border:2px solid #8aaab9;border-radius:12px;touch-action:none;background:white"></canvas><p role="status" data-message>Signez avec le doigt ou la souris.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-clear>Effacer</button><button type="button" data-cancel>Annuler</button><button type="button" data-sign>Signer et valider mon test</button></div>';
    const profile=document.createElement('div');profile.style.cssText='display:grid;gap:12px;margin:12px 0';
    profile.innerHTML='<label>Fonction<input data-sign-function type="text" maxlength="120" autocomplete="organization-title" required style="display:block;width:100%" placeholder="Ex. : chef de cuisine"></label><label>Établissement<input data-sign-establishment type="text" maxlength="200" autocomplete="organization" required style="display:block;width:100%" placeholder="Ex. : lycée Jean Moulin"></label>';
    dialog.querySelector('canvas').before(profile);
    document.body.appendChild(dialog);dialog.showModal();
    const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#2d5948';let drawing=false,length=0,last;
    const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*220/r.height};};
    canvas.onpointerdown=e=>{e.preventDefault();drawing=true;last=point(e);canvas.setPointerCapture(e.pointerId);ctx.beginPath();ctx.moveTo(last.x,last.y);};
    canvas.onpointermove=e=>{if(!drawing)return;const p=point(e);length+=Math.hypot(p.x-last.x,p.y-last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;};
    canvas.onpointerup=canvas.onpointercancel=()=>{drawing=false;};
    dialog.querySelector('[data-clear]').onclick=()=>{ctx.clearRect(0,0,600,220);length=0;};
    dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
    dialog.querySelector('[data-sign]').onclick=()=>{
      const message=dialog.querySelector('[data-message]'),functionInput=profile.querySelector('[data-sign-function]'),establishmentInput=profile.querySelector('[data-sign-establishment]');
      const functionName=functionInput.value.trim(),establishment=establishmentInput.value.trim();
      if(!functionName){message.textContent='Veuillez renseigner votre fonction.';functionInput.focus();return;}
      if(!establishment){message.textContent='Veuillez renseigner votre établissement.';establishmentInput.focus();return;}
      if(length<25){message.textContent='Veuillez dessiner votre signature avant de valider.';return;}
      if(identity(state)!==jury||state.testers[no]!==tester||isJuryClosed()||testerCompleted(no)!==totalSamples()){message.textContent='Le jury a changé. Fermez cette fenêtre et vérifiez votre test.';return;}
      const image=canvas.toDataURL('image/png');if(image.length>160000){message.textContent='Signature trop volumineuse. Effacez puis signez à nouveau.';return;}
      try{
        attach(state,no,{image,name:tester.name||'Testeur '+no,function:functionName,establishment,signedAt:new Date().toISOString()},QUESTIONS.length+2);
        pendingReceipt={no:Number(no),jury:identity(state),inProgress:false,failure:''};
        original(no);
        if(testerValidated(no)){
          dialog.close();
          try{
            pendingReceipt=buildReceipt(no);
            renderSample();
            startReceiptDelivery(pendingReceipt);
          }catch(error){
            pendingReceipt={no:Number(no),jury:identity(state),stamp:String(state.testers?.[no]?.validatedAt||''),
              inProgress:false,failure:String(error?.message||error)};
            renderSample();
          }
        }else{
          pendingReceipt=null;clear(state,no);
          message.textContent='Le test n’a pas été validé. Vérifiez vos réponses.';
        }
      }catch(e){
        pendingReceipt=null;
        message.textContent='Validation impossible : '+e.message;
      }
    };
  };window.validateTesterFinal=validateTesterFinal;
  const renderFinal=renderValidatedTesterFinal;
  renderValidatedTesterFinal=function(){
    const entering=!document.getElementById('testerThankYou');
    const result=renderFinal.apply(this,arguments);
    const panel=document.getElementById('validationPanel');
    if(panel&&pendingReceipt&&
       pendingReceipt.no===Number(currentTester)&&
       pendingReceipt.jury===identity(state)&&
       (!pendingReceipt.stamp||pendingReceipt.stamp===String(state.testers?.[currentTester]?.validatedAt||''))){
      showPendingReceipt(panel,pendingReceipt);
      return result;
    }
    const signed=read(state,currentTester);
    if(panel){
      panel.className='panel tester-thank-you';
      panel.innerHTML='<div id="testerThankYou" role="status" style="text-align:center;padding:36px 18px;line-height:1.6"><div aria-hidden="true" style="font-size:54px">👏</div><h2 style="font-size:30px;line-height:1.25;color:#176b48">Merci pour votre participation !</h2><p>'+ (signed?'Votre évaluation a bien été enregistrée et signée.':'Votre évaluation a bien été enregistrée.') +'</p><p>Votre avis contribue au choix des produits proposés au restaurant scolaire.</p><p><strong>Le jury vous remercie.</strong><br>Vous pouvez fermer cette page.</p><button type="button" class="btn btn-primary" id="closeTesterPageBtn" style="margin-top:18px;min-height:54px;padding:14px 28px">Fermer cette page</button><p id="closeTesterPageHelp" hidden style="font-size:16px"></p></div>';
    }
    const closeButton=document.getElementById('closeTesterPageBtn');
    if(closeButton)closeButton.onclick=()=>{
      try{window.close();}catch(e){}
      const help=document.getElementById('closeTesterPageHelp');
      if(help){help.hidden=false;help.textContent='Si cette page reste ouverte, fermez cet onglet dans votre navigateur. Votre évaluation reste enregistrée.';}
    };
    const hero=document.getElementById('sampleHero');if(hero)hero.style.display='none';
    if(entering)requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    return result;
  };
  scrollTesterToFinalScore=function(){requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));};
  const unlock=unlockTester;unlockTester=function(no){const before=testerValidated(no),result=unlock.apply(this,arguments);if(before&&!testerValidated(no)){clear(state,no);saveState();}return result;};
})();

