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
  if(typeof module!=='undefined'&&module.exports){module.exports={read,attach,clear,html,list};return;}
  window.testerSignaturesHtmlV393=html;
  window.testerSignaturesV393=list;
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
    const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#16384b';let drawing=false,length=0,last;
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
      try{attach(state,no,{image,name:tester.name||'Testeur '+no,function:functionName,establishment,signedAt:new Date().toISOString()},QUESTIONS.length+2);original(no);if(testerValidated(no)){dialog.close();renderSample();}else{clear(state,no);message.textContent='Le test n’a pas été validé. Vérifiez vos réponses.';}}catch(e){message.textContent='Validation impossible : '+e.message;}
    };
  };window.validateTesterFinal=validateTesterFinal;
  const renderFinal=renderValidatedTesterFinal;
  renderValidatedTesterFinal=function(){
    const entering=!document.getElementById('testerThankYou');
    const result=renderFinal.apply(this,arguments);
    const panel=document.getElementById('validationPanel');
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

