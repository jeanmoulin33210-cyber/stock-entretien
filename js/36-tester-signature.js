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
  function list(st){
    const members=st.config?.closure?.members||[],numbers=new Set([...Object.keys(st.testers||{}),...members.map(m=>String(m.testerNo))]);
    return [...numbers].map(no=>{
      const member=members.find(m=>Number(m.testerNo)===Number(no))||{},signed=read(st,no);
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
    const sid=String(cloudCfg?.sessionId||new URLSearchParams(location.search).get('session')||'');
    if(!sid||!jury)throw Error('Session du jury introuvable : conservez cette page ouverte.');
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
  if(typeof module!=='undefined'&&module.exports){module.exports={read,attach,clear,html,list,receiptVerified};return;}
  window.testerSignaturesHtmlV393=html;
  window.testerSignaturesV393=list;
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
          pendingReceipt=buildReceipt(no);
          dialog.close();
          renderSample();
          startReceiptDelivery(pendingReceipt);
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
       pendingReceipt.stamp===String(state.testers?.[currentTester]?.validatedAt||'')){
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

