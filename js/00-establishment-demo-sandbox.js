/* Loaded before the real app only inside the establishment exercise iframe. */
(function(root){
  'use strict';
  function memoryStorage(initial,changed){
    const values=new Map(Object.entries(initial||{}).map(([k,v])=>[String(k),String(v)]));
    const target={};
    Object.defineProperties(target,{
      length:{configurable:true,get:()=>values.size},
      key:{configurable:true,value:n=>Array.from(values.keys())[Number(n)]??null},
      getItem:{configurable:true,value:k=>values.has(String(k))?values.get(String(k)):null},
      setItem:{configurable:true,value:(k,v)=>{k=String(k);v=String(v);if(values.get(k)===v)return;values.set(k,v);changed?.();}},
      removeItem:{configurable:true,value:k=>{if(values.delete(String(k)))changed?.();}},
      clear:{configurable:true,value:()=>{if(values.size){values.clear();changed?.();}}}
    });
    return new Proxy(target,{
      get:(t,k)=>k in t?Reflect.get(t,k):typeof k==='string'?values.get(k):undefined,
      set:(t,k,v)=>{t.setItem(k,v);return true;},
      ownKeys:()=>Array.from(values.keys()),
      getOwnPropertyDescriptor:(t,k)=>values.has(k)?{enumerable:true,configurable:true,value:values.get(k)}:Reflect.getOwnPropertyDescriptor(t,k)
    });
  }
  const KEYS=['jm_test_culinaire_param_v2','jm_test_culinaire_archives_v1','jm_test_culinaire_custom_templates_v1','jm_test_culinaire_market2026_personal_v1','jm_tc_prepared_jurys_v97','jm_test_culinaire_prepared_v97','jm_test_culinaire_sample_master_v1','jm_test_culinaire_sample_master_meta_v1','jm_test_culinaire_sample_products_v1','jm_test_culinaire_sample_lot_history_v178'];
  if(typeof module==='object'&&module.exports){module.exports={memoryStorage,KEYS};return;}
  const boot=root.__JURY_DEMO_BOOT;
  if(!boot||!['A','B'].includes(boot.school)||root.parent===root)return;
  let timer,dirty=false;
  const snapshot=()=>Object.fromEntries(KEYS.map(k=>[k,local.getItem(k)]).filter(([,v])=>v!==null));
  const send=()=>root.parent.postMessage({kind:'jury-demo-state',school:boot.school,nonce:boot.nonce,payload:snapshot()},boot.origin);
  const changed=()=>{clearTimeout(timer);timer=setTimeout(send,120);};
  const local=memoryStorage(boot.payload,changed),session=memoryStorage({},()=>{});
  Object.defineProperty(root,'localStorage',{value:local,configurable:false});
  Object.defineProperty(root,'sessionStorage',{value:session,configurable:false});
  root.__JURY_DEMO_ACTIVE=boot.school;
  root.fetch=()=>Promise.reject(new Error('Cet essai ne contacte pas les services des vrais jurys.'));
  root.WebSocket=function(){throw new Error('Partage en ligne désactivé dans cet essai.');};
  root.XMLHttpRequest=function(){throw new Error('Service en ligne désactivé dans cet essai.');};
  try{Object.defineProperty(navigator,'serviceWorker',{value:undefined});}catch(e){}
  try{navigator.sendBeacon=()=>false;}catch(e){}
  root.addEventListener('message',event=>{
    if(event.source!==root.parent||event.origin!==boot.origin||event.data?.nonce!==boot.nonce)return;
    if(event.data.kind==='jury-demo-flush'){
      const editing=document.querySelector('#sampleSetupView.active,#configView.active,#receptionView.active,#productSheetsView.active,#closureView.active');
      if(dirty&&editing){root.parent.postMessage({kind:'jury-demo-unsaved',school:boot.school,nonce:boot.nonce},boot.origin);return;}
      clearTimeout(timer);send();
    }
  });
  document.addEventListener('input',()=>{dirty=true;});
  document.addEventListener('change',()=>{dirty=true;});
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button');
    if(!button||!['sampleSetupContinueBtn','saveConfigBtn','receptionSaveBtn','saveProductSheetsBtn','saveClosureBtn'].includes(button.id))return;
    const before=JSON.stringify(snapshot());
    setTimeout(()=>{if(JSON.stringify(snapshot())!==before)dirty=false;},100);
  },true);
  document.addEventListener('DOMContentLoaded',()=>{
    const style=document.createElement('style');
    style.textContent='html body{padding-top:42px!important}#schoolExerciseBanner{position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#fff1d6;color:#62430c;padding:10px;text-align:center;font:700 14px system-ui}#ownerAccountBtnV385,#cloudBtn,#securityBtn,#installAppBtn{display:none!important}';
    document.head.appendChild(style);
    const banner=document.createElement('div');banner.id='schoolExerciseBanner';
    banner.textContent='ESSAI — Lycée test '+boot.school+' · données fictives';document.body.prepend(banner);
    const disable=()=>{
      for(const id of ['configPreparePhonesBtn','configQrBtn','configEmailQrPdfBtn','configEmailArticlesBtn','simpleResultsEmailBtn','officialLaunchBtn','launchCloudBtn','reportReadySendBtn']){
        const b=document.getElementById(id);if(b){b.disabled=true;b.title='Les QR codes, les envois et le lancement partagé ne font pas partie de cet essai.';}
      }
    };
    disable();setInterval(disable,800);
    root.parent.postMessage({kind:'jury-demo-mounted',school:boot.school,nonce:boot.nonce},boot.origin);
  });
})(typeof window==='undefined'?globalThis:window);
