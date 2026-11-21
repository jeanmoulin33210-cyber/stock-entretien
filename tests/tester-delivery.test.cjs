'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const core=require('../js/36-tester-signature.js');
const source=fs.readFileSync(path.join(__dirname,'../js/36-tester-signature.js'),'utf8');
const stamp='2026-11-21T06:56:40.000Z';
const signature='__TC_SIGNATURE_V393__:'+JSON.stringify({
  name:'Testeur 1',testerNo:1,jury:'jury-test',image:'data:image/png;base64,aGVsbG8=',signedAt:stamp
});
const expected={stamp,signature,answers:[{
  product_id:'p-1',sample_id:'22',choices:[2,2,4,4,4],
  remarks:['','','','','','','',signature]
}]};
const answer={product_id:'p-1',sample_id:'22',choices:[2,2,4,4,4],
  remarks:['','','','','','','',signature]};
const final={product_id:'__meta__',sample_id:'__validation__',remarks:[stamp]};
assert.equal(core.receiptVerified([answer,final],expected),true,'Only a complete signed server receipt passes');
assert.equal(core.receiptVerified([answer],expected),false,'Notes alone must not show thank-you');
assert.equal(core.receiptVerified([final],expected),false,'Validation alone must not show thank-you');
assert.equal(core.receiptVerified([{...answer,remarks:[]},final],expected),false,'Missing signature must block close');
assert.equal(core.receiptVerified([{...answer,choices:[1,2,3,4,5]},final],expected),false,'Mismatched notes must block close');
assert.equal(core.receiptVerified([answer,{...final,remarks:[null]}],expected),false,'Null validation must block close');

function mockTester(offline=false){
  const panel={innerHTML:'',className:'',querySelector(sel){
    return sel==='#retryTesterDeliveryV646'?this.retry:null;
  }};
  const fields={function:{value:'Chef de cuisine',focus(){}},
    establishment:{value:'Lycée Jean Moulin',focus(){}}};
  const message={textContent:''},buttons={clear:{},cancel:{},sign:{}};
  const profile={style:{},querySelector:sel=>sel.includes('function')?fields.function:fields.establishment};
  const canvas={getContext:()=>({beginPath(){},moveTo(){},lineTo(){},stroke(){},clearRect(){}}),
    getBoundingClientRect:()=>({left:0,top:0,width:600,height:220}),
    setPointerCapture(){},before(){},toDataURL:()=> 'data:image/png;base64,aGVsbG8='};
  const dialog={style:{},showModal(){},querySelector:sel=>sel==='canvas'?canvas:
    sel==='[data-message]'?message:buttons[sel.match(/data-(\w+)/)?.[1]],
    close(){this.closed=true;this.onclose?.()},remove(){}};
  const st={config:{juryInstanceId:'jury-test',
    products:[{id:'p-1',samples:[{id:'22'}]}],testerCount:1},
    testers:{1:{name:'Testeur 1',validatedAt:null,answers:{
      'p-1__22':{choices:[2,2,4,4,4],remarks:['','','','','','']}
    }}}};
  const server=[];
  const client={from:()=>({
    upsert(rows){
      if(offline)return Promise.resolve({error:{message:'Réseau indisponible'}});
      for(const r of rows){
        const i=server.findIndex(x=>x.product_id===r.product_id&&x.sample_id===r.sample_id);
        if(i>=0)server[i]=r;else server.push(r);
      }
      return Promise.resolve({error:null});
    },
    select(){
      return {eq(){return this;},then(onFulfilled,onRejected){
        return Promise.resolve({data:server,error:null}).then(onFulfilled,onRejected);
      }};
    }
  })};
  const ctx={
    window:{},state:st,currentTester:1,QUESTIONS:Array(5),
    document:{getElementById:id=>id==='validationPanel'?panel:null,
      createElement:tag=>tag==='dialog'?dialog:profile,
      body:{appendChild(){}}},
    validateTesterFinal:no=>{
      st.testers[no].validatedAt=stamp;ctx.renderSample();
    },
    testerValidated:no=>!!st.testers[no].validatedAt,
    testerMustWaitForLaunch:()=>false,isJuryClosed:()=>false,
    totalSamples:()=>1,testerCompleted:()=>1,
    renderValidatedTesterFinal(){},
    renderSample(){ctx.renderValidatedTesterFinal();},
    unlockTester(){},saveState(){},sampleKey:(p,s)=>p+'__'+s,
    cloudClient:client,cloudCfg:{sessionId:'session-123'},
    cloudRole:'tester',cloudTesterNo:1,cloudReady:true,cloudBusy:false,
    console,setTimeout,requestAnimationFrame:()=>{},navigator:{onLine:!offline},
    Date,URLSearchParams,location:{search:'?tester=1&session=session-123'}
  };
  vm.createContext(ctx);vm.runInContext(source,ctx);
  ctx.window.validateTesterFinal(1);
  canvas.onpointerdown({preventDefault(){},pointerId:1,clientX:10,clientY:20});
  canvas.onpointermove({clientX:130,clientY:40});
  canvas.onpointerup();buttons.sign.onclick();
  return {panel,dialog,server,ctx};
}
async function exercise(){
  const online=mockTester(false);
  assert.equal(online.dialog.closed,true,'Signature dialog closes after local validation');
  assert.match(online.panel.innerHTML,/Enregistrement en cours/);
  assert.doesNotMatch(online.panel.innerHTML,/Merci pour votre participation/,'Thank-you cannot precede server receipt');
  await new Promise(resolve=>setTimeout(resolve,15));
  assert.match(online.panel.innerHTML,/Merci pour votre participation/,'Thank-you follows verified server receipt');
  assert.ok(online.server.some(x=>x.sample_id==='__validation__'&&x.remarks[0]===stamp));
  assert.ok(online.server.some(x=>x.sample_id==='22'&&x.remarks.some(r=>typeof r==='string'&&r.startsWith('__TC_SIGNATURE_V393__:'))));

  const offline=mockTester(true);
  assert.match(offline.panel.innerHTML,/Enregistrement en cours/);
  await new Promise(resolve=>setTimeout(resolve,15));
  assert.match(offline.panel.innerHTML,/Enregistrement à confirmer/);
  assert.doesNotMatch(offline.panel.innerHTML,/Merci pour votre participation/);
  assert.doesNotMatch(offline.panel.innerHTML,/Fermer cette page/);
  assert.equal(offline.server.length,0,'Offline test must not invent a server receipt');
}
exercise().then(()=>console.log('PASS signed submission awaits server receipt and stays retryable offline'),err=>{console.error(err);process.exitCode=1;});
